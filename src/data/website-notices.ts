// The open-source parts of this website, for the notices page. The texts are read at build time.
import type {Notice} from "../lib/zinc/types";
import astroLicense from "../../node_modules/astro/LICENSE?raw";
import astroPackage from "../../node_modules/astro/package.json";
import geistLicense from "../../public/fonts/OFL-GeistMono.txt?raw";
import litCellLicense from "../../node_modules/lit-cell/LICENSE?raw";
import {links} from "./site";
import svelteLicense from "../../node_modules/svelte/LICENSE.md?raw";
import sveltePackage from "../../node_modules/svelte/package.json";

export const websiteNotices: Notice[] = [
    {
        name: "Astro",
        version: astroPackage.version,
        use: "Builds the site, and loads its interactive parts",
        license: "MIT",
        url: "https://github.com/withastro/astro",
        licenseText: astroLicense.trim()
    },
    {
        name: "Geist Mono",
        version: null,
        use: "The site's monospace font",
        license: "OFL-1.1",
        url: "https://github.com/vercel/geist-font",
        licenseText: geistLicense.trim()
    },
    {
        // Pinned to a commit, so its package version (0.0.0) means nothing
        name: "Lit Cell",
        version: null,
        use: "The colors of the site's terminal samples and code",
        license: "MIT",
        url: links.litCellRepo,
        licenseText: litCellLicense.trim()
    },
    {
        name: "Svelte",
        version: sveltePackage.version,
        use: "The site's interactive parts",
        license: "MIT",
        url: "https://github.com/sveltejs/svelte",
        licenseText: svelteLicense.trim()
    }
];
