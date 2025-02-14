const express = require('express');

const {
  createJR,
  jrUpdate,
  getAllJR,
  getJRById,
  deleteJR,
  uploadXLSX, 
  downloadXLSX,
  downloadTemplateXLSX,
  searchJR,
  checkConflictXLSX,
  upload
} = require('../jobDescControllers/jrController');

const router = express.Router();

const uploadMiddleware = upload.fields([
   { name: "file", maxCount: 1 },
   { name: "job_id", maxCount: 1 },
   { name: "nama_job", maxCount: 1 },
   { name: "deskripsi", maxCount: 1 },
]);

// Route to create a new report
router.post("/create", uploadMiddleware, createJR);

router.put('/:obj_id/update', uploadMiddleware, async (req, res) => {
   await jrUpdate(req, res);
});

router.get('/', async (req, res) => {
   await getAllJR(req, res);
});

router.get('/:job_id', async (req, res) => {
   await getJRById(req, res);
});

router.delete('/:obj_id/delete', async (req, res) => {
   await deleteJR(req, res);
});

router.post("/upload-xlsx", upload.single("file"), uploadXLSX);

router.get("/all/download", downloadXLSX);

router.get('/all/download-template', downloadTemplateXLSX);

router.post("/all/search", uploadMiddleware, async (req, res) => {
   await searchJR(req, res);
});

router.post("/check-conflict", upload.single("file"), checkConflictXLSX);

module.exports = router;