const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const db = require('../dbms');

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: async (req, file, cb) => {
        const pageId = req.body.pageId;
        const uploadDir = path.join(__dirname, '../public/documents', pageId.toString());
        
        try {
            await fs.mkdir(uploadDir, { recursive: true });
            cb(null, uploadDir);
        } catch (err) {
            cb(err);
        }
    },
    filename: (req, file, cb) => {
        // Generate unique filename with timestamp
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ 
    storage: storage,
    limits: {
        fileSize: 50 * 1024 * 1024 // 50MB limit
    }
});

router.post("/uploadDocument", upload.single('document'), async (req, res) => {
    const pageId = req.body.pageId;
    const file = req.file;

    // Validation
    if (!pageId || !file) {
        return res.status(400).json({ error: "Missing pageId or file" });
    }

    try {
        // Verify page exists
        const [pages] = await db.query(
            "SELECT page_number FROM pages WHERE page_number = ?",
            [pageId]
        );

        if (pages.length === 0) {
            // Delete uploaded file if page doesn't exist
            await fs.unlink(file.path).catch(() => {});
            return res.status(404).json({ error: "Page not found" });
        }

        // Insert document metadata into database
        const [result] = await db.query(
            "INSERT INTO documents (page_number, file_name, original_name, file_path, file_size) VALUES (?, ?, ?, ?, ?)",
            [pageId, file.filename, file.originalname, file.path, file.size]
        );

        res.json({
            message: "Document uploaded successfully",
            documentId: result[0].insertId,
            fileName: file.originalname,
            fileSize: file.size
        });

    } catch (err) {
        console.error(err);
        
        // Cleanup: Delete file if database insert failed
        if (file) {
            await fs.unlink(file.path).catch(() => {});
        }

        res.status(500).json({ error: "Upload failed", details: err.message });
    }
});

module.exports = router;
