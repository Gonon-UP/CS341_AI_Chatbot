const express = require("express");
const router = express.Router();
const db = require("../dbms");
const fs = require("fs").promises;
const path = require("path");

/* ================================
   GET ALL PAGES (Previous Meetings)
================================ */
router.get("/pages", async (req, res) => {
  try {
    const [pages] = await db.query(
      "SELECT page_number, title FROM pages ORDER BY page_number"
    );
    res.json(pages);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

/* ================================
   GET ONE PAGE (title + urls)
================================ */
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
      return res.status(404).json({ error: "Not found" });
    }

    res.json({
      page: pages[0],
      urls
    });
  } catch (err) {
    console.error(err);
    if (!res.headersSent) {
      res.status(500).json({ error: "Server error" });
    }
  }
});

/* ================================
   CREATE NEW PAGE (and optional urls)
================================ */
router.post("/savePage", async (req, res) => {
  const { title, urls } = req.body;

  try {
    const [pageResult] = await db.query(
      "INSERT INTO pages (title) VALUES (?)",
      [title]
    );

    const pageNumber = pageResult.insertId;

    for (let i = 0; i < (urls || []).length; i++) {
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

/* ================================
   UPDATE PAGE TITLE
================================ */
router.post("/page/:pageId/title", async (req, res) => {
  try {
    const pageId = req.params.pageId;
    const { title } = req.body;

    await db.query(
      "UPDATE pages SET title=? WHERE page_number=?",
      [title, pageId]
    );

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Update title failed" });
  }
});

/* ================================
   DELETE PAGE (and its uploads/docs)
================================ */
router.delete("/page/:id", async (req, res) => {
  const pageId = req.params.id;

  try {
    const [pages] = await db.query(
      "SELECT page_number FROM pages ORDER BY page_number"
    );

    const index = pages.findIndex(p => p.page_number == pageId);

    let nextPageId = null;
    if (index !== -1) {
      if (index + 1 < pages.length) nextPageId = pages[index + 1].page_number;
      else if (index > 0) nextPageId = pages[index - 1].page_number;
    }

    const uploadDir = path.join(__dirname, "../uploads", pageId.toString());
    try {
      await fs.rm(uploadDir, { recursive: true, force: true });
      console.log(`Deleted uploads folder: ${uploadDir}`);
    } catch (err) {
      console.warn("Uploads folder already deleted or not found:", uploadDir);
    }

    await db.query("DELETE FROM documents WHERE page_number=?", [pageId]);
    await db.query("DELETE FROM pages WHERE page_number=?", [pageId]);

    res.json({ nextPageId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Delete failed", details: err.message });
  }
});

module.exports = router;
