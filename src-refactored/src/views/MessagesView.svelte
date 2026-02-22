<script>
    import { getConversations, getMessages, sendMessage, markConversationRead } from '../../js/api.js';
    import { isAuthenticated } from '../../js/auth.js';
    import { timeAgo, showToast } from '../../js/utils.js';

    let { params = {}, onopenAuthModal = null } = $props();

    let conversations = $state([]);
    // svelte-ignore state_referenced_locally
    let selectedId = $state(params.id || null);
    let messages = $state([]);
    let messageInput = $state('');
    let otherDogName = $state('');
    let loading = $state(true);
    let myDogId = $state(null);
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

        try {
            const data = await getMessages(convId);
            const msgs = data.messages || [];

            if (data.otherDog) {
                otherDogName = data.otherDog.name;
            }

            markConversationRead(convId).catch(() => {});

            // Find myDogId from conversations list
            const conv = conversations.find(c => c.id === convId);
            myDogId = conv?.myDogId || null;

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
            await sendMessage(selectedId, content);
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
        <div class="empty-state" style="padding: 60px 20px;">
            <i class="fas fa-envelope"></i>
            <p>Please log in to view your messages.</p>
        </div>
    </main>
{:else}
    <main class="messages-page">
        <div class="messages-layout">
            <div class="conversations-panel" id="conversations-panel">
                <div class="conversations-header">
                    <h2>Messages</h2>
                </div>
                <div class="conversations-list" id="conversations-list">
                    {#if loading}
                        <div class="messages-loading"><i class="fas fa-spinner fa-spin"></i></div>
                    {:else if conversations.length === 0}
                        <div class="conv-empty">
                            <i class="fas fa-envelope-open-text"></i>
                            <p>No messages yet</p>
                            <p class="conv-empty-sub">Visit a dog's profile and send them a message!</p>
                        </div>
                    {:else}
                        {#each conversations as conv (conv.id)}
                            <!-- svelte-ignore a11y_click_events_have_key_events -->
                            <!-- svelte-ignore a11y_no_static_element_interactions -->
                            <div
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
                                    <span class="conv-preview">{conv.lastMessage || 'No messages yet'}</span>
                                </div>
                                {#if conv.unreadCount > 0}
                                    <span class="conv-badge">{conv.unreadCount}</span>
                                {/if}
                            </div>
                        {/each}
                    {/if}
                </div>
            </div>

            <div class="thread-panel" class:active={threadActive} id="thread-panel">
                <div class="thread-header" id="thread-header">
                    <button class="back-btn thread-back-btn" id="thread-back-btn" aria-label="Back to conversations" onclick={handleBackBtn}>
                        <i class="fas fa-arrow-left"></i>
                    </button>
                    <span class="thread-title" id="thread-title">
                        {otherDogName || 'Select a conversation'}
                    </span>
                </div>
                <div class="thread-messages" id="thread-messages">
                    {#if !selectedId}
                        <div class="thread-empty">
                            <i class="fas fa-comments"></i>
                            <p>Select a conversation to start chatting</p>
                        </div>
                    {:else if messages.length === 0}
                        <div class="thread-empty"><p>Send the first message!</p></div>
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
                            placeholder="Type a message..."
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
