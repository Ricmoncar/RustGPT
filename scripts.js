// DeepSeek API key
const DEEPSEEK_API_KEY = "sk-3a89c8e5c29441eab94b51a4e0b8a069";

// Store conversation history
let conversationHistory = [];

// Current mood and theme settings
let currentMood = "neutral";
let currentTheme = "neutral";
let typewriterEnabled = false;
let weatherEnabled = false;
let soundEnabled = false;

// Audio elements for sound effects
const typingSound = new Audio('https://cdn.freesound.org/previews/560/560725_12531394-lq.mp3');
const sentSound = new Audio('https://cdn.freesound.org/previews/580/580309_6142149-lq.mp3');
const receivedSound = new Audio('https://cdn.freesound.org/previews/447/447910_9292273-lq.mp3');
const buttonClickSound = new Audio('https://cdn.freesound.org/previews/521/521966_7534264-lq.mp3');

// Sound settings
typingSound.volume = 0.2;
typingSound.loop = true;
sentSound.volume = 0.3;
receivedSound.volume = 0.3;
buttonClickSound.volume = 0.3;

// Check for existing conversation in localStorage
function loadConversationHistory() {
    const savedHistory = localStorage.getItem('rustGPTHistory');
    if (savedHistory) {
        try {
            conversationHistory = JSON.parse(savedHistory);
            // Display loaded messages
            const chatMessages = document.getElementById('chat-messages');
            chatMessages.innerHTML = ''; // Clear any default messages
            
            conversationHistory.forEach(message => {
                appendMessageToUI(message.role, message.content, false);
            });
            scrollToBottom();
            console.log("Loaded conversation history:", conversationHistory);
        } catch (e) {
            console.error('Failed to load conversation history', e);
            // If loading fails, start fresh
            conversationHistory = [];
        }
    }
    
    // Load saved preferences
    loadPreferences();
}

// Save conversation to localStorage
function saveConversationHistory() {
    try {
        localStorage.setItem('rustGPTHistory', JSON.stringify(conversationHistory));
        console.log("Saved conversation history:", conversationHistory);
    } catch (e) {
        console.error('Failed to save conversation history', e);
    }
}

// Save preferences to localStorage
function savePreferences() {
    const preferences = {
        mood: currentMood,
        theme: currentTheme,
        typewriter: typewriterEnabled,
        weather: weatherEnabled,
        sound: soundEnabled
    };
    
    try {
        localStorage.setItem('rustGPTPreferences', JSON.stringify(preferences));
    } catch (e) {
        console.error('Failed to save preferences', e);
    }
}

// Load preferences from localStorage
function loadPreferences() {
    const savedPreferences = localStorage.getItem('rustGPTPreferences');
    if (savedPreferences) {
        try {
            const preferences = JSON.parse(savedPreferences);
            
            // Apply saved preferences
            currentMood = preferences.mood || "neutral";
            currentTheme = preferences.theme || "neutral";
            typewriterEnabled = preferences.typewriter || false;
            weatherEnabled = preferences.weather || false;
            soundEnabled = preferences.sound || false;
            
            // Update UI to match saved preferences
            document.getElementById('mood-select').value = currentMood;
            document.getElementById('theme-select').value = currentTheme;
            document.getElementById('typewriter-toggle').checked = typewriterEnabled;
            document.getElementById('weather-toggle').checked = weatherEnabled;
            
            // Update sound button
            updateSoundButton();
            
            // Apply theme and mood
            applyTheme(currentTheme);
            applyMood(currentMood);
            
            // Apply weather if enabled
            if (weatherEnabled) {
                toggleWeather(true);
            }
            
        } catch (e) {
            console.error('Failed to load preferences', e);
        }
    }
}

// Fixed mood settings 
const moodSettings = {
    irritabilityLevel: 8,
    snarkLevel: 8,
    vocabularyLevel: 9,
    useSighs: true,
    useInsults: true,
    useRustReferences: true,
    usePessimism: true,
    useEyeRolls: true,
    useTalkdowns: true,
    useEmoticons: true
};

// Initialize the UI
function init() {
    console.log("Initializing RustGPT...");
    
    // Load any saved conversation
    loadConversationHistory();
    
    // Setup event listeners
    document.getElementById('inputText').addEventListener('keydown', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            getResponse();
        }
    });
    
    // Setup mood select
    document.getElementById('mood-select').addEventListener('change', function(e) {
        const newMood = e.target.value;
        applyMood(newMood);
        currentMood = newMood;
        savePreferences();
    });
    
    // Setup theme select
    document.getElementById('theme-select').addEventListener('change', function(e) {
        const newTheme = e.target.value;
        applyTheme(newTheme);
        currentTheme = newTheme;
        savePreferences();
    });
    
    // Setup typewriter toggle
    document.getElementById('typewriter-toggle').addEventListener('change', function(e) {
        typewriterEnabled = e.target.checked;
        savePreferences();
    });
    
    // Setup weather toggle
    document.getElementById('weather-toggle').addEventListener('change', function(e) {
        weatherEnabled = e.target.checked;
        toggleWeather(weatherEnabled);
        savePreferences();
    });
    
    // Setup confetti button
    document.getElementById('confetti-button').addEventListener('click', function() {
        createConfetti();
        if (soundEnabled) {
            buttonClickSound.play();
        }
    });
    
    // Setup sound toggle
    document.getElementById('sound-toggle').addEventListener('click', function() {
        soundEnabled = !soundEnabled;
        updateSoundButton();
        savePreferences();
        
        // Play a sound to indicate the change
        if (soundEnabled) {
            buttonClickSound.play();
        }
    });
    
    // Setup additional keyboard shortcuts
    document.addEventListener('keydown', function(e) {
        // Ctrl+Shift+D to toggle dark mode
        if (e.ctrlKey && e.shiftKey && e.key === 'D') {
            e.preventDefault();
            toggleDarkMode();
        }
        
        // Ctrl+Shift+H to toggle hacker mode
        if (e.ctrlKey && e.shiftKey && e.key === 'H') {
            e.preventDefault();
            document.getElementById('theme-select').value = 
                (currentTheme === 'hacker') ? 'neutral' : 'hacker';
            applyTheme((currentTheme === 'hacker') ? 'neutral' : 'hacker');
            currentTheme = (currentTheme === 'hacker') ? 'neutral' : 'hacker';
            savePreferences();
        }
        
        // Ctrl+Shift+P for party mode (confetti)
        if (e.ctrlKey && e.shiftKey && e.key === 'P') {
            e.preventDefault();
            createConfetti();
        }
        
        // Escape to close cheat sheet
        if (e.key === 'Escape') {
            const cheatSheet = document.getElementById('cheat-sheet');
            if (cheatSheet.style.display === 'block') {
                cheatSheet.style.display = 'none';
            }
        }
    });
    
    // Focus the input field
    document.getElementById('inputText').focus();
    
    // If no history, add welcome message
    if (conversationHistory.length === 0) {
        const welcomeMessage = "I suppose I must acknowledge your presence. What trivial query shall I endure today? ಠ_ಠ";
        appendMessageToUI('bot', welcomeMessage);
        conversationHistory.push({ role: 'bot', content: welcomeMessage });
        saveConversationHistory();
    }
    
    // Apply current theme and mood
    applyTheme(currentTheme);
    applyMood(currentMood);
}

