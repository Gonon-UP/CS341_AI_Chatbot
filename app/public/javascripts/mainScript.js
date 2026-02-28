import {
  formatBotReply,
  isValidMessage,
  buildSearchUrl,
  buildResultCardHTML,
  buildSourceCardHTML,
  buildPageCardHTML
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
const saveBtn = document.getElementById("saveButton");

/* =========================================================
   INITIALIZATION
========================================================= */

window.addEventListener("DOMContentLoaded", () => {

  setupTopBar();
  setupChatPanel();
  loadSavedPages();

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
  saveBtn.textContent = "New Page";
  saveBtn.addEventListener("click", createNewPage);

  /* Delete Button */
  document.getElementById("deleteButton")
    .addEventListener("click", deletePage);
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

async function deletePage() {

  if (!currentPageId) return;
  if (!confirm("Delete this page?")) return;

  const response = await fetch(`/page/${currentPageId}`, {
    method: "DELETE"
  });

  const data = await response.json();

  currentPageId = null;

  loadSavedPages();

  if (data.nextPageId) {
    loadPage(data.nextPageId);
  } else {
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

    const panel = document.getElementById("meetingsPanel");
    panel.innerHTML = "";

    pages.forEach(page => {

      const wrapper = document.createElement("div");
      wrapper.innerHTML = buildPageCardHTML(page);

      const card = wrapper.firstElementChild;

      card.addEventListener("click", () => {
        loadPage(page.page_number);
      });

      panel.appendChild(card);
    });

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

  const overlay = document.getElementById("popupOverlay");

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
    ?.addEventListener("click", closePopup);
}

async function saveSource(preFetchedTitle = null, directUrl = null) {

  const url = directUrl ||
    document.getElementById("sourceInput").value.trim();

  if (!url) return;

  try {

    const response = await fetch("/api/save", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        page_number: currentPageId,
        title: preFetchedTitle || url,
        url
      })
    });

    const data = await response.json();

    if (data.success) loadSources(currentPageId);

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

      box.querySelector(".remove-source")
        ?.addEventListener("click", async () => {

          await fetch(`/api/delete/${pageNumber}/${item.url_order}`, {
            method: "DELETE"
          });

          loadSources(pageNumber);
        });

      panel.appendChild(box);
    });

  } catch (err) {
    console.error("Failed to load resources:", err);
  }
}

/* =========================================================
   POPUP UTILITIES
========================================================= */

function closePopup() {
  const overlay = document.getElementById("popupOverlay");
  overlay.style.display = "none";
  overlay.innerHTML = "";
}

async function performSearch() {

  const overlay = document.getElementById("popupOverlay");
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

/* =========================================================
   EXPORT TO WINDOW (HTML onclick hooks)
========================================================= */

window.addSources = addSources;
window.saveSource = saveSource;
window.performSearch = performSearch;
