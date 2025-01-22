const multer = require("multer");
const pool = require('../db');
const upload = require("../middleware/multer");
const xlsx = require("xlsx");
const fs = require("fs");
const path = require("path");


async function createJA (req, res){
    const job_id = parseInt(req.body.job_id, 10);
    const { nama_job, deskripsi } = req.body;

    if (!job_id || !nama_job || !deskripsi) {
        console.error("Missing Fields:", { job_id, nama_job, deskripsi });
        return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    try {
        const query = `
        INSERT INTO job_auth (job_id, nama_job, deskripsi)
        VALUES ($1, $2, $3)
        ON CONFLICT (job_id)
        DO UPDATE SET 
            nama_job = EXCLUDED.nama_job,
            deskripsi = EXCLUDED.deskripsi
        RETURNING *; 
        `;
        const values = [job_id, nama_job, deskripsi];

        const operation = rows[0].operation_type;
        if (operation === "created") {
            console.log(`✅ New Job authorities created for job_id: ${job_id}`);
            res.status(201).json({
                success: true,
                message: `Job authorities ${operation} successfully`,
                data: rows[0],
            });
        } else {
            console.log(`♻️ Existing job authorities updated for job_id: ${job_id}`);
            res.status(201).json({
                success: true,
                message: `Job authorities updated successfully`,
                data: rows[0],
            });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }

}

// Upload XLSX and Insert Data
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
            const checkQuery = `SELECT COUNT(*) FROM job_auth WHERE job_id = $1`;
            const { rows } = await pool.query(checkQuery, [jobId]);

            if (parseInt(rows[0].count) > 0) {
                // Delete all existing entries for this job_id
                const deleteQuery = `DELETE FROM job_auth WHERE job_id = $1 RETURNING *`;
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
                INSERT INTO job_auth (job_id, nama_job, deskripsi)
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

// Download XLSX masih belom bisa skip aja
async function downloadXLSX(req, res) {
    try {
        console.log("🔍 Checking job_auth table...");
        
        // Fetch data from the database
        const result = await pool.query("SELECT * FROM job_auth;");
        
        if (result.rows.length === 0) {
            console.warn("⚠️ No data found in job_auth table.");
            return res.status(404).json({ error: "No records found to export." }); // Adjusted error message
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

async function jaUpdate(req, res) {
    const job_id = parseInt(req.params.job_id, 10);
    const { nama_job, deskripsi } = req.body;

    if (!job_id || !nama_job || !deskripsi) {
        console.error("Missing Fields:", { job_id, nama_job, deskripsi });
        return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    try {
        const result = await pool.query(
            `UPDATE job_auth 
             SET nama_job = $1, deskripsi = $2 
             WHERE job_id = $3 RETURNING *`,
            [nama_job, deskripsi, job_id]
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

async function getAllJA(req, res) {
    try {
        const result = await pool.query(`SELECT * FROM job_auth`);
        res.json(result.rows);
    } catch (error) {
        console.error('Error getting Job Authorities:', error);
        res.status(500).json({ error: 'Error getting Job Authorities' });
    }
}

// Get report by ID
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
    upload
};