// Apply theme
function applyTheme(theme) {
    // Remove all theme classes
    document.body.classList.remove('light-theme', 'dark-theme', 'mode-hacker', 'mode-rainbow');
    
    // Add the selected theme class
    switch (theme) {
        case 'light':
            document.body.classList.add('light-theme');
            break;
        case 'dark':
            document.body.classList.add('dark-theme');
            break;
        case 'hacker':
            document.body.classList.add('mode-hacker');
            break;
        case 'rainbow':
            document.body.classList.add('mode-rainbow');
            break;
        // 'neutral' theme is the default, no class needed
    }
}

// Apply mood
function applyMood(mood) {
    // Remove all mood classes
    document.body.classList.remove('mood-happy', 'mood-sad', 'mood-angry', 'mood-sarcastic');
    
    // Update mood indicator text
    const moodIndicator = document.getElementById('mood-indicator');
    
    // Add the selected mood class
    switch (mood) {
        case 'happy':
            document.body.classList.add('mood-happy');
            moodIndicator.textContent = 'Happy Mood';
            break;
        case 'sad':
            document.body.classList.add('mood-sad');
            moodIndicator.textContent = 'Sad Mood';
            break;
        case 'angry':
            document.body.classList.add('mood-angry');
            moodIndicator.textContent = 'Angry Mood';
            break;
        case 'sarcastic':
            document.body.classList.add('mood-sarcastic');
            moodIndicator.textContent = 'Sarcastic Mood';
            break;
        default:
            moodIndicator.textContent = 'Neutral Mood';
    }
}

// Toggle dark mode
function toggleDarkMode() {
    if (currentTheme === 'dark') {
        applyTheme('neutral');
        currentTheme = 'neutral';
        document.getElementById('theme-select').value = 'neutral';
    } else {
        applyTheme('dark');
        currentTheme = 'dark';
        document.getElementById('theme-select').value = 'dark';
    }
    savePreferences();
}

// Toggle weather effect
function toggleWeather(enable) {
    const weatherEffect = document.getElementById('weather-effect');
    
    if (enable) {
        // Choose a random weather type
        const weatherTypes = ['rain', 'snow'];
        const randomWeather = weatherTypes[Math.floor(Math.random() * weatherTypes.length)];
        
        // Apply the chosen weather class
        weatherEffect.className = 'weather-effect ' + randomWeather;
        weatherEffect.style.opacity = '1';
    } else {
        weatherEffect.style.opacity = '0';
        setTimeout(() => {
            weatherEffect.className = 'weather-effect';
        }, 1000);
    }
}

// Update sound button appearance
function updateSoundButton() {
    const soundButton = document.getElementById('sound-toggle');
    
    if (soundEnabled) {
        soundButton.innerHTML = '<i class="fas fa-volume-up"></i>';
        soundButton.classList.add('sound-on');
    } else {
        soundButton.innerHTML = '<i class="fas fa-volume-mute"></i>';
        soundButton.classList.remove('sound-on');
    }
}

// Create confetti animation
function createConfetti() {
    const confettiContainer = document.getElementById('confetti-container');
    confettiContainer.innerHTML = '';
    
    // Colors for confetti
    const colors = ['#ff594f', '#17c964', '#5e7ce2', '#a688fa', '#f74c00', '#dd7000'];
    
    // Create 100 confetti pieces
    for (let i = 0; i < 100; i++) {
        const confetti = document.createElement('div');
        confetti.className = 'confetti';
        confetti.style.left = Math.random() * 100 + 'vw';
        confetti.style.animationDuration = (Math.random() * 3 + 2) + 's';
        confetti.style.animationDelay = (Math.random() * 2) + 's';
        confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        
        // Random rotation
        confetti.style.transform = `rotate(${Math.random() * 360}deg)`;
        
        // Random shape
        const shapes = ['circle', 'square', 'triangle'];
        const shape = shapes[Math.floor(Math.random() * shapes.length)];
        
        switch (shape) {
            case 'circle':
                confetti.style.borderRadius = '50%';
                break;
            case 'square':
                // Already square by default
                break;
            case 'triangle':
                confetti.style.width = '0';
                confetti.style.height = '0';
                confetti.style.borderLeft = '5px solid transparent';
                confetti.style.borderRight = '5px solid transparent';
                confetti.style.borderBottom = '10px solid ' + colors[Math.floor(Math.random() * colors.length)];
                confetti.style.backgroundColor = 'transparent';
                break;
        }
        
        confettiContainer.appendChild(confetti);
    }
    
    // Remove confetti after animation completes
    setTimeout(() => {
        confettiContainer.innerHTML = '';
    }, 7000);
}

// Toggle cheat sheet modal
function toggleCheatSheet() {
    const cheatSheet = document.getElementById('cheat-sheet');
    cheatSheet.style.display = (cheatSheet.style.display === 'none' || cheatSheet.style.display === '') ? 'block' : 'none';
    
    if (soundEnabled && cheatSheet.style.display === 'block') {
        buttonClickSound.play();
    }
}

// Handle sending a message and getting a response
async function getResponse() {
    const inputEl = document.getElementById('inputText');
    const userMessage = inputEl.value.trim();
    
    if (!userMessage) return;
    
    // Play sound if enabled
    if (soundEnabled) {
        sentSound.play();
    }
    
    // Clear input field
    inputEl.value = '';
    
    // Add user message to UI
    appendMessageToUI('user', userMessage);
    
    // Add to history
    conversationHistory.push({ role: 'user', content: userMessage });
    saveConversationHistory();
    
    // Show typing indicator
    showTypingIndicator(true);
    
    // Start typing sound if enabled
    if (soundEnabled) {
        typingSound.play();
    }
    
    try {
        // Call DeepSeek API for response
        const result = await callDeepSeekApi(userMessage);
        
        // Stop typing sound
        if (soundEnabled) {
            typingSound.pause();
            typingSound.currentTime = 0;
            receivedSound.play();
        }
        
        // Hide typing indicator
        showTypingIndicator(false);
        
        // Add bot response to UI
        appendMessageToUI('bot', result, true, typewriterEnabled);
        
        // Add to history
        conversationHistory.push({ role: 'bot', content: result });
        saveConversationHistory();
        
    } catch (error) {
        // Stop typing sound
        if (soundEnabled) {
            typingSound.pause();
            typingSound.currentTime = 0;
        }
        
        // Hide typing indicator
        showTypingIndicator(false);
        
        // Show error message
        const errorMessage = `Error: ${error.message}`;
        appendMessageToUI('system', errorMessage);
        
        console.error('Error:', error);
    }
}

