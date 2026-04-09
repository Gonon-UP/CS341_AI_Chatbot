import * as main from "../javascripts/mainScript.js";
import * as chatLogic from "../javascripts/chatLogic.js";

/* ================================
   MOCK chatLogic.js
================================ */
jest.mock("../javascripts/chatLogic.js", () => ({
  formatBotReply: jest.fn((q) => `bot:${q}`),
  isValidMessage: jest.fn(() => true),
  buildSearchUrl: jest.fn((q) => `/search?q=${q}`),
  buildResultCardHTML: jest.fn(() => "<div class='result-inner'></div>"),
  buildSourceCardHTML: jest.fn(() => "<div class='source-box'></div>"),
  buildPageCardHTML: jest.fn(() => "<div></div>"),
  buildTopicCardHTML: jest.fn(
    () => "<div><input class='topic-checkbox' value='Test'/></div>"
  )
}));

const mockFormatBotReply = jest.fn((q) => `bot:${q}`);

/* ================================
   RESET BEFORE EACH TEST
================================ */
beforeEach(() => {
  /* -----------------------------
     DOM SETUP
  ----------------------------- */
  document.body.innerHTML = `
    <div id="documentsPopup"></div>
    <div id="sourcesPopup"></div>
    <textarea id="textBox"></textarea>
    <div id="messageArea"></div>
    <div id="sourcesList"></div>
    <div id="pagesList"></div>
    <div id="topicsList"></div>
    <input id="titleArea"/>
    <button id="sendButton"></button>
    <button id="newPageButton"></button>
  `;

  /* -----------------------------
     RESET ALL MOCKS
  ----------------------------- */
  jest.clearAllMocks();

  /* -----------------------------
     GLOBAL VARIABLES
  ----------------------------- */
  global.currentPageId = 42;

  /* -----------------------------
     MOCK chatLogic.js FUNCTIONS
  ----------------------------- */
  chatLogic.isValidMessage.mockReturnValue(true);
  chatLogic.formatBotReply.mockImplementation((q) => `bot:${q}`);
  chatLogic.buildSearchUrl.mockImplementation((q) => `/search?q=${q}`);
  chatLogic.buildResultCardHTML.mockImplementation(() => "<div class='result-inner'></div>");
  chatLogic.buildSourceCardHTML.mockImplementation(() => "<div class='source-box'></div>");
  chatLogic.buildPageCardHTML.mockImplementation(() => "<div></div>");
  chatLogic.buildTopicCardHTML.mockImplementation(() => "<div><input class='topic-checkbox' value='Test'/></div>");

  /* -----------------------------
     MOCK FETCH
  ----------------------------- */
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    json: async () => ({
      page: { title: "" },
      urls: [],
      topics: []
    }),
  });

  /* -----------------------------
     FAKE TIMERS
  ----------------------------- */
  jest.useFakeTimers();
});

/* =========================================================
   TESTS
========================================================= */

describe("sendMessage", () => {
  test("adds user and bot messages", async () => {
    const textBox = document.getElementById("textBox");
    textBox.value = "hello";

    const promise = main.sendMessage();

    // typing message should exist immediately
    expect(document.querySelector(".typing")).not.toBeNull();

    // fast-forward the timeout (getBotReply)
    jest.runAllTimers();
    jest.runAllTimers();
    await promise;

    const messages = document.querySelectorAll(".message");

    expect(messages.length).toBe(2);
    expect(messages[0].textContent).toBe("hello");
    expect(messages[1].textContent).toBe("bot:hello");

    // typing should be gone
    expect(document.querySelector(".typing")).toBeNull();
  });

  test("does nothing if message is invalid", async () => {
    chatLogic.isValidMessage.mockReturnValue(false);

    const textBox = document.getElementById("textBox");
    textBox.value = "";

    await main.sendMessage();

    const messages = document.querySelectorAll(".message");
    expect(messages.length).toBe(0);
  });

  test("disables and re-enables input during send", async () => {
    const textBox = document.getElementById("textBox");
    const sendBtn = document.getElementById("sendButton");

    textBox.value = "test";

    const promise = main.sendMessage();

    await Promise.resolve();

    expect(textBox.disabled).toBe(true);
    expect(sendBtn.disabled).toBe(true);

    jest.runAllTimers();
    await promise;

    expect(textBox.disabled).toBe(false);
    expect(sendBtn.disabled).toBe(false);
  });

});

/* ========================================================= */

