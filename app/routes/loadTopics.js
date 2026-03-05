const express = require('express');
const router = express.Router();
const db = require('../dbms');

router.get("/page/:id/topics", (req, res) => {

    const pageNumber = req.params.id;

    const query = `
        SELECT topic_name
        FROM page_topics
        WHERE page_number = ?;
    `;

    db.dbquery(query, [pageNumber], (err, results) => {

        if (err) {
            return res.status(500).json({ error: "Load topics failed" });
        }

        res.json({
            topics: results.map(r => r.topic_name)
        });

    });

});

module.exports = router;