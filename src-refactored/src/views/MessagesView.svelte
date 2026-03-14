<script>
    import { getConversations, getMessages, sendMessage, markConversationRead } from '../../js/api.js';
    import { isAuthenticated } from '../../js/auth.js';
    import { timeAgo, showToast } from '../../js/utils.js';
    import { t } from '../../js/i18n-store.svelte.js';

    let { params = {}, onopenAuthModal = null } = $props();

    let conversations = $state([]);
    // svelte-ignore state_referenced_locally
    let selectedId = $state(params.id || null);
    let messages = $state([]);
    let messageInput = $state('');
    let otherDogName = $state('');
    let loading = $state(true);
    let myDogId = $state(null);
    let myDogName = $state('');
    // svelte-ignore state_referenced_locally
    let threadActive = $state(!!params.id);

    async function loadConversations() {
        try {
            const data = await getConversations();
            conversations = data.conversations || [];
        } catch (e) {
            console.error('Failed to load conversations:', e);
        }
    }

    async function openConversation(convId) {
        selectedId = convId;
        threadActive = true;
        messages = [];
        otherDogName = '';
        myDogName = '';

        try {
            const data = await getMessages(convId);
            const msgs = data.messages || [];

            if (data.otherDog) {
                otherDogName = data.otherDog.name;
            }

            markConversationRead(convId).catch(() => {});

            // Find myDogId and name from conversations list
            const conv = conversations.find(c => c.id === convId);
            myDogId = conv?.myDogId || null;
            myDogName = conv?.myDogName || '';

            // Messages come DESC, reverse for display
            messages = [...msgs].reverse();

            // Update URL
            window.history.pushState(null, '', `/messages/${convId}`);
        } catch (e) {
            console.error('Failed to load messages:', e);
        }
    }

    async function refreshMessages() {
        if (!selectedId) return;
        try {
            const data = await getMessages(selectedId, null, 1);
            const latest = data.messages?.[0];
            if (!latest) return;
            const alreadyExists = messages.some(m => m.id === latest.id);
            if (!alreadyExists) {
                // Full reload
                await openConversation(selectedId);
            }
        } catch {
            // Silently fail
        }
    }

    async function handleSend() {
        const content = messageInput.trim();
        if (!content || !selectedId) return;

        messageInput = '';
        try {
            await sendMessage(selectedId, content, myDogId);
            await openConversation(selectedId);
            await loadConversations();
        } catch (e) {
            console.error('Failed to send message:', e);
            showToast('Failed to send message', 'error');
            messageInput = content;
        }
    }

    function handleInputKeydown(e) {
        if (e.key === 'Enter' && messageInput.trim()) {
            handleSend();
        }
    }

    function handleBackBtn() {
        threadActive = false;
        window.history.pushState(null, '', '/messages');
    }

    $effect(() => {
        if (!isAuthenticated()) {
            loading = false;
            return;
        }

        let interval = null;

        (async () => {
            await loadConversations();
            if (params.id) {
                await openConversation(params.id);
            }
            loading = false;

            interval = setInterval(() => {
                loadConversations();
                if (selectedId) refreshMessages();
            }, 10000);
        })();

        return () => {
            if (interval) clearInterval(interval);
        };
    });
</script>

