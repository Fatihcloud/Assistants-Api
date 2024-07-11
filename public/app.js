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
  const typingIndicator = document.getElementById("typing-indicator");
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
    hljs.highlightAll();
    MathJax.typeset(); // Highlight.js ile kod bloklarını renklendir
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

  const escapeHtml = (unsafe) => {
    return unsafe
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  };

  const addMessageToChat = (message, role) => {
    const div = document.createElement("div");
    div.classList.add("message", role);

    // Markdown içeriğini HTML'e dönüştürürken latex ifadelerini işle
    const markdownToHtml = (content) => {
      //markdown işlemek
      content = content.replace(/`(.*?)`/g, '<code>$1</code>');
      content = content.replace(/_(.*?)_/g, '<em>$1</em>');
      content = content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      // \n işle
      content = content.replace(/\n/g, "<br>");
      const latexRegex = /\$(.*?)\$/g;
      return content.replace(latexRegex, (_, latex) => {
        return `<span class="math-tex">${latex}</span>`;
      });
    };
    div.innerHTML = markdownToHtml(escapeHtml(message));

    // Add copy button to code blocks
    div.querySelectorAll("pre code").forEach((codeBlock) => {
      const button = document.createElement("button");
      button.className = "copy-button";
      button.innerHTML = '<i class="fas fa-copy"></i>';
      button.addEventListener("click", () => copyToClipboard(codeBlock.textContent));
      codeBlock.parentNode.insertBefore(button, codeBlock.nextSibling);
    });

    messagesDiv.appendChild(div);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
    hljs.highlightAll(); // Highlight.js ile kod bloklarını renklendir

    // MathJax tarafından LaTeX ifadelerini işle
    MathJax.typeset();
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

    // "Assistant is typing..." göstergesini ekleyin
    typingIndicator.style.display = "block";

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
    typingIndicator.style.display = "none";
    loadThreads(); // Threads listesine yeni thread eklemek için tekrar yükle
  });

  newThreadButton.addEventListener("click", startNewConversation);

  socket.on("newMessage", async (data) => {
    if (data.threadId === currentThreadId) {
      await loadMessages(currentThreadId);
      typingIndicator.style.display = "none";
    }
  });

  loadThreads();
});

function copyToClipboard(text) {
  const textArea = document.createElement("textarea");
  textArea.value = text;
  document.body.appendChild(textArea);
  textArea.select();
  try {
    document.execCommand('copy');
    alert('Code copied to clipboard!');
  } catch (err) {
    console.error('Unable to copy to clipboard', err);
  }
  document.body.removeChild(textArea);
}