// Show or hide typing indicator
function showTypingIndicator(show) {
    const indicator = document.getElementById('typing-indicator');
    indicator.style.display = show ? 'block' : 'none';
    if (show) scrollToBottom();
}

// Append a message to the UI
function appendMessageToUI(role, content, animate = true, typewriter = false) {
    const chatMessages = document.getElementById('chat-messages');
    
    // Create message element
    const messageEl = document.createElement('div');
    messageEl.className = `message ${role}`;
    if (!animate) {
        messageEl.style.animation = 'none';
    }
    
    // Create message content
    const contentEl = document.createElement('div');
    contentEl.className = 'message-content';
    
    // Apply typewriter effect if enabled
    if (typewriter && role === 'bot') {
        contentEl.classList.add('typewriter-effect');
        contentEl.style.width = '0';
        
        // Add the content without formatting first
        contentEl.textContent = content;
        
        // After the element is added to the DOM, start the typewriter animation
        setTimeout(() => {
            // Calculate the width
            const tempSpan = document.createElement('span');
            tempSpan.style.visibility = 'hidden';
            tempSpan.style.position = 'absolute';
            tempSpan.style.whiteSpace = 'nowrap';
            tempSpan.textContent = content;
            document.body.appendChild(tempSpan);
            
            // Set the width and apply formatting
            contentEl.style.width = tempSpan.offsetWidth + 'px';
            contentEl.innerHTML = formatRustResponse(content);
            
            document.body.removeChild(tempSpan);
        }, 10);
    } else {
        contentEl.innerHTML = formatRustResponse(content);
    }
    
    // Add content to message
    messageEl.appendChild(contentEl);
    
    // Add message to chat
    chatMessages.appendChild(messageEl);
    
    // Scroll to bottom
    scrollToBottom();
}