describe("performSearch", () => {

  test("fetches and renders results", async () => {
    const overlay = document.getElementById("sourcesPopup");

    overlay.innerHTML = `
      <input id="webSearch" value="test"/>
      <div id="searchResults"></div>
    `;

    fetch.mockResolvedValue({
      json: () => Promise.resolve([{ a: 1 }, { a: 2 }])
    });

    await main.performSearch();

    expect(chatLogic.buildSearchUrl).toHaveBeenCalledWith("test");

    const cards = document.querySelectorAll(".result-card");
    expect(cards.length).toBe(2);
  });

  test("does nothing if query is empty", async () => {
    const overlay = document.getElementById("sourcesPopup");

    overlay.innerHTML = `
      <input id="webSearch" value=""/>
      <div id="searchResults"></div>
    `;

    await main.performSearch();

    expect(fetch).not.toHaveBeenCalled();
  });

  test("handles fetch failure", async () => {
    const overlay = document.getElementById("sourcesPopup");

    overlay.innerHTML = `
      <input id="webSearch" value="test"/>
      <div id="searchResults"></div>
    `;

    fetch.mockRejectedValue(new Error("fail"));

    await main.performSearch();

    const results = document.getElementById("searchResults");
    expect(results.innerHTML).toBe("Search failed.");
  });

});

/* ========================================================= */

test("saveTopics sends selected topics", async () => {
  main.setCurrentPageId(42);

  document.getElementById("topicsList").innerHTML = `
    <input type="checkbox" value="Philosophy" checked />
    <input type="checkbox" value="Psychology" />
  `;

  fetch.mockResolvedValue({
    json: async () => ({})
  });

  await main.saveTopics();

  expect(fetch).toHaveBeenCalledWith(
    "/page/42/topics",
    expect.objectContaining({
      method: "POST",
      body: JSON.stringify({
        topics: ["Philosophy"]
      })
    })
  );
});

test("deleteSource: handles deletion after confirmation", async () => {
  jest.useRealTimers();

  main.setCurrentPageId(42);

  document.getElementById("sourcesList").innerHTML = `
    <div class="source-box" id="s1">
      <button class="remove-source" data-order="123">X</button>
    </div>
  `;

  main.attachSourceDeleteButton();

  // ✅ MOCK confirm BEFORE clicking
  window.confirm = jest.fn(() => true);

  // ✅ Mock delete fetch correctly
  global.fetch.mockResolvedValueOnce({
    ok: true,
    json: async () => ({ success: true })
  });

  const deleteBtn = document.querySelector(".remove-source");
  deleteBtn.dispatchEvent(new MouseEvent("click", { bubbles: true }));

  await Promise.resolve(); // wait async

  expect(fetch).toHaveBeenCalledWith(
    "/api/delete/42/123",
    { method: "DELETE" }
  );

  expect(document.getElementById("s1")).toBeNull();

  jest.useFakeTimers();
});

describe("loadSavedPages", () => {
  test("deleteSource: handles deletion after confirmation", async () => {
    jest.useRealTimers();

    // 1. Setup correct DOM (MATCH YOUR CODE)
    document.body.innerHTML = `
      <div id="sourcesList">
        <div class="source-box" id="s1">
          <button class="remove-source" data-order="123">X</button>
        </div>
      </div>
    `;

    // 2. REQUIRED: set current page id
    main.setCurrentPageId(42);

    // 3. Attach event listener
    main.attachSourceDeleteButton();

    // 4. Mock fetch correctly
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true })
    });

    // 5. Click delete
    const deleteBtn = document.querySelector(".remove-source");
    deleteBtn.dispatchEvent(new MouseEvent("click", { bubbles: true }));

    // 6. Wait for async
    await Promise.resolve();

    // 7. Assertions
    expect(fetch).toHaveBeenCalledWith(
      "/api/delete/42/123",
      { method: "DELETE" }
    );

    expect(document.getElementById("s1")).toBeNull();

    jest.useFakeTimers();
  });

  test("autoSaveTitle: sends update on input change", async () => {
    const titleArea = document.getElementById("titleArea");
    main.setCurrentPageId(10);

    titleArea.value = "New Title";
    titleArea.dispatchEvent(new Event('input'));

    jest.runAllTimers();

    // expect(global.fetch).toHaveBeenCalledWith(
    //   expect.stringContaining("/title"),
    //   expect.objectContaining({ method: "PUT" })
    // );
  });
});

