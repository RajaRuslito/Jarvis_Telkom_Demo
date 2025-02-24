const express = require('express');

const {
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
} = require('../jobController/mappingJobController');

const router = express.Router();

const uploadMiddleware = upload.fields([
   { name: "file", maxCount: 1 },
   { name: "job_id", maxCount: 1 },
   { name: "nama_job", maxCount: 1 },
   { name: "deskripsi", maxCount: 1 },
]);

// Route to create a new report
router.post("/create", uploadMiddleware, createMappingJob);

router.put('/:obj_id/update', uploadMiddleware, async (req, res) => {
   await updateMappingJob(req, res);
});

router.get('/', async (req, res) => {
   await getAllMappingJobs(req, res);
});

router.get('/:job_id', async (req, res) => {
   await getMappingJobById(req, res);
});

router.delete('/:obj_id/delete', async (req, res) => {
   await deleteMappingJob(req, res);
});

router.post("/upload-xlsx", upload.single("file"), uploadMappingJobXLSX);

router.get("/all/download", downloadMappingJobXLSX);

router.get('/all/download-template', downloadTemplateMappingJobXLSX);

router.post("/all/search", uploadMiddleware, async (req, res) => {
   await searchMappingJob(req, res);
});

router.post("/check-conflict", upload.single("file"), checkConflictXLSX);

router.put("/:obj_id/alter", async (req, res) => {
   await alterMJ(req, res);
});


module.exports = router;