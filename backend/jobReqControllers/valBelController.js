// Required Libraries
const multer = require("multer");  // Library for handling file uploads
const pool = require('../db');  // Database connection pool
const upload = require("../middleware/multer");  // Multer middleware for handling file uploads
const xlsx = require("xlsx");  // Library for reading and writing Excel files
const fs = require("fs");  // File system module for handling file operations
const path = require("path");  // Path module for working with file paths

/**
 * Create or update Value and Beliefs (JobAuth) record in the database.
 * 
 * @param {Object} req - The request object, containing the job details.
 * @param {Object} res - The response object used to send responses back.
 */
async function createVB(req, res) {
    const job_id = parseInt(req.body.job_id, 10);
    const { nama_job, deskripsi } = req.body;

    // Check if any required fields are missing
    if (!job_id || !nama_job || !deskripsi) {
        console.error("Missing Fields:", { job_id, nama_job, deskripsi });
        return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    try {
        // Check if the job_id already exists in the database
        const checkQuery = `SELECT job_id FROM val_bel WHERE job_id = $1`;
        const existingJob = await pool.query(checkQuery, [job_id]);

        let operation;
        let result;

        if (existingJob.rows.length > 0) {
            // Update the existing job record
            const updateQuery = `
                UPDATE val_bel
                SET nama_job = $1, deskripsi = $2
                WHERE job_id = $3
                RETURNING *;
            `;
            result = await pool.query(updateQuery, [nama_job, deskripsi, job_id]);
            operation = "updated";
        } else {
            // Insert a new job record
            const insertQuery = `
                INSERT INTO val_bel (job_id, nama_job, deskripsi)
                VALUES ($1, $2, $3)
                RETURNING *;
            `;
            result = await pool.query(insertQuery, [job_id, nama_job, deskripsi]);
            operation = "created";
        }

        console.log(`✅ Value and Beliefs ${operation} for job_id: ${job_id}`);
        res.status(201).json({
            success: true,
            message: `Value and Beliefs ${operation} successfully`,
            data: result.rows[0],
        });

    } catch (error) {
        console.error("Error creating Value and Beliefs:", error.message);
        res.status(500).json({ success: false, message: error.message });
    }
}

/**
 * Upload an XLSX file and insert data into the val_bel table.
 * 
 * @param {Object} req - The request object, containing the uploaded file.
 * @param {Object} res - The response object used to send responses back.
 */
async function uploadXLSX(req, res) {
    try {
        if (!req.file) {
            return res.status(400).json({ error: "No file uploaded" });
        }

        const filePath = req.file.path;
        const workbook = xlsx.readFile(filePath);
        const sheetName = workbook.SheetNames[0];
        const data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

        let deletedCount = 0;
        let insertedCount = 0;

        const jobIds = [...new Set(data.map(row => row.job_id))]; // Extract unique job_ids

        for (const jobId of jobIds) {
            // Check if job_id exists
            const checkQuery = `SELECT COUNT(*) FROM val_bel WHERE job_id = $1`;
            const { rows } = await pool.query(checkQuery, [jobId]);

            if (parseInt(rows[0].count) > 0) {
                // Delete all existing entries for this job_id
                const deleteQuery = `DELETE FROM val_bel WHERE job_id = $1 RETURNING *`;
                const deletedRows = await pool.query(deleteQuery, [jobId]);
                deletedCount += deletedRows.rowCount;
                console.log(`Deleted ${deletedRows.rowCount} entries for job_id: ${jobId}`);
            }
        }

        // Insert new batch of data
        for (const row of data) {
            if (!row.job_id || !row.nama_job || !row.deskripsi) {
                console.error("Skipping row due to missing fields:", row);
                continue;
            }

            const insertQuery = `
                INSERT INTO val_bel (job_id, nama_job, deskripsi)
                VALUES ($1, $2, $3) RETURNING *;
            `;
            await pool.query(insertQuery, [row.job_id, row.nama_job, row.deskripsi]);
            insertedCount++;
        }

        // Delete the uploaded file after processing
        fs.unlinkSync(filePath);

        res.status(201).json({
            message: "XLSX file uploaded and data processed successfully!",
            deleted: deletedCount,
            inserted: insertedCount
        });

    } catch (error) {
        console.error("Error uploading XLSX:", error);
        res.status(500).json({ error: "An error occurred while processing the file" });
    }
}

/**
 * Download the val_bel table data as an XLSX file.
 * 
 * @param {Object} req - The request object.
 * @param {Object} res - The response object used to send the file for download.
 */
async function downloadXLSX(req, res) {
    try {
        console.log("🔍 Checking val_bel table...");

        // Fetch data from the database
        const result = await pool.query("SELECT * FROM val_bel;");

        if (result.rows.length === 0) {
            console.warn("⚠️ No data found in val_bel table.");
            return res.status(404).json({ error: "No records found to export." });
        }

        console.log(`📝 Retrieved ${result.rows.length} records from val_bel`);

        // Convert data into worksheet
        const worksheet = xlsx.utils.json_to_sheet(result.rows);
        const workbook = xlsx.utils.book_new();
        xlsx.utils.book_append_sheet(workbook, worksheet, "ValueBeliefs");

        // Define file path
        const filePath = path.join(__dirname, "../downloads/val_bel.xlsx");

        // Ensure the downloads directory exists
        if (!fs.existsSync(path.dirname(filePath))) {
            fs.mkdirSync(path.dirname(filePath), { recursive: true });
        }

        // Write file to the server
        xlsx.writeFile(workbook, filePath);
        console.log(`✅ XLSX file created at ${filePath}`);

        // Send the file for download
        res.download(filePath, "val_bel.xlsx", (err) => {
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
 * Update Value and Beliefs by obj_id.
 * 
 * @param {Object} req - The request object, containing the job ID and data to update.
 * @param {Object} res - The response object used to send responses back.
 */
async function vbUpdate(req, res) {
    const obj_id = parseInt(req.params.obj_id, 10);
    const { nama_job, deskripsi } = req.body;

    if (!obj_id || !nama_job || !deskripsi) {
        console.error("Missing Fields:", { obj_id, nama_job, deskripsi });
        return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    try {
        const result = await pool.query(
            `UPDATE val_bel 
             SET nama_job = $1, deskripsi = $2 
             WHERE obj_id = $3 RETURNING *`,
            [nama_job, deskripsi, obj_id]
        );
        if (result.rows.length === 0) {
            res.status(404).json({ error: 'val_bel not found' });
        } else {
            res.json(result.rows[0]);
        }
    } catch (error) {
        console.error('Error updating val_bel:', error);
        res.status(500).json({ error: 'Error updating val_bel' });
    }
}

/**
 * Retrieve all Value and Beliefs records.
 * 
 * @param {Object} req - The request object.
 * @param {Object} res - The response object used to send the records back.
 */
async function getAllVB(req, res) {
    try {
        const result = await pool.query(`SELECT * FROM val_bel`);
        res.json(result.rows);
    } catch (error) {
        console.error('Error getting Value and Beliefs:', error);
        res.status(500).json({ error: 'Error getting Value and Beliefs' });
    }
}

/**
 * Retrieve Value and Beliefs record by job_id.
 * 
 * @param {Object} req - The request object containing job_id as parameter.
 * @param {Object} res - The response object used to send the record back.
 */
async function getVBById(req, res) {
    const { job_id } = req.params;
    try {
        const result = await pool.query(`SELECT * FROM val_bel WHERE job_id = $1`, [job_id]);
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
 * Delete Value and Beliefs record by job_id.
 * 
 * @param {Object} req - The request object containing job_id as parameter.
 * @param {Object} res - The response object used to send success or error response.
 */
async function deleteVB(req, res) {
    const { job_id } = req.params;

    try {
        const result = await pool.query(
            'DELETE FROM val_bel WHERE job_id = $1 RETURNING *',
            [job_id]
        );
        if (result.rows.length === 0) {
            res.status(404).json({ error: 'Value and Beliefs not found' });
        } else {
            res.json({ message: 'Value and Beliefs deleted successfully' });
        }
    } catch (error) {
        console.error('Error deleting Value and Beliefs:', error);
        res.status(500).json({ error: 'Error deleting Value and Beliefs' });
    }
}

/**
 * Download an empty template XLSX file for Value and Beliefs.
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
        const filePath = path.join(__dirname, "../downloads/val_bel_template.xlsx");

        // Ensure the downloads directory exists
        if (!fs.existsSync(path.dirname(filePath))) {
            fs.mkdirSync(path.dirname(filePath), { recursive: true });
        }

        // Write the workbook to the server file system
        xlsx.writeFile(workbook, filePath);
        console.log(`✅ Template XLSX file created at ${filePath}`);

        // Send the file for download
        res.download(filePath, "val_bel_template.xlsx", (err) => {
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
 * Search for Value and Beliefs records based on a query string.
 * 
 * @param {Object} req - The request object containing the search query.
 * @param {Object} res - The response object used to send the matching records back.
 */
async function searchVB(req, res) {
    const { search } = req.query;

    try {
        const result = await pool.query(
            `SELECT * FROM val_bel WHERE 
            CAST(job_id AS TEXT) ILIKE $1 OR 
            nama_job ILIKE $1 OR 
            deskripsi ILIKE $1`,
            [`%${search}%`]
        );

        if (result.rows.length === 0) {
            res.status(404).json({ error: 'No matching Value and Beliefs found' });
        } else {
            res.json(result.rows);
        }
    } catch (error) {
        console.error('Error fetching Value and Beliefs:', error);
        res.status(500).json({ error: 'Error fetching Value and Beliefs' });
    }
}

module.exports = {
    createVB,
    vbUpdate,
    getAllVB,
    getVBById,
    deleteVB,
    uploadXLSX,
    downloadXLSX,
    downloadTemplateXLSX,
    searchVB,
    upload
};
