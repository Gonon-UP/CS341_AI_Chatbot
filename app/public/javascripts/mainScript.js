const titleArea = document.getElementById("titleArea");
const messageArea = document.getElementById("messageArea");
const textArea = document.getElementById("textBox");
const sendBtn = document.getElementById("sendButton"); 

/* Title textbox at top of page */
titleArea.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();      // stop newline
    titleArea.blur();        // exits the box (removes focus)
  }
})

/* Adds messages to the Chatbot (display) */
function addMessage(text, type = "user") {
  const msg = document.createElement("div");
  msg.className = `message ${type}`;
  msg.textContent = text;

  messageArea.appendChild(msg);

  // auto scroll to bottom
  messageArea.scrollTop = messageArea.scrollHeight;
}

/* Sends messages to Chatbot */
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

/* Chatbot reply function, not implemented yet */
async function getBotReply(query) {
    // Replace this with your actual bot API call
    return new Promise(resolve => {
        setTimeout(() => resolve("This is a reply to: " + query), 1000);
    });
}

/* Extra highlight feature for aesthetics */
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

/* saveSources(), called by "Add Web Sources" button */
async function addSources() {
    const overlay = document.getElementById("popupOverlay");

    const response = await fetch("popups/addSources.html");
    const html = await response.text();

    overlay.innerHTML = html;
    overlay.style.display = "flex";

    const resultsContainer = overlay.querySelector("#searchResults");
    const searchInput = overlay.querySelector("#webSearch");

    searchInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
            e.preventDefault();
            performSearch();   // no need for window.parent here
        }
    });

    console.log("resultsContainer:", resultsContainer);

    resultsContainer.addEventListener("click", (e) => {
        const btn = e.target.closest(".select-result-btn");
        if (btn) {
            const url = btn.dataset.url;
            const title = btn.dataset.title;

            console.log("Clicked Select:", title, url);

            saveSource(title, url);
        }
    });
}

/* saves the sources in the SourcesList div */
async function saveSource(preFetchedTitle = null, directUrl = null) {
    const url = directUrl || document.getElementById("sourceInput").value.trim();
    if (!url) return;

    const pageTitle = preFetchedTitle || url;

    const panel = document.getElementById("sourcesList");

    const box = document.createElement("div");
    box.className = "source-box";
    box.innerHTML = `
        <span>
            <a href="${url}" target="_blank">${pageTitle}</a>
        </span>
        <button class="remove-source" onclick="this.parentElement.remove()">×</button>
    `;

    panel.appendChild(box);

    closePopup();
}

/* Close popup function */
function closePopup() {
    const overlay = document.getElementById("popupOverlay");
    overlay.style.display = "none";
    overlay.innerHTML = ""; // clear content
}

/* Use Brave API to search the web */
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

            // HTML for the saves sources in the Sources panel (needs work)
            card.innerHTML = `
                <div class="result-header">
                    <a href="${result.link}" target="_blank" class="result-title">${result.title}</a>
                    <button class="select-result-btn" 
                            data-url="${result.link}" 
                            data-title="${result.title.replace(/'/g, "\\'")}">
                        Select
                    </button>
                </div>
                <div class="result-snippet">${result.snippet}</div>
            `;
            resultsContainer.appendChild(card);
        });
    } catch (err) {
        resultsContainer.innerHTML = "Search failed.";
    }
}

/* Adds result to ResultsList */
function selectSearchResult(url, title) {
    // 1. Find the input where saveSource expects the URL
    // (Ensure your popup HTML has <input id="sourceInput">)
    resultsContainer.addEventListener("click", (e) => {
        const btn = e.target.closest(".select-result-btn");
        if (btn) {
            const url = btn.getAttribute("data-url");
            const title = btn.getAttribute("data-title");

            saveSource(title, url);
        }
    });
}