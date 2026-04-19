import {
  formatBotReply,
  isValidMessage,
  buildSearchUrl,
  buildResultCardHTML,
  buildSourceCardHTML,
  buildPageCardHTML,
  buildTopicCardHTML
} from "./chatLogic.js";

/* =========================================================
   GLOBAL STATE
========================================================= */

/*
 * Tracks the unique pages, necessary for accurate database
 * storage and retrieval functions
 */
let currentPageId = null;

/* TOPICS */
const TOPICS = [
  "Theology",
  "Philosophy",
  "Psychology",
  "Neuroscience"
];

/* =========================================================
   INITIALIZATION
========================================================= */

/* Loads all of our necessary features when website opens */
window.addEventListener("DOMContentLoaded", () => {
  setupTopBar();
  setupChatPanel();
  loadSavedPages();
  setupTopicsPanel();
  attachSourceDeleteButton();
 
  document.getElementById("logoutButton")?.addEventListener("click", logout);
});

/* =========================================================
   TOP BAR (Title + New Page + Delete)
========================================================= */

function setupTopBar() {
  const titleArea = getTitleArea();
  const newPageBtn = getNewPageBtn();

  // title auto save
  titleArea.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      titleArea.blur();
    }
  });

  // saves the title when you click off the editor
  titleArea.addEventListener("blur", autoSaveTitle);

  // new page button
  newPageBtn.addEventListener("click", createNewPage);
}

async function logout() {
  try {
    await fetch('/api/auth/logout', { method: 'POST' });
  } finally {
    // Always go back to login, even if the request fails
    window.location.href = '/login';
  }
}

/* Saves the page title to database */
async function autoSaveTitle() {

  if (!currentPageId) return;

  const titleArea = getTitleArea();

  // query the database
  await fetch(`/page/${currentPageId}/title`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      title: titleArea.value.trim()
    })
  });

  // reload the pages to reflect title update
  loadSavedPages();
}


/* Generates a new page for the database */
async function createNewPage() {
  const titleArea = getTitleArea();
  const messageArea = getMessageArea();

  // query the database
  const response = await fetch("/savePage", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      pageId: null,
      title: "",
      urls: []
    })
  });

  const data = await response.json();

  if (!data.pageId) return;

  // update current page tracker
  currentPageId = data.pageId;

  // Reset UI
  titleArea.value = "";
  document.getElementById("sourcesList").innerHTML = "";
  messageArea.innerHTML = "";

  loadSavedPages();
  loadPage(data.pageId);
}

/* Deletes a page */
async function deletePage(pageId = currentPageId) {
  const titleArea = getTitleArea();

  if (!pageId) return;
  if (!confirm("Delete this page?")) return;

  const response = await fetch(`/page/${pageId}`, {
    method: "DELETE"
  });

  const data = await response.json();

  if (pageId === currentPageId) {
    currentPageId = null;
  }

  loadSavedPages();

  // loads the next page in the listed pages
  if (data.nextPageId) {
    loadPage(data.nextPageId);
  } else if (pageId === currentPageId) {
    titleArea.value = "";
    document.getElementById("sourcesList").innerHTML = "";
  }
}

/* =========================================================
   LEFT PANEL
   Sources + Previous Meetings
========================================================= */

/* Generates the list of database pages */
async function loadSavedPages() {
  try {
    const response = await fetch("/pages");
    const pages = await response.json();

    const panel = document.getElementById("pagesList");
    panel.innerHTML = "";

    // creates a list of pages in Previous Meetings
    pages.forEach(page => {
      const wrapper = document.createElement("div");
      wrapper.innerHTML = buildPageCardHTML(page);
      const card = wrapper.firstElementChild;

      const titleBtn = card.querySelector(".page-title");
      const deleteBtn = card.querySelector(".delete-page");

      titleBtn?.addEventListener("click", () => {
        loadPage(page.page_number);
      });

      deleteBtn?.addEventListener("click", async (e) => {
        e.stopPropagation();
        await deletePage(page.page_number);
      });

      panel.appendChild(card);
    });

    // AUTO-LOAD TOP PAGE if no currentPageId
    if (!currentPageId && pages.length > 0) {
      loadPage(pages[0].page_number);
    }

  } catch (err) {
    console.error("Error loading saved pages:", err);
  }
}

/* =========================================================
   PAGE LOADING
========================================================= */

/* Load a page from the database */
async function loadPage(pageId) {
  const titleArea = getTitleArea();

  try {
    const response = await fetch(`/page/${pageId}`);

    if (!response.ok) throw new Error("Page not found");

    const data = await response.json();

    currentPageId = pageId;

    titleArea.value = data.page.title || "";

    loadSourcesFromDB(data.urls);

    // load topics separately
    const topicResponse = await fetch(`/page/${pageId}/topics`);
    const topicData = await topicResponse.json();

    setupTopicsPanel(topicData.topics);

  } catch (err) {
    console.error(err);
  }
}

