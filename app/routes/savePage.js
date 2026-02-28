const express = require ('express');
const router = express.Router();
const db = require('../dbms');

router.post("/savePage", async (req, res) => {
    const { title, urls } = req.body;

    try {
        // Insert into pages
        const [pageResult] = await db.query(
            "INSERT INTO pages (title) VALUES (?)",
            [title]
        );

        const pageNumber = pageResult.insertId;

        // Insert URLs
        for (let i = 0; i < urls.length; i++) {
            await db.query(
                "INSERT INTO urls (page_number, url_order, title, url) VALUES (?, ?, ?, ?)",
                [pageNumber, i + 1, urls[i].title, urls[i].url]
            );
        }

        res.json({
	    message: "Saved successfully!",
	    pageId: pageNumber
	});

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Database error." });
    }
});

module.exports = router;
