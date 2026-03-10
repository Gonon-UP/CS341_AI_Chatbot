const express = require ('express');
const router = express.Router();
const db = require('../dbms');

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

        await db.query(
            "DELETE FROM pages WHERE page_number=?",
            [pageId]
        );

        await db.query(
            "DELETE FROM urls WHERE page_number=?",
            [pageId]
        );

        res.json({ nextPageId });

    } catch (err) {
        res.status(500).json({ error: "Delete failed" });
    }
});

module.exports = router;
