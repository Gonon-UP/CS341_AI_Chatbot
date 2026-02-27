import {
  formatBotReply,
  isValidMessage,
  buildSearchUrl,
  buildResultCardHTML,
  buildSourceCardHTML
} from "./chatLogic.js";

const titleArea = document.getElementById("titleArea");
const messageArea = document.getElementById("messageArea");
const textArea = document.getElementById("textBox");
const sendBtn = document.getElementById("sendButton"); 

sendBtn.addEventListener("click", sendMessage);

/* Title textbox at top of page */
titleArea.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    titleArea.blur();
  }
});


/* Adds messages to the Chatbot (display) */
function addMessage(text, type = "user") {
  const msg = document.createElement("div");
  msg.className = `message ${type}`;
  msg.textContent = text;

  messageArea.appendChild(msg);
  messageArea.scrollTop = messageArea.scrollHeight;
}


/* Sends messages to Chatbot */
async function sendMessage() {

  // Now uses pure validation logic
  if (!isValidMessage(textArea.value)) return;

  textArea.disabled = true;
  sendBtn.disabled = true;

  const userQuery = textArea.value;
  textArea.value = "";

  addMessage(userQuery, "user");
  addMessage("Bot is typing...", "typing");

  try {
    const botReply = await getBotReply(userQuery);

    const typingEl = messageArea.querySelector(".typing");
    if (typingEl) typingEl.remove();

    addMessage(botReply, "bot");
  } catch (err) {
    console.error(err);
  } finally {
    textArea.disabled = false;
    sendBtn.disabled = false;
    textArea.focus();
  }
}


/* Chatbot reply function */
async function getBotReply(query) {
  return new Promise(resolve => {
    setTimeout(() => resolve(formatBotReply(query)), 1000);
  });
}


/* Extra highlight feature */
textArea.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    sendMessage();

    const originalColor = sendBtn.style.borderColor;
    sendBtn.style.borderColor = "white";

    setTimeout(() => {
      sendBtn.style.borderColor = originalColor;
    }, 200);
  }
});


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
      performSearch();
    }
  });

  resultsContainer.addEventListener("click", (e) => {
    const btn = e.target.closest(".select-result-btn");
    if (btn) {
      const url = btn.dataset.url;
      const title = btn.dataset.title;
      saveSource(title, url);
    }
  });

  const closeBtn = overlay.querySelector("#closeButton");
  if (closeBtn) {
    closeBtn.addEventListener("click", closePopup);
  }
}


/* saves the sources in the SourcesList div */
async function saveSource(preFetchedTitle = null, directUrl = null) {
  const url = directUrl || document.getElementById("sourceInput").value.trim();
  if (!url) return;

  const pageTitle = preFetchedTitle || url;

  try {
	  const response = await fetch("/api/save", {
		  method: "POST",
		  headers: { "Content-Type": "application/json" },
		  body: JSON.stringify({
			  page_number: 1,  // default page
			  title: pageTitle,
			  url: url
		  })
	  });

	  const data = await response.json();

	  if(data.success) {
		  loadSources(1);
	  }

  } catch (err) {
	  console.error("Save failed:", err);
  }

  closePopup();
}

async function loadSources(pageNumber) {
   try {
	const response = await fetch(`/api/urls/${pageNumber}`);
	const data = await response.json();

	const panel = document.getElementById("sourcesList");
	panel.innerHTML = "";

	data.urls.forEach(item => {
    		const wrapper = document.createElement("div");
		wrapper.innerHTML = buildSourceCardHTML(
    			item.url,
    			item.title,
    			item.url_order
		);

		const box = wrapper.firstElementChild;

		const deleteBtn = box.querySelector(".remove-source");

		deleteBtn.addEventListener("click", async () => {
	        	try {
				await fetch(`/api/delete/${pageNumber}/${item.url_order}`, {
                			method: "DELETE"
            			});

            			loadSources(pageNumber); // reload from DB
        		} catch (err) {
            			console.error("Delete failed:", err);
        		}
    		});

    	panel.appendChild(box);
	});
    } catch (err) {
	console.error("Failed to load resources:", err);
    }
}

/* Close popup function */
function closePopup() {
  const overlay = document.getElementById("popupOverlay");
  overlay.style.display = "none";
  overlay.innerHTML = "";
}


/* Use Brave API to search the web */
async function performSearch() {
  const overlay = document.getElementById("popupOverlay");
  const query = overlay.querySelector("#webSearch").value.trim();
  const resultsContainer = overlay.querySelector("#searchResults");

  if (!query) return;

  resultsContainer.innerHTML = "Searching...";

  try {
    // Now uses pure URL builder
    const response = await fetch(buildSearchUrl(query));
    const data = await response.json();

    resultsContainer.innerHTML = "";

    data.forEach(result => {
      const card = document.createElement("div");
      card.className = "result-card";

      // Now uses pure HTML builder
      card.innerHTML = buildResultCardHTML(result);

      resultsContainer.appendChild(card);
    });

  } catch (err) {
    resultsContainer.innerHTML = "Search failed.";
  }
}

window.addSources = addSources;
window.saveSource = saveSource;
window.performSearch = performSearch;

window.addEventListener("DOMContentLoaded", () => {
	loadSources(1);
});

