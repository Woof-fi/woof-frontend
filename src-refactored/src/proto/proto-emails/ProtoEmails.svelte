<script>
    const emails = [
        {
            subject: 'Tervetuloa Woofiin!',
            preview: 'Aloita lisäämällä koirasi profiili',
            body: {
                greeting: 'Hei ja tervetuloa Woofiin!',
                steps: [
                    { icon: 'fa-dog', text: 'Lisää koirasi profiili — nimi, rotu ja kuva' },
                    { icon: 'fa-camera', text: 'Jaa ensimmäinen kuvasi koirallesi' },
                    { icon: 'fa-users', text: 'Seuraa koiria alueeltasi ja löydä leikkikavereita' },
                ],
                cta: 'Aloita nyt',
                footer: 'Woof — Koirien oma sosiaalinen verkosto',
            },
        },
        {
            subject: 'Bella sai 3 uutta seuraajaa!',
            preview: 'Katso keitä uusia ystäviä Bella on saanut',
            body: {
                greeting: 'Hei Bellan omistaja!',
                message: 'Bellaa seuraa nyt 3 uutta koiraa:',
                followers: [
                    { name: 'Rölli', breed: 'Suomenlapinkoira', territory: 'Oulunkylä' },
                    { name: 'Muru', breed: 'Jämtlanninpystykorva', territory: 'Käpylä' },
                    { name: 'Sisu', breed: 'Karjalankarhukoira', territory: 'Pakila' },
                ],
                cta: 'Katso profiilit',
                footer: 'Woof — Koirien oma sosiaalinen verkosto',
            },
        },
        {
            subject: 'Viikon kuulumiset — Helsinki',
            preview: 'Uudet koirat, suositut puistot ja paljon muuta',
            body: {
                greeting: 'Moikka!',
                stats: [
                    { label: 'Uudet koirat alueellasi', value: '12' },
                    { label: 'Puistovierailuja tällä viikolla', value: '47' },
                    { label: 'Uudet julkaisut', value: '89' },
                ],
                topParks: [
                    { name: 'Uutelan koirapuisto', visitors: 23 },
                    { name: 'Arabian koira-aitaus', visitors: 18 },
                    { name: 'Paloheinän koirapuisto', visitors: 15 },
                ],
                cta: 'Avaa Woof',
                footer: 'Woof — Koirien oma sosiaalinen verkosto',
            },
        },
    ];
</script>

