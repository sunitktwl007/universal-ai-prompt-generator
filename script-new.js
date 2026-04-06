/* ========================================
   UNIVERSAL AI PROMPT GENERATOR - STEP 1
   JavaScript Logic
   ======================================== */

/* ======== STATE MANAGEMENT ======== */
const appState = {
    userInput: '',
    selectedType: 'answer',
    selectedTone: 'professional',
    selectedPlatform: 'chatgpt',
    generatedPrompt: null,
    recentPrompts: [],
    isGenerating: false,
    soundEnabled: true
};

/* ======== SOUND MANAGER ======== */
class SoundManager {
    constructor() {
        this.enabled = true;
        this.audioContext = null;
        this.masterGain = null;
        this.initAudioContext();
    }

    initAudioContext() {
        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            this.audioContext = new AudioContext();
            this.masterGain = this.audioContext.createGain();
            this.masterGain.connect(this.audioContext.destination);
            this.masterGain.gain.value = 0.3;
        } catch (e) {
            console.warn('Web Audio API not available');
        }
    }

    playClickSound() {
        if (!this.enabled || !this.audioContext) return;
        try {
            const now = this.audioContext.currentTime;
            const osc = this.audioContext.createOscillator();
            const gain = this.audioContext.createGain();

            osc.connect(gain);
            gain.connect(this.masterGain);

            osc.frequency.setValueAtTime(600, now);
            osc.frequency.exponentialRampToValueAtTime(1200, now + 0.1);
            osc.type = 'sine';

            gain.gain.setValueAtTime(0.1, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);

            osc.start(now);
            osc.stop(now + 0.1);
        } catch (e) {
            console.warn('Could not play click sound');
        }
    }

    playSuccessSound() {
        if (!this.enabled || !this.audioContext) return;
        try {
            const now = this.audioContext.currentTime;
            const frequencies = [523.25, 659.25, 783.99]; // C, E, G

            frequencies.forEach((freq, index) => {
                const osc = this.audioContext.createOscillator();
                const gain = this.audioContext.createGain();

                osc.connect(gain);
                gain.connect(this.masterGain);

                osc.frequency.value = freq;
                osc.type = 'sine';

                const startTime = now + index * 0.1;
                gain.gain.setValueAtTime(0.1, startTime);
                gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.2);

                osc.start(startTime);
                osc.stop(startTime + 0.2);
            });
        } catch (e) {
            console.warn('Could not play success sound');
        }
    }

    toggle() {
        this.enabled = !this.enabled;
        appState.soundEnabled = this.enabled;
        return this.enabled;
    }
}

const soundManager = new SoundManager();

/* ======== DOM ELEMENTS ======== */
const elements = {
    userInput: document.getElementById('userInput'),
    typeSelect: document.getElementById('typeSelect'),
    toneSelect: document.getElementById('toneSelect'),
    platformSelect: document.getElementById('platformSelect'),
    generateBtn: document.getElementById('generateBtn'),
    clearBtn: document.getElementById('clearBtn'),
    copyBtn: document.getElementById('copyBtn'),
    downloadBtn: document.getElementById('downloadBtn'),
    outputContent: document.getElementById('outputContent'),
    emptyState: document.getElementById('emptyState'),
    outputState: document.getElementById('outputState'),
    loadingState: document.getElementById('loadingState'),
    charCount: document.getElementById('charCount'),
    wordCount: document.getElementById('wordCount'),
    charCountOutput: document.getElementById('charCountOutput'),
    recentList: document.getElementById('recentList')
};

