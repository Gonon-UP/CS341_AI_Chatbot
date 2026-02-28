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
  return `<div class="page-card-title">${page.title}</div>`;
}