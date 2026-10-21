// Shapes the synced changelog entries for the changelog page

import {inlineMarkdown} from "../markdown/inline";
import type {ChangelogEntry, ChangelogGroup} from "./types";


export interface Build {
    version: string;

    /** Its anchor, such as `v0-1-0-dev-393` */
    id: string;

    /** The sidebar label, such as `dev.393` */
    short: string;
    date: string;

    /** Counts per group, such as "5 new · 1 changed · 2 fixed" */
    summary: string;

    /** Paragraphs before the groups, as HTML */
    notes: string[];
    groups: Array<{name: string, items: Array<{html: string, children: string[]}>}>;
}

export const buildId = (version: string) => `v${version.replace(/\W+/g, "-")}`;

/** A prerelease build's label without its release number: `0.1.0-dev.393` is `dev.393` */
export const shortVersion = (version: string) => version.replace(/^\d+\.\d+\.\d+-/, "");

export const countSummary = (groups: ChangelogGroup[]) => groups.map(g => `${g.items.length} ${g.name.toLowerCase()}`).join(" · ");

export function toBuild(entry: ChangelogEntry): Build {
    return {
        version: entry.version,
        id: buildId(entry.version),
        short: shortVersion(entry.version),
        date: entry.date,
        summary: countSummary(entry.groups),
        notes: entry.notes.map(inlineMarkdown),
        groups: entry.groups.map(group => ({
            name: group.name,
            items: group.items.map(item => ({html: inlineMarkdown(item.text), children: item.children.map(inlineMarkdown)}))
        }))
    };
}
