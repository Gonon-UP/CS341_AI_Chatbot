const titleArea = document.getElementById("titleArea");
const messageArea = document.getElementById("messageArea");
const textArea = document.getElementById("textBox");
const sendBtn = document.getElementById("sendButton"); 

// Title textbox at top of page
titleArea.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();      // stop newline
    titleArea.blur();        // exits the box (removes focus)
  }
})

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
    if (!textArea.value.trim()) return;

    // Disable textArea & button while bot responds
    textArea.disabled = true;
    sendBtn.disabled = true;

    const userQuery = textArea.value;
    textArea.value = "";

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
        // Re-enable textArea & sendBtn
        textArea.disabled = false;
        sendBtn.disabled = false;
        textArea.focus();
    }
}

// Called by "+ Add Web Sources"
async function addSources() {
  // Not implemented yet, should allow the user to search the web
}

// Example async bot function
async function getBotReply(query) {
    // Replace this with your actual bot API call
    return new Promise(resolve => {
        setTimeout(() => resolve("This is a reply to: " + query), 1000);
    });
}

/* Enter key support */
textArea.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    sendMessage();

    // Make button light up when textArea sends a message
    const originalColor = sendBtn.style.borderColor;
  
    // Change to highlight color (triggers transition)
    sendBtn.style.borderColor = 'white'; 

    setTimeout(() => {
      // Revert to original (triggers transition back)
      sendBtn.style.borderColor = originalColor;
    }, 200);
  }

  const box = document.querySelector(".text-box");
})