const express = require ('express');
const router = express.Router();
const db = require('../dbms');

router.get("/api/urls/:pageNumber", (req, res) => {
	const pageNumber = req.params.pageNumber;

	const query = `
		SELECT url_order, title, url
		FROM urls
		WHERE page_number = ?
		ORDER BY url_order;
	`;

	db.dbquery(query, [pageNumber], (err, results) => {
		if(err) {
			return res.status(500).json({ error: "Fetch failed" });
		}

		res.json({ urls: results });
	});
});

module.exports = router;

