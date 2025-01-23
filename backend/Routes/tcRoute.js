const express = require('express');

const {
  createTC,
  tcUpdate,
  getAllTC,
  getTCById,
  deleteTC,
  uploadXLSX, 
  downloadXLSX,
  downloadTemplateXLSX,
  searchTC,
  upload
} = require('../jobReqControllers/techCompController');

const router = express.Router();

const uploadMiddleware = upload.fields([
   { name: "file", maxCount: 1 },
   { name: "job_id", maxCount: 1 },
   { name: "nama_job", maxCount: 1 },
   { name: "deskripsi", maxCount: 1 },
]);

// Define the route with the middleware
router.post("/create", uploadMiddleware, createTC);

router.put("/:obj_id/update", uploadMiddleware, async (req, res) => {
   await tcUpdate(req, res);
});

router.get('/', async (req, res) => {
   await getAllTC(req, res);
});

router.get('/:job_id', async (req, res) => {
   await getTCById(req, res);
});

router.delete('/:obj_id/delete', async (req, res) => {
   await deleteTC(req, res);
});

router.post("/upload-xlsx", upload.single("file"), uploadXLSX);

router.get("/all/download", downloadXLSX);

router.get('/all/download-template', downloadTemplateXLSX);

router.post("/all/search", uploadMiddleware, async (req, res) => {
   await searchTC(req, res);
});

module.exports = router;