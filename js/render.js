// Rendering functions for blog posts
class BlogRenderer {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.noResultsEl = document.getElementById('noResults');
    }

    renderPosts(posts) {
        if (!this.container) return;

        this.container.innerHTML = '';

        if (posts.length === 0) {
            if (this.noResultsEl) {
                this.noResultsEl.style.display = 'block';
            }
            return;
        }

        if (this.noResultsEl) {
            this.noResultsEl.style.display = 'none';
        }

        posts.forEach(post => {
            const postCard = this.createPostCard(post);
            this.container.appendChild(postCard);
        });
    }

    createPostCard(post) {
        const card = document.createElement('a');
        card.className = 'post-card';
        card.href = `#post/${post.slug}`;

        // Categories
        if (post.categories && post.categories.length > 0) {
            const categoriesDiv = document.createElement('div');
            categoriesDiv.className = 'post-card-categories';
            post.categories.forEach(cat => {
                const badge = document.createElement('span');
                badge.className = 'category-badge';
                badge.textContent = cat;
                categoriesDiv.appendChild(badge);
            });
            card.appendChild(categoriesDiv);
        }

        // Title
        const title = document.createElement('h2');
        title.textContent = post.title;
        card.appendChild(title);

        // Excerpt
        if (post.excerpt) {
            const excerpt = document.createElement('p');
            excerpt.className = 'post-excerpt';
            excerpt.textContent = this.truncateText(post.excerpt, 150);
            card.appendChild(excerpt);
        }

        // Meta
        const meta = document.createElement('div');
        meta.className = 'post-meta';

        const date = document.createElement('span');
        date.textContent = this.formatDate(post.date);
        meta.appendChild(date);

        if (post.author) {
            const author = document.createElement('span');
            author.textContent = `By ${post.author}`;
            meta.appendChild(author);
        }

        card.appendChild(meta);

        return card;
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        return date.toLocaleDateString('en-US', options);
    }

    truncateText(text, maxLength) {
        if (text.length <= maxLength) return text;
        return text.substr(0, maxLength).trim() + '...';
    }
}

const blogRenderer = new BlogRenderer('postsContainer');