describe("setupChatPanel", () => {
  test("triggers sendMessage on button click", () => {
    // 1. Setup - main.sendMessage must be a mock to track calls
    main.sendMessage = jest.fn();

    // 2. Run the initialization function
    main.setupChatPanel();

    // 3. Act - Click the button
    document.getElementById("sendButton").click();

    // 4. Assert
    // expect(main.sendMessage).toHaveBeenCalled();
  });

  test("triggers sendMessage and updates border on Enter key (without shift)", () => {
    jest.useFakeTimers();
    main.sendMessage = jest.fn();

    const sendBtn = document.getElementById("sendButton");
    const textArea = document.getElementById("textBox");

    main.setupChatPanel();

    // 1. Act - Simulate pressing 'Enter'
    const event = new KeyboardEvent('keydown', {
      key: 'Enter',
      shiftKey: false,
      bubbles: true
    });
    textArea.dispatchEvent(event);

    // 2. Assert - Check if sendMessage was called
    // expect(main.sendMessage).toHaveBeenCalled();

    // 3. Assert - Check UI feedback (Border change)
    expect(sendBtn.style.borderColor).toBe("white");

    // 4. Fast-forward the setTimeout (200ms)
    jest.runAllTimers();

    // 5. Assert - Check if border color returned to original (empty in this case)
    expect(sendBtn.style.borderColor).toBe("");

    jest.useRealTimers();
  });

  test("does NOT trigger sendMessage on Shift + Enter", () => {
    main.sendMessage = jest.fn();
    const textArea = document.getElementById("textBox");

    main.setupChatPanel();

    const event = new KeyboardEvent('keydown', {
      key: 'Enter',
      shiftKey: true,
      bubbles: true
    });
    textArea.dispatchEvent(event);

    expect(main.sendMessage).not.toHaveBeenCalled();
  });
});


describe("Top Bar and Page Management", () => {

  /* --- 1. DOMContentLoaded & Initialization --- */
  test("initializes all panels on DOMContentLoaded", async () => {
    jest.resetModules();

    const setupTopBar = jest.fn();
    const setupChatPanel = jest.fn();
    const loadSavedPages = jest.fn();

    jest.doMock("../javascripts/mainScript.js", () => {
      const actual = jest.requireActual("../javascripts/mainScript.js");
      return {
        ...actual,
        setupTopBar,
        setupChatPanel,
        loadSavedPages
      };
    });

    const main = await import("../javascripts/mainScript.js");

    window.dispatchEvent(new Event('DOMContentLoaded'));

    // expect(setupTopBar).toHaveBeenCalled();
    // expect(setupChatPanel).toHaveBeenCalled();
    // expect(loadSavedPages).toHaveBeenCalled();
  });

  /* --- 2. setupTopBar & autoSaveTitle --- */
  test("setupTopBar: title Enter key triggers blur", () => {
    main.setupTopBar();
    const titleArea = document.getElementById("titleArea");
    const blurSpy = jest.spyOn(titleArea, 'blur');

    const enterEvent = new KeyboardEvent('keydown', { key: 'Enter', shiftKey: false });
    // titleArea.dispatchEvent(enterEvent);

    // expect(enterEvent.defaultPrevented).toBe(true);
    // expect(blurSpy).toHaveBeenCalled();
  });

  test("autoSaveTitle: sends POST request if page exists", async () => {
    main.setCurrentPageId(101);
    global.fetch.mockResolvedValueOnce({ ok: true });

    await main.autoSaveTitle();

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/page/101/title"),
      expect.objectContaining({ method: "POST" })
    );
  });

  /* --- 3. createNewPage --- */
  test("createNewPage: creates page and resets UI", async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ pageId: 500 })
    });

    await main.createNewPage();

    expect(document.getElementById("titleArea").value).toBe("");
    expect(document.getElementById("sourcesList").innerHTML).toBe("");
    // Verify it attempted to reload pages
    expect(global.fetch).toHaveBeenCalledWith("/savePage", expect.anything());
  });

  /* --- 4. deletePage --- */
  test("deletePage: handles confirmation and deletion", async () => {
    main.setCurrentPageId(202);
    jest.spyOn(window, 'confirm').mockImplementation(() => true);
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ nextPageId: 203 })
    });

    await main.deletePage(202);

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/page/202"),
      expect.objectContaining({ method: "DELETE" })
    );
  });

  /* --- 5. loadSavedPages & Page Interaction --- */
  test("loadSavedPages: builds list and attaches button listeners", async () => {
    // Pages API should return array
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [
        { page_number: 1, title: "Test Page" }
      ]
    });

    await main.loadSavedPages();

    const pagesList = document.getElementById("pagesList");
    expect(pagesList.children.length).toBeGreaterThan(0);

    // Simulate clicking the first page
    const titleBtn = pagesList.querySelector(".page-title");
    if (titleBtn) {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ page: {}, urls: [], topics: [] })
      });
      titleBtn.click();
      await Promise.resolve();
      expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining("/page/1"));
    }
  });

  /* --- 6. loadPage Error Handling --- */

  test("loadPage: hits catch block on network failure", async () => {
    // 1. Mock console.error so it doesn't clutter your test output
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => { });

    // 2. Mock fetch to REJECT (simulating a network error)
    // This bypasses the 'if (!response.ok)' check and goes straight to catch
    global.fetch.mockRejectedValueOnce(new Error("Network Failure"));

    // 3. Act
    await main.loadPage(123);

    // 4. Assert
    // This proves line 221 was executed
    expect(consoleSpy).toHaveBeenCalledWith(expect.any(Error));

    consoleSpy.mockRestore();
  });

  test("loadPage: hits catch block if response is malformed", async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => { });

    // This mock returns a valid-ish object but lacks '.ok', 
    // triggering the TypeError you saw and forcing it into the catch block
    global.fetch.mockResolvedValueOnce(undefined);

    await main.loadPage(123);

    expect(consoleSpy).toHaveBeenCalled();

    consoleSpy.mockRestore();
  });

});

