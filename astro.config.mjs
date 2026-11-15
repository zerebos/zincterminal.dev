import {defineConfig} from "astro/config";
import sitemap from "@astrojs/sitemap";
import mdx from "@astrojs/mdx";
import svelte from "@astrojs/svelte";
import {satteri, satteriHeadingIdsPlugin} from "@astrojs/markdown-satteri";
import {codeMeta} from "./src/lib/markdown/code-meta.ts";
import {codeTheme} from "./src/lib/markdown/code-theme.ts";
import {headingAnchors, hyphenatedWords, settingsPaths, tableBoxes} from "./src/lib/markdown/plugins.ts";


// https://astro.build/config
export default defineConfig({
    site: "https://zincterminal.dev",
    output: "static",

    // Pages live at `/docs`, not `/docs/`, which needs `html_handling` in `wrangler.jsonc` to match
    trailingSlash: "never",

    integrations: [svelte(), mdx(), sitemap()],
    markdown: {
        // Heading ids first, because the anchors link to them
        processor: satteri({
            features: {headingAttributes: true},
            hastPlugins: [satteriHeadingIdsPlugin(), headingAnchors, settingsPaths, hyphenatedWords, tableBoxes]
        }),

        shikiConfig: {theme: codeTheme, transformers: [codeMeta]}
    }
});
