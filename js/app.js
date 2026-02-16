// Main blog application
(function() {
    let allPosts = [];
    let allPages = [];
    let navigation = [];
    let currentView = 'home';
    let selectedCategory = null;

    function init() {
        allPosts = BLOG_POSTS.posts || [];
        allPages = BLOG_PAGES.pages || [];
        navigation = BLOG_PAGES.navigation || [];
        
        blogSearch.setPosts(allPosts);
        setupNavigation();
        setupEventListeners();
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
                
                // Mobile: toggle submenu on click
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

        // Mobile menu toggle
        const mobileMenuToggle = document.getElementById('mobileMenuToggle');
        const navMenu = document.getElementById('navMenu');
        
        if (mobileMenuToggle) {
            mobileMenuToggle.addEventListener('click', () => {
                navMenu.classList.toggle('active');
            });
        }

        // Close mobile menu when clicking outside
        document.addEventListener('click', (e) => {
            if (window.innerWidth <= 768) {
                if (!e.target.closest('.nav-container')) {
                    navMenu.classList.remove('active');
                }
            }
        });

        // Share button
        const shareBtn = document.getElementById('shareBtn');
        if (shareBtn) {
            shareBtn.addEventListener('click', showShareModal);
        }

        // Share modal
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
        } else {
            showHome();
        }
    }

    function showHome() {
        currentView = 'home';
        selectedCategory = null;
        document.getElementById('homeView').style.display = 'block';
        document.getElementById('postView').style.display = 'none';
        document.getElementById('pageView').style.display = 'none';
        
        // Reset to all posts
        blogSearch.setPosts(allPosts);
        const sortedPosts = blogSearch.sortByDate(false);
        blogRenderer.renderPosts(sortedPosts);
        document.title = 'My Blog';
        
        // Close mobile menu
        const navMenu = document.getElementById('navMenu');
        if (navMenu) {
            navMenu.classList.remove('active');
        }
    }

    function showPost(slug) {
        const post = allPosts.find(p => p.slug === slug);
        if (!post) {
            window.location.hash = '';
            return;
        }

        currentView = 'post';
        document.getElementById('homeView').style.display = 'none';
        document.getElementById('postView').style.display = 'block';
        document.getElementById('pageView').style.display = 'none';

        // Render post
        document.getElementById('postTitle').textContent = post.title;
        document.getElementById('postDate').textContent = formatDate(post.date);
        document.getElementById('postAuthor').textContent = post.author ? `By ${post.author}` : '';
        document.title = post.title + ' - My Blog';

        // Render categories
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

        // Handle content - encrypted or plain
        if (post.encrypted && post.encryptedContent) {
            document.getElementById('postContent').style.display = 'none';
            document.getElementById('encryptedNotice').style.display = 'block';
            setupDecryption(post);
        } else {
            document.getElementById('postContent').innerHTML = post.content;
            document.getElementById('postContent').style.display = 'block';
            document.getElementById('encryptedNotice').style.display = 'none';
        }

        window.scrollTo(0, 0);
    }

    function setupDecryption(post) {
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
                const decryptedHtml = await blogCrypto.decrypt(post.encryptedContent, password);
                
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

    function showPage(slug) {
        const page = allPages.find(p => p.slug === slug);
        if (!page) {
            window.location.hash = '';
            return;
        }

        currentView = 'page';
        document.getElementById('homeView').style.display = 'none';
        document.getElementById('postView').style.display = 'none';
        document.getElementById('pageView').style.display = 'block';

        document.getElementById('pageTitle').textContent = page.title;
        document.getElementById('pageContent').innerHTML = page.content;
        document.title = page.title + ' - My Blog';

        window.scrollTo(0, 0);
    }

    function showCategory(category) {
        currentView = 'category';
        selectedCategory = category;
        document.getElementById('homeView').style.display = 'block';
        document.getElementById('postView').style.display = 'none';
        document.getElementById('pageView').style.display = 'none';

        const filteredPosts = allPosts.filter(post => 
            post.categories && post.categories.includes(category)
        );
        
        blogSearch.setPosts(filteredPosts);
        const sortedPosts = blogSearch.sortByDate(false);
        blogRenderer.renderPosts(sortedPosts);
        
        document.title = category + ' - My Blog';
    }

    function performSearch(query) {
        if (selectedCategory) {
            const filteredPosts = allPosts.filter(post => 
                post.categories && post.categories.includes(selectedCategory)
            );
            blogSearch.setPosts(filteredPosts);
        } else {
            blogSearch.setPosts(allPosts);
        }
        
        const results = blogSearch.search(query);
        const sortedResults = blogSearch.sortByDate(false);
        blogRenderer.renderPosts(sortedResults);
    }

    function renderCategories() {
        const categoriesMap = {};
        
        allPosts.forEach(post => {
            if (post.categories) {
                post.categories.forEach(cat => {
                    categoriesMap[cat] = (categoriesMap[cat] || 0) + 1;
                });
            }
        });

        const categoriesList = document.getElementById('categoriesList');
        categoriesList.innerHTML = '';

        // Add "All" category
        const allItem = document.createElement('a');
        allItem.href = '#';
        allItem.className = 'category-item';
        allItem.innerHTML = `
            <span>All Posts</span>
            <span class="category-count">${allPosts.length}</span>
        `;
        categoriesList.appendChild(allItem);

        // Add other categories
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