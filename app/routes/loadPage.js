const express = require('express');
const router = express.Router();
const db = require('../dbms');

router.get("/page/:id", async (req, res) => {

    try {
        const pageId = req.params.id;

        const [pages] = await db.query(
            "SELECT * FROM pages WHERE page_number=?",
            [pageId]
        );

        const [urls] = await db.query(
            "SELECT page_number, url_order, title, url FROM urls WHERE page_number=? ORDER BY url_order",
            [pageId]
        );

        if (!pages || pages.length === 0) {
            return res.json({
                page: null,
                urls: []
            });
        }

        res.json({
            page: pages[0],
            urls: urls
        });

    } catch (err) {
        console.error(err);

        res.json({
            page: null,
            urls: []
        });
    }
});

module.exports = router;
