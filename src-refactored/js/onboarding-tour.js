/**
 * Onboarding Tour
 * 3-step carousel modal that introduces key features to new dog owners.
 * Shown once after creating their first dog profile.
 */

import { toggleBodyScroll } from './ui.js';
import { pushModalState, popModalState } from './modals.js';

const ONBOARDING_KEY = 'onboarding_completed';

/**
 * Check if the onboarding tour has been completed
 * @returns {boolean}
 */
export function isOnboardingCompleted() {
    return localStorage.getItem(ONBOARDING_KEY) === 'true';
}

/**
 * Show the onboarding tour modal
 * @param {string} dogName - Name of the dog to personalize the welcome
 */
export function showOnboardingTour(dogName) {
    if (isOnboardingCompleted()) return;

    let currentStep = 0;

    const steps = [
        {
            icon: 'fas fa-paw',
            title: `${dogName}'s profile is ready!`,
            text: "This is your dog's home on Woof. Let's take a quick look at what you can do here.",
        },
        {
            icon: 'fas fa-camera',
            title: 'Share moments',
            text: 'Post photos of your dog to build their profile. Other users can like, comment, and follow.',
        },
        {
            icon: 'fas fa-heartbeat',
            title: 'Keep a health diary',
            text: "Track vet visits, vaccinations, medications, and weight \u2014 all in one private place. Only you can see your dog's health records.",
        },
    ];

    // Create overlay
    const overlay = document.createElement('div');
    overlay.className = 'modal onboarding-tour';
    overlay.style.display = 'flex';

    const content = document.createElement('div');
    content.className = 'modal-content onboarding-tour-content';

    // Close button
    const closeBtn = document.createElement('button');
    closeBtn.className = 'modal-close';
    closeBtn.setAttribute('aria-label', 'Close');
    closeBtn.innerHTML = '&times;';

    content.appendChild(closeBtn);
    overlay.appendChild(content);
    document.body.appendChild(overlay);
    toggleBodyScroll(true);
    pushModalState();

    function renderStep() {
        const step = steps[currentStep];
        const isLast = currentStep === steps.length - 1;

        // Keep the close button, replace everything else
        const existing = content.querySelector('.tour-step');
        if (existing) existing.remove();

        const stepEl = document.createElement('div');
        stepEl.className = 'tour-step';

        // Icon
        const iconWrap = document.createElement('div');
        iconWrap.className = 'tour-icon';
        const icon = document.createElement('i');
        icon.className = step.icon;
        iconWrap.appendChild(icon);

        // Title
        const title = document.createElement('h2');
        title.textContent = step.title;

        // Text
        const text = document.createElement('p');
        text.textContent = step.text;

        // Dots
        const dots = document.createElement('div');
        dots.className = 'tour-dots';
        steps.forEach((_, i) => {
            const dot = document.createElement('span');
            dot.className = 'tour-dot' + (i === currentStep ? ' active' : '');
            dots.appendChild(dot);
        });

        // Actions
        const actions = document.createElement('div');
        actions.className = 'tour-actions';

        if (!isLast) {
            const skipBtn = document.createElement('button');
            skipBtn.className = 'tour-skip';
            skipBtn.textContent = 'Skip';
            skipBtn.addEventListener('click', closeTour);

            const nextBtn = document.createElement('button');
            nextBtn.className = 'btn-primary';
            nextBtn.textContent = 'Next';
            nextBtn.addEventListener('click', () => {
                currentStep++;
                renderStep();
            });

            actions.appendChild(skipBtn);
            actions.appendChild(nextBtn);
        } else {
            const doneBtn = document.createElement('button');
            doneBtn.className = 'btn-primary';
            doneBtn.textContent = 'Got it!';
            doneBtn.addEventListener('click', closeTour);
            actions.appendChild(doneBtn);
        }

        stepEl.appendChild(iconWrap);
        stepEl.appendChild(title);
        stepEl.appendChild(text);
        stepEl.appendChild(dots);
        stepEl.appendChild(actions);

        content.appendChild(stepEl);
    }

    function closeTour() {
        localStorage.setItem(ONBOARDING_KEY, 'true');
        toggleBodyScroll(false);
        popModalState();
        overlay.remove();
    }

    // Close on X button
    closeBtn.addEventListener('click', closeTour);

    // Close on overlay click
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) closeTour();
    });

    renderStep();
}
