// Main blog application
(function() {
    let allPosts = [];
    let displayedPosts = [];
    let allPages = [];
    let navigation = [];
    let currentView = 'home';
    let previousView = 'home'; // Track where we came from
    let selectedCategory = null;
    let isThoughtsView = false;
    let postsPerPage = 10;
    let currentPage = 0;
    let isLoading = false;

    function init() {
        allPosts = BLOG_POSTS.posts || [];
        allPages = BLOG_PAGES.pages || [];
        navigation = BLOG_PAGES.navigation || [];
        
        // Filter out Thoughts posts from regular view
        const regularPosts = allPosts.filter(post => 
            !post.categories || !post.categories.includes('Thoughts')
        );
        blogSearch.setPosts(regularPosts);
        
        setupNavigation();
        setupEventListeners();
        setupLazyLoading();
        handleRoute();
        renderCategories();
        
        window.addEventListener('hashchange', handleRoute);
    }

    function setupNavigation() {
        const navMenu = document.getElementById('navMenu');
        navMenu.innerHTML = '';
        
        navigation.forEach(item => {
            const navItem = document.createElement('div');
            navItem.className = 'nav-item';
            
            const link = document.createElement('a');
            link.href = item.link;
            link.className = 'nav-link';
            link.textContent = item.label;
            navItem.appendChild(link);
            
            if (item.submenu && item.submenu.length > 0) {
                const dropdown = document.createElement('div');
                dropdown.className = 'nav-dropdown';
                
                item.submenu.forEach(subitem => {
                    const sublink = document.createElement('a');
                    sublink.href = subitem.link;
                    sublink.className = 'nav-link';
                    sublink.textContent = subitem.label;
                    dropdown.appendChild(sublink);
                });
                
                navItem.appendChild(dropdown);
                
                link.addEventListener('click', (e) => {
                    if (window.innerWidth <= 768 && item.submenu.length > 0) {
                        e.preventDefault();
                        navItem.classList.toggle('active');
                    }
                });
            }
            
            navMenu.appendChild(navItem);
        });
    }

    function setupEventListeners() {
        const searchInput = document.getElementById('searchInput');
        let searchTimeout;
        
        searchInput.addEventListener('input', () => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                performSearch(searchInput.value);
            }, 300);
        });

        const mobileMenuToggle = document.getElementById('mobileMenuToggle');
        const navMenu = document.getElementById('navMenu');
        
        if (mobileMenuToggle) {
            mobileMenuToggle.addEventListener('click', () => {
                navMenu.classList.toggle('active');
            });
        }

        document.addEventListener('click', (e) => {
            if (window.innerWidth <= 768) {
                if (!e.target.closest('.nav-container')) {
                    navMenu.classList.remove('active');
                }
            }
        });

        const shareBtn = document.getElementById('shareBtn');
        if (shareBtn) {
            shareBtn.addEventListener('click', showShareModal);
        }

        // Back button handler
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('back-link') || e.target.closest('.back-link')) {
                e.preventDefault();
                goBack();
            }
        });

        const closeShareModal = document.getElementById('closeShareModal');
        const copyLinkBtn = document.getElementById('copyLinkBtn');
        
        if (closeShareModal) {
            closeShareModal.addEventListener('click', () => {
                document.getElementById('shareModal').classList.remove('active');
            });
        }
        
        if (copyLinkBtn) {
            copyLinkBtn.addEventListener('click', copyShareLink);
        }
    }

    function setupLazyLoading() {
        const postsContainer = document.getElementById('postsContainer');
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && !isLoading) {
                    loadMorePosts();
                }
            });
        }, {
            rootMargin: '100px'
        });

        const sentinel = document.createElement('div');
        sentinel.id = 'loadMoreSentinel';
        sentinel.style.height = '1px';
        postsContainer.parentElement.appendChild(sentinel);
        observer.observe(sentinel);
    }

    function loadMorePosts() {
        const posts = blogSearch.getFilteredPosts();
        const start = currentPage * postsPerPage;
        const end = start + postsPerPage;
        const newPosts = posts.slice(start, end);

        if (newPosts.length === 0) return;

        isLoading = true;
        blogRenderer.appendPosts(newPosts);
        displayedPosts.push(...newPosts);
        currentPage++;
        isLoading = false;
    }

    function handleRoute() {
        const hash = window.location.hash;
        
        if (hash.startsWith('#post/')) {
            const slug = hash.replace('#post/', '');
            showPost(slug);
        } else if (hash.startsWith('#page/')) {
            const slug = hash.replace('#page/', '');
            showPage(slug);
        } else if (hash.startsWith('#category/')) {
            const category = decodeURIComponent(hash.replace('#category/', ''));
            showCategory(category);
        } else if (hash === '#thoughts') {
            showThoughts();
        } else if (hash === '#back') {
            // Handle back navigation
            goBack();
        } else {
            showHome();
        }
    }

    function goBack() {
        if (previousView === 'thoughts') {
            window.location.hash = '#thoughts';
        } else if (previousView === 'category' && selectedCategory) {
            window.location.hash = `#category/${encodeURIComponent(selectedCategory)}`;
        } else {
            window.location.hash = '';
        }
    }

    function showHome() {
        previousView = 'home';
        currentView = 'home';
        selectedCategory = null;
        isThoughtsView = false;
        
        // Clear post content
        document.getElementById('postContent').innerHTML = '';
        document.getElementById('encryptedNotice').style.display = 'none';
        
        document.getElementById('homeView').style.display = 'block';
        document.getElementById('postView').style.display = 'none';
        document.getElementById('pageView').style.display = 'none';
        
        // Filter out Thoughts posts
        const regularPosts = allPosts.filter(post => 
            !post.categories || !post.categories.includes('Thoughts')
        );
        
        blogSearch.setPosts(regularPosts);
        currentPage = 0;
        displayedPosts = [];
        blogRenderer.clearPosts();
        
        const sortedPosts = blogSearch.sortByDate(false);
        loadMorePosts();
        
        document.title = 'My Blog';
        
        const navMenu = document.getElementById('navMenu');
        if (navMenu) {
            navMenu.classList.remove('active');
        }
        
        window.scrollTo(0, 0);
    }

    function showThoughts() {
        previousView = 'thoughts';
        currentView = 'thoughts';
        selectedCategory = null;
        isThoughtsView = true;
        
        // Clear post content
        document.getElementById('postContent').innerHTML = '';
        document.getElementById('encryptedNotice').style.display = 'none';
        
        document.getElementById('homeView').style.display = 'block';
        document.getElementById('postView').style.display = 'none';
        document.getElementById('pageView').style.display = 'none';
        
        // Only show posts with Thoughts category
        const thoughtsPosts = allPosts.filter(post => 
            post.categories && post.categories.includes('Thoughts')
        );
        
        blogSearch.setPosts(thoughtsPosts);
        currentPage = 0;
        displayedPosts = [];
        blogRenderer.clearPosts();
        
        const sortedPosts = blogSearch.sortByDate(false);
        loadMorePosts();
        
        document.title = 'Thoughts - My Blog';
        
        const navMenu = document.getElementById('navMenu');
        if (navMenu) {
            navMenu.classList.remove('active');
        }
        
        window.scrollTo(0, 0);
    }

    async function showPost(slug) {
        const post = allPosts.find(p => p.slug === slug);
        if (!post) {
            window.location.hash = '';
            return;
        }

        currentView = 'post';
        document.getElementById('homeView').style.display = 'none';
        document.getElementById('postView').style.display = 'block';
        document.getElementById('pageView').style.display = 'none';

        // Clear previous content immediately
        document.getElementById('postContent').innerHTML = '';
        document.getElementById('postContent').style.display = 'none';
        document.getElementById('encryptedNotice').style.display = 'none';

        document.getElementById('postTitle').textContent = post.title;
        document.getElementById('postDate').textContent = formatDate(post.date);
        document.getElementById('postAuthor').textContent = post.author ? `By ${post.author}` : '';
        document.title = post.title + ' - My Blog';

        const categoriesEl = document.getElementById('postCategories');
        categoriesEl.innerHTML = '';
        if (post.categories && post.categories.length > 0) {
            post.categories.forEach(cat => {
                const badge = document.createElement('span');
                badge.className = 'category-badge';
                badge.textContent = cat;
                categoriesEl.appendChild(badge);
            });
        }

        // Load content dynamically
        try {
            await loadPostContent(post.slug);
            
            // Check if content is encrypted
            if (window.POST_CONTENT && window.POST_CONTENT.encrypted && window.POST_CONTENT.encryptedContent) {
                document.getElementById('postContent').style.display = 'none';
                document.getElementById('encryptedNotice').style.display = 'block';
                setupDecryption(window.POST_CONTENT.encryptedContent);
            } else if (window.POST_CONTENT && window.POST_CONTENT.content) {
                document.getElementById('postContent').innerHTML = window.POST_CONTENT.content;
                document.getElementById('postContent').style.display = 'block';
            }
            
            delete window.POST_CONTENT;
        } catch (error) {
            document.getElementById('postContent').innerHTML = '<p>Error loading post content.</p>';
            document.getElementById('postContent').style.display = 'block';
        }

        window.scrollTo(0, 0);
    }

    async function loadPostContent(slug) {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = `data/posts/${slug}.js`;
            script.onload = () => {
                if (window.POST_CONTENT) {
                    resolve();
                } else {
                    reject(new Error('Content not found'));
                }
            };
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    function setupDecryption(encryptedContent) {
        const unlockBtn = document.getElementById('unlockBtn');
        const modal = document.getElementById('decryptModal');
        const decryptBtn = document.getElementById('decryptBtn');
        const cancelBtn = document.getElementById('cancelDecryptBtn');
        const passwordInput = document.getElementById('decryptPassword');
        const errorEl = document.getElementById('decryptError');

        unlockBtn.onclick = () => {
            modal.classList.add('active');
            passwordInput.value = '';
            errorEl.textContent = '';
            passwordInput.focus();
        };

        cancelBtn.onclick = () => {
            modal.classList.remove('active');
        };

        modal.onclick = (e) => {
            if (e.target === modal) {
                modal.classList.remove('active');
            }
        };

        decryptBtn.onclick = async () => {
            const password = passwordInput.value;
            
            if (!password) {
                errorEl.textContent = 'Please enter a password';
                return;
            }

            decryptBtn.disabled = true;
            decryptBtn.textContent = 'Decrypting...';
            errorEl.textContent = '';

            try {
                const decryptedHtml = await blogCrypto.decrypt(encryptedContent, password);
                
                modal.classList.remove('active');
                document.getElementById('encryptedNotice').style.display = 'none';
                document.getElementById('postContent').innerHTML = decryptedHtml;
                document.getElementById('postContent').style.display = 'block';
                
            } catch (error) {
                errorEl.textContent = 'Incorrect password. Please try again.';
            } finally {
                decryptBtn.disabled = false;
                decryptBtn.textContent = 'Decrypt';
            }
        };

        passwordInput.onkeyup = (e) => {
            if (e.key === 'Enter') {
                decryptBtn.click();
            }
        };
    }

    function setupSocialShare() {
        const shareTwitterBtn = document.getElementById('shareTwitterBtn');
        const shareFacebookBtn = document.getElementById('shareFacebookBtn');
        const shareLinkedInBtn = document.getElementById('shareLinkedInBtn');
        const shareRedditBtn = document.getElementById('shareRedditBtn');
        
        const url = window.location.href;
        const title = document.getElementById('postTitle').textContent;
        
        if (shareTwitterBtn) {
            shareTwitterBtn.onclick = () => {
                window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`, '_blank');
            };
        }
        
        if (shareFacebookBtn) {
            shareFacebookBtn.onclick = () => {
                window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank');
            };
        }
        
        if (shareLinkedInBtn) {
            shareLinkedInBtn.onclick = () => {
                window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`, '_blank');
            };
        }
        
        if (shareRedditBtn) {
            shareRedditBtn.onclick = () => {
                window.open(`https://reddit.com/submit?url=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}`, '_blank');
            };
        }
    }

    function showPage(slug) {
        const page = allPages.find(p => p.slug === slug);
        if (!page) {
            window.location.hash = '';
            return;
        }

        currentView = 'page';
        
        // Clear post content
        document.getElementById('postContent').innerHTML = '';
        document.getElementById('encryptedNotice').style.display = 'none';
        
        document.getElementById('homeView').style.display = 'none';
        document.getElementById('postView').style.display = 'none';
        document.getElementById('pageView').style.display = 'block';

        document.getElementById('pageTitle').textContent = page.title;
        document.getElementById('pageContent').innerHTML = page.content;
        document.title = page.title + ' - My Blog';

        window.scrollTo(0, 0);
    }

    function showCategory(category) {
        previousView = 'category';
        currentView = 'category';
        selectedCategory = category;
        isThoughtsView = false;
        
        // Clear post content
        document.getElementById('postContent').innerHTML = '';
        document.getElementById('encryptedNotice').style.display = 'none';
        
        document.getElementById('homeView').style.display = 'block';
        document.getElementById('postView').style.display = 'none';
        document.getElementById('pageView').style.display = 'none';

        // Filter by category, excluding Thoughts posts
        let filteredPosts = allPosts.filter(post => {
            const hasCategory = post.categories && post.categories.includes(category);
            const isThought = post.categories && post.categories.includes('Thoughts');
            return hasCategory && !isThought;
        });
        
        blogSearch.setPosts(filteredPosts);
        currentPage = 0;
        displayedPosts = [];
        blogRenderer.clearPosts();
        
        const sortedPosts = blogSearch.sortByDate(false);
        loadMorePosts();
        
        document.title = category + ' - My Blog';
        
        window.scrollTo(0, 0);
    }

    function performSearch(query) {
        let posts;
        if (isThoughtsView) {
            posts = allPosts.filter(post => 
                post.categories && post.categories.includes('Thoughts')
            );
        } else {
            posts = allPosts.filter(post => 
                !post.categories || !post.categories.includes('Thoughts')
            );
        }
        
        if (selectedCategory) {
            posts = posts.filter(post => 
                post.categories && post.categories.includes(selectedCategory)
            );
        }
        
        blogSearch.setPosts(posts);
        const results = blogSearch.search(query);
        currentPage = 0;
        displayedPosts = [];
        blogRenderer.clearPosts();
        
        const sortedResults = blogSearch.sortByDate(false);
        loadMorePosts();
    }

    function renderCategories() {
        const categoriesMap = {};
        
        // Only count non-Thoughts posts
        allPosts.forEach(post => {
            if (post.categories) {
                post.categories.forEach(cat => {
                    if (cat !== 'Thoughts') {
                        categoriesMap[cat] = (categoriesMap[cat] || 0) + 1;
                    }
                });
            }
        });

        const categoriesList = document.getElementById('categoriesList');
        categoriesList.innerHTML = '';

        const regularPostsCount = allPosts.filter(post => 
            !post.categories || !post.categories.includes('Thoughts')
        ).length;

        const allItem = document.createElement('a');
        allItem.href = '#';
        allItem.className = 'category-item';
        allItem.innerHTML = `
            <span>All Posts</span>
            <span class="category-count">${regularPostsCount}</span>
        `;
        categoriesList.appendChild(allItem);

        Object.keys(categoriesMap).sort().forEach(category => {
            const item = document.createElement('a');
            item.href = `#category/${encodeURIComponent(category)}`;
            item.className = 'category-item';
            item.innerHTML = `
                <span>${category}</span>
                <span class="category-count">${categoriesMap[category]}</span>
            `;
            categoriesList.appendChild(item);
        });
    }

    function showShareModal() {
        const modal = document.getElementById('shareModal');
        const shareLink = document.getElementById('shareLink');
        shareLink.value = window.location.href;
        modal.classList.add('active');
        setupSocialShare();
    }

    function copyShareLink() {
        const shareLink = document.getElementById('shareLink');
        shareLink.select();
        document.execCommand('copy');
        
        const message = document.getElementById('copyMessage');
        message.textContent = 'Link copied to clipboard!';
        
        setTimeout(() => {
            message.textContent = '';
        }, 2000);
    }

    function formatDate(dateString) {
        const date = new Date(dateString);
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        return date.toLocaleDateString('en-US', options);
    }

    init();
})();