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
