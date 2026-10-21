<script lang="ts">
    import {onMount} from "svelte";
    import {links} from "../../data/site";
    import "../../styles/zn/button.css";

    const {watch = "hero-download"}: {watch?: string} = $props();

    const headerHeight = 56;

    let shown = $state(false);
    let target: HTMLElement | null = null;

    // Shown once the watched button has scrolled up under the header.
    // Measured on scroll instead of with an IntersectionObserver because a jump down the page skips the viewport and wouldn't trigger it
    function update() {
        if (target) shown = target.getBoundingClientRect().bottom <= headerHeight;
    }

    onMount(() => {
        target = document.getElementById(watch);
        update();
    });
</script>

<svelte:window onscroll={update} onresize={update} />

<a
    class={["zn-btn zn-btn-primary compact", {off: !shown}]}
    href={links.discord}
    aria-hidden={!shown}
    tabindex={shown ? 0 : -1}
>
    Request access
</a>

<style>
    .compact {
        transition: opacity 0.16s ease, transform 0.16s ease, visibility 0.16s;
    }

    /* On phones the hidden button leaves the row, so the theme switch stays next to the menu button.
       `right: 0` keeps it inside the header so it can't widen the page. */
    @media (max-width: 640px) {
        .off {
            position: absolute;
            right: 0;
        }
    }

    .off {
        opacity: 0;
        transform: translateY(-4px);
        pointer-events: none;
        visibility: hidden;
    }
</style>
