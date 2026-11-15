// Sätteri hast plugins shared by Markdown and MDX. Registered in astro.config.mjs.

import {defineHastPlugin, type HastNode} from "satteri";

type Element = Extract<HastNode, {type: "element"}>;


const element = (tagName: string, className: string, children: HastNode[] = [], properties = {}) => ({
    type: "element",
    tagName,
    properties: {className: [className], ...properties},
    children
}) as Element;

const text = (value: string) => ({type: "text", value}) as HastNode;

/**
 * The steps of a settings path, or `null` when the text isn't one. A path starts with `Settings > `,
 * or is two or more capitalized names joined by ` > `.
 */
export function settingsPath(code: string) {
    const steps = code.split(" > ");
    if (steps.length < 2) return null;
    const named = steps.every(step => /^[A-Z][^<>`]*$/.test(step) && step.trim() === step);
    return named ? steps : null;
}

/** Inline code that names a settings path becomes a bold path with `›` between the steps */
export const settingsPaths = defineHastPlugin({
    name: "settings-paths",
    element: {
        filter: ["code"],
        visit(node, ctx) {
            const parent = ctx.parent(node);
            if (parent?.type === "element" && parent.tagName === "pre") return;
            const steps = settingsPath(ctx.textContent(node));
            if (!steps) return;
            const children = steps.flatMap((step, i) => (i === 0 ? [text(step)] : [element("span", "sep", [text("›")]), text(step)]));
            ctx.replaceNode(node, element("span", "ui", children));
        }
    }
});

/** Longer words still break anywhere, so a long one can't push a phone's page wider than the screen */
const longestUnbrokenWord = 24;

/**
 * Each hyphenated word in inline code stays on one line, so `--ansi` doesn't break after its first dash.
 * The code still wraps at its spaces.
 */
export const hyphenatedWords = defineHastPlugin({
    name: "hyphenated-words",
    element: {
        filter: ["code"],
        visit(node, ctx) {
            const parent = ctx.parent(node);
            if (parent?.type === "element" && parent.tagName === "pre") return;
            if (!node.children.every(child => child.type === "text")) return;
            const isUnbroken = (word: string) => word.includes("-") && !/\s/.test(word) && word.length <= longestUnbrokenWord;
            const words = ctx.textContent(node).split(/(\s+)/).filter(Boolean);
            if (!words.some(isUnbroken)) return;
            const children = words.map(word => (isUnbroken(word) ? element("span", "word", [text(word)]) : text(word)));
            ctx.replaceNode(node, {...node, children} as Element);
        }
    }
});

/** A `#` link at the end of each H2 and H3. Its `#` comes from CSS, so it stays out of the heading's text. */
export const headingAnchors = defineHastPlugin({
    name: "heading-anchors",
    element: {
        filter: ["h2", "h3"],
        visit(node, ctx) {
            const id = node.properties.id;
            if (typeof id !== "string") return;
            const label = `Link to ${ctx.textContent(node)}`;
            ctx.appendChild(node, element("a", "anchor", [], {href: `#${id}`, ariaLabel: label}));
        }
    }
});

/** Tables scroll inside a box on narrow screens */
export const tableBoxes = defineHastPlugin({
    name: "table-boxes",
    element: {
        filter: ["table"],
        visit(node, ctx) {
            ctx.wrapNode(node, element("div", "tablebox"));
        }
    }
});
