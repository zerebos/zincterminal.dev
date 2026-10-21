<script lang="ts">
    import type {NavLink} from "../../data/site";

    const {links}: {links: NavLink[]} = $props();

    const menuId = "site-menu";
    let open = $state(false);
    let wrap: HTMLDivElement | undefined = $state();
    let button: HTMLButtonElement | undefined = $state();

    function close(returnFocus = false) {
        open = false;
        if (returnFocus) button?.focus();
    }

    function onKey(event: KeyboardEvent) {
        if (open && event.key === "Escape") close(true);
    }

    function onDocumentPointer(event: PointerEvent) {
        if (open && wrap && !wrap.contains(event.target as Node)) close();
    }
</script>

<svelte:document onkeydown={onKey} onpointerdown={onDocumentPointer} />

<div class="mobile" bind:this={wrap}>
    <button
        class="menu-btn"
        type="button"
        bind:this={button}
        aria-label="Menu"
        aria-expanded={open}
        aria-controls={menuId}
        onclick={() => (open = !open)}
    >
        <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" aria-hidden="true">
            {#if open}
                <path d="M5 5l10 10M15 5 5 15" />
            {:else}
                <path d="M3 6h14M3 10h14M3 14h14" />
            {/if}
        </svg>
    </button>
    {#if open}
        <nav id={menuId} class="mobmenu" aria-label="Main">
            <ul>
                {#each links as link (link.label)}
                    <li><a href={link.href} aria-current={link.current ? "page" : undefined} onclick={() => close()}>{link.label}</a></li>
                {/each}
            </ul>
        </nav>
    {/if}
</div>

<style>
    .mobile {
        display: none;
    }

    .menu-btn {
        width: 44px;
        height: 44px;
        margin-right: -10px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        border: 0;
        border-radius: 4px;
        background: transparent;
        color: var(--ink);
        cursor: pointer;
    }

    .menu-btn:hover {
        background: var(--accent-subtle);
    }

    .menu-btn svg {
        width: 20px;
        height: 20px;
    }

    /* Under the header row, full width. Solid ground because a nested backdrop blur can't see past the header. */
    .mobmenu {
        position: absolute;
        top: 100%;
        left: 0;
        right: 0;
        background: var(--ground);
        border-top: 1px solid var(--line);
        border-bottom: 1px solid var(--line);
    }

    .mobmenu ul {
        list-style: none;
        margin: 0;
        padding: 8px 16px 16px;
        display: flex;
        flex-direction: column;
    }

    .mobmenu a {
        display: flex;
        align-items: center;
        min-height: 44px;
        padding: 0 8px;
        border-radius: 4px;
        font: 400 16px/24px var(--font-sans);
        color: var(--ink);
        text-decoration: none;
    }

    .mobmenu a:hover,
    .mobmenu a[aria-current="page"] {
        background: var(--accent-subtle);
    }

    @media (max-width: 640px) {
        .mobile {
            display: block;
        }
    }
</style>
