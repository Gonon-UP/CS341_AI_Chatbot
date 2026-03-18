const express = require('express');
const router = express.Router();
const db = require('../dbms');
const fs = require('fs').promises;
const path = require('path');

router.delete("/page/:id", async (req, res) => {
    const pageId = req.params.id;

    try {
        // Find pages to determine nextPageId
        const [pages] = await db.query("SELECT page_number FROM pages ORDER BY page_number");
        const index = pages.findIndex(p => p.page_number == pageId);
        let nextPageId = null;
        if (index !== -1) {
            if (index + 1 < pages.length) nextPageId = pages[index + 1].page_number;
            else if (index > 0) nextPageId = pages[index - 1].page_number;
        }

        // Delete the uploads folder for this page
        const uploadDir = path.join(__dirname, "../uploads", pageId.toString());
        try {
            await fs.rm(uploadDir, { recursive: true, force: true });
            console.log(`Deleted uploads folder: ${uploadDir}`);
        } catch (err) {
            console.warn("Uploads folder already deleted or not found:", uploadDir);
        }

        // Delete documents from DB (optional if ON DELETE CASCADE)
        await db.query("DELETE FROM documents WHERE page_number=?", [pageId]);

        // Delete page record
        await db.query("DELETE FROM pages WHERE page_number=?", [pageId]);

        res.json({ nextPageId });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Delete failed", details: err.message });
    }
});

module.exports = router;
