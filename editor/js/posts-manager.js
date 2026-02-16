// Posts manager for CRUD operations
class PostsManager {
    constructor() {
        this.posts = [];
        this.currentPost = null;
        this.init();
    }

    init() {
        this.posts = storageManager.loadPosts();
    }

    getAllPosts() {
        return this.posts;
    }

    getPostById(id) {
        return this.posts.find(post => post.id === id);
    }

    createPost() {
        const id = Date.now().toString();
        const post = {
            id: id,
            slug: '',
            title: 'Untitled Post',
            author: '',
            date: new Date().toISOString().split('T')[0],
            excerpt: '',
            content: '',
            encrypted: false
        };
        
        this.posts.unshift(post);
        this.currentPost = post;
        return post;
    }

    updatePost(id, updates) {
        const index = this.posts.findIndex(post => post.id === id);
        if (index !== -1) {
            this.posts[index] = { ...this.posts[index], ...updates };
            
            // Generate excerpt from content if not encrypted
            if (!this.posts[index].encrypted && this.posts[index].content) {
                this.posts[index].excerpt = this.generateExcerpt(this.posts[index].content);
            } else if (this.posts[index].encrypted) {
                this.posts[index].excerpt = 'This content is encrypted.';
            }
            
            return this.posts[index];
        }
        return null;
    }

    deletePost(id) {
        const index = this.posts.findIndex(post => post.id === id);
        if (index !== -1) {
            this.posts.splice(index, 1);
            
            if (this.currentPost && this.currentPost.id === id) {
                this.currentPost = null;
            }
            
            return true;
        }
        return false;
    }

    savePosts() {
        return storageManager.savePosts(this.posts);
    }

    saveCurrentPost(postData) {
        if (!this.currentPost) return false;

        const updated = this.updatePost(this.currentPost.id, postData);
        if (updated) {
            return this.savePosts();
        }
        return false;
    }

    setCurrentPost(post) {
        this.currentPost = post;
    }

    getCurrentPost() {
        return this.currentPost;
    }

    generateSlug(title) {
        return title
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '');
    }

    generateExcerpt(html) {
        // Strip HTML tags
        const temp = document.createElement('div');
        temp.innerHTML = html;
        const text = temp.textContent || temp.innerText || '';
        
        // Get first 150 characters
        return text.substring(0, 150).trim() + (text.length > 150 ? '...' : '');
    }

    async encryptPostContent(content, password) {
        try {
            const encryptedData = await editorCrypto.encrypt(content, password);
            return encryptedData;
        } catch (error) {
            console.error('Encryption failed:', error);
            throw error;
        }
    }
}

const postsManager = new PostsManager();