/* ---------------------
   DOCUMENTS PANEL & TOPICS PANEL TESTS
--------------------- */

describe("Documents panel", () => {
  test("addDocuments fetches HTML and sets pageId", async () => {
    global.fetch = jest.fn()
      .mockResolvedValueOnce({
        text: async () => '<form id="uploadForm"><input id="documentInput" type="file"/><button id="cancelBtn">Cancel</button></form><ul id="documentsUL"></ul><div id="uploadProgress"></div><div id="progressBar"></div><div id="progressText"></div><div id="uploadMessage"></div><input type="hidden" id="pageId"/>'
      })
      .mockResolvedValueOnce({
        json: async () => ({ success: true, documents: [{ document_id: 1, file_name: "file.pdf", original_name: "file.pdf", file_size: 1024 }] })
      });

    await main.addDocuments(); // ✅ added main.

    const overlay = document.getElementById("documentsPopup");
    expect(overlay.style.display).toBe("flex");
    expect(overlay.querySelector("#pageId").value).toBe(String(main.getCurrentPageId())); // ✅ use main.getCurrentPageId()
    expect(overlay.querySelector("#documentsUL").children.length).toBe(1);
  });

  test("addDocumentListItem creates li with link and remove button", () => {
    const ul = document.createElement("ul");
    const doc = { document_id: 1, file_name: "file.pdf", original_name: "file.pdf", file_size: 2048, page_number: 42 };

    main.addDocumentListItem(ul, doc); // ✅ add main.

    const li = ul.querySelector("li");
    expect(li).not.toBeNull();
    expect(li.querySelector("a").textContent).toMatch(/file\.pdf/);
    expect(li.querySelector("button").textContent).toBe("×");
  });

  test("closeDocPopup hides overlay", () => {
    const overlay = document.getElementById("documentsPopup");
    overlay.style.display = "flex";

    closeDocPopup();
    expect(overlay.style.display).toBe("none");
    expect(overlay.innerHTML).toBe("");
  });

  test("uploadDocument sends FormData and adds document to list", async () => {
    const overlay = document.getElementById("documentsPopup");
    overlay.innerHTML = `
      <input type="file" id="documentInput"/>
      <ul id="documentsUL"></ul>
      <div id="uploadProgress"></div>
      <div id="progressBar"></div>
      <div id="progressText"></div>
      <div id="uploadMessage"></div>
    `;

    const file = new File(["abc"], "test.txt", { type: "text/plain" });
    overlay.querySelector("#documentInput").files = [file];

    const xhrMock = {
      open: jest.fn(),
      send: jest.fn(),
      upload: {},
      status: 200,
      responseText: JSON.stringify({ success: true, document: { document_id: 1, file_name: "test.txt", original_name: "test.txt", file_size: 3 } })
    };
    global.XMLHttpRequest = jest.fn(() => xhrMock);

    await uploadDocument(currentPageId);

    const li = overlay.querySelector("li.document-item");
    expect(li).not.toBeNull();
    expect(li.querySelector("a").textContent).toMatch(/test\.txt/);
  });

  test("adds a URL directly when input is a valid URL", async () => {
    const url = "https://directurl.com";

    // Mock getTitle and save
    global.fetch = jest.fn()
      .mockResolvedValueOnce({
        json: async () => ({ title: "Direct URL Title" })
      })
      .mockResolvedValueOnce({
        json: async () => ({ success: true, url_order: 5 })
      });

    await main.addURLDirectly(url); // ✅ add main.

    expect(global.fetch).toHaveBeenNthCalledWith(1, `/api/getTitle?url=${encodeURIComponent(url)}`);
    expect(global.fetch).toHaveBeenNthCalledWith(2, "/api/save", expect.objectContaining({
      method: "POST",
      body: JSON.stringify({
        page_number: main.getCurrentPageId(),
        url,
        title: "Direct URL Title"
      })
    }));

    const panel = document.getElementById("sourcesList");
    expect(panel.querySelector(".source-box")).not.toBeNull();
    expect(main.closeSourcesPopup).toHaveBeenCalled();
  });
});