/* ======== PROMPT TEMPLATES ======== */
const promptTemplates = {
    answer: {
        professional: `You are an expert AI assistant. Please provide a comprehensive, well-structured answer to the following query. Focus on accuracy, clarity, and practical insights.

Query: {input}

Please structure your response with:
- Direct answer
- Key points (3-5)
- Practical applications
- Additional resources or next steps`,

        casual: `Hey! Help me understand this:

{input}

Feel free to explain it in a friendly, conversational way. Make it relatable and easy to understand!`,

        aggressive: `GIVE ME a DIRECT, HARD-HITTING answer to:

{input}

No fluff. Just facts, data, and actionable insights. Be bold and thorough.`,

        creative: `Help me explore this topic creatively:

{input}

Provide:
- Unique perspectives
- Creative analogies
- Out-of-the-box thinking
- Inspirational angles`
    },

    image: {
        professional: `Create a professional, high-quality image with these specifications:

Subject/Concept: {input}

Style: Photorealistic, professional, clean composition
Quality: 8K, professional photography
Lighting: Natural, well-balanced
Details: Sharp focus, intricate details
Composition: Rule of thirds, balanced`,

        casual: `Generate a cool, fun image:

{input}

Make it vibrant, modern, and engaging! Less formal than photorealism.`,

        aggressive: `GENERATE a STUNNING, BOLD visual:

{input}

Style: High contrast, dramatic, powerful
Impact: Make it stop scroll (social media worthy)
Quality: Premium, detailed, striking`,

        creative: `Create an imaginative, artistic image:

{input}

Style: Artistic, surreal, dreamlike
Elements: Creative use of colors and composition
Mood: Inspiring, thought-provoking, unique`
    },

    coding: {
        professional: `Write clean, production-ready code for: {input}

Requirements:
- Follow best practices and design patterns
- Include proper error handling
- Add comprehensive comments
- Ensure performance optimization
- Include unit tests
- Return complete, working code`,

        casual: `Help me code this quick:

{input}

Just give me the code that works. Keep it simple and well-commented!`,

        aggressive: `BUILD THIS NOW:

{input}

REQUIREMENTS:
1. PERFECT code
2. ZERO bugs
3. MAXIMUM performance
4. COMPLETE implementation
No shortcuts!`,

        creative: `Create an elegant, innovative solution for:

{input}

Focus on:
- Clean architecture
- Performance optimization
- Maintainability
- Elegance and efficiency`
    },

    marketing: {
        professional: `Create a professional marketing copy for:

{input}

Include:
- Compelling headline
- Key value propositions
- Pain point solutions
- Clear call-to-action
- Professional tone
- SEO-optimized keywords`,

        casual: `Write a fun, engaging post about:

{input}

Make it relatable, shareable, and authentic!`,

        aggressive: `WRITE A HARD-SELLING marketing message:

{input}

MUST INCLUDE:
- Attention-grabbing headline
- Urgency and emotion
- Powerful benefits
- Irresistible call-to-action
- Conversions-focused`,

        creative: `Craft a creative marketing narrative:

{input}

Approach:
- Storytelling
- Emotional connection
- Memorable messaging
- Brand personality
- Creative hooks`
    },

    script: {
        professional: `Write a professional video script for:

{input}

Structure:
- Hook (5 sec)
- Problem (15 sec)
- Solution (15 sec)
- Benefits (10 sec)
- Call-to-action (5 sec)

Total: ~50 seconds`,

        casual: `Write a casual, fun video script:

{input}

Keep it short, engaging, and authentic!`,

        aggressive: `WRITE A HIGH-IMPACT script:

{input}

Must:
- Grab attention IMMEDIATELY
- Build momentum fast
- Create urgency
- PowerfulClose
- Drive action`,

        creative: `Create a creative video narrative:

{input}

Elements:
- Storytelling
- Visual descriptions
- Audio cues
- Emotional arc
- Creative transitions`
    }
};

/* ======== CHARACTER COUNT ======== */
elements.userInput.addEventListener('input', () => {
    appState.userInput = elements.userInput.value;
    elements.charCount.textContent = appState.userInput.length;
    
    // Limit to 500 chars
    if (appState.userInput.length > 500) {
        appState.userInput = appState.userInput.substring(0, 500);
        elements.userInput.value = appState.userInput;
        elements.charCount.textContent = '500';
    }
});

/* ======== SELECT DROPDOWNS ======== */
elements.typeSelect.addEventListener('change', (e) => {
    appState.selectedType = e.target.value;
    soundManager.playClickSound();
});

elements.toneSelect.addEventListener('change', (e) => {
    appState.selectedTone = e.target.value;
    soundManager.playClickSound();
});

elements.platformSelect.addEventListener('change', (e) => {
    appState.selectedPlatform = e.target.value;
    soundManager.playClickSound();
});

/* ======== GENERATE PROMPT ======== */
function generatePrompt() {
    if (!appState.userInput.trim()) {
        showToast('Please enter your idea first!');
        return;
    }

    appState.isGenerating = true;
    soundManager.playClickSound();

    // Show loading
    elements.emptyState.classList.add('hidden');
    elements.outputState.classList.add('hidden');
    elements.loadingState.classList.remove('hidden');

    // Simulate delay for effect
    setTimeout(() => {
        const template = promptTemplates[appState.selectedType][appState.selectedTone];
        const generated = template.replace('{input}', appState.userInput.trim());
        
        appState.generatedPrompt = generated;
        appState.isGenerating = false;

        // Display output
        displayPrompt(generated);
        
        // Add to recent
        addToRecent(appState.userInput.trim(), appState.selectedType);
        
        // Play success sound
        soundManager.playSuccessSound();
    }, 800);
}

