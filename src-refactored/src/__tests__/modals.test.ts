/**
 * Modals Module Tests
 * Tests for updateUIForAuth after nelli.html removal
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock dependencies
vi.mock('../../js/auth.js', () => ({
  login: vi.fn(),
  register: vi.fn(),
  isAuthenticated: vi.fn(),
  logout: vi.fn(),
  getCurrentUser: vi.fn(),
}));

vi.mock('../../js/api.js', () => ({
  createDog: vi.fn(),
  uploadImage: vi.fn(),
  getMyDogs: vi.fn().mockResolvedValue([]),
}));

vi.mock('../../js/navigation.js', () => ({
  updateProfileNavigation: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../../js/posts.js', () => ({
  createPost: vi.fn(),
}));

vi.mock('../../js/ui.js', () => ({
  toggleBodyScroll: vi.fn(),
  focusFirstElement: vi.fn(),
}));

vi.mock('../../js/utils.js', () => ({
  trapFocus: vi.fn(),
  showToast: vi.fn(),
}));

import { updateUIForAuth } from '../../js/modals.js';
import { isAuthenticated } from '../../js/auth.js';
import { updateProfileNavigation } from '../../js/navigation.js';

function setupAuthDOM() {
  document.body.innerHTML = `
    <a href="#" class="auth-link">Login</a>
    <a href="#" aria-label="Messages"><i class="fas fa-envelope"></i></a>
    <div id="profile-nav-item"></div>
  `;
}

describe('updateUIForAuth', () => {
  beforeEach(() => {
    setupAuthDOM();
    vi.clearAllMocks();
  });

  it('should show login text when not authenticated', async () => {
    vi.mocked(isAuthenticated).mockReturnValue(false);

    await updateUIForAuth();

    const authLink = document.querySelector('.auth-link');
    expect(authLink?.innerHTML).toContain('Login');
  });

  it('should show logout text when authenticated', async () => {
    vi.mocked(isAuthenticated).mockReturnValue(true);

    await updateUIForAuth();

    const authLink = document.querySelector('.auth-link');
    expect(authLink?.innerHTML).toContain('Logout');
  });

  it('should hide messages link when not authenticated', async () => {
    vi.mocked(isAuthenticated).mockReturnValue(false);

    await updateUIForAuth();

    const messagesLink = document.querySelector('a[aria-label="Messages"]') as HTMLElement;
    expect(messagesLink.style.display).toBe('none');
  });

  it('should show messages link when authenticated', async () => {
    vi.mocked(isAuthenticated).mockReturnValue(true);

    await updateUIForAuth();

    const messagesLink = document.querySelector('a[aria-label="Messages"]') as HTMLElement;
    expect(messagesLink.style.display).toBe('');
  });

  it('should delegate profile navigation to navigation.js', async () => {
    vi.mocked(isAuthenticated).mockReturnValue(true);

    await updateUIForAuth();

    expect(updateProfileNavigation).toHaveBeenCalledOnce();
  });

  it('should NOT query for nelli.html selectors', async () => {
    // Add a nelli.html link to verify it's NOT touched
    const nelliLink = document.createElement('a');
    nelliLink.href = 'nelli.html';
    nelliLink.textContent = 'Old Profile';
    nelliLink.style.display = '';
    document.body.appendChild(nelliLink);

    vi.mocked(isAuthenticated).mockReturnValue(false);
    await updateUIForAuth();

    // The nelli.html link should NOT be hidden (modals.js doesn't know about it anymore)
    expect(nelliLink.style.display).toBe('');
  });
});
