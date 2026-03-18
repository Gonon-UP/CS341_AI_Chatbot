const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const db = require("../dbms");

/* ================================
   MULTER STORAGE
================================ */
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const pageId = req.query.pageId;
    if (!pageId) return cb(new Error("Missing pageId"), null);

    const dir = path.join(process.cwd(), "uploads", pageId);
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const safeName = file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, "_");
    cb(null, safeName);
  }
});

const upload = multer({ storage });

/* ================================
   UPLOAD ROUTE
================================ */
router.post("/uploadDocument", upload.single("document"), (req, res) => {
  const file = req.file;
  const page_number = req.query.pageId;

  if (!file) return res.status(400).json({ error: "No file uploaded" });

  const safeName = file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, "_");

  const filePath = `uploads/${page_number}/${safeName}`;

  const insertQuery = `
    INSERT INTO documents
      (page_number, file_name, original_name, file_path, file_size)
    VALUES (?, ?, ?, ?, ?);
  `;

  db.dbquery(
    insertQuery,
    [page_number, safeName, safeName, filePath, file.size],
    (err) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: "Insert failed" });
      }

      // Return file info so frontend can update the popup list
      res.json({
        success: true,
        document: {
          page_number,
          file_name: safeName,
          original_name: file.originalname,
          file_path: filePath,
          file_size: file.size
        }
      });
    }
  );
});

module.exports = router;
