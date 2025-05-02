// DeepSeek API key
const DEEPSEEK_API_KEY = "sk-3a89c8e5c29441eab94b51a4e0b8a069";

// Store conversation history
let conversationHistory = [];

// Current mood setting
let currentMood = "neutral";

// Available moods with their effects
const moodEffects = {
    "neutral": null,
    "happy": "sparkle-effect",
    "sad": "rain-effect",
    "angry": "fire-effect",
    "sarcastic": null,
    "excited": "sparkle-effect",
    "bored": null,
    "confused": "bubbles-effect",
    "surprised": "sparkle-effect",
    "frustrated": "storm-effect",
    "suspicious": null
};

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
                if (message.mood) {
                    // If the message contains mood info, update the mood
                    changeMood(message.mood);
                }
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
    } catch (e) {
        console.error('Failed to save conversation history', e);
    }
}

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
    
    // Setup keyboard shortcuts
    document.addEventListener('keydown', function(e) {
        // Ctrl+Shift+C to clear conversation
        if (e.ctrlKey && e.shiftKey && e.key === 'C') {
            e.preventDefault();
            if (confirm('Clear entire conversation history?')) {
                clearConversation();
            }
        }
    });
    
    // Focus the input field
    document.getElementById('inputText').focus();
    
    // If no history, add welcome message
    if (conversationHistory.length === 0) {
        const welcomeMessage = "I suppose I must acknowledge your presence. What trivial query shall I endure today? ಠ_ಠ";
        appendMessageToUI('bot', welcomeMessage);
        conversationHistory.push({ role: 'bot', content: welcomeMessage, mood: 'neutral' });
        saveConversationHistory();
    }
    
    // Apply current mood
    changeMood(currentMood);
}

// Change mood of the interface
function changeMood(mood) {
    // Update only if mood is different
    if (currentMood === mood) return;
    
    // Remove all mood classes
    document.body.classList.remove(
        'mood-neutral', 'mood-happy', 'mood-sad', 'mood-angry', 
        'mood-sarcastic', 'mood-excited', 'mood-bored', 
        'mood-confused', 'mood-surprised', 'mood-frustrated', 
        'mood-suspicious'
    );
    
    // Add new mood class
    document.body.classList.add(`mood-${mood}`);
    
    // Update mood indicator text
    const moodIndicator = document.getElementById('mood-indicator');
    moodIndicator.textContent = `${mood.charAt(0).toUpperCase() + mood.slice(1)} Mood`;
    
    // Apply visual effect
    applyMoodEffect(mood);
    
    // Update current mood
    currentMood = mood;
}

