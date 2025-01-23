const multer = require("multer");
const pool = require('../db');
const upload = require("../middleware/multer");
const xlsx = require("xlsx");
const path = require("path");
const fs = require("fs");

// Create Mission Statement
/**
 * Creates a new mission statement or updates an existing one.
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 */
async function createDLC(req, res) {
    const job_id = parseInt(req.body.job_id, 10);
    const { nama_job, deskripsi } = req.body;

    // Check if required fields are provided in the request.
    if (!job_id || !nama_job || !deskripsi) {
        console.error("Missing Fields:", { job_id, nama_job, deskripsi });
        return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    try {
        // Check if job_id already exists in the database.
        const checkQuery = `SELECT job_id FROM dlc WHERE job_id = $1`;
        const existingJob = await pool.query(checkQuery, [job_id]);

        let operation;
        let result;

        if (existingJob.rows.length > 0) {
            // Update existing mission statement if job_id exists.
            const updateQuery = `
                UPDATE dlc
                SET nama_job = $1, deskripsi = $2
                WHERE job_id = $3
                RETURNING *;
            `;
            result = await pool.query(updateQuery, [nama_job, deskripsi, job_id]);
            operation = "updated";
        } else {
            // Insert a new mission statement if job_id does not exist.
            const insertQuery = `
                INSERT INTO dlc (job_id, nama_job, deskripsi)
                VALUES ($1, $2, $3)
                RETURNING *;
            `;
            result = await pool.query(insertQuery, [job_id, nama_job, deskripsi]);
            operation = "created";
        }

        // Respond with success message.
        console.log(`✅ Mission statement ${operation} for job_id: ${job_id}`);
        res.status(201).json({
            success: true,
            message: `Mission statement ${operation} successfully`,
            data: result.rows[0],
        });
    } catch (error) {
        // Handle errors during the database operation.
        console.error("Error creating mission statement:", error.message);
        res.status(500).json({ success: false, message: error.message });
    }
}

// Upload XLSX and Insert Data
/**
 * Uploads an XLSX file, reads the data, and inserts it into the database.
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 */
async function uploadXLSX(req, res){
    try {
        // Check if a file was uploaded.
        if (!req.file) {
            return res.status(400).json({ error: "No file uploaded" });
        }

        // Read the uploaded XLSX file.
        const filePath = req.file.path;
        const workbook = xlsx.readFile(filePath);
        const sheetName = workbook.SheetNames[0];
        const data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);
       
        let insertedCount = 0;
        let updatedCount = 0;

        // Iterate through each row in the XLSX file.
        for (const row of data) {
            // Skip rows with missing required fields.
            if (!row.job_id || !row.nama_job || !row.deskripsi) {
                console.error("Skipping row due to missing fields:", row);
                continue;
            }

            // Check if the job_id exists in the database.
            const checkQuery = `SELECT * FROM dlc WHERE job_id = $1`;
            const existingJob = await pool.query(checkQuery, [parseInt(row.job_id)]);

            if (existingJob.rows.length > 0) {
                // If job_id exists, update the record.
                const updateQuery = `
                    UPDATE dlc 
                    SET nama_job = $1, deskripsi = $2 
                    WHERE job_id = $3 RETURNING *;
                `;
                await pool.query(updateQuery, [row.nama_job, row.deskripsi, row.job_id]);
                console.log(`Updated job_id: ${row.job_id}`);
                updatedCount++;
            } else {
                // If job_id does not exist, insert a new record.
                const insertQuery = `
                    INSERT INTO dlc (job_id, nama_job, deskripsi)
                    VALUES ($1, $2, $3) RETURNING *;
                `;
                await pool.query(insertQuery, [parseInt(row.job_id), row.nama_job, row.deskripsi]);
                console.log(`Inserted new job_id: ${row.job_id}`);
                insertedCount++;
            }
        }

        // Delete the uploaded file after processing.
        fs.unlinkSync(filePath);

        // Respond with the counts of inserted and updated records.
        res.status(201).json({ 
            message: "XLSX file uploaded and data inserted successfully!",
            inserted: insertedCount,
            updated: updatedCount 
        });
    } catch (error) {
        // Handle errors during the file processing or database operations.
        console.error("Error uploading XLSX:", error);
        res.status(500).json({ error: "An error occurred while processing the file" });
    }
}

// Download XLSX (still under construction)
async function downloadXLSX(req, res) {
    try {
        console.log("🔍 Checking dlc table...");

        // Fetch all data from the dlc table.
        const result = await pool.query("SELECT * FROM dlc;");

        if (result.rows.length === 0) {
            console.warn("⚠️ No data found in dlc table.");
            return res.status(404).json({ error: "No records found to export." });
        }

        // Convert the retrieved data into a worksheet.
        const worksheet = xlsx.utils.json_to_sheet(result.rows);
        const workbook = xlsx.utils.book_new();
        xlsx.utils.book_append_sheet(workbook, worksheet, "MissionStatements");

        // Define the file path for the generated XLSX file.
        const filePath = path.join(__dirname, "../downloads/dlcs.xlsx");
        if (!fs.existsSync(path.dirname(filePath))) {
            fs.mkdirSync(path.dirname(filePath), { recursive: true });
        }

        // Write the workbook to the server's file system.
        xlsx.writeFile(workbook, filePath);
        console.log(`✅ XLSX file created at ${filePath}`);

        // Send the file for download.
        res.download(filePath, "dlcs.xlsx", (err) => {
            if (err) {
                console.error("Error sending file:", err);
                res.status(500).json({ error: "Error downloading the file" });
            } else {
                console.log("✅ File download initiated successfully.");
            }
        });
    } catch (error) {
        // Handle errors during file generation or download.
        console.error("❌ Error downloading XLSX:", error);
        res.status(500).json({ error: "An error occurred while generating the file" });
    }
}

