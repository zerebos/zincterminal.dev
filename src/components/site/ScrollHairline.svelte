<script lang="ts">
    // Shows the header's hairline once the page has scrolled
    let scrollY = $state(0);
    let marker: HTMLSpanElement | undefined = $state();

    $effect(() => {
        marker?.closest(".sitenav")?.classList.toggle("scrolled", scrollY > 0);
    });
</script>

<svelte:window bind:scrollY />

<span bind:this={marker} hidden></span>
