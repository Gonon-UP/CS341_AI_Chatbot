const express = require ('express');
const router = express.Router();
const db = require('../dbms');

router.post("/page/:pageId/title", async (req, res) => {

  const pageId = req.params.pageId;
  const { title } = req.body;

  await db.query(
    "UPDATE pages SET title=? WHERE page_number=?",
    [title, pageId]
  );

  res.json({ success: true });
});

module.exports = router;
