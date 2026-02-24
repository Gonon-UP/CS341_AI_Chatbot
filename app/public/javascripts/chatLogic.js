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