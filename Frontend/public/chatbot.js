class Chatbot {
    constructor() {
        this.responses = {
            greetings: [
                "Hello! How can I assist you today?",
                "Hi there! What can I help you with?",
                "Greetings! I'm here to help.",
                "Hello! Nice to meet you!"
            ],
            howAreYou: [
                "I'm doing great, thank you for asking! How about you?",
                "I'm functioning perfectly! How can I help you?",
                "All systems are running smoothly! What's on your mind?",
                "I'm excellent! Ready to assist you with anything you need."
            ],
            help: [
                "I can help you with various tasks! Try asking me about the weather, tell me a joke, or ask for recommendations.",
                "I'm your AI assistant! I can answer questions, have conversations, and help with information. What would you like to know?",
                "I'm here to assist! You can ask me questions, request information, or just have a friendly chat. What interests you?",
                "I can help with many things! Try asking me about topics, requesting information, or just chat with me. What's on your mind?"
            ],
            weather: [
                "I don't have access to real-time weather data, but I'd recommend checking a weather app or website for current conditions in your area!",
                "For accurate weather information, please check a local weather service. Is there anything else I can help you with?",
                "I can't provide live weather updates, but I'd be happy to help with other questions you might have!"
            ],
            // Note: 'joke' category removed so it goes to the C Server!
            time: [
                "I don't have access to your current time, but you can check your device's clock for the accurate time!",
                "Time is relative, but your device should show you the current local time!",
                "I can't access real-time data, but your system clock should have the current time!"
            ],
            default: [
                "That's interesting! Tell me more about that.",
                "I see! What else would you like to discuss?",
                "Fascinating! How does that make you feel?",
                "I understand. Is there anything specific you'd like to know about this topic?",
                "That's a great point! What are your thoughts on it?",
                "I'm here to listen and help. What would you like to explore further?"
            ],
            thanks: [
                "You're very welcome! 😊",
                "Happy to help! Let me know if you need anything else.",
                "My pleasure! Is there anything else I can assist you with?",
                "You're welcome! I'm always here to help."
            ],
            goodbye: [
                "Goodbye! Have a wonderful day! 👋",
                "See you later! Take care!",
                "Farewell! It was great chatting with you!",
                "Bye for now! Feel free to come back anytime!"
            ]
        };
        
        this.soundEnabled = false;
        this.messageHistory = [];
        this.init();
    }

    init() {
        this.loadSettings();
        this.addEventListeners();
        this.scrollToBottom();
    }

    addEventListeners() {
        const messageInput = document.getElementById('messageInput');
        messageInput.addEventListener('keypress', (e) => this.handleKeyPress(e));
        messageInput.addEventListener('input', () => this.toggleSendButton());
    }

    handleKeyPress(event) {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            this.sendMessage();
        }
    }

    toggleSendButton() {
        const messageInput = document.getElementById('messageInput');
        const sendBtn = document.getElementById('sendBtn');
        sendBtn.disabled = !messageInput.value.trim();
    }

    // --- NEW FUNCTION: CONNECT TO C SERVER (Cloud or Local) ---
    async fetchFromBackend(userMessage) {
        try {
            // --- DEPLOYMENT STEP ---
            // 1. Once deployed to Render, paste the URL here (e.g., https://jester-backend.onrender.com)
            // 2. Keep the quotes! Do NOT add a trailing slash '/' at the end.
            
            const backendUrl = "INSERT_YOUR_RENDER_URL_HERE"; 
            
            // --- LOCAL TESTING ---
            // If testing on your computer, uncomment the line below and comment out the line above:
            // const backendUrl = "http://localhost:7777"; 

            const response = await fetch(`${backendUrl}/${userMessage}`);
            
            if (!response.ok) {
                throw new Error("Server disconnected");
            }
            
            // Returns the joke/text from the C server
            const text = await response.text();
            return text;
        } catch (error) {
            console.error("Connection failed:", error);
            return "I'm having trouble connecting to the Jester server. Is the C backend running?";
        }
    }

    // --- UPDATED SEND MESSAGE FUNCTION ---
    async sendMessage() {
        const messageInput = document.getElementById('messageInput');
        const message = messageInput.value.trim();
        
        if (!message) return;
        
        // 1. Show User Message immediately
        this.addMessage(message, 'user');
        messageInput.value = '';
        this.toggleSendButton();
        this.playSound('send');
        
        // 2. Show typing indicator
        this.showTypingIndicator();

        // 3. Process Response
        setTimeout(async () => {
            let finalResponse;
            const lowerMsg = message.toLowerCase();

            // Check if we have a local "Quick Answer" (Hello, Time, Help, etc.)
            const localCategory = this.checkLocalKeywords(lowerMsg);

            if (localCategory) {
                // If it's a basic chat (Hello/Thanks), use JavaScript response
                finalResponse = this.getRandomResponse(localCategory);
            } else {
                // If it's NOT a basic chat (User asked for a topic/joke), ask C Server
                finalResponse = await this.fetchFromBackend(message);
            }

            this.hideTypingIndicator();
            this.addMessage(finalResponse, 'bot');
            this.playSound('receive');
            
        }, 600);
    }

    sendQuickReply(message) {
        document.getElementById('messageInput').value = message;
        this.sendMessage();
    }

    addMessage(content, sender) {
        const chatMessages = document.getElementById('chatMessages');
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}-message`;
        
        const messageContent = document.createElement('div');
        messageContent.className = 'message-content';
        messageContent.innerHTML = `<p>${this.escapeHtml(content)}</p>`;
        
        const messageTime = document.createElement('div');
        messageTime.className = 'message-time';
        messageTime.textContent = this.getCurrentTime();
        
        messageDiv.appendChild(messageContent);
        messageDiv.appendChild(messageTime);
        
        chatMessages.appendChild(messageDiv);
        
        this.messageHistory.push({ content, sender, time: new Date() });
        
        this.scrollToBottom();
    }

    // Helper to check which category a message belongs to
    checkLocalKeywords(message) {
        if (this.containsKeywords(message, ['hello', 'hi', 'hey', 'greetings'])) return 'greetings';
        if (this.containsKeywords(message, ['how are you', 'how do you do'])) return 'howAreYou';
        if (this.containsKeywords(message, ['help', 'assist', 'support'])) return 'help';
        if (this.containsKeywords(message, ['weather', 'forecast'])) return 'weather';
        if (this.containsKeywords(message, ['time', 'clock'])) return 'time';
        if (this.containsKeywords(message, ['thank', 'thanks'])) return 'thanks';
        if (this.containsKeywords(message, ['bye', 'goodbye'])) return 'goodbye';
        
        // If no keywords matched, return null (meaning: Ask C Server)
        return null;
    }

    containsKeywords(message, keywords) {
        return keywords.some(keyword => message.includes(keyword));
    }

    getRandomResponse(category) {
        const responses = this.responses[category];
        return responses[Math.floor(Math.random() * responses.length)];
    }

    showTypingIndicator() {
        const indicator = document.getElementById('typingIndicator');
        indicator.classList.add('active');
        this.scrollToBottom();
    }

    hideTypingIndicator() {
        const indicator = document.getElementById('typingIndicator');
        indicator.classList.remove('active');
    }

    scrollToBottom() {
        const chatMessages = document.getElementById('chatMessages');
        setTimeout(() => {
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }, 100);
    }

    getCurrentTime() {
        const now = new Date();
        return now.toLocaleTimeString('en-US', { 
            hour: 'numeric', 
            minute: '2-digit',
            hour12: true 
        });
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    toggleSettings() {
        const settingsPanel = document.getElementById('settingsPanel');
        settingsPanel.classList.toggle('active');
    }

    changeTheme() {
        const themeSelect = document.getElementById('themeSelect');
        const body = document.body;
        
        if (themeSelect.value === 'dark') {
            body.classList.add('dark-theme');
        } else {
            body.classList.remove('dark-theme');
        }
        
        this.saveSettings();
    }

    changeFontSize() {
        const fontSizeSelect = document.getElementById('fontSizeSelect');
        const chatContainer = document.querySelector('.chat-container');
        
        chatContainer.classList.remove('font-small', 'font-large');
        
        if (fontSizeSelect.value === 'small') {
            chatContainer.classList.add('font-small');
        } else if (fontSizeSelect.value === 'large') {
            chatContainer.classList.add('font-large');
        }
        
        this.saveSettings();
    }

    toggleSound() {
        const soundToggle = document.getElementById('soundToggle');
        this.soundEnabled = soundToggle.checked;
        this.saveSettings();
    }

    playSound(type) {
        if (!this.soundEnabled) return;
        
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        if (type === 'send') {
            oscillator.frequency.value = 800;
            gainNode.gain.value = 0.1;
        } else {
            oscillator.frequency.value = 600;
            gainNode.gain.value = 0.1;
        }
        
        oscillator.start();
        oscillator.stop(audioContext.currentTime + 0.1);
    }

    // --- UPDATED CLEAR CHAT with your Jester Greeting ---
    clearChat() {
        const chatMessages = document.getElementById('chatMessages');
        chatMessages.innerHTML = `
            <div class="message bot-message">
                <div class="message-content">
                    <p>Hello! I'm your Jester today. Give me keyword, and I shall give you joke! (तुम मुझे शब्द दो, मैं तुम्हे चुटकुला दूंगा!)</p>
                </div>
                <div class="message-time">${this.getCurrentTime()}</div>
            </div>
        `;
        this.messageHistory = [];
        this.toggleSettings();
    }

    saveSettings() {
        const settings = {
            theme: document.getElementById('themeSelect').value,
            fontSize: document.getElementById('fontSizeSelect').value,
            soundEnabled: document.getElementById('soundToggle').checked
        };
        localStorage.setItem('chatbotSettings', JSON.stringify(settings));
    }

    loadSettings() {
        const savedSettings = localStorage.getItem('chatbotSettings');
        if (savedSettings) {
            const settings = JSON.parse(savedSettings);
            
            document.getElementById('themeSelect').value = settings.theme;
            document.getElementById('fontSizeSelect').value = settings.fontSize;
            document.getElementById('soundToggle').checked = settings.soundEnabled;
            
            this.soundEnabled = settings.soundEnabled;
            
            if (settings.theme === 'dark') {
                document.body.classList.add('dark-theme');
            }
            
            if (settings.fontSize === 'small') {
                document.querySelector('.chat-container').classList.add('font-small');
            } else if (settings.fontSize === 'large') {
                document.querySelector('.chat-container').classList.add('font-large');
            }
        }
    }

    addEmoji() {
        const emojis = ['😊', '😂', '❤️', '👍', '🎉', '🤔', '😎', '🙏'];
        const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];
        const messageInput = document.getElementById('messageInput');
        messageInput.value += randomEmoji;
        messageInput.focus();
        this.toggleSendButton();
    }

    attachFile() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*,.pdf,.doc,.docx';
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                this.addMessage(`📎 Attached: ${file.name}`, 'user');
                setTimeout(() => {
                    this.addMessage("I've received your file! However, I can't process files directly. Is there something specific about the file you'd like to discuss?", 'bot');
                }, 1000);
            }
        };
        input.click();
    }
}

// Initialize Chatbot
const chatbot = new Chatbot();

// Global Functions for HTML Event Handlers
function sendMessage() {
    chatbot.sendMessage();
}

function sendQuickReply(message) {
    chatbot.sendQuickReply(message);
}

function handleKeyPress(event) {
    chatbot.handleKeyPress(event);
}

function toggleSendButton() {
    chatbot.toggleSendButton();
}

function toggleSettings() {
    chatbot.toggleSettings();
}

function changeTheme() {
    chatbot.changeTheme();
}

function changeFontSize() {
    chatbot.changeFontSize();
}

function toggleSound() {
    chatbot.toggleSound();
}

function clearChat() {
    chatbot.clearChat();
}

function addEmoji() {
    chatbot.addEmoji();
}

function attachFile() {
    chatbot.attachFile();
}

// Close settings when clicking outside
document.addEventListener('click', (e) => {
    const settingsPanel = document.getElementById('settingsPanel');
    const settingsBtn = document.querySelector('.settings-btn');
    
    if (settingsPanel && settingsBtn && !settingsPanel.contains(e.target) && !settingsBtn.contains(e.target)) {
        settingsPanel.classList.remove('active');
    }
});

// Focus input on load
window.addEventListener('load', () => {
    const messageInput = document.getElementById('messageInput');
    if(messageInput) messageInput.focus();
});