{#if !isAuthenticated()}
    <main class="messages-page">
        <div class="woof-empty-state">
            <div class="woof-empty-state-icon">
                <i class="fas fa-envelope"></i>
            </div>
            <p>{t('messages.loginRequired')}</p>
        </div>
    </main>
{:else}
    <main class="messages-page">
        <div class="messages-layout">
            <div class="conversations-panel" id="conversations-panel">
                <div class="conversations-header">
                    <h2>{t('messages.title')}</h2>
                </div>
                <div class="conversations-list" id="conversations-list">
                    {#if loading}
                        <div class="messages-loading"><i class="fas fa-spinner fa-spin"></i></div>
                    {:else if conversations.length === 0}
                        <div class="conv-empty">
                            <i class="fas fa-envelope-open-text"></i>
                            <p>{t('messages.empty')}</p>
                            <p class="conv-empty-sub">{t('messages.emptyHint')}</p>
                        </div>
                    {:else}
                        {#each conversations as conv (conv.id)}
                            <button
                                type="button"
                                class="conv-item"
                                class:active={selectedId === conv.id}
                                class:unread={conv.unreadCount > 0}
                                onclick={() => openConversation(conv.id)}
                            >
                                <img
                                    class="conv-avatar"
                                    src={conv.otherDog.photo || '/images/dog_profile_pic.jpg'}
                                    alt={conv.otherDog.name}
                                    onerror={(e) => { if (e.target.src !== '/images/dog_profile_pic.jpg') e.target.src = '/images/dog_profile_pic.jpg'; }}
                                />
                                <div class="conv-info">
                                    <div class="conv-name-row">
                                        <span class="conv-name">{conv.otherDog.name}</span>
                                        <span class="conv-time">{conv.lastMessageAt ? timeAgo(conv.lastMessageAt) : ''}</span>
                                    </div>
                                    {#if conv.myDogName}
                                        <span class="conv-my-dog">{t('messages.messagingAs').replace('{name}', conv.myDogName)}</span>
                                    {/if}
                                    <span class="conv-preview">{conv.lastMessage || 'No messages yet'}</span>
                                </div>
                                {#if conv.unreadCount > 0}
                                    <span class="conv-badge">{conv.unreadCount}</span>
                                {/if}
                            </button>
                        {/each}
                    {/if}
                </div>
            </div>

            <div class="thread-panel" class:active={threadActive} id="thread-panel">
                <div class="thread-header" id="thread-header">
                    <button class="back-btn thread-back-btn" id="thread-back-btn" aria-label="Back to conversations" onclick={handleBackBtn}>
                        <i class="fas fa-arrow-left"></i>
                    </button>
                    <div class="thread-title-group">
                        <span class="thread-title" id="thread-title">
                            {otherDogName || t('messages.selectConversation')}
                        </span>
                        {#if myDogName && otherDogName}
                            <span class="thread-subtitle">{t('messages.messagingAs').replace('{name}', myDogName)}</span>
                        {/if}
                    </div>
                </div>
                <div class="thread-messages" id="thread-messages">
                    {#if !selectedId}
                        <div class="thread-empty">
                            <i class="fas fa-comments"></i>
                            <p>{t('messages.selectConversation')}</p>
                        </div>
                    {:else if messages.length === 0}
                        <div class="thread-empty"><p>{t('messages.sendFirst')}</p></div>
                    {:else}
                        {#each messages as msg (msg.id)}
                            <div
                                class="msg-bubble"
                                class:msg-mine={msg.senderDogId === myDogId}
                                class:msg-theirs={msg.senderDogId !== myDogId}
                                data-id={msg.id}
                            >
                                <div class="msg-content">{msg.content}</div>
                                <span class="msg-time">{timeAgo(msg.createdAt)}</span>
                            </div>
                        {/each}
                    {/if}
                </div>
                {#if selectedId}
                    <div class="thread-input" id="thread-input" style="display:flex">
                        <input
                            type="text"
                            id="message-input"
                            placeholder={t('messages.placeholder')}
                            maxlength="5000"
                            autocomplete="off"
                            bind:value={messageInput}
                            onkeydown={handleInputKeydown}
                        />
                        <button
                            id="send-message-btn"
                            aria-label="Send message"
                            disabled={!messageInput.trim()}
                            onclick={handleSend}
                        >
                            <i class="fas fa-paper-plane"></i>
                        </button>
                    </div>
                {:else}
                    <div class="thread-input" id="thread-input" style="display:none"></div>
                {/if}
            </div>
        </div>
    </main>
{/if}

<style>
.messages-page {
    position: fixed;
    top: var(--woof-header-height);
    left: 280px;
    right: 0;
    bottom: 0;
    overflow: hidden;
}

.messages-layout {
    display: flex;
    width: 100%;
    height: 100%;
    overflow: hidden;
    background: var(--woof-surface-primary);
}

.conversations-panel {
    width: 280px;
    min-width: 240px;
    flex-shrink: 0;
    border-right: 1px solid var(--woof-color-neutral-200);
    display: flex;
    flex-direction: column;
    background: var(--woof-color-neutral-100);
}

.conversations-header {
    padding: 20px;
    border-bottom: 1px solid var(--woof-color-neutral-200);
    background: var(--woof-surface-primary);
}

.conversations-header h2 {
    margin: 0;
    font-size: var(--woof-text-headline);
    font-weight: var(--woof-font-weight-bold);
    color: var(--woof-color-neutral-900);
}

.conversations-list {
    flex: 1;
    overflow-y: auto;
}

.conv-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 16px;
    cursor: pointer;
    transition: background-color 0.15s;
    position: relative;
    background: none;
    border: none;
    border-bottom: 1px solid var(--woof-color-neutral-100);
    font: inherit;
    color: inherit;
    text-align: left;
    width: 100%;
}

.conv-item:hover {
    background-color: var(--woof-color-neutral-100);
}

.conv-item.active {
    background-color: var(--woof-color-neutral-100);
}

.conv-item.unread {
    background-color: var(--woof-color-brand-primary-subtle);
}

.conv-item.unread .conv-name {
    font-weight: 700;
}

.conv-item.unread .conv-preview {
    font-weight: 600;
    color: var(--woof-color-neutral-900);
}

.conv-avatar {
    width: 48px;
    height: 48px;
    border-radius: var(--woof-radius-full);
    object-fit: cover;
    flex-shrink: 0;
}

.conv-info {
    flex: 1;
    min-width: 0;
}

.conv-name-row {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    margin-bottom: 2px;
}

.conv-name {
    font-weight: var(--woof-font-weight-semibold);
    font-size: var(--woof-text-subhead);
    color: var(--woof-color-neutral-900);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.conv-time {
    font-size: 11px;
    color: var(--woof-color-neutral-400);
    flex-shrink: 0;
    margin-left: 8px;
}

.conv-my-dog {
    font-size: 11px;
    color: var(--woof-color-neutral-400);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    font-style: italic;
}

.conv-preview {
    font-size: 13px;
    color: var(--woof-color-neutral-500);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.conv-badge {
    background-color: var(--woof-color-brand-primary);
    color: white;
    font-size: 11px;
    font-weight: 700;
    min-width: 20px;
    height: 20px;
    border-radius: var(--woof-radius-full);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0 6px;
    flex-shrink: 0;
}

.conv-empty {
    text-align: center;
    padding: 40px 20px;
    color: var(--woof-color-neutral-400);
}

.conv-empty i {
    font-size: 48px;
    margin-bottom: 12px;
    display: block;
    color: var(--woof-color-neutral-200);
}

.conv-empty p {
    margin: 4px 0;
}

.conv-empty-sub {
    font-size: 13px;
}

.thread-panel {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-width: 0;
    background: var(--woof-surface-primary);
}

.thread-header {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 16px 20px;
    border-bottom: 1px solid var(--woof-color-neutral-200);
    min-height: 61px;
    background: var(--woof-surface-primary);
    flex-shrink: 0;
}

.thread-back-btn {
    display: none;
    background: none;
    border: none;
    font-size: 18px;
    color: var(--woof-color-neutral-900);
    cursor: pointer;
    padding: 4px 8px;
}

.thread-title-group {
    display: flex;
    flex-direction: column;
    min-width: 0;
}

.thread-title {
    font-weight: var(--woof-font-weight-semibold);
    font-size: var(--woof-text-headline);
    color: var(--woof-color-neutral-900);
}

.thread-subtitle {
    font-size: 12px;
    color: var(--woof-color-neutral-400);
    font-style: italic;
}

.thread-messages {
    flex: 1;
    overflow-y: auto;
    padding: 20px;
    display: flex;
    flex-direction: column;
    gap: 6px;
    background: var(--woof-color-neutral-50);
}

.thread-empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    color: var(--woof-color-neutral-400);
    text-align: center;
    padding: var(--woof-space-8);
    gap: var(--woof-space-3);
}

.thread-empty i {
    font-size: 48px;
    color: var(--woof-color-neutral-200);
    opacity: 0.7;
}

.msg-bubble {
    max-width: 70%;
    padding: 10px 14px;
    border-radius: var(--woof-radius-bubble);
    word-wrap: break-word;
    position: relative;
}

.msg-mine {
    align-self: flex-end;
    background-color: var(--woof-color-brand-primary);
    color: white;
    border-bottom-right-radius: 4px;
}

.msg-theirs {
    align-self: flex-start;
    background-color: var(--woof-color-neutral-100);
    color: var(--woof-color-neutral-900);
    border-bottom-left-radius: 4px;
}

.msg-content {
    font-size: 14px;
    line-height: 1.4;
}

.msg-time {
    font-size: 10px;
    opacity: 0.7;
    display: block;
    margin-top: 4px;
}

.msg-mine .msg-time {
    text-align: right;
}

.thread-input {
    display: flex;
    align-items: center;
    gap: var(--woof-space-2);
    padding: 12px 20px;
    border-top: 1px solid var(--woof-color-neutral-200);
    background: var(--woof-surface-primary);
    flex-shrink: 0;
}

.thread-input input {
    flex: 1;
    padding: 10px 16px;
    border: 1px solid var(--woof-color-neutral-200);
    border-radius: var(--woof-radius-full);
    font-size: var(--woof-text-body);
    font-family: inherit;
    outline: none;
    background: var(--woof-color-neutral-50);
    transition: border-color var(--woof-duration-fast);
}

.thread-input input:focus {
    border-color: var(--woof-color-brand-primary);
}

.thread-input button {
    background: var(--woof-color-brand-primary);
    color: white;
    border: none;
    width: 40px;
    height: 40px;
    border-radius: var(--woof-radius-full);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 15px;
    transition: opacity var(--woof-duration-fast);
    flex-shrink: 0;
}

.thread-input button:disabled {
    opacity: 0.35;
    cursor: default;
}

.thread-input button:not(:disabled):hover {
    opacity: 0.85;
}

.messages-loading {
    text-align: center;
    padding: 40px;
    color: var(--woof-color-neutral-400);
    font-size: 20px;
}

@media (max-width: 768px) {
    .messages-page {
        left: 0;
        bottom: 56px;
    }

    .messages-layout {
        border: none;
    }

    .conversations-panel {
        width: 100%;
        min-width: 100%;
        background: var(--woof-surface-primary);
    }

    .thread-panel {
        position: fixed;
        top: var(--woof-header-height);
        left: 0;
        right: 0;
        bottom: 56px;
        background: var(--woof-surface-primary);
        z-index: 50;
        transform: translateX(100%);
        transition: transform 0.25s ease;
    }

    .thread-panel.active {
        transform: translateX(0);
    }

    .thread-messages {
        background: var(--woof-surface-primary);
    }

    .thread-back-btn {
        display: block;
    }

    .msg-bubble {
        max-width: 85%;
    }
}
</style>
