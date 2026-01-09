/**
 * Applications Page JavaScript
 * Handles application type selection and form submission
 */

// Application questions based on type
const applicationQuestions = {
    staff: [
        { question: 'What is your Roblox username?', required: true },
        { question: 'What is your Roblox ID?', required: true },
        { question: 'Why do you want to become a staff member?', required: true },
        { question: 'What experience do you have with staff roles?', required: true },
        { question: 'How would you handle a conflict between players?', required: true },
        { question: 'What is RDM? Explain it in 2+ sentences.', required: true },
        { question: 'What is VDM? Explain it in 2+ sentences.', required: true },
        { question: 'What is Tool Abuse? Explain it in 2+ sentences.', required: true },
        { question: 'What is NITRP? Explain it in 2+ sentences.', required: true },
        { question: 'What is Cop Baiting? Explain it in 2+ sentences.', required: true },
        { question: 'What timezone are you in?', required: true },
        { question: 'How many hours per week can you dedicate?', required: true },
        { question: 'Any additional information?', required: false }
    ],
    gsp: [
        { question: 'What is your Roblox username?', required: true },
        { question: 'What is your Roblox ID?', required: true },
        { question: 'Why do you want to join the Georgia State Patrol?', required: true },
        { question: 'What experience do you have with law enforcement roleplay?', required: true },
        { question: 'How familiar are you with traffic laws and procedures?', required: true },
        { question: 'What makes you a good fit for GSP?', required: true },
        { question: 'Any additional information?', required: false }
    ],
    fbi: [
        { question: 'What is your Roblox username?', required: true },
        { question: 'What is your Roblox ID?', required: true },
        { question: 'Why do you want to join the FBI?', required: true },
        { question: 'What experience do you have with federal law enforcement roleplay?', required: true },
        { question: 'How would you handle a high-profile investigation?', required: true },
        { question: 'What makes you a good fit for the FBI?', required: true },
        { question: 'Any additional information?', required: false }
    ]
};

// Type display names
const typeDisplayNames = {
    staff: 'Staff Team',
    gsp: 'Georgia State Patrol',
    fbi: 'FBI'
};

// Type descriptions
const typeDescriptions = {
    staff: 'Help moderate and maintain our community',
    gsp: 'Patrol the highways as a State Trooper',
    fbi: 'Handle federal investigations and cases'
};

// Current selected type
let selectedType = null;

document.addEventListener('DOMContentLoaded', () => {
    initTypeSelection();
    initFormSubmission();
    initChangeSelection();
});

/**
 * Initialize type selection cards
 */
function initTypeSelection() {
    const typeCards = document.querySelectorAll('.application-type-card');
    
    typeCards.forEach(card => {
        card.addEventListener('click', () => {
            const type = card.dataset.type;
            selectApplicationType(type, typeCards);
        });
    });
}

/**
 * Handle application type selection
 */
function selectApplicationType(type, cards) {
    selectedType = type;
    
    // Update card selection states
    cards.forEach(card => {
        if (card.dataset.type === type) {
            card.classList.add('selected');
        } else {
            card.classList.remove('selected');
        }
    });
    
    // Wait a moment for visual feedback, then show form
    setTimeout(() => {
        showApplicationForm(type);
    }, 300);
}

/**
 * Show the application form for selected type
 */
