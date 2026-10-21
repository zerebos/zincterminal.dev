// Checks the lit-cell tokens against the design handoff's reference pages: every --term-* and --k-* value,
// every contrast ratio and "fill" marker on the palette, and every derived colour's mix.
// design/ isn't tracked, so the whole file skips when the references aren't there.

import {describe, expect, test} from "bun:test";
import {existsSync} from "node:fs";
import {color, contrast, litCell, litCellCss, roles, tokenVar, type VariantId} from "./lit-cell";


const landingPath = "design/reference/landing.dc.html";
const litCellPath = "design/reference/lit-cell.dc.html";
const haveReferences = existsSync(landingPath) && existsSync(litCellPath);

const variants: VariantId[] = ["dark", "light"];
const declarations = (block: string) => new Map([...block.matchAll(/(--[\w-]+):\s*([^;]+)/g)].map(m => [m[1]!, m[2]!.trim().toUpperCase()]));

/** The declarations of one rule in a stylesheet, found by its exact selector. */
function rule(css: string, selector: string) {
    const start = css.indexOf(`${selector}{`);
    if (start < 0) throw new Error(`no rule for ${selector}`);
    return declarations(css.slice(start + selector.length + 1, css.indexOf("}", start)));
}

/** The reference's short --k-* names, mapped to token paths. */
const kNames: Record<string, string> = {
    "--k-bg": "base.background",
    "--k-fg": "base.foreground",
    "--k-cur": "base.cursor",
    "--k-curtx": "base.cursor-text",
    "--k-sel": "base.selection",
    "--k-seltx": "base.selection-text",
    "--k-surface": "ui.surface",
    "--k-raised": "ui.surface-raised",
    "--k-line": "ui.line",
    "--k-sub": "ui.subtext",
    "--k-sm": "tint.search-match",
    "--k-sa": "tint.search-active",
    "--k-dal": "tint.diff-added-line",
    "--k-dat": "tint.diff-added-text",
    "--k-drl": "tint.diff-removed-line",
    "--k-drt": "tint.diff-removed-text"
};
const kPath = (variant: VariantId, name: string) => {
    const slot = name.match(/^--k-c(\d+)$/)?.[1];
    if (slot === undefined) return kNames[name];
    return litCell[variant].colors.ansi.find(c => c.slot === Number(slot))?.path;
};

const landing = haveReferences ? await Bun.file(landingPath).text() : "";
const reference = haveReferences ? await Bun.file(litCellPath).text() : "";
const ours = litCellCss();

describe.skipIf(!haveReferences)("lit-cell tokens match the reference pages", () => {

    test("every --term-* value on both pages", () => {
        for (const html of [landing, reference]) {
            for (const variant of variants) {
                const theirs = rule(html, `[data-theme="${variant}"]`);
                const mine = rule(ours, variant === "dark" ? ":root,[data-theme=\"dark\"]" : "[data-theme=\"light\"]");
                const termVars = [...theirs].filter(([name]) => name.startsWith("--term-"));
                expect(termVars.length).toBeGreaterThan(0);
                for (const [name, value] of termVars) expect({name, value: mine.get(name)}).toEqual({name, value});
            }
        }
    });

    test("every --k-* value on the Lit Cell page", () => {
        for (const variant of variants) {
            const theirs = rule(reference, `.lc-${variant}`);
            const mine = rule(ours, `.lc-${variant}`);
            // 6 base, 16 ANSI, 4 ui and 6 tint colours.
            expect(theirs.size).toBe(32);
            for (const [name, value] of theirs) {
                const path = kPath(variant, name);
                expect({name, path}).toEqual({name, path: expect.any(String) as string});
                expect({name, value: mine.get(tokenVar(path!))}).toEqual({name, value});
            }
        }
    });

    test("palette ratios and fills, to one decimal place", () => {
        // The reference script lists ANSI ratios as ratio: [...] and base colours as base: [[name, hex, ratio], ...],
        // dark first, then light.
        const ansiRatios = [...reference.matchAll(/ratio: \[([^\]]+)\]/g)].map(m => [...m[1]!.matchAll(/'([^']+)'/g)].map(r => r[1]!));
        const baseRows = [...reference.matchAll(/base: \[(\[.+\])\],\n/g)].map(m => [...m[1]!.matchAll(/\['([^']+)', '([^']+)', '([^']*)'\]/g)].map(r => [r[1]!, r[3]!] as const));
        expect(ansiRatios.length).toBe(2);
        expect(baseRows.length).toBe(2);

        variants.forEach((variant, i) => {
            for (const c of litCell[variant].colors.ansi) {
                const theirs = ansiRatios[i]![c.slot!]!;
                const mine = c.use === "fill" ? "fill" : c.ratio!.toFixed(1);
                expect({path: c.path, ratio: mine}).toEqual({path: c.path, ratio: theirs});
            }
            for (const [name, theirs] of baseRows[i]!) {
                const c = color(variant, `base.${name.replace(" ", "-")}`);
                const mine = c.ratio === undefined ? "" : c.ratio.toFixed(1);
                expect({path: c.path, ratio: mine}).toEqual({path: c.path, ratio: theirs.replace(/:1.*$/, "")});
            }
        });
    });

    test("derived colours: value and mix", () => {
        // The reference's derived table rows: [role, "colour, N%", dark hex, light hex].
        const rows = [...reference.matchAll(/\['([\w-]+)', '([\w ]+), (\d+)%', '(#\w+)', '(#\w+)'\]/g)];
        expect(rows.length).toBe(12);
        for (const [, name, mixColor, percent, dark, light] of rows) {
            const group = ["surface", "surface-raised", "line", "subtext"].includes(name!) ? "ui" : "tint";
            for (const [variant, hex] of [["dark", dark], ["light", light]] as const) {
                const c = color(variant, `${group}.${name!}`);
                expect({path: c.path, hex: c.hex}).toEqual({path: c.path, hex: hex!.toUpperCase()});
                expect({path: c.path, amount: Math.round(c.mix!.amount * 100), from: c.mix!.color})
                    .toEqual({path: c.path, amount: Number(percent), from: expect.stringMatching(new RegExp(`\\.${mixColor!.replace(" ", "-")}$`)) as string});
            }
        }
    });
});

describe("lit-cell module", () => {
    test("contrast follows WCAG 2", () => {
        expect(contrast("#000000", "#FFFFFF")).toBeCloseTo(21, 5);
        expect(contrast("#FFFFFF", "#FFFFFF")).toBeCloseTo(1, 5);
    });

    test("every role points at a colour both variants have", () => {
        expect(roles.length).toBeGreaterThan(0);
        for (const r of roles) for (const variant of variants) expect(() => color(variant, r.ref)).not.toThrow();
    });
});
