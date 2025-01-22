const multer = require("multer");
const pool = require('../db');
const upload = require("../middleware/multer");
const xlsx = require("xlsx");
const path = require("path");
const fs = require("fs");

// Create Mission Statement
async function createMS(req, res) {
    const job_id = parseInt(req.body.job_id, 10);
    const { nama_job, deskripsi } = req.body;

    if (!job_id || !nama_job || !deskripsi) {
        console.error("Missing Fields:", { job_id, nama_job, deskripsi });
        return res.status(400).json({ success: false, message: "Missing required fields" });
    }
    try {
        // Check if job_id already exists
        const checkQuery = `SELECT job_id FROM mission_statement WHERE job_id = $1`;
        const existingJob = await pool.query(checkQuery, [job_id]);

        let operation;
        let result;

        if (existingJob.rows.length > 0) {
            // Update existing job_id
            const updateQuery = `
                UPDATE mission_statement
                SET nama_job = $1, deskripsi = $2
                WHERE job_id = $3
                RETURNING *;
            `;
            result = await pool.query(updateQuery, [nama_job, deskripsi, job_id]);
            operation = "updated";
        } else {
            // Insert new job_id
            const insertQuery = `
                INSERT INTO mission_statement (job_id, nama_job, deskripsi)
                VALUES ($1, $2, $3)
                RETURNING *;
            `;
            result = await pool.query(insertQuery, [job_id, nama_job, deskripsi]);
            operation = "created";
        }

        console.log(`✅ Mission statement ${operation} for job_id: ${job_id}`);
        res.status(201).json({
            success: true,
            message: `Mission statement ${operation} successfully`,
            data: result.rows[0],
        });
    } catch (error) {
        console.error("Error creating mission statement:", error.message);
        res.status(500).json({ success: false, message: error.message });
    }
}

// Upload XLSX and Insert Data
async function uploadXLSX(req, res){
    try {
        if (!req.file) {
            return res.status(400).json({ error: "No file uploaded" });
        }

        const filePath = req.file.path;
        const workbook = xlsx.readFile(filePath);
        const sheetName = workbook.SheetNames[0];
        const data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);
       
        let insertedCount = 0;
        let updatedCount = 0;

        for (const row of data) {
            if (!row.job_id || !row.nama_job || !row.deskripsi) {
                console.error("Skipping row due to missing fields:", row);
                continue;
            }
            const checkQuery = `SELECT * FROM mission_statement WHERE job_id = $1`;
            const existingJob = await pool.query(checkQuery, [parseInt(row.job_id)]);

            if (existingJob.rows.length > 0) {
                // If job_id exists, update the record
                const updateQuery = `
                    UPDATE mission_statement 
                    SET nama_job = $1, deskripsi = $2 
                    WHERE job_id = $3 RETURNING *;
                `;
                await pool.query(updateQuery, [row.nama_job, row.deskripsi, row.job_id]);
                console.log(`Updated job_id: ${row.job_id}`);
                updatedCount++;
            } else {
                // If job_id does not exist, insert new record
                const insertQuery = `
                    INSERT INTO mission_statement (job_id, nama_job, deskripsi)
                    VALUES ($1, $2, $3) RETURNING *;
                `;    
                await pool.query(insertQuery, [parseInt(row.job_id), row.nama_job, row.deskripsi]);
                console.log(`Inserted new job_id: ${row.job_id}`);
                insertedCount++;
            }
        }
        // Delete the file after processing
        fs.unlinkSync(filePath);

        res.status(201).json({ 
            message: "XLSX file uploaded and data inserted successfully!",
            inserted: insertedCount,
            updated: updatedCount 
        });
    } catch (error) {
        console.error("Error uploading XLSX:", error);
        res.status(500).json({ error: "An error occurred while processing the file" });
    }
}

