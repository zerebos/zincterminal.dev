<script lang="ts" generics="T extends string | boolean">
    // A controlled segmented switch... the parent holds the value and updates it from `onchange`
    interface Props {
        options: Array<{value: T, label: string;}>;
        value: T;

        /** Names the group for assistive tech */
        label: string;
        onchange: (value: T) => void;
    }

    const {options, value, label, onchange}: Props = $props();
</script>

<div class="seg" role="group" aria-label={label}>
    {#each options as option (option.label)}
        <button type="button" class={{on: option.value === value}} aria-pressed={option.value === value} onclick={() => onchange(option.value)}>{option.label}</button>
    {/each}
</div>

<style>
    .seg {
        display: inline-flex;
        padding: 3px;
        gap: 2px;
        border: 1px solid var(--line);
        border-radius: 8px;
        background: var(--surface-raised);
        flex-wrap: wrap;
    }

    button {
        height: 38px;
        padding: 0 14px;
        border: 0;
        border-radius: 6px;
        background: transparent;
        color: var(--ink-muted);
        font: 400 14px/20px var(--font-sans);
        cursor: pointer;
        position: relative;
    }

    /* Grows the hit area to 44px tall, reaching into the control's own padding */
    button::before {
        content: "";
        position: absolute;
        inset: -3px 0;
    }

    button.on {
        background: var(--accent-subtle);
        color: var(--ink);
        box-shadow: inset 0 -2px 0 var(--accent);
    }
</style>
