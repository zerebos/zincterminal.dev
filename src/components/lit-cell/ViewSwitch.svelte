<script lang="ts">
    import Segmented from "./Segmented.svelte";

    type View = "dark" | "light" | "both";

    // The samples are plain HTML, so this only sets `data-view` on their container and CSS does the rest
    const {target}: {target: string} = $props();

    let view = $state<View>("both");

    const options: Array<{value: View, label: string;}> = [
        {value: "dark", label: "Lit Cell"},
        {value: "light", label: "Lit Cell Light"},
        {value: "both", label: "Side by side"}
    ];

    function show(next: View) {
        view = next;
        const container = document.getElementById(target);
        if (container) container.dataset.view = next;
    }
</script>

<Segmented {options} value={view} label="Show samples in" onchange={show} />