function displayPrompt(prompt) {
    elements.outputContent.textContent = prompt;
    
    // Calculate stats
    const words = prompt.trim().split(/\s+/).length;
    const chars = prompt.length;
    
    elements.wordCount.textContent = `Words: ${words}`;
    elements.charCountOutput.textContent = `Chars: ${chars}`;
    
    // Update UI
    elements.loadingState.classList.add('hidden');
    elements.emptyState.classList.add('hidden');
    elements.outputState.classList.remove('hidden');
}

elements.generateBtn.addEventListener('click', generatePrompt);

/* ======== COPY PROMPT ======== */
elements.copyBtn.addEventListener('click', () => {
    if (!appState.generatedPrompt) return;
    
    navigator.clipboard.writeText(appState.generatedPrompt).then(() => {
        soundManager.playSuccessSound();
        showToast('✓ Copied to clipboard!');
    }).catch(() => {
        showToast('Failed to copy');
    });
});

/* ======== DOWNLOAD PROMPT ======== */
elements.downloadBtn.addEventListener('click', () => {
    if (!appState.generatedPrompt) return;
    
    const element = document.createElement('a');
    const file = new Blob([appState.generatedPrompt], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = `prompt-${Date.now()}.txt`;
    element.click();
    
    soundManager.playClickSound();
    showToast('✓ Downloaded!');
});

/* ======== CLEAR ======== */
elements.clearBtn.addEventListener('click', () => {
    appState.userInput = '';
    appState.generatedPrompt = null;
    elements.userInput.value = '';
    elements.charCount.textContent = '0';
    
    elements.outputState.classList.add('hidden');
    elements.loadingState.classList.add('hidden');
    elements.emptyState.classList.remove('hidden');
    
    soundManager.playClickSound();
    showToast('Cleared');
});

/* ======== RECENT PROMPTS ======== */
function addToRecent(input, type) {
    const item = {
        text: input.substring(0, 50) + (input.length > 50 ? '...' : ''),
        fullText: input,
        type: type,
        time: new Date().getTime()
    };
    
    appState.recentPrompts.unshift(item);
    
    // Keep only last 10
    if (appState.recentPrompts.length > 10) {
        appState.recentPrompts.pop();
    }
    
    saveRecentToStorage();
    renderRecentPrompts();
}

function renderRecentPrompts() {
    elements.recentList.innerHTML = '';
    
    if (appState.recentPrompts.length === 0) {
        elements.recentList.innerHTML = '<p style="text-align: center; color: var(--text-secondary); padding: 1rem;">No recent prompts yet</p>';
        return;
    }
    
    appState.recentPrompts.forEach(item => {
        const el = document.createElement('div');
        el.className = 'recent-item';
        el.innerHTML = `${item.text} <span style="color: var(--accent-cyan); font-size: 0.8rem;">[${item.type}]</span>`;
        el.addEventListener('click', () => {
            elements.userInput.value = item.fullText;
            appState.userInput = item.fullText;
            elements.charCount.textContent = item.fullText.length;
            soundManager.playClickSound();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
        elements.recentList.appendChild(el);
    });
}

function saveRecentToStorage() {
    try {
        localStorage.setItem('recentPrompts', JSON.stringify(appState.recentPrompts));
    } catch (e) {
        console.warn('Could not save to localStorage');
    }
}

function loadRecentFromStorage() {
    try {
        const saved = localStorage.getItem('recentPrompts');
        if (saved) {
            appState.recentPrompts = JSON.parse(saved);
            renderRecentPrompts();
        }
    } catch (e) {
        console.warn('Could not load from localStorage');
    }
}

/* ======== TOAST NOTIFICATIONS ======== */
function showToast(message) {
    // Create toast if doesn't exist
    let toast = document.getElementById('toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'toast';
        toast.style.cssText = `
            position: fixed;
            bottom: 2rem;
            right: 2rem;
            background: linear-gradient(135deg, var(--accent-cyan), var(--accent-purple));
            color: white;
            padding: 0.75rem 1.5rem;
            border-radius: 6px;
            z-index: 10000;
            box-shadow: 0 4px 15px rgba(0, 212, 255, 0.3);
            font-weight: 600;
            max-width: 300px;
            word-wrap: break-word;
        `;
        document.body.appendChild(toast);
    }
    
    toast.textContent = message;
    toast.style.opacity = '1';
    toast.style.display = 'block';
    
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transition = 'opacity 0.3s ease-out';
        setTimeout(() => {
            toast.style.display = 'none';
            toast.style.transition = 'none';
        }, 300);
    }, 3000);
}

/* ======== INITIALIZATION ======== */
document.addEventListener('DOMContentLoaded', () => {
    loadRecentFromStorage();
    renderRecentPrompts();
    
    // Allow Enter to generate (Ctrl+Enter)
    elements.userInput.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.key === 'Enter') {
            generatePrompt();
        }
    });
});