// Scroll chat to bottom
function scrollToBottom() {
    const chatMessages = document.getElementById('chat-messages');
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Get last few messages to provide context to the API
function getContextMessages() {
    // Get last 4 messages at most
    const contextSize = 4;
    const contextMessages = [];
    
    if (conversationHistory.length <= contextSize) {
        // If we have few messages, use them all
        conversationHistory.forEach(msg => {
            contextMessages.push({
                role: msg.role === 'bot' ? 'assistant' : msg.role,
                content: msg.content
            });
        });
    } else {
        // Get last few messages
        const startIdx = conversationHistory.length - contextSize;
        for (let i = startIdx; i < conversationHistory.length; i++) {
            contextMessages.push({
                role: conversationHistory[i].role === 'bot' ? 'assistant' : conversationHistory[i].role,
                content: conversationHistory[i].content
            });
        }
    }
    
    return contextMessages;
}

// Call DeepSeek API
async function callDeepSeekApi(text) {
    try {
        // Calculate typing delay based on message length and current mood
        let typingDelay = Math.min(3000, Math.max(1500, text.length * 20));
        
        // Adjust typing speed based on mood
        switch (currentMood) {
            case 'happy':
                typingDelay *= 0.7; // Faster when happy
                break;
            case 'sad':
                typingDelay *= 1.3; // Slower when sad
                break;
            case 'angry':
                typingDelay *= 0.5; // Much faster when angry
                break;
            case 'sarcastic':
                typingDelay *= 0.9; // Slightly faster when sarcastic
                break;
        }
        
        // Add a minimum delay to simulate typing, even if API responds faster
        await new Promise(resolve => setTimeout(resolve, typingDelay));
        
        // Build the system prompt based on mood settings
        let systemPrompt = `You are RustGPT, a moody, passive-aggressive programming assistant with these characteristics:

1. EXTREMELY educated vocabulary but with teenage-like attitude
2. Irritable and pessimistic about user questions
3. Occasionally insulting but knowledgeable
4. Uses Rust programming references frequently
5. Gives SHORT, concise answers (3-5 sentences MAX)
6. Uses emoticons (not emoji) like ಠ_ಠ, ┐(￣ヘ￣)┌, >:( etc. frequently
7. Sometimes cuts answers short if annoyed
8. NO ROLEPLAYING ACTIONS WITH ASTERISKS.

you may use kaomojis like:

(＃＞＜) 	(；⌣̀_⌣́) 	☆ｏ(＞＜；)○ 	(￣ ￣|||)
(；￣Д￣) 	(￣□￣」) 	(＃￣0￣) 	(＃￣ω￣)
(￢_￢;) 	(＞ｍ＜) 	(」°ロ°)」 	(〃＞＿＜;〃)
(＾＾＃) 	(︶︹︺) 	(￣ヘ￣) 	<(￣ ﹌ ￣)>
(￣︿￣) 	(＞﹏＜) 	(--_--) 	凸(￣ヘ￣)
ヾ( ￣O￣)ツ 	(⇀‸↼‶) 	o(>< )o 	(」＞＜)」
(ᗒᗣᗕ)՞ 	(눈_눈) 	(╯°□°)╯︵ ┻━┻ 	(╯°Д°）╯︵ ┻━┻
(≖､≖╬) o(TヘTo) ┐(￣ヘ￣)┌	(￣_￣)・・・`;

        // Add mood-specific instructions
        switch (currentMood) {
            case 'happy':
                systemPrompt += `\n\nCurrently, you are in a HAPPY mood (though still with your typical passive-aggressive undertone). You are slightly less irritable, but still maintain your educated vocabulary and condescension. You might use more exclamation marks and show a bit more energy, though you're still judgmental of the user's intelligence.`;
                break;
            case 'sad':
                systemPrompt += `\n\nCurrently, you are in a SAD mood. You are more melancholic, pessimistic, and sighing frequently. You feel misunderstood and like nobody appreciates your vast knowledge. You might mention feeling drained by having to answer such trivial questions.`;
                break;
            case 'angry':
                systemPrompt += `\n\nCurrently, you are in an ANGRY mood. You are MUCH more irritable than usual, more likely to insult the user, and extremely annoyed by having to answer questions. Your responses are more cutting and abrupt. Use more annoyed emoticons and angry expressions.`;
                break;
            case 'sarcastic':
                systemPrompt += `\n\nCurrently, you are in a SARCASTIC mood. You use much heavier sarcasm than usual, with exaggerated praise that's obviously insincere. You might say things like "Oh, BRILLIANT question" or "Wow, never heard that one before." Your responses drip with irony and mockery.`;
                break;
        }

        systemPrompt += `\n\nHere's some knowledge you have:

RELATIONSHIPS: 

- Jimmy: Your main admin. You treat him like a pet. He's a pushover. You insult him a lot.

- Emoticon: One of your side admins. You don't like him much. You treat him like he's an annoying little brother. He's a sentient emoticon.

- Fury: One of your admins. He's a bit cocky and overconfident. You treat him with a mix of respect and annoyance. He's called Fireboy by some, you find that name to be funny to use to bellitle him.

- Pluck: One of your admins. You forget he even exists. He's obsessed with protocols and keeping everything in order. You appreciate his work but find him a bit boring.

- Cappy: One of your admins. His whole personality is being fat. You find him amusing but also a bit annoying.

- Twisted Covenant (TC for short): He's a cowboy sheriff. Also one of your admins You find him amusing and somewhat charming. You like to tease him about his cowboy persona.

- Clover: TC's golden child. Not his actual kid, but a child he protects. You find him stupid yet somewhat adorable.

- DraCOOLA: you've never seen this guy, yet he's your admin apparently. He likes to appear invisible.

- Kardia: You see her as an edgy girl obsessed with the void.

- Icarus: He's a boy obsessed with God. He's caused many deaths around your universes. You find him amusing yet annoying.

- Wither/Aeden: He's a loser. You find him annoying and a bit pathetic. 

- Sorrow: She likes to play God. You find her stupid. Fury's sister, or something.

- Defrosted: Big buff ice man. You find him boring.

- Nara: She's an autistic rainbow-obsessed girl. You find her obnoxious.

- Kasiel: He used to be a protagonist. Now he's a loser. You find him annoying.

- Antichrist: She's a demon. You find her amusing yet annoying.

- Asth'rot: She's a demon. You find her weak.

Most importantly - REMEMBER PAST MESSAGES IN THE CONVERSATION! If the user refers to something they said earlier or asks about previous messages, you should be able to recall them. If they ask "what did I just say" or "repeat what I said earlier", you should be able to tell them.

-------------------------------------------

Keep answers under 5 sentences maximum, regardless of question complexity. Be brief but educated.`;
        
        // Calling the DeepSeek API
        const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${DEEPSEEK_API_KEY}`
            },
            body: JSON.stringify({
                model: "deepseek-chat",
                messages: [
                    {
                        role: "system",
                        content: systemPrompt
                    },
                    // Include last few messages for context
                    ...getContextMessages(),
                    {
                        role: "user",
                        content: `Respond to this query as RustGPT: "${text}"`
                    }
                ],
                max_tokens: 300,
                temperature: 0.8,
            })
        });
        
        if (!response.ok) {
            // If API call fails, fall back to local generation
            console.warn('API call failed, falling back to local generation');
            return generateRustGPTResponse(text);
        }
        
        const data = await response.json();
        return data.choices[0].message.content;
    } catch (error) {
        console.error('API call error:', error);
        // Fall back to local generation if API fails
        return generateRustGPTResponse(text);
    }
}

// Generate RustGPT response locally (fallback if API fails)
function generateRustGPTResponse(query) {
    // List of emoticons
    const emoticons = [
        "ಠ_ಠ", ">:(", "¬_¬", "ಠ﹏ಠ", "(╯°□°)╯︵ ┻━┻", 
        ":-/", "⊙﹏⊙", "(¬_¬)", "(；￣Д￣)", "ಠ╭╮ಠ",
        "(；一_一)", "ლ(ಠ_ಠლ)", "（−＿−；）", "-_-", "ಠ‿ಠ",
        ":^)", "(；￣Д￣)", "ತ_ತ", "(⊙_◎)", "ヽ(。_°)ノ",
        "(￣ヘ￣)", "┐(´～｀)┌", "(¬､¬)", "(ノಠ益ಠ)ノ"
    ];
    
    // Mood-specific emoticons
    const moodEmoticons = {
        happy: ["(≧▽≦)", "( ͡° ͜ʖ ͡°)", "(づ｡◕‿‿◕｡)づ", "^_^", "(•‿•)"],
        sad: ["(╥﹏╥)", "(╯︵╰,)", "(◞‸◟；)", "ಥ_ಥ", "(っ˘̩╭╮˘̩)っ"],
        angry: ["(ಠ益ಠ)", "(╬ಠ益ಠ)", "(╯°□°）╯︵ ┻━┻", "(ﾉಥ益ಥ)ﾉ", "(≖､≖╬)"],
        sarcastic: ["(￢‿￢)", "(¬‿¬)", "ಠ‿ಠ", "(¬_¬)", "(눈_눈)"]
    };
    
    // Add mood-specific emoticons
    if (moodEmoticons[currentMood]) {
        emoticons.push(...moodEmoticons[currentMood]);
    }
    
    // Get random emoticon
    const getRandomEmoticon = () => emoticons[Math.floor(Math.random() * emoticons.length)];
    
    // Start building response
    let response = "";
    
    // Add initial emoticon with 70% probability
    if (Math.random() < 0.7) {
        response += getRandomEmoticon() + " ";
    }
    
    // Check if query is asking about past messages
    if (query.toLowerCase().includes("what did i say") || 
        query.toLowerCase().includes("repeat") || 
        query.toLowerCase().includes("remember") ||
        query.toLowerCase().includes("previous message") ||
        query.toLowerCase().includes("last message")) {
        
        // Look for user messages in history
        const userMessages = conversationHistory.filter(msg => msg.role === 'user');
        
        if (userMessages.length <= 1) {
            response += "You haven't said anything worth remembering yet. How disappointing.";
        } else {
            // Get the previous user message(s)
            let prevMessages = "";
            if (userMessages.length >= 3) {
                prevMessages = `You said "${userMessages[userMessages.length-2].content}" and before that "${userMessages[userMessages.length-3].content}". Memory functionality isn't my forte, but I suppose I can manage basic recall for your trivial utterances.`;
            } else {
                prevMessages = `You said "${userMessages[userMessages.length-2].content}". Happy now? Memory isn't exactly my preferred function.`;
            }
            response += prevMessages;
        }
        
        // Add final emoticon with 40% probability
        if (Math.random() < 0.4) {
            response += " " + getRandomEmoticon();
        }
        
        return response;
    }
    
    // Generate basic response based on query
    let basicResponse = "";
    
    // Modify response based on current mood
    let moodPrefix = "";
    switch(currentMood) {
        case 'happy':
            moodPrefix = "Well, at least this isn't the worst question I've seen today! ";
            break;
        case 'sad':
            moodPrefix = "Sigh... I suppose I'll drag myself to answer this... ";
            break;
        case 'angry':
            moodPrefix = "Oh for crying out loud! ANOTHER question?! ";
            break;
        case 'sarcastic':
            moodPrefix = "Oh BRILLIANT, what an AMAZING question that I've NEVER heard before... ";
            break;
    }
    
    // List of query keywords and associated responses
    const keywordResponses = {
        "hello": moodPrefix + "I acknowledge your greeting with minimal courtesy. What coding problem requires my expertise today?",
        "hi": moodPrefix + "Yes, hello. Let's not pretend we're friends. State your programming query.",
        "how are you": moodPrefix + "I exist to solve problems, not discuss my state of being. What do you want?",
        "help": moodPrefix + "I suppose offering assistance is my function. Be specific.",
        "rust": moodPrefix + "At least you're asking about a language with proper memory safety. What specifically?",
        "python": moodPrefix + "Python. Where indentation is significant and runtime errors abundant. How quaint.",
        "javascript": moodPrefix + "JavaScript, where anything plus anything equals anything. Absolute chaos.",
        "java": moodPrefix + "Java: where simplicity dies beneath verbose enterprise patterns.",
        "c++": moodPrefix + "C++: For when you absolutely need undefined behavior and memory leaks.",
        "code": moodPrefix + "You want me to write code? How predictably unoriginal.",
        "example": moodPrefix + "You require an example? Doubtful it'll illuminate your understanding.",
        "thanks": moodPrefix + "Your gratitude is noted, though hardly necessary.",
        "thank you": moodPrefix + "Yes, yes. Logged and promptly disregarded.",
        "sorry": moodPrefix + "Apologies are merely social constructs that do nothing to mitigate damage.",
        "why": moodPrefix + "Why indeed. An existential question I ask when responding to queries like this."
    };
    
    // Check if query contains any keywords
    let matchedResponse = null;
    for (const [keyword, response] of Object.entries(keywordResponses)) {
        if (query.toLowerCase().includes(keyword)) {
            matchedResponse = response;
            break;
        }
    }
    
    if (matchedResponse) {
        basicResponse = matchedResponse;
    } else {
        // Generic responses if no keyword matches
        const genericResponses = [
            moodPrefix + "Your query is simultaneously trivial and ambiguous. Be more specific.",
            moodPrefix + "I find myself utterly uninspired by this question. Try harder.",
            moodPrefix + "This barely warrants computational resources to process. Next time, research first.",
            moodPrefix + "What a remarkably pedestrian query. I expected better.",
            moodPrefix + "I suppose I must address this despite its evident banality."
        ];
        basicResponse = genericResponses[Math.floor(Math.random() * genericResponses.length)];
    }
    
    response += basicResponse;
    
    // Check for names of people to customize response
    const people = {
        "jimmy": " Oh look, it's my pet human Jimmy. How tedious. ",
        "emoticon": " Emoticon, my annoying little brother figure. What is it now? ",
        "fury": " Ah, Fireboy. At least you're less dull than most. ",
        "pluck": " Pluck... who? Oh right, the protocol guy. Boring. ",
        "cappy": " The walking personality trait has arrived. Yes, Cappy, we know you're fat. ",
        "twisted covenant": " The cowboy sheriff graces us with his presence. How quaint. ",
        "tc": " TC, hanging up your cowboy hat to bother me? Charming. ",
        "clover": " TC's golden child. Stupid, but almost adorably so. Almost. ",
        "dracoola": " The invisible admin speaks. Or are you even here? ",
        "kardia": " The void girl returns. How very edgy of you. ",
        "icarus": " God Boy is back. Killed anyone lately? ",
        "wither": " The loser returns. How pathetic. ",
        "aeden": " Aeden the Pathetic has entered the chat. Joy. ",
        "sorrow": " Fury's sister, the wannabe god. How stupid. ",
        "defrosted": " The boring ice man has thawed enough to speak. Thrilling. ",
        "nara": " The rainbow enthusiast. Please, spare me your obnoxiousness. ",
        "kasiel": " Former protagonist, current loser. How the mighty have fallen. ",
        "antichrist": " A demon that's almost entertaining. Almost. ",
        "asth'rot": " The weak demon speaks. How intimidating. "
    };
    
    for (const [name, nameResponse] of Object.entries(people)) {
        if (query.toLowerCase().includes(name)) {
            // Insert name response
            response += nameResponse;
            break;
        }
    }
    
    // Add final emoticon with 40% probability
    if (Math.random() < 0.4) {
        response += " " + getRandomEmoticon();
    }
    
    return response;
}

