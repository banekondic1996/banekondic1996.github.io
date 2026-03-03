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
        return { 
            blogDirectory: '',
            siteUrl: '',
            siteTitle: 'My Blog',
            siteDescription: '',
            spellCheckLanguage: 'en_US'
        };
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
                const posts = jsonData.posts || [];

                // Load content for each post
                const postsDir = this.path.join(this.settings.blogDirectory, 'data', 'posts');
                posts.forEach(post => {
                    const contentPath = this.path.join(postsDir, `${post.slug}.js`);
                    if (this.fs.existsSync(contentPath)) {
                        try {
                            const contentFile = this.fs.readFileSync(contentPath, 'utf8');
                            const contentMatch = contentFile.match(/POST_CONTENT = ({[\s\S]*?});/);
                            if (contentMatch) {
                                const contentData = JSON.parse(contentMatch[1]);
                                if (contentData.encrypted && contentData.encryptedContent) {
                                    // Encrypted content
                                    post.encryptedContent = contentData.encryptedContent;
                                    post.content = '';
                                } else {
                                    // Regular content
                                    post.content = contentData.content || '';
                                }
                            }
                        } catch (error) {
                            console.error(`Error loading content for ${post.slug}:`, error);
                            post.content = '';
                        }
                    } else {
                        post.content = '';
                    }
                });

                return posts;
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
            const postsDir = this.path.join(dataDir, 'posts');
            
            if (!this.fs.existsSync(dataDir)) {
                this.fs.mkdirSync(dataDir, { recursive: true });
            }
            if (!this.fs.existsSync(postsDir)) {
                this.fs.mkdirSync(postsDir, { recursive: true });
            }

            // Save metadata only
            const metadata = posts.map(post => ({
                id: post.id,
                slug: post.slug,
                title: post.title,
                author: post.author,
                date: post.date,
                categories: post.categories,
                excerpt: post.excerpt,
                thumbnail: post.thumbnail || '',
                encrypted: post.encrypted
            }));

            const postsPath = this.path.join(dataDir, 'posts.js');
            const data = { posts: metadata };
            const jsContent = `// Blog posts data\nconst BLOG_POSTS = ${JSON.stringify(data, null, 2)};\n`;
            
            this.fs.writeFileSync(postsPath, jsContent);

            // Save individual content files
            posts.forEach(post => {
                const contentPath = this.path.join(postsDir, `${post.slug}.js`);
                
                if (post.encrypted && post.encryptedContent) {
                    // Save encrypted content
                    const contentData = { 
                        encrypted: true,
                        encryptedContent: post.encryptedContent 
                    };
                    const contentJs = `POST_CONTENT = ${JSON.stringify(contentData, null, 2)};\n`;
                    this.fs.writeFileSync(contentPath, contentJs);
                } else if (post.content) {
                    // Save regular content
                    const contentData = { content: post.content };
                    const contentJs = `POST_CONTENT = ${JSON.stringify(contentData, null, 2)};\n`;
                    this.fs.writeFileSync(contentPath, contentJs);
                }
            });

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

    deletePostFile(slug) {
        try {
            if (!this.settings.blogDirectory) {
                return false;
            }

            const postsDir = this.path.join(this.settings.blogDirectory, 'data', 'posts');
            const contentPath = this.path.join(postsDir, `${slug}.js`);
            
            if (this.fs.existsSync(contentPath)) {
                this.fs.unlinkSync(contentPath);
                console.log(`Deleted post file: ${slug}.js`);
                return true;
            }
            
            return false;
        } catch (error) {
            console.error(`Error deleting post file ${slug}:`, error);
            return false;
        }
    }

    generateRssFeed(posts, siteUrl, siteTitle, siteDescription) {
        try {
            if (!this.settings.blogDirectory) {
                throw new Error('Blog directory not set');
            }

            // Filter out Thoughts posts and encrypted posts
            const regularPosts = posts.filter(post => 
                !post.encrypted && 
                (!post.categories || !post.categories.includes('Thoughts'))
            );

            // Sort by date, newest first
            regularPosts.sort((a, b) => new Date(b.date) - new Date(a.date));

            // Take last 20 posts
            const recentPosts = regularPosts.slice(0, 20);

            const now = new Date().toUTCString();

            let rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${this.escapeXml(siteTitle)}</title>
    <link>${this.escapeXml(siteUrl)}</link>
    <description>${this.escapeXml(siteDescription)}</description>
    <language>en-us</language>
    <lastBuildDate>${now}</lastBuildDate>
    <atom:link href="${this.escapeXml(siteUrl)}/rss.xml" rel="self" type="application/rss+xml"/>
`;

            recentPosts.forEach(post => {
                const postUrl = `${siteUrl}#post/${post.slug}`;
                const pubDate = new Date(post.date).toUTCString();

                rss += `    <item>
      <title>${this.escapeXml(post.title)}</title>
      <link>${this.escapeXml(postUrl)}</link>
      <guid>${this.escapeXml(postUrl)}</guid>
      <pubDate>${pubDate}</pubDate>
      <description>${this.escapeXml(post.excerpt)}</description>`;

                if (post.author) {
                    rss += `
      <author>${this.escapeXml(post.author)}</author>`;
                }

                if (post.categories && post.categories.length > 0) {
                    post.categories.forEach(cat => {
                        if (cat !== 'Thoughts') {
                            rss += `
      <category>${this.escapeXml(cat)}</category>`;
                        }
                    });
                }

                rss += `
    </item>
`;
            });

            rss += `  </channel>
</rss>`;

            const rssPath = this.path.join(this.settings.blogDirectory, 'rss.xml');
            this.fs.writeFileSync(rssPath, rss);

            return true;
        } catch (error) {
            console.error('Error generating RSS:', error);
            return false;
        }
    }

    generateSitemap(posts, pages, siteUrl) {
        try {
            if (!this.settings.blogDirectory) {
                throw new Error('Blog directory not set');
            }

            // Filter out encrypted posts
            const publicPosts = posts.filter(post => !post.encrypted);

            let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${this.escapeXml(siteUrl)}</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
`;

            // Add Thoughts page
            sitemap += `  <url>
    <loc>${this.escapeXml(siteUrl)}#thoughts</loc>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
`;

            // Add pages
            pages.forEach(page => {
                sitemap += `  <url>
    <loc>${this.escapeXml(siteUrl)}#page/${page.slug}</loc>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
`;
            });

            // Add posts
            publicPosts.forEach(post => {
                const lastmod = new Date(post.date).toISOString().split('T')[0];
                sitemap += `  <url>
    <loc>${this.escapeXml(siteUrl)}#post/${post.slug}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>
`;
            });

            sitemap += `</urlset>`;

            const sitemapPath = this.path.join(this.settings.blogDirectory, 'sitemap.xml');
            this.fs.writeFileSync(sitemapPath, sitemap);

            return true;
        } catch (error) {
            console.error('Error generating sitemap:', error);
            return false;
        }
    }

    escapeXml(str) {
        if (!str) return '';
        return str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&apos;');
    }
}

const storageManager = new StorageManager();