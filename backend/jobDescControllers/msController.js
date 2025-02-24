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
async function createMS(req, res) {
    const job_id = parseInt(req.body.job_id, 10);
    const { nama_job, deskripsi } = req.body;

    // Check if required fields are provided in the request.
    if (!job_id || !nama_job || !deskripsi) {
        console.error("Missing Fields:", { job_id, nama_job, deskripsi });
        return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    try {
        // Check if job_id already exists in the database.
        const checkQuery = `SELECT job_id FROM mission_statement WHERE job_id = $1`;
        const existingJob = await pool.query(checkQuery, [job_id]);

        let operation;
        let result;

        if (existingJob.rows.length > 0) {
            // Update existing mission statement if job_id exists.
            const updateQuery = `
                UPDATE mission_statement
                SET nama_job = $1, deskripsi = $2
                WHERE job_id = $3
                RETURNING *;
            `;
            result = await pool.query(updateQuery, [nama_job, deskripsi, job_id]);
            operation = "updated";
        } else {
            // Insert a new mission statement if job_id does not exist.
            const insertQuery = `
                INSERT INTO mission_statement (job_id, nama_job, deskripsi)
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
            const deleteQuery = `DELETE FROM mission_statement RETURNING *;`;
            const deleteResult = await pool.query(deleteQuery);
            deletedCount = deleteResult.rowCount;
            console.log(`🗑️ Deleted ${deletedCount} existing mission_statement records.`);
        }

        const jobIds = [...new Set(data.map(row => row.job_id).filter(job_id => job_id))];

        if (jobIds.length === 0) {
            fs.unlinkSync(filePath);
            return res.status(400).json({ error: "No valid job_id found in the file." });
        }

        if (mode === "update") {
            // Fetch existing mission_statement records in bulk
            const placeholders = jobIds.map((_, i) => `$${i + 1}`).join(", ");
            const existingRecordsQuery = `SELECT * FROM mission_statement WHERE job_id IN (${placeholders})`;
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
                            UPDATE mission_statement 
                            SET nama_job = $1, deskripsi = $2
                            WHERE job_id = $3 RETURNING *;
                        `;
                        await pool.query(updateQuery, [row.nama_job, row.deskripsi, row.job_id]);
                        updatedCount++;
                    }
                } else {
                    // Insert new record
                    const insertQuery = `
                        INSERT INTO mission_statement (job_id, nama_job, deskripsi)
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
                    INSERT INTO mission_statement (job_id, nama_job, deskripsi)
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

        // Fetch all existing mission_statement records with matching job_ids
        const placeholders = uniqueJobIds.map((_, i) => `$${i + 1}`).join(", ");
        const query = `SELECT * FROM mission_statement WHERE job_id IN (${placeholders})`;
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

// Download XLSX (still under construction)
async function downloadXLSX(req, res) {
    try {
        console.log("🔍 Checking mission_statement table...");

        // Fetch all data from the mission_statement table.
        const result = await pool.query("SELECT * FROM mission_statement;");

        if (result.rows.length === 0) {
            console.warn("⚠️ No data found in mission_statement table.");
            return res.status(404).json({ error: "No records found to export." });
        }

        // Convert the retrieved data into a worksheet.
        const worksheet = xlsx.utils.json_to_sheet(result.rows);
        const workbook = xlsx.utils.book_new();
        xlsx.utils.book_append_sheet(workbook, worksheet, "MissionStatements");

        // Define the file path for the generated XLSX file.
        const filePath = path.join(__dirname, "../downloads/mission_statements.xlsx");
        if (!fs.existsSync(path.dirname(filePath))) {
            fs.mkdirSync(path.dirname(filePath), { recursive: true });
        }

        // Write the workbook to the server's file system.
        xlsx.writeFile(workbook, filePath);
        console.log(`✅ XLSX file created at ${filePath}`);

        // Send the file for download.
        res.download(filePath, "mission_statements.xlsx", (err) => {
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
async function MSUpdate(req, res) {
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
            `UPDATE mission_statement 
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
async function getAllMS(req, res) {
    try {
        // Fetch all mission statements.
        const result = await pool.query(`SELECT * FROM mission_statement`);
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
async function getMSById(req, res) {
    const { job_id } = req.params;

    try {
        // Fetch mission statement by job_id.
        const result = await pool.query(`SELECT * FROM mission_statement WHERE job_id = $1`, [job_id]);

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
async function deleteMS(req, res) {
    const { obj_id } = req.params;

    try {
        // Delete the mission statement.
        const result = await pool.query(
            "DELETE FROM mission_statement WHERE obj_id = $1 RETURNING *",
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
        const filePath = path.join(__dirname, "../downloads/mission_statement_template.xlsx");

        // Ensure the downloads directory exists.
        if (!fs.existsSync(path.dirname(filePath))) {
            fs.mkdirSync(path.dirname(filePath), { recursive: true });
        }

        // Write the workbook to the server file system.
        xlsx.writeFile(workbook, filePath);
        console.log(`✅ Template XLSX file created at ${filePath}`);

        // Send the template file for download.
        res.download(filePath, "mission_statement_template.xlsx", (err) => {
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
async function searchMS(req, res) {
    const { search } = req.query;

    try {
        // Search mission statements based on the query.
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
        // Handle errors during the search operation.
        console.error('Error fetching Mission Statement:', error);
        res.status(500).json({ error: 'Error fetching Mission Statement' });
    }
}

async function alterMS(req, res) {
    const { obj_id } = req.params; // Extract job_id from request parameters

    try {
        // Update the status to 'Non-Active' where job_id matches
        const result = await pool.query(
            'UPDATE mission_statement SET status = $1 WHERE obj_id = $2 RETURNING *',
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
    createMS,
    MSUpdate,
    getAllMS,
    getMSById,
    deleteMS,
    uploadXLSX,
    downloadXLSX,
    downloadTemplateXLSX,
    searchMS,
    checkConflictXLSX,
    alterMS,
    upload
};