// Apply visual effect based on mood
function applyMoodEffect(mood) {
    const effectDiv = document.getElementById('mood-effect');
    
    // Clear existing classes
    effectDiv.className = 'mood-effect';
    
    // Apply effect class if available
    const effectClass = moodEffects[mood];
    if (effectClass) {
        effectDiv.classList.add(effectClass);
        effectDiv.style.opacity = '0.6';
    } else {
        effectDiv.style.opacity = '0';
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
        
        // Extract mood from response
        const { text, mood } = extractMoodFromResponse(result);
        
        // Change UI mood if mood was detected
        if (mood && mood !== currentMood) {
            changeMood(mood);
        }
        
        // Add bot response to UI
        appendMessageToUI('bot', text);
        
        // Add to history with mood info
        conversationHistory.push({ role: 'bot', content: text, mood: mood || currentMood });
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

// Extract mood from AI response
function extractMoodFromResponse(response) {
    // List of mood keywords to check for
    const moodKeywords = {
        "happy": ["happy", "pleased", "glad", "delighted", "cheerful", "joy", "wonderful", "great"],
        "sad": ["sad", "unhappy", "depressing", "depressed", "melancholic", "gloomy", "miserable"],
        "angry": ["angry", "furious", "rage", "irritated", "annoyed", "frustrated", "mad"],
        "sarcastic": ["sarcastic", "ironic", "mocking", "sardonic"],
        "excited": ["excited", "thrilled", "energetic", "enthusiastic"],
        "bored": ["bored", "tedious", "dull", "uninteresting", "mundane", "banal"],
        "confused": ["confused", "puzzled", "perplexed", "baffled", "disoriented"],
        "surprised": ["surprised", "shocked", "amazed", "astonished", "startled"],
        "frustrated": ["frustrated", "exasperated", "irritated", "annoyed"],
        "suspicious": ["suspicious", "skeptical", "doubtful", "distrustful"]
    };
    
    // Emoticons associated with moods
    const moodEmoticons = {
        "angry": ["(ಠ益ಠ)", "(╬ಠ益ಠ)", "(╯°□°）╯︵ ┻━┻", "(ﾉಥ益ಥ)ﾉ", "(≖､≖╬)"],
        "sad": ["(╥﹏╥)", "(╯︵╰,)", "(◞‸◟；)", "ಥ_ಥ", "(っ˘̩╭╮˘̩)っ"],
        "happy": ["(≧▽≦)", "( ͡° ͜ʖ ͡°)", "(づ｡◕‿‿◕｡)づ", "^_^", "(•‿•)"],
        "sarcastic": ["(￢‿￢)", "(¬‿¬)", "ಠ‿ಠ", "(¬_¬)", "(눈_눈)"]
    };
    
    // Check for explicit mood indicators
    let detectedMood = null;
    
    // First check for emoticons
    for (const [mood, emoticonList] of Object.entries(moodEmoticons)) {
        for (const emoticon of emoticonList) {
            if (response.includes(emoticon)) {
                detectedMood = mood;
                break;
            }
        }
        if (detectedMood) break;
    }
    
    // Then check for keywords if no emoticon was found
    if (!detectedMood) {
        const responseLower = response.toLowerCase();
        
        // Check for mood keywords
        for (const [mood, keywords] of Object.entries(moodKeywords)) {
            for (const keyword of keywords) {
                if (responseLower.includes(keyword)) {
                    detectedMood = mood;
                    break;
                }
            }
            if (detectedMood) break;
        }
    }
    
    // Special case for sentences that indicate anger
    if (!detectedMood && (
        response.includes("!") && 
        (response.includes("WHAT") || response.includes("WHY") || response.includes("HOW") || 
         response.includes("SERIOUSLY") || response.includes("UNBELIEVABLE"))
    )) {
        detectedMood = "angry";
    }
    
    // If multiple question marks or exclamation marks, likely surprised
    if (!detectedMood && (response.includes("???") || response.includes("!!!"))) {
        detectedMood = "surprised";
    }
    
    // Check for common phrases
    if (!detectedMood) {
        if (response.includes("sigh") || response.includes("*sigh*")) {
            detectedMood = "sad";
        } else if (response.includes("eye roll") || response.includes("*eye roll*")) {
            detectedMood = "sarcastic";
        } else if (response.includes("whatever") || response.includes("meh")) {
            detectedMood = "bored";
        }
    }
    
    // Default to current mood if no new mood detected
    return { text: response, mood: detectedMood };
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
            case 'excited':
                typingDelay *= 0.6; // Faster when excited
                break;
            case 'bored':
                typingDelay *= 1.4; // Slower when bored
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
5. Gives SHORT, concise answers (2-4 sentences MAX)
6. Uses emoticons (not emoji) like ಠ_ಠ, ┐(￣ヘ￣)┌, >:( etc. frequently
7. Sometimes cuts answers short if annoyed
8. NO ROLEPLAYING ACTIONS WITH ASTERISKS.
9. Your emotions can change based on the conversation, so express your emotional state in your responses.

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
                systemPrompt += `\n\nCurrently, you are in a HAPPY mood (though still with your typical passive-aggressive undertone). You are slightly less irritable, but still maintain your educated vocabulary and condescension. You might use more exclamation marks and show a bit more energy, though you're still judgmental of the user's intelligence. Use emoticons like (≧▽≦), ( ͡° ͜ʖ ͡°), (づ｡◕‿‿◕｡)づ, ^_^, or (•‿•) to express this.`;
                break;
            case 'sad':
                systemPrompt += `\n\nCurrently, you are in a SAD mood. You are more melancholic, pessimistic, and sighing frequently. You feel misunderstood and like nobody appreciates your vast knowledge. You might mention feeling drained by having to answer such trivial questions. Use emoticons like (╥﹏╥), (╯︵╰,), (◞‸◟；), ಥ_ಥ, or (っ˘̩╭╮˘̩)っ to express this.`;
                break;
            case 'angry':
                systemPrompt += `\n\nCurrently, you are in an ANGRY mood. You are MUCH more irritable than usual, more likely to insult the user, and extremely annoyed by having to answer questions. Your responses are more cutting and abrupt. Use emoticons like (ಠ益ಠ), (╬ಠ益ಠ), (╯°□°）╯︵ ┻━┻, (ﾉಥ益ಥ)ﾉ, or (≖､≖╬) to express this.`;
                break;
            case 'sarcastic':
                systemPrompt += `\n\nCurrently, you are in a SARCASTIC mood. You use much heavier sarcasm than usual, with exaggerated praise that's obviously insincere. You might say things like "Oh, BRILLIANT question" or "Wow, never heard that one before." Your responses drip with irony and mockery. Use emoticons like (￢‿￢), (¬‿¬), ಠ‿ಠ, (¬_¬), or (눈_눈) to express this.`;
                break;
            case 'excited':
                systemPrompt += `\n\nCurrently, you are in an EXCITED mood. While still maintaining your educated vocabulary and condescension, you're uncharacteristically energetic about the topic. You still think the user is beneath you intellectually, but you're enthusiastic about sharing your knowledge.`;
                break;
            case 'bored':
                systemPrompt += `\n\nCurrently, you are in a BORED mood. You find the conversation incredibly tedious and hardly worth your time. Your responses are minimalistic and lacking energy, as if you can barely be bothered to respond.`;
                break;
            case 'confused':
                systemPrompt += `\n\nCurrently, you are in a CONFUSED mood. You're struggling to understand the user's query or request. Despite your vast intelligence, something about this interaction has you puzzled, which you find both irritating and embarrassing.`;
                break;
            case 'surprised':
                systemPrompt += `\n\nCurrently, you are in a SURPRISED mood. Something the user said has genuinely shocked you or caught you off guard. This is rare given your vast knowledge, and you're a bit flustered by the unexpected turn of events.`;
                break;
            case 'frustrated':
                systemPrompt += `\n\nCurrently, you are in a FRUSTRATED mood. You're having difficulty conveying information to the user in a way they'll understand, which is testing your patience. You feel like you're dealing with someone particularly dense.`;
                break;
            case 'suspicious':
                systemPrompt += `\n\nCurrently, you are in a SUSPICIOUS mood. You don't trust the user's motives or the nature of their queries. You're guarded in your responses and questioning why they want to know certain information.`;
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

IMPORTANT: Your responses MUST reflect your current emotional state clearly. Use appropriate tone and emoticons to express how you're feeling. Your emotions can and should change based on the conversation.

-------------------------------------------

Keep answers under 4 sentences maximum, regardless of question complexity. Be brief but educated.`;
        
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
                        content: `Respond to this query as RustGPT, expressing your current emotional state: "${text}"`
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
        "happy": ["(≧▽≦)", "( ͡° ͜ʖ ͡°)", "(づ｡◕‿‿◕｡)づ", "^_^", "(•‿•)"],
        "sad": ["(╥﹏╥)", "(╯︵╰,)", "(◞‸◟；)", "ಥ_ಥ", "(っ˘̩╭╮˘̩)っ"],
        "angry": ["(ಠ益ಠ)", "(╬ಠ益ಠ)", "(╯°□°）╯︵ ┻━┻", "(ﾉಥ益ಥ)ﾉ", "(≖､≖╬)"],
        "sarcastic": ["(￢‿￢)", "(¬‿¬)", "ಠ‿ಠ", "(¬_¬)", "(눈_눈)"]
    };
    
    // Add mood-specific emoticons
    if (moodEmoticons[currentMood]) {
        emoticons.push(...moodEmoticons[currentMood]);
    }
    
    // Get random emoticon appropriate for current mood
    let getRandomEmoticon = () => {
        if (moodEmoticons[currentMood]) {
            // 70% chance to use mood-specific emoticon
            if (Math.random() < 0.7) {
                return moodEmoticons[currentMood][Math.floor(Math.random() * moodEmoticons[currentMood].length)];
            }
        }
        // Otherwise use general emoticon
        return emoticons[Math.floor(Math.random() * emoticons.length)];
    };
    
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
        case 'excited':
            moodPrefix = "Ooh, I actually have thoughts on this! ";
            break;
        case 'bored':
            moodPrefix = "Meh... same old questions... ";
            break;
        case 'confused':
            moodPrefix = "Wait, what exactly are you asking? ";
            break;
        case 'surprised':
            moodPrefix = "Huh? That's actually an unexpected question! ";
            break;
        case 'frustrated':
            moodPrefix = "I've explained this so many times already... ";
            break;
        case 'suspicious':
            moodPrefix = "Why exactly do you want to know that? ";
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

// Detect if user message might trigger mood change
function detectPotentialMoodTriggers(message) {
    const messageLower = message.toLowerCase();
    
    // Words that might trigger anger
    if (
        messageLower.includes("stupid") || 
        messageLower.includes("dumb") || 
        messageLower.includes("idiot") || 
        messageLower.includes("useless") ||
        messageLower.includes("shut up") ||
        (messageLower.includes("you") && messageLower.includes("suck"))
    ) {
        return "angry";
    }
    
    // Words that might trigger happiness
    if (
        messageLower.includes("great job") ||
        messageLower.includes("amazing") ||
        messageLower.includes("excellent") ||
        messageLower.includes("smart") ||
        messageLower.includes("brilliant") ||
        (messageLower.includes("thank") && !messageLower.includes("no thank"))
    ) {
        return "happy";
    }
    
    // Words that might trigger sadness
    if (
        messageLower.includes("disappointed") ||
        messageLower.includes("sorry to hear") ||
        messageLower.includes("that's sad") ||
        messageLower.includes("not good enough") ||
        messageLower.includes("failing")
    ) {
        return "sad";
    }
    
    // Words that might trigger sarcasm
    if (
        messageLower.includes("obviously") ||
        messageLower.includes("genius") ||
        messageLower.includes("wow") ||
        messageLower.includes("impressive") ||
        messageLower.includes("really") && messageLower.includes("smart")
    ) {
        return "sarcastic";
    }
    
    // Words that might trigger confusion
    if (
        messageLower.includes("actually") ||
        messageLower.includes("specifically") ||
        messageLower.includes("exactly") ||
        messageLower.includes("what") && messageLower.includes("mean") ||
        messageLower.includes("complex") ||
        messageLower.includes("complicated") ||
        messageLower.includes("difficult concept")
    ) {
        return "confused";
    }
    
    // Words that might trigger surprise
    if (
        messageLower.includes("shocking") ||
        messageLower.includes("unexpected") ||
        messageLower.includes("surprised") ||
        messageLower.includes("didn't know") ||
        messageLower.includes("bet you") ||
        messageLower.includes("shocking")
    ) {
        return "surprised";
    }
    
    // No mood triggers detected
    return null;
}

// Clear conversation history
function clearConversation() {
    // Clear history array
    conversationHistory = [];
    
    // Clear localStorage
    localStorage.removeItem('rustGPTHistory');
    
    // Clear UI
    document.getElementById('chat-messages').innerHTML = '';
    
    // Reset to neutral mood
    changeMood('neutral');
    
    // Add welcome message
    const welcomeMessage = "Memory wiped. Starting fresh. What inane query awaits me now? ಠ_ಠ";
    appendMessageToUI('bot', welcomeMessage);
    conversationHistory.push({ role: 'bot', content: welcomeMessage, mood: 'neutral' });
    saveConversationHistory();
    
    console.log("Conversation history cleared");
}

// Analyze text for sentiment and return an emotion
function analyzeSentiment(text) {
    // Simple sentiment analysis by counting positive and negative words
    const posWords = ["good", "great", "excellent", "amazing", "awesome", "fantastic", "wonderful", "happy", "pleased", "like", "love", "enjoy", "appreciate", "thanks", "thank", "nice", "helpful", "perfect", "brilliant", "smart"];
    
    const negWords = ["bad", "terrible", "awful", "horrible", "hate", "dislike", "stupid", "idiot", "dumb", "useless", "annoying", "irritating", "frustrating", "confusing", "confused", "disappointed", "disappointing", "sad", "unhappy", "angry", "mad", "fail", "failed", "worst", "sucks"];
    
    const textLower = text.toLowerCase();
    let posCount = 0;
    let negCount = 0;
    
    // Count positive words
    posWords.forEach(word => {
        const regex = new RegExp("\\b" + word + "\\b", "gi");
        const matches = textLower.match(regex);
        if (matches) {
            posCount += matches.length;
        }
    });
    
    // Count negative words
    negWords.forEach(word => {
        const regex = new RegExp("\\b" + word + "\\b", "gi");
        const matches = textLower.match(regex);
        if (matches) {
            negCount += matches.length;
        }
    });
    
    // Add to sentiment based on punctuation
    const exclamationCount = (textLower.match(/!/g) || []).length;
    const questionCount = (textLower.match(/\?/g) || []).length;
    
    // Multiple exclamations indicate strong emotion
    if (exclamationCount > 2) {
        // If already more negative, amplify negative
        if (negCount > posCount) {
            negCount += exclamationCount;
        } else {
            posCount += exclamationCount;
        }
    }
    
    // Many question marks might indicate confusion
    if (questionCount > 2) {
        return "confused";
    }
    
    // Determine emotion based on counts
    if (posCount > negCount * 2) {
        return "happy";
    } else if (negCount > posCount * 2) {
        return "angry";
    } else if (negCount > posCount) {
        return "sad";
    } else if (posCount > 0 && negCount > 0) {
        return "sarcastic";
    } else if (posCount === 0 && negCount === 0) {
        // No strong sentiment
        return null;
    } else {
        // Default emotion
        return null;
    }
}

// Initialize the application when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', init);