// Download XLSX masih belom bisa skip aja
async function downloadXLSX(req, res) {
    try {
        console.log("🔍 Checking mission_statement table...");

        // Fetch data from the database
        const result = await pool.query("SELECT * FROM mission_statement;");

        console.log("Query result:", result.rows);

        if (result.rows.length === 0) {
            console.warn("⚠️ No data found in mission_statement table.");
            return res.status(404).json({ error: "No records found to export." });
        }

        console.log(`📝 Retrieved ${result.rows.length} records from mission_statement`);

        // Convert data into worksheet
        const worksheet = xlsx.utils.json_to_sheet(result.rows);
        const workbook = xlsx.utils.book_new();
        xlsx.utils.book_append_sheet(workbook, worksheet, "MissionStatements");

        // Define file path
        const filePath = path.join(__dirname, "../downloads/mission_statements.xlsx");
        // Ensure the downloads directory exists
        if (!fs.existsSync(path.dirname(filePath))) {
            fs.mkdirSync(path.dirname(filePath), { recursive: true });
        }

        // Write file to the server
        xlsx.writeFile(workbook, filePath);
        console.log(`✅ XLSX file created at ${filePath}`);

        // Send the file for download
        res.download(filePath, "mission_statements.xlsx", (err) => {
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

// Update Mission Statement
async function MSUpdate(req, res) {
    const job_id = parseInt(req.params.job_id, 10);
    const { nama_job, deskripsi } = req.body;

    if (!job_id || !nama_job || !deskripsi) {
        console.error("Missing Fields:", { job_id, nama_job, deskripsi });
        return res.status(400).json({ success: false, message: "Missing required fields" });
    }
    try {
        const result = await pool.query(
            `UPDATE mission_statement 
             SET nama_job = $1, deskripsi = $2 
             WHERE job_id = $3 RETURNING *`,
            [nama_job, deskripsi, job_id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Mission statement not found" });
        } else {
            res.json(result.rows[0]);
        }
    } catch (error) {
        console.error("Error updating mission statement:", error);
        res.status(500).json({ error: "Error updating mission statement" });
    }
}

// Get All Mission Statements
async function getAllMS(req, res) {
    try {
        const result = await pool.query(`SELECT * FROM mission_statement`);
        res.json(result.rows);
    } catch (error) {
        console.error("Error getting mission statements:", error);
        res.status(500).json({ error: "Error getting mission statements" });
    }
}

// Get Mission Statement by ID
async function getMSById(req, res) {
    const { job_id } = req.params;

    try {
        const result = await pool.query(`SELECT * FROM mission_statement WHERE job_id = $1`, [job_id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Mission statement not found" });
        }
        res.json(result.rows[0]);
    } catch (error) {
        console.error("Error getting mission statement by ID:", error);
        res.status(500).json({ error: "Error getting mission statement by ID" });
    }
}

// Delete Mission Statement
async function deleteMS(req, res) {
    const { job_id } = req.params;

    try {
        const result = await pool.query(
            "DELETE FROM mission_statement WHERE job_id = $1 RETURNING *",
            [job_id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Mission Statement not found" });
        }
        res.json({ message: "Mission Statement deleted successfully" });
    } catch (error) {
        console.error("Error deleting mission statement:", error);
        res.status(500).json({ error: "Error deleting mission statement" });
    }
}

// Download Template XLSX
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
        const filePath = path.join(__dirname, "../downloads/mission_statement_template.xlsx");

        // Ensure the downloads directory exists
        if (!fs.existsSync(path.dirname(filePath))) {
            fs.mkdirSync(path.dirname(filePath), { recursive: true });
        }

        // Write the workbook to the server file system
        xlsx.writeFile(workbook, filePath);
        console.log(`✅ Template XLSX file created at ${filePath}`);

        // Send the file for download
        res.download(filePath, "mission_statement_template.xlsx", (err) => {
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

async function searchMS(req, res) {
    const { search } = req.query;

    try {
        const result = await pool.query(
            `SELECT * FROM mission_statement WHERE 
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
        console.error('Error fetching Mission Statement:', error);
        res.status(500).json({ error: 'Error fetching Mission Statement' });
    }
}

module.exports = {
    createMS,
    MSUpdate,
    getAllMS,
    getMSById,
    deleteMS,
    uploadXLSX,
    downloadXLSX,
    downloadTemplateXLSX,
    searchMS,
    upload
};
