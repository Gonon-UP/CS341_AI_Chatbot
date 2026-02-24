require('dotenv').config(); // make sure .env variables are loaded

const express = require('express');
const axios = require('axios');
const router = express.Router();

// GET /search?q=...
router.get('/search', async (req, res) => {
  const query = req.query.q;

  // 1️⃣ Check that query exists
  if (!query || query.trim() === "") {
    return res.status(400).json({ error: "No query provided" });
  }

  // 2️⃣ Check that Google API credentials exist
  const apiKey = process.env.GOOGLE_API_KEY;
  const cx = process.env.GOOGLE_CX;

  if (!apiKey || !cx) {
    console.error("Missing GOOGLE_API_KEY or GOOGLE_CX");
    return res.status(500).json({
      error: "Server misconfiguration: Google API key or CX missing"
    });
  }

  // 3️⃣ Log request parameters for debugging
  console.log("Search params:", { key: apiKey, cx, q: query, num: 5 });

  try {
    // 4️⃣ Make request to Google Custom Search
    const response = await axios.get(
      "https://www.googleapis.com/customsearch/v1",
      {
        params: {
          key: apiKey,
          cx: cx,
          q: query,
          num: 5 // number of results
        },
        timeout: 5000 // optional: avoid hanging requests
      }
    );

    // 5️⃣ Map results
    const results = (response.data.items || []).map(item => ({
      title: item.title,
      link: item.link,
      snippet: item.snippet
    }));

    res.json(results);

  } catch (error) {
    // 6️⃣ Print full error from Google API
    console.error("Search error full:", error.response?.data || error.message);
    res.status(500).json({
      error: error.response?.data || "Search failed"
    });
  }
});

module.exports = router;