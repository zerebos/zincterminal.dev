<script lang="ts">
    /**
     * Filters the keys page by text, or by a key combination you press. Each action on the page has a
     * lowercased `data-text` and its default keys in `data-keys`, so this only hides the ones that
     * don't match and the groups left empty.
     */
    import {onMount} from "svelte";
    import {capName, parseKeys} from "../../lib/zinc/keys";
    import type {KeySyntax} from "../../lib/zinc/types";

    const {total, syntax}: {total: number, syntax: KeySyntax} = $props();

    let query = $state("");
    let isListening = $state(false);

    /** The combination last pressed, as `[keys]` writes it, or "" */
    let pressed = $state("");

    // Read from the page once it's here. Until then the field is invisible, so a reader without
    // scripts never sees one that does nothing.
    let rows = $state.raw<Array<{text: string, keys: string[];}>>([]);
    const ready = $derived(rows.length > 0);

    const keyNames = $derived(new Map(syntax.names.map(n => [n.code, n.name])));

    /** A single chord as `[keys]` writes it, modifiers in order, or "" when `text` isn't one */
    function chordFrom(text: string) {
        try {
            const chords = parseKeys(text, syntax);
            if (chords.length !== 1) return "";
            const [chord] = chords;
            return [...syntax.modifiers.filter(m => chord!.modifiers.includes(m)), chord!.key].join(syntax.chordSeparator);
        }
        catch {
            return "";
        }
    }

    const pretty = (chord: string) => chord.split(syntax.chordSeparator).map(capName).join("+");

    const term = $derived(query.trim().toLowerCase());

    // Typed text that reads as a combination with a modifier finds only what it's bound to, as a
    // pressed one does, so `ctrl+w` works when the browser keeps the key and `ctrl+shift+d` doesn't
    // also find `ctrl+shift+down`. A bare key name like `c` stays a word.
    const typedChord = $derived(term.includes(syntax.chordSeparator) ? chordFrom(term) : "");
    const chord = $derived(pressed || typedChord);
    const matches = (row: {text: string, keys: string[];}) => chord ? row.keys.includes(chord) : row.text.includes(term);
    const isFiltering = $derived(Boolean(pressed || term));
    const shown = $derived(isFiltering ? rows.filter(matches).length : total);

    /** Hides the actions that don't match, and the groups left empty */
    function hide(filtering: boolean, test: (row: {text: string, keys: string[];}) => boolean) {
        for (const group of document.querySelectorAll<HTMLElement>(".kgroup")) {
            let any = false;
            for (const entry of group.querySelectorAll<HTMLElement>(".act[id]")) {
                entry.hidden = filtering && !test(rowOf(entry));
                any ||= !entry.hidden;
            }
            group.hidden = !any;
        }
    }

    const rowOf = (entry: HTMLElement) => ({text: entry.dataset.text ?? "", keys: (entry.dataset.keys ?? "").split("|").filter(Boolean)});

    $effect(() => {
        hide(isFiltering, matches);
    });

    onMount(() => {
        rows = [...document.querySelectorAll<HTMLElement>(".kgroup .act[id]")].map(rowOf);
    });

    let input: HTMLInputElement | undefined = $state();

    function toggleListening() {
        isListening = !isListening;
        pressed = "";
        query = "";
        input?.focus();
    }

    function onkeydown(event: KeyboardEvent) {
        if (!isListening) return;
        if (event.key === "Escape" && !event.ctrlKey && !event.altKey && !event.shiftKey) {
            event.preventDefault();
            isListening = false;
            return;
        }

        // A modifier on its own, or a key `[keys]` has no name for, waits for the rest
        const name = keyNames.get(event.code);
        if (!name) return;
        event.preventDefault();
        const held = {ctrl: event.ctrlKey, alt: event.altKey, shift: event.shiftKey} as Record<string, boolean>;
        pressed = [...syntax.modifiers.filter(m => held[m]), name].join(syntax.chordSeparator);
    }

    function oninput(event: Event) {
        if (isListening) return;
        pressed = "";
        query = (event.currentTarget as HTMLInputElement).value;
    }

    /** Clears the filter when `id` is hidden by it, so a link to it has something to land on */
    function uncover(id: string) {
        const target = id ? document.getElementById(id) : null;
        if (!target || target.checkVisibility()) return false;
        query = "";
        pressed = "";

        // Now, not when the effect runs, because the browser scrolls before then
        hide(false, () => true);
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
    <label for="k-q" class="sr-only">Filter actions</label>
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.3" aria-hidden="true"><circle cx="6.5" cy="6.5" r="4.5" /><path d="m10 10 4.5 4.5" /></svg>
    <input
        id="k-q"
        type="search"
        bind:this={input}
        value={pressed ? pretty(pressed) : query}
        placeholder={isListening ? "Press a key combination" : "Filter by name, words or keys, like split or ctrl+shift+d"}
        readonly={isListening}
        aria-describedby={isListening ? "k-hint" : undefined}
        autocomplete="off"
        spellcheck="false"
        {oninput}
        {onkeydown}
    />
    <span class="cfg-count" aria-live="polite">{isFiltering ? `${shown} of ${total}` : `${total} actions`}</span>
    <button class="keybtn" type="button" aria-pressed={isListening} onclick={toggleListening}>
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round" aria-hidden="true"><rect x="1.5" y="4" width="13" height="8" rx="1.5" /><path d="M4 6.5h1M7.5 6.5h1M11 6.5h1M5 9.5h6" /></svg>
        <span class="keybtn-label">{isListening ? "Pressing keys" : "Press keys"}</span>
    </button>
</div>
{#if isListening}
    <p class="keyhint" id="k-hint">Press a key combination to see what it does. Esc stops. A few, like Ctrl+W or Ctrl+T, belong to the browser: type them instead, as <code>ctrl+w</code>.</p>
{/if}
{#if isFiltering && shown === 0}
    <p class="cfg-none">
        {#if chord}
            {pretty(chord)} does nothing by default. Bind it to any action in <code>[keys]</code>.
        {:else}
            No actions match. Try a shorter word.
        {/if}
    </p>
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
        padding: 0 4px 0 14px;
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

    .keybtn {
        position: relative;
        display: inline-flex;
        align-items: center;
        gap: 8px;
        height: 36px;
        padding: 0 12px;
        border: 1px solid var(--line);
        border-radius: 6px;
        background: transparent;
        font: 500 13px/18px var(--font-sans);
        color: var(--ink-muted);
        white-space: nowrap;
        cursor: pointer;
    }

    /* Grows the hit area to 44px without changing how it looks */
    .keybtn::before {
        content: "";
        position: absolute;
        inset: -5px -1px;
    }

    .keybtn svg {
        color: inherit;
    }

    .keybtn:hover {
        color: var(--ink);
        background: var(--accent-subtle);
    }

    .keybtn[aria-pressed="true"] {
        border-color: var(--accent);
        color: var(--ink);
        background: var(--accent-subtle);
    }

    .keybtn:focus-visible {
        outline: 2px solid var(--focus-ring);
        outline-offset: 2px;
    }

    .keyhint {
        margin: 10px 0 0;
        font-size: 13px;
        line-height: 20px;
        color: var(--ink-muted);
    }

    .cfg-none {
        color: var(--ink-muted);
    }

    /* The button keeps its name for screen readers when only its icon shows */
    @media (max-width: 640px) {
        .cfg-filter {
            top: 60px;
            flex-wrap: wrap;
            padding: 4px 4px 4px 14px;
        }

        .keybtn-label {
            position: absolute;
            width: 1px;
            height: 1px;
            overflow: hidden;
            clip-path: inset(50%);
            white-space: nowrap;
        }
    }
</style>