// Update Mission Statement
/**
 * Updates an existing mission statement by its obj_id.
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 */
async function DLCUpdate(req, res) {
    const obj_id = parseInt(req.params.obj_id, 10);
    const { nama_job, deskripsi } = req.body;

    // Validate the input fields.
    if (isNaN(obj_id) || !nama_job || !deskripsi) {
        console.error("Missing or invalid fields:", { obj_id, nama_job, deskripsi });
        return res.status(400).json({ success: false, message: "Missing or invalid required fields" });
    }

    try {
        // Update the mission statement in the database.
        const result = await pool.query(
            `UPDATE dlc 
             SET nama_job = $1, deskripsi = $2 
             WHERE obj_id = $3 RETURNING *`,
            [nama_job, deskripsi, obj_id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Mission statement not found" });
        } else {
            res.json(result.rows[0]);
        }
    } catch (error) {
        // Handle errors during the update operation.
        console.error("Error updating mission statement:", error);
        res.status(500).json({ error: "Error updating mission statement" });
    }
}

// Get All Mission Statements
/**
 * Fetches all mission statements from the database.
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 */
async function getAllDLC(req, res) {
    try {
        // Fetch all mission statements.
        const result = await pool.query(`SELECT * FROM dlc`);
        res.json(result.rows);
    } catch (error) {
        // Handle errors during data fetching.
        console.error("Error getting mission statements:", error);
        res.status(500).json({ error: "Error getting mission statements" });
    }
}

// Get Mission Statement by ID
/**
 * Fetches a specific mission statement by its job_id.
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 */
async function getDLCById(req, res) {
    const { job_id } = req.params;

    try {
        // Fetch mission statement by job_id.
        const result = await pool.query(`SELECT * FROM dlc WHERE job_id = $1`, [job_id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Mission statement not found" });
        }
        res.json(result.rows[0]);
    } catch (error) {
        // Handle errors during the data retrieval.
        console.error("Error getting mission statement by ID:", error);
        res.status(500).json({ error: "Error getting mission statement by ID" });
    }
}

// Delete Mission Statement
/**
 * Deletes a mission statement by its obj_id.
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 */
async function deleteDLC(req, res) {
    const { obj_id } = req.params;

    try {
        // Delete the mission statement.
        const result = await pool.query(
            "DELETE FROM dlc WHERE obj_id = $1 RETURNING *",
            [obj_id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Mission Statement not found" });
        }
        res.json({ message: "Mission Statement deleted successfully" });
    } catch (error) {
        // Handle errors during the delete operation.
        console.error("Error deleting mission statement:", error);
        res.status(500).json({ error: "Error deleting mission statement" });
    }
}

// Download Template XLSX
/**
 * Downloads a template XLSX file for mission statements.
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 */
async function downloadTemplateXLSX(req, res) {
    try {
        // Define the template data (columns without content).
        const templateData = [
            { job_id: '', nama_job: '', deskripsi: '' }
        ];

        // Convert template data into a worksheet.
        const worksheet = xlsx.utils.json_to_sheet(templateData);
        const workbook = xlsx.utils.book_new();
        xlsx.utils.book_append_sheet(workbook, worksheet, "Template");

        // Define the file path for the template.
        const filePath = path.join(__dirname, "../downloads/dlc_template.xlsx");

        // Ensure the downloads directory exists.
        if (!fs.existsSync(path.dirname(filePath))) {
            fs.mkdirSync(path.dirname(filePath), { recursive: true });
        }

        // Write the workbook to the server file system.
        xlsx.writeFile(workbook, filePath);
        console.log(`✅ Template XLSX file created at ${filePath}`);

        // Send the template file for download.
        res.download(filePath, "dlc_template.xlsx", (err) => {
            if (err) {
                console.error("Error sending file:", err);
                res.status(500).json({ error: "Error downloading the template" });
            } else {
                console.log("✅ Template file download initiated successfully.");
            }
        });
    } catch (error) {
        // Handle errors during the file creation or download.
        console.error("❌ Error downloading template XLSX:", error);
        res.status(500).json({ error: "An error occurred while generating the template" });
    }
}

// Search Mission Statements
/**
 * Searches for mission statements based on a query string.
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 */
async function searchDLC(req, res) {
    const { search } = req.query;

    try {
        // Search mission statements based on the query.
        const result = await pool.query(
            `SELECT * FROM dlc WHERE 
            CAST(job_id AS TEXT) ILIKE $1 OR 
            nama_job ILIKE $1 OR 
            deskripsi ILIKE $1`,
            [`%${search}%`]
        );

        if (result.rows.length === 0) {
            res.status(404).json({ error: 'No matching Mission Statement found' });
        } else {
            res.json(result.rows);
        }
    } catch (error) {
        // Handle errors during the search operation.
        console.error('Error fetching Mission Statement:', error);
        res.status(500).json({ error: 'Error fetching Mission Statement' });
    }
}

module.exports = {
    createDLC,
    DLCUpdate,
    getAllDLC,
    getDLCById,
    deleteDLC,
    uploadXLSX,
    downloadXLSX,
    downloadTemplateXLSX,
    searchDLC,
    upload
};
