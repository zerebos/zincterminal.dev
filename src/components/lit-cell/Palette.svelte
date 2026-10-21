<script lang="ts">
    import {onDestroy} from "svelte";
    import type {Panel} from "./palette";

    const {panels}: {panels: Panel[]} = $props();

    // One "Copied" at a time, keyed by panel and hex
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
</script>

<div class="pal">
    {#each panels as panel (panel.id)}
        <div class={["palp", `lc-${panel.id}`]}>
            <div class="palh"><b>{panel.name}</b><span>{panel.note}</span></div>
            {#each panel.groups as group (group.label)}
                <div>
                    <p class="swl">{group.label}</p>
                    <div class={["swg", {base: group.base}]}>
                        {#each group.swatches as sw (sw.label)}
                            {@const key = `${panel.id}-${sw.label}`}
                            <div class="swt">
                                <div class="swc" style:background={sw.hex}></div>
                                <div class="swn" title={sw.label}>{sw.label}</div>
                                <button class="hexbtn" type="button" aria-label={`Copy ${sw.name} ${sw.hex}`} onclick={() => copy(key, sw.hex)}>
                                    {copied === key ? "Copied" : sw.hex}
                                </button>
                                <div class="swr">
                                    {#if sw.sample}<span class="aa" style:color={sw.hex}>Aa</span>{/if}
                                    <span>{sw.ratio}</span>
                                </div>
                            </div>
                        {/each}
                    </div>
                </div>
            {/each}
        </div>
    {/each}
</div>
<span class="sr-only" aria-live="polite">{copied ? "Copied" : ""}</span>

<style>
    .pal {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 20px;
        margin-top: 48px;
    }

    .palp {
        padding: 20px;
        border-radius: 8px;
        border: 1px solid var(--lc-ui-line);
        background: var(--lc-base-background);
        color: var(--lc-base-foreground);
        display: flex;
        flex-direction: column;
        gap: 18px;
        min-width: 0;
    }

    .palh {
        display: flex;
        justify-content: space-between;
        align-items: baseline;
        gap: 12px;
        font: 400 13px/18px var(--font-sans);
        color: var(--lc-ui-subtext);
    }

    .palh b {
        font: 600 16px/24px var(--font-display);
        color: var(--lc-base-foreground);
    }

    .swl {
        font: 500 11px/16px var(--font-mono);
        color: var(--lc-ui-subtext);
        margin: 0;
    }

    .swg {
        display: grid;
        grid-template-columns: repeat(8, minmax(0, 1fr));
        gap: 10px;
        margin-top: 8px;
    }

    .swg.base {
        grid-template-columns: repeat(6, minmax(0, 1fr));
    }

    .swt {
        display: flex;
        flex-direction: column;
        gap: 4px;
        min-width: 0;
    }

    .swc {
        height: 40px;
        border-radius: 4px;
        box-shadow: inset 0 0 0 1px var(--lc-ui-line);
    }

    .swn {
        font: 400 11px/14px var(--font-sans);
        color: var(--lc-ui-subtext);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    .hexbtn {
        font: 400 12px/16px var(--font-mono);
        color: var(--lc-base-foreground);
        background: transparent;
        border: 0;
        padding: 2px 4px;
        margin: 0 -4px;
        border-radius: 3px;
        cursor: pointer;
        text-align: left;
        min-height: 24px;
    }

    .hexbtn:hover {
        background: var(--lc-ui-surface-raised);
    }

    .swr {
        display: flex;
        align-items: baseline;
        gap: 6px;
        font: 400 11px/14px var(--font-mono);
        color: var(--lc-ui-subtext);
    }

    .aa {
        font: 600 14px/14px var(--font-sans);
    }

    @media (max-width: 900px) {
        .pal {
            grid-template-columns: minmax(0, 1fr);
        }
    }

    @media (max-width: 640px) {
        .swg {
            grid-template-columns: repeat(4, minmax(0, 1fr));
        }

        .swg.base {
            grid-template-columns: repeat(3, minmax(0, 1fr));
        }
    }
</style>
