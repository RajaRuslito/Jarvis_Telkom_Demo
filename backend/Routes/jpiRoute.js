const express = require('express');

const {
  createJPI,
  jpiUpdate,
  getAllJPI,
  getJPIById,
  deleteJPI,
  uploadXLSX, 
  downloadXLSX,
  downloadTemplateXLSX,
  searchJPI,
  checkConflictXLSX,
  upload
} = require('../jobDescControllers/jpiController');

const router = express.Router();

const uploadMiddleware = upload.fields([
   { name: "file", maxCount: 1 },
   { name: "job_id", maxCount: 1 },
   { name: "nama_job", maxCount: 1 },
   { name: "deskripsi", maxCount: 1 },
]);

// Route to create a new report
router.post("/create", uploadMiddleware, createJPI);

router.put('/:obj_id/update', uploadMiddleware, async (req, res) => {
   await jpiUpdate(req, res);
});

router.get('/', async (req, res) => {
   await getAllJPI(req, res);
});

router.get('/:job_id', async (req, res) => {
   await getJPIById(req, res);
});

router.delete('/:obj_id/delete', async (req, res) => {
   await deleteJPI(req, res);
});

router.post("/upload-xlsx", upload.single("file"), uploadXLSX);

router.get("/all/download", downloadXLSX);

router.get('/all/download-template', downloadTemplateXLSX);

router.get("/all/search", uploadMiddleware, async (req, res) => {
   await searchJPI(req, res);
});

router.post("/check-conflict", upload.single("file"), checkConflictXLSX);


module.exports = router;