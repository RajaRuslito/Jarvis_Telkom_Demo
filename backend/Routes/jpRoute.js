const express = require('express');

const {
  createJP,
  jpUpdate,
  getAllJP,
  getJPById,
  deleteJP,
  uploadXLSX, 
  downloadXLSX,
  downloadTemplateXLSX,
  searchJP,
  upload,
  checkConflictXLSX
} = require('../jobReqControllers/prereqController');

const router = express.Router();

const uploadMiddleware = upload.fields([
   { name: "file", maxCount: 1 },
   { name: "job_id", maxCount: 1 },
   { name: "nama_job", maxCount: 1 },
   { name: "deskripsi", maxCount: 1 },
]);

// Route to create a new report
router.post("/create", uploadMiddleware, createJP);

router.put('/:obj_id/update', uploadMiddleware, async (req, res) => {
   await jpUpdate(req, res);
});

router.get('/', async (req, res) => {
   await getAllJP(req, res);
});

router.get('/:job_id', async (req, res) => {
   await getJPById(req, res);
});

router.delete('/:obj_id/delete', async (req, res) => {
   await deleteJP(req, res);
});

router.post("/upload-xlsx", upload.single("file"), uploadXLSX);

router.get("/all/download", downloadXLSX);

router.get('/all/download-template', downloadTemplateXLSX);

router.post("/all/search", uploadMiddleware, async (req, res) => {
   await searchJP(req, res);
});

router.post("/check-conflict", upload.single("file"), checkConflictXLSX);

module.exports = router;