<div class="proto-emails">
    <h1 class="proto-title">Email Templates</h1>
    <p class="proto-desc">Preview of transactional and digest emails. All mock data — Finnish dog names and territories.</p>

    {#each emails as email, i (i)}
        <div class="email-frame">
            <div class="email-chrome">
                <div class="email-dots">
                    <span class="dot"></span><span class="dot"></span><span class="dot"></span>
                </div>
                <div class="email-meta">
                    <span class="email-from">noreply@woofapp.fi</span>
                    <span class="email-subject">{email.subject}</span>
                </div>
            </div>

            <div class="email-body">
                <!-- Header banner -->
                <div class="email-header">
                    <i class="fas fa-dog" aria-hidden="true"></i>
                    <span>Woof</span>
                </div>

                <div class="email-content">
                    <h2>{email.body.greeting}</h2>

                    {#if email.body.steps}
                        <div class="email-steps">
                            {#each email.body.steps as step, j (j)}
                                <div class="email-step">
                                    <div class="step-num">{j + 1}</div>
                                    <div class="step-text">
                                        <i class="fas {step.icon}" aria-hidden="true"></i>
                                        {step.text}
                                    </div>
                                </div>
                            {/each}
                        </div>
                    {/if}

                    {#if email.body.message}
                        <p class="email-message">{email.body.message}</p>
                    {/if}

                    {#if email.body.followers}
                        <div class="follower-list">
                            {#each email.body.followers as f (f.name)}
                                <div class="follower-row">
                                    <div class="follower-avatar">
                                        <i class="fas fa-dog" aria-hidden="true"></i>
                                    </div>
                                    <div class="follower-info">
                                        <strong>{f.name}</strong>
                                        <span>{f.breed} &middot; {f.territory}</span>
                                    </div>
                                </div>
                            {/each}
                        </div>
                    {/if}

                    {#if email.body.stats}
                        <div class="stats-grid">
                            {#each email.body.stats as stat (stat.label)}
                                <div class="stat-card">
                                    <div class="stat-value">{stat.value}</div>
                                    <div class="stat-label">{stat.label}</div>
                                </div>
                            {/each}
                        </div>
                    {/if}

                    {#if email.body.topParks}
                        <h3 class="parks-heading">Suosituimmat puistot</h3>
                        <div class="parks-list">
                            {#each email.body.topParks as park, k (k)}
                                <div class="park-row">
                                    <span class="park-rank">#{k + 1}</span>
                                    <span class="park-name">{park.name}</span>
                                    <span class="park-visitors">{park.visitors} vierailijaa</span>
                                </div>
                            {/each}
                        </div>
                    {/if}

                    <div class="email-cta-wrap">
                        <button type="button" class="email-cta">{email.body.cta}</button>
                    </div>
                </div>

                <div class="email-footer">
                    {email.body.footer}
                </div>
            </div>
        </div>
    {/each}
</div>

<style>
.proto-emails {
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
    margin: 0 0 var(--woof-space-2);
}

.email-frame {
    border: 1px solid var(--woof-color-neutral-200);
    border-radius: var(--woof-radius-lg);
    overflow: hidden;
    background: var(--woof-color-neutral-100);
}

.email-chrome {
    display: flex;
    align-items: center;
    gap: var(--woof-space-3);
    padding: var(--woof-space-2) var(--woof-space-3);
    background: var(--woof-color-neutral-200);
}

.email-dots {
    display: flex;
    gap: 4px;
}

.dot {
    width: 8px;
    height: 8px;
    border-radius: var(--woof-radius-full);
    background: var(--woof-color-neutral-400);
}

.email-meta {
    display: flex;
    flex-direction: column;
    font-size: var(--woof-text-caption-2);
    color: var(--woof-color-neutral-600);
}

.email-subject {
    font-weight: var(--woof-font-weight-semibold);
    color: var(--woof-color-neutral-900);
}

.email-body {
    background: white;
    margin: var(--woof-space-3);
    border-radius: var(--woof-radius-md);
    overflow: hidden;
}

.email-header {
    background: var(--woof-color-brand-primary);
    color: white;
    padding: var(--woof-space-4);
    display: flex;
    align-items: center;
    gap: var(--woof-space-2);
    font-size: var(--woof-text-title-3);
    font-weight: var(--woof-font-weight-bold);
}

.email-content {
    padding: var(--woof-space-5) var(--woof-space-4);
}

.email-content h2 {
    font-size: var(--woof-text-headline);
    font-weight: var(--woof-font-weight-semibold);
    color: var(--woof-color-neutral-900);
    margin: 0 0 var(--woof-space-4);
}

.email-steps {
    display: flex;
    flex-direction: column;
    gap: var(--woof-space-3);
    margin-bottom: var(--woof-space-4);
}

.email-step {
    display: flex;
    align-items: center;
    gap: var(--woof-space-3);
}

.step-num {
    width: 28px;
    height: 28px;
    border-radius: var(--woof-radius-full);
    background: var(--woof-color-brand-primary);
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: var(--woof-text-caption-1);
    font-weight: var(--woof-font-weight-bold);
    flex-shrink: 0;
}

.step-text {
    font-size: var(--woof-text-callout);
    color: var(--woof-color-neutral-700);
}

.step-text i {
    color: var(--woof-color-brand-primary);
    margin-right: var(--woof-space-1);
}

.email-message {
    font-size: var(--woof-text-callout);
    color: var(--woof-color-neutral-700);
    margin: 0 0 var(--woof-space-3);
}

.follower-list {
    display: flex;
    flex-direction: column;
    gap: var(--woof-space-2);
    margin-bottom: var(--woof-space-4);
}

.follower-row {
    display: flex;
    align-items: center;
    gap: var(--woof-space-3);
    padding: var(--woof-space-2);
    background: var(--woof-color-neutral-50);
    border-radius: var(--woof-radius-md);
}

.follower-avatar {
    width: 36px;
    height: 36px;
    border-radius: var(--woof-radius-full);
    background: var(--woof-color-neutral-200);
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--woof-color-neutral-400);
    flex-shrink: 0;
}

.follower-info {
    display: flex;
    flex-direction: column;
    font-size: var(--woof-text-caption-1);
    color: var(--woof-color-neutral-600);
}

.follower-info strong {
    color: var(--woof-color-neutral-900);
}

.stats-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: var(--woof-space-2);
    margin-bottom: var(--woof-space-4);
}

.stat-card {
    text-align: center;
    padding: var(--woof-space-3);
    background: var(--woof-color-neutral-50);
    border-radius: var(--woof-radius-md);
}

.stat-value {
    font-size: var(--woof-text-title-2);
    font-weight: var(--woof-font-weight-bold);
    color: var(--woof-color-brand-primary);
}

.stat-label {
    font-size: var(--woof-text-caption-2);
    color: var(--woof-color-neutral-500);
    margin-top: 2px;
}

.parks-heading {
    font-size: var(--woof-text-callout);
    font-weight: var(--woof-font-weight-semibold);
    color: var(--woof-color-neutral-800);
    margin: 0 0 var(--woof-space-2);
}

.parks-list {
    display: flex;
    flex-direction: column;
    gap: var(--woof-space-1);
    margin-bottom: var(--woof-space-4);
}

.park-row {
    display: flex;
    align-items: center;
    gap: var(--woof-space-2);
    font-size: var(--woof-text-caption-1);
    padding: var(--woof-space-1) 0;
}

.park-rank {
    font-weight: var(--woof-font-weight-bold);
    color: var(--woof-color-brand-primary);
    width: 20px;
}

.park-name {
    flex: 1;
    color: var(--woof-color-neutral-700);
}

.park-visitors {
    color: var(--woof-color-neutral-400);
    font-size: var(--woof-text-caption-2);
}

.email-cta-wrap {
    text-align: center;
    margin-top: var(--woof-space-4);
}

.email-cta {
    display: inline-block;
    padding: var(--woof-space-3) var(--woof-space-6);
    background: var(--woof-color-brand-primary);
    color: white;
    border: none;
    border-radius: var(--woof-radius-full);
    font-size: var(--woof-text-callout);
    font-weight: var(--woof-font-weight-semibold);
    font-family: inherit;
    cursor: pointer;
}

.email-footer {
    text-align: center;
    padding: var(--woof-space-3);
    font-size: var(--woof-text-caption-2);
    color: var(--woof-color-neutral-400);
    border-top: 1px solid var(--woof-color-neutral-100);
}
</style>
