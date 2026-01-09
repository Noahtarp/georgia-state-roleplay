/**
 * Blog Page JavaScript
 * Fetches and displays blog posts (patch notes)
 */

document.addEventListener('DOMContentLoaded', async () => {
    await loadBlogPosts();
});

async function loadBlogPosts() {
    const blogContainer = document.getElementById('blog-posts');
    
    try {
        const response = await fetch('/api/blog');
        const data = await response.json();
        
        if (data.success && data.posts.length > 0) {
            blogContainer.innerHTML = '';
            
            data.posts.forEach(post => {
                const postCard = createBlogCard(post);
                blogContainer.appendChild(postCard);
            });
        } else {
            blogContainer.innerHTML = '<p class="text-center">No patch notes available yet. Check back soon!</p>';
        }
    } catch (error) {
        console.error('Error loading blog posts:', error);
        blogContainer.innerHTML = '<p class="text-center">Error loading patch notes. Please try again later.</p>';
    }
}

function createBlogCard(post) {
    const card = document.createElement('div');
    card.className = 'blog-card slide-in-up';
    
    const content = document.createElement('div');
    content.className = 'blog-card-content';
    
    const title = document.createElement('h3');
    title.textContent = post.title;
    
    const meta = document.createElement('div');
    meta.className = 'blog-card-meta';
    meta.textContent = `Posted by ${post.author_username} on ${formatDate(post.created_at)}`;
    
    const description = document.createElement('p');
    // Show first 200 characters of content
    const preview = post.content.length > 200 
        ? post.content.substring(0, 200) + '...' 
        : post.content;
    description.textContent = preview;
    
    content.appendChild(title);
    content.appendChild(meta);
    content.appendChild(description);
    card.appendChild(content);
    
    // Add click to view full post
    card.style.cursor = 'pointer';
    card.addEventListener('click', () => {
        showBlogPostModal(post);
    });
    
    return card;
}

function showBlogPostModal(post) {
    const modal = document.createElement('div');
    modal.className = 'modal active';
    
    const modalContent = document.createElement('div');
    modalContent.className = 'modal-content';
    
    const header = document.createElement('div');
    header.className = 'modal-header';
    
    const title = document.createElement('h2');
    title.textContent = post.title;
    
    const closeBtn = document.createElement('button');
    closeBtn.className = 'modal-close';
    closeBtn.innerHTML = '&times;';
    closeBtn.addEventListener('click', () => modal.remove());
    
    header.appendChild(title);
    header.appendChild(closeBtn);
    
    const meta = document.createElement('p');
    meta.style.color = '#999';
    meta.style.marginBottom = '1.5rem';
    meta.textContent = `Posted by ${post.author_username} on ${formatDateTime(post.created_at)}`;
    
    const content = document.createElement('div');
    content.style.lineHeight = '1.8';
    content.style.color = '#666';
    // Convert line breaks to <br> tags
    content.innerHTML = post.content.replace(/\n/g, '<br>');
    
    modalContent.appendChild(header);
    modalContent.appendChild(meta);
    modalContent.appendChild(content);
    modal.appendChild(modalContent);
    
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    });
    
    document.body.appendChild(modal);
}


