const express = require("express");
const router = express.Router();
const db = require("../dbms");

/* ================================
   GET URLS FOR A PAGE
================================ */
router.get("/api/urls/:pageNumber", (req, res) => {
  const pageNumber = req.params.pageNumber;

  const query = `
    SELECT url_order, title, url
    FROM urls
    WHERE page_number = ?
    ORDER BY url_order;
  `;

  db.dbquery(query, [pageNumber], (err, results) => {
    if (err) {
      return res.status(500).json({ error: "Fetch failed" });
    }

    res.json({ urls: results });
  });
});

/* ================================
   ADD URL TO PAGE (auto url_order)
================================ */
router.post("/api/save", (req, res) => {
  const { page_number, title, url } = req.body;

  const getOrderQuery = `
    SELECT IFNULL(MAX(url_order), 0) + 1 AS nextOrder
    FROM urls
    WHERE page_number = ?;
  `;

  db.dbquery(getOrderQuery, [page_number], (err, results) => {
    if (err) {
      return res.status(500).json({ error: "DB error" });
    }

    const nextOrder = results[0].nextOrder;

    const insertQuery = `
      INSERT INTO urls (page_number, url_order, title, url)
      VALUES (?, ?, ?, ?);
    `;

    db.dbquery(insertQuery, [page_number, nextOrder, title, url], (err2) => {
      if (err2) {
        return res.status(500).json({ error: "Insert failed" });
      }

      // Keep compatibility with your frontend:
      // your JS expects data.url_order in addSources/addURLDirectly
      res.json({ success: true, url_order: nextOrder });
    });
  });
});

/* ================================
   DELETE URL FROM PAGE
================================ */
router.delete("/api/delete/:pageNumber/:urlOrder", (req, res) => {
  const { pageNumber, urlOrder } = req.params;

  const deleteQuery = `
    DELETE FROM urls
    WHERE page_number = ?
      AND url_order = ?;
  `;

  db.dbquery(deleteQuery, [pageNumber, urlOrder], (err) => {
    if (err) {
      return res.status(500).json({ error: "Delete failed" });
    }

    res.json({ success: true });
  });
});

module.exports = router;
