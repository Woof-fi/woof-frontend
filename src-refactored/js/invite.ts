/**
 * Invite Friends Module
 * Handles viral growth through friend invitations
 */

import { showToast } from './utils';
import { getCurrentUser } from './auth';

/**
 * Initialize the invite friends modal and functionality
 */
export function initInviteModal(): void {
    const inviteLink = document.getElementById('invite-friends-link');
    const inviteModal = document.getElementById('invite-modal');
    const closeBtn = inviteModal?.querySelector('.close');
    const emailForm = document.getElementById('email-invite-form') as HTMLFormElement;
    const copyLinkBtn = document.getElementById('copy-link-btn');

    // Open modal
    inviteLink?.addEventListener('click', (e) => {
        e.preventDefault();
        openInviteModal();
    });

    // Close modal
    closeBtn?.addEventListener('click', closeInviteModal);
    inviteModal?.addEventListener('click', (e) => {
        if (e.target === inviteModal) {
            closeInviteModal();
        }
    });

    // Handle email invitation
    emailForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        await sendEmailInvitation(emailForm);
    });

    // Copy invite link
    copyLinkBtn?.addEventListener('click', () => {
        copyInviteLink();
    });

    // Social share buttons
    const twitterBtn = inviteModal?.querySelector('.social-btn.twitter');
    const facebookBtn = inviteModal?.querySelector('.social-btn.facebook');
    const whatsappBtn = inviteModal?.querySelector('.social-btn.whatsapp');

    twitterBtn?.addEventListener('click', () => shareOnTwitter());
    facebookBtn?.addEventListener('click', () => shareOnFacebook());
    whatsappBtn?.addEventListener('click', () => shareOnWhatsApp());

    // Update invite link with user ID
    updateInviteLink();

    // Load invite count
    loadInviteCount();
}

/**
 * Open the invite modal
 */
function openInviteModal(): void {
    const modal = document.getElementById('invite-modal');
    if (modal) {
        modal.style.display = 'block';
        modal.setAttribute('aria-hidden', 'false');
    }
}

/**
 * Close the invite modal
 */
function closeInviteModal(): void {
    const modal = document.getElementById('invite-modal');
    if (modal) {
        modal.style.display = 'none';
        modal.setAttribute('aria-hidden', 'true');
    }
}

/**
 * Update the invite link with the current user's referral code
 */
function updateInviteLink(): void {
    const user = getCurrentUser();
    const inviteLinkInput = document.getElementById('invite-link-input') as HTMLInputElement;

    if (inviteLinkInput) {
        const baseUrl = window.location.origin + window.location.pathname.replace(/[^/]*$/, '');
        const referralCode = user?.id || 'GUEST';
        inviteLinkInput.value = `${baseUrl}?ref=${referralCode}`;
    }
}

/**
 * Copy the invite link to clipboard
 */
async function copyInviteLink(): Promise<void> {
    const inviteLinkInput = document.getElementById('invite-link-input') as HTMLInputElement;

    if (!inviteLinkInput) return;

    try {
        await navigator.clipboard.writeText(inviteLinkInput.value);
        showToast('Invite link copied to clipboard!', 'success');
        trackInviteAction('link_copied');
    } catch (error) {
        // Fallback for older browsers
        inviteLinkInput.select();
        document.execCommand('copy');
        showToast('Invite link copied!', 'success');
        trackInviteAction('link_copied');
    }
}

/**
 * Send email invitation
 */
async function sendEmailInvitation(form: HTMLFormElement): Promise<void> {
    const formData = new FormData(form);
    const friendEmail = formData.get('friend_email') as string;
    const personalMessage = formData.get('personal_message') as string;

    if (!friendEmail) {
        showToast('Please enter your friend\'s email', 'error');
        return;
    }

    try {
        // In a real implementation, this would call the backend API
        // For now, we'll simulate the email sending
        await simulateEmailSend(friendEmail, personalMessage);

        showToast('Invitation sent successfully! 🎉', 'success');
        form.reset();
        incrementInviteCount();
        trackInviteAction('email_sent');

        // Close modal after short delay
        setTimeout(closeInviteModal, 1500);
    } catch (error) {
        showToast('Failed to send invitation. Please try again.', 'error');
    }
}

/**
 * Simulate email sending (replace with actual API call)
 */
async function simulateEmailSend(email: string, message: string): Promise<void> {
    return new Promise((resolve) => {
        setTimeout(() => {
            console.log('Email invitation sent to:', email);
            console.log('Personal message:', message);
            resolve();
        }, 1000);
    });
}

/**
 * Share on Twitter
 */
function shareOnTwitter(): void {
    const text = encodeURIComponent('Join me on Woof - the social network for dogs! 🐕 Share your pet\'s adventures and connect with other dog lovers.');
    const url = encodeURIComponent(getInviteLink());
    const twitterUrl = `https://twitter.com/intent/tweet?text=${text}&url=${url}`;

    window.open(twitterUrl, '_blank', 'width=550,height=420');
    trackInviteAction('twitter_share');
}

/**
 * Share on Facebook
 */
function shareOnFacebook(): void {
    const url = encodeURIComponent(getInviteLink());
    const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${url}`;

    window.open(facebookUrl, '_blank', 'width=550,height=420');
    trackInviteAction('facebook_share');
}

/**
 * Share on WhatsApp
 */
function shareOnWhatsApp(): void {
    const text = encodeURIComponent('Join me on Woof - the social network for dogs! 🐕 ' + getInviteLink());
    const whatsappUrl = `https://wa.me/?text=${text}`;

    window.open(whatsappUrl, '_blank');
    trackInviteAction('whatsapp_share');
}

/**
 * Get the current invite link
 */
function getInviteLink(): string {
    const inviteLinkInput = document.getElementById('invite-link-input') as HTMLInputElement;
    return inviteLinkInput?.value || window.location.href;
}

/**
 * Load the user's invite count from localStorage
 */
function loadInviteCount(): void {
    const count = localStorage.getItem('invite_count') || '0';
    const inviteCountEl = document.getElementById('invite-count');
    if (inviteCountEl) {
        inviteCountEl.textContent = count;
    }
}

/**
 * Increment the invite count
 */
function incrementInviteCount(): void {
    const currentCount = parseInt(localStorage.getItem('invite_count') || '0', 10);
    const newCount = currentCount + 1;
    localStorage.setItem('invite_count', newCount.toString());

    const inviteCountEl = document.getElementById('invite-count');
    if (inviteCountEl) {
        inviteCountEl.textContent = newCount.toString();
    }

    // Show achievement if milestone reached
    if (newCount === 5) {
        showToast('🏆 Achievement unlocked! You\'ve invited 5 friends!', 'success');
    }
}

/**
 * Track invite action (for analytics)
 */
function trackInviteAction(action: string): void {
    console.log('Invite action:', action);
    // In a real implementation, send to analytics service
    // Example: analytics.track('invite_action', { action, timestamp: new Date() });
}

/**
 * Check for referral parameter in URL and track it
 */
export function checkReferral(): void {
    const urlParams = new URLSearchParams(window.location.search);
    const referralCode = urlParams.get('ref');

    if (referralCode && referralCode !== 'GUEST') {
        // Store the referral
        localStorage.setItem('referred_by', referralCode);
        console.log('Referred by:', referralCode);

        // Show welcome message
        showToast('Welcome to Woof! You were invited by a friend 🎉', 'success');

        // In a real implementation, send this to the backend
        // to credit the referrer and track conversion
    }
}
