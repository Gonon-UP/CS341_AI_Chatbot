const input = document.getElementById("chatInput");
const messageArea = document.getElementById("messageArea");

function addMessage(text, type = "user") {
  const msg = document.createElement("div");
  msg.className = `message ${type}`;
  msg.textContent = text;

  messageArea.appendChild(msg);

  // auto scroll to bottom
  messageArea.scrollTop = messageArea.scrollHeight;
}

function sendMessage() {
  const text = input.value.trim();
  if (!text) return;

  addMessage(text, "user");
  input.value = "";

  // fake bot reply (optional test)
  setTimeout(() => {
    addMessage("Bot reply here 🤖", "bot");
  }, 500);
}

/* Enter key support */
input.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
});