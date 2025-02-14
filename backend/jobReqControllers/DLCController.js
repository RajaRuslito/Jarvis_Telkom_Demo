const multer = require("multer");
const pool = require('../db');
const upload = require("../middleware/multer");
const xlsx = require("xlsx");
const path = require("path");
const fs = require("fs");

// Create DLC
/**
 * Creates a new DLC or updates an existing one.
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
            // Update existing DLC if job_id exists.
            const updateQuery = `
                UPDATE dlc
                SET nama_job = $1, deskripsi = $2
                WHERE job_id = $3
                RETURNING *;
            `;
            result = await pool.query(updateQuery, [nama_job, deskripsi, job_id]);
            operation = "updated";
        } else {
            // Insert a new DLC if job_id does not exist.
            const insertQuery = `
                INSERT INTO dlc (job_id, nama_job, deskripsi)
                VALUES ($1, $2, $3)
                RETURNING *;
            `;
            result = await pool.query(insertQuery, [job_id, nama_job, deskripsi]);
            operation = "created";
        }

        // Respond with success message.
        console.log(`✅ DLC ${operation} for job_id: ${job_id}`);
        res.status(201).json({
            success: true,
            message: `DLC ${operation} successfully`,
            data: result.rows[0],
        });
    } catch (error) {
        // Handle errors during the database operation.
        console.error("Error creating DLC:", error.message);
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
            const deleteQuery = `DELETE FROM dlc RETURNING *;`;
            const deleteResult = await pool.query(deleteQuery);
            deletedCount = deleteResult.rowCount;
            console.log(`🗑️ Deleted ${deletedCount} existing dlc records.`);
        }

        const jobIds = [...new Set(data.map(row => row.job_id).filter(job_id => job_id))];

        if (jobIds.length === 0) {
            fs.unlinkSync(filePath);
            return res.status(400).json({ error: "No valid job_id found in the file." });
        }

        if (mode === "update") {
            // Fetch existing dlc records in bulk
            const placeholders = jobIds.map((_, i) => `$${i + 1}`).join(", ");
            const existingRecordsQuery = `SELECT * FROM dlc WHERE job_id IN (${placeholders})`;
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
                            UPDATE dlc 
                            SET nama_job = $1, deskripsi = $2
                            WHERE job_id = $3 RETURNING *;
                        `;
                        await pool.query(updateQuery, [row.nama_job, row.deskripsi, row.job_id]);
                        updatedCount++;
                    }
                } else {
                    // Insert new record
                    const insertQuery = `
                        INSERT INTO dlc (job_id, nama_job, deskripsi)
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
                    INSERT INTO dlc (job_id, nama_job, deskripsi)
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
 * Check for conflicts in the uploaded XLSX file before inserting/updating dlc data.
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

        // Fetch all existing dlc records with matching job_ids
        const placeholders = uniqueJobIds.map((_, i) => `$${i + 1}`).join(", ");
        const query = `SELECT * FROM dlc WHERE job_id IN (${placeholders})`;
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
        xlsx.utils.book_append_sheet(workbook, worksheet, "DLC");

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

// Update DLC
/**
 * Updates an existing DLC by its obj_id.
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
        // Update the DLC in the database.
        const result = await pool.query(
            `UPDATE dlc 
             SET nama_job = $1, deskripsi = $2 
             WHERE obj_id = $3 RETURNING *`,
            [nama_job, deskripsi, obj_id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "DLC not found" });
        } else {
            res.json(result.rows[0]);
        }
    } catch (error) {
        // Handle errors during the update operation.
        console.error("Error updating DLC:", error);
        res.status(500).json({ error: "Error updating DLC" });
    }
}

// Get All DLCs
/**
 * Fetches all DLCs from the database.
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 */
async function getAllDLC(req, res) {
    try {
        // Fetch all DLCs.
        const result = await pool.query(`SELECT * FROM dlc`);
        res.json(result.rows);
    } catch (error) {
        // Handle errors during data fetching.
        console.error("Error getting DLCs:", error);
        res.status(500).json({ error: "Error getting DLCs" });
    }
}

// Get DLC by ID
/**
 * Fetches a specific DLC by its job_id.
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 */
async function getDLCById(req, res) {
    const { job_id } = req.params;

    try {
        // Fetch DLC by job_id.
        const result = await pool.query(`SELECT * FROM dlc WHERE job_id = $1`, [job_id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "DLC not found" });
        }
        res.json(result.rows[0]);
    } catch (error) {
        // Handle errors during the data retrieval.
        console.error("Error getting DLC by ID:", error);
        res.status(500).json({ error: "Error getting DLC by ID" });
    }
}

// Delete DLC
/**
 * Deletes a DLC by its obj_id.
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 */
async function deleteDLC(req, res) {
    const { obj_id } = req.params;

    try {
        // Delete the DLC.
        const result = await pool.query(
            "DELETE FROM dlc WHERE obj_id = $1 RETURNING *",
            [obj_id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "DLC not found" });
        }
        res.json({ message: "DLC deleted successfully" });
    } catch (error) {
        // Handle errors during the delete operation.
        console.error("Error deleting DLC:", error);
        res.status(500).json({ error: "Error deleting DLC" });
    }
}

// Download Template XLSX
/**
 * Downloads a template XLSX file for DLCs.
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

// Search DLCs
/**
 * Searches for DLCs based on a query string.
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 */
async function searchDLC(req, res) {
    const { search } = req.query;

    try {
        // Search DLCs based on the query.
        const result = await pool.query(
            `SELECT * FROM dlc WHERE 
            CAST(job_id AS TEXT) ILIKE $1 OR 
            nama_job ILIKE $1 OR 
            deskripsi ILIKE $1`,
            [`%${search}%`]
        );

        if (result.rows.length === 0) {
            res.status(404).json({ error: 'No matching DLC found' });
        } else {
            res.json(result.rows);
        }
    } catch (error) {
        // Handle errors during the search operation.
        console.error('Error fetching DLC:', error);
        res.status(500).json({ error: 'Error fetching DLC' });
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
    checkConflictXLSX,
    upload
};
