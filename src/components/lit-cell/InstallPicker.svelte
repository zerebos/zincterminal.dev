<script lang="ts">
    import Segmented from "./Segmented.svelte";
    import CopyButton from "../site/CopyButton.svelte";
    import {terminals} from "../../data/lit-cell-install";
    import "../../styles/zn/code.css";

    let selected = $state("ghostty");
    let light = $state(false);

    const terminal = $derived(terminals.find(t => t.id === selected) ?? terminals[0]!);
    const steps = $derived(light ? terminal.steps("lit-cell-light", "Lit Cell Light") : terminal.steps("lit-cell", "Lit Cell"));

    const variants = [
        {value: false, label: "Lit Cell"},
        {value: true, label: "Lit Cell Light"}
    ];

    function pickVariant(value: boolean) {
        light = value;
    }
</script>

<div class="inst">
    <div class="pick">
        <div class="chips" role="group" aria-label="Terminal">
            {#each terminals as t (t.id)}
                <button type="button" class={["chip", {on: t.id === selected}]} aria-pressed={t.id === selected} onclick={() => (selected = t.id)}>{t.name}</button>
            {/each}
        </div>
        <div class="variant">
            <span class="variant-label">Variant</span>
            <Segmented options={variants} value={light} label="Variant" onchange={pickVariant} />
        </div>
    </div>
    <div class="ipanel" aria-live="polite">
        <h3>{terminal.name}</h3>
        {#each steps as step, i (i)}
            <p>{step.text}</p>
            {#if step.code}
                <div class="zn-code">
                    <div class="zn-code-head">
                        <span class="zn-code-name">{step.file}</span>
                        <CopyButton text={step.code} duration={1400} name={`Copy ${step.code}`} />
                    </div>
                    <pre>{step.code}</pre>
                </div>
            {/if}
        {/each}
        <a class="textlink" href={terminal.link.href}>{terminal.link.text}</a>
    </div>
</div>

<style>
    .inst {
        display: grid;
        grid-template-columns: minmax(0, 1fr) minmax(0, 1.2fr);
        gap: 40px;
        margin-top: 40px;
        align-items: start;
    }

    .pick {
        display: flex;
        flex-direction: column;
        gap: 20px;
        min-width: 0;
    }

    .chips {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
    }

    .chip {
        height: 40px;
        padding: 0 14px;
        border: 1px solid var(--line);
        border-radius: 6px;
        background: var(--surface-raised);
        color: var(--ink);
        font: 400 14px/20px var(--font-sans);
        cursor: pointer;
        position: relative;
    }

    /* Grows the hit area to 44px tall without changing how the chip looks */
    .chip::before {
        content: "";
        position: absolute;
        inset: -3px 0;
    }

    .chip.on {
        border-color: var(--accent);
        background: var(--accent-subtle);
        box-shadow: inset 0 0 0 1px var(--accent);
    }

    /* Not in the reference, which let the switch stretch across the column */
    .variant {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        gap: 8px;
    }

    .variant-label {
        font: 400 13px/18px var(--font-sans);
        color: var(--ink-muted);
    }

    .ipanel {
        border: 1px solid var(--line);
        border-radius: 8px;
        background: var(--surface-raised);
        padding: 24px;
        display: flex;
        flex-direction: column;
        gap: 14px;
        min-width: 0;
    }

    h3 {
        margin: 0;
        font: 600 20px/28px var(--font-display);
    }

    p {
        margin: 0;
        color: var(--ink-muted);
    }

    .textlink {
        font: 400 14px/20px var(--font-sans);
        display: inline-flex;
        align-items: center;
        min-height: 44px;
        align-self: flex-start;
    }

    @media (max-width: 900px) {
        .inst {
            grid-template-columns: minmax(0, 1fr);
        }
    }
</style>
