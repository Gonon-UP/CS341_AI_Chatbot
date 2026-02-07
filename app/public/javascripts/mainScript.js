const input = document.getElementById("chatInput");
const messageArea = document.getElementById("messageArea");
const titleArea = document.getElementById("titleArea");

// adds messages to the messageArea (display)
function addMessage(text, type = "user") {
  const msg = document.createElement("div");
  msg.className = `message ${type}`;
  msg.textContent = text;

  messageArea.appendChild(msg);

  // auto scroll to bottom
  messageArea.scrollTop = messageArea.scrollHeight;
}

// sends messages somewhere (implement better later)
async function sendMessage() {
    const input = document.getElementById("chatInput");
    const button = document.querySelector(".send-button");
    const messageArea = document.getElementById("messageArea");

    if (!input.value.trim()) return;

    // Disable input & button while bot responds
    input.disabled = true;
    button.disabled = true;

    const userQuery = input.value;
    input.value = "";

    // Show user message using your bubble function
    addMessage(userQuery, "user");

    // Optional: typing indicator
    addMessage("Bot is typing...", "typing");

    try {
        // Simulate bot response (replace with your API call)
        const botReply = await getBotReply(userQuery);

        // Remove typing indicator
        const typingEl = messageArea.querySelector(".typing");
        if (typingEl) typingEl.remove();

        // Show bot reply in a bubble
        addMessage(botReply, "bot");
    } catch (err) {
        console.error(err);
    } finally {
        // Re-enable input & button
        input.disabled = false;
        button.disabled = false;
        input.focus();
    }
}

// Example async bot function
async function getBotReply(query) {
    // Replace this with your actual bot API call
    return new Promise(resolve => {
        setTimeout(() => resolve("This is a reply to: " + query), 1000);
    });
}

/* Enter key support */
input.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }

  const box = document.querySelector(".text-box");
})

titleArea.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();      // stop newline
    titleArea.blur();              // exits the box (removes focus)
  }
})