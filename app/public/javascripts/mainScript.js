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
   SOURCES PANEL
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

  resultsContainer.addEventListener("click", (e) => {

    const btn = e.target.closest(".select-result-btn");

    if (btn) {
      saveSource(
        btn.dataset.title,
        btn.dataset.url
      );
    }
  });

  overlay.querySelector("#closeButton")
    ?.addEventListener("click", closeSourcesPopup);
}

/* =========================================================
   POPUP UTILITIES
========================================================= */

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
function addDocuments() {
    pageId = currentPageId;
    print("current page ID: ", currentPageId);

    const popup = document.getElementById("documentPopup");
    const iframe = document.getElementById("popupFrame2");

    // Correct relative path to your popup
    iframe.src = "popups/addDocuments.html";
    popup.style.display = "flex";

    iframe.onload = () => {
        const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;

        // Set hidden input for pageId
        const pageInput = iframeDoc.getElementById("pageId");
        pageInput.value = pageId;

        // Cancel button closes popup
        const cancelBtn = iframeDoc.getElementById("cancelBtn");
        cancelBtn.onclick = () => closeDocPopup();

        // Form submission
        const uploadForm = iframeDoc.getElementById("uploadForm");
        uploadForm.onsubmit = async (e) => {
            e.preventDefault();
            await uploadDocument(iframeDoc, pageId);
        };

        // Load previously uploaded documents for this page
        const ul = iframeDoc.getElementById("documentsUL");
        ul.innerHTML = ""; // clear old list
        fetch(`/getDocuments?pageId=${pageId}`)
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    data.documents.forEach(doc => {
                        const li = document.createElement("li");
                        li.textContent = `${doc.original_name} (${Math.round(doc.file_size / 1024)} KB)`;
                        ul.appendChild(li);
                    });
                }
            })
            .catch(err => console.error(err));
    };
};

// Close the popup
function closeDocPopup() {
    const popup = document.getElementById("documentPopup");
    const iframe = document.getElementById("popupFrame2");

    popup.style.display = "none";
    iframe.src = "";
};

// ---------------------------
// UPLOAD DOCUMENT FUNCTION
// ---------------------------
async function uploadDocument(iframeDoc, pageId) {
    const fileInput = iframeDoc.getElementById("documentInput");
    if (!fileInput.files.length) return;

    const file = fileInput.files[0];
    const formData = new FormData();
    formData.append("document", file);
    formData.append("pageId", pageId); // send the correct pageId

    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/uploadDocument", true);

    const progressContainer = iframeDoc.getElementById("uploadProgress");
    const progressBar = iframeDoc.getElementById("progressBar");
    const progressText = iframeDoc.getElementById("progressText");
    const uploadMessage = iframeDoc.getElementById("uploadMessage");

    progressContainer.style.display = "block";
    progressBar.style.width = "0%";
    progressText.textContent = "0%";
    uploadMessage.style.display = "none";

    // Track progress
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

                // Add uploaded file to the list
                const ul = iframeDoc.getElementById("documentsUL");
                const li = document.createElement("li");
                li.textContent = `${res.document.original_name} (${Math.round(res.document.file_size / 1024)} KB)`;
                ul.appendChild(li);

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
window.saveSource = saveSource;
window.performSearch = performSearch;
window.closeSourcesPopup = closeSourcesPopup;
window.closeDocPopup = closeDocPopup;
window.addDocuments = addDocuments;
