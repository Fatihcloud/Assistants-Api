const socket = io('http://localhost:3000');

socket.on('newMessage', function(data) {
    console.log('Received new message via socket:', data);
    if (data.threadId === window.currentThreadId) {
        appendNewMessages(data.messages);
    }
});

async function sendMessage(event) {
    event.preventDefault(); // Formun otomatik olarak gönderilmesini engelle
    const input = document.getElementById('message-input');
    const message = input.value;
    const threadId = window.currentThreadId;
    console.log('Sending message:', message, 'to thread:', threadId);
    if (message) {
        const response = await fetch('http://localhost:3000/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message, threadId })
        });
        if (response.ok) {
            const data = await response.json();
            console.log('Response from sendMessage:', data);
            if (data && data.messages && data.messages.length > 0) {
                appendNewMessages([data.messages[data.messages.length - 1]]);
            }
            input.value = '';
            input.focus();
        } else {
            console.error('Failed to send message', response.statusText);
        }
    }
}

async function createNewThread(event) {
    event.preventDefault(); // Formun otomatik olarak gönderilmesini engelle
    const input = document.getElementById('message-input');
    const message = input.value;
    console.log('Creating new thread with initial message:', message);
    if (message) {
        const response = await fetch('http://localhost:3000/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message })
        });
        if (response.ok) {
            const data = await response.json();
            console.log('Response from createNewThread:', data);
            if (data && data.threadId) {
                window.currentThreadId = data.threadId;
                updateMessageList(data.messages);
                input.value = '';
                loadThreads(); // Yeni thread oluşturulduğunda thread listesini yeniden yükle
            }
        } else {
            console.error('Failed to create new thread', response.statusText);
        }
    }
}

async function loadMessages(threadId) {
    console.log('Loading messages for thread:', threadId);
    const response = await fetch(`http://localhost:3000/api/messages?threadId=${threadId}`);
    if (response.ok) {
        const data = await response.json();
        console.log('Messages loaded for thread:', threadId, data);
        if (data && data.messages) {
            updateMessageList(data.messages);
        }
    } else {
        console.error('Failed to load messages', response.statusText);
    }
}

async function loadThreads() {
    console.log('Loading threads');
    const response = await fetch('http://localhost:3000/api/threads');
    if (response.ok) {
        const data = await response.json();
        console.log('Threads loaded:', data);
        const threadList = document.getElementById('thread-list');
        threadList.innerHTML = '';
        if (data && data.threads) {
            data.threads.forEach(thread => {
                const li = document.createElement('li');
                li.textContent = `Thread ${thread}`;
                li.onclick = function() {
                    switchThread(thread);
                };
                threadList.appendChild(li);
            });
        }
    } else {
        console.error('Failed to load threads', response.statusText);
    }
}

async function switchThread(threadId) {
    console.log('Switching to thread:', threadId);
    window.currentThreadId = threadId;
    const response = await fetch(`http://localhost:3000/api/messages?threadId=${threadId}`);
    if (response.ok) {
        const data = await response.json();
        console.log('Switched to thread:', threadId, data);
        if (data && data.messages) {
            updateMessageList(data.messages);
        }
    } else {
        console.error('Failed to switch thread', response.statusText);
    }
}

function updateMessageList(messages) {
    console.log('Updating message list with messages:', messages);
    const messageList = document.getElementById('message-list');
    messageList.innerHTML = '';
    messages.forEach(message => {
        const li = document.createElement('li');
        li.classList.add(message.role);
        li.textContent = `${message.role}: ${message.content}`;
        messageList.appendChild(li);
    });
}

function appendNewMessages(messages) {
    console.log('Appending new messages:', messages);
    const messageList = document.getElementById('message-list');
    messages.forEach(message => {
        const li = document.createElement('li');
        li.classList.add(message.role);
        li.textContent = `${message.role}: ${message.content}`;
        messageList.appendChild(li);
    });
}

window.sendMessage = sendMessage;
window.createNewThread = createNewThread;
window.loadMessages = loadMessages;
window.loadThreads = loadThreads;
window.switchThread = switchThread;

document.addEventListener("DOMContentLoaded", function() {
    loadThreads();
    window.currentThreadId = null;
});
