<script>
    let selectedCategory = $state('bug');
    let demoMessage = $state('');
</script>

<div class="proto-feedback">
    <h1 class="proto-title">Feedback & Broadcasts</h1>
    <p class="proto-desc">Preview of the user feedback modal and admin broadcast notification system.</p>

    <!-- Feedback Modal Preview -->
    <section class="preview-section">
        <h2 class="section-heading">
            <i class="fas fa-comment-dots" aria-hidden="true"></i>
            Feedback Modal
        </h2>
        <p class="section-desc">Users access this from Settings &rarr; "Give feedback about Woof". Submissions go to the admin feedback dashboard.</p>

        <div class="modal-preview">
            <div class="mock-modal">
                <div class="mock-header">
                    <button type="button" class="mock-back" aria-label="Back">
                        <i class="fas fa-arrow-left"></i>
                    </button>
                    <h3>Palaute</h3>
                    <button type="button" class="mock-action" disabled={!demoMessage.trim()}>
                        Lähetä
                    </button>
                </div>

                <p class="mock-desc">Auta meitä parantamaan Woofia! Kerro bugeista, toiveista tai ajatuksistasi.</p>

                <div class="mock-pills">
                    {#each [['bug', 'fa-bug', 'Bugi'], ['feature', 'fa-lightbulb', 'Toive'], ['general', 'fa-comment', 'Yleinen']] as [cat, icon, label] (cat)}
                        <button
                            type="button"
                            class="mock-pill"
                            class:active={selectedCategory === cat}
                            onclick={() => selectedCategory = cat}
                        >
                            <i class="fas {icon}" aria-hidden="true"></i>
                            {label}
                        </button>
                    {/each}
                </div>

                <textarea
                    class="mock-textarea"
                    placeholder="Kerro meille mitä mielessäsi on..."
                    bind:value={demoMessage}
                    rows="4"
                ></textarea>
                <span class="mock-charcount">{demoMessage.length}/2000</span>
            </div>
        </div>
    </section>

    <!-- System Notification Preview -->
    <section class="preview-section">
        <h2 class="section-heading">
            <i class="fas fa-bullhorn" aria-hidden="true"></i>
            System Notifications
        </h2>
        <p class="section-desc">Admin broadcasts appear as system notifications with the Woof icon. They can include an optional link.</p>

        <div class="notif-preview">
            <div class="notif-card">
                <div class="notif-item">
                    <div class="notif-icon">
                        <i class="fas fa-bullhorn" aria-hidden="true"></i>
                    </div>
                    <div class="notif-body">
                        <span class="notif-text">
                            <strong>Woof</strong> Tervetuloa Woofiin! Lisää koirasi profiili ja aloita jakaminen.
                        </span>
                        <time class="notif-time">juuri nyt</time>
                    </div>
                </div>

                <div class="notif-divider"></div>

                <div class="notif-item">
                    <div class="notif-icon">
                        <i class="fas fa-bullhorn" aria-hidden="true"></i>
                    </div>
                    <div class="notif-body">
                        <span class="notif-text">
                            <strong>Woof</strong> Uusia koirapuistoja lisätty Espoon alueelle! Tutustu ja tarkista onko lähipuistosi mukana.
                        </span>
                        <time class="notif-time">2 tuntia sitten</time>
                    </div>
                </div>

                <div class="notif-divider"></div>

                <div class="notif-item read">
                    <div class="notif-icon" style="background: var(--woof-color-neutral-300);">
                        <i class="fas fa-bullhorn" aria-hidden="true"></i>
                    </div>
                    <div class="notif-body">
                        <span class="notif-text">
                            <strong>Woof</strong> Huoltokatko su 16.3. klo 02–04. Sovellus ei ole käytettävissä.
                        </span>
                        <time class="notif-time">1 päivä sitten</time>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <!-- Admin Broadcast Concept -->
    <section class="preview-section">
        <h2 class="section-heading">
            <i class="fas fa-shield-halved" aria-hidden="true"></i>
            Admin Panel
        </h2>
        <p class="section-desc">Admins can send broadcast messages to all users from the admin panel. System notifications reach every active (non-banned) user.</p>

        <div class="admin-preview">
            <div class="admin-card">
                <h3 class="admin-card-title">Send Broadcast</h3>
                <div class="admin-field">
                    <label>Message</label>
                    <textarea placeholder="Write a message for all users..." rows="3" disabled></textarea>
                </div>
                <div class="admin-field">
                    <label>Link (optional)</label>
                    <input type="text" placeholder="e.g. /dog-parks" disabled />
                </div>
                <button type="button" class="admin-send" disabled>
                    <i class="fas fa-paper-plane" aria-hidden="true"></i>
                    Send to all users
                </button>
                <p class="admin-note">This will create a notification for every active user.</p>
            </div>
        </div>
    </section>
</div>

<style>
.proto-feedback {
    display: flex;
    flex-direction: column;
    gap: var(--woof-space-6);
}

.proto-title {
    font-size: var(--woof-text-title-2);
    font-weight: var(--woof-font-weight-bold);
    color: var(--woof-color-neutral-900);
    margin: 0;
}

.proto-desc {
    font-size: var(--woof-text-callout);
    color: var(--woof-color-neutral-500);
    margin: 0;
}

.preview-section {
    display: flex;
    flex-direction: column;
    gap: var(--woof-space-3);
}

.section-heading {
    font-size: var(--woof-text-headline);
    font-weight: var(--woof-font-weight-semibold);
    color: var(--woof-color-neutral-900);
    margin: 0;
    display: flex;
    align-items: center;
    gap: var(--woof-space-2);
}

.section-heading i {
    color: var(--woof-color-brand-primary);
}

.section-desc {
    font-size: var(--woof-text-callout);
    color: var(--woof-color-neutral-500);
    margin: 0;
    line-height: var(--woof-line-height-body);
}

/* Feedback Modal Mock */
.modal-preview {
    border: 1px solid var(--woof-color-neutral-200);
    border-radius: var(--woof-radius-lg);
    overflow: hidden;
}

.mock-modal {
    background: var(--woof-surface-primary);
    padding: var(--woof-space-4);
}

.mock-header {
    display: flex;
    align-items: center;
    gap: var(--woof-space-3);
    margin-bottom: var(--woof-space-4);
}

.mock-header h3 {
    flex: 1;
    text-align: center;
    margin: 0;
    font-size: var(--woof-text-headline);
    font-weight: var(--woof-font-weight-semibold);
}

.mock-back {
    width: var(--woof-touch-target);
    height: var(--woof-touch-target);
    border: none;
    background: none;
    color: var(--woof-color-neutral-700);
    font-size: var(--woof-text-body);
    cursor: pointer;
    border-radius: var(--woof-radius-full);
    display: flex;
    align-items: center;
    justify-content: center;
}

.mock-action {
    border: none;
    background: none;
    color: var(--woof-color-brand-primary);
    font-size: var(--woof-text-callout);
    font-weight: var(--woof-font-weight-semibold);
    cursor: pointer;
    padding: var(--woof-space-2) var(--woof-space-3);
    border-radius: var(--woof-radius-sm);
}

.mock-action:disabled {
    opacity: 0.4;
    cursor: not-allowed;
}

.mock-desc {
    font-size: var(--woof-text-callout);
    color: var(--woof-color-neutral-500);
    margin: 0 0 var(--woof-space-3);
}

.mock-pills {
    display: flex;
    gap: var(--woof-space-2);
    margin-bottom: var(--woof-space-3);
}

.mock-pill {
    display: inline-flex;
    align-items: center;
    gap: var(--woof-space-1);
    padding: var(--woof-space-2) var(--woof-space-3);
    border: 1px solid var(--woof-color-neutral-200);
    border-radius: var(--woof-radius-full);
    background: var(--woof-surface-primary);
    color: var(--woof-color-neutral-600);
    font-size: var(--woof-text-caption-1);
    font-weight: var(--woof-font-weight-medium);
    font-family: inherit;
    cursor: pointer;
    transition: all var(--woof-duration-fast);
}

.mock-pill.active {
    border-color: var(--woof-color-brand-primary);
    background: color-mix(in srgb, var(--woof-color-brand-primary) 8%, transparent);
    color: var(--woof-color-brand-primary);
}

.mock-textarea {
    width: 100%;
    padding: var(--woof-space-3);
    border: 1px solid var(--woof-color-neutral-200);
    border-radius: var(--woof-radius-md);
    font-size: var(--woof-text-callout);
    font-family: inherit;
    background: var(--woof-color-neutral-50);
    color: var(--woof-color-neutral-900);
    resize: vertical;
    box-sizing: border-box;
}

.mock-textarea:focus {
    outline: none;
    border-color: var(--woof-color-brand-primary);
}

.mock-charcount {
    display: block;
    text-align: right;
    font-size: var(--woof-text-caption-2);
    color: var(--woof-color-neutral-400);
    margin-top: var(--woof-space-1);
}

/* Notification Preview */
.notif-preview {
    border: 1px solid var(--woof-color-neutral-200);
    border-radius: var(--woof-radius-lg);
    overflow: hidden;
}

.notif-card {
    background: var(--woof-surface-primary);
}

.notif-item {
    display: flex;
    align-items: center;
    gap: var(--woof-space-3);
    padding: var(--woof-space-3) var(--woof-space-4);
}

.notif-item.read {
    opacity: 0.6;
}

.notif-divider {
    height: 1px;
    background: var(--woof-color-neutral-100);
    margin: 0 var(--woof-space-4);
}

.notif-icon {
    width: 36px;
    height: 36px;
    border-radius: var(--woof-radius-full);
    background: var(--woof-color-brand-primary);
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-size: var(--woof-text-caption-1);
    flex-shrink: 0;
}

.notif-body {
    flex: 1;
    min-width: 0;
}

.notif-text {
    font-size: var(--woof-text-callout);
    color: var(--woof-color-neutral-900);
    line-height: 1.4;
}

.notif-text strong {
    font-weight: var(--woof-font-weight-semibold);
}

.notif-time {
    display: block;
    font-size: var(--woof-text-footnote);
    color: var(--woof-color-neutral-400);
    margin-top: 2px;
}

/* Admin Preview */
.admin-preview {
    border: 1px solid var(--woof-color-neutral-200);
    border-radius: var(--woof-radius-lg);
    overflow: hidden;
}

.admin-card {
    background: var(--woof-surface-primary);
    padding: var(--woof-space-4);
}

.admin-card-title {
    font-size: var(--woof-text-headline);
    font-weight: var(--woof-font-weight-semibold);
    margin: 0 0 var(--woof-space-4);
    color: var(--woof-color-neutral-900);
}

.admin-field {
    margin-bottom: var(--woof-space-3);
}

.admin-field label {
    display: block;
    font-size: var(--woof-text-caption-1);
    font-weight: var(--woof-font-weight-medium);
    color: var(--woof-color-neutral-600);
    margin-bottom: var(--woof-space-1);
}

.admin-field textarea,
.admin-field input {
    width: 100%;
    padding: var(--woof-space-2) var(--woof-space-3);
    border: 1px solid var(--woof-color-neutral-200);
    border-radius: var(--woof-radius-sm);
    font-size: var(--woof-text-callout);
    font-family: inherit;
    background: var(--woof-color-neutral-50);
    color: var(--woof-color-neutral-500);
    box-sizing: border-box;
}

.admin-send {
    display: inline-flex;
    align-items: center;
    gap: var(--woof-space-2);
    padding: var(--woof-space-2) var(--woof-space-4);
    background: var(--woof-color-brand-primary);
    color: white;
    border: none;
    border-radius: var(--woof-radius-md);
    font-size: var(--woof-text-callout);
    font-weight: var(--woof-font-weight-semibold);
    font-family: inherit;
    cursor: not-allowed;
    opacity: 0.5;
}

.admin-note {
    font-size: var(--woof-text-caption-2);
    color: var(--woof-color-neutral-400);
    margin: var(--woof-space-2) 0 0;
}

@media (max-width: 768px) {
    .mock-textarea,
    .admin-field textarea,
    .admin-field input {
        font-size: 16px;
    }
}
</style>