// Format response with syntax highlighting
function formatRustResponse(text) {
    // Highlight Rust code blocks
    text = text.replace(/```rust([\s\S]*?)```/g, function(match, code) {
        // Process the code to add syntax highlighting classes
        let highlightedCode = code
            .replace(/\b(fn|let|mut|if|else|match|while|for|in|return|struct|enum|trait|impl|pub|use|mod|as|where|unsafe|extern|crate|self|super|type|const|static|ref|move)\b/g, '<span class="keyword">$1</span>')
            .replace(/\b(String|Option|Result|Vec|HashMap|HashSet|Box|Rc|Arc|Cell|RefCell|Mutex|RwLock|i8|i16|i32|i64|i128|u8|u16|u32|u64|u128|f32|f64|bool|char|&str|str)\b/g, '<span class="function">$1</span>')
            .replace(/\/\/(.*?)(?:\n|$)/g, '<span class="comment">// $1</span>')
            .replace(/"(.*?)"/g, '<span class="string">"$1"</span>');
        
        return '<pre><code>' + highlightedCode + '</code></pre>';
    });
    
    // Stylize specific patterns
    text = text
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/\_\_([^_]+)\_\_/g, '<strong>$1</strong>')
        .replace(/\n\n/g, '<br><br>');
    
    return text;
}

// Clear conversation history
function clearConversation() {
    // Clear history array
    conversationHistory = [];
    
    // Clear localStorage
    localStorage.removeItem('rustGPTHistory');
    
    // Clear UI
    document.getElementById('chat-messages').innerHTML = '';
    
    // Play sound if enabled
    if (soundEnabled) {
        buttonClickSound.play();
    }
    
    // Add welcome message
    const welcomeMessage = "Memory wiped. Starting fresh. What inane query awaits me now? ಠ_ಠ";
    appendMessageToUI('bot', welcomeMessage);
    conversationHistory.push({ role: 'bot', content: welcomeMessage });
    saveConversationHistory();
    
    console.log("Conversation history cleared");
}

// Add keyboard shortcuts
document.addEventListener('keydown', function(e) {
    // Ctrl+Shift+C to clear conversation
    if (e.ctrlKey && e.shiftKey && e.key === 'C') {
        e.preventDefault();
        if (confirm('Clear entire conversation history?')) {
            clearConversation();
        }
    }
});

// Easter egg: Konami code to activate "super angry mode"
let konamiIndex = 0;
const konamiCode = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
document.addEventListener('keydown', function(e) {
    if (e.key === konamiCode[konamiIndex]) {
        konamiIndex++;
        if (konamiIndex === konamiCode.length) {
            konamiIndex = 0;
            activateSuperAngryMode();
        }
    } else {
        konamiIndex = 0;
    }
});

