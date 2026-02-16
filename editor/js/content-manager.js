
// Content manager for posts and pages
class ContentManager {
    constructor() {
        this.posts = [];
        this.pages = [];
        this.navigation = [];
        this.currentItem = null;
        this.currentType = null; // 'post' or 'page'
        this.init();
    }

    init() {
        this.posts = storageManager.loadPosts();
        const pagesData = storageManager.loadPages();
        this.pages = pagesData.pages;
        this.navigation = pagesData.navigation;
    }

    // Posts
    getPosts() {
        return this.posts;
    }

    createPost() {
        const id = Date.now().toString();
        const post = {
            id,
            slug: '',
            title: 'Untitled Post',
            author: '',
            date: new Date().toISOString().split('T')[0],
            categories: [],
            excerpt: '',
            content: ''
        };
        
        this.posts.unshift(post);
        this.currentItem = post;
        this.currentType = 'post';
        return post;
    }

    updatePost(id, updates) {
        const index = this.posts.findIndex(p => p.id === id);
        if (index !== -1) {
            this.posts[index] = { ...this.posts[index], ...updates };
            
            if (!this.posts[index].excerpt && this.posts[index].content) {
                this.posts[index].excerpt = this.generateExcerpt(this.posts[index].content);
            }
            
            return this.posts[index];
        }
        return null;
    }

    deletePost(id) {
        const index = this.posts.findIndex(p => p.id === id);
        if (index !== -1) {
            this.posts.splice(index, 1);
            if (this.currentItem && this.currentItem.id === id) {
                this.currentItem = null;
                this.currentType = null;
            }
            return true;
        }
        return false;
    }

    savePosts() {
        return storageManager.savePosts(this.posts);
    }

    // Pages
    getPages() {
        return this.pages;
    }

    createPage() {
        const id = Date.now().toString();
        const page = {
            id,
            slug: '',
            title: 'Untitled Page',
            content: ''
        };
        
        this.pages.unshift(page);
        this.currentItem = page;
        this.currentType = 'page';
        return page;
    }

    updatePage(id, updates) {
        const index = this.pages.findIndex(p => p.id === id);
        if (index !== -1) {
            this.pages[index] = { ...this.pages[index], ...updates };
            return this.pages[index];
        }
        return null;
    }

    deletePage(id) {
        const index = this.pages.findIndex(p => p.id === id);
        if (index !== -1) {
            const page = this.pages[index];
            this.pages.splice(index, 1);
            
            // Remove from navigation
            this.removeFromNavigation(page.slug);
            
            if (this.currentItem && this.currentItem.id === id) {
                this.currentItem = null;
                this.currentType = null;
            }
            return true;
        }
        return false;
    }

    savePages() {
        return storageManager.savePages(this.navigation, this.pages);
    }

    // Navigation
    getNavigation() {
        return this.navigation;
    }

    addToNavigation(label, link, parentLabel = null) {
        if (parentLabel) {
            const parent = this.navigation.find(n => n.label === parentLabel);
            if (parent) {
                if (!parent.submenu) parent.submenu = [];
                parent.submenu.push({ label, link });
            }
        } else {
            this.navigation.push({ label, link, submenu: [] });
        }
    }

    removeFromNavigation(slug) {
        const link = `#page/${slug}`;
        
        // Remove from main navigation
        this.navigation = this.navigation.filter(n => n.link !== link);
        
        // Remove from submenus
        this.navigation.forEach(n => {
            if (n.submenu) {
                n.submenu = n.submenu.filter(s => s.link !== link);
            }
        });
    }

    // Current item
    setCurrentItem(item, type) {
        this.currentItem = item;
        this.currentType = type;
    }

    getCurrentItem() {
        return this.currentItem;
    }

    getCurrentType() {
        return this.currentType;
    }

    // Helpers
    generateSlug(title) {
        return title
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '');
    }

    generateExcerpt(html) {
        const temp = document.createElement('div');
        temp.innerHTML = html;
        const text = temp.textContent || temp.innerText || '';
        return text.substring(0, 150).trim() + (text.length > 150 ? '...' : '');
    }
}

const contentManager = new ContentManager();