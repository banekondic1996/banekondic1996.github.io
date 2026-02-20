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
        }
    }

    setupToolbar() {
        // Undo/Redo buttons
        const undoBtn = document.getElementById('undoBtn');
        const redoBtn = document.getElementById('redoBtn');
        
        if (undoBtn) {
            undoBtn.addEventListener('click', (e) => {
                e.preventDefault();
                if (this.mode === 'html' && this.codeMirror) {
                    this.codeMirror.undo();
                } else {
                    document.execCommand('undo', false, null);
                }
            });
        }
        
        if (redoBtn) {
            redoBtn.addEventListener('click', (e) => {
                e.preventDefault();
                if (this.mode === 'html' && this.codeMirror) {
                    this.codeMirror.redo();
                } else {
                    document.execCommand('redo', false, null);
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