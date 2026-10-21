// Lit Cell, from the W3C design tokens in the lit-cell package (github:zerebos/lit-cell, pinned in bun.lock).
// Everything the site knows about the Lit Cell colors comes from here. The site's --term-* variables,
// the .lc-dark and .lc-light scheme classes, the palette's values and contrast ratios, and the roles.

import darkFile from "lit-cell/tokens/lit-cell.tokens.json";
import lightFile from "lit-cell/tokens/lit-cell-light.tokens.json";
import rolesFile from "lit-cell/tokens/roles.tokens.json";


type Mix = {color: string, into: string, amount: number;};
type Extension = {
    "use"?: "ground" | "text" | "surface" | "fill",
    "slot"?: number,
    "on"?: string,
    "mix"?: Mix,
    "style"?: {bold?: boolean, underline?: "solid" | "wavy" | "dashed" | "dotted";};
};
type RawToken = {"$value": {hex: string;}, "$description"?: string, "$extensions"?: {"dev.zincterminal"?: Extension;};};
type RawRole = {"$value": string, "$description"?: string, "$extensions"?: {"dev.zincterminal"?: Extension;};};
type RawGroup<T> = Record<string, T | string | undefined>;

export const groups = ["base", "ansi", "ui", "tint"] as const;
export type GroupName = typeof groups[number];
export type VariantId = "dark" | "light";

export interface LitCellColor {
    /** Token path, such as "ansi.red" or "tint.diff-added-line". */
    path: string;
    group: GroupName;
    key: string;
    hex: string;
    description: string;
    use?: Extension["use"];
    /** ANSI slot, 0 to 15. */
    slot?: number;
    /** How a derived color is made: a palette color mixed into another by an amount. */
    mix?: Mix;
    /** WCAG contrast ratio, for text colors only: against the background, or against the color it sits on. */
    ratio?: number;
    /** Path of the color the ratio is measured against. */
    ratioOn?: string;
}

export interface LitCellVariant {
    id: VariantId;
    name: string;
    background: string;
    colors: Record<GroupName, LitCellColor[]>;
    byPath: Map<string, LitCellColor>;
}

export interface LitCellRole {
    /** Role path, such as "diff.hunk-header". */
    path: string;
    /** Path of the color it uses, such as "ansi.cyan". */
    ref: string;
    description: string;
    style?: Extension["style"];
}


const isToken = (v: unknown): v is RawToken => typeof v === "object" && v !== null && "$value" in v;
const refPath = (ref: string) => ref.replace(/^\{(.+)\}$/, "$1");

/** WCAG 2 relative luminance of a #RRGGBB color. */
function luminance(hex: string) {
    const channels = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255);
    const [r, g, b] = channels.map(c => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)) as [number, number, number];
    return (0.2126 * r) + (0.7152 * g) + (0.0722 * b);
}

/** WCAG 2 contrast ratio between two #RRGGBB colors. */
export function contrast(a: string, b: string) {
    const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number];
    return (hi + 0.05) / (lo + 0.05);
}

function readVariant(id: VariantId, file: unknown): LitCellVariant {
    const tokens = file as Record<string, unknown> & {"$extensions": {"dev.zincterminal": {name: string;};};};
    const colors = {} as Record<GroupName, LitCellColor[]>;
    const byPath = new Map<string, LitCellColor>();

    for (const group of groups) {
        colors[group] = [];
        for (const [key, raw] of Object.entries(tokens[group] as RawGroup<RawToken>)) {
            if (key.startsWith("$") || !isToken(raw)) continue;
            const ext = raw.$extensions?.["dev.zincterminal"] ?? {};
            const entry: LitCellColor = {
                path: `${group}.${key}`,
                group,
                key,
                hex: raw.$value.hex.toUpperCase(),
                description: raw.$description ?? "",
                use: ext.use,
                slot: ext.slot,
                ratioOn: ext.use === "text" ? refPath(ext.on ?? "{base.background}") : undefined,
                mix: ext.mix && {color: refPath(ext.mix.color), into: refPath(ext.mix.into), amount: ext.mix.amount}
            };
            colors[group].push(entry);
            byPath.set(entry.path, entry);
        }
    }

    for (const entry of byPath.values()) {
        const on = entry.ratioOn && byPath.get(entry.ratioOn);
        if (on) entry.ratio = contrast(entry.hex, on.hex);
    }

    const background = byPath.get("base.background");
    if (!background) throw new Error(`lit-cell ${id}: no base.background token`);
    return {id, name: tokens.$extensions["dev.zincterminal"].name, background: background.hex, colors, byPath};
}

