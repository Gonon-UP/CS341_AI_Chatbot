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
   GET DOCUMENTS FOR A PAGE
================================ */
router.get("/getDocuments", (req, res) => {
  const page_number = req.query.pageId;
  if (!page_number) return res.status(400).json({ error: "Missing pageId" });

  const selectQuery = `
    SELECT document_id, original_name, file_name, file_path, file_size, upload_date
    FROM documents
    WHERE page_number = ?
    ORDER BY upload_date ASC
  `;

  db.dbquery(selectQuery, [page_number], (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: "Database query failed" });
    }

    res.json({ success: true, documents: results });
  });
});

/* ================================
   UPLOAD DOCUMENT
================================ */
router.post("/uploadDocument", upload.single("document"), (req, res) => {
  const file = req.file;
  const page_number = req.query.pageId;

  if (!page_number) return res.status(400).json({ error: "Missing pageId" });
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

/* ================================
   DELETE DOCUMENT (DB + FILE)
================================ */
router.delete("/document/:id", (req, res) => {
  const document_id = req.params.id;

  const getQuery = `SELECT * FROM documents WHERE document_id = ?;`;

  db.dbquery(getQuery, [document_id], (err, results) => {
    if (err || results.length === 0) {
      return res.status(404).json({ error: "Document not found" });
    }

    const doc = results[0];
    const fullPath = path.join(process.cwd(), doc.file_path);

    // Delete file from disk
    fs.unlink(fullPath, (fsErr) => {
      if (fsErr) {
        console.warn("File delete warning:", fsErr.message);
        // continue anyway (DB still needs cleanup)
      }

      const deleteQuery = `DELETE FROM documents WHERE document_id = ?;`;

      db.dbquery(deleteQuery, [document_id], (err2) => {
        if (err2) {
          return res.status(500).json({ error: "Delete failed" });
        }
        res.json({ success: true });
      });
    });
  });
});

module.exports = router;
