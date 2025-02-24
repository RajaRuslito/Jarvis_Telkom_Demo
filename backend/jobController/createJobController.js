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

        const mode = req.query.mode;
        const filePath = req.file.path;
        const workbook = xlsx.readFile(filePath);
        const sheetName = workbook.SheetNames[0];
        const data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

        if (data.length === 0) {
            fs.unlinkSync(filePath);
            return res.status(400).json({ error: "The uploaded file is empty" });
        }

        let updatedCount = 0;
        let deletedCount = 0;
        let insertedCount = 0;

        if (mode === "overwrite") {
            // Delete all existing records before inserting new data
            const deleteQuery = `DELETE FROM create_job RETURNING *;`;
            const deleteResult = await pool.query(deleteQuery);
            deletedCount = deleteResult.rowCount;
            console.log(`🗑️ Deleted ${deletedCount} existing create_job records.`);
        }

        const jobIds = [...new Set(data.map(row => row.job_id).filter(job_id => job_id))]; // Extract unique job_ids

        if (jobIds.length === 0) {
            fs.unlinkSync(filePath);
            return res.status(400).json({ error: "No valid job_id found in the file." });
        }

        if (mode === "update") {
            // Fetch existing job_auth records in bulk
            const placeholders = jobIds.map((_, i) => `$${i + 1}`).join(", ");
            const existingRecordsQuery = `SELECT * FROM create_job WHERE job_id IN (${placeholders})`;
            const existingRecordsResult = await pool.query(existingRecordsQuery, jobIds);

            // Convert existing records into a map for quick lookup
            const existingRecordsMap = new Map();
            existingRecordsResult.rows.forEach(record => {
                existingRecordsMap.set(record.job_id, record);
            });

            for (const row of data) {
                if (!row.job_id || !row.nama_job || !row.job_prefix || !row.company_code || !row.band || !row.flag_mgr) {
                    console.error("Skipping row due to missing fields:", row);
                    continue;
                }

                const existingRecord = existingRecordsMap.get(row.job_id);

                if (existingRecord) {
                    if (
                        existingRecord.nama_job !== row.nama_job ||
                        existingRecord.job_prefix !== row.job_prefix ||
                        existingRecord.company_code !== row.company_code ||
                        existingRecord.band !== row.band ||
                        existingRecord.flag_mgr !== row.flag_mgr
                    ) {
                        // Update existing record
                        const updateQuery = `
                            UPDATE create_job 
                            SET nama_job = $1, job_prefix = $2, company_code = $3, band = $4, flag_mgr = $5
                            WHERE job_id = $6 RETURNING *;
                        `;
                        await pool.query(updateQuery, [row.nama_job, row.job_prefix, row.company_code, row.band, row.flag_mgr, row.job_id]);
                        updatedCount++;
                    }
                } else {
                    // Insert new record
                    const insertQuery = `
                        INSERT INTO create_job (job_id, nama_job, job_prefix, company_code, band, flag_mgr)
                        VALUES ($1, $2, $3, $4, $5, $6) RETURNING *;
                    `;
                    await pool.query(insertQuery, [row.job_id, row.nama_job, row.job_prefix, row.company_code, row.band, row.flag_mgr]);
                    insertedCount++;
                }
            }
        } else if (mode === "overwrite") {
            // Directly insert all records from the uploaded file
            for (const row of data) {
                if (!row.job_id || !row.nama_job || !row.job_prefix || !row.company_code || !row.band || !row.flag_mgr) {
                    console.error("Skipping row due to missing fields:", row);
                    continue;
                }

                const insertQuery = `
                    INSERT INTO create_job (job_id, nama_job, job_prefix, company_code, band, flag_mgr)
                    VALUES ($1, $2, $3, $4, $5, $6) RETURNING *;
                `;
                await pool.query(insertQuery, [row.job_id, row.nama_job, row.job_prefix, row.company_code, row.band, row.flag_mgr]);
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
        const query = `SELECT * FROM create_job WHERE job_id IN (${placeholders})`;
        const existingRecords = await pool.query(query, uniqueJobIds);

        let conflicts = [];
        let conflictingJobIds = []; // Store job_ids that have conflicts
        let totalConflicts = 0;

        data.forEach(row => {
            if (!row.job_id || !row.nama_job || !row.job_prefix || !row.company_code || !row.band || !row.flag_mgr) {
                console.warn("Skipping row due to missing fields:", row);
                return;
            }

            const existingRecord = existingRecords.rows.find(record => record.job_id === row.job_id);
            if (existingRecord) {
                // Check if the new data is different from the existing data
                if (
                    existingRecord.nama_job !== row.nama_job ||
                    existingRecord.job_prefix !== row.job_prefix ||
                    existingRecord.company_code !== row.company_code ||
                    existingRecord.band !== row.band ||
                    existingRecord.flag_mgr !== row.flag_mgr
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

async function alterCJ(req, res) {
    const { obj_id } = req.params; // Extract job_id from request parameters

    try {
        // Update the status to 'Non-Active' where job_id matches
        const result = await pool.query(
            'UPDATE create_job SET status = $1 WHERE obj_id = $2 RETURNING *',
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
    checkConflictXLSX,
    alterCJ,
    upload
};