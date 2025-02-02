const multer = require("multer");
const pool = require('../db');
const upload = require("../middleware/multer");
const xlsx = require("xlsx");
const fs = require("fs");
const path = require("path");

async function createJC(req, res) {
    const job_id = parseInt(req.body.job_id, 10);
    const { job_prefix, company_code, nama_job, band, flag_mgr = '-' } = req.body;

    if (!job_id || !job_prefix || !company_code || !nama_job || !band) {
        console.error("Missing Fields:", { job_id, job_prefix, company_code, nama_job, band });
        return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    try {
        // Check if job_id already exists
        const checkQuery = `SELECT job_id FROM create_job WHERE job_id = $1`;
        const existingJob = await pool.query(checkQuery, [job_id]);

        let operation;
        let result;

        if (existingJob.rows.length > 0) {
            // Update existing job_id
            const updateQuery = `
                UPDATE create_job
                SET job_prefix = $1, company_code = $2, nama_job = $3, band = $4, flag_mgr = $5
                WHERE job_id = $6
                RETURNING *;
            `;
            result = await pool.query(updateQuery, [job_prefix, company_code, nama_job, band, flag_mgr, job_id]);
            operation = "updated";
        } else {
            // Insert new job_id
            const insertQuery = `
                INSERT INTO create_job (job_id, job_prefix, company_code, nama_job, band, flag_mgr)
                VALUES ($1, $2, $3, $4, $5, $6)
                RETURNING *;
            `;
            result = await pool.query(insertQuery, [job_id, job_prefix, company_code, nama_job, band, flag_mgr]);
            operation = "created";
        }

        console.log(`✅ Jobs ${operation} for job_id: ${job_id}`);
        res.status(201).json({
            success: true,
            message: `Jobs ${operation} successfully`,
            data: result.rows[0],
        });

    } catch (error) {
        console.error("Error creating Jobs:", error.message);
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
            const checkQuery = `SELECT COUNT(*) FROM create_job WHERE job_id = $1`;
            const { rows } = await pool.query(checkQuery, [jobId]);

            if (parseInt(rows[0].count) > 0) {
                // Delete all existing entries for this job_id
                const deleteQuery = `DELETE FROM create_job WHERE job_id = $1 RETURNING *`;
                const deletedRows = await pool.query(deleteQuery, [jobId]);
                deletedCount += deletedRows.rowCount;
                console.log(`Deleted ${deletedRows.rowCount} entries for job_id: ${jobId}`);
            }
        }

        // Insert new batch of data
        for (const row of data) {
            if (!row.job_id || !row.job_prefix || !row.company_code || !row.nama_job || !row.band) {
                console.error("Skipping row due to missing fields:", row);
                continue;
            }

            row.band = row.band.toUpperCase();
            
            const insertQuery = `
                INSERT INTO create_job (job_id, job_prefix, company_code, nama_job, band, flag_mgr)
                VALUES ($1, $2, $3, $4, $5, $6) RETURNING *;
            `;
            await pool.query(insertQuery, [row.job_id, row.job_prefix, row.company_code, row.nama_job, row.band, row.flag_mgr || '-']);
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
        console.log("🔍 Checking create_job table...");
        
        // Fetch data from the database
        const result = await pool.query("SELECT * FROM create_job;");
        
        if (result.rows.length === 0) {
            console.warn("⚠️ No data found in create_job table.");
            return res.status(404).json({ error: "No records found to export." }); // Adjusted error message
        }

        console.log(`📝 Retrieved ${result.rows.length} records from create_job`);

        // Convert data into worksheet
        const worksheet = xlsx.utils.json_to_sheet(result.rows);
        const workbook = xlsx.utils.book_new();
        xlsx.utils.book_append_sheet(workbook, worksheet, "Jobs");

        // Define file path
        const filePath = path.join(__dirname, "../downloads/jobs.xlsx");

        // Ensure the downloads directory exists
        if (!fs.existsSync(path.dirname(filePath))) {
            fs.mkdirSync(path.dirname(filePath), { recursive: true });
        }

        // Write file to the server
        xlsx.writeFile(workbook, filePath);
        console.log(`✅ XLSX file created at ${filePath}`);

        // Send the file for download
        res.download(filePath, "jobs.xlsx", (err) => {
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

async function jcUpdate(req, res) {
    const obj_id = parseInt(req.params.obj_id, 10);
    const { job_prefix, company_code, nama_job, band, flag_mgr } = req.body;
    try {
        const result = await pool.query(
            `UPDATE create_job 
             SET job_prefix = $1, company_code = $2, nama_job = $3, band = $4, flag_mgr = $5 
             WHERE obj_id = $6 RETURNING *`,
            [job_prefix, company_code, nama_job, band, flag_mgr, obj_id]
        );
        if (result.rows.length === 0) {
            res.status(404).json({ error: 'Job not found' });
        } else {
            res.json(result.rows[0]);
        }
    } catch (error) {
        console.error('Error updating create_job:', error);
        res.status(500).json({ error: 'Error updating create_job' });
    }
}


async function getAllJC(req, res) {
    try {
        const result = await pool.query(`SELECT * FROM create_job`);
        res.json(result.rows);
    } catch (error) {
        console.error('Error getting Job Responsibilities:', error);
        res.status(500).json({ error: 'Error getting Job Responsibilities' });
    }
}

// Get report by ID
async function getJCById(req, res) {
    const { job_id } = req.params;
    try {
        const result = await pool.query(`SELECT * FROM create_job WHERE job_id = $1`, [job_id]);
        if (result.rows.length === 0) {
            res.status(404).json({ error: 'Responsibilities not found' });
        } else {
            res.json(result.rows[0]);
        }
    } catch (error) {
        console.error('Error getting create_job by ID:', error);
        res.status(500).json({ error: 'Error getting create_job by ID' });
    }
}


async function deleteJC(req, res) {
    const { obj_id } = req.params;

    try {
        const result = await pool.query(
            'DELETE FROM create_job WHERE obj_id = $1 RETURNING *',
            [obj_id]
        );
        if (result.rows.length === 0) {
            res.status(404).json({ error: 'Jobs not found' });
        } else {
            res.json({ message: 'Jobs deleted successfully' });
        }
    } catch (error) {
        console.error('Error deleting Jobs:', error);
        res.status(500).json({ error: 'Error deleting Jobs' });
    }
}

// Download Template XLSX
async function downloadTemplateXLSX(req, res) {
    try {
        // Define the template data (columns without content)
        const templateData = [
            { job_id: '', nama_job: '', job_prefix: '', company_code: '', band: '', flag_mgr:''}
        ];

        // Convert the template data into a worksheet
        const worksheet = xlsx.utils.json_to_sheet(templateData);
        const workbook = xlsx.utils.book_new();
        xlsx.utils.book_append_sheet(workbook, worksheet, "Template");

        // Define file path for the template
        const filePath = path.join(__dirname, "../downloads/jobs_template.xlsx");

        // Ensure the downloads directory exists
        if (!fs.existsSync(path.dirname(filePath))) {
            fs.mkdirSync(path.dirname(filePath), { recursive: true });
        }

        // Write the workbook to the server file system
        xlsx.writeFile(workbook, filePath);
        console.log(`✅ Template XLSX file created at ${filePath}`);

        // Send the file for download
        res.download(filePath, "jobs_template.xlsx", (err) => {
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

async function searchJC(req, res) {
    const { search } = req.query;

    try {
        const result = await pool.query(
            `SELECT * FROM create_job WHERE 
            CAST(job_id AS TEXT) ILIKE $1 OR 
            nama_job ILIKE $1 OR 
            company_code ILIKE $1 OR
            job_prefix ILIKE $1`,
            [`%${search}%`]
        );

        if (result.rows.length === 0) {
            res.status(404).json({ error: 'No matching Jobs found' });
        } else {
            res.json(result.rows);
        }
    } catch (error) {
        console.error('Error fetching Jobs:', error);
        res.status(500).json({ error: 'Error fetching Jobs' });
    }
}

module.exports = {
    createJC,
    jcUpdate,
    getAllJC,
    getJCById,
    deleteJC,
    uploadXLSX,
    downloadXLSX,
    downloadTemplateXLSX,
    searchJC,
    upload
};