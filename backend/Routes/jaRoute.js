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
  checkConflictXLSX,
  upload,
  alterJA
} = require('../jobDescControllers/jaController');

const router = express.Router();

const uploadMiddleware = upload.fields([
   { name: "file", maxCount: 1 },
   { name: "job_id", maxCount: 1 },
   { name: "nama_job", maxCount: 1 },
   { name: "deskripsi", maxCount: 1 },
]);

// Route to create a new report
router.post("/create", uploadMiddleware, createJA);

router.put('/:obj_id/update', uploadMiddleware, async (req, res) => {
   await jaUpdate(req, res);
});

router.get('/', async (req, res) => {
   await getAllJA(req, res);
});

router.get('/:job_id', async (req, res) => {
   await getJAById(req, res);
});

router.delete('/:obj_id/delete', async (req, res) => {
   await deleteJA(req, res);
});

router.post("/upload-xlsx", upload.single("file"), uploadXLSX);

router.get("/all/download", downloadXLSX);

router.get('/all/download-template', downloadTemplateXLSX);

router.post("/all/search", uploadMiddleware, async (req, res) => {
   await searchJA(req, res);
});

router.post("/check-conflict", upload.single("file"), checkConflictXLSX);

router.put("/:obj_id/alter", async (req, res) => {
   await alterJA(req, res);
});

module.exports = router;