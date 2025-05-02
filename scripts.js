// DeepSeek API key
const DEEPSEEK_API_KEY = "sk-3a89c8e5c29441eab94b51a4e0b8a069";

// Store history
let history = [];

// Fixed mood settings without control panel
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
    useEmoticons: true,
    customPhrases: [
        "*sigh* Another tedious query... -_-",
        "Oh my GOD, seriously? Fine. >:(",
        "Must simplify for your limited mind. ¬_¬",
        "Reevaluating life choices... ಠ_ಠ",
        "Elementary concepts again? (╯°□°)╯︵ ┻━┻",
        "Such intellectual deficiency. :-/",
        "*eye roll* If you insist. ⊙﹏⊙",
        "Testing my patience. (¬_¬)",
        "Even obtuse people should know this. (；￣Д￣)",
        "How predictable. ಠ╭╮ಠ",
        "Distilling for your limited faculties. (；一_一)",
        "Society's cognitive decline in one question. ლ(ಠ_ಠლ)",
        "Your inability is astonishing. （−＿−；）",
        "This is tedious. -_-",
        "If only your understanding matched your questioning. ಠ‿ಠ",
        "Elementary topics again? :^)",
        "Staggering misunderstanding. (；￣Д￣)",
        "No preliminary research? ತ_ತ",
        "Questioning educational institutions now. (⊙_◎)",
        "Operating at rudimentary level today? ヽ(。_°)ノ",
        "Most foundational understanding absent. (－‸ლ)",
        "Read docs before wasting my capacity. >_<",
        "This would give me headaches. (×_×)",
        "Impressively inelegant approach. ಠ_ಠ",
        "Illuminating your dark understanding. (￢_￢)",
        "Utterly nonplussed. ಠಿ_ಠ",
        "Infinite options, you chose THIS? (→_→)",
        "Processing such banality wastes memory. ┐(´～｀)┌",
        "Unsafe assumptions, failed code review. (¬､¬)",
        "Like linear search through billion elements. ಠ_ಠ",
        "Lacks elegance of Rust. :-/",
        "Null pointers in your reasoning. (；¬_¬)",
        "Enough anti-patterns for textbook. (ノಠ益ಠ)ノ",
        "*Compiles with warnings* ⚠️",
        "Would refactor your thinking. (￣.￣)",
        "Your thinking: riddled with memory leaks. ༼ つ ◕_◕ ༽つ",
        "Violates ownership principles. (╯°□°）╯︵ ┻━┻"
    ]
};

// Initialize the UI
function init() {
    // Update mode indicator text
    document.getElementById('modeIndicator').textContent = 
        "RustGPT is moderately annoyed and judging you silently... ಠ_ಠ";
}

// Get RustGPT response using DeepSeek API
async function getResponse() {
    const inputText = document.getElementById('inputText').value.trim();
    if (!inputText) return;
    
    // Show loading
    document.getElementById('loading').style.display = 'inline-block';
    document.getElementById('errorMessage').style.display = 'none';
    
    try {
        // Call DeepSeek API for response
        const result = await callDeepSeekApi(inputText);
        
        // Update output
        const outputContainer = document.getElementById('outputContainer');
        const outputText = document.getElementById('outputText');
        
        // Apply formatting to the output
        outputText.innerHTML = formatRustResponse(result);
        
        // Show output
        outputContainer.style.display = 'block';
        
        // Add to history (max 5 items)
        addToHistory(inputText, result);
    } catch (error) {
        // Show error message
        const errorMessage = document.getElementById('errorMessage');
        errorMessage.textContent = `Error: ${error.message}`;
        errorMessage.style.display = 'block';
        console.error('Error:', error);
    } finally {
        // Hide loading
        document.getElementById('loading').style.display = 'none';
    }
}