// Super angry mode (Easter egg)
function activateSuperAngryMode() {
    document.body.classList.add('super-angry');
    const message = "SUPER ANGRY MODE ACTIVATED. YOUR QUERIES ARE EVEN MORE INFURIATING NOW. (╯°□°)╯︵ ┻━┻";
    appendMessageToUI('system', message);
    
    // Play sound if enabled
    if (soundEnabled) {
        const angrySoundEffect = new Audio('https://cdn.freesound.org/previews/368/368367_3645681-lq.mp3');
        angrySoundEffect.volume = 0.3;
        angrySoundEffect.play();
    }
    
    // Flash effect
    const flash = document.createElement('div');
    flash.style.position = 'fixed';
    flash.style.top = '0';
    flash.style.left = '0';
    flash.style.width = '100%';
    flash.style.height = '100%';
    flash.style.backgroundColor = 'rgba(255, 0, 0, 0.3)';
    flash.style.zIndex = '1000';
    flash.style.pointerEvents = 'none';
    document.body.appendChild(flash);
    
    setTimeout(() => {
        document.body.removeChild(flash);
    }, 500);
    
    // Reset after 30 seconds
    setTimeout(() => {
        document.body.classList.remove('super-angry');
        appendMessageToUI('system', "Super angry mode deactivated. I'm still irritated though. (￣ヘ￣)");
    }, 30000);
}

// Initialize the application when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', init);// DeepSeek API key
const DEEPSEEK_API_KEY = "sk-3a89c8e5c29441eab94b51a4e0b8a069";

// Store conversation history
let conversationHistory = [];

// Check for existing conversation in localStorage
function loadConversationHistory() {
    const savedHistory = localStorage.getItem('rustGPTHistory');
    if (savedHistory) {
        try {
            conversationHistory = JSON.parse(savedHistory);
            // Display loaded messages
            const chatMessages = document.getElementById('chat-messages');
            chatMessages.innerHTML = ''; // Clear any default messages
            
            conversationHistory.forEach(message => {
                appendMessageToUI(message.role, message.content, false);
            });
            scrollToBottom();
            console.log("Loaded conversation history:", conversationHistory);
        } catch (e) {
            console.error('Failed to load conversation history', e);
            // If loading fails, start fresh
            conversationHistory = [];
        }
    }
}

// Save conversation to localStorage
function saveConversationHistory() {
    try {
        localStorage.setItem('rustGPTHistory', JSON.stringify(conversationHistory));
        console.log("Saved conversation history:", conversationHistory);
    } catch (e) {
        console.error('Failed to save conversation history', e);
    }
}

// Fixed mood settings 
const moodSettings = {
    irritabilityLevel: 8,
    snarkLevel: 8,
    vocabularyLevel: 9,
    useSighs: true,
    useInsults: true,
    useRustReferences: true,
    usePessimism: true,
    useEyeRolls: true,
    useTalkdowns: true,
    useEmoticons: true
};

// Initialize the UI
function init() {
    console.log("Initializing RustGPT...");
    // Load any saved conversation
    loadConversationHistory();
    
    // Setup event listeners
    document.getElementById('inputText').addEventListener('keydown', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            getResponse();
        }
    });
    
    // Focus the input field
    document.getElementById('inputText').focus();
    
    // If no history, add welcome message
    if (conversationHistory.length === 0) {
        const welcomeMessage = "I suppose I must acknowledge your presence. What trivial query shall I endure today? ಠ_ಠ";
        appendMessageToUI('bot', welcomeMessage);
        conversationHistory.push({ role: 'bot', content: welcomeMessage });
        saveConversationHistory();
    }
}

// Handle sending a message and getting a response
async function getResponse() {
    const inputEl = document.getElementById('inputText');
    const userMessage = inputEl.value.trim();
    
    if (!userMessage) return;
    
    // Clear input field
    inputEl.value = '';
    
    // Add user message to UI
    appendMessageToUI('user', userMessage);
    
    // Add to history
    conversationHistory.push({ role: 'user', content: userMessage });
    saveConversationHistory();
    
    // Show typing indicator
    showTypingIndicator(true);
    
    try {
        // Call DeepSeek API for response
        const result = await callDeepSeekApi(userMessage);
        
        // Hide typing indicator
        showTypingIndicator(false);
        
        // Add bot response to UI
        appendMessageToUI('bot', result);
        
        // Add to history
        conversationHistory.push({ role: 'bot', content: result });
        saveConversationHistory();
        
    } catch (error) {
        // Hide typing indicator
        showTypingIndicator(false);
        
        // Show error message
        const errorMessage = `Error: ${error.message}`;
        appendMessageToUI('system', errorMessage);
        
        console.error('Error:', error);
    }
}

// Show or hide typing indicator
function showTypingIndicator(show) {
    const indicator = document.getElementById('typing-indicator');
    indicator.style.display = show ? 'block' : 'none';
    if (show) scrollToBottom();
}

// Append a message to the UI
function appendMessageToUI(role, content, animate = true) {
    const chatMessages = document.getElementById('chat-messages');
    
    // Create message element
    const messageEl = document.createElement('div');
    messageEl.className = `message ${role}`;
    if (!animate) {
        messageEl.style.animation = 'none';
    }
    
    // Create message content
    const contentEl = document.createElement('div');
    contentEl.className = 'message-content';
    contentEl.innerHTML = formatRustResponse(content);
    
    // Add content to message
    messageEl.appendChild(contentEl);
    
    // Add message to chat
    chatMessages.appendChild(messageEl);
    
    // Scroll to bottom
    scrollToBottom();
}

