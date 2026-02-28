const express = require ('express');
const router = express.Router();
const db = require('../dbms');

router.get("/pages", async (req, res) => {
    try {
        const [pages] = await db.query(
            "SELECT page_number, title FROM pages ORDER BY page_number DESC"
        );

        res.json(pages);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Error fetching pages." });
    }
});

module.exports = router;