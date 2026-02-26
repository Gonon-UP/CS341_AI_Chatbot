const express = require('express');
const router = express.Router();
const db = require('../dbms');

router.post("/api/save", (req, res) => {
	const { page_number, title, url } = req.body;

	const getOrderQuery = `
		SELECT INFULL(MAX(url_order), 0) + 1 AS nextOrder
		FROM urls
		WHERE page_number = ${page_number};
	`;

	db.dbquery(getOrderQuery, (err, results) => {
		if(err) {
			return res.status(500).json({ error: "DB error" });
		}
		
		const nextOrder = results[0].nextOrder;

		const insertQuery = `
			INSERT INT urls (page_number, url_order, title, url)
			VALUES (${page_number}, ${nextOrder},
				'${title.replace(/'/g, "\\'")}',
				'${url.replace(/'/g, "\\'")}');
			`;

		db.dbquery(insertQuery, (err2) => {
			if(err2) {
				return res.status(500).json({ error: "Insert failed" });
			}

			res.json({ success: true });
		});
	});
});
