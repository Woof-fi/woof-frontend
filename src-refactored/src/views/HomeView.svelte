<script>
    import Feed from '../components/Feed.svelte';
    import { store, setFeedTab } from '../../js/svelte-store.svelte.js';

    let { onopenAuthModal = null } = $props();

    // Initialize feed tab from URL on mount (e.g. direct link to /?tab=following)
    $effect(() => {
        const tab = new URLSearchParams(window.location.search).get('tab');
        if (tab === 'following') setFeedTab('following');
    });

    // Keep URL in sync with selected tab
    $effect(() => {
        const search = store.feedTab === 'following' ? '?tab=following' : '';
        history.replaceState({}, '', window.location.pathname + search);
    });
</script>

<main>
    <section class="feed">
        <div id="feed-container" class="feed-container" role="feed" aria-label="Dog posts feed">
            <Feed type={store.feedTab} onopenAuthModal={onopenAuthModal} />
        </div>
    </section>
</main>