/* Retrieve all sources from the database */
function loadSourcesFromDB(urls) {

  const panel = document.getElementById("sourcesList");
  panel.innerHTML = "";

  urls.forEach(item => {

    const wrapper = document.createElement("div");

    wrapper.innerHTML = buildSourceCardHTML(
      item.url,
      item.title,
      item.url_order
    );

    panel.appendChild(wrapper.firstElementChild);
  });
}

/* =========================================================
   CHATBOT PANEL
========================================================= */

/* Creates the text area and button for interacting with chatbot */
function setupChatPanel() {
  const sendBtn = document.getElementById("sendButton");
  const textArea = document.getElementById("textBox");

  if (!sendBtn || !textArea) return;

  sendBtn.addEventListener("click", sendMessage);

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
}

/* Sends the user or chatbot's message to the text section */
function addMessage(text, type = "user") {
  const messageArea = getMessageArea();
  const msg = document.createElement("div");

  msg.className = `message ${type}`;
  msg.textContent = text;

  messageArea.appendChild(msg);
  messageArea.scrollTop = messageArea.scrollHeight;
}

/* 
 * Sends the message to the chatbot
 * needs updated functionality for the Ollama model
 */
async function sendMessage() {
  const textArea = getTextArea();
  const sendBtn = getSendBtn();
  const messageArea = getMessageArea();

  if (!isValidMessage(textArea.value)) return;

  textArea.disabled = true;
  sendBtn.disabled = true;

  const userQuery = textArea.value;
  textArea.value = "";

  addMessage(userQuery, "user");
  addMessage("Bot is typing...", "typing");

  try {
    // retrieve the bot's answer to the query
    const botReply = await getBotReply(userQuery);

    const typingEl = messageArea.querySelector(".typing");
    if (typingEl) typingEl.remove();

    addMessage(botReply, "bot");

  } finally {

    textArea.disabled = false;
    sendBtn.disabled = false;
    textArea.focus();
  }
}

/* Will need updating, actually queries the Ollama model */
async function getBotReply(query) {
  // LAN IP address the virtual machine, hosting the ollama
  const ollamaUrl = 'http://10.12.18.250:11434/api/generate'; //

  try {
    const response = await fetch(ollamaUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama3-chatqa:latest', // Just a model we have in the VM
        prompt: query,
        stream: false    // Keeps it simple by waiting for the full response instead of streaming chunks
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const data = await response.json();
    return data.response; // The actual text generated by Ollama
    
  } catch (error) {
    console.error('Error communicating with Ollama:', error);
    return "⚠️ Sorry, I couldn't connect to the AI. Ensure Ollama is running and CORS is configured.";
  }
}
/* =========================================================
   POPUPS
========================================================= */

/* Adds selected source to Sources panel */
async function addSources() {

  const overlay = document.getElementById("sourcesPopup");

  // data from the popup (chosen website)
  const response = await fetch("popups/addSources.html");
  overlay.innerHTML = await response.text();
  overlay.style.display = "flex";

  // create an HTML listed item
  const resultsContainer = overlay.querySelector("#searchResults");
  const searchInput = overlay.querySelector("#webSearch");

  searchInput.addEventListener("keydown", async (e) => {
    if (e.key === "Enter") {
      e.preventDefault();

      const inputVal = searchInput.value.trim();

      if (!inputVal) return;

      // Check if the input looks like a URL
      try {
        new URL(inputVal);
        await addURLDirectly(inputVal);
      } catch {
        performSearch();
      }
    }
  });

  // add close buttons
  resultsContainer.addEventListener("click", async (e) => {

    const btn = e.target.closest(".select-result-btn");
    if (!btn) return;

    const card = btn.closest(".result-card");

    const url = card.querySelector("a")?.href;
    const title = card.querySelector(".result-title")?.textContent;

    // if any of these is missing, error
    if (!url || !title || !currentPageId) return;

    try {
      // send this source data to database
      const res = await fetch(`/api/save`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          page_number: currentPageId,
          url,
          title
        })
      });

      const data = await res.json();

      if (data.success) {
        // Add to sources panel immediately
        const panel = document.getElementById("sourcesList");

        const wrapper = document.createElement("div");
        wrapper.innerHTML = buildSourceCardHTML(url, title, data.url_order);

        panel.appendChild(wrapper.firstElementChild);
      }

    } catch (err) {
      console.error("Error adding source:", err);
    }

    closeSourcesPopup();
  });

  overlay.querySelector("#closeButton")
    ?.addEventListener("click", closeSourcesPopup);
}

