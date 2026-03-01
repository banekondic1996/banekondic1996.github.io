// Search functionality for blog posts
class BlogSearch {
    constructor() {
        this.posts = [];
        this.filteredPosts = [];
    }

    setPosts(posts) {
        this.posts = posts;
        this.filteredPosts = posts;
    }

    search(query) {
        if (!query || query.trim() === '') {
            this.filteredPosts = this.posts;
            return this.filteredPosts;
        }

        const searchTerm = query.toLowerCase().trim();
        
        this.filteredPosts = this.posts.filter(post => {
            const titleMatch = post.title.toLowerCase().includes(searchTerm);
            const excerptMatch = post.excerpt && post.excerpt.toLowerCase().includes(searchTerm);
            const contentMatch = post.content && post.content.toLowerCase().includes(searchTerm);
            const authorMatch = post.author && post.author.toLowerCase().includes(searchTerm);
            const categoriesMatch = post.categories && post.categories.some(cat => 
                cat.toLowerCase().includes(searchTerm)
            );
            
            return titleMatch || excerptMatch || contentMatch || authorMatch || categoriesMatch;
        });

        return this.filteredPosts;
    }

    getFilteredPosts() {
        return this.filteredPosts;
    }

    sortByDate(ascending = false) {
        this.filteredPosts.sort((a, b) => {
            const dateA = new Date(a.date);
            const dateB = new Date(b.date);
            return ascending ? dateA - dateB : dateB - dateA;
        });
        return this.filteredPosts;
    }
}

const blogSearch = new BlogSearch();