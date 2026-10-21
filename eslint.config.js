import {defineConfig} from "eslint/config";
import {build} from "@zerebos/eslint-config-svelte";
import {browser} from "@zerebos/eslint-config";
import ts from "@zerebos/eslint-config-typescript";
import svelteConfig from "./svelte.config.js";

/** @type {import("@zerebos/eslint-config-typescript").ConfigArray} */
export default defineConfig(
    defineConfig(
        ...browser,
        ...ts.configs.recommendedWithTypes
    ),
    ...build(svelteConfig),
    // {
    //     rules: {
    //         "no-console": "off",
    //         "@typescript-eslint/no-misused-promises": ["error", {checksVoidReturn: {arguments: false, returns: false}}],
    //     }
    // }

    // Svelte specific rules can be added here if needed
    {
        rules: {
            "quote-props": ["error", "consistent-as-needed", {keywords: false}],
        }
    },
    {
        ignores: ["node_modules/", "dist/", "public/", ".astro/", ".wrangler/", ".scratch/"]
    }
);