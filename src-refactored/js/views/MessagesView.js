/**
 * Messages View
 * Conversation list + message thread for dog-to-dog DMs
 */

import { getConversations, getMessages, sendMessage, markConversationRead, startConversation } from '../api.js';
import { escapeHTML, timeAgo, showToast } from '../utils.js';
import { isAuthenticated } from '../auth.js';
import router from '../router.js';

let pollInterval = null;

export class MessagesView {
    constructor() {
        this.name = 'messages';
        this.conversationId = null;
    }

    getHTML(data = {}) {
        this.conversationId = data.params?.id || null;

        if (!isAuthenticated()) {
            return `
                <main class="messages-page">
                    <div class="empty-state" style="padding: 60px 20px;">
                        <i class="fas fa-envelope"></i>
                        <p>Please log in to view your messages.</p>
                    </div>
                </main>
            `;
        }

        return `
            <main class="messages-page">
                <div class="messages-layout">
                    <div class="conversations-panel" id="conversations-panel">
                        <div class="conversations-header">
                            <h2>Messages</h2>
                        </div>
                        <div class="conversations-list" id="conversations-list">
                            <div class="messages-loading"><i class="fas fa-spinner fa-spin"></i></div>
                        </div>
                    </div>
                    <div class="thread-panel ${this.conversationId ? 'active' : ''}" id="thread-panel">
                        <div class="thread-header" id="thread-header">
                            <button class="back-btn thread-back-btn" id="thread-back-btn" aria-label="Back to conversations">
                                <i class="fas fa-arrow-left"></i>
                            </button>
                            <span class="thread-title" id="thread-title">Select a conversation</span>
                        </div>
                        <div class="thread-messages" id="thread-messages">
                            ${this.conversationId ? '<div class="messages-loading"><i class="fas fa-spinner fa-spin"></i></div>' : '<div class="thread-empty"><i class="fas fa-comments"></i><p>Select a conversation to start chatting</p></div>'}
                        </div>
                        <div class="thread-input" id="thread-input" style="display: none;">
                            <input type="text" id="message-input" placeholder="Type a message..." maxlength="5000" autocomplete="off">
                            <button id="send-message-btn" disabled><i class="fas fa-paper-plane"></i></button>
                        </div>
                    </div>
                </div>
            </main>
        `;
    }

    async onMount(data = {}) {
        if (!isAuthenticated()) return;

        const convId = data.params?.id || null;

        // Wire up back button (mobile)
        const backBtn = document.getElementById('thread-back-btn');
        if (backBtn) {
            backBtn.addEventListener('click', () => {
                const threadPanel = document.getElementById('thread-panel');
                if (threadPanel) threadPanel.classList.remove('active');
                router.navigate('/messages');
            });
        }

        // Load conversations
        await this.loadConversations(convId);

        // If conversation ID specified, open it
        if (convId) {
            await this.openConversation(convId);
        }

        // Poll for new messages every 10s
        pollInterval = setInterval(() => {
            this.loadConversations(this.conversationId);
            if (this.conversationId) {
                this.refreshMessages(this.conversationId);
            }
        }, 10000);
    }

    onUnmount() {
        if (pollInterval) {
            clearInterval(pollInterval);
            pollInterval = null;
        }
    }

    async loadConversations(activeId = null) {
        const listEl = document.getElementById('conversations-list');
        if (!listEl) return;

        try {
            const data = await getConversations();
            const conversations = data.conversations || [];

            if (conversations.length === 0) {
                listEl.innerHTML = `
                    <div class="conv-empty">
                        <i class="fas fa-envelope-open-text"></i>
                        <p>No messages yet</p>
                        <p class="conv-empty-sub">Visit a dog's profile and send them a message!</p>
                    </div>
                `;
                return;
            }

            listEl.innerHTML = '';
            conversations.forEach(conv => {
                const item = document.createElement('div');
                item.className = 'conv-item' + (activeId === conv.id ? ' active' : '');
                if (conv.unreadCount > 0) item.classList.add('unread');

                const photo = conv.otherDog.photo || '/assets/images/dog_profile_pic.jpg';
                const lastMsg = conv.lastMessage ? escapeHTML(conv.lastMessage) : 'No messages yet';
                const time = conv.lastMessageAt ? timeAgo(conv.lastMessageAt) : '';

                item.innerHTML = `
                    <img class="conv-avatar" src="${photo}" alt="${escapeHTML(conv.otherDog.name)}" onerror="if(this.src!=='/assets/images/dog_profile_pic.jpg') this.src='/assets/images/dog_profile_pic.jpg'">
                    <div class="conv-info">
                        <div class="conv-name-row">
                            <span class="conv-name">${escapeHTML(conv.otherDog.name)}</span>
                            <span class="conv-time">${time}</span>
                        </div>
                        <span class="conv-preview">${lastMsg}</span>
                    </div>
                    ${conv.unreadCount > 0 ? `<span class="conv-badge">${conv.unreadCount}</span>` : ''}
                `;

                item.addEventListener('click', () => {
                    this.conversationId = conv.id;
                    // Mark active
                    listEl.querySelectorAll('.conv-item').forEach(i => i.classList.remove('active'));
                    item.classList.add('active');
                    item.classList.remove('unread');
                    const badge = item.querySelector('.conv-badge');
                    if (badge) badge.remove();

                    // On mobile, show thread panel
                    const threadPanel = document.getElementById('thread-panel');
                    if (threadPanel) threadPanel.classList.add('active');

                    this.openConversation(conv.id);
                    // Update URL without full navigation
                    window.history.pushState(null, '', `/messages/${conv.id}`);
                });

                listEl.appendChild(item);
            });
        } catch (error) {
            console.error('Failed to load conversations:', error);
        }
    }

