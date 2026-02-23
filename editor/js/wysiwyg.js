// WYSIWYG Editor with CodeMirror
class WysiwygEditor {
    constructor() {
        this.visualEditor = null;
        this.codeEditor = null;
        this.codeMirror = null;
        this.mode = 'visual';
        this.initialized = false;
        this.searchMatches = [];
        this.currentMatchIndex = -1;
    }

    init() {
        if (this.initialized) return;

        this.visualEditor = document.getElementById('visualEditor');
        this.codeEditor = document.getElementById('codeEditor');
        
        if (!this.visualEditor) return;

        this.setupToolbar();
        this.initCodeMirror();
        this.setupUndoRedo();
        this.initialized = true;
    }

    setupUndoRedo() {
        this.undoStack = [];
        this.redoStack = [];
        
        // Save state on input (but not during search)
        this.visualEditor.addEventListener('input', () => {
            clearTimeout(this.undoTimer);
            this.undoTimer = setTimeout(() => {
                this.saveState();
            }, 500);
        });
        
        // Save initial state
        this.saveState();
    }

    initCodeMirror() {
        if (window.CodeMirror && this.codeEditor) {
            this.codeMirror = CodeMirror.fromTextArea(this.codeEditor, {
                mode: 'htmlmixed',
                theme: 'dracula',
                lineNumbers: true,
                lineWrapping: true,
                indentUnit: 2,
                tabSize: 2
            });
        }
    }

