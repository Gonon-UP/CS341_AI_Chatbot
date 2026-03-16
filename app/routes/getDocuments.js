const express = require('express');
const router = express.Router();
const db = require('../dbms');

router.get("/getDocuments/:pageId", async (req, res) => {
    const pageId = req.params.pageId;

    try {
        // Get all documents for this page
        const [documents] = await db.query(
            "SELECT document_id, page_number, original_name, file_size, upload_date FROM documents WHERE page_number = ? ORDER BY upload_date DESC",
            [pageId]
        );

        res.json({
            documents: documents
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to fetch documents", details: err.message });
    }
});

module.exports = router;