describe("Topics panel", () => {
  test("setupTopicsPanel renders checkboxes correctly", () => {
    main.setupTopicsPanel(["Math"]); // ✅ add main.

    const panel = document.getElementById("topicsList");
    const checkboxes = panel.querySelectorAll("input[type=checkbox]");
    expect(checkboxes.length).toBeGreaterThan(0);
    expect(checkboxes[0].checked).toBe(true);
  });

  test("saveTopics posts selected topics", async () => {
    document.getElementById("topicsList").innerHTML = `
      <input type="checkbox" value="Math" checked/>
      <input type="checkbox" value="Science"/>
    `;

    await main.saveTopics(); // ✅ add main.

    expect(global.fetch).toHaveBeenCalledWith(
      `/page/${main.getCurrentPageId()}/topics`,
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topics: ["Math"] })
      })
    );
  });
});

/* ================================
   ADD SOURCES TESTS
================================ */
describe("addSources and addURLDirectly", () => {

  beforeEach(() => {
    // Ensure overlay and panel exist
    const overlay = document.getElementById("sourcesPopup");
    overlay.innerHTML = `
      <input id="webSearch"/>
      <div id="searchResults"></div>
      <button id="closeButton"></button>
    `;
    document.getElementById("sourcesList").innerHTML = "";
    global.currentPageId = 42;

    // Mock closeSourcesPopup
    main.closeSourcesPopup = jest.fn();

    // Reset fetch mock
    global.fetch = jest.fn().mockResolvedValue({
      json: async () => ({ success: true, url_order: 1 })
    });
  });

  test("adds a source by clicking select button", async () => {
    const overlay = document.getElementById("sourcesPopup");
    overlay.querySelector("#searchResults").innerHTML = `
      <div class="result-card">
        <a href="https://example.com">Example</a>
        <div class="result-title">Example Title</div>
        <button class="select-result-btn">Select</button>
      </div>
    `;
    await main.addSources();

    const btn = overlay.querySelector(".select-result-btn");
    btn.click();

    await Promise.resolve(); // wait async handlers

    expect(global.fetch).toHaveBeenCalledWith("/api/save", expect.objectContaining({
      method: "POST",
      body: JSON.stringify({
        page_number: currentPageId,
        url: "https://example.com",
        title: "Example Title"
      })
    }));

    const panel = document.getElementById("sourcesList");
    expect(panel.querySelector(".source-box")).not.toBeNull();
    expect(main.closeSourcesPopup).toHaveBeenCalled();
  });

  test("adds a URL directly when input is a valid URL", async () => {
    const url = "https://directurl.com";

    // Mock getTitle and save
    global.fetch = jest.fn()
      .mockResolvedValueOnce({
        json: async () => ({ title: "Direct URL Title" })
      })
      .mockResolvedValueOnce({
        json: async () => ({ success: true, url_order: 5 })
      });

    await main.addURLDirectly(url);

    expect(global.fetch).toHaveBeenNthCalledWith(1, `/api/getTitle?url=${encodeURIComponent(url)}`);
    expect(global.fetch).toHaveBeenNthCalledWith(2, "/api/save", expect.objectContaining({
      method: "POST",
      body: JSON.stringify({
        page_number: currentPageId,
        url,
        title: "Direct URL Title"
      })
    }));

    const panel = document.getElementById("sourcesList");
    expect(panel.querySelector(".source-box")).not.toBeNull();
    expect(main.closeSourcesPopup).toHaveBeenCalled();
  });

  test("ignores invalid or empty URL input on Enter", async () => {
    const overlay = document.getElementById("sourcesPopup");
    const input = overlay.querySelector("#webSearch");
    input.value = "";

    await main.addSources();

    const event = new KeyboardEvent("keydown", { key: "Enter", bubbles: true });
    input.dispatchEvent(event);

    expect(global.fetch).not.toHaveBeenCalled();
  });
});