const express = require('express');
const router = express.Router();
const db = require('../dbms');

router.delete("/api/delete/:pageNumber/:urlOrder", (req, res) => {
	const { pageNumber, urlOrder } = req.params;

	const deleteQuery = `
		DELETE FROM urls
		WHERE page_number = ?
		AND url_order = ?;
	`;

	db.dbquery(deleteQuery, [pageNumber, urlOrder], (err, result) => {
		if(err) {
			return res.status(500).json({ error: "Delete failed" });
		}

		res.json({ success: true });
	});
});

module.exports = router;

