const express = require ('express');
const router = express.Router();
const db = require('../dbms');

router.delete("/deletePage/:id", async (req, res) => {

    const pageId = req.params.id;

    try {
        await db.dbquery(
            "DELETE FROM pages WHERE page_number = ?",
            [pageId]
        );

        res.json({ success: true });

    } catch (err) {
        res.status(500).json({ message: "Delete failed" });
    }
});

module.exports = router;