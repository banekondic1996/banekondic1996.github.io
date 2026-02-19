// Main editor application
class EditorApp {
    constructor() {
        this.init();
        this.author = "";
    }

    init() {
        this.setupEventListeners();
        this.checkSettings();
        this.renderLists();
        wysiwygEditor.init();
    }

    checkSettings() {
        const settings = storageManager.getSettings();
        if (!settings.blogDirectory) {
            this.showSettings();
        }
    }

    setupEventListeners() {
        // Sidebar toggle
        document.getElementById('closeSidebarBtn').addEventListener('click', () => this.toggleSidebar());
        document.getElementById('openSidebarBtn').addEventListener('click', () => this.toggleSidebar());

        // Menu toggle
        const menuBtn = document.getElementById('menuBtn');
        const menuDropdown = document.getElementById('menuDropdown');
        
        menuBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            menuDropdown.classList.toggle('active');
        });

        // Close menu when clicking outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.menu-button-container')) {
                menuDropdown.classList.remove('active');
            }
        });

        // Close menu after clicking menu item
        document.querySelectorAll('.menu-item').forEach(item => {
            item.addEventListener('click', () => {
                menuDropdown.classList.remove('active');
            });
        });

        // Tabs
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.switchTab(e.target.dataset.tab));
        });

        // New buttons
        document.getElementById('newPostBtn').addEventListener('click', () => this.createPost());
        document.getElementById('newPageBtn').addEventListener('click', () => this.createPage());
        document.getElementById('welcomeNewPostBtn').addEventListener('click', () => this.createPost());
        document.getElementById('welcomeNewPageBtn').addEventListener('click', () => this.createPage());

        // Actions
        document.getElementById('saveBtn').addEventListener('click', () => this.showSaveModal());
        document.getElementById('deleteBtn').addEventListener('click', () => this.deleteCurrentItem());
        document.getElementById('previewBtn').addEventListener('click', () => this.showPreview());
        document.getElementById('previewBlogBtn').addEventListener('click', () => this.previewBlog());

        // Settings
        document.getElementById('settingsBtn').addEventListener('click', () => this.showSettings());
        document.getElementById('saveSettingsBtn').addEventListener('click', () => this.saveSettings());
        document.getElementById('closeSettingsBtn').addEventListener('click', () => this.hideSettings());
        document.getElementById('chooseDirBtn').addEventListener('click', () => this.chooseDirectory());

        // Export
        document.getElementById('exportBtn').addEventListener('click', () => this.exportBlog());

        // RSS and Sitemap
        document.getElementById('generateRssBtn').addEventListener('click', () => this.generateRss());
        document.getElementById('generateSitemapBtn').addEventListener('click', () => this.generateSitemap());

        // Save modal
        document.getElementById('confirmSaveBtn').addEventListener('click', () => this.saveCurrentItem());
        document.getElementById('cancelSaveBtn').addEventListener('click', () => this.hideSaveModal());
        document.getElementById('navSelect').addEventListener('change', (e) => {
            const submenuField = document.getElementById('submenuField');
            if (e.target.value === 'main') {
                this.populateParentNav();
                submenuField.style.display = 'block';
            } else {
                submenuField.style.display = 'none';
            }
        });

        // Encryption checkbox
        document.getElementById('encryptCheckbox').addEventListener('change', (e) => {
            const passwordField = document.getElementById('encryptPasswordField');
            passwordField.style.display = e.target.checked ? 'block' : 'none';
        });

        // Preview modal
        document.getElementById('closePreviewBtn').addEventListener('click', () => this.hidePreview());
    }

    toggleSidebar() {
        const sidebar = document.getElementById('sidebar');
        const openBtn = document.getElementById('openSidebarBtn');
        
        sidebar.classList.toggle('collapsed');
        openBtn.style.display = sidebar.classList.contains('collapsed') ? 'flex' : 'none';
    }

    switchTab(tab) {
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tab);
        });
        
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.toggle('active', content.id === tab + 'Tab');
        });
    }

    renderLists() {
        this.renderPostsList();
        this.renderPagesList();
    }

    renderPostsList() {
        const container = document.getElementById('postsList');
        const posts = contentManager.getPosts();

        container.innerHTML = '';
        
        if (posts.length === 0) {
            container.innerHTML = '<p style="padding: 1rem; text-align: center; color: var(--text-light);">No posts yet</p>';
            return;
        }

        posts.forEach(post => {
            const item = document.createElement('div');
            item.className = 'list-item';
            if (contentManager.getCurrentItem() && contentManager.getCurrentItem().id === post.id) {
                item.classList.add('active');
            }

            const categories = post.categories && post.categories.length > 0 
                ? ' • ' + post.categories.join(', ')
                : '';

            const encrypted = post.encrypted ? ' 🔒' : '';

            item.innerHTML = `
                <div class="list-item-title">${post.title || 'Untitled'}${encrypted}</div>
                <div class="list-item-meta">${this.formatDate(post.date)}${categories}</div>
            `;

            item.addEventListener('click', () => this.loadPost(post));
            container.appendChild(item);
        });
    }

    renderPagesList() {
        const container = document.getElementById('pagesList');
        const pages = contentManager.getPages();

        container.innerHTML = '';
        
        if (pages.length === 0) {
            container.innerHTML = '<p style="padding: 1rem; text-align: center; color: var(--text-light);">No pages yet</p>';
            return;
        }

        pages.forEach(page => {
            const item = document.createElement('div');
            item.className = 'list-item';
            if (contentManager.getCurrentItem() && contentManager.getCurrentItem().id === page.id) {
                item.classList.add('active');
            }

            item.innerHTML = `
                <div class="list-item-title">${page.title || 'Untitled'}</div>
                <div class="list-item-meta">Page</div>
            `;

            item.addEventListener('click', () => this.loadPage(page));
            container.appendChild(item);
        });
    }

    createPost() {
        const post = contentManager.createPost();
        this.loadPost(post);
        this.renderPostsList();
    }

    createPage() {
        const page = contentManager.createPage();
        this.loadPage(page);
        this.renderPagesList();
    }

    async loadPost(post) {
        contentManager.setCurrentItem(post, 'post');
        
        document.getElementById('welcomeScreen').style.display = 'none';
        document.getElementById('editorScreen').style.display = 'flex';

        document.getElementById('contentTitle').value = post.title;
        
        // Handle encrypted posts
        if (post.encrypted && post.encryptedContent) {
            const password = prompt('Enter password to decrypt this post:');
            if (password) {
                try {
                    const decrypted = await editorCrypto.decrypt(post.encryptedContent, password);
                    wysiwygEditor.setContent(decrypted);
                } catch (error) {
                    alert('Incorrect password!');
                    wysiwygEditor.setContent('<p><em>Failed to decrypt. Incorrect password.</em></p>');
                }
            } else {
                wysiwygEditor.setContent('<p><em>Encrypted content. Enter password to edit.</em></p>');
            }
        } else {
            wysiwygEditor.setContent(post.content || '');
        }

        this.renderPostsList();
    }

    loadPage(page) {
        contentManager.setCurrentItem(page, 'page');
        
        document.getElementById('welcomeScreen').style.display = 'none';
        document.getElementById('editorScreen').style.display = 'flex';

        document.getElementById('contentTitle').value = page.title;
        wysiwygEditor.setContent(page.content || '');

        this.renderPagesList();
    }

    showSaveModal() {
        const currentItem = contentManager.getCurrentItem();
        const currentType = contentManager.getCurrentType();
        
        if (!currentItem) return;

        const modal = document.getElementById('saveModal');
        const title = document.getElementById('saveModalTitle');
        const postFields = document.getElementById('postFields');
        const navFields = document.getElementById('navFields');

        title.textContent = currentType === 'post' ? 'Save Post' : 'Save Page';
        postFields.style.display = currentType === 'post' ? 'block' : 'none';
        navFields.style.display = currentType === 'page' ? 'block' : 'none';

        // Auto-generate slug from title if not set
        const currentTitle = document.getElementById('contentTitle').value.trim();
        const autoSlug = contentManager.generateSlug(currentTitle);
        document.getElementById('slugInput').value = currentItem.slug || autoSlug;
        document.getElementById('slugInput').dataset.auto = currentItem.slug ? 'false' : 'true';

        if (currentType === 'post') {
            // Autofill author from last used or current item
            const lastAuthor = this.author || '';
            document.getElementById('authorInput').value = currentItem.author || lastAuthor;
            
            document.getElementById('dateInput').value = currentItem.date || new Date().toISOString().split('T')[0];
            document.getElementById('categoriesInput').value = currentItem.categories ? currentItem.categories.join(', ') : '';
            document.getElementById('thumbnailInput').value = currentItem.thumbnail || '';
            document.getElementById('encryptCheckbox').checked = currentItem.encrypted || false;
            document.getElementById('encryptPasswordField').style.display = currentItem.encrypted ? 'block' : 'none';
        }

        modal.classList.add('active');
    }

    hideSaveModal() {
        document.getElementById('saveModal').classList.remove('active');
    }

    async saveCurrentItem() {
        const currentItem = contentManager.getCurrentItem();
        const currentType = contentManager.getCurrentType();
        
        if (!currentItem) return;

        const title = document.getElementById('contentTitle').value.trim();
        const content = wysiwygEditor.getContent();
        const slug = document.getElementById('slugInput').value.trim();

        if (!title) {
            this.showNotification('Please enter a title', 'error');
            return;
        }

        if (!slug) {
            this.showNotification('Please enter a slug', 'error');
            return;
        }

        const itemData = { title, slug };

        if (currentType === 'post') {
            this.author = document.getElementById('authorInput').value.trim();
            itemData.author = this.author;
            
            itemData.date = document.getElementById('dateInput').value;
            
            const categoriesInput = document.getElementById('categoriesInput').value.trim();
            itemData.categories = categoriesInput ? categoriesInput.split(',').map(c => c.trim()) : [];
            
            const thumbnail = document.getElementById('thumbnailInput').value.trim();
            itemData.thumbnail = thumbnail || '';

            const shouldEncrypt = document.getElementById('encryptCheckbox').checked;
            
            if (shouldEncrypt) {
                const password = document.getElementById('encryptPasswordInput').value;
                if (!password) {
                    this.showNotification('Please enter encryption password', 'error');
                    return;
                }
                
                try {
                    const encrypted = await editorCrypto.encrypt(content, password);
                    itemData.encrypted = true;
                    itemData.encryptedContent = encrypted;
                    itemData.content = ''; // Clear plain content
                } catch (error) {
                    this.showNotification('Encryption failed', 'error');
                    return;
                }
            } else {
                itemData.encrypted = false;
                itemData.content = content;
                itemData.encryptedContent = null;
            }

            contentManager.updatePost(currentItem.id, itemData);
            const saved = contentManager.savePosts();
            
            if (saved) {
                this.showNotification('Post saved successfully', 'success');
                this.hideSaveModal();
                this.renderPostsList();
            } else {
                this.showNotification('Failed to save post', 'error');
            }
        } else {
            itemData.content = content;
            
            const navSelect = document.getElementById('navSelect').value;
            
            if (navSelect === 'main') {
                const parentNav = document.getElementById('parentNavSelect').value;
                contentManager.removeFromNavigation(slug);
                contentManager.addToNavigation(title, `#page/${slug}`, parentNav || null);
            }

            contentManager.updatePage(currentItem.id, itemData);
            const saved = contentManager.savePages();
            
            if (saved) {
                this.showNotification('Page saved successfully', 'success');
                this.hideSaveModal();
                this.renderPagesList();
            } else {
                this.showNotification('Failed to save page', 'error');
            }
        }
    }

    deleteCurrentItem() {
        const currentItem = contentManager.getCurrentItem();
        const currentType = contentManager.getCurrentType();
        
        if (!currentItem) return;

        const itemType = currentType === 'post' ? 'post' : 'page';
        
        if (!confirm(`Are you sure you want to delete this ${itemType}?`)) return;

        let deleted = false;
        
        if (currentType === 'post') {
            deleted = contentManager.deletePost(currentItem.id);
            if (deleted) contentManager.savePosts();
        } else {
            deleted = contentManager.deletePage(currentItem.id);
            if (deleted) contentManager.savePages();
        }

        if (deleted) {
            this.showNotification(`${itemType.charAt(0).toUpperCase() + itemType.slice(1)} deleted`, 'success');
            document.getElementById('editorScreen').style.display = 'none';
            document.getElementById('welcomeScreen').style.display = 'flex';
            this.renderLists();
        }
    }

    showPreview() {
        const title = document.getElementById('contentTitle').value;
        const content = wysiwygEditor.getContent();
        
        // Fix image paths for preview
        const fixedContent = content.replace(/src="images\//g, 'src="../blog/images/');

        const previewContainer = document.getElementById('previewContainer');
        previewContainer.innerHTML = `
            <h1>${title}</h1>
            <div class="post-content">${fixedContent}</div>
        `;

        document.getElementById('previewModal').classList.add('active');
    }

    previewBlog() {
        const settings = storageManager.getSettings();
        if (!settings.blogDirectory) {
            alert('Please set blog directory in settings first');
            return;
        }

        const indexPath = require('path').join(settings.blogDirectory, 'index.html');
        require('nw.gui').Shell.openExternal('file://' + indexPath);
    }

    hidePreview() {
        document.getElementById('previewModal').classList.remove('active');
    }

    showSettings() {
        const settings = storageManager.getSettings();
        document.getElementById('blogDirectory').value = settings.blogDirectory || '';
        document.getElementById('siteUrl').value = settings.siteUrl || '';
        document.getElementById('siteTitle').value = settings.siteTitle || 'My Blog';
        document.getElementById('siteDescription').value = settings.siteDescription || '';
        document.getElementById('settingsModal').classList.add('active');
    }

    hideSettings() {
        document.getElementById('settingsModal').classList.remove('active');
    }

    saveSettings() {
        const blogDirectory = document.getElementById('blogDirectory').value;
        const siteUrl = document.getElementById('siteUrl').value.trim();
        const siteTitle = document.getElementById('siteTitle').value.trim() || 'My Blog';
        const siteDescription = document.getElementById('siteDescription').value.trim();
        
        const saved = storageManager.saveSettings({ 
            blogDirectory, 
            siteUrl, 
            siteTitle, 
            siteDescription 
        });
        
        if (saved) {
            this.showNotification('Settings saved', 'success');
            this.hideSettings();
            contentManager.init();
            this.renderLists();
        } else {
            this.showNotification('Failed to save settings', 'error');
        }
    }

    async chooseDirectory() {
        const dir = await storageManager.chooseDirectory();
        if (dir) {
            document.getElementById('blogDirectory').value = dir;
        }
    }

    populateParentNav() {
        const select = document.getElementById('parentNavSelect');
        const navigation = contentManager.getNavigation();
        
        select.innerHTML = '<option value="">Top level</option>';
        
        navigation.forEach(nav => {
            if (!nav.link.startsWith('#page/')) {
                const option = document.createElement('option');
                option.value = nav.label;
                option.textContent = nav.label;
                select.appendChild(option);
            }
        });
    }

    exportBlog() {
        this.showNotification('Blog exported! All files are in your blog directory.', 'success');
    }

    generateRss() {
        const settings = storageManager.getSettings();
        
        if (!settings.siteUrl) {
            this.showNotification('Please set Site URL in Settings first', 'error');
            this.showSettings();
            return;
        }

        const posts = contentManager.getPosts();
        const success = storageManager.generateRssFeed(
            posts,
            settings.siteUrl,
            settings.siteTitle || 'My Blog',
            settings.siteDescription || 'My Blog Description'
        );

        if (success) {
            this.showNotification('RSS feed generated successfully! (rss.xml)', 'success');
        } else {
            this.showNotification('Failed to generate RSS feed', 'error');
        }
    }

    generateSitemap() {
        const settings = storageManager.getSettings();
        
        if (!settings.siteUrl) {
            this.showNotification('Please set Site URL in Settings first', 'error');
            this.showSettings();
            return;
        }

        const posts = contentManager.getPosts();
        const pages = contentManager.getPages();
        const success = storageManager.generateSitemap(posts, pages, settings.siteUrl);

        if (success) {
            this.showNotification('Sitemap generated successfully! (sitemap.xml)', 'success');
        } else {
            this.showNotification('Failed to generate sitemap', 'error');
        }
    }

    showNotification(message, type = 'success') {
        const notification = document.getElementById('notification');
        notification.textContent = message;
        notification.className = `notification ${type} show`;

        setTimeout(() => {
            notification.classList.remove('show');
        }, 3000);
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        const options = { year: 'numeric', month: 'short', day: 'numeric' };
        return date.toLocaleDateString('en-US', options);
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => new EditorApp());
} else {
    new EditorApp();
}