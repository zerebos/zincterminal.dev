import {describe, expect, test} from "bun:test";
import {satteriHeadingIdsPlugin} from "@astrojs/markdown-satteri";
import {markdownToHtml} from "satteri";
import {fenceTitle} from "./code-meta";
import {headingAnchors, settingsPath, settingsPaths, tableBoxes} from "./plugins";


// The same order as astro.config.mjs
const render = async (markdown: string) => (await markdownToHtml(markdown, {
    features: {headingAttributes: true},
    hastPlugins: [satteriHeadingIdsPlugin(), headingAnchors, settingsPaths, tableBoxes]
})).html;

describe("settingsPath", () => {
    test.each([
        ["Settings > About", ["Settings", "About"]],
        ["Settings > Layout > Panes > Pane style", ["Settings", "Layout", "Panes", "Pane style"]],
        ["Appearance > Font > Ligatures", ["Appearance", "Font", "Ligatures"]],
    ])("reads %s", (code, steps) => {
        expect(settingsPath(code)).toEqual(steps);
    });

    test.each(["Settings", "a > b", "Get-Item > out.txt", "Settings >About", "Settings > `x`", "Settings  > About"])("leaves %s alone", code => {
        expect(settingsPath(code)).toBeNull();
    });
});

describe("the plugins", () => {
    test("turn a settings path into a bold path", async () => {
        expect(await render("Open `Settings > About > Updates`.")).toBe(
            "<p>Open <span class=\"ui\">Settings<span class=\"sep\">›</span>About<span class=\"sep\">›</span>Updates</span>.</p>\n"
        );
    });

    test("leave other inline code and code blocks alone", async () => {
        const html = await render("Run `a > b`.\n\n```\nSettings > About\n```\n");
        expect(html).toContain("<code>a &gt; b</code>");
        expect(html).toContain("Settings &gt; About\n</code></pre>");
        expect(html).not.toContain("class=\"ui\"");
    });

    test("add an anchor to H2 and H3, not H1 or H4", async () => {
        const html = await render("# One\n\n## Two\n\n### Three\n\n#### Four\n");
        expect(html).toContain("<h2 id=\"two\">Two<a class=\"anchor\" href=\"#two\" aria-label=\"Link to Two\"></a></h2>");
        expect(html).toContain("<h3 id=\"three\">Three<a class=\"anchor\" href=\"#three\" aria-label=\"Link to Three\"></a></h3>");
        expect(html).toContain("<h1 id=\"one\">One</h1>");
        expect(html).toContain("<h4 id=\"four\">Four</h4>");
    });

    test("keep an id given with heading attributes", async () => {
        expect(await render("## The zn CLI {#zn}\n")).toContain("<h2 id=\"zn\">The zn CLI<a class=\"anchor\" href=\"#zn\"");
    });

    test("wrap tables in a scroll box", async () => {
        const html = await render("| a |\n|---|\n| 1 |\n");
        expect(html).toStartWith("<div class=\"tablebox\"><table>");
        expect(html.trim()).toEndWith("</table></div>");
    });
});

describe("fenceTitle", () => {
    test.each([
        ["title=\"config.toml\"", "config.toml"],
        ["{1,3} title=\"a b.ps1\"", "a b.ps1"],
        ["", undefined],
        ["subtitle=\"x\"", undefined],
    ])("reads %j", (meta, title) => {
        expect(fenceTitle(meta)).toBe(title);
    });
});