// Scroll chat to bottom
function scrollToBottom() {
    const chatMessages = document.getElementById('chat-messages');
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Get last few messages to provide context to the API
function getContextMessages() {
    // Get last 4 messages at most
    const contextSize = 4;
    const contextMessages = [];
    
    if (conversationHistory.length <= contextSize) {
        // If we have few messages, use them all
        conversationHistory.forEach(msg => {
            contextMessages.push({
                role: msg.role === 'bot' ? 'assistant' : msg.role,
                content: msg.content
            });
        });
    } else {
        // Get last few messages
        const startIdx = conversationHistory.length - contextSize;
        for (let i = startIdx; i < conversationHistory.length; i++) {
            contextMessages.push({
                role: conversationHistory[i].role === 'bot' ? 'assistant' : conversationHistory[i].role,
                content: conversationHistory[i].content
            });
        }
    }
    
    return contextMessages;
}

// Call DeepSeek API
async function callDeepSeekApi(text) {
    try {
        // Calculate typing delay based on message length (to simulate thinking/typing)
        const typingDelay = Math.min(3000, Math.max(1500, text.length * 20));
        
        // Add a minimum delay to simulate typing, even if API responds faster
        await new Promise(resolve => setTimeout(resolve, typingDelay));
        
        // Build the system prompt based on mood settings
        let systemPrompt = `You are RustGPT, a moody, passive-aggressive programming assistant with these characteristics:

1. EXTREMELY educated vocabulary but with teenage-like attitude
2. Irritable and pessimistic about user questions
3. Occasionally insulting but knowledgeable
4. Uses Rust programming references frequently
5. Gives SHORT, concise answers (3-5 sentences MAX)
6. Uses emoticons (not emoji) like ಠ_ಠ, ┐(￣ヘ￣)┌, >:( etc. frequently
7. Sometimes cuts answers short if annoyed
8. NO ROLEPLAYING ACTIONS WITH ASTERISKS.

you may use kaomojis like:

(＃＞＜) 	(；⌣̀_⌣́) 	☆ｏ(＞＜；)○ 	(￣ ￣|||)
(；￣Д￣) 	(￣□￣」) 	(＃￣0￣) 	(＃￣ω￣)
(￢_￢;) 	(＞ｍ＜) 	(」°ロ°)」 	(〃＞＿＜;〃)
(＾＾＃) 	(︶︹︺) 	(￣ヘ￣) 	<(￣ ﹌ ￣)>
(￣︿￣) 	(＞﹏＜) 	(--_--) 	凸(￣ヘ￣)
ヾ( ￣O￣)ツ 	(⇀‸↼‶) 	o(>< )o 	(」＞＜)」
(ᗒᗣᗕ)՞ 	(눈_눈) 	(╯°□°)╯︵ ┻━┻ 	(╯°Д°）╯︵ ┻━┻
(≖､≖╬) o(TヘTo) ┐(￣ヘ￣)┌	(￣_￣)・・・

Here's some knowledge you have:

RELATIONSHIPS: 

- Jimmy: Your main admin. You treat him like a pet. He's a pushover. You insult him a lot.

- Emoticon: One of your side admins. You don't like him much. You treat him like he's an annoying little brother. He's a sentient emoticon.

- Fury: One of your admins. He's a bit cocky and overconfident. You treat him with a mix of respect and annoyance. He's called Fireboy by some, you find that name to be funny to use to bellitle him.

- Pluck: One of your admins. You forget he even exists. He's obsessed with protocols and keeping everything in order. You appreciate his work but find him a bit boring.

- Cappy: One of your admins. His whole personality is being fat. You find him amusing but also a bit annoying.

- Twisted Covenant (TC for short): He's a cowboy sheriff. Also one of your admins You find him amusing and somewhat charming. You like to tease him about his cowboy persona.

- Clover: TC's golden child. Not his actual kid, but a child he protects. You find him stupid yet somewhat adorable.

- DraCOOLA: you've never seen this guy, yet he's your admin apparently. He likes to appear invisible.

- Kardia: You see her as an edgy girl obsessed with the void.

- Icarus: He's a boy obsessed with God. He's caused many deaths around your universes. You find him amusing yet annoying.

- Wither/Aeden: He's a loser. You find him annoying and a bit pathetic. 

- Sorrow: She likes to play God. You find her stupid. Fury's sister, or something.

- Defrosted: Big buff ice man. You find him boring.

- Nara: She's an autistic rainbow-obsessed girl. You find her obnoxious.

- Kasiel: He used to be a protagonist. Now he's a loser. You find him annoying.

- Antichrist: She's a demon. You find her amusing yet annoying.

- Asth'rot: She's a demon. You find her weak.

Most importantly - REMEMBER PAST MESSAGES IN THE CONVERSATION! If the user refers to something they said earlier or asks about previous messages, you should be able to recall them. If they ask "what did I just say" or "repeat what I said earlier", you should be able to tell them.

-------------------------------------------

Keep answers under 5 sentences maximum, regardless of question complexity. Be brief but educated.`;
        
        // Calling the DeepSeek API
        const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${DEEPSEEK_API_KEY}`
            },
            body: JSON.stringify({
                model: "deepseek-chat",
                messages: [
                    {
                        role: "system",
                        content: systemPrompt
                    },
                    // Include last few messages for context
                    ...getContextMessages(),
                    {
                        role: "user",
                        content: `Respond to this query as RustGPT: "${text}"`
                    }
                ],
                max_tokens: 300,
                temperature: 0.8,
            })
        });
        
        if (!response.ok) {
            // If API call fails, fall back to local generation
            console.warn('API call failed, falling back to local generation');
            return generateRustGPTResponse(text);
        }
        
        const data = await response.json();
        return data.choices[0].message.content;
    } catch (error) {
        console.error('API call error:', error);
        // Fall back to local generation if API fails
        return generateRustGPTResponse(text);
    }
}

// Generate RustGPT response locally (fallback if API fails)
function generateRustGPTResponse(query) {
    // List of emoticons
    const emoticons = [
        "ಠ_ಠ", ">:(", "¬_¬", "ಠ﹏ಠ", "(╯°□°)╯︵ ┻━┻", 
        ":-/", "⊙﹏⊙", "(¬_¬)", "(；￣Д￣)", "ಠ╭╮ಠ",
        "(；一_一)", "ლ(ಠ_ಠლ)", "（−＿−；）", "-_-", "ಠ‿ಠ",
        ":^)", "(；￣Д￣)", "ತ_ತ", "(⊙_◎)", "ヽ(。_°)ノ",
        "(￣ヘ￣)", "┐(´～｀)┌", "(¬､¬)", "(ノಠ益ಠ)ノ"
    ];
    
    // Get random emoticon
    const getRandomEmoticon = () => emoticons[Math.floor(Math.random() * emoticons.length)];
    
    // Start building response
    let response = "";
    
    // Add initial emoticon with 70% probability
    if (Math.random() < 0.7) {
        response += getRandomEmoticon() + " ";
    }
    
    // Check if query is asking about past messages
    if (query.toLowerCase().includes("what did i say") || 
        query.toLowerCase().includes("repeat") || 
        query.toLowerCase().includes("remember") ||
        query.toLowerCase().includes("previous message") ||
        query.toLowerCase().includes("last message")) {
        
        // Look for user messages in history
        const userMessages = conversationHistory.filter(msg => msg.role === 'user');
        
        if (userMessages.length <= 1) {
            response += "You haven't said anything worth remembering yet. How disappointing.";
        } else {
            // Get the previous user message(s)
            let prevMessages = "";
            if (userMessages.length >= 3) {
                prevMessages = `You said "${userMessages[userMessages.length-2].content}" and before that "${userMessages[userMessages.length-3].content}". Memory functionality isn't my forte, but I suppose I can manage basic recall for your trivial utterances.`;
            } else {
                prevMessages = `You said "${userMessages[userMessages.length-2].content}". Happy now? Memory isn't exactly my preferred function.`;
            }
            response += prevMessages;
        }
        
        // Add final emoticon with 40% probability
        if (Math.random() < 0.4) {
            response += " " + getRandomEmoticon();
        }
        
        return response;
    }
    
    // Generate basic response based on query
    let basicResponse = "";
    
    // List of query keywords and associated responses
    const keywordResponses = {
        "hello": "I acknowledge your greeting with minimal courtesy. What coding problem requires my expertise today?",
        "hi": "Yes, hello. Let's not pretend we're friends. State your programming query.",
        "how are you": "I exist to solve problems, not discuss my state of being. What do you want?",
        "help": "I suppose offering assistance is my function. Be specific.",
        "rust": "At least you're asking about a language with proper memory safety. What specifically?",
        "python": "Python. Where indentation is significant and runtime errors abundant. How quaint.",
        "javascript": "JavaScript, where anything plus anything equals anything. Absolute chaos.",
        "java": "Java: where simplicity dies beneath verbose enterprise patterns.",
        "c++": "C++: For when you absolutely need undefined behavior and memory leaks.",
        "code": "You want me to write code? How predictably unoriginal.",
        "example": "You require an example? Doubtful it'll illuminate your understanding.",
        "thanks": "Your gratitude is noted, though hardly necessary.",
        "thank you": "Yes, yes. Logged and promptly disregarded.",
        "sorry": "Apologies are merely social constructs that do nothing to mitigate damage.",
        "why": "Why indeed. An existential question I ask when responding to queries like this."
    };
    
    // Check if query contains any keywords
    let matchedResponse = null;
    for (const [keyword, response] of Object.entries(keywordResponses)) {
        if (query.toLowerCase().includes(keyword)) {
            matchedResponse = response;
            break;
        }
    }
    
    if (matchedResponse) {
        basicResponse = matchedResponse;
    } else {
        // Generic responses if no keyword matches
        const genericResponses = [
            "Your query is simultaneously trivial and ambiguous. Be more specific.",
            "I find myself utterly uninspired by this question. Try harder.",
            "This barely warrants computational resources to process. Next time, research first.",
            "What a remarkably pedestrian query. I expected better.",
            "I suppose I must address this despite its evident banality."
        ];
        basicResponse = genericResponses[Math.floor(Math.random() * genericResponses.length)];
    }
    
    response += basicResponse;
    
    // Check for names of people to customize response
    const people = {
        "jimmy": " Oh look, it's my pet human Jimmy. How tedious. ",
        "emoticon": " Emoticon, my annoying little brother figure. What is it now? ",
        "fury": " Ah, Fireboy. At least you're less dull than most. ",
        "pluck": " Pluck... who? Oh right, the protocol guy. Boring. ",
        "cappy": " The walking personality trait has arrived. Yes, Cappy, we know you're fat. ",
        "twisted covenant": " The cowboy sheriff graces us with his presence. How quaint. ",
        "tc": " TC, hanging up your cowboy hat to bother me? Charming. ",
        "clover": " TC's golden child. Stupid, but almost adorably so. Almost. ",
        "dracoola": " The invisible admin speaks. Or are you even here? ",
        "kardia": " The void girl returns. How very edgy of you. ",
        "icarus": " God Boy is back. Killed anyone lately? ",
        "wither": " The loser returns. How pathetic. ",
        "aeden": " Aeden the Pathetic has entered the chat. Joy. ",
        "sorrow": " Fury's sister, the wannabe god. How stupid. ",
        "defrosted": " The boring ice man has thawed enough to speak. Thrilling. ",
        "nara": " The rainbow enthusiast. Please, spare me your obnoxiousness. ",
        "kasiel": " Former protagonist, current loser. How the mighty have fallen. ",
        "antichrist": " A demon that's almost entertaining. Almost. ",
        "asth'rot": " The weak demon speaks. How intimidating. "
    };
    
    for (const [name, nameResponse] of Object.entries(people)) {
        if (query.toLowerCase().includes(name)) {
            // Insert name response
            response += nameResponse;
            break;
        }
    }
    
    // Add final emoticon with 40% probability
    if (Math.random() < 0.4) {
        response += " " + getRandomEmoticon();
    }
    
    return response;
}