function showApplicationForm(type) {
    const typeSelection = document.getElementById('type-selection');
    const formSection = document.getElementById('application-form-section');
    const typeInput = document.getElementById('application-type');
    const titleEl = document.getElementById('selected-type-title');
    const descEl = document.getElementById('selected-type-description');
    const bannerContainer = document.getElementById('application-banner-container');
    const questionsContainer = document.getElementById('application-questions');
    
    // Update hidden input
    typeInput.value = type;
    
    // Update header
    titleEl.textContent = `${typeDisplayNames[type]} Application`;
    descEl.textContent = typeDescriptions[type];
    
    // Render banner
    renderBanner(type, bannerContainer);
    
    // Render questions
    renderQuestions(type, questionsContainer);
    
    // Hide type selection, show form
    typeSelection.style.display = 'none';
    formSection.classList.add('active');
    
    // Scroll to form
    formSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/**
 * Render application banner
 */
function renderBanner(type, container) {
    container.innerHTML = '';
    
    const bannerImages = {
        staff: '/images/banner-staff.png',
        gsp: '/images/banner-gsp.png',
        fbi: '/images/banner-fbi.png'
    };
    
    const bannerSrc = bannerImages[type];
    if (bannerSrc) {
        const banner = document.createElement('img');
        banner.src = bannerSrc;
        banner.alt = `${typeDisplayNames[type]} Application Banner`;
        banner.className = 'application-banner';
        banner.onerror = function() {
            // Hide banner if image doesn't exist
            this.style.display = 'none';
        };
        container.appendChild(banner);
    }
}

/**
 * Render application questions
 */
function renderQuestions(type, container) {
    container.innerHTML = '';
    
    const questions = applicationQuestions[type];
    if (!questions) return;
    
    questions.forEach((q, index) => {
        const group = document.createElement('div');
        group.className = 'form-group';
        
        const label = document.createElement('label');
        label.textContent = q.question + (q.required ? ' *' : '');
        label.setAttribute('for', `question-${index}`);
        
        const textarea = document.createElement('textarea');
        textarea.id = `question-${index}`;
        textarea.name = `question-${index}`;
        textarea.required = q.required;
        textarea.rows = 4;
        textarea.placeholder = 'Type your answer here...';
        
        group.appendChild(label);
        group.appendChild(textarea);
        container.appendChild(group);
    });
}

/**
 * Initialize change selection button
 */
function initChangeSelection() {
    const changeBtn = document.getElementById('change-selection-btn');
    
    changeBtn.addEventListener('click', () => {
        const typeSelection = document.getElementById('type-selection');
        const formSection = document.getElementById('application-form-section');
        
        // Reset form
        document.getElementById('application-form').reset();
        document.getElementById('application-questions').innerHTML = '';
        document.getElementById('application-banner-container').innerHTML = '';
        document.getElementById('form-message').classList.add('hidden');
        
        // Reset card selection
        document.querySelectorAll('.application-type-card').forEach(card => {
            card.classList.remove('selected');
        });
        
        // Show type selection, hide form
        formSection.classList.remove('active');
        typeSelection.style.display = 'block';
        
        // Scroll to top
        typeSelection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        
        selectedType = null;
    });
}

/**
 * Initialize form submission
 */
function initFormSubmission() {
    const form = document.getElementById('application-form');
    form.addEventListener('submit', handleSubmit);
}

/**
 * Handle form submission
 */
async function handleSubmit(e) {
    e.preventDefault();
    
    const form = e.target;
    const messageDiv = document.getElementById('form-message');
    const submitBtn = form.querySelector('button[type="submit"]');
    
    // Disable submit button
    submitBtn.disabled = true;
    submitBtn.textContent = 'Submitting...';
    
    // Collect form data
    const formData = {
        discordUserId: document.getElementById('discord-user-id').value.trim(),
        discordUsername: document.getElementById('discord-username').value.trim(),
        applicationType: document.getElementById('application-type').value,
        answers: []
    };
    
    // Validate application type
    if (!formData.applicationType) {
        showMessage('Please select an application type.', 'error', messageDiv);
        submitBtn.disabled = false;
        submitBtn.textContent = 'Submit Application';
        return;
    }
    
    // Collect answers
    const questions = applicationQuestions[formData.applicationType] || [];
    let hasError = false;
    
    questions.forEach((q, index) => {
        const answerEl = document.getElementById(`question-${index}`);
        const answer = answerEl ? answerEl.value.trim() : '';
        
        if (q.required && !answer) {
            hasError = true;
        }
        
        formData.answers.push({
            question: q.question,
            answer: answer
        });
    });
    
    if (hasError) {
        showMessage('Please answer all required questions.', 'error', messageDiv);
        submitBtn.disabled = false;
        submitBtn.textContent = 'Submit Application';
        return;
    }
    
    // Validate Discord User ID (should be numeric)
    if (!/^\d+$/.test(formData.discordUserId)) {
        showMessage('Invalid Discord User ID. Please enter a numeric ID.', 'error', messageDiv);
        submitBtn.disabled = false;
        submitBtn.textContent = 'Submit Application';
        return;
    }
    
    try {
        const response = await fetch('/api/applications', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });
        
        const data = await response.json();
        
        if (data.success) {
            showMessage('Application submitted successfully! You will receive a notification via Discord when it has been reviewed.', 'success', messageDiv);
            form.reset();
            document.getElementById('application-questions').innerHTML = '';
            
            // Optionally redirect or show success state
            setTimeout(() => {
                // Reset to type selection after successful submission
                document.getElementById('change-selection-btn').click();
            }, 3000);
        } else {
            showMessage(data.error || 'Failed to submit application. Please try again.', 'error', messageDiv);
        }
    } catch (error) {
        console.error('Submission error:', error);
        showMessage('An error occurred while submitting your application. Please try again.', 'error', messageDiv);
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Submit Application';
    }
}

/**
 * Show message to user
 */
function showMessage(message, type, container) {
    container.classList.remove('hidden');
    container.textContent = message;
    
    if (type === 'error') {
        container.style.backgroundColor = 'rgba(220, 53, 69, 0.15)';
        container.style.color = '#dc3545';
        container.style.border = '1px solid rgba(220, 53, 69, 0.3)';
    } else {
        container.style.backgroundColor = 'rgba(40, 167, 69, 0.15)';
        container.style.color = '#28a745';
        container.style.border = '1px solid rgba(40, 167, 69, 0.3)';
    }
    
    // Scroll to message
    container.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