    setupToolbar() {
        // Undo/Redo buttons - use custom stack
        const undoBtn = document.getElementById('undoBtn');
        const redoBtn = document.getElementById('redoBtn');
        
        if (undoBtn) {
            undoBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                
                if (this.mode === 'html' && this.codeMirror) {
                    this.codeMirror.undo();
                    this.codeMirror.focus();
                } else {
                    this.performUndo();
                }
            });
        }
        
        if (redoBtn) {
            redoBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                
                if (this.mode === 'html' && this.codeMirror) {
                    this.codeMirror.redo();
                    this.codeMirror.focus();
                } else {
                    this.performRedo();
                }
            });
        }
        
        const formatButtons = document.querySelectorAll('[data-command]');
        formatButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                const command = button.dataset.command;
                const value = button.dataset.value || null;
                
                if (command === 'createLink') {
                    const url = prompt('Enter URL:');
                    if (url) {
                        document.execCommand(command, false, url);
                    }
                } else {
                    document.execCommand(command, false, value);
                }
                
                this.visualEditor.focus();
            });
        });

        const insertImageBtn = document.getElementById('insertImageBtn');
        if (insertImageBtn) {
            insertImageBtn.addEventListener('click', async (e) => {
                e.preventDefault();
                await this.insertImage();
            });
        }

        const insertImageUrlBtn = document.getElementById('insertImageUrlBtn');
        if (insertImageUrlBtn) {
            insertImageUrlBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.insertImageUrl();
            });
        }

        const insertPreBtn = document.getElementById('insertPreBtn');
        if (insertPreBtn) {
            insertPreBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.insertPre();
            });
        }

        const insertEmbedBtn = document.getElementById('insertEmbedBtn');
        if (insertEmbedBtn) {
            insertEmbedBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.insertEmbed();
            });
        }

        const viewHtmlBtn = document.getElementById('viewHtmlBtn');
        if (viewHtmlBtn) {
            viewHtmlBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.toggleMode();
            });
        }

        // Search functionality
        this.setupSearch();
    }

    setupSearch() {
        const searchInput = document.getElementById('editorSearchInput');
        const searchPrevBtn = document.getElementById('searchPrevBtn');
        const searchNextBtn = document.getElementById('searchNextBtn');
        const clearSearchBtn = document.getElementById('clearSearchBtn');

        if (searchInput) {
            searchInput.addEventListener('input', () => {
                this.performSearch(searchInput.value);
            });

            searchInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    if (e.shiftKey) {
                        this.searchPrevious();
                    } else {
                        this.searchNext();
                    }
                }
            });
        }

        if (searchPrevBtn) {
            searchPrevBtn.addEventListener('click', () => this.searchPrevious());
        }

        if (searchNextBtn) {
            searchNextBtn.addEventListener('click', () => this.searchNext());
        }

        if (clearSearchBtn) {
            clearSearchBtn.addEventListener('click', () => {
                if (searchInput) searchInput.value = '';
                this.clearSearch();
            });
        }
    }

    performSearch(query) {
        this.clearSearch();
        
        if (!query || query.length < 2) return;

        if (this.mode === 'html' && this.codeMirror) {
            this.searchInCodeMirror(query);
        } else {
            this.searchInVisualEditor(query);
        }
    }

    searchInVisualEditor(query) {
        const content = this.visualEditor.innerHTML;
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = content;

        const searchRegex = new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
        const walker = document.createTreeWalker(
            tempDiv,
            NodeFilter.SHOW_TEXT,
            null,
            false
        );

        const textNodes = [];
        while (walker.nextNode()) {
            if (walker.currentNode.textContent.match(searchRegex)) {
                textNodes.push(walker.currentNode);
            }
        }

        textNodes.forEach(node => {
            const parent = node.parentNode;
            const text = node.textContent;
            const fragment = document.createDocumentFragment();
            let lastIndex = 0;
            let match;

            searchRegex.lastIndex = 0;
            while ((match = searchRegex.exec(text)) !== null) {
                if (match.index > lastIndex) {
                    fragment.appendChild(document.createTextNode(text.substring(lastIndex, match.index)));
                }
                
                const mark = document.createElement('mark');
                mark.className = 'search-highlight';
                mark.textContent = match[0];
                fragment.appendChild(mark);
                this.searchMatches.push(mark);
                
                lastIndex = match.index + match[0].length;
            }

            if (lastIndex < text.length) {
                fragment.appendChild(document.createTextNode(text.substring(lastIndex)));
            }

            parent.replaceChild(fragment, node);
        });

        this.visualEditor.innerHTML = tempDiv.innerHTML;
        
        if (this.searchMatches.length > 0) {
            this.currentMatchIndex = 0;
            this.highlightCurrentMatch();
        }
    }

    searchInCodeMirror(query) {
        const cursor = this.codeMirror.getSearchCursor(query, null, { caseFold: true });
        
        while (cursor.findNext()) {
            this.searchMatches.push({
                from: cursor.from(),
                to: cursor.to()
            });
        }

        if (this.searchMatches.length > 0) {
            this.currentMatchIndex = 0;
            this.highlightCurrentMatchCodeMirror();
        }
    }

    searchNext() {
        if (this.searchMatches.length === 0) return;
        
        this.currentMatchIndex = (this.currentMatchIndex + 1) % this.searchMatches.length;
        this.highlightCurrentMatch();
    }

    searchPrevious() {
        if (this.searchMatches.length === 0) return;
        
        this.currentMatchIndex = this.currentMatchIndex - 1;
        if (this.currentMatchIndex < 0) {
            this.currentMatchIndex = this.searchMatches.length - 1;
        }
        this.highlightCurrentMatch();
    }

    highlightCurrentMatch() {
        if (this.mode === 'html' && this.codeMirror) {
            this.highlightCurrentMatchCodeMirror();
        } else {
            // Remove previous current highlight
            this.visualEditor.querySelectorAll('.search-highlight-current').forEach(el => {
                el.classList.remove('search-highlight-current');
                el.classList.add('search-highlight');
            });

            // Highlight current match
            if (this.searchMatches[this.currentMatchIndex]) {
                const marks = this.visualEditor.querySelectorAll('.search-highlight');
                if (marks[this.currentMatchIndex]) {
                    marks[this.currentMatchIndex].classList.remove('search-highlight');
                    marks[this.currentMatchIndex].classList.add('search-highlight-current');
                    marks[this.currentMatchIndex].scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }
        }
    }

    highlightCurrentMatchCodeMirror() {
        this.codeMirror.getAllMarks().forEach(mark => mark.clear());
        
        const match = this.searchMatches[this.currentMatchIndex];
        if (match) {
            this.codeMirror.markText(match.from, match.to, {
                className: 'search-highlight-current'
            });
            this.codeMirror.scrollIntoView(match.from, 100);
            this.codeMirror.setCursor(match.from);
        }
    }

    clearSearch() {
        this.searchMatches = [];
        this.currentMatchIndex = -1;

        if (this.mode === 'html' && this.codeMirror) {
            this.codeMirror.getAllMarks().forEach(mark => mark.clear());
        } else {
            // Remove all search highlights
            const content = this.visualEditor.innerHTML;
            this.visualEditor.innerHTML = content.replace(/<mark class="search-highlight[^"]*">([^<]*)<\/mark>/g, '$1');
        }
    }

    async insertImage() {
        try {
            const file = await storageManager.chooseImage();
            if (!file) return;

            const imagePath = await storageManager.saveImage(file);
            
            const img = document.createElement('img');
            
            const settings = storageManager.getSettings();
            const fullPath = require('path').join(settings.blogDirectory, imagePath);
            
            img.src = 'file://' + fullPath;
            img.dataset.blogPath = imagePath;
            img.alt = file.name;
            img.style.maxWidth = '100%';
            
            const selection = window.getSelection();
            if (selection.rangeCount > 0) {
                const range = selection.getRangeAt(0);
                range.insertNode(img);
                range.collapse(false);
            } else {
                this.visualEditor.appendChild(img);
            }
        } catch (error) {
            console.error('Error inserting image:', error);
            alert('Failed to insert image');
        }
    }

    insertImageUrl() {
        const url = prompt('Enter image URL:');
        if (!url) return;

        const img = document.createElement('img');
        img.src = url;
        img.alt = 'Image';
        img.style.maxWidth = '100%';
        
        const selection = window.getSelection();
        if (selection.rangeCount > 0) {
            const range = selection.getRangeAt(0);
            range.insertNode(img);
            range.collapse(false);
        } else {
            this.visualEditor.appendChild(img);
        }
    }

    insertPre() {
        const code = prompt('Enter code:');
        if (!code) return;

        const pre = document.createElement('pre');
        const codeEl = document.createElement('code');
        codeEl.textContent = code;
        pre.appendChild(codeEl);
        
        const selection = window.getSelection();
        if (selection.rangeCount > 0) {
            const range = selection.getRangeAt(0);
            range.insertNode(pre);
            range.collapse(false);
        } else {
            this.visualEditor.appendChild(pre);
        }
    }

    insertEmbed() {
        const embedCode = prompt('Enter embed code (iframe, video, etc.):');
        if (!embedCode) return;

        const div = document.createElement('div');
        div.className = 'embed-container';
        div.innerHTML = embedCode;
        
        const selection = window.getSelection();
        if (selection.rangeCount > 0) {
            const range = selection.getRangeAt(0);
            range.insertNode(div);
            range.collapse(false);
        } else {
            this.visualEditor.appendChild(div);
        }
    }

    toggleMode() {
        if (this.mode === 'visual') {
            // Switch to HTML mode and format
            if (this.codeMirror) {
                const html = this.formatHtml(this.visualEditor.innerHTML);
                this.codeMirror.setValue(html);
                this.visualEditor.style.display = 'none';
                this.codeMirror.getWrapperElement().classList.add('active');
                this.codeMirror.refresh();
                this.mode = 'html';
            }
        } else {
            // Switch to visual mode
            if (this.codeMirror) {
                this.visualEditor.innerHTML = this.codeMirror.getValue();
                this.codeMirror.getWrapperElement().classList.remove('active');
                this.visualEditor.style.display = 'block';
                this.mode = 'visual';
            }
        }
    }

    formatHtml(html) {
        // Use js-beautify to format HTML
        if (window.html_beautify) {
            return html_beautify(html, {
                indent_size: 2,
                wrap_line_length: 80,
                preserve_newlines: true,
                max_preserve_newlines: 2,
                indent_inner_html: true
            });
        }
        return html;
    }

    getContent() {
        let content;
        
        if (this.mode === 'html' && this.codeMirror) {
            content = this.codeMirror.getValue();
        } else {
            content = this.visualEditor.innerHTML;
            
            // Convert file:// paths back to relative paths
            const images = this.visualEditor.querySelectorAll('img[data-blog-path]');
            images.forEach(img => {
                const blogPath = img.dataset.blogPath;
                if (blogPath) {
                    content = content.replace(img.src, blogPath);
                }
            });
        }
        
        // Format HTML before saving
        content = this.formatHtml(content);
        
        return this.cleanContent(content);
    }

    cleanContent(html) {
        // Remove unwanted styles
        html = html.replace(/white-space:\s*nowrap;?/gi, '');
        html = html.replace(/font-family:\s*-apple-system[^;"]*(;|")/gi, '');
        
        return html;
    }

    setContent(content) {
        if (this.mode === 'html' && this.codeMirror) {
            this.codeMirror.setValue(content);
        } else {
            this.visualEditor.innerHTML = content;
        }
    }

    clear() {
        this.visualEditor.innerHTML = '';
        if (this.codeMirror) {
            this.codeMirror.setValue('');
        }
        // Switch back to visual mode if in HTML mode
        if (this.mode === 'html') {
            this.toggleMode();
        }
    }
 setupUndoRedo() {
        this.undoStack = [];
        this.redoStack = [];
        this.isUndoing = false;
        this.isRedoing = false;
        this.lastContent = '';
        
        // Save on every word completion (space, punctuation, etc)
        this.visualEditor.addEventListener('input', (e) => {
            if (this.isUndoing || this.isRedoing) return;
            
            const content = this.visualEditor.innerHTML;
            
            // Save after word completion
            if (e.inputType === 'insertText' && (e.data === ' ' || e.data === '.' || e.data === ',' || e.data === '\n')) {
                this.saveWord();
            } 
            // Also save after delete
            else if (e.inputType === 'deleteContentBackward' || e.inputType === 'deleteContentForward') {
                clearTimeout(this.wordTimer);
                this.wordTimer = setTimeout(() => this.saveWord(), 300);
            }
        });
        
        // Save on keydown for special cases
        this.visualEditor.addEventListener('keydown', (e) => {
            if (this.isUndoing || this.isRedoing) return;
            
            // Save before formatting commands
            if ((e.ctrlKey || e.metaKey) && ['b', 'i', 'u'].includes(e.key.toLowerCase())) {
                this.saveWord();
            }
        });
        
        // Save initial
        setTimeout(() => this.saveWord(), 100);
    }

    saveWord() {
        if (this.isUndoing || this.isRedoing) return;
        if (this.searchMatches.length > 0) return;
        
        const editor = document.getElementById('visualEditor');
        if (!editor) return;
        
        let content = editor.innerHTML;
        content = content.replace(/<mark class="search-highlight[^"]*">([^<]*)<\/mark>/g, '$1');
        
        // Don't save if identical
        if (content === this.lastContent) return;
        
        if (!this.undoStack) this.undoStack = [];
        if (!this.redoStack) this.redoStack = [];
        
        // Save
        this.undoStack.push(content);
        this.lastContent = content;
        this.redoStack = [];
        
        // Limit
        if (this.undoStack.length > 100) {
            this.undoStack.shift();
        }
        
        console.log('Saved word state. Stack size:', this.undoStack.length);
    }

    performUndo() {
        if (!this.undoStack || this.undoStack.length <= 1) {
            console.log('Cannot undo - stack too small');
            return;
        }
        
        const editor = document.getElementById('visualEditor');
        if (!editor) return;
        
        this.isUndoing = true;
        
        // Move current to redo
        const current = this.undoStack.pop();
        if (!this.redoStack) this.redoStack = [];
        this.redoStack.push(current);
        
        // Get previous
        const previous = this.undoStack[this.undoStack.length - 1];
        
        console.log('Undo - stack size:', this.undoStack.length, 'redo size:', this.redoStack.length);
        
        if (previous !== undefined) {
            // Clear search
            const hadSearch = this.searchMatches.length > 0;
            const searchQuery = document.getElementById('editorSearchInput')?.value;
            
            if (hadSearch) {
                this.searchMatches = [];
                this.currentMatchIndex = -1;
            }
            
            editor.innerHTML = previous;
            this.lastContent = previous;
            
            // Restore search
            if (hadSearch && searchQuery) {
                setTimeout(() => this.performSearch(searchQuery), 10);
            }
        }
        
        editor.focus();
        
        setTimeout(() => {
            this.isUndoing = false;
        }, 100);
    }

    performRedo() {
        if (!this.redoStack || this.redoStack.length === 0) {
            console.log('Cannot redo - nothing to redo');
            return;
        }
        
        const editor = document.getElementById('visualEditor');
        if (!editor) return;
        
        this.isRedoing = true;
        
        // Get from redo
        const next = this.redoStack.pop();
        
        console.log('Redo - stack size:', this.undoStack.length, 'redo size:', this.redoStack.length);
        
        if (next !== undefined) {
            // Save to undo
            if (!this.undoStack) this.undoStack = [];
            this.undoStack.push(next);
            
            // Clear search
            const hadSearch = this.searchMatches.length > 0;
            const searchQuery = document.getElementById('editorSearchInput')?.value;
            
            if (hadSearch) {
                this.searchMatches = [];
                this.currentMatchIndex = -1;
            }
            
            editor.innerHTML = next;
            this.lastContent = next;
            
            // Restore search
            if (hadSearch && searchQuery) {
                setTimeout(() => this.performSearch(searchQuery), 10);
            }
        }
        
        editor.focus();
        
        setTimeout(() => {
            this.isRedoing = false;
        }, 100);
    }
}

const wysiwygEditor = new WysiwygEditor();


   