    async openConversation(conversationId) {
        this.conversationId = conversationId;
        const messagesEl = document.getElementById('thread-messages');
        const inputEl = document.getElementById('thread-input');
        const titleEl = document.getElementById('thread-title');
        if (!messagesEl) return;

        messagesEl.innerHTML = '<div class="messages-loading"><i class="fas fa-spinner fa-spin"></i></div>';
        if (inputEl) inputEl.style.display = 'flex';

        try {
            const data = await getMessages(conversationId);
            const messages = data.messages || [];

            // Update title
            if (titleEl && data.otherDog) {
                titleEl.textContent = data.otherDog.name;
            }

            // Mark as read
            markConversationRead(conversationId).catch(() => {});

            // Render messages (reverse since they come DESC)
            messagesEl.innerHTML = '';
            const reversed = [...messages].reverse();

            if (reversed.length === 0) {
                messagesEl.innerHTML = '<div class="thread-empty"><p>Send the first message!</p></div>';
            }

            // Find out which dog is "mine" by checking conversations
            const convData = await getConversations();
            const conv = (convData.conversations || []).find(c => c.id === conversationId);
            const myDogId = conv?.myDogId;

            reversed.forEach(msg => {
                const msgEl = document.createElement('div');
                const isMine = msg.senderDogId === myDogId;
                msgEl.className = `msg-bubble ${isMine ? 'msg-mine' : 'msg-theirs'}`;
                msgEl.dataset.id = msg.id;

                const contentEl = document.createElement('div');
                contentEl.className = 'msg-content';
                contentEl.textContent = msg.content;

                const timeEl = document.createElement('span');
                timeEl.className = 'msg-time';
                timeEl.textContent = timeAgo(msg.createdAt);

                msgEl.appendChild(contentEl);
                msgEl.appendChild(timeEl);
                messagesEl.appendChild(msgEl);
            });

            // Scroll to bottom
            messagesEl.scrollTop = messagesEl.scrollHeight;

            // Wire up send
            this.wireUpSend(conversationId);
        } catch (error) {
            console.error('Failed to load messages:', error);
            messagesEl.innerHTML = '<div class="thread-empty"><p>Failed to load messages.</p></div>';
        }
    }

    async refreshMessages(conversationId) {
        // Lightweight refresh — just check if new messages exist
        const messagesEl = document.getElementById('thread-messages');
        if (!messagesEl || !conversationId) return;

        try {
            const data = await getMessages(conversationId, null, 1);
            const latestMsg = data.messages?.[0];
            if (!latestMsg) return;

            // Check if this message is already rendered
            const existing = messagesEl.querySelector(`[data-id="${latestMsg.id}"]`);
            if (!existing) {
                // New message — full reload
                await this.openConversation(conversationId);
            }
        } catch (error) {
            // Silently fail on poll refresh
        }
    }

    wireUpSend(conversationId) {
        const input = document.getElementById('message-input');
        const sendBtn = document.getElementById('send-message-btn');
        if (!input || !sendBtn) return;

        // Remove old listeners by cloning
        const newInput = input.cloneNode(true);
        input.parentNode.replaceChild(newInput, input);
        const newSendBtn = sendBtn.cloneNode(true);
        sendBtn.parentNode.replaceChild(newSendBtn, sendBtn);

        newInput.addEventListener('input', () => {
            newSendBtn.disabled = !newInput.value.trim();
        });

        const doSend = async () => {
            const content = newInput.value.trim();
            if (!content) return;

            newSendBtn.disabled = true;
            newInput.value = '';

            try {
                await sendMessage(conversationId, content);
                await this.openConversation(conversationId);
                this.loadConversations(conversationId);
            } catch (error) {
                console.error('Failed to send message:', error);
                showToast('Failed to send message', 'error');
                newInput.value = content;
                newSendBtn.disabled = false;
            }
        };

        newSendBtn.addEventListener('click', doSend);
        newInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !newSendBtn.disabled) {
                doSend();
            }
        });

        newInput.focus();
    }
}

export default new MessagesView();
