const express = require('express');

const {
  createJC,
  jcUpdate,
  getAllJC,
  getJCById,
  deleteJC,
  uploadXLSX, 
  downloadXLSX,
  downloadTemplateXLSX,
  searchJC,
  upload
} = require('../jobController/createJobController');

const router = express.Router();

const uploadMiddleware = upload.fields([
   { name: "file", maxCount: 1 },
   { name: "job_id", maxCount: 1 },
   { name: "nama_job", maxCount: 1 },
   { name: "company_code", maxCount: 1 },
   { name: "band", maxCount: 1 },
   { name: "flag_mgr", maxCount: 1 },
]);

// Route to create a new report
router.post("/create", uploadMiddleware, createJC);

router.put('/:obj_id/update', uploadMiddleware, async (req, res) => {
   await jcUpdate(req, res);
});

router.get('/', async (req, res) => {
   await getAllJC(req, res);
});

router.get('/:job_id', async (req, res) => {
   await getJCById(req, res);
});

router.delete('/:obj_id/delete', async (req, res) => {
   await deleteJC(req, res);
});

router.post("/upload-xlsx", upload.single("file"), uploadXLSX);

router.get("/all/download", downloadXLSX);

router.get('/all/download-template', downloadTemplateXLSX);

router.post("/all/search", uploadMiddleware, async (req, res) => {
   await searchJC(req, res);
});

module.exports = router;