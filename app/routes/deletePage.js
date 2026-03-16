const express = require('express');
const router = express.Router();
const db = require('../dbms');
const fs = require('fs').promises;
const path = require('path');

router.delete("/page/:id", async (req, res) => {

    const pageId = req.params.id;

    try {

        const [pages] = await db.query(
            "SELECT page_number FROM pages ORDER BY page_number"
        );

        const index = pages.findIndex(p => p.page_number == pageId);

        let nextPageId = null;

        if (index !== -1) {
            if (index + 1 < pages.length) {
                nextPageId = pages[index + 1].page_number;
            } else if (index > 0) {
                nextPageId = pages[index - 1].page_number;
            }
        }

        // Get all documents for this page (to delete files)
        const [documents] = await db.query(
            "SELECT file_path FROM documents WHERE page_number = ?",
            [pageId]
        );

        // Delete all files associated with this page
        for (const doc of documents) {
            try {
                await fs.unlink(doc.file_path);
            } catch (err) {
                console.warn("File already deleted or not found:", doc.file_path);
            }
        }

        // Delete documents directory for this page
        const docDir = path.join(__dirname, '../public/documents', pageId.toString());
        try {
            await fs.rm(docDir, { recursive: true, force: true });
        } catch (err) {
            console.warn("Directory already deleted or not found:", docDir);
        }

        // Delete database records (ON DELETE CASCADE will handle documents table)
        await db.query(
            "DELETE FROM pages WHERE page_number=?",
            [pageId]
        );

        res.json({ nextPageId });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Delete failed", details: err.message });
    }
});

module.exports = router;
