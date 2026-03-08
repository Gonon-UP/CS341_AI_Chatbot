// chatLogic.js

export function formatBotReply(query) {
  return "This is a reply to: " + query;
}

export function isValidMessage(text) {
  return text.trim().length > 0;
}

export function buildSearchUrl(query) {
  return `/search?q=${encodeURIComponent(query)}`;
}

export function buildResultCardHTML(result) {
  return `
    <div class="result-header">
      <a href="${result.link}" target="_blank" class="result-title">
        ${result.title}
      </a>
      <button class="select-result-btn"
              data-url="${result.link}"
              data-title="${result.title.replace(/'/g, "\\'")}">
        Select
      </button>
    </div>
    <div class="result-snippet">${result.snippet}</div>
  `;
}

export function buildSourceCardHTML(url, pageTitle, urlOrder) {
  return `
    <div class="source-box">
      <div class="source-info">
        <img src="https://www.google.com/s2/favicons?domain=${url}" alt="favicon" class="source-favicon">
        <a href="${url}" target="_blank" class="source-title">${pageTitle}</a>
      </div>
      <button class="remove-source" data-order="${urlOrder}">×</button>
    </div>
  `;
}

export function buildPageCardHTML(page) {
  return `
    <div class="page-box" data-page-id="${page.page_number}">
      <div class="page-info">
        <span class="page-icon">📓</span>
        <button class="page-title" type="button">
          ${page.title || "Untitled Notebook"}
        </button>
      </div>
      <button class="delete-page" data-page-id="${page.page_number}">
        ×
      </button>
    </div>
  `;
}

export function buildTopicCardHTML(topic, checked = false) {
  return `
    <div class="topic-box">
      <label class="topic-content">
        <input type="checkbox"
               class="topic-checkbox"
               value="${topic}"
               ${checked ? "checked" : ""}>
        <span class="topic-name">${topic}</span>
      </label>
    </div>
  `;
}
