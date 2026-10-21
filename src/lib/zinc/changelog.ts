// Parses Zinc's CHANGELOG.md. It throws on any line it doesn't understand, so a new shape in the
// source shows up at sync time instead of as a gap on the page.

import type {ChangelogEntry, ChangelogItem, Release} from "./types";


const entryHeading = /^## (\S+) \((\d{4}-\d{2}-\d{2})\)$/;

function fail(lineNumber: number, line: string, why: string): never {
    throw new Error(`CHANGELOG.md line ${lineNumber}: ${why}\n  ${line}`);
}

export function parseChangelog(source: string): ChangelogEntry[] {
    const entries: ChangelogEntry[] = [];
    let entry: ChangelogEntry | null = null;
    let item: ChangelogItem | null = null;
    let inParagraph = false;

    const lines = source.replace(/\r\n?/g, "\n").split("\n");
    for (const [i, line] of lines.entries()) {
        const no = i + 1;

        if (line.startsWith("## ")) {
            item = null;
            inParagraph = false;
            if (/^## Unreleased\s*$/i.test(line)) {
                entry = null;
                continue;
            }
            const [, version = "", date = ""] = entryHeading.exec(line) ?? fail(no, line, "expected \"## <version> (<YYYY-MM-DD>)\"");
            if (entries.some(e => e.version === version)) fail(no, line, `${version} appears twice`);
            entry = {version, date, notes: [], groups: []};
            entries.push(entry);
            continue;
        }

        // The preamble and Unreleased
        if (!entry) continue;

        if (line.trim() === "") {
            inParagraph = false;
            continue;
        }

        if (line.startsWith("### ")) {
            item = null;
            inParagraph = false;
            entry.groups.push({name: line.slice(4).trim(), items: []});
            continue;
        }

        const group = entry.groups.at(-1);

        if (line.startsWith("- ")) {
            if (!group) fail(no, line, "an item before any \"### \" group");
            item = {text: line.slice(2).trim(), children: []};
            group.items.push(item);
            continue;
        }

        const indent = line.length - line.trimStart().length;
        const text = line.trim();

        if (indent === 2 && text.startsWith("- ")) {
            if (!item) fail(no, line, "a nested item outside an item");
            item.children.push(text.slice(2).trim());
            continue;
        }

        if (indent >= 4) {
            if (!item?.children.length) fail(no, line, "a continuation line with no nested item to continue");
            item.children[item.children.length - 1] += ` ${text}`;
            continue;
        }

        if (indent >= 2) {
            if (!item) fail(no, line, "a continuation line outside an item");
            if (item.children.length) fail(no, line, "a continuation of an item after its nested items");
            item.text += ` ${text}`;
            continue;
        }

        // Unindented text is a paragraph, allowed only before the first group
        if (group) fail(no, line, "a paragraph inside a group");
        if (inParagraph) entry.notes[entry.notes.length - 1] += ` ${text}`;
        else entry.notes.push(text);
        inParagraph = true;
    }

    for (const e of entries) {
        if (e.groups.length === 0 && e.notes.length === 0) throw new Error(`CHANGELOG.md: ${e.version} is empty`);
        for (const g of e.groups) {
            if (g.items.length === 0) throw new Error(`CHANGELOG.md: ${e.version}'s "${g.name}" group is empty`);
        }
    }

    return entries;
}

/** The newest build, which is the first entry after Unreleased */
export function latestRelease(entries: ChangelogEntry[]): Release {
    const newest = entries[0];
    if (!newest) throw new Error("CHANGELOG.md has no released versions");
    return {version: newest.version, date: newest.date};
}
