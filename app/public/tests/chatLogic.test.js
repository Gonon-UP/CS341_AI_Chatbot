// public/tests/chatLogic.test.js
import * as main from "../javascripts/mainScript.js";
import { 
  formatBotReply, isValidMessage, buildSearchUrl,
  buildResultCardHTML, buildSourceCardHTML,
  buildPageCardHTML, buildTopicCardHTML
} from "../javascripts/chatLogic.js";

// Reset DOM and mocks before each test
beforeEach(() => {
  document.body.innerHTML = `
    <div id="messageArea"></div>
    <textarea id="textBox">hello</textarea>
    <button id="sendButton"></button>
    <div id="sourcesList"></div>
    <div id="pagesList"></div>
    <div id="topicsList">
      <input type="checkbox" value="Philosophy" checked />
      <input type="checkbox" value="Psychology" />
    </div>
  `;

  // Reassign global references expected by mainScript
  global.textArea = document.getElementById("textBox");
  global.messageArea = document.getElementById("messageArea");
  global.sendBtn = document.getElementById("sendButton");

  main.currentPageId = 99;

  // Mock bot reply
  main.getBotReply = jest.fn().mockResolvedValue("bot reply");

  // Mock fetch
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ success: true }),
  });

  // Setup event listeners
  main.setupChatPanel();
});

describe("chatLogic.js", () => {
  test("formatBotReply should include query", () => {
    expect(formatBotReply("hello")).toBe("This is a reply to: hello");
  });

  describe("isValidMessage", () => {
    test("rejects empty string", () => expect(isValidMessage("")).toBe(false));
    test("rejects whitespace", () => expect(isValidMessage("   ")).toBe(false));
    test("accepts normal message", () => expect(isValidMessage("hello")).toBe(true));
    test("accepts crazy characters", () => expect(isValidMessage("5 ; ' \" alskjdf;oiasd0198340")).toBe(true));
  });

  describe("buildSearchUrl", () => {
    test("encodes spaces", () => expect(buildSearchUrl("hello world")).toBe("/search?q=hello%20world"));
    test("encodes special characters", () => expect(buildSearchUrl("100% free")).toBe("/search?q=100%25%20free"));
  });

  describe("buildResultCardHTML", () => {
    const result = { link: "https://example.com", title: "Example Site", snippet: "Snippet" };
    const html = buildResultCardHTML(result);
    test("contains link", () => expect(html).toContain(result.link));
    test("contains title", () => expect(html).toContain(result.title));
    test("contains select button", () => expect(html).toContain("select-result-btn"));
    test("contains data attributes", () => {
      expect(html).toContain("data-url");
      expect(html).toContain("data-title");
    });
  });

  describe("buildSourceCardHTML", () => {
    const html = buildSourceCardHTML("https://example.com", "Test");
    test("generates source card HTML", () => {
      expect(html).toContain("https://example.com");
      expect(html).toContain("Test");
      expect(html).toContain("remove-source");
    });
    test("includes favicon path", () => {
      expect(html).toContain("https://www.google.com/s2/favicons?domain=https://example.com");
    });
  });

  test("loadSourcesFromDB renders multiple sources without errors", () => {
    const urls = [
      { url: "https://a.com", title: "A", url_order: 1 },
      { url: "https://b.com", title: "B", url_order: 2 }
    ];
    expect(() => main.loadSourcesFromDB(urls)).not.toThrow();
    expect(document.querySelectorAll(".source-box").length).toBe(2);
  });

  /*test("sendMessage adds user and bot messages without throwing", async () => {
    // Make sure textarea has value
    global.textArea.value = "hello";
    await expect(main.sendMessage()).resolves.not.toThrow();
    expect(document.getElementById("messageArea").textContent).toContain("hello");
    expect(document.getElementById("messageArea").textContent).toContain("bot reply");
  });

  test("saveTopics calls fetch with selected topics", async () => {
    await main.saveTopics();
    expect(fetch).toHaveBeenCalledWith(
      "/page/99/topics",
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topics: ["Philosophy"] }),
      })
    );
  });*/

  test("buildPageCardHTML returns page title", () => {
    expect(buildPageCardHTML({ page_number: 1, title: "My Page" })).toContain("My Page");
  });

  test("buildTopicCardHTML returns topic name", () => {
    expect(buildTopicCardHTML("Philosophy")).toContain("Philosophy");
  });
});
