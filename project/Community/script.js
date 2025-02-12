const ws = new WebSocket('wss://community-chats.onrender.com');
let isAuthenticated = false;

// Debugging: Log WebSocket events
ws.onopen = () => {
    console.log('WebSocket connection established');
};

ws.onerror = (error) => {
    console.error('WebSocket error:', error);
};

ws.onclose = () => {
    console.log('WebSocket connection closed');
};

ws.onmessage = (event) => {
    console.log('Message received:', event.data);
    const data = JSON.parse(event.data);

    if (data.type === 'auth-response') {
        if (data.success) {
            isAuthenticated = true;
            document.getElementById('admin-controls').style.display = 'block';
            document.getElementById('login-form').style.display = 'none';
            console.log('Admin authenticated');
        } else {
            alert('Authentication failed');
        }
    } else if (data.type === 'history') {
        // Display message history
        data.messages.forEach(message => displayMessage(message));
    } else if (data.type === 'message') {
        // Display new message
        displayMessage(data.content);
    }
};

function authenticateAdmin() {
    const password = document.getElementById('admin-password').value;
    if (password) {
        console.log('Sending authentication request');
        ws.send(JSON.stringify({
            type: 'auth',
            password: password
        }));
    } else {
        alert('Please enter a password');
    }
}

function sendMessage() {
    if (!isAuthenticated) {
        console.error('Not authenticated');
        return;
    }

    const messageInput = document.getElementById('message-input');
    const message = messageInput.value.trim();

    if (message) {
        console.log('Sending message:', message);
        ws.send(JSON.stringify({
            type: 'message',
            content: {
                type: 'text',
                data: message,
                timestamp: new Date().toISOString()
            }
        }));
        messageInput.value = '';
    }
}

function uploadMedia() {
    if (!isAuthenticated) {
        console.error('Not authenticated');
        return;
    }

    const fileInput = document.getElementById('media-upload');
    const files = fileInput.files;

    if (files.length === 0) {
        alert('Please select a file to upload.');
        return;
    }

    for (let file of files) {
        const reader = new FileReader();
        reader.onload = (event) => {
            const base64Data = event.target.result;
            console.log('Sending media file:', file.name);
            ws.send(JSON.stringify({
                type: 'message',
                content: {
                    type: file.type.startsWith('image') ? 'image' : 'video',
                    data: base64Data,
                    timestamp: new Date().toISOString()
                }
            }));
        };
        reader.onerror = (error) => {
            console.error('Error reading file:', error);
        };
        reader.readAsDataURL(file);
    }
}

function displayMessage(message) {
    const chatMessages = document.getElementById('chat-messages');
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message';

    let content;
    if (message.type === 'text') {
        content = document.createElement('p');
        content.textContent = message.data;
    } else if (message.type === 'image') {
        content = document.createElement('img');
        content.src = message.data;
        content.className = 'media-preview';
    } else if (message.type === 'video') {
        content = document.createElement('video');
        content.src = message.data;
        content.className = 'media-preview';
        content.controls = true;
    }

    const timestamp = document.createElement('small');
    timestamp.textContent = new Date(message.timestamp).toLocaleString();

    messageDiv.appendChild(content);
    messageDiv.appendChild(timestamp);
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}
