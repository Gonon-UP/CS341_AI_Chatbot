/**
 * @jest-environment jsdom
 */

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

/* ================================
   GLOBAL FETCH MOCK
================================ */
global.fetch = jest.fn();

/* ================================
   DOM SETUP
================================ */
function setupDOM() {
  document.body.innerHTML = `
    <textarea id="textBox"></textarea>
    <button id="sendButton"></button>
    <div id="messageArea"></div>

    <div id="sourcesPopup"></div>

    <div id="topicsList"></div>
  `;
}

/* ================================
   RESET BEFORE EACH TEST
================================ */
beforeEach(() => {
  setupDOM();
  jest.clearAllMocks();
  global.fetch.mockReset();
});

/* =========================================================
   TESTS
========================================================= */

describe("sendMessage", () => {

  test("adds user and bot messages", async () => {
    const textBox = document.getElementById("textBox");
    textBox.value = "hello";

    await main.sendMessage();

    const messages = document.querySelectorAll(".message");

    expect(messages.length).toBe(2);
    expect(messages[0].textContent).toBe("hello");
    expect(messages[1].textContent).toBe("bot:hello");
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

    expect(textBox.disabled).toBe(true);
    expect(sendBtn.disabled).toBe(true);

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

describe("saveTopics", () => {

  test("does nothing if no pageId", async () => {
    await main.saveTopics();

    expect(fetch).not.toHaveBeenCalled();
  });

});