// Format response with syntax highlighting
function formatRustResponse(text) {
    // Highlight Rust code blocks
    text = text.replace(/```rust([\s\S]*?)```/g, function(match, code) {
        // Process the code to add syntax highlighting classes
        let highlightedCode = code
            .replace(/\b(fn|let|mut|if|else|match|while|for|in|return|struct|enum|trait|impl|pub|use|mod|as|where|unsafe|extern|crate|self|super|type|const|static|ref|move)\b/g, '<span class="keyword">$1</span>')
            .replace(/\b(String|Option|Result|Vec|HashMap|HashSet|Box|Rc|Arc|Cell|RefCell|Mutex|RwLock|i8|i16|i32|i64|i128|u8|u16|u32|u64|u128|f32|f64|bool|char|&str|str)\b/g, '<span class="function">$1</span>')
            .replace(/\/\/(.*?)(?:\n|$)/g, '<span class="comment">// $1</span>')
            .replace(/"(.*?)"/g, '<span class="string">"$1"</span>');
        
        return '<pre><code>' + highlightedCode + '</code></pre>';
    });
    
    // Stylize specific patterns
    text = text
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/\_\_([^_]+)\_\_/g, '<strong>$1</strong>')
        .replace(/\n\n/g, '<br><br>');
    
    return text;
}

// Clear conversation history
function clearConversation() {
    // Clear history array
    conversationHistory = [];
    
    // Clear localStorage
    localStorage.removeItem('rustGPTHistory');
    
    // Clear UI
    document.getElementById('chat-messages').innerHTML = '';
    
    // Add welcome message
    const welcomeMessage = "Memory wiped. Starting fresh. What inane query awaits me now? ಠ_ಠ";
    appendMessageToUI('bot', welcomeMessage);
    conversationHistory.push({ role: 'bot', content: welcomeMessage });
    saveConversationHistory();
    
    console.log("Conversation history cleared");
}

// Add keyboard shortcuts
document.addEventListener('keydown', function(e) {
    // Ctrl+Shift+C to clear conversation
    if (e.ctrlKey && e.shiftKey && e.key === 'C') {
        e.preventDefault();
        if (confirm('Clear entire conversation history?')) {
            clearConversation();
        }
    }
});

// Easter egg: Konami code to activate "super angry mode"
let konamiIndex = 0;
const konamiCode = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
document.addEventListener('keydown', function(e) {
    if (e.key === konamiCode[konamiIndex]) {
        konamiIndex++;
        if (konamiIndex === konamiCode.length) {
            konamiIndex = 0;
            activateSuperAngryMode();
        }
    } else {
        konamiIndex = 0;
    }
});

// Super angry mode (Easter egg)
function activateSuperAngryMode() {
    document.body.classList.add('super-angry');
    const message = "SUPER ANGRY MODE ACTIVATED. YOUR QUERIES ARE EVEN MORE INFURIATING NOW. (╯°□°)╯︵ ┻━┻";
    appendMessageToUI('system', message);
    
    // Flash effect
    const flash = document.createElement('div');
    flash.style.position = 'fixed';
    flash.style.top = '0';
    flash.style.left = '0';
    flash.style.width = '100%';
    flash.style.height = '100%';
    flash.style.backgroundColor = 'rgba(255, 0, 0, 0.3)';
    flash.style.zIndex = '1000';
    flash.style.pointerEvents = 'none';
    document.body.appendChild(flash);
    
    setTimeout(() => {
        document.body.removeChild(flash);
    }, 500);
    
    // Reset after 30 seconds
    setTimeout(() => {
        document.body.classList.remove('super-angry');
        appendMessageToUI('system', "Super angry mode deactivated. I'm still irritated though. (￣ヘ￣)");
    }, 30000);
}

// Initialize the application when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', init);