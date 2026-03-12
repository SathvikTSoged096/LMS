const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure upload directory exists
const isVercel = !!process.env.VERCEL;
const uploadDir = isVercel
    ? path.join('/tmp', 'uploads')
    : path.join(__dirname, '..', '..', 'public', 'uploads');

try {
    if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
        console.log(`Upload directory created at: ${uploadDir}`);
    }
} catch (err) {
    console.warn('Warning: Could not create upload directory. Native uploads might fail.', err.message);
}

// Configure multer storage
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir)
    },
    filename: function (req, file, cb) {
        // Create a unique filename: timestamp-random.ext
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

// File filter to accept ONLY pdf files
const fileFilter = (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
        cb(null, true);
    } else {
        cb(new Error('Only PDF files are allowed!'), false);
    }
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Route: POST /api/upload
// Note: We don't strictly protect this route for now, but in a real app we might `router.use(protect)`
router.post('/', upload.single('document'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded or invalid file type.' });
        }

        // Return the static file URL path (e.g., /uploads/document-1234.pdf)
        const fileUrl = `/uploads/${req.file.filename}`;
        res.status(200).json({
            message: 'File uploaded successfully',
            url: fileUrl
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error during upload', error: error.message });
    }
});

module.exports = router;
