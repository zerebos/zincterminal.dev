<script lang="ts">
    /**
     * Marks the contents entry for the section in view with `aria-current`, and opens any `<details>`
     * that a link or the page's hash points into, it doesn't actually render anything.
     */
    const {ids}: {ids: string[]} = $props();

    // A section is in view once its top passes this far down the window
    const line = 0.3;

    let current = $state<string>();
    let frame = 0;

    // Set when a link picks the section, until the reader scrolls on their own. Otherwise a jump
    // near the end of the page would mark the last section instead.
    let held = false;

    function measure() {
        frame = 0;
        if (held) return;
        const atEnd = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2;
        if (atEnd) {
            current = ids.at(-1);
            return;
        }
        let next = ids[0];
        for (const id of ids) {
            const top = document.getElementById(id)?.getBoundingClientRect().top;
            if (top !== undefined && top <= window.innerHeight * line) next = id;
        }
        current = next;
    }

    function schedule() {
        frame ||= requestAnimationFrame(measure);
    }

    /** The section an element is in... itself, or the last section that starts before it */
    function sectionOf(id: string) {
        const target = id ? document.getElementById(id) : null;
        if (!target) return undefined;
        if (ids.includes(id)) return id;
        return ids.filter(section => {
            const start = document.getElementById(section);
            return start && start.compareDocumentPosition(target) & Node.DOCUMENT_POSITION_FOLLOWING;
        }).at(-1);
    }

    /** Marks the section a link went to */
    function hold(id: string) {
        const section = sectionOf(id);
        held = section !== undefined;
        if (held) current = section;
        return held;
    }

    function release() {
        held = false;
        schedule();
    }

    function idFrom(hash: string) {
        try {
            return decodeURIComponent(hash.slice(1));
        }
        catch {
            return "";
        }
    }

    /** Opens every `<details>` around the target, and returns whether any were closed */
    function reveal(id: string) {
        const target = id ? document.getElementById(id) : null;
        let opened = false;
        for (let details = target?.closest("details"); details; details = details.parentElement?.closest("details")) {
            if (!details.open) opened = details.open = true;
        }
        return opened;
    }

    // Runs before the link scrolls, so the target is already open
    function onclick(event: MouseEvent) {
        const link = event.target instanceof Element ? event.target.closest("a") : null;
        if (!link?.hash || link.origin !== location.origin || link.pathname !== location.pathname) return;
        const id = idFrom(link.hash);
        reveal(id);
        hold(id);
    }

    function onhashchange() {
        const id = idFrom(location.hash);
        reveal(id);
        hold(id);
    }

    $effect(() => {
        // A closed target had nowhere to scroll to when the page loaded
        const id = idFrom(location.hash);
        if (reveal(id)) document.getElementById(id)?.scrollIntoView();
        if (!hold(id)) measure();
    });

    $effect(() => {
        for (const link of document.querySelectorAll<HTMLAnchorElement>(".toc a")) {
            if (link.getAttribute("href") === `#${current}`) link.setAttribute("aria-current", "true");
            else link.removeAttribute("aria-current");
        }
    });
</script>

<svelte:window
    onscroll={schedule}
    onresize={schedule}
    {onhashchange}
    onwheel={release}
    ontouchmove={release}
    onkeydown={release}
    onpointerdown={release}
/>
<svelte:document {onclick} />
