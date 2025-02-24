// Required Libraries
const multer = require("multer");  // Library for handling file uploads
const pool = require('../db');  // Database connection pool
const upload = require("../middleware/multer");  // Multer middleware for handling file uploads
const xlsx = require("xlsx");  // Library for reading and writing Excel files
const fs = require("fs");  // File system module for handling file operations
const path = require("path");  // Path module for working with file paths

/**
 * Create or update job authorities (JobAuth) record in the database.
 * 
 * @param {Object} req - The request object, containing the job details.
 * @param {Object} res - The response object used to send responses back.
 */
async function createJA(req, res) {
    const job_id = parseInt(req.body.job_id, 10);
    const { nama_job, deskripsi } = req.body;

    // Check if any required fields are missing
    if (!job_id || !nama_job || !deskripsi) {
        console.error("Missing Fields:", { job_id, nama_job, deskripsi });
        return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    try {
        // Check if the job_id already exists in the database
        const checkQuery = `SELECT job_id FROM job_auth WHERE job_id = $1`;
        const existingJob = await pool.query(checkQuery, [job_id]);

        let operation;
        let result;

        if (existingJob.rows.length > 0) {
            // Update the existing job record
            const updateQuery = `
                UPDATE job_auth
                SET nama_job = $1, deskripsi = $2
                WHERE job_id = $3
                RETURNING *;
            `;
            result = await pool.query(updateQuery, [nama_job, deskripsi, job_id]);
            operation = "updated";
        } else {
            // Insert a new job record
            const insertQuery = `
                INSERT INTO job_auth (job_id, nama_job, deskripsi)
                VALUES ($1, $2, $3)
                RETURNING *;
            `;
            result = await pool.query(insertQuery, [job_id, nama_job, deskripsi]);
            operation = "created";
        }

        console.log(`✅ Job Authorities ${operation} for job_id: ${job_id}`);
        res.status(201).json({
            success: true,
            message: `Job Authorities ${operation} successfully`,
            data: result.rows[0],
        });

    } catch (error) {
        console.error("Error creating Job Authorities:", error.message);
        res.status(500).json({ success: false, message: error.message });
    }
}

/**
 * Upload an XLSX file and process data based on mode (update or overwrite).
 * 
 * @param {Object} req - The request object containing the uploaded file and mode.
 * @param {Object} res - The response object used to send responses back.
 */
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
            const deleteQuery = `DELETE FROM job_auth RETURNING *;`;
            const deleteResult = await pool.query(deleteQuery);
            deletedCount = deleteResult.rowCount;
            console.log(`🗑️ Deleted ${deletedCount} existing job_auth records.`);
        }

        const jobIds = [...new Set(data.map(row => row.job_id).filter(job_id => job_id))];

        if (jobIds.length === 0) {
            fs.unlinkSync(filePath);
            return res.status(400).json({ error: "No valid job_id found in the file." });
        }

        if (mode === "update") {
            // Fetch existing job_auth records in bulk
            const placeholders = jobIds.map((_, i) => `$${i + 1}`).join(", ");
            const existingRecordsQuery = `SELECT * FROM job_auth WHERE job_id IN (${placeholders})`;
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
                            UPDATE job_auth 
                            SET nama_job = $1, deskripsi = $2
                            WHERE job_id = $3 RETURNING *;
                        `;
                        await pool.query(updateQuery, [row.nama_job, row.deskripsi, row.job_id]);
                        updatedCount++;
                    }
                } else {
                    // Insert new record
                    const insertQuery = `
                        INSERT INTO job_auth (job_id, nama_job, deskripsi)
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
                    INSERT INTO job_auth (job_id, nama_job, deskripsi)
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
 * Check for conflicts in the uploaded XLSX file before inserting/updating job_auth data.
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

        // Fetch all existing job_auth records with matching job_ids
        const placeholders = uniqueJobIds.map((_, i) => `$${i + 1}`).join(", ");
        const query = `SELECT * FROM job_auth WHERE job_id IN (${placeholders})`;
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



/**
 * Download the job_auth table data as an XLSX file.
 * 
 * @param {Object} req - The request object.
 * @param {Object} res - The response object used to send the file for download.
 */
async function downloadXLSX(req, res) {
    try {
        console.log("🔍 Checking job_auth table...");

        // Fetch data from the database
        const result = await pool.query("SELECT * FROM job_auth;");

        if (result.rows.length === 0) {
            console.warn("⚠️ No data found in job_auth table.");
            return res.status(404).json({ error: "No records found to export." });
        }

        console.log(`📝 Retrieved ${result.rows.length} records from job_auth`);

        // Convert data into worksheet
        const worksheet = xlsx.utils.json_to_sheet(result.rows);
        const workbook = xlsx.utils.book_new();
        xlsx.utils.book_append_sheet(workbook, worksheet, "JobAuthorities");

        // Define file path
        const filePath = path.join(__dirname, "../downloads/job_authorities.xlsx");

        // Ensure the downloads directory exists
        if (!fs.existsSync(path.dirname(filePath))) {
            fs.mkdirSync(path.dirname(filePath), { recursive: true });
        }

        // Write file to the server
        xlsx.writeFile(workbook, filePath);
        console.log(`✅ XLSX file created at ${filePath}`);

        // Send the file for download
        res.download(filePath, "job_authorities.xlsx", (err) => {
            if (err) {
                console.error("Error sending file:", err);
                res.status(500).json({ error: "Error downloading the file" });
            } else {
                console.log("✅ File download initiated successfully.");
            }
        });

    } catch (error) {
        console.error("❌ Error downloading XLSX:", error);
        res.status(500).json({ error: "An error occurred while generating the file" });
    }
}

/**
 * Update job authorities by obj_id.
 * 
 * @param {Object} req - The request object, containing the job ID and data to update.
 * @param {Object} res - The response object used to send responses back.
 */
async function jaUpdate(req, res) {
    const obj_id = parseInt(req.params.obj_id, 10);
    const { nama_job, deskripsi } = req.body;

    if (!obj_id || !nama_job || !deskripsi) {
        console.error("Missing Fields:", { obj_id, nama_job, deskripsi });
        return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    try {
        const result = await pool.query(
            `UPDATE job_auth 
             SET nama_job = $1, deskripsi = $2 
             WHERE obj_id = $3 RETURNING *`,
            [nama_job, deskripsi, obj_id]
        );
        if (result.rows.length === 0) {
            res.status(404).json({ error: 'job_auth not found' });
        } else {
            res.json(result.rows[0]);
        }
    } catch (error) {
        console.error('Error updating job_auth:', error);
        res.status(500).json({ error: 'Error updating job_auth' });
    }
}

/**
 * Retrieve all job authorities records.
 * 
 * @param {Object} req - The request object.
 * @param {Object} res - The response object used to send the records back.
 */
async function getAllJA(req, res) {
    try {
        const result = await pool.query(`SELECT * FROM job_auth`);
        res.json(result.rows);
    } catch (error) {
        console.error('Error getting Job Authorities:', error);
        res.status(500).json({ error: 'Error getting Job Authorities' });
    }
}

/**
 * Retrieve job authorities record by job_id.
 * 
 * @param {Object} req - The request object containing job_id as parameter.
 * @param {Object} res - The response object used to send the record back.
 */
async function getJAById(req, res) {
    const { job_id } = req.params;
    try {
        const result = await pool.query(`SELECT * FROM job_auth WHERE job_id = $1`, [job_id]);
        if (result.rows.length === 0) {
            res.status(404).json({ error: 'Report not found' });
        } else {
            res.json(result.rows[0]);
        }
    } catch (error) {
        console.error('Error getting report by ID:', error);
        res.status(500).json({ error: 'Error getting report by ID' });
    }
}

/**
 * Delete job authorities record by job_id.
 * 
 * @param {Object} req - The request object containing job_id as parameter.
 * @param {Object} res - The response object used to send success or error response.
 */
async function deleteJA(req, res) {
    const { job_id } = req.params;

    try {
        const result = await pool.query(
            'DELETE FROM job_auth WHERE job_id = $1 RETURNING *',
            [job_id]
        );
        if (result.rows.length === 0) {
            res.status(404).json({ error: 'Job Authorities not found' });
        } else {
            res.json({ message: 'Job Authorities deleted successfully' });
        }
    } catch (error) {
        console.error('Error deleting Job Authorities:', error);
        res.status(500).json({ error: 'Error deleting Job Authorities' });
    }
}

/**
 * Download an empty template XLSX file for job authorities.
 * 
 * @param {Object} req - The request object.
 * @param {Object} res - The response object used to send the template file for download.
 */
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
        const filePath = path.join(__dirname, "../downloads/job_authorities_template.xlsx");

        // Ensure the downloads directory exists
        if (!fs.existsSync(path.dirname(filePath))) {
            fs.mkdirSync(path.dirname(filePath), { recursive: true });
        }

        // Write the workbook to the server file system
        xlsx.writeFile(workbook, filePath);
        console.log(`✅ Template XLSX file created at ${filePath}`);

        // Send the file for download
        res.download(filePath, "job_authorities_template.xlsx", (err) => {
            if (err) {
                console.error("Error sending file:", err);
                res.status(500).json({ error: "Error downloading the template" });
            } else {
                console.log("✅ Template file download initiated successfully.");
            }
        });
    } catch (error) {
        console.error("❌ Error downloading template XLSX:", error);
        res.status(500).json({ error: "An error occurred while generating the template" });
    }
}

