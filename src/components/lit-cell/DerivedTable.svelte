<script lang="ts">
    import {onDestroy} from "svelte";
    import type {DerivedRow} from "./palette";

    const {rows}: {rows: DerivedRow[]} = $props();

    // One "Copied" at a time, keyed by variant and role
    let copied = $state<string | null>(null);
    let timer: ReturnType<typeof setTimeout> | undefined;

    async function copy(key: string, hex: string) {
        try {
            await navigator.clipboard.writeText(hex);
        }
        catch {
            // Clipboard access can be denied, and then nothing changes
            return;
        }
        copied = key;
        clearTimeout(timer);
        timer = setTimeout(() => (copied = null), 1400);
    }

    onDestroy(() => clearTimeout(timer));

    const variants = [
        {id: "dark", name: "Lit Cell"},
        {id: "light", name: "Lit Cell Light"}
    ] as const;
</script>

<div class="dgrid" role="table" aria-label="Derived colours">
    <div class="drow dhead" role="row">
        <span role="columnheader">Role</span>
        <span role="columnheader">Mix</span>
        {#each variants as v (v.id)}<span role="columnheader">{v.name}</span>{/each}
    </div>
    {#each rows as row (row.role)}
        <div class="drow" role="row">
            <span class="rl" role="cell">{row.role}</span>
            <span role="cell">{row.mix}</span>
            {#each variants as v (v.id)}
                {@const hex = row[v.id]}
                {@const key = `${v.id}-${row.role}`}
                <span class="dchip" role="cell">
                    <i style:background={hex}></i>
                    <button class="dhex" type="button" aria-label={`Copy ${row.role} for ${v.name}, ${hex}`} onclick={() => copy(key, hex)}>
                        {copied === key ? "Copied" : hex}
                    </button>
                </span>
            {/each}
        </div>
    {/each}
</div>
<span class="sr-only" aria-live="polite">{copied ? "Copied" : ""}</span>

<style>
    .dgrid {
        display: flex;
        flex-direction: column;
        font: 400 13px/18px var(--font-sans);
    }

    .drow {
        display: grid;
        grid-template-columns: minmax(0, 1.3fr) minmax(0, 1fr) minmax(0, 1fr) minmax(0, 1fr);
        gap: 12px;
        align-items: center;
        padding: 6px 0;
        border-bottom: 1px solid var(--line);
        color: var(--ink-muted);
    }

    .dhead {
        font-weight: 600;
        color: var(--ink);
    }

    .rl {
        color: var(--ink);
        font-family: var(--font-mono);
        font-size: 12px;
        overflow-wrap: anywhere;
    }

    .dchip {
        display: inline-flex;
        align-items: center;
        gap: 8px;
    }

    .dchip i {
        width: 18px;
        height: 18px;
        border-radius: 3px;
        box-shadow: inset 0 0 0 1px var(--line);
        flex: none;
    }

    .dhex {
        font: 400 12px/16px var(--font-mono);
        color: var(--ink);
        background: transparent;
        border: 0;
        padding: 2px 4px;
        border-radius: 3px;
        cursor: pointer;
        min-height: 24px;
    }

    .dhex:hover {
        background: var(--accent-subtle);
    }

    @media (max-width: 640px) {
        .drow {
            grid-template-columns: minmax(0, 1.2fr) minmax(0, 1fr) minmax(0, 1fr);
        }

        .drow > :nth-child(2) {
            display: none;
        }
    }
</style>
