import {describe, expect, test} from "bun:test";
import {inlineMarkdown} from "../markdown/inline";
import {buildId, countSummary, shortVersion, toBuild} from "./builds";


describe("build labels", () => {
    test.each([
        ["0.1.0-dev.393", "v0-1-0-dev-393", "dev.393"],
        ["1.0.0", "v1-0-0", "1.0.0"],
        ["1.2.0-beta.4", "v1-2-0-beta-4", "beta.4"],
    ])("%s", (version, id, short) => {
        expect(buildId(version)).toBe(id);
        expect(shortVersion(version)).toBe(short);
    });

    test("count summaries are lowercase, in the source's order", () => {
        const group = (name: string, n: number) => ({name, items: Array.from({length: n}, () => ({text: "x", children: []}))});
        expect(countSummary([group("New", 5), group("Changed", 1), group("Fixed", 2)])).toBe("5 new · 1 changed · 2 fixed");
        expect(countSummary([group("Less graphics memory", 3)])).toBe("3 less graphics memory");
    });
});

describe("inlineMarkdown", () => {
    test("renders one paragraph without its <p>", () => {
        expect(inlineMarkdown("Use **bold** and `code`.")).toBe("Use <strong>bold</strong> and <code>code</code>.");
    });

    test("turns settings paths into bold paths and curls quotes", () => {
        expect(inlineMarkdown("Set `Settings > About` to \"On\".")).toBe(
            "Set <span class=\"ui\">Settings<span class=\"sep\">›</span>About</span> to “On”."
        );
    });
});

test("toBuild renders every text and keeps the order", () => {
    const build = toBuild({
        version: "0.1.0-dev.5",
        date: "2026-01-02",
        notes: ["The *first* one."],
        groups: [{name: "New", items: [{text: "A `thing`", children: ["**Nested**"]}]}]
    });
    expect(build).toEqual({
        version: "0.1.0-dev.5",
        id: "v0-1-0-dev-5",
        short: "dev.5",
        date: "2026-01-02",
        summary: "1 new",
        notes: ["The <em>first</em> one."],
        groups: [{name: "New", items: [{html: "A <code>thing</code>", children: ["<strong>Nested</strong>"]}]}]
    });
});
