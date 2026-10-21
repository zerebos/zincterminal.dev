<script lang="ts">
    import {onDestroy} from "svelte";
    import "../../styles/zn/copy.css";

    interface Props {
        text: string;
        label?: string;

        /** How long "Copied" shows, in ms */
        duration?: number;

        /** An accessible name that says what gets copied, when the label alone doesn't */
        name?: string;
    }

    const {text, label = "Copy", duration = 1600, name}: Props = $props();

    let copied = $state(false);
    let timer: ReturnType<typeof setTimeout> | undefined;

    async function copy() {
        try {
            await navigator.clipboard.writeText(text);
        }
        catch {
            // Clipboard access can be denied, and then nothing changes
            return;
        }
        copied = true;
        clearTimeout(timer);
        timer = setTimeout(() => (copied = false), duration);
    }

    onDestroy(() => clearTimeout(timer));
</script>

<button class="zn-copy" type="button" data-state={copied ? "done" : undefined} aria-label={name} onclick={copy}>
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.2" aria-hidden="true">
        <rect x="5.5" y="5.5" width="8" height="8" rx="1" />
        <path d="M10.5 3.5v-1a1 1 0 0 0-1-1h-6a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h1" />
    </svg>
    <span>{copied ? "Copied" : label}</span>
</button>
<span class="sr-only" aria-live="polite">{copied ? "Copied" : ""}</span>
