const socket = io();

document.addEventListener("DOMContentLoaded", () => {
  const threadList = document.getElementById("thread-list");
  const messagesDiv = document.getElementById("messages");
  const chatForm = document.getElementById("chat-form");
  const messageInput = document.getElementById("message-input");
  const newThreadButton = document.getElementById("new-thread-button");
  const loadingIndicator = document.createElement("div");
  loadingIndicator.id = "loading";
  loadingIndicator.textContent = "Loading...";
  messagesDiv.appendChild(loadingIndicator);
  let currentThreadId = null;

  const loadThreads = async () => {
    const response = await fetch("/api/threads");
    const data = await response.json();
    threadList.innerHTML = "";
    data.threads.forEach((threadId) => {
      const li = document.createElement("li");
      li.textContent = `Thread ${threadId}`;
      li.dataset.threadId = threadId;

      const deleteButton = document.createElement('button');
      deleteButton.textContent = 'Delete';
      deleteButton.className = 'delete-button';
      deleteButton.addEventListener('click', async (event) => {
        event.stopPropagation();
        await deleteThread(threadId);
      });

      li.appendChild(deleteButton);
      li.addEventListener("click", () => selectThread(threadId));
      threadList.appendChild(li);
    });
  };

  const loadMessages = async (threadId) => {
    loadingIndicator.style.display = "block";
    const response = await fetch(`/api/messages?threadId=${threadId}`);
    const data = await response.json();
    messagesDiv.innerHTML = "";
    data.messages.forEach((message) => {
      addMessageToChat(message.content, message.role);
    });
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
    loadingIndicator.style.display = "none";
  };

  const selectThread = (threadId) => {
    currentThreadId = threadId;
    loadMessages(threadId);
  };

  const startNewConversation = () => {
    currentThreadId = null;
    messagesDiv.innerHTML = "";
    messageInput.value = "";
  };

  const addMessageToChat = (message, role) => {
    const div = document.createElement("div");
    div.classList.add("message", role);
    div.innerHTML = message
      .replace(/###\s(.*?)\n/g, "<h3>$1</h3>") // heading 3
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>") // bold
      .replace(/\*(.*?)\*/g, "<em>$1</em>") // italic
      .replace(/\n/g, "<br>"); // newline
    messagesDiv.appendChild(div);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
  };

  const deleteThread = async (threadId) => {
    const response = await fetch(`/api/thread/${threadId}`, {
      method: 'DELETE',
    });
    if (response.ok) {
      if (currentThreadId === threadId) {
        startNewConversation();
      }
      loadThreads();
    } else {
      console.error('Failed to delete thread:', threadId);
    }
  };

  chatForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const message = messageInput.value.trim();
    if (!message) return;

    // Mesajınızı ekrana ekleyin
    addMessageToChat(message, "user");

    // Input alanını temizleyin
    messageInput.value = "";

    // Mesajı sunucuya gönderin
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, threadId: currentThreadId }),
    });

    const data = await response.json();
    currentThreadId = data.threadId;

    // Karşıdan gelen mesajı bekleyin ve ekleyin
    await loadMessages(currentThreadId);
    loadThreads(); // Threads listesine yeni thread eklemek için tekrar yükle
  });

  newThreadButton.addEventListener("click", startNewConversation);

  socket.on("newMessage", async (data) => {
    if (data.threadId === currentThreadId) {
      await loadMessages(currentThreadId);
    }
  });

  loadThreads();
});
