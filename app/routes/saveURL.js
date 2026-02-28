const express = require('express');
const router = express.Router();
const db = require('../dbms');

router.post("/api/save", (req, res) => {
	const { page_number, title, url } = req.body;

	const getOrderQuery = `
		SELECT IFNULL(MAX(url_order), 0) + 1 AS nextOrder
		FROM urls
		WHERE page_number = ?;
	`;

	db.dbquery(getOrderQuery, [page_number], (err, results) => {
		if(err) {
			return res.status(500).json({ error: "DB error" });
		}
		
		const nextOrder = results[0].nextOrder;

		const insertQuery = `
			INSERT INTO urls (page_number, url_order, title, url)
			VALUES (?, ?, ?, ?);
		`;

		db.dbquery(insertQuery, [page_number, nextOrder, title, url], (err2) => {
			if(err2) {
				return res.status(500).json({ error: "Insert failed" });
			}

			res.json({ success: true });
		});
	});
});

module.exports = router;

