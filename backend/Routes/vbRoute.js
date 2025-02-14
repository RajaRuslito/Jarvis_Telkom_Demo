const express = require('express');

const {
  createVB,
  vbUpdate,
  getAllVB,
  getVBById,
  deleteVB,
  uploadXLSX, 
  downloadXLSX,
  downloadTemplateXLSX,
  searchVB,
  checkConflictXLSX,
  upload
} = require('../jobReqControllers/valBelController');

const router = express.Router();

const uploadMiddleware = upload.fields([
   { name: "file", maxCount: 1 },
   { name: "job_id", maxCount: 1 },
   { name: "nama_job", maxCount: 1 },
   { name: "deskripsi", maxCount: 1 },
]);

// Route to create a new report
router.post("/create", uploadMiddleware, createVB);

router.put('/:obj_id/update', uploadMiddleware, async (req, res) => {
   await vbUpdate(req, res);
});

router.get('/', async (req, res) => {
   await getAllVB(req, res);
});

router.get('/:job_id', async (req, res) => {
   await getVBById(req, res);
});

router.delete('/:obj_id/delete', async (req, res) => {
   await deleteVB(req, res);
});

router.post("/upload-xlsx", upload.single("file"), uploadXLSX);

router.get("/all/download", downloadXLSX);

router.get('/all/download-template', downloadTemplateXLSX);

router.post("/all/search", uploadMiddleware, async (req, res) => {
   await searchVB(req, res);
});

router.post("/check-conflict", upload.single("file"), checkConflictXLSX);

module.exports = router;