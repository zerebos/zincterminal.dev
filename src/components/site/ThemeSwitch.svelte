<script lang="ts">
    import {onMount, tick} from "svelte";

    type Choice = "system" | "dark" | "light";

    const storageKey = "zinc-theme";
    const options: Array<{value: Choice, label: string}> = [
        {value: "system", label: "System"},
        {value: "dark", label: "Dark"},
        {value: "light", label: "Light"}
    ];
    const menuId = "theme-menu";

    // Starts as System because the server can't know the stored choice, the head script already set the page theme
    let choice = $state<Choice>("system");
    let open = $state(false);
    let wrap: HTMLDivElement | undefined = $state();
    let button: HTMLButtonElement | undefined = $state();
    const items: HTMLButtonElement[] = $state([]);

    const current = $derived(options.find(o => o.value === choice) ?? options[0]!);

    const systemQuery = () => matchMedia("(prefers-color-scheme: light)");

    function read(): Choice {
        try {
            const stored = localStorage.getItem(storageKey);
            if (stored === "dark" || stored === "light") return stored;
        }
        catch {
            // Storage can be blocked, which means System
        }
        return "system";
    }

    function apply(value: Choice) {
        const resolved = value === "system" ? (systemQuery().matches ? "light" : "dark") : value;
        document.documentElement.dataset.theme = resolved;
    }

    function pick(value: Choice) {
        choice = value;
        try {
            if (value === "system") localStorage.removeItem(storageKey);
            else localStorage.setItem(storageKey, value);
        }
        catch {
            // The choice still applies for this page
        }
        apply(value);
        close();
    }

    async function show() {
        open = true;
        await tick();
        items[options.findIndex(o => o.value === choice)]?.focus();
    }

    function close(returnFocus = true) {
        if (!open) return;
        open = false;
        if (returnFocus) button?.focus();
    }

    function onMenuKey(event: KeyboardEvent) {
        const index = items.indexOf(document.activeElement as HTMLButtonElement);
        const last = items.length - 1;
        const moves: Record<string, number> = {
            ArrowDown: index >= last ? 0 : index + 1,
            ArrowUp: index <= 0 ? last : index - 1,
            Home: 0,
            End: last
        };
        if (event.key in moves) {
            event.preventDefault();
            items[moves[event.key]!]?.focus();
        }
        else if (event.key === "Escape") {
            event.preventDefault();
            close();
        }
        else if (event.key === "Tab") {
            close(false);
        }
    }

    function onButtonKey(event: KeyboardEvent) {
        if (event.key === "ArrowDown" || event.key === "ArrowUp") {
            event.preventDefault();
            void show();
        }
    }

    function onDocumentPointer(event: PointerEvent) {
        if (open && wrap && !wrap.contains(event.target as Node)) close(false);
    }

    onMount(() => {
        choice = read();

        const query = systemQuery();
        const onSystemChange = () => {
            if (choice === "system") apply("system");
        };
        const onStorage = (event: StorageEvent) => {
            if (event.key !== storageKey && event.key !== null) return;
            choice = read();
            apply(choice);
        };
        query.addEventListener("change", onSystemChange);
        addEventListener("storage", onStorage);
        return () => {
            query.removeEventListener("change", onSystemChange);
            removeEventListener("storage", onStorage);
        };
    });
</script>

<svelte:document onpointerdown={onDocumentPointer} />

{#snippet glyph(value: Choice)}
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        {#if value === "system"}
            <rect x="2.5" y="3.5" width="15" height="10" rx="1.5" />
            <path d="M7 16.5h6M10 13.5v3" />
        {:else if value === "dark"}
            <path d="M16 12.2A6.5 6.5 0 0 1 7.8 4a6.5 6.5 0 1 0 8.2 8.2z" />
        {:else}
            <circle cx="10" cy="10" r="3.2" />
            <path d="M10 2.5v1.8M10 15.7v1.8M2.5 10h1.8M15.7 10h1.8M4.7 4.7l1.3 1.3M14 14l1.3 1.3M4.7 15.3 6 14M14 6l1.3-1.3" />
        {/if}
    </svg>
{/snippet}

<div class="theme-wrap" bind:this={wrap}>
    <button
        class="theme-btn"
        type="button"
        bind:this={button}
        aria-label={`Theme: ${current.label}`}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        onclick={() => (open ? close() : void show())}
        onkeydown={onButtonKey}
    >
        {@render glyph(choice)}
    </button>
    {#if open}
        <div class="theme-menu" id={menuId} role="menu" aria-label="Theme" tabindex="-1" onkeydown={onMenuKey}>
            <div class="theme-label" aria-hidden="true">Theme</div>
            {#each options as option, i (option.value)}
                <button
                    class="theme-item"
                    type="button"
                    role="menuitemradio"
                    aria-checked={option.value === choice}
                    tabindex="-1"
                    bind:this={items[i]}
                    onclick={() => pick(option.value)}
                >
                    {@render glyph(option.value)}
                    <span>{option.label}</span>
                    <svg class="check" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                        <path d="M3.5 8.5l3 3 6-7" />
                    </svg>
                </button>
            {/each}
        </div>
    {/if}
</div>

<style>
    .theme-wrap {
        position: relative;
        flex: none;
    }

    .theme-btn {
        width: 44px;
        height: 44px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        border: 0;
        border-radius: 4px;
        background: transparent;
        color: var(--ink);
        cursor: pointer;
    }

    .theme-btn:hover,
    .theme-btn[aria-expanded="true"] {
        background: var(--accent-subtle);
    }

    .theme-btn :global(svg) {
        width: 20px;
        height: 20px;
    }

    .theme-menu {
        position: absolute;
        top: calc(100% + 6px);
        right: 0;
        z-index: 60;
        min-width: 168px;
        padding: 4px;
        box-sizing: border-box;
        background: var(--surface-raised);
        border: 1px solid var(--line);
        border-radius: var(--radius-md);
        box-shadow: var(--elevation-2);
    }

    .theme-label {
        padding: 8px 10px 4px;
        font: 500 11px/16px var(--font-mono);
        color: var(--ink-muted);
    }

    .theme-item {
        width: 100%;
        min-height: 44px;
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 0 10px;
        border: 0;
        border-radius: var(--radius-sm);
        background: transparent;
        color: var(--ink);
        font: 400 14px/20px var(--font-sans);
        text-align: left;
        cursor: pointer;
    }

    .theme-item:hover,
    .theme-item:focus-visible {
        background: var(--accent-subtle);
    }

    .theme-item :global(svg) {
        width: 16px;
        height: 16px;
        flex: none;
    }

    .theme-item span {
        flex: 1;
    }

    .theme-item .check {
        color: var(--accent-text);
        visibility: hidden;
    }

    .theme-item[aria-checked="true"] .check {
        visibility: visible;
    }
</style>
