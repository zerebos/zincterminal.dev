import type {Notice} from "./zinc/types";


/**
 * A notice row's anchor, from its name without any parenthetical. "Ghostty (libghostty-vt)" is
 * `ghostty`, and ".NET" is `dotnet`.
 */
export function noticeId(name: string) {
    return name
        .replace(/\s*\(.*?\)/g, "")
        .replace(/^\./, "dot")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
}

/** A URL as link text, without the scheme or a trailing slash */
export const displayUrl = (url: string) => url.replace(/^https?:\/\//, "").replace(/\/$/, "");

/**
 * The components Zinc ships, without Zinc's own entry. Throws when there's no entry named Zinc, so a
 * renamed one can't end up in the third-party list.
 */
export function thirdPartyNotices(notices: Notice[]) {
    if (!notices.some(n => n.name === "Zinc")) throw new Error("The synced notices have no entry named Zinc, which /notices leaves out. Check zinc-notices.json.");
    return notices.filter(n => n.name !== "Zinc");
}
