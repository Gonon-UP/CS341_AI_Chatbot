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

let currentPageId = null;

/* Cached DOM Elements */
const titleArea = document.getElementById("titleArea");
const messageArea = document.getElementById("messageArea");
const textArea = document.getElementById("textBox");
const sendBtn = document.getElementById("sendButton");
const newPageBtn = document.getElementById("newPageButton");

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

window.addEventListener("DOMContentLoaded", () => {

  setupTopBar();
  setupChatPanel();
  loadSavedPages();
  setupTopicsPanel();
  attachSourceDeleteButton();
});

/* =========================================================
   TOP BAR (Title + New Page + Delete)
========================================================= */

function setupTopBar() {

  /* Title Auto Save */
  titleArea.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      titleArea.blur();
    }
  });

  titleArea.addEventListener("blur", autoSaveTitle);

  /* New Page Button */
  newPageBtn.addEventListener("click", createNewPage);
}

async function autoSaveTitle() {

  if (!currentPageId) return;

  await fetch(`/page/${currentPageId}/title`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      title: titleArea.value.trim()
    })
  });

  loadSavedPages();
}


async function createNewPage() {

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

  currentPageId = data.pageId;

  /* Reset UI */
  titleArea.value = "";
  document.getElementById("sourcesList").innerHTML = "";
  messageArea.innerHTML = "";

  loadSavedPages();
  loadPage(data.pageId);
}

async function deletePage(pageId = currentPageId) {

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

async function loadSavedPages() {
  try {
    const response = await fetch("/pages");
    const pages = await response.json();

    const panel = document.getElementById("pagesList");
    panel.innerHTML = "";

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

async function loadPage(pageId) {

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

function addMessage(text, type = "user") {

  const msg = document.createElement("div");

  msg.className = `message ${type}`;
  msg.textContent = text;

  messageArea.appendChild(msg);
  messageArea.scrollTop = messageArea.scrollHeight;
}

async function sendMessage() {

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

  } finally {

    textArea.disabled = false;
    sendBtn.disabled = false;
    textArea.focus();
  }
}

async function getBotReply(query) {

  return new Promise(resolve => {
    setTimeout(() => resolve(formatBotReply(query)), 1000);
  });
}

/* =========================================================
   POPUPS
========================================================= */

async function addSources() {

  const overlay = document.getElementById("sourcesPopup");

  const response = await fetch("popups/addSources.html");
  overlay.innerHTML = await response.text();
  overlay.style.display = "flex";

  const resultsContainer = overlay.querySelector("#searchResults");
  const searchInput = overlay.querySelector("#webSearch");

  searchInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      performSearch();
    }
  });

  resultsContainer.addEventListener("click", async (e) => {

  const btn = e.target.closest(".select-result-btn");
  if (!btn) return;

  const card = btn.closest(".result-card");

  const url = card.querySelector("a")?.href;
  const title = card.querySelector(".result-title")?.textContent;

  if (!url || !title || !currentPageId) return;

  try {
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

async function performSearch() {

  const overlay = document.getElementById("sourcesPopup");
  const query = overlay.querySelector("#webSearch").value.trim();
  const resultsContainer = overlay.querySelector("#searchResults");

  if (!query) return;

  resultsContainer.innerHTML = "Searching...";

  try {

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

// ---------------------------
// DOCUMENT POPUP FUNCTIONS
// ---------------------------

// Open the document upload popup
async function addDocuments() {
  const pageId = currentPageId;
  console.log("current page ID:", currentPageId);

  const overlay = document.getElementById("documentsPopup");

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

// Add a document <li> to the UL with delete button and click-to-open
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

// ---------------------------
// UPLOAD DOCUMENT FUNCTION
// ---------------------------
async function uploadDocument(pageId) {
  const overlay = document.getElementById("documentsPopup");
  const fileInput = overlay.querySelector("#documentInput");
  if (!fileInput.files.length) return;

  const file = fileInput.files[0];
  const formData = new FormData();
  formData.append("document", file);
  formData.append("pageId", pageId); // send the correct pageId

  const xhr = new XMLHttpRequest();
  xhr.open("POST", `/uploadDocument?pageId=${pageId}`, true);

  const progressContainer = overlay.querySelector("#uploadProgress");
  const progressBar = overlay.querySelector("#progressBar");
  const progressText = overlay.querySelector("#progressText");
  const uploadMessage = overlay.querySelector("#uploadMessage");

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

/* =========================================================
   TOPICS PANEL
========================================================= */

function setupTopicsPanel(selectedTopics = []) {
  const panel = document.getElementById("topicsList");
  panel.innerHTML = "";

  TOPICS.forEach(topic => {
    const wrapper = document.createElement("div");
    wrapper.innerHTML = buildTopicCardHTML(topic);
    const card = wrapper.firstElementChild;
    const checkbox = card.querySelector(".topic-checkbox");

    // Check it if it's in selectedTopics
    checkbox.checked = selectedTopics.includes(topic);

    checkbox.addEventListener("change", saveTopics);
    panel.appendChild(card);
  });
}

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

/* =========================================================
   EXPORT TO WINDOW (HTML onclick hooks)
========================================================= */

window.addSources = addSources;
window.performSearch = performSearch;
window.closeSourcesPopup = closeSourcesPopup;
window.closeDocPopup = closeDocPopup;
window.addDocuments = addDocuments;

export {
  loadSourcesFromDB,
  setupChatPanel,
  sendMessage,
  performSearch,
  saveTopics
};
