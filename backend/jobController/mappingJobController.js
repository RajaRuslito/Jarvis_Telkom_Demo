const multer = require("multer");
const pool = require('../db');
const upload = require("../middleware/multer");
const xlsx = require("xlsx");
const path = require("path");
const fs = require("fs");

// Create Mapping Job
/**
 * Creates a new mapping job or updates an existing one.
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 */
async function createMappingJob(req, res) {
    const { job_id, company_code, short_posisi, obid_posisi, nama_pemangku, nik_pemangku } = req.body;

    // Check if required fields are provided in the request.
    if (!job_id || !company_code || !short_posisi || !obid_posisi || !nama_pemangku || !nik_pemangku) {
        console.error("Missing Fields:", { job_id, company_code, short_posisi, obid_posisi, nama_pemangku, nik_pemangku });
        return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    try {
        // Check if job_id already exists in the database.
        const checkQuery = `SELECT job_id FROM mapping_job WHERE job_id = $1`;
        const existingJob = await pool.query(checkQuery, [job_id]);

        let operation;
        let result;

        if (existingJob.rows.length > 0) {
            // Update existing mapping job if job_id exists.
            const updateQuery = `
                UPDATE mapping_job
                SET company_code = $1, short_posisi = $2, obid_posisi = $3, nama_pemangku = $4, nik_pemangku = $5
                WHERE job_id = $6
                RETURNING *;
            `;
            result = await pool.query(updateQuery, [company_code, short_posisi, obid_posisi, nama_pemangku, nik_pemangku, job_id]);
            operation = "updated";
        } else {
            // Insert a new mapping job if job_id does not exist.
            const insertQuery = `
                INSERT INTO mapping_job (job_id, company_code, short_posisi, obid_posisi, nama_pemangku, nik_pemangku)
                VALUES ($1, $2, $3, $4, $5, $6)
                RETURNING *;
            `;
            result = await pool.query(insertQuery, [job_id, company_code, short_posisi, obid_posisi, nama_pemangku, nik_pemangku]);
            operation = "created";
        }

        // Respond with success message.
        console.log(`✅ Mapping job ${operation} for job_id: ${job_id}`);
        res.status(201).json({
            success: true,
            message: `Mapping job ${operation} successfully`,
            data: result.rows[0],
        });
    } catch (error) {
        // Handle errors during the database operation.
        console.error("Error creating mapping job:", error.message);
        res.status(500).json({ success: false, message: error.message });
    }
}

// Upload XLSX and Insert Data for Mapping Job
/**
 * Uploads an XLSX file, reads the data, and inserts it into the mapping_job table.
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 */
async function uploadMappingJobXLSX(req, res) {
    try {
        // Check if a file was uploaded.
        if (!req.file) {
            return res.status(400).json({ error: "No file uploaded" });
        }

        // Read the uploaded XLSX file.
        const mode = req.query.mode;
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
            const deleteQuery = `DELETE FROM mapping_job RETURNING *;`;
            const deleteResult = await pool.query(deleteQuery);
            deletedCount = deleteResult.rowCount;
            console.log(`🗑️ Deleted ${deletedCount} existing mapping_job records.`);
        }

        const jobIds = [...new Set(data.map(row => row.job_id).filter(job_id => job_id))]; // Extract unique job_ids

        if (jobIds.length === 0) {
            fs.unlinkSync(filePath);
            return res.status(400).json({ error: "No valid job_id found in the file." });
        }

        if (mode === "update") {
            // Fetch existing job_auth records in bulk
            const placeholders = jobIds.map((_, i) => `$${i + 1}`).join(", ");
            const existingRecordsQuery = `SELECT * FROM mapping_job WHERE job_id IN (${placeholders})`;
            const existingRecordsResult = await pool.query(existingRecordsQuery, jobIds);

            // Convert existing records into a map for quick lookup
            const existingRecordsMap = new Map();
            existingRecordsResult.rows.forEach(record => {
                existingRecordsMap.set(record.job_id, record);
            });

            for (const row of data) {
                if (!row.job_id || !row.short_posisi || !row.obid_posisi || !row.company_code || !row.nama_pemangku || !row.nik_pemangku) {
                    console.error("Skipping row due to missing fields:", row);
                    continue;
                }

                const existingRecord = existingRecordsMap.get(row.job_id);

                if (existingRecord) {
                    if (
                        existingRecord.short_posisi !== row.short_posisi ||
                        existingRecord.company_code !== row.company_code ||
                        existingRecord.obid_posisi !== row.obid_posisi ||
                        existingRecord.nama_pemangku !== row.nama_pemangku ||
                        existingRecord.nik_pemangku !== row.nik_pemangku
                    ) {
                        // Update existing record
                        const updateQuery = `
                            UPDATE mapping_job
                            SET company_code = $1, short_posisi = $2, obid_posisi = $3, nama_pemangku = $4, nik_pemangku = $5
                            WHERE job_id = $6 RETURNING *;
                        `;
                        await pool.query(updateQuery, [row.company_code, row.short_posisi, row.obid_posisi, row.nama_pemangku, row.nik_pemangku, row.job_id]);
                        updatedCount++;
                    }
                } else {
                    // Insert new record
                    const insertQuery = `
                        INSERT INTO mapping_job (job_id, company_code, short_posisi, obid_posisi, nama_pemangku, nik_pemangku)
                        VALUES ($1, $2, $3, $4, $5, $6) RETURNING *;
                    `;
                    await pool.query(insertQuery, [parseInt(row.job_id), row.company_code, row.short_posisi, row.obid_posisi, row.nama_pemangku, row.nik_pemangku]);
                    insertedCount++;
                }
            }
        } else if (mode === "overwrite") {
            // Directly insert all records from the uploaded file
            for (const row of data) {
                if (!row.job_id || !row.short_posisi || !row.obid_posisi || !row.company_code || !row.nama_pemangku || !row.nik_pemangku) {
                    console.error("Skipping row due to missing fields:", row);
                    continue;
                }

                const insertQuery = `
                    INSERT INTO mapping_job (job_id, company_code, short_posisi, obid_posisi, nama_pemangku, nik_pemangku)
                    VALUES ($1, $2, $3, $4, $5, $6) RETURNING *;
                `;
                await pool.query(insertQuery, [parseInt(row.job_id), row.company_code, row.short_posisi, row.obid_posisi, row.nama_pemangku, row.nik_pemangku]);
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
        const query = `SELECT * FROM mapping_job WHERE job_id IN (${placeholders})`;
        const existingRecords = await pool.query(query, uniqueJobIds);

        let conflicts = [];
        let conflictingJobIds = []; // Store job_ids that have conflicts
        let totalConflicts = 0;

        data.forEach(row => {
            if (!row.job_id || !row.short_posisi || !row.obid_posisi || !row.company_code || !row.nama_pemangku || !row.nik_pemangku) {
                console.warn("Skipping row due to missing fields:", row);
                return;
            }

            const existingRecord = existingRecords.rows.find(record => record.job_id === row.job_id);
            if (existingRecord) {
                // Check if the new data is different from the existing data
                if (
                    existingRecord.short_posisi !== row.short_posisi ||
                    existingRecord.company_code !== row.company_code ||
                    existingRecord.obid_posisi !== row.obid_posisi ||
                    existingRecord.nama_pemangku !== row.nama_pemangku ||
                    existingRecord.nik_pemangku !== row.nik_pemangku
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

// Download XLSX for Mapping Jobs (still under construction)
async function downloadMappingJobXLSX(req, res) {
    try {
        console.log("🔍 Checking mapping_job table...");

        // Fetch all data from the mapping_job table.
        const result = await pool.query("SELECT * FROM mapping_job;");

        if (result.rows.length === 0) {
            console.warn("⚠️ No data found in mapping_job table.");
            return res.status(404).json({ error: "No records found to export." });
        }

        // Convert the retrieved data into a worksheet.
        const worksheet = xlsx.utils.json_to_sheet(result.rows);
        const workbook = xlsx.utils.book_new();
        xlsx.utils.book_append_sheet(workbook, worksheet, "MappingJobs");

        // Define the file path for the generated XLSX file.
        const filePath = path.join(__dirname, "../downloads/mapping_jobs.xlsx");
        if (!fs.existsSync(path.dirname(filePath))) {
            fs.mkdirSync(path.dirname(filePath), { recursive: true });
        }

        // Write the workbook to the server's file system.
        xlsx.writeFile(workbook, filePath);
        console.log(`✅ XLSX file created at ${filePath}`);

        // Send the file for download.
        res.download(filePath, "mapping_jobs.xlsx", (err) => {
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

// Download Template XLSX for Mapping Jobs
/**
 * Downloads a template XLSX file for mapping jobs.
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 */
async function downloadTemplateMappingJobXLSX(req, res) {
    try {
        // Define the template data (columns without content).
        const templateData = [
            { job_id: '', company_code: '', short_posisi: '', obid_posisi: '', nama_pemangku: '', nik_pemangku: '' }
        ];

        // Convert template data into a worksheet.
        const worksheet = xlsx.utils.json_to_sheet(templateData);
        const workbook = xlsx.utils.book_new();
        xlsx.utils.book_append_sheet(workbook, worksheet, "Template");

        // Define the file path for the template.
        const filePath = path.join(__dirname, "../downloads/mapping_job_template.xlsx");

        // Ensure the downloads directory exists.
        if (!fs.existsSync(path.dirname(filePath))) {
            fs.mkdirSync(path.dirname(filePath), { recursive: true });
        }

        // Write the workbook to the server file system.
        xlsx.writeFile(workbook, filePath);
        console.log(`✅ Template XLSX file created at ${filePath}`);

        // Send the template file for download.
        res.download(filePath, "mapping_job_template.xlsx", (err) => {
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

// Search Mapping Jobs
/**
 * Searches for mapping jobs based on a query string.
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 */
async function searchMappingJob(req, res) {
    const { search } = req.query;

    try {
        // Search mapping jobs based on the query.
        const result = await pool.query(
            `SELECT * FROM mapping_job WHERE 
            CAST(job_id AS TEXT) ILIKE $1 OR 
            short_posisi ILIKE $1 OR 
            obid_posisi ILIKE $1 OR 
            nama_pemangku ILIKE $1 OR 
            nik_pemangku::TEXT ILIKE $1`,
            [`%${search}%`]
        );

        if (result.rows.length === 0) {
            res.status(404).json({ error: 'No matching Mapping Job found' });
        } else {
            res.json(result.rows);
        }
    } catch (error) {
        // Handle errors during the search operation.
        console.error('Error fetching Mapping Job:', error);
        res.status(500).json({ error: 'Error fetching Mapping Job' });
    }
}

// Update Mapping Job
/**
 * Updates an existing mapping job by its obj_id.
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 */
async function updateMappingJob(req, res) {
    const obj_id = parseInt(req.params.obj_id, 10);
    const { job_id, company_code, short_posisi, obid_posisi, nama_pemangku, nik_pemangku } = req.body;

    // Validate the input fields.
    if (isNaN(obj_id) || !job_id || !company_code || !short_posisi || !obid_posisi || !nama_pemangku || !nik_pemangku) {
        console.error("Missing or invalid fields:", { obj_id, job_id, company_code, short_posisi, obid_posisi, nama_pemangku, nik_pemangku });
        return res.status(400).json({ success: false, message: "Missing or invalid required fields" });
    }

    try {
        // Update the mapping job in the database.
        const result = await pool.query(
            `UPDATE mapping_job 
             SET job_id = $1, company_code = $2, short_posisi = $3, obid_posisi = $4, nama_pemangku = $5, nik_pemangku = $6 
             WHERE obj_id = $7 RETURNING *`,
            [job_id, company_code, short_posisi, obid_posisi, nama_pemangku, nik_pemangku, obj_id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Mapping job not found" });
        }
        res.json(result.rows[0]);
    } catch (error) {
        // Handle errors during the update operation.
        console.error("Error updating mapping job:", error);
        res.status(500).json({ error: "Error updating mapping job" });
    }
}

// Get All Mapping Jobs
/**
 * Fetches all mapping jobs from the database.
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 */
async function getAllMappingJobs(req, res) {
    try {
        // Fetch all mapping jobs.
        const result = await pool.query(`SELECT * FROM mapping_job`);
        res.json(result.rows);
    } catch (error) {
        // Handle errors during data fetching.
        console.error("Error getting mapping jobs:", error);
        res.status(500).json({ error: "Error getting mapping jobs" });
    }
}

// Get Mapping Job by ID
/**
 * Fetches a specific mapping job by its obj_id.
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 */
async function getMappingJobById(req, res) {
    const { obj_id } = req.params;

    try {
        // Fetch mapping job by obj_id.
        const result = await pool.query(`SELECT * FROM mapping_job WHERE obj_id = $1`, [obj_id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Mapping job not found" });
        }
        res.json(result.rows[0]);
    } catch (error) {
        // Handle errors during the data retrieval.
        console.error("Error getting mapping job by ID:", error);
        res.status(500).json({ error: "Error getting mapping job by ID" });
    }
}

// Delete Mapping Job
/**
 * Deletes a mapping job by its obj_id.
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 */
async function deleteMappingJob(req, res) {
    const { obj_id } = req.params;

    try {
        // Delete the mapping job.
        const result = await pool.query(
            "DELETE FROM mapping_job WHERE obj_id = $1 RETURNING *",
            [obj_id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Mapping Job not found" });
        }
        res.json({ message: "Mapping Job deleted successfully" });
    } catch (error) {
        // Handle errors during the delete operation.
        console.error("Error deleting mapping job:", error);
        res.status(500).json({ error: "Error deleting mapping job" });
    }
}

async function alterMJ(req, res) {
    const { obj_id } = req.params; // Extract job_id from request parameters

    try {
        // Update the status to 'Non-Active' where job_id matches
        const result = await pool.query(
            'UPDATE mapping_job SET status = $1 WHERE obj_id = $2 RETURNING *',
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
    createMappingJob,
    updateMappingJob,
    getAllMappingJobs,
    getMappingJobById,
    deleteMappingJob,
    uploadMappingJobXLSX,
    downloadMappingJobXLSX,
    downloadTemplateMappingJobXLSX,
    searchMappingJob,
    checkConflictXLSX,
    alterMJ,
    upload
};