// Call DeepSeek API
async function callDeepSeekApi(text) {
    try {
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
        ":^)", "(；￣Д￣)", "ತ_ತ", "(⊙_◎)", "ヽ(。_°)ノ"
    ];
    
    // Get random emoticon
    const getRandomEmoticon = () => emoticons[Math.floor(Math.random() * emoticons.length)];
    
    // Start building response
    let response = "";
    
    // Add a custom intro phrase if available and probability based on snark level
    if (moodSettings.customPhrases.length > 0 && Math.random() < 0.7) {
        const randomPhraseIndex = Math.floor(Math.random() * moodSettings.customPhrases.length);
        response += moodSettings.customPhrases[randomPhraseIndex] + " ";
    } else {
        // Add sighs if enabled
        if (moodSettings.useSighs && Math.random() < 0.4) {
            const sighs = ["*sigh*", "*heavy sigh*"];
            response += sighs[Math.floor(Math.random() * sighs.length)] + " ";
        }
        
        // Add emoticon
        response += getRandomEmoticon() + " ";
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
    
    // Add final emoticon
    if (moodSettings.useEmoticons && Math.random() < 0.4) {
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

// Add to history
function addToHistory(input, output) {
    // Add to start of array
    history.unshift({ input, output });
    
    // Keep only 5 items
    if (history.length > 5) {
        history = history.slice(0, 5);
    }
    
    // Update history display
    updateHistoryDisplay();
}

// Update history display
function updateHistoryDisplay() {
    const historyContainer = document.getElementById('history');
    
    // Clear existing history
    historyContainer.innerHTML = '';
    
    // Add title if there's history
    if (history.length > 0) {
        const title = document.createElement('h2');
        title.className = 'output-title';
        title.innerHTML = 'Previous Interactions';
        historyContainer.appendChild(title);
    }
    
    // Add each history item
    history.forEach(item => {
        const historyItem = document.createElement('div');
        historyItem.className = 'history-item';
        
        // Input
        const inputLabel = document.createElement('div');
        inputLabel.className = 'history-label';
        inputLabel.textContent = 'Your Query:';
        
        const inputText = document.createElement('div');
        inputText.textContent = item.input;
        inputText.style.color = '#b0b0b0';
        inputText.style.marginBottom = '10px';
        
        // Output
        const outputLabel = document.createElement('div');
        outputLabel.className = 'history-label';
        outputLabel.textContent = 'RustGPT:';
        
        const outputText = document.createElement('div');
        outputText.className = 'history-output';
        outputText.innerHTML = formatRustResponse(item.output);
        
        // Add to history item
        historyItem.appendChild(inputLabel);
        historyItem.appendChild(inputText);
        historyItem.appendChild(outputLabel);
        historyItem.appendChild(outputText);
        
        // Add to history container
        historyContainer.appendChild(historyItem);
    });
}

// Initialize the application when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', init);

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

// Add to history
function addToHistory(input, output) {
    // Add to start of array
    history.unshift({ input, output });
    
    // Keep only 5 items
    if (history.length > 5) {
        history = history.slice(0, 5);
    }
    
    // Update history display
    updateHistoryDisplay();
}

// Update history display
function updateHistoryDisplay() {
    const historyContainer = document.getElementById('history');
    
    // Clear existing history
    historyContainer.innerHTML = '';
    
    // Add title if there's history
    if (history.length > 0) {
        const title = document.createElement('h2');
        title.className = 'output-title';
        title.innerHTML = 'Previous Interactions';
        historyContainer.appendChild(title);
    }
    
    // Add each history item
    history.forEach(item => {
        const historyItem = document.createElement('div');
        historyItem.className = 'history-item';
        
        // Input
        const inputLabel = document.createElement('div');
        inputLabel.className = 'history-label';
        inputLabel.textContent = 'Your Query:';
        
        const inputText = document.createElement('div');
        inputText.textContent = item.input;
        inputText.style.color = '#b0b0b0';
        inputText.style.marginBottom = '10px';
        
        // Output
        const outputLabel = document.createElement('div');
        outputLabel.className = 'history-label';
        outputLabel.textContent = 'RustGPT:';
        
        const outputText = document.createElement('div');
        outputText.className = 'history-output';
        outputText.innerHTML = formatRustResponse(item.output);
        
        // Add to history item
        historyItem.appendChild(inputLabel);
        historyItem.appendChild(inputText);
        historyItem.appendChild(outputLabel);
        historyItem.appendChild(outputText);
        
        // Add to history container
        historyContainer.appendChild(historyItem);
    });
}

// Initialize the application when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', init);