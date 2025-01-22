const multer = require("multer");
const path = require("path");

// Set storage engine
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "uploads/"); // Uploads directory
    },
    filename: function (req, file, cb) {
        cb(null, file.fieldname + "-" + Date.now() + path.extname(file.originalname));
    }
});

// File type validation
const fileFilter = (req, file, cb) => {
    const fileTypes = /xlsx|xls/;
    const extname = fileTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = file.mimetype === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
                     file.mimetype === "application/vnd.ms-excel";

    if (extname && mimetype) {
        return cb(null, true);
    } else {
        cb(new Error("Only .xlsx and .xls files are allowed!"));
    }
};

// Initialize multer
const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB max file size
});

module.exports = upload;