async function addURLDirectly(url) {
  if (!currentPageId) return;

  try {
    // Fetch the page title from the URL
    let title = url; // fallback if fetch fails

    try {
      const res = await fetch(`/api/getTitle?url=${encodeURIComponent(url)}`);
      const data = await res.json();
      if (data.title) title = data.title;
    } catch (err) {
      console.warn("Could not fetch title for URL, using URL itself");
    }

    // Save to DB
    const res = await fetch(`/api/save`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        page_number: currentPageId,
        url,
        title
      })
    });

    const data = await res.json();

    if (data.success) {
      const panel = document.getElementById("sourcesList");
      const wrapper = document.createElement("div");
      wrapper.innerHTML = buildSourceCardHTML(url, title, data.url_order);
      panel.appendChild(wrapper.firstElementChild);
    }
  } catch (err) {
    console.error("Error adding URL directly:", err);
  }

  closeSourcesPopup();
}

/* Give each source a delete button */
function attachSourceDeleteButton() {
  const panel = document.getElementById("sourcesList");

  panel.addEventListener("click", async (e) => {
    const deleteBtn = e.target.closest(".remove-source");
    if (!deleteBtn) return;

    const card = deleteBtn.closest(".source-box");
    const urlOrder = deleteBtn.dataset.order;

    if (!urlOrder || !currentPageId) {
      console.error("Missing urlOrder or currentPageId");
      return;
    }

    try {
      // when clicked, remove from database
      const res = await fetch(
        `/api/delete/${currentPageId}/${urlOrder}`,
        { method: "DELETE" }
      );

      const data = await res.json();

      if (data.success) {
        // remove from UI
        card.remove();
      } else {
        console.error("Delete failed:", data.error);
      }

    } catch (err) {
      console.error("Error deleting source:", err);
    }
  });
}

function closeSourcesPopup() {
  const overlay = document.getElementById("sourcesPopup");
  overlay.style.display = "none";
  overlay.innerHTML = "";
}

/* uses the Brave API key to search the web */
async function performSearch() {

  const overlay = document.getElementById("sourcesPopup");
  const query = overlay.querySelector("#webSearch").value.trim();
  const resultsContainer = overlay.querySelector("#searchResults");

  if (!query) return;

  resultsContainer.innerHTML = "Searching...";

  try {
    // create an HTML container for each website for selection
    const response = await fetch(buildSearchUrl(query));
    const data = await response.json();

    resultsContainer.innerHTML = "";

    data.forEach(result => {

      const card = document.createElement("div");
      card.className = "result-card";
      card.innerHTML = buildResultCardHTML(result);

      resultsContainer.appendChild(card);
    });

  } catch (err) {

    resultsContainer.innerHTML = "Search failed.";
  }
}

/* ---------------------------
   DOCUMENT POPUP FUNCTIONS
---------------------------- */

/*  Open the document upload popup */
async function addDocuments() {
  const pageId = currentPageId;

  const overlay = document.getElementById("documentsPopup");

  // add fetched HTML for a document to the popup
  const response = await fetch("popups/addDocuments.html");
  overlay.innerHTML = await response.text();
  overlay.style.display = "flex";

  // Set hidden input for pageId
  const pageInput = overlay.querySelector("#pageId");
  if (pageInput) pageInput.value = pageId;

  // Cancel button closes popup
  overlay.querySelector("#cancelBtn")
    ?.addEventListener("click", closeDocPopup);

  // Form submission
  const uploadForm = overlay.querySelector("#uploadForm");
  uploadForm.onsubmit = async (e) => {
    e.preventDefault();
    await uploadDocument(pageId);
  };

  // Load previously uploaded documents for this page
  const ul = overlay.querySelector("#documentsUL");
  ul.innerHTML = ""; // clear old list

  try {
    const res = await fetch(`/getDocuments?pageId=${pageId}`);
    const data = await res.json();

    if (data.success) {
      data.documents.forEach(doc => addDocumentListItem(ul, doc));
    }
  } catch (err) {
    console.error(err);
  }
}

/* Add a document <li> to the UL with delete button and click-to-open */
function addDocumentListItem(ul, doc) {
  const li = document.createElement("li");
  li.className = "document-item";

  // Clickable link to open document in a new tab
  const link = document.createElement("a");
  link.href = `/uploads/${doc.page_number || currentPageId}/${doc.file_name}`; // path to file
  link.target = "_blank"; // open in new tab
  link.textContent = `${doc.original_name} (${Math.round(doc.file_size / 1024)} KB)`;
  link.className = "document-link";

  // Remove button
  const removeBtn = document.createElement("button");
  removeBtn.textContent = "×";
  removeBtn.className = "remove-document";

  removeBtn.addEventListener("click", async (e) => {
    e.stopPropagation(); // prevent link click
    removeBtn.disabled = true;

    try {
      const res = await fetch(`/document/${doc.document_id}`, { method: "DELETE" });
      const data = await res.json();

      if (data.success) {
        li.remove(); // remove from DOM
      } else {
        console.error("Delete failed:", data.error);
        removeBtn.disabled = false;
      }
    } catch (err) {
      console.error("Delete error:", err);
      removeBtn.disabled = false;
    }
  });

  li.appendChild(link);
  li.appendChild(removeBtn);
  ul.appendChild(li);
}

