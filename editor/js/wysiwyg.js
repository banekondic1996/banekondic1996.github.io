// WYSIWYG Editor
class WysiwygEditor {
    constructor() {
        this.visualEditor = null;
        this.htmlEditor = null;
        this.mode = 'visual'; // 'visual' or 'html'
        this.initialized = false;
    }

    init() {
        if (this.initialized) return;

        this.visualEditor = document.getElementById('visualEditor');
        this.htmlEditor = document.getElementById('htmlEditor');
        
        if (!this.visualEditor || !this.htmlEditor) return;

        this.setupToolbar();
        this.initialized = true;
    }

    setupToolbar() {
        // Format buttons
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

        // Image button
        const insertImageBtn = document.getElementById('insertImageBtn');
        if (insertImageBtn) {
            insertImageBtn.addEventListener('click', async (e) => {
                e.preventDefault();
                await this.insertImage();
            });
        }

        // View HTML button
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
            
            // Insert image into editor
            const img = document.createElement('img');
            
            // Get blog directory to create proper preview path
            const settings = storageManager.getSettings();
            const fullPath = require('path').join(settings.blogDirectory, imagePath);
            
            // Use file:// protocol for preview in editor
            img.src = 'file://' + fullPath;
            img.dataset.blogPath = imagePath; // Store relative path for saving
            img.alt = file.name;
            
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

    toggleMode() {
        if (this.mode === 'visual') {
            // Switch to HTML mode
            this.htmlEditor.value = this.visualEditor.innerHTML;
            this.visualEditor.style.display = 'none';
            this.htmlEditor.style.display = 'block';
            this.mode = 'html';
        } else {
            // Switch to visual mode
            this.visualEditor.innerHTML = this.htmlEditor.value;
            this.htmlEditor.style.display = 'none';
            this.visualEditor.style.display = 'block';
            this.mode = 'visual';
        }
    }

    getContent() {
        if (this.mode === 'html') {
            return this.htmlEditor.value;
        }
        
        // Get content and fix image paths
        let content = this.visualEditor.innerHTML;
        
        // Convert file:// paths back to relative paths for blog
        const images = this.visualEditor.querySelectorAll('img[data-blog-path]');
        images.forEach(img => {
            const blogPath = img.dataset.blogPath;
            if (blogPath) {
                // Replace the file:// path with the relative path in the content
                content = content.replace(img.src, blogPath);
            }
        });
        
        return content;
    }

    setContent(content) {
        if (this.mode === 'html') {
            this.htmlEditor.value = content;
        } else {
            this.visualEditor.innerHTML = content;
        }
    }

    clear() {
        this.visualEditor.innerHTML = '';
        this.htmlEditor.value = '';
    }
}

const wysiwygEditor = new WysiwygEditor();