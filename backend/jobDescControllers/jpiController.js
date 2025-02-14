// Import required libraries and modules
const multer = require("multer"); // Middleware for handling file uploads
const pool = require('../db'); // Database connection pool for interacting with PostgreSQL
const upload = require("../middleware/multer"); // Custom file upload middleware
const xlsx = require("xlsx"); // Library for handling XLSX files (reading and writing)
const fs = require("fs"); // File system module for interacting with the file system
const path = require("path"); // Path module for working with file paths

// Function to create or update Job Performance Indicator (JPI)
async function createJPI(req, res) {
    // Extract job_id, nama_job, and deskripsi from the request body
    const job_id = parseInt(req.body.job_id, 10);
    const { nama_job, deskripsi } = req.body;

    // Check if any required fields are missing
    if (!job_id || !nama_job || !deskripsi) {
        console.error("Missing Fields:", { job_id, nama_job, deskripsi });
        return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    try {
        // Check if job_id already exists in the database
        const checkQuery = `SELECT job_id FROM job_pi WHERE job_id = $1`;
        const existingJob = await pool.query(checkQuery, [job_id]);

        let operation;
        let result;

        if (existingJob.rows.length > 0) {
            // If the job_id exists, update the existing record
            const updateQuery = `
                UPDATE job_pi
                SET nama_job = $1, deskripsi = $2
                WHERE job_id = $3
                RETURNING *;
            `;
            result = await pool.query(updateQuery, [nama_job, deskripsi, job_id]);
            operation = "updated";
        } else {
            // If the job_id does not exist, insert a new record
            const insertQuery = `
                INSERT INTO job_pi (job_id, nama_job, deskripsi)
                VALUES ($1, $2, $3)
                RETURNING *;
            `;
            result = await pool.query(insertQuery, [job_id, nama_job, deskripsi]);
            operation = "created";
        }

        // Log success message and send response with created/updated data
        console.log(`✅ Job Performance Indicator ${operation} for job_id: ${job_id}`);
        res.status(201).json({
            success: true,
            message: `Job Performance Indicator ${operation} successfully`,
            data: result.rows[0],
        });

    } catch (error) {
        // Handle errors and respond with status 500
        console.error("Error creating Job Performance Indicator:", error.message);
        res.status(500).json({ success: false, message: error.message });
    }
}

// Function to upload and process XLSX file
async function uploadXLSX(req, res) {
    try {
        if (!req.file) {
            return res.status(400).json({ error: "No file uploaded" });
        }

        const mode = req.query.mode; // Default mode is 'update' || "update"
        const filePath = req.file.path;
        const workbook = xlsx.readFile(filePath);
        const sheetName = workbook.SheetNames[0];
        const data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

        if (data.length === 0) {
            fs.unlinkSync(filePath);
            return res.status(400).json({ error: "The uploaded file is empty" });
        }

        let deletedCount = 0;
        let insertedCount = 0;
        let updatedCount = 0;

        if (mode === "overwrite") {
            // Delete all existing records before inserting new data
            const deleteQuery = `DELETE FROM job_pi RETURNING *;`;
            const deleteResult = await pool.query(deleteQuery);
            deletedCount = deleteResult.rowCount;
            console.log(`🗑️ Deleted ${deletedCount} existing job_pi records.`);
        }

        const jobIds = [...new Set(data.map(row => row.job_id).filter(job_id => job_id))];

        if (jobIds.length === 0) {
            fs.unlinkSync(filePath);
            return res.status(400).json({ error: "No valid job_id found in the file." });
        }

        if (mode === "update") {
            // Fetch existing job_pi records in bulk
            const placeholders = jobIds.map((_, i) => `$${i + 1}`).join(", ");
            const existingRecordsQuery = `SELECT * FROM job_pi WHERE job_id IN (${placeholders})`;
            const existingRecordsResult = await pool.query(existingRecordsQuery, jobIds);

            // Convert existing records into a map for quick lookup
            const existingRecordsMap = new Map();
            existingRecordsResult.rows.forEach(record => {
                existingRecordsMap.set(record.job_id, record);
            });

            for (const row of data) {
                if (!row.job_id || !row.nama_job || !row.deskripsi) {
                    console.error("Skipping row due to missing fields:", row);
                    continue;
                }

                const existingRecord = existingRecordsMap.get(row.job_id);

                if (existingRecord) {
                    if (
                        existingRecord.nama_job !== row.nama_job ||
                        existingRecord.deskripsi !== row.deskripsi
                    ) {
                        // Update existing record
                        const updateQuery = `
                            UPDATE job_pi 
                            SET nama_job = $1, deskripsi = $2
                            WHERE job_id = $3 RETURNING *;
                        `;
                        await pool.query(updateQuery, [row.nama_job, row.deskripsi, row.job_id]);
                        updatedCount++;
                    }
                } else {
                    // Insert new record
                    const insertQuery = `
                        INSERT INTO job_pi (job_id, nama_job, deskripsi)
                        VALUES ($1, $2, $3) RETURNING *;
                    `;
                    await pool.query(insertQuery, [row.job_id, row.nama_job, row.deskripsi]);
                    insertedCount++;
                }
            }
        } else if (mode === "overwrite") {
            // Directly insert all records from the uploaded file
            for (const row of data) {
                if (!row.job_id || !row.nama_job || !row.deskripsi) {
                    console.error("Skipping row due to missing fields:", row);
                    continue;
                }

                const insertQuery = `
                    INSERT INTO job_pi (job_id, nama_job, deskripsi)
                    VALUES ($1, $2, $3) RETURNING *;
                `;
                await pool.query(insertQuery, [row.job_id, row.nama_job, row.deskripsi]);
                insertedCount++;
            }
        }

        fs.unlinkSync(filePath); // Delete the uploaded file after processing

        res.status(201).json({
            message: "XLSX file uploaded and data processed successfully!",
            mode,
            inserted: insertedCount,
            updated: updatedCount,
            deleted: deletedCount,
        });

    } catch (error) {
        console.error("Error uploading XLSX:", error);
        res.status(500).json({ error: "An error occurred while processing the file" });
    }
}

/**
 * Check for conflicts in the uploaded XLSX file before inserting/updating job_pi data.
 * 
 * @param {Object} req - The request object, containing the uploaded file.
 * @param {Object} res - The response object used to send conflict details.
 */
async function checkConflictXLSX(req, res) {
    try {
        if (!req.file) {
            return res.status(400).json({ error: "No file uploaded" });
        }

        const filePath = req.file.path;
        const workbook = xlsx.readFile(filePath);
        const sheetName = workbook.SheetNames[0];
        const data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

        if (data.length === 0) {
            fs.unlinkSync(filePath); // Delete file after processing
            return res.status(400).json({ error: "The uploaded file is empty" });
        }

        const jobIds = data.map(row => row.job_id).filter(job_id => job_id); // Extract job_ids, removing any undefined/null
        const uniqueJobIds = [...new Set(jobIds)]; // Ensure uniqueness

        if (uniqueJobIds.length === 0) {
            fs.unlinkSync(filePath);
            return res.status(400).json({ error: "No valid job_id found in the file." });
        }

        // Fetch all existing job_pi records with matching job_ids
        const placeholders = uniqueJobIds.map((_, i) => `$${i + 1}`).join(", ");
        const query = `SELECT * FROM job_pi WHERE job_id IN (${placeholders})`;
        const existingRecords = await pool.query(query, uniqueJobIds);

        let conflicts = [];
        let conflictingJobIds = []; // Store job_ids that have conflicts
        let totalConflicts = 0;

        data.forEach(row => {
            if (!row.job_id || !row.nama_job || !row.deskripsi) {
                console.warn("Skipping row due to missing fields:", row);
                return;
            }

            const existingRecord = existingRecords.rows.find(record => record.job_id === row.job_id);
            if (existingRecord) {
                // Check if the new data is different from the existing data
                if (
                    existingRecord.nama_job !== row.nama_job ||
                    existingRecord.deskripsi !== row.deskripsi
                ) {
                    totalConflicts++;
                    conflicts.push({
                        job_id: row.job_id,
                        existing: existingRecord,
                        new: row
                    });

                    if (!conflictingJobIds.includes(row.job_id)) {
                        conflictingJobIds.push(row.job_id);
                    }
                }
            }
        });

        fs.unlinkSync(filePath); // Delete file after processing

        if (totalConflicts === 0) {
            return res.status(200).json({ hasConflict: false, message: "No conflicts detected." });
        } else {
            return res.status(200).json({
                hasConflict: true,
                totalConflicts,
                conflictingJobIds, // List of job_ids that have conflicts
                conflicts, // Detailed conflict information
                message: `${totalConflicts} conflicts detected.`,
            });
        }
    } catch (error) {
        console.error("Error checking conflicts:", error);
        res.status(500).json({ error: "An error occurred while checking conflicts" });
    }
}

// Function to download all JPI records as an XLSX file
async function downloadXLSX(req, res) {
    try {
        console.log("🔍 Checking job_pi table...");

        // Fetch data from the database
        const result = await pool.query("SELECT * FROM job_pi;");

        // Check if data exists in the database
        if (result.rows.length === 0) {
            console.warn("⚠️ No data found in job_pi table.");
            return res.status(404).json({ error: "No records found to export." });
        }

        console.log(`📝 Retrieved ${result.rows.length} records from job_pi`);

        // Convert data into a worksheet
        const worksheet = xlsx.utils.json_to_sheet(result.rows);
        const workbook = xlsx.utils.book_new();
        xlsx.utils.book_append_sheet(workbook, worksheet, "JobPerformanceIndicator");

        // Define file path for the generated XLSX file
        const filePath = path.join(__dirname, "../downloads/job_pi.xlsx");

        // Ensure the directory exists before writing the file
        if (!fs.existsSync(path.dirname(filePath))) {
            fs.mkdirSync(path.dirname(filePath), { recursive: true });
        }

        // Write the workbook to the file system
        xlsx.writeFile(workbook, filePath);
        console.log(`✅ XLSX file created at ${filePath}`);

        // Send the file for download
        res.download(filePath, "job_pi.xlsx", (err) => {
            if (err) {
                console.error("Error sending file:", err);
                res.status(500).json({ error: "Error downloading the file" });
            } else {
                console.log("✅ File download initiated successfully.");
            }
        });

    } catch (error) {
        // Handle errors and respond with status 500
        console.error("❌ Error downloading XLSX:", error);
        res.status(500).json({ error: "An error occurred while generating the file" });
    }
}

// Function to update a Job Performance Indicator (JPI) by obj_id
async function jpiUpdate(req, res) {
    const obj_id = parseInt(req.params.obj_id, 10);
    const { nama_job, deskripsi } = req.body;

    try {
        // Perform the update operation on the database
        const result = await pool.query(
            `UPDATE job_pi 
             SET nama_job = $1, deskripsi = $2 
             WHERE obj_id = $3 RETURNING *`,
            [nama_job, deskripsi, obj_id]
        );

        // Check if the record was found and updated
        if (result.rows.length === 0) {
            res.status(404).json({ error: 'job_pi not found' });
        } else {
            res.json(result.rows[0]);
        }
    } catch (error) {
        // Handle errors and respond with status 500
        console.error('Error updating Job Performance Index:', error);
        res.status(500).json({ error: 'Error updating Job Performance Index' });
    }
}

// Function to fetch all Job Performance Indicators (JPIs)
async function getAllJPI(req, res) {
    try {
        const result = await pool.query(`SELECT * FROM job_pi`);
        res.json(result.rows);
    } catch (error) {
        // Handle errors and respond with status 500
        console.error('Error getting Job Performance Index:', error);
        res.status(500).json({ error: 'Error getting Job Performance Index' });
    }
}

// Function to fetch a Job Performance Indicator by job_id
async function getJPIById(req, res) {
    const { job_id } = req.params;
    try {
        const result = await pool.query(`SELECT * FROM job_pi WHERE job_id = $1`, [job_id]);
        if (result.rows.length === 0) {
            res.status(404).json({ error: 'Report not found' });
        } else {
            res.json(result.rows[0]);
        }
    } catch (error) {
        // Handle errors and respond with status 500
        console.error('Error getting job_pi by ID:', error);
        res.status(500).json({ error: 'Error getting job_pi by ID' });
    }
}

// Function to delete a Job Performance Indicator by obj_id
async function deleteJPI(req, res) {
    const { obj_id } = req.params;

    try {
        const result = await pool.query(
            'DELETE FROM job_pi WHERE obj_id = $1 RETURNING *',
            [obj_id]
        );
        if (result.rows.length === 0) {
            res.status(404).json({ error: 'Job Performance Index not found' });
        } else {
            res.json({ message: 'Job Performance Index deleted successfully' });
        }
    } catch (error) {
        // Handle errors and respond with status 500
        console.error('Error deleting Job Performance Index:', error);
        res.status(500).json({ error: 'Error deleting Job Performance Index' });
    }
}

// Function to search Job Performance Indicators by search query
async function searchJPI(req, res) {
    const { search } = req.query;

    try {
        const result = await pool.query(
            `SELECT * FROM job_pi WHERE 
            CAST(job_id AS TEXT) ILIKE $1 OR 
            nama_job ILIKE $1 OR 
            deskripsi ILIKE $1`,
            [`%${search}%`]
        );

        if (result.rows.length === 0) {
            res.status(404).json({ error: 'No matching Job Performance Index found' });
        } else {
            res.json(result.rows);
        }
    } catch (error) {
        // Handle errors and respond with status 500
        console.error('Error fetching Job Performance Index:', error);
        res.status(500).json({ error: 'Error fetching Job Performance Index' });
    }
}

// Function to download an XLSX template for Job Performance Indicator uploads
async function downloadTemplateXLSX(req, res) {
    try {
        // Define the template data (columns without content)
        const templateData = [
            { job_id: '', nama_job: '', deskripsi: '' }
        ];

        // Convert the template data into a worksheet
        const worksheet = xlsx.utils.json_to_sheet(templateData);
        const workbook = xlsx.utils.book_new();
        xlsx.utils.book_append_sheet(workbook, worksheet, "Template");

        // Define file path for the template
        const filePath = path.join(__dirname, "../downloads/job_performance_indicator_template.xlsx");

        // Ensure the downloads directory exists
        if (!fs.existsSync(path.dirname(filePath))) {
            fs.mkdirSync(path.dirname(filePath), { recursive: true });
        }

        // Write the workbook to the server file system
        xlsx.writeFile(workbook, filePath);
        console.log(`✅ Template XLSX file created at ${filePath}`);

        // Send the template file for download
        res.download(filePath, "job_performance_indicator_template.xlsx", (err) => {
            if (err) {
                console.error("Error sending file:", err);
                res.status(500).json({ error: "Error downloading the template" });
            } else {
                console.log("✅ Template file download initiated successfully.");
            }
        });
    } catch (error) {
        // Handle errors and respond with status 500
        console.error("❌ Error downloading template XLSX:", error);
        res.status(500).json({ error: "An error occurred while generating the template" });
    }
}

// Export all functions for use in other modules
module.exports = {
    createJPI,
    jpiUpdate,
    getAllJPI,
    getJPIById,
    deleteJPI,
    uploadXLSX,
    downloadXLSX,
    downloadTemplateXLSX,
    searchJPI,
    checkConflictXLSX,
    upload
};
