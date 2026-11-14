<script lang="ts">
    import type {Attachment} from "svelte/attachments";

    // Pulses a screenshot's attention marks for three cycles each time one comes into view, so the motion stops on its
    // own within five seconds. Leaving the view or hiding the tab stops a pulse, and coming back starts it again.
    const pulseMarks: Attachment<HTMLElement> = (marker) => {
        const covers = [...(marker.closest(".screenshot")?.querySelectorAll(".mark-cover") ?? [])];

        // Only a mark that's fully in view and below the sticky header counts as seen
        const observer = new IntersectionObserver(
            (entries) => {
                for (const entry of entries) {
                    entry.target.classList.toggle("pulsing", entry.isIntersecting && !document.hidden);
                }
            },
            {threshold: 1, rootMargin: "-56px 0px 0px 0px"}
        );
        const observe = () => covers.forEach((cover) => observer.observe(cover));
        observe();

        // Observing again when the tab comes back reports whether each mark is in view, which restarts its pulse
        const onVisibility = () => {
            if (document.hidden) {
                covers.forEach((cover) => cover.classList.remove("pulsing"));
            }
            else {
                observer.disconnect();
                observe();
            }
        };
        document.addEventListener("visibilitychange", onVisibility);

        return () => {
            observer.disconnect();
            document.removeEventListener("visibilitychange", onVisibility);
        };
    };
</script>

<span hidden {@attach pulseMarks}></span>
