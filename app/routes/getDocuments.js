const express = require("express");
const router = express.Router();
const db = require("../dbms");

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

module.exports = router;