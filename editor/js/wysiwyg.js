// WYSIWYG Editor with CodeMirror
class WysiwygEditor {
    constructor() {
        this.visualEditor = null;
        this.codeEditor = null;
        this.codeMirror = null;
        this.mode = 'visual';
        this.initialized = false;
    }

    init() {
        if (this.initialized) return;

        this.visualEditor = document.getElementById('visualEditor');
        this.codeEditor = document.getElementById('codeEditor');
        
        if (!this.visualEditor) return;

        this.setupToolbar();
        this.initCodeMirror();
        this.initialized = true;
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
            this.codeMirror.setSize(null, '100%');
        }
    }

    setupToolbar() {
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
                this.codeEditor.style.display="none";
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

        const viewHtmlBtn = document.getElementById('viewHtmlBtn');
        if (viewHtmlBtn) {
            viewHtmlBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.toggleMode();
            });
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

    toggleMode() {
        if (this.mode === 'visual') {
            // Switch to HTML mode
            if (this.codeMirror) {
                this.codeMirror.setValue(this.visualEditor.innerHTML);
                this.visualEditor.style.display = 'none';
                this.codeMirror.getWrapperElement().style.display = 'block';
                this.codeMirror.refresh();
                this.mode = 'html';
            }
        } else {
            // Switch to visual mode
            if (this.codeMirror) {
                this.visualEditor.innerHTML = this.codeMirror.getValue();
                this.codeMirror.getWrapperElement().style.display = 'none';
                this.visualEditor.style.display = 'block';
                this.mode = 'visual';
            }
        }
    }

    getContent() {
        if (this.mode === 'html' && this.codeMirror) {
            return this.cleanContent(this.codeMirror.getValue());
        }
        
        let content = this.visualEditor.innerHTML;
        
        // Convert file:// paths back to relative paths
        const images = this.visualEditor.querySelectorAll('img[data-blog-path]');
        images.forEach(img => {
            const blogPath = img.dataset.blogPath;
            if (blogPath) {
                content = content.replace(img.src, blogPath);
            }
        });
        
        return this.cleanContent(content);
    }

    cleanContent(html) {
        // Remove unwanted styles
        html = html.replace(/white-space:\s*nowrap;?/gi, '');
        html = html.replace(/font-family:\s*-apple-system[^;"]*(;|")/gi, '');
        
        // Add word-break to prevent overflow
        html = html.replace(/<p>/gi, '<p style="word-break: break-word;">');
        html = html.replace(/<div>/gi, '<div style="word-break: break-word;">');
        
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
}

const wysiwygEditor = new WysiwygEditor();