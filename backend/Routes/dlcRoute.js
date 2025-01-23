const express = require('express');

const {
  createDLC,
  DLCUpdate,
  getAllDLC,
  getDLCById,
  deleteDLC,
  uploadXLSX, 
  downloadXLSX,
  downloadTemplateXLSX,
  searchDLC,
  upload
} = require('../jobReqControllers/DLCController');

const router = express.Router();

const uploadMiddleware = upload.fields([
   { name: "file", maxCount: 1 },
   { name: "job_id", maxCount: 1 },
   { name: "nama_job", maxCount: 1 },
   { name: "deskripsi", maxCount: 1 },
]);

// Route to create a new report
router.post("/create", uploadMiddleware, createDLC);

router.put('/:obj_id/update', uploadMiddleware, async (req, res) => {
   await DLCUpdate(req, res);
});

router.get('/', async (req, res) => {
   await getAllDLC(req, res);
});

router.get('/:job_id', async (req, res) => {
   await getDLCById(req, res);
});

router.delete('/:obj_id/delete', async (req, res) => {
   await deleteDLC(req, res);
});

router.post("/upload-xlsx", upload.single("file"), uploadXLSX);

router.get("/all/download", downloadXLSX);

router.get('/all/download-template', downloadTemplateXLSX);

router.post("/all/search", uploadMiddleware, async (req, res) => {
   await searchDLC(req, res);
});

module.exports = router;