// Close the popup
function closeDocPopup() {
  const overlay = document.getElementById("documentsPopup");
  overlay.style.display = "none";
  overlay.innerHTML = "";
};

/* Uploads documents and track its upload progress */
async function uploadDocument(pageId) {
  const overlay = document.getElementById("documentsPopup");
  const fileInput = overlay.querySelector("#documentInput");
  if (!fileInput.files.length) return;

  const file = fileInput.files[0];
  const formData = new FormData();
  formData.append("document", file);
  formData.append("pageId", pageId); // send the correct pageId

  // uploads a document with reference to this page's ID
  const xhr = new XMLHttpRequest();
  xhr.open("POST", `/uploadDocument?pageId=${pageId}`, true);

  const progressContainer = overlay.querySelector("#uploadProgress");
  const progressBar = overlay.querySelector("#progressBar");
  const progressText = overlay.querySelector("#progressText");
  const uploadMessage = overlay.querySelector("#uploadMessage");

  // progress bar when uploading
  progressContainer.style.display = "block";
  progressBar.style.width = "0%";
  progressText.textContent = "0%";
  uploadMessage.style.display = "none";

  xhr.upload.onprogress = (event) => {
    if (event.lengthComputable) {
      const percent = Math.round((event.loaded / event.total) * 100);
      progressBar.style.width = percent + "%";
      progressText.textContent = percent + "%";
    }
  };

  xhr.onload = () => {
    progressContainer.style.display = "none";
    if (xhr.status === 200) {
      const res = JSON.parse(xhr.responseText);
      if (res.success) {
        uploadMessage.style.display = "block";
        uploadMessage.textContent = "Upload successful!";

        // Add uploaded file to the list with delete button & click-to-open
        const ul = overlay.querySelector("#documentsUL");
        addDocumentListItem(ul, res.document);

        // Clear file input
        fileInput.value = "";
      } else {
        uploadMessage.style.display = "block";
        uploadMessage.textContent = "Upload failed: " + (res.error || "Unknown error");
      }
    } else {
      uploadMessage.style.display = "block";
      uploadMessage.textContent = "Upload failed with status " + xhr.status;
    }
  };

  xhr.send(formData);
}

/* ---------------------
   TOPICS PANEL
--------------------- */

function setupTopicsPanel(selectedTopics = []) {
  const panel = document.getElementById("topicsList");
  panel.innerHTML = "";

  TOPICS.forEach(topic => {
    const wrapper = document.createElement("div");
    wrapper.innerHTML = buildTopicCardHTML(topic);
    const card = wrapper.firstElementChild;
    const checkbox = card.querySelector(".topic-checkbox");

    // Check if in selectedTopics
    checkbox.checked = selectedTopics.includes(topic);

    checkbox.addEventListener("change", saveTopics);
    panel.appendChild(card);
  });
}

/* Uploads the selected checkboxes to the database */
async function saveTopics() {

  if (!currentPageId) return;

  const selectedTopics = [...document.querySelectorAll("#topicsList input:checked")]
    .map(cb => cb.value);

  await fetch(`/page/${currentPageId}/topics`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      topics: selectedTopics
    })
  });
}

/* ------------------------------------------
   Getters/setters
------------------------------------------ */

function setCurrentPageId(id) {
  currentPageId = id;
}

function getTextArea() {
  return document.getElementById("textBox");
}

function getMessageArea() {
  return document.getElementById("messageArea");
}

function getTitleArea() {
  return document.getElementById("titleArea");
}

function getSendBtn() {
  return document.getElementById("sendButton");
}

function getNewPageBtn() {
  return document.getElementById("newPageButton");
}

/* ------------------------------------------
   EXPORT TO WINDOW (HTML onclick hooks)
------------------------------------------ */

window.addSources = addSources;
window.performSearch = performSearch;
window.closeSourcesPopup = closeSourcesPopup;
window.closeDocPopup = closeDocPopup;
window.addDocuments = addDocuments;
window.logout = logout;

export {
  loadSourcesFromDB,
  setupChatPanel,
  sendMessage,
  performSearch,
  saveTopics,
  setCurrentPageId,
  loadSavedPages,
  createNewPage,
  autoSaveTitle,
  setupTopBar,
  setupTopicsPanel,
  attachSourceDeleteButton,
  loadPage,
  deletePage,
  addDocuments,
  addDocumentListItem,
  currentPageId,
  addSources
};
