const express = require("express");
const router = express.Router();
const db = require("../dbms");
const fs = require("fs");
const path = require("path");

router.delete("/document/:id", (req, res) => {
  const document_id = req.params.id;

  const getQuery = `
    SELECT * FROM documents WHERE document_id = ?;
  `;

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

      const deleteQuery = `
        DELETE FROM documents WHERE document_id = ?;
      `;

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
