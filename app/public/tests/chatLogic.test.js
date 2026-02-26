import {
  formatBotReply,
  isValidMessage,
  buildSearchUrl,
  buildResultCardHTML,
  buildSourceCardHTML
} from "../javascripts/chatLogic.js";


describe("chatLogic.js", () => {
  
  test("formatBotReply should include query", () => {
    expect(formatBotReply("hello"))
      .toBe("This is a reply to: hello");
  });


  // isValidMessage
  describe("isValidMessage", () => {

    test("should reject empty string", () => {
      expect(isValidMessage("")).toBe(false);
    });

    test("should reject whitespace", () => {
      expect(isValidMessage("   ")).toBe(false);
    });

    test("should accept normal message", () => {
      expect(isValidMessage("hello")).toBe(true);
    });

    test("should accept crazy message", () => {
      expect(isValidMessage("5 ; \' \" alskjdf;oiasd0198340")).toBe(true);
    });
  });


  // buildSearchURL
  describe("buildSearchUrl", () => {

    test("should encode spaces", () => {
      expect(buildSearchUrl("hello world"))
        .toBe("/search?q=hello%20world");
    });

    test("should encode special characters", () => {
      expect(buildSearchUrl("100% free"))
        .toBe("/search?q=100%25%20free");
    });
  });


  // buildResultCardHTML
  describe("buildResultCardHTML", () => {

    const result = {
      link: "https://example.com",
      title: "Example Site",
      snippet: "Example snippet"
    };

    const html = buildResultCardHTML(result);

    test("should contain link", () => {
      expect(html).toContain(result.link);
    });

    test("should contain title", () => {
      expect(html).toContain(result.title);
    });

    test("should contain select button", () => {
      expect(html).toContain("select-result-btn");
    });

    test("should contain data attributes", () => {
      expect(html).toContain("data-url");
      expect(html).toContain("data-title");
    });
  });


  // buildSourceCardHTML
  describe("buildSourceCardHTML", () => {

    test("should generate source card HTML", () => {
      const url = "https://example.com";
      const title = "Example";

      const html = buildSourceCardHTML(url, title);

      expect(html).toContain(url);
      expect(html).toContain(title);
      expect(html).toContain("remove-source");
    });

    test("should include favicon path", () => {
      const url = "https://example.com";

      const html = buildSourceCardHTML(url, "Test");

      expect(html).toContain(`${url}/favicon.ico`);
    });
  });
});