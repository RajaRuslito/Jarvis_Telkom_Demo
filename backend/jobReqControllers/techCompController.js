// Import required libraries and modules
const multer = require("multer"); // Middleware for handling file uploads
const pool = require('../db'); // Database connection pool for interacting with PostgreSQL
const upload = require("../middleware/multer"); // Custom file upload middleware
const xlsx = require("xlsx"); // Library for handling XLSX files (reading and writing)
const fs = require("fs"); // File system module for interacting with the file system
const path = require("path"); // Path module for working with file paths

// Function to create or update Job Performance Indicator (JPI)
async function createTC(req, res) {
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
        const checkQuery = `SELECT job_id FROM tc WHERE job_id = $1`;
        const existingJob = await pool.query(checkQuery, [job_id]);

        let operation;
        let result;

        if (existingJob.rows.length > 0) {
            // If the job_id exists, update the existing record
            const updateQuery = `
                UPDATE tc
                SET nama_job = $1, deskripsi = $2
                WHERE job_id = $3
                RETURNING *;
            `;
            result = await pool.query(updateQuery, [nama_job, deskripsi, job_id]);
            operation = "updated";
        } else {
            // If the job_id does not exist, insert a new record
            const insertQuery = `
                INSERT INTO tc (job_id, nama_job, deskripsi)
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
        // Check if a file was uploaded
        if (!req.file) {
            return res.status(400).json({ error: "No file uploaded" });
        }

        // Read the uploaded XLSX file
        const filePath = req.file.path;
        const workbook = xlsx.readFile(filePath);
        const sheetName = workbook.SheetNames[0];
        const data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

        let deletedCount = 0;
        let insertedCount = 0;

        // Extract unique job_ids from the data
        const jobIds = [...new Set(data.map(row => row.job_id))];

        // Check if any records need to be deleted before inserting new data
        for (const jobId of jobIds) {
            const checkQuery = `SELECT COUNT(*) FROM tc WHERE job_id = $1`;
            const { rows } = await pool.query(checkQuery, [jobId]);

            if (parseInt(rows[0].count) > 0) {
                // Delete existing records for this job_id
                const deleteQuery = `DELETE FROM tc WHERE job_id = $1 RETURNING *`;
                const deletedRows = await pool.query(deleteQuery, [jobId]);
                deletedCount += deletedRows.rowCount;
                console.log(`Deleted ${deletedRows.rowCount} entries for job_id: ${jobId}`);
            }
        }

        // Insert the new data from the XLSX file
        for (const row of data) {
            // Skip rows with missing required fields
            if (!row.job_id || !row.nama_job || !row.deskripsi) {
                console.error("Skipping row due to missing fields:", row);
                continue;
            }

            const insertQuery = `
                INSERT INTO tc (job_id, nama_job, deskripsi)
                VALUES ($1, $2, $3) RETURNING *;
            `;
            await pool.query(insertQuery, [row.job_id, row.nama_job, row.deskripsi]);
            insertedCount++;
        }

        // Delete the uploaded file after processing
        fs.unlinkSync(filePath);

        // Send response with the counts of deleted and inserted records
        res.status(201).json({
            message: "XLSX file uploaded and data processed successfully!",
            deleted: deletedCount,
            inserted: insertedCount
        });

    } catch (error) {
        // Handle errors and respond with status 500
        console.error("Error uploading XLSX:", error);
        res.status(500).json({ error: "An error occurred while processing the file" });
    }
}

// Function to download all JPI records as an XLSX file
async function downloadXLSX(req, res) {
    try {
        console.log("🔍 Checking tc table...");

        // Fetch data from the database
        const result = await pool.query("SELECT * FROM tc;");

        // Check if data exists in the database
        if (result.rows.length === 0) {
            console.warn("⚠️ No data found in tc table.");
            return res.status(404).json({ error: "No records found to export." });
        }

        console.log(`📝 Retrieved ${result.rows.length} records from tc`);

        // Convert data into a worksheet
        const worksheet = xlsx.utils.json_to_sheet(result.rows);
        const workbook = xlsx.utils.book_new();
        xlsx.utils.book_append_sheet(workbook, worksheet, "JobPerformanceIndicator");

        // Define file path for the generated XLSX file
        const filePath = path.join(__dirname, "../downloads/tc.xlsx");

        // Ensure the directory exists before writing the file
        if (!fs.existsSync(path.dirname(filePath))) {
            fs.mkdirSync(path.dirname(filePath), { recursive: true });
        }

        // Write the workbook to the file system
        xlsx.writeFile(workbook, filePath);
        console.log(`✅ XLSX file created at ${filePath}`);

        // Send the file for download
        res.download(filePath, "tc.xlsx", (err) => {
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
async function tcUpdate(req, res) {
    const obj_id = parseInt(req.params.obj_id, 10);
    const { nama_job, deskripsi } = req.body;

    try {
        // Perform the update operation on the database
        const result = await pool.query(
            `UPDATE tc 
             SET nama_job = $1, deskripsi = $2 
             WHERE obj_id = $3 RETURNING *`,
            [nama_job, deskripsi, obj_id]
        );

        // Check if the record was found and updated
        if (result.rows.length === 0) {
            res.status(404).json({ error: 'tc not found' });
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
async function getAllTC(req, res) {
    try {
        const result = await pool.query(`SELECT * FROM tc`);
        res.json(result.rows);
    } catch (error) {
        // Handle errors and respond with status 500
        console.error('Error getting Job Performance Index:', error);
        res.status(500).json({ error: 'Error getting Job Performance Index' });
    }
}

// Function to fetch a Job Performance Indicator by job_id
async function getTCById(req, res) {
    const { job_id } = req.params;
    try {
        const result = await pool.query(`SELECT * FROM tc WHERE job_id = $1`, [job_id]);
        if (result.rows.length === 0) {
            res.status(404).json({ error: 'Report not found' });
        } else {
            res.json(result.rows[0]);
        }
    } catch (error) {
        // Handle errors and respond with status 500
        console.error('Error getting tc by ID:', error);
        res.status(500).json({ error: 'Error getting tc by ID' });
    }
}

// Function to delete a Job Performance Indicator by obj_id
async function deleteTC(req, res) {
    const { obj_id } = req.params;

    try {
        const result = await pool.query(
            'DELETE FROM tc WHERE obj_id = $1 RETURNING *',
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
async function searchTC(req, res) {
    const { search } = req.query;

    try {
        const result = await pool.query(
            `SELECT * FROM tc WHERE 
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
    createTC,
    tcUpdate,
    getAllTC,
    getTCById,
    deleteTC,
    uploadXLSX,
    downloadXLSX,
    downloadTemplateXLSX,
    searchTC,
    upload
};
