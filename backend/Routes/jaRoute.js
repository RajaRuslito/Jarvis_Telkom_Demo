const express = require('express');

const {
  createJA,
  jaUpdate,
  getAllJA,
  getJAById,
  deleteJA,
  uploadXLSX, 
  downloadXLSX,
  downloadTemplateXLSX,
  searchJA,
  upload
} = require('../Controllers/jaController');

const router = express.Router();

const uploadMiddleware = upload.fields([
   { name: "file", maxCount: 1 },
   { name: "job_id", maxCount: 1 },
   { name: "nama_job", maxCount: 1 },
   { name: "deskripsi", maxCount: 1 },
]);

// Route to create a new report
router.post("/create", uploadMiddleware, createJA);

router.put('/:job_id/update', uploadMiddleware, async (req, res) => {
   await jaUpdate(req, res);
});

router.get('/', async (req, res) => {
   await getAllJA(req, res);
});

router.get('/:job_id', async (req, res) => {
   await getJAById(req, res);
});

router.delete('/:job_id/delete', async (req, res) => {
   await deleteJA(req, res);
});

router.post("/upload-xlsx", upload.single("file"), uploadXLSX);

router.get("/all/download", downloadXLSX);

router.get('/all/download-template', downloadTemplateXLSX);

router.post("/all/search", uploadMiddleware, async (req, res) => {
   await searchJA(req, res);
});

module.exports = router;