import {defineConfig} from "astro/config";
import mdx from "@astrojs/mdx";
import svelte from "@astrojs/svelte";
import {satteri, satteriHeadingIdsPlugin} from "@astrojs/markdown-satteri";
import {codeMeta} from "./src/lib/markdown/code-meta.ts";
import {codeTheme} from "./src/lib/markdown/code-theme.ts";
import {headingAnchors, settingsPaths, tableBoxes} from "./src/lib/markdown/plugins.ts";


// https://astro.build/config
export default defineConfig({
    site: "https://zincterminal.dev",
    output: "static",
    integrations: [svelte(), mdx()],
    markdown: {
        // Heading ids first, because the anchors link to them
        processor: satteri({
            features: {headingAttributes: true},
            hastPlugins: [satteriHeadingIdsPlugin(), headingAnchors, settingsPaths, tableBoxes]
        }),

        shikiConfig: {theme: codeTheme, transformers: [codeMeta]}
    }
});
