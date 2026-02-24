const titleArea = document.getElementById("titleArea");
const messageArea = document.getElementById("messageArea");
const textArea = document.getElementById("textBox");
const sendBtn = document.getElementById("sendButton"); 

// Title textbox at top of page
titleArea.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();      // stop newline
    titleArea.blur();        // exits the box (removes focus)
  }
})

// adds messages to the messageArea (display)
function addMessage(text, type = "user") {
  const msg = document.createElement("div");
  msg.className = `message ${type}`;
  msg.textContent = text;

  messageArea.appendChild(msg);

  // auto scroll to bottom
  messageArea.scrollTop = messageArea.scrollHeight;
}

// sends messages somewhere (implement better later)
async function sendMessage() {
    if (!textArea.value.trim()) return;

    // Disable textArea & button while bot responds
    textArea.disabled = true;
    sendBtn.disabled = true;

    const userQuery = textArea.value;
    textArea.value = "";

    // Show user message using your bubble function
    addMessage(userQuery, "user");

    // Optional: typing indicator
    addMessage("Bot is typing...", "typing");

    try {
        // Simulate bot response (replace with your API call)
        const botReply = await getBotReply(userQuery);

        // Remove typing indicator
        const typingEl = messageArea.querySelector(".typing");
        if (typingEl) typingEl.remove();

        // Show bot reply in a bubble
        addMessage(botReply, "bot");
    } catch (err) {
        console.error(err);
    } finally {
        // Re-enable textArea & sendBtn
        textArea.disabled = false;
        sendBtn.disabled = false;
        textArea.focus();
    }
}

// Example async bot function
async function getBotReply(query) {
    // Replace this with your actual bot API call
    return new Promise(resolve => {
        setTimeout(() => resolve("This is a reply to: " + query), 1000);
    });
}

/* Enter key support */
textArea.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    sendMessage();

    // Make button light up when textArea sends a message
    const originalColor = sendBtn.style.borderColor;
  
    // Change to highlight color (triggers transition)
    sendBtn.style.borderColor = 'white'; 

    setTimeout(() => {
      // Revert to original (triggers transition back)
      sendBtn.style.borderColor = originalColor;
    }, 200);
  }

  const box = document.querySelector(".text-box");
})

async function addSources() {
    const overlay = document.getElementById("popupOverlay");

    const response = await fetch("popups/addSources.html");
    const html = await response.text();

    overlay.innerHTML = html;
    overlay.style.display = "flex";

    // Existing listeners
    overlay.querySelector("#addBtn").addEventListener("click", saveSource);
    overlay.querySelector("#cancelBtn").addEventListener("click", closePopup);

    // 🔥 NEW: Search listeners
    const searchBox = overlay.querySelector("#webSearch");
    const searchBtn = overlay.querySelector("#searchBtn");

    searchBtn.addEventListener("click", performSearch);

    searchBox.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
            e.preventDefault();
            performSearch();
        }
    });
}

async function performSearch() {
    const overlay = document.getElementById("popupOverlay");
    const query = overlay.querySelector("#webSearch").value.trim();
    const resultsContainer = overlay.querySelector("#searchResults");

    if (!query) return;

    resultsContainer.innerHTML = "Searching...";

    try {
        const response = await fetch(`/search?q=${encodeURIComponent(query)}`);
        const data = await response.json();

        resultsContainer.innerHTML = "";

        data.forEach(result => {
            const card = document.createElement("div");
            card.className = "result-card";

            card.innerHTML = `
                <a href="${result.link}" target="_blank" class="result-title">
                    ${result.title}
                </a>
                <div class="result-snippet">${result.snippet}</div>
            `;

            resultsContainer.appendChild(card);
        });

    } catch (err) {
        resultsContainer.innerHTML = "Search failed.";
    }
}

// Close popup function
function closePopup() {
    const overlay = document.getElementById("popupOverlay");
    overlay.style.display = "none";
    overlay.innerHTML = ""; // clear content
}

// Save source function
async function saveSource() {
    const input = document.getElementById("sourceInput");
    const url = input.value.trim();
    if (!url) return;

    let pageTitle = url; // fallback

    try {
        // Try to fetch the page HTML to get <title>
        const response = await fetch(url, { mode: 'cors' });
        const htmlText = await response.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlText, "text/html");
        pageTitle = doc.querySelector("title")?.innerText || url;
    } catch (err) {
        console.warn("Could not fetch title, using URL instead.");
    }

    // Create a source box
    const panel = document.getElementById("sourcesPanel");
    const box = document.createElement("div");
    box.className = "source-box";

    // Add title text
    const text = document.createElement("span");
    text.textContent = pageTitle;

    // Add remove button
    const removeBtn = document.createElement("button");
    removeBtn.textContent = "×"; // X character
    removeBtn.className = "remove-source";
    removeBtn.onclick = () => box.remove(); // remove the box when clicked

    box.appendChild(text);
    box.appendChild(removeBtn);

    // Insert the new source box **after the button**
    const addBtn = panel.querySelector(".custom-button");
    panel.insertBefore(box, addBtn.nextSibling);

    // Clear input and close popup
    input.value = "";
    closePopup();
}

// Optional: click outside popup to close
document.getElementById("popupOverlay").addEventListener("click", (e) => {
    if (e.target.id === "popupOverlay") closePopup();
});
