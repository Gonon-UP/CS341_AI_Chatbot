import {
  formatBotReply,
  isValidMessage,
  buildSearchUrl,
  buildResultCardHTML
} from "../javascripts/chatLogic.js";

test("formats bot reply", () => {
  expect(formatBotReply("hi"))
    .toBe("This is a reply to: hi");
});

test("validates messages", () => {
  expect(isValidMessage("")).toBe(false);
  expect(isValidMessage("   ")).toBe(false);
  expect(isValidMessage("hello")).toBe(true);
});

test("builds search URL", () => {
  expect(buildSearchUrl("hello world"))
    .toBe("/search?q=hello%20world");
});

test("builds result card html", () => {
  const html = buildResultCardHTML({
    title: "Test",
    link: "https://example.com",
    snippet: "Example"
  });

  expect(html).toContain("Test");
  expect(html).toContain("https://example.com");
});