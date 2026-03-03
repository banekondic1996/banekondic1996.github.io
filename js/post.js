// Individual post page logic
(async function() {
    let currentPost = null;
    let encryptedData = null;

    // Get post slug from URL
    function getPostSlug() {
        const path = window.location.pathname;
        const filename = path.split('/').pop();
        return filename.replace('.html', '');
    }

    // Load post data
    async function loadPost(slug) {
        try {
            const response = await fetch('../data/posts.json');
            if (!response.ok) {
                throw new Error('Failed to load post');
            }
            const data = await response.json();
            const post = data.posts.find(p => p.slug === slug);
            
            if (!post) {
                throw new Error('Post not found');
            }
            
            return post;
        } catch (error) {
            console.error('Error loading post:', error);
            return null;
        }
    }

    // Format date
    function formatDate(dateString) {
        const date = new Date(dateString);
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        return date.toLocaleDateString('en-US', options);
    }

    // Display post
    function displayPost(post) {
        currentPost = post;

        // Set title
        document.title = post.title;
        document.getElementById('postTitle').textContent = post.title;
        document.getElementById('postTitleDisplay').textContent = post.title;
        
        // Set date
        document.getElementById('postDate').textContent = formatDate(post.date);
        
        // Set author
        if (post.author) {
            document.getElementById('postAuthor').textContent = `By ${post.author}`;
        }

        // Handle content
        if (post.encrypted && post.encryptedContent) {
            // Show encrypted notice
            document.getElementById('postContent').style.display = 'none';
            document.getElementById('encryptedContent').style.display = 'block';
            encryptedData = post.encryptedContent;
        } else {
            // Show regular content
            document.getElementById('postContent').innerHTML = post.content;
            document.getElementById('postContent').style.display = 'block';
            document.getElementById('encryptedContent').style.display = 'none';
        }
    }

    // Modal handling
    const modal = document.getElementById('decryptModal');
    const showDecryptBtn = document.getElementById('showDecryptBtn');
    const decryptBtn = document.getElementById('decryptBtn');
    const cancelDecryptBtn = document.getElementById('cancelDecryptBtn');
    const decryptPassword = document.getElementById('decryptPassword');
    const decryptError = document.getElementById('decryptError');

    function showModal() {
        modal.classList.add('active');
        decryptPassword.value = '';
        decryptError.textContent = '';
        decryptPassword.focus();
    }

    function hideModal() {
        modal.classList.remove('active');
    }

    if (showDecryptBtn) {
        showDecryptBtn.addEventListener('click', showModal);
    }

    if (cancelDecryptBtn) {
        cancelDecryptBtn.addEventListener('click', hideModal);
    }

    // Close modal on outside click
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            hideModal();
        }
    });

    // Decrypt content
    async function decryptContent() {
        const password = decryptPassword.value;
        
        if (!password) {
            decryptError.textContent = 'Please enter a password';
            return;
        }

        decryptBtn.disabled = true;
        decryptBtn.textContent = 'Decrypting...';
        decryptError.textContent = '';

        try {
            const decryptedHtml = await blogCrypto.decrypt(encryptedData, password);
            
            // Hide modal and encrypted notice
            hideModal();
            document.getElementById('encryptedContent').style.display = 'none';
            
            // Convert to canvas
            const canvas = document.getElementById('decryptedCanvas');
            await blogCrypto.htmlToCanvas(decryptedHtml, canvas);
            canvas.style.display = 'block';
            
        } catch (error) {
            decryptError.textContent = 'Incorrect password. Please try again.';
        } finally {
            decryptBtn.disabled = false;
            decryptBtn.textContent = 'Decrypt';
        }
    }

    if (decryptBtn) {
        decryptBtn.addEventListener('click', decryptContent);
    }

    // Enter key in password field
    if (decryptPassword) {
        decryptPassword.addEventListener('keyup', (e) => {
            if (e.key === 'Enter') {
                decryptContent();
            }
        });
    }

    // Initialize
    async function init() {
        const slug = getPostSlug();
        const post = await loadPost(slug);
        
        if (post) {
            displayPost(post);
        } else {
            document.getElementById('postContent').innerHTML = '<p>Post not found.</p>';
        }
    }

    init();
})();