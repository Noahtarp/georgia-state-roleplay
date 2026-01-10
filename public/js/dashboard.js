/**
 * Dashboard JavaScript
 * Handles staff dashboard functionality
 */

let applications = [];

document.addEventListener('DOMContentLoaded', async () => {
    // Check authentication
    await checkAuth();
    
    // Load dashboard data
    await loadDashboardData();
});

async function checkAuth() {
    try {
        const response = await fetch('/auth/status');
        const data = await response.json();
        
        if (!data.authenticated) {
            window.location.href = '/login';
            return;
        }
        
        // Display user info
        const userInfo = document.getElementById('user-info');
        if (userInfo && data.user) {
            userInfo.textContent = `Logged in as ${data.user.username}`;
        }
    } catch (error) {
        console.error('Auth check error:', error);
        window.location.href = '/login';
    }
}

async function loadDashboardData() {
    try {
        const response = await fetch('/api/applications');
        const data = await response.json();
        
        if (data.success) {
            applications = data.applications;
            updateStats();
            displayApplications();
        } else {
            showNotification('Failed to load applications', 'error');
        }
    } catch (error) {
        console.error('Error loading dashboard data:', error);
        showNotification('Error loading dashboard data', 'error');
    }
}

function updateStats() {
    const pending = applications.filter(app => app.status === 'pending').length;
    const accepted = applications.filter(app => app.status === 'accepted').length;
    const denied = applications.filter(app => app.status === 'denied').length;
    const total = applications.length;
    
    document.getElementById('stat-pending').textContent = pending;
    document.getElementById('stat-accepted').textContent = accepted;
    document.getElementById('stat-denied').textContent = denied;
    document.getElementById('stat-total').textContent = total;
}

function displayApplications() {
    const container = document.getElementById('applications-container');
    
    if (applications.length === 0) {
        container.innerHTML = '<p>No applications found.</p>';
        return;
    }
    
    // Create table
    let html = '<table class="applications-table"><thead><tr>';
    html += '<th>ID</th>';
    html += '<th>Applicant</th>';
    html += '<th>Type</th>';
    html += '<th>Status</th>';
    html += '<th>Submitted</th>';
    html += '<th>Actions</th>';
    html += '</tr></thead><tbody>';
    
    applications.forEach(app => {
        const statusClass = `status-${app.status}`;
        html += '<tr>';
        html += `<td>#${app.id}</td>`;
        html += `<td>${app.discord_username}</td>`;
        html += `<td>${app.application_type.toUpperCase()}</td>`;
        html += `<td><span class="status-badge ${statusClass}">${app.status}</span></td>`;
        html += `<td>${formatDateTime(app.created_at)}</td>`;
        html += `<td><button class="btn" onclick="viewApplication(${app.id})" style="padding: 0.5rem 1rem; font-size: 0.9rem;">View</button></td>`;
        html += '</tr>';
    });
    
    html += '</tbody></table>';
    container.innerHTML = html;
}

function viewApplication(id) {
    const application = applications.find(app => app.id === id);
    if (!application) {
        showNotification('Application not found', 'error');
        return;
    }
    
    const modal = document.getElementById('application-modal');
    const modalBody = document.getElementById('modal-body');
    const modalTitle = document.getElementById('modal-title');
    
    modalTitle.textContent = `${application.application_type.toUpperCase()} Application #${application.id}`;
    
    let html = '<div style="line-height: 1.8;">';
    html += `<p><strong>Applicant:</strong> ${application.discord_username} (${application.discord_user_id})</p>`;
    html += `<p><strong>Type:</strong> ${application.application_type.toUpperCase()}</p>`;
    html += `<p><strong>Status:</strong> <span class="status-badge status-${application.status}">${application.status}</span></p>`;
    html += `<p><strong>Submitted:</strong> ${formatDateTime(application.created_at)}</p>`;
    
    if (application.reviewed_at) {
        html += `<p><strong>Reviewed:</strong> ${formatDateTime(application.reviewed_at)}</p>`;
    }
    
    if (application.reviewer_discord_id) {
        html += `<p><strong>Reviewed by:</strong> ${application.reviewer_discord_id}</p>`;
    }
    
    if (application.review_reason) {
        html += `<p><strong>Review Reason:</strong> ${application.review_reason}</p>`;
    }
    
    html += '<hr style="margin: 1.5rem 0; border: none; border-top: 1px solid #e0e0e0;">';
    html += '<h3 style="margin-bottom: 1rem;">Application Answers</h3>';
    
    // Display answers
    const answers = typeof application.answers === 'string' 
        ? JSON.parse(application.answers) 
        : application.answers;
    
    if (Array.isArray(answers)) {
        answers.forEach((answer, index) => {
            if (answer.question && answer.answer) {
                html += `<div style="margin-bottom: 1.5rem;">`;
                html += `<p><strong>${answer.question}</strong></p>`;
                html += `<p style="color: #666; white-space: pre-wrap;">${answer.answer}</p>`;
                html += `</div>`;
            }
        });
    } else if (typeof answers === 'object') {
        Object.entries(answers).forEach(([key, value]) => {
            html += `<div style="margin-bottom: 1.5rem;">`;
            html += `<p><strong>${key}</strong></p>`;
            html += `<p style="color: #666; white-space: pre-wrap;">${value}</p>`;
            html += `</div>`;
        });
    }
    
    html += '</div>';
    
    modalBody.innerHTML = html;
    modal.classList.add('active');
    
    // Close on outside click
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeApplicationModal();
        }
    });
}

function closeApplicationModal() {
    const modal = document.getElementById('application-modal');
    modal.classList.remove('active');
}



