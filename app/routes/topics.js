const express = require("express");
const router = express.Router();
const db = require("../dbms");

/* ================================
   GET TOPICS FOR A PAGE
================================ */
router.get("/page/:id/topics", (req, res) => {
  const pageNumber = req.params.id;

  const query = `
    SELECT topic_name
    FROM topics
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

/* ================================
   SAVE TOPICS FOR A PAGE (replace)
================================ */
router.post("/page/:id/topics", (req, res) => {
  const pageNumber = req.params.id;
  const topics = req.body.topics || [];

  // Step 1: remove old topics
  const deleteQuery = `
    DELETE FROM topics
    WHERE page_number = ?;
  `;

  db.dbquery(deleteQuery, [pageNumber], (err) => {
    if (err) {
      return res.status(500).json({ error: "Delete topics failed" });
    }

    // No topics selected => done
    if (topics.length === 0) {
      return res.json({ success: true });
    }

    // Step 2: insert new topics
    const insertQuery = `
      INSERT INTO topics (page_number, topic_name)
      VALUES (?, ?);
    `;

    let remaining = topics.length;

    topics.forEach(topic => {
      db.dbquery(insertQuery, [pageNumber, topic], (err2) => {
        if (err2) {
          console.error(err2);
          // If you want to fail-fast instead, replace this with:
          // return res.status(500).json({ error: "Insert topics failed" });
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
