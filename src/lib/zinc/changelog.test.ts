import {describe, expect, test} from "bun:test";
import {latestRelease, parseChangelog} from "./changelog";


const entry = (body: string) => `## 1.0.0 (2026-01-01)\n\n${body}`;

describe("parseChangelog", () => {
    test("skips the preamble and Unreleased", () => {
        const entries = parseChangelog("# Changelog\n\n- intro\n\n## Unreleased\n\n### Fixed\n- soon\n\n" + entry("### New\n- shipped\n"));
        expect(entries).toEqual([{version: "1.0.0", date: "2026-01-01", notes: [], groups: [{name: "New", items: [{text: "shipped", children: []}]}]}]);
    });

    test("joins continuation lines onto items and nested items", () => {
        const [e] = parseChangelog(entry("### New\n- one\n  two\n  - child\n    more\n  - second child\n- next\n"));
        expect(e?.groups[0]?.items).toEqual([
            {text: "one two", children: ["child more", "second child"]},
            {text: "next", children: []},
        ]);
    });

    test("keeps paragraphs before the first group as notes", () => {
        const [e] = parseChangelog(entry("First line\nsame paragraph.\n\nSecond.\n"));
        expect(e?.notes).toEqual(["First line same paragraph.", "Second."]);
        expect(e?.groups).toEqual([]);
    });

    test("reads CRLF line ends", () => {
        const [e] = parseChangelog(entry("### Fixed\r\n- a\r\n  b\r\n").replace(/\n/g, "\r\n"));
        expect(e?.groups[0]?.items[0]?.text).toBe("a b");
    });

    test("keeps group names and the order of entries", () => {
        const entries = parseChangelog(`${entry("### Odd name\n- x\n")}\n## 0.9.0 (2025-12-31)\n\n### Fixed\n- y\n`);
        expect(entries.map(e => e.version)).toEqual(["1.0.0", "0.9.0"]);
        expect(entries[0]?.groups[0]?.name).toBe("Odd name");
    });

    test.each([
        ["a heading with no date", "## 1.0.0\n\n### New\n- x\n", /line 1: expected/],
        ["a repeated version", `${entry("### New\n- x\n")}\n${entry("### New\n- y\n")}`, /1\.0\.0 appears twice/],
        ["an item before a group", entry("- x\n"), /before any "### " group/],
        ["a paragraph inside a group", entry("### New\n- x\n\nA paragraph.\n"), /paragraph inside a group/],
        ["an item continued after its children", entry("### New\n- x\n  - child\n  more\n"), /after its nested items/],
        ["an empty group", entry("### New\n\n### Fixed\n- x\n"), /"New" group is empty/],
        ["an empty entry", entry(""), /1\.0\.0 is empty/],
    ])("throws on %s", (_, source, error) => {
        expect(() => parseChangelog(source)).toThrow(error);
    });
});

describe("latestRelease", () => {
    test("is the first released entry", () => {
        const entries = parseChangelog(`## Unreleased\n\n### New\n- x\n\n${entry("### New\n- y\n")}`);
        expect(latestRelease(entries)).toEqual({version: "1.0.0", date: "2026-01-01"});
    });

    test("throws with no releases", () => {
        expect(() => latestRelease(parseChangelog("# Changelog\n\n## Unreleased\n\n### New\n- x\n"))).toThrow(/no released versions/);
    });
});
