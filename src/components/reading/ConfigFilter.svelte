<script lang="ts">
    /**
     * Filters the config reference as you type. The settings are already on the page, each with a
     * lowercased `data-text`, so this only hides the ones that don't match and the tables left empty.
     */
    import {onMount} from "svelte";

    const {total, guide}: {total: number, guide: string} = $props();

    let query = $state("");

    // Read from the page once it's here. Until then the field is invisible, so a reader without
    // scripts never sees one that does nothing.
    let texts = $state.raw<string[]>([]);
    const ready = $derived(texts.length > 0);

    const term = $derived(query.trim().toLowerCase());
    const shown = $derived(term ? texts.filter(text => text.includes(term)).length : total);

    /** Hides the settings that don't match `text`, and the tables left empty */
    function hide(text: string) {
        for (const table of document.querySelectorAll<HTMLElement>(".cfg-table")) {
            let any = false;
            for (const entry of table.querySelectorAll<HTMLElement>(".cfg")) {
                entry.hidden = Boolean(text) && !(entry.dataset.text ?? "").includes(text);
                any ||= !entry.hidden;
            }
            table.hidden = !any;
        }
    }

    $effect(() => {
        hide(term);
    });

    onMount(() => {
        texts = [...document.querySelectorAll<HTMLElement>(".cfg")].map(entry => entry.dataset.text ?? "");
    });

    /** Clears the filter when `id` is hidden by it, so a link to it has something to land on */
    function uncover(id: string) {
        const target = id ? document.getElementById(id) : null;
        if (!target || target.checkVisibility()) return false;
        query = "";

        // Now, not when the effect runs, because the browser scrolls before then
        hide("");
        return true;
    }

    function idFrom(hash: string) {
        try {
            return decodeURIComponent(hash.slice(1));
        }
        catch {
            return "";
        }
    }

    // Runs before the link scrolls, so the target is back on the page
    function onclick(event: MouseEvent) {
        const link = event.target instanceof Element ? event.target.closest("a") : null;
        if (!link?.hash || link.origin !== location.origin || link.pathname !== location.pathname) return;
        uncover(idFrom(link.hash));
    }

    function onhashchange() {
        const id = idFrom(location.hash);
        if (uncover(id)) document.getElementById(id)?.scrollIntoView();
    }
</script>

<svelte:window {onhashchange} />
<svelte:document {onclick} />

<div class={["cfg-filter", {ready}]}>
    <label for="cfg-q" class="sr-only">Filter settings</label>
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.3" aria-hidden="true"><circle cx="6.5" cy="6.5" r="4.5" /><path d="m10 10 4.5 4.5" /></svg>
    <input id="cfg-q" type="search" placeholder="Filter by key, name or words, like cursor or opacity" autocomplete="off" spellcheck="false" bind:value={query} />
    <span class="cfg-count" aria-live="polite">{term ? `${shown} of ${total}` : `${total} settings`}</span>
</div>
{#if term && shown === 0}
    <p class="cfg-none">No settings match “{query.trim()}”. Try a shorter word, or <a href={guide}>read the guide</a>.</p>
{/if}

<style>
    .cfg-filter {
        position: sticky;
        top: 64px;
        z-index: 5;
        display: flex;
        align-items: center;
        gap: 10px;
        min-height: 44px;
        margin: 32px 0 0;
        padding: 0 14px;
        border: 1px solid var(--line);
        border-radius: 8px;
        background: var(--surface-raised);
        box-shadow: var(--elevation-1);
        visibility: hidden;
    }

    .cfg-filter.ready {
        visibility: visible;
    }

    .cfg-filter:focus-within {
        outline: 2px solid var(--focus-ring);
        outline-offset: 2px;
    }

    svg {
        width: 16px;
        height: 16px;
        flex: none;
        color: var(--ink-muted);
    }

    input {
        flex: 1;
        min-width: 0;
        height: 42px;
        border: 0;
        background: transparent;
        font: 400 15px/22px var(--font-sans);
        color: var(--ink);
        outline: none;
    }

    input::placeholder {
        color: var(--ink-muted);
    }

    .cfg-count {
        font: 500 12px/16px var(--font-mono);
        color: var(--ink-muted);
        white-space: nowrap;
    }

    .cfg-none {
        color: var(--ink-muted);
    }

    @media (max-width: 640px) {
        .cfg-filter {
            top: 60px;
        }
    }
</style>
