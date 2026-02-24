require('dotenv').config(); // make sure .env variables are loaded

const express = require('express');
const axios = require('axios');
const router = express.Router();

// GET /search?q=...
router.get('/search', async (req, res) => {
  const query = req.query.q;
  
  // 1. Define the variable from process.env
  const braveKey = process.env.BRAVE_API_KEY;

  if (!query || query.trim() === "") {
    return res.status(400).json({ error: "No query provided" });
  }

  // 2. Now the check works because braveKey is defined
  if (!braveKey) {
    console.error("Missing BRAVE_API_KEY in .env");
    return res.status(500).json({ error: "Server misconfiguration: Key missing" });
  }

  try {
    // 3. Added the full path to the URL
    const response = await axios.get("https://api.search.brave.com/res/v1/web/search", {
        params: { 
            q: query, 
            count: 5 
        },
        headers: {
            // Using .trim() to ensure no hidden spaces from .env break the token
            'X-Subscription-Token': braveKey.trim(),
            'Accept': 'application/json'
        }
    });

    // 4. Map the results safely
    const results = (response.data.web?.results || []).map(item => ({
      title: item.title,
      link: item.url,
      snippet: item.description
    }));

    res.json(results);

  } catch (error) {
    if (error.response) {
        // This will now show the EXACT reason Brave rejects the request
        console.error("BRAVE ERROR DATA:", error.response.data);
        console.error("BRAVE STATUS:", error.response.status);
    } else {
        console.error("SERVER ERROR:", error.message);
    }
    res.status(500).json({ error: "Search failed" });
  }
});


module.exports = router;