const input = document.getElementById("chatInput");
const messageArea = document.getElementById("messageArea");
const box = document.getElementById("titleArea");

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
    addMessage("Bot reply here!", "bot");
  }, 500);
}

/* Enter key support */
input.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }

  const box = document.querySelector(".text-box");
})

box.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();      // stop newline
    box.blur();              // exits the box (removes focus)
  }
})