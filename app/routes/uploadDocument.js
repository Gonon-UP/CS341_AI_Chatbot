const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs").promises;
const db = require("../dbms");

/**
 * IMPORTANT:
 * For multipart/form-data uploads, req.body fields may not be available yet
 * inside multer.diskStorage.destination(). To avoid that race, we pass pageId
 * on the query string: POST /uploadDocument?pageId=123
 */

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    // Read pageId from query string (reliable during multer destination step)
    const pageId = req.query.pageId;

    if (!pageId) {
      return cb(new Error("Missing pageId"));
    }

    const uploadDir = path.join(
      __dirname,
      "../public/documents",
      String(pageId)
    );

    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (err) {
      cb(err);
    }
  },

  filename: (req, file, cb) => {
    // Generate unique filename with timestamp
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
});

router.post("/uploadDocument", upload.single("document"), async (req, res) => {
  // Use the same source of truth as destination()
  const pageId = req.query.pageId;
  const file = req.file;

  // Validation
  if (!pageId || !file) {
    // If multer succeeded in saving a file but pageId is missing, clean up
    if (file?.path) {
      await fs.unlink(file.path).catch(() => {});
    }
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

    // FIX: result is an object (for INSERT), not an array
    res.json({
      message: "Document uploaded successfully",
      documentId: result.insertId,
      fileName: file.originalname,
      fileSize: file.size,
    });
  } catch (err) {
    console.error(err);

    // Cleanup: Delete file if database insert failed (or other error)
    if (file?.path) {
      await fs.unlink(file.path).catch(() => {});
    }

    res.status(500).json({ error: "Upload failed", details: err.message });
  }
});

module.exports = router;
