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

export function buildSourceCardHTML(url, pageTitle) {
  return `
      <img src="${url}/favicon.ico" alt="alternatetext"> 
      <span>
          <a href="${url}" target="_blank">${pageTitle}</a>
      </span>
      <button class="remove-source" onclick="this.parentElement.remove()">×</button>
  `;
}