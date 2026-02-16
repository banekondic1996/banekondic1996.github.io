// Storage manager for NW.js file operations
class StorageManager {
    constructor() {
        this.fs = require('fs');
        this.path = require('path');
        this.settings = this.loadSettings();
    }

    loadSettings() {
        try {
            const settingsPath = this.path.join(process.cwd(), 'settings.json');
            if (this.fs.existsSync(settingsPath)) {
                const data = this.fs.readFileSync(settingsPath, 'utf8');
                return JSON.parse(data);
            }
        } catch (error) {
            console.error('Error loading settings:', error);
        }
        return { blogDirectory: '' };
    }

    saveSettings(settings) {
        try {
            const settingsPath = this.path.join(process.cwd(), 'settings.json');
            this.fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
            this.settings = settings;
            return true;
        } catch (error) {
            console.error('Error saving settings:', error);
            return false;
        }
    }

    getSettings() {
        return this.settings;
    }

    loadPosts() {
        try {
            if (!this.settings.blogDirectory) return [];

            const postsPath = this.path.join(this.settings.blogDirectory, 'data', 'posts.js');
            
            if (!this.fs.existsSync(postsPath)) {
                this.savePosts([]);
                return [];
            }

            const fileContent = this.fs.readFileSync(postsPath, 'utf8');
            const match = fileContent.match(/const BLOG_POSTS = ({[\s\S]*?});/);
            
            if (match) {
                const jsonData = JSON.parse(match[1]);
                return jsonData.posts || [];
            }
            
            return [];
        } catch (error) {
            console.error('Error loading posts:', error);
            return [];
        }
    }

    savePosts(posts) {
        try {
            if (!this.settings.blogDirectory) {
                throw new Error('Blog directory not set');
            }

            const dataDir = this.path.join(this.settings.blogDirectory, 'data');
            if (!this.fs.existsSync(dataDir)) {
                this.fs.mkdirSync(dataDir, { recursive: true });
            }

            const postsPath = this.path.join(dataDir, 'posts.js');
            const data = { posts: posts };
            const jsContent = `// Blog posts data\nconst BLOG_POSTS = ${JSON.stringify(data, null, 2)};\n`;
            
            this.fs.writeFileSync(postsPath, jsContent);
            return true;
        } catch (error) {
            console.error('Error saving posts:', error);
            return false;
        }
    }

    loadPages() {
        try {
            if (!this.settings.blogDirectory) return { navigation: [], pages: [] };

            const pagesPath = this.path.join(this.settings.blogDirectory, 'data', 'pages.js');
            
            if (!this.fs.existsSync(pagesPath)) {
                this.savePages([], []);
                return { navigation: [], pages: [] };
            }

            const fileContent = this.fs.readFileSync(pagesPath, 'utf8');
            const match = fileContent.match(/const BLOG_PAGES = ({[\s\S]*?});/);
            
            if (match) {
                const jsonData = JSON.parse(match[1]);
                return {
                    navigation: jsonData.navigation || [],
                    pages: jsonData.pages || []
                };
            }
            
            return { navigation: [], pages: [] };
        } catch (error) {
            console.error('Error loading pages:', error);
            return { navigation: [], pages: [] };
        }
    }

    savePages(navigation, pages) {
        try {
            if (!this.settings.blogDirectory) {
                throw new Error('Blog directory not set');
            }

            const dataDir = this.path.join(this.settings.blogDirectory, 'data');
            if (!this.fs.existsSync(dataDir)) {
                this.fs.mkdirSync(dataDir, { recursive: true });
            }

            const pagesPath = this.path.join(dataDir, 'pages.js');
            const data = { navigation, pages };
            const jsContent = `// Blog pages data\nconst BLOG_PAGES = ${JSON.stringify(data, null, 2)};\n`;
            
            this.fs.writeFileSync(pagesPath, jsContent);
            return true;
        } catch (error) {
            console.error('Error saving pages:', error);
            return false;
        }
    }

    chooseDirectory() {
        return new Promise((resolve) => {
            const input = document.createElement('input');
            input.type = 'file';
            input.setAttribute('nwdirectory', '');
            input.addEventListener('change', (e) => {
                if (input.files.length > 0) {
                    resolve(input.files[0].path);
                } else {
                    resolve(null);
                }
            });
            input.click();
        });
    }

    chooseImage() {
        return new Promise((resolve) => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'image/*';
            input.addEventListener('change', (e) => {
                if (input.files.length > 0) {
                    resolve(input.files[0]);
                } else {
                    resolve(null);
                }
            });
            input.click();
        });
    }

    async saveImage(file) {
        try {
            if (!this.settings.blogDirectory) {
                throw new Error('Blog directory not set');
            }

            const imagesDir = this.path.join(this.settings.blogDirectory, 'images');
            if (!this.fs.existsSync(imagesDir)) {
                this.fs.mkdirSync(imagesDir, { recursive: true });
            }

            const fileName = Date.now() + '-' + file.name;
            const destPath = this.path.join(imagesDir, fileName);

            // Read file content
            const reader = new FileReader();
            return new Promise((resolve, reject) => {
                reader.onload = (e) => {
                    const buffer = Buffer.from(e.target.result);
                    this.fs.writeFileSync(destPath, buffer);
                    resolve('images/' + fileName);
                };
                reader.onerror = reject;
                reader.readAsArrayBuffer(file);
            });
        } catch (error) {
            console.error('Error saving image:', error);
            throw error;
        }
    }
}

const storageManager = new StorageManager();