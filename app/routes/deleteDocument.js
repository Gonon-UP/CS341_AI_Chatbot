const express = require("express");
const router = express.Router();
const path = require("path");
const fs = require("fs").promises;
const db = require("../dbms");

/**
 * DELETE /document/:documentId
 * - Deletes the document row from the DB
 * - Deletes the file from disk (app/public/documents/<pageId>/...)
 */
router.delete("/document/:documentId", async (req, res) => {
  const documentId = req.params.documentId;

  if (!documentId) {
    return res.status(400).json({ error: "Missing documentId" });
  }

  try {
    // 1) Look up the document so we know what file to delete
    const [rows] = await db.query(
      "SELECT document_id, file_path FROM documents WHERE document_id = ?",
      [documentId]
    );

    if (!rows || rows.length === 0) {
      return res.status(404).json({ error: "Document not found" });
    }

    const doc = rows[0];

    // 2) Delete DB row first (so it disappears from UI even if file deletion fails)
    await db.query("DELETE FROM documents WHERE document_id = ?", [documentId]);

    // 3) Delete the file from disk (ignore errors if it's already missing)
    if (doc.file_path) {
      // Safety: normalize to avoid weird paths
      const filePath = path.normalize(doc.file_path);
      await fs.unlink(filePath).catch(() => {});
    }

    return res.json({ message: "Document deleted successfully" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Delete failed", details: err.message });
  }
});

module.exports = router;