/**
 * Search for job authorities records based on a query string.
 * 
 * @param {Object} req - The request object containing the search query.
 * @param {Object} res - The response object used to send the matching records back.
 */
async function searchJA(req, res) {
    const { search } = req.query;

    try {
        const result = await pool.query(
            `SELECT * FROM job_auth WHERE 
            CAST(job_id AS TEXT) ILIKE $1 OR 
            nama_job ILIKE $1 OR 
            deskripsi ILIKE $1`,
            [`%${search}%`]
        );

        if (result.rows.length === 0) {
            res.status(404).json({ error: 'No matching Job Authorities found' });
        } else {
            res.json(result.rows);
        }
    } catch (error) {
        console.error('Error fetching Job Authorities:', error);
        res.status(500).json({ error: 'Error fetching Job Authorities' });
    }
}

async function alterJA(req, res) {
    const { obj_id } = req.params; // Extract job_id from request parameters

    try {
        // Update the status to 'Non-Active' where job_id matches
        const result = await pool.query(
            'UPDATE job_auth SET status = $1 WHERE obj_id = $2 RETURNING *',
            ['Non-Active', obj_id]
        );

        if (result.rows.length === 0) {
            // If no rows were updated, the job_id doesn't exist
            res.status(404).json({ error: 'Job not found' });
        } else {
            // Successfully updated
            res.json({ message: 'Job status updated to Non-Active', job: result.rows[0] });
        }
    } catch (error) {
        console.error('Error updating job status:', error);
        res.status(500).json({ error: 'Error updating job status' });
    }
}

module.exports = {
    createJA,
    jaUpdate,
    getAllJA,
    getJAById,
    deleteJA,
    uploadXLSX,
    downloadXLSX,
    downloadTemplateXLSX,
    searchJA,
    checkConflictXLSX,
    alterJA,
    upload
};
