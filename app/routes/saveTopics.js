const express = require('express');
const router = express.Router();
const db = require('../dbms');

router.post("/page/:id/topics", (req, res) => {

    const pageNumber = req.params.id;
    const topics = req.body.topics || [];

    // Step 1. Remove old topics first (clean replace strategy)
    const deleteQuery = `
        DELETE FROM page_topics
        WHERE page_number = ?;
    `;

    db.dbquery(deleteQuery, [pageNumber], (err) => {

        if (err) {
            return res.status(500).json({ error: "Delete topics failed" });
        }

        // If no topics selected → finish early
        if (topics.length === 0) {
            return res.json({ success: true });
        }

        // Step 2. Insert new topics
        const insertQuery = `
            INSERT INTO page_topics (page_number, topic_name)
            VALUES (?, ?);
        `;

        let remaining = topics.length;

        topics.forEach(topic => {

            db.dbquery(insertQuery, [pageNumber, topic], (err2) => {

                if (err2) {
                    console.error(err2);
                }

                remaining--;

                if (remaining === 0) {
                    res.json({ success: true });
                }
            });

        });

    });

});

module.exports = router;