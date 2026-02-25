// Working spell check using existing div
class SpellCheckManager {
    constructor() {
        this.popup = null;
        this.checkTimer = null;
    }

    async init(language = 'en_US') {
        this.setupPopup();
        this.setupListener();
        console.log('✓ Spell checker ready');
    }

    setupPopup() {
        // Use existing div from HTML
        this.popup = document.getElementById('spellSuggestions');
        if (!this.popup) {
            console.error('spellSuggestions div not found!');
            return;
        }

        // Style it to be visible
        this.popup.style.cssText = `
            position: fixed;
            display: none;
            background: white;
            border: 4px solid #FF4081;
            border-radius: 10px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.5);
            padding: 0;
            z-index: 999999;
            min-width: 220px;
            font-family: Arial, sans-serif;
        `;
        
        console.log('✓ Popup styled');
    }

    setupListener() {
        const editor = document.getElementById('visualEditor');
        if (!editor) {
            console.error('Visual editor not found!');
            return;
        }

        editor.addEventListener('input', () => {
            clearTimeout(this.checkTimer);
            this.checkTimer = setTimeout(() => this.check(), 400);
        });

        document.addEventListener('click', (e) => {
            if (!e.target.closest('#spellSuggestions')) {
                this.hide();
            }
        });
        
        console.log('✓ Listener attached');
    }

    check() {
        const sel = window.getSelection();
        if (!sel.rangeCount) return;

        const range = sel.getRangeAt(0);
        const node = range.startContainer;

        if (node.nodeType !== Node.TEXT_NODE) return;

        const text = node.textContent;
        const pos = range.startOffset;

        // Find word boundaries
        let start = pos;
        let end = pos;

        while (start > 0 && /\w/.test(text[start - 1])) start--;
        while (end < text.length && /\w/.test(text[end])) end++;

        const word = text.substring(start, end);

        if (word.length < 2) {
            this.hide();
            return;
        }

        console.log('Checking:', word);

        const fixes = this.getFixes(word);
        if (fixes.length > 0) {
            console.log('Found fixes:', fixes);
            this.show(word, fixes, node, start, end);
        } else {
            this.hide();
        }
    }

    getFixes(word) {
        const w = word.toLowerCase();
        
        const corrections = {
            'teh': ['the'],
            'taht': ['that'],
            'waht': ['what'],
            'hte': ['the'],
            'adn': ['and'],
            'nad': ['and'],
            'wiht': ['with'],
            'thsi': ['this'],
            'thier': ['their'],
            'recieve': ['receive'],
            'occured': ['occurred'],
            'seperate': ['separate'],
            'definately': ['definitely'],
            'wierd': ['weird'],
            'freind': ['friend'],
            'beleive': ['believe'],
            'untill': ['until'],
            'dont': ["don't"],
            'cant': ["can't"],
            'wont': ["won't"],
            'didnt': ["didn't"],
            'doesnt': ["doesn't"],
            'isnt': ["isn't"],
            'wasnt': ["wasn't"]
        };
        
        return corrections[w] || [];
    }

    show(word, fixes, node, start, end) {
        if (!this.popup) return;
        
        console.log('★ SHOWING POPUP for:', word);

        this.popup.innerHTML = '';
        
        // Header
        const header = document.createElement('div');
        header.textContent = '✓ Suggestions';
        header.style.cssText = `
            background: #FF4081;
            color: white;
            padding: 12px 16px;
            font-weight: bold;
            font-size: 15px;
            border-radius: 6px 6px 0 0;
        `;
        this.popup.appendChild(header);

        // List
        fixes.forEach((fix, i) => {
            const item = document.createElement('div');
            item.textContent = fix;
            item.style.cssText = `
                padding: 14px 18px;
                cursor: pointer;
                font-size: 16px;
                font-weight: 500;
                background: ${i % 2 ? '#f8f8f8' : 'white'};
                border-bottom: 2px solid #eee;
                transition: all 0.2s;
            `;

            item.onmouseover = () => {
                item.style.background = '#FF4081';
                item.style.color = 'white';
                item.style.transform = 'scale(1.02)';
            };
            
            item.onmouseout = () => {
                item.style.background = i % 2 ? '#f8f8f8' : 'white';
                item.style.color = 'black';
                item.style.transform = 'scale(1)';
            };

            item.onclick = () => {
                console.log('✓ Applied:', fix);
                const text = node.textContent;
                node.textContent = text.substring(0, start) + fix + text.substring(end);

                const newRange = document.createRange();
                const newPos = start + fix.length;
                newRange.setStart(node, newPos);
                newRange.setEnd(node, newPos);

                const sel = window.getSelection();
                sel.removeAllRanges();
                sel.addRange(newRange);

                this.hide();
            };

            this.popup.appendChild(item);
        });

        // Position
        const sel = window.getSelection();
        const range = sel.getRangeAt(0);
        const rect = range.getBoundingClientRect();

        this.popup.style.left = (rect.left + window.pageXOffset) + 'px';
        this.popup.style.top = (rect.bottom + window.pageYOffset + 8) + 'px';
        this.popup.style.display = 'block';

        console.log('★ Popup displayed at:', rect.left, rect.bottom);
    }

    hide() {
        if (this.popup) {
            this.popup.style.display = 'none';
        }
    }

    setLanguage(lang) {
        console.log('Language:', lang);
    }
}

const spellCheckManager = new SpellCheckManager();