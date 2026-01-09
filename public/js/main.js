/**
 * Georgia State Roleplay - Main JavaScript
 * Handles animations, FAQ, and general interactions
 */

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    // Initialize scroll animations
    initScrollAnimations();
    
    // Initialize scroll indicator
    initScrollIndicator();
    
    // Initialize FAQ
    initFAQ();
});

/**
 * Initialize scroll-triggered animations
 * Elements with data-animate attribute will animate when scrolled into view
 */
function initScrollAnimations() {
    // Select all elements with animation classes
    const animatedElements = document.querySelectorAll('.fade-in, .slide-in-up, .slide-in-left, .slide-in-right, [data-animate]');
    
    // Set initial state for animated elements (hidden)
    animatedElements.forEach(el => {
        // Skip elements that should animate immediately (like hero content)
        if (el.closest('.hero') && el.classList.contains('fade-in')) {
            return; // Let hero elements animate on load
        }
        
        el.style.opacity = '0';
        el.style.transform = getInitialTransform(el);
        el.style.transition = 'opacity 0.8s cubic-bezier(0.16, 1, 0.3, 1), transform 0.8s cubic-bezier(0.16, 1, 0.3, 1)';
    });
    
    // Create intersection observer
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                // Get delay from style or data attribute
                const delay = entry.target.style.animationDelay || 
                              entry.target.dataset.delay || 
                              '0s';
                
                // Apply delay then animate
                setTimeout(() => {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0) translateX(0)';
                    entry.target.classList.add('animated');
                }, parseFloat(delay) * 1000);
                
                // Unobserve after animation
                observer.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    });
    
    // Observe all animated elements
    animatedElements.forEach(el => {
        // Skip hero elements
        if (el.closest('.hero') && el.classList.contains('fade-in')) {
            return;
        }
        observer.observe(el);
    });
}

/**
 * Get initial transform based on animation class
 */
function getInitialTransform(el) {
    if (el.classList.contains('slide-in-left')) {
        return 'translateX(-50px)';
    } else if (el.classList.contains('slide-in-right')) {
        return 'translateX(50px)';
    } else {
        // Default: slide up
        return 'translateY(50px)';
    }
}

/**
 * Initialize scroll indicator
 */
function initScrollIndicator() {
    const scrollIndicator = document.querySelector('.scroll-indicator');
    
    if (scrollIndicator) {
        // Fade out on scroll
        window.addEventListener('scroll', () => {
            const scrollY = window.scrollY;
            const fadeStart = 50;
            const fadeEnd = 300;
            
            if (scrollY <= fadeStart) {
                scrollIndicator.style.opacity = '1';
            } else if (scrollY >= fadeEnd) {
                scrollIndicator.style.opacity = '0';
                scrollIndicator.style.pointerEvents = 'none';
            } else {
                const opacity = 1 - ((scrollY - fadeStart) / (fadeEnd - fadeStart));
                scrollIndicator.style.opacity = opacity;
            }
        });
        
        // Scroll down when clicked
        scrollIndicator.addEventListener('click', () => {
            const hero = document.querySelector('.hero');
            if (hero) {
                const nextSection = hero.nextElementSibling;
                if (nextSection) {
                    nextSection.scrollIntoView({ behavior: 'smooth' });
                }
            }
        });
    }
}

/**
 * Initialize FAQ accordion functionality
 */
function initFAQ() {
    const faqItems = document.querySelectorAll('.faq-item');
    
    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question');
        if (question) {
            question.addEventListener('click', () => {
                // Close other items
                faqItems.forEach(otherItem => {
                    if (otherItem !== item) {
                        otherItem.classList.remove('active');
                    }
                });
                
                // Toggle current item
                item.classList.toggle('active');
            });
        }
    });
}

/**
 * Show notification message
 */
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    const bgColor = type === 'error' ? 'rgba(220, 53, 69, 0.15)' : 
                    type === 'success' ? 'rgba(40, 167, 69, 0.15)' : 
                    'rgba(253, 205, 4, 0.15)';
    const textColor = type === 'error' ? '#dc3545' : 
                      type === 'success' ? '#28a745' : 
                      '#fdcd04';
    const borderColor = type === 'error' ? 'rgba(220, 53, 69, 0.3)' : 
                        type === 'success' ? 'rgba(40, 167, 69, 0.3)' : 
                        'rgba(253, 205, 4, 0.3)';
    
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${bgColor};
        color: ${textColor};
        border: 1px solid ${borderColor};
        padding: 1rem 1.5rem;
        border-radius: 10px;
        box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
        z-index: 3000;
        backdrop-filter: blur(10px);
        transform: translateX(100%);
        opacity: 0;
        transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
    `;
    
    document.body.appendChild(notification);
    
    // Trigger animation
    requestAnimationFrame(() => {
        notification.style.transform = 'translateX(0)';
        notification.style.opacity = '1';
    });
    
    setTimeout(() => {
        notification.style.transform = 'translateX(100%)';
        notification.style.opacity = '0';
        setTimeout(() => notification.remove(), 400);
    }, 3000);
}

/**
 * Format date for display
 */
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

/**
 * Format datetime for display
 */
function formatDateTime(dateString) {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}
