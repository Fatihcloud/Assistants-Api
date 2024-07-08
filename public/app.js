const socket = io();

socket.on('newMessage', function(data) {
    if (data.threadId === window.currentThreadId) {
        appendNewMessages(data.messages);
    }
});

// Fonksiyonları tanımlayın
async function sendMessage() {
    const input = document.getElementById('message-input');
    const message = input.value;
    const threadId = window.currentThreadId;
    if (message) {
        const response = await fetch('http://localhost:3000/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message, threadId })
        });
        const data = await response.json();
        if (data && data.messages && data.messages.length > 0) {
            appendNewMessages([data.messages[data.messages.length - 1]]);
        }
        input.value = '';
        input.focus(); // Mesaj gönderildikten sonra input alanına odaklanma
    }
}

async function createNewThread() {
    const input = document.getElementById('message-input');
    const message = input.value;
    if (message) {
        const response = await fetch('http://localhost:3000/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message })
        });
        const data = await response.json();
        if (data && data.threadId) {
            window.currentThreadId = data.threadId; // Yeni thread ID'sini güncelle
            updateMessageList(data.messages);
            input.value = '';
            loadThreads();
        }
    }
}

async function loadMessages(threadId) {
    const response = await fetch(`http://localhost:3000/api/messages?threadId=${threadId}`);
    const data = await response.json();
    if (data && data.messages) {
        updateMessageList(data.messages);
    }
}

async function loadThreads() {
    const response = await fetch('http://localhost:3000/api/threads');
    const data = await response.json();
    const threadList = document.getElementById('thread-list');
    threadList.innerHTML = '';
    if (data && data.threads) {
        data.threads.forEach(thread => {
            const li = document.createElement('li');
            li.textContent = thread;
            li.onclick = function() {
                switchThread(thread);
            };
            threadList.appendChild(li);
        });
    }
}

async function switchThread(threadId) {
    const response = await fetch(`http://localhost:3000/api/messages?threadId=${threadId}`);
    const data = await response.json();
    if (data && data.messages) {
        updateMessageList(data.messages);
        window.currentThreadId = threadId;  // Mevcut thread ID'sini güncelle
    }
}

function updateMessageList(messages) {
    const messageList = document.getElementById('message-list');
    messageList.innerHTML = '';
    messages.forEach(message => {
        const li = document.createElement('li');
        li.textContent = `${message.role}: ${message.content}`;
        messageList.appendChild(li);
    });
}

function appendNewMessages(messages) {
    const messageList = document.getElementById('message-list');
    messages.forEach(message => {
        const li = document.createElement('li');
        li.textContent = `${message.role}: ${message.content}`;
        messageList.appendChild(li);
    });
}

// Fonksiyonları window nesnesine atayın
window.sendMessage = sendMessage;
window.createNewThread = createNewThread;
window.loadMessages = loadMessages;
window.loadThreads = loadThreads;
window.switchThread = switchThread;

// DOMContentLoaded olayını dinleyin ve fonksiyonları çağırın
document.addEventListener("DOMContentLoaded", function() {
    loadThreads();
    window.currentThreadId = null; // Başlangıçta null yapın
});