function readRoles(file: unknown): LitCellRole[] {
    const roles: LitCellRole[] = [];
    for (const [group, entries] of Object.entries(file as Record<string, RawGroup<RawRole>>)) {
        if (group.startsWith("$")) continue;
        for (const [key, raw] of Object.entries(entries)) {
            if (key.startsWith("$") || typeof raw !== "object") continue;
            roles.push({
                path: `${group}.${key}`,
                ref: refPath(raw.$value),
                description: raw.$description ?? "",
                style: raw.$extensions?.["dev.zincterminal"]?.style
            });
        }
    }
    return roles;
}


export const litCell: Record<VariantId, LitCellVariant> = {
    dark: readVariant("dark", darkFile),
    light: readVariant("light", lightFile)
};

export const roles = readRoles(rolesFile);

/** A color by token path, such as color("light", "ansi.white"). Throws for an unknown path. */
export function color(variant: VariantId, path: string) {
    const found = litCell[variant].byPath.get(path);
    if (!found) throw new Error(`lit-cell ${variant}: no token at ${path}`);
    return found;
}

/** A role by path, such as role("diff.hunk-header"). Throws for an unknown path. */
export function role(path: string) {
    const found = roles.find(r => r.path === path);
    if (!found) throw new Error(`lit-cell: no role at ${path}`);
    return found;
}


/** CSS variable for a token path: "tint.diff-added-line" becomes --lc-tint-diff-added-line. */
export const tokenVar = (path: string) => `--lc-${path.replace(".", "-")}`;

/** CSS variable for a role path: "diff.hunk-header" becomes --lc-role-diff-hunk-header. */
export const roleVar = (path: string) => `--lc-role-${path.replace(".", "-")}`;

/**
 * The site's terminal colors, by the names the design handoff uses. Lit Cell fills them in the
 * dark site theme and Lit Cell Light in the light one.
 */
const termNames: Record<string, string> = {
    "base.background": "--term-bg",
    "base.foreground": "--term-fg",
    "base.cursor": "--term-cursor",
    "base.cursor-text": "--term-cursor-text",
    "base.selection": "--term-selection-bg",
    "base.selection-text": "--term-selection-fg"
};
const termVar = (c: LitCellColor) => termNames[c.path] ?? (c.group === "ansi" ? `--term-${c.key}` : undefined);

/*
 * The Lit Cell reference page used short names for the scheme variables. They map onto these:
 * --k-bg base-background, --k-fg base-foreground, --k-cur base-cursor, --k-curtx base-cursor-text,
 * --k-sel base-selection, --k-seltx base-selection-text, --k-c0 to --k-c15 the ANSI slots,
 * --k-surface ui-surface, --k-raised ui-surface-raised, --k-line ui-line, --k-sub ui-subtext,
 * --k-sm tint-search-match, --k-sa tint-search-active, --k-dal and --k-dat tint-diff-added-line and -text,
 * --k-drl and --k-drt tint-diff-removed-line and -text.
 */

/** The stylesheet that LitCellVars.astro puts in the page's <head>. */
export function litCellCss() {
    const block = (selector: string, decls: string[]) => `${selector}{${decls.join(";")}}`;
    const all = (v: LitCellVariant) => groups.flatMap(g => v.colors[g]);

    const term = (v: LitCellVariant) => all(v).flatMap(c => {
        const name = termVar(c);
        return name ? [`${name}:${c.hex}`] : [];
    });
    const scheme = (v: LitCellVariant) => all(v).map(c => `${tokenVar(c.path)}:${c.hex}`);
    const roleDecls = roles.map(r => `${roleVar(r.path)}:var(${tokenVar(r.ref)})`);

    return [
        block(":root,[data-theme=\"dark\"]", term(litCell.dark)),
        block("[data-theme=\"light\"]", term(litCell.light)),
        block(".lc-dark", scheme(litCell.dark)),
        block(".lc-light", scheme(litCell.light)),
        block(".lc-dark,.lc-light", roleDecls)
    ].join("\n");
}
