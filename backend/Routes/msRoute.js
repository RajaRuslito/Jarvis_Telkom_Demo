const express = require('express');

const {
  createMS,
  MSUpdate,
  getAllMS,
  getMSById,
  deleteMS,
  uploadXLSX, 
  downloadXLSX,
  downloadTemplateXLSX,
  searchMS,
  upload
} = require('../jobDescControllers/msController');

const router = express.Router();

const uploadMiddleware = upload.fields([
   { name: "file", maxCount: 1 },
   { name: "job_id", maxCount: 1 },
   { name: "nama_job", maxCount: 1 },
   { name: "deskripsi", maxCount: 1 },
]);

// Define the route with the middleware
router.post("/create", uploadMiddleware, createMS);

router.put("/:obj_id/update", uploadMiddleware, async (req, res) => {
   await MSUpdate(req, res);
});

router.get('/', async (req, res) => {
   await getAllMS(req, res);
});

router.get('/:job_id', async (req, res) => {
   await getMSById(req, res);
});

router.delete('/:obj_id/delete', async (req, res) => {
   await deleteMS(req, res);
});

router.post("/upload-xlsx", upload.single("file"), uploadXLSX);

router.get("/all/download", downloadXLSX);

router.get('/all/download-template', downloadTemplateXLSX);

router.post("/all/search", uploadMiddleware, async (req, res) => {
   await searchMS(req, res);
});

module.exports = router;