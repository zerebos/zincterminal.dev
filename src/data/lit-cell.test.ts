// Checks that src/data/lit-cell.ts reads the lit-cell design tokens correctly and that the tokens hold together.
// It needs nothing outside the repo and its packages.

import {describe, expect, test} from "bun:test";
import {color, contrast, groups, litCell, litCellCss, roles, tokenVar, type VariantId} from "./lit-cell";


const variants: VariantId[] = ["dark", "light"];

const channels = (hex: string) => [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16));
const toHex = (rgb: number[]) => `#${rgb.map(v => v.toString(16).padStart(2, "0")).join("")}`.toUpperCase();

/** Python's round(): halves go to the even neighbour. */
function roundHalfEven(x: number) {
    const floor = Math.floor(x);
    if (x - floor !== 0.5) return Math.round(x);
    return floor % 2 === 0 ? floor : floor + 1;
}

/** lit-cell's mix() from tools/build.py: `amount` of `from` mixed into `into`, in sRGB, rounded per channel. */
function mix(from: string, into: string, amount: number) {
    const a = channels(from);
    const b = channels(into);
    return toHex(a.map((x, i) => roundHalfEven(b[i]! + ((x - b[i]!) * amount))));
}

/** The declarations of one rule in a stylesheet, found by its exact selector. */
function rule(css: string, selector: string) {
    const start = css.indexOf(`${selector}{`);
    if (start < 0) throw new Error(`no rule for ${selector}`);
    const block = css.slice(start + selector.length + 1, css.indexOf("}", start));
    return new Map([...block.matchAll(/(--[\w-]+):([^;]+)/g)].map(m => [m[1]!, m[2]!]));
}


describe("contrast", () => {
    test("follows WCAG 2", () => {
        expect(contrast("#000000", "#FFFFFF")).toBeCloseTo(21, 5);
        expect(contrast("#FFFFFF", "#FFFFFF")).toBeCloseTo(1, 5);
        expect(contrast("#777777", "#FFFFFF")).toBeCloseTo(4.48, 2);
        expect(contrast("#FFFFFF", "#777777")).toBeCloseTo(contrast("#777777", "#FFFFFF"), 10);
    });
});

describe.each(variants)("the %s variant", variant => {
    const v = litCell[variant];

    test("has every group, and ANSI slots 0 to 15 once each", () => {
        for (const group of groups) expect(v.colors[group].length).toBeGreaterThan(0);
        expect(v.colors.ansi.map(c => c.slot).sort((a, b) => a! - b!)).toEqual([...Array(16).keys()]);
    });

    test("gives every text colour a ratio, and nothing else one", () => {
        for (const c of v.byPath.values()) {
            if (c.use === "text") expect({path: c.path, hasRatio: (c.ratio ?? 0) > 1}).toEqual({path: c.path, hasRatio: true});
            else expect({path: c.path, ratio: c.ratio}).toEqual({path: c.path, ratio: undefined});
        }
    });

    test("measures selection text against the selection", () => {
        expect(color(variant, "base.selection-text").ratioOn).toBe("base.selection");
    });

    test("matches every derived colour to its mix recipe", () => {
        const derived = [...v.colors.ui, ...v.colors.tint];
        expect(derived.length).toBeGreaterThan(0);
        for (const c of derived) {
            expect({path: c.path, hasMix: c.mix !== undefined}).toEqual({path: c.path, hasMix: true});
            const {color: from, into, amount} = c.mix!;
            expect({path: c.path, hex: mix(color(variant, from).hex, color(variant, into).hex, amount)}).toEqual({path: c.path, hex: c.hex});
        }
    });
});

describe("roles", () => {
    test("each point at a colour both variants have", () => {
        expect(roles.length).toBeGreaterThan(0);
        for (const r of roles) for (const variant of variants) expect(() => color(variant, r.ref)).not.toThrow();
    });
});

describe("litCellCss", () => {
    const css = litCellCss();

    test("sets all 22 --term-* variables for each site theme", () => {
        for (const [variant, selector] of [["dark", ":root,[data-theme=\"dark\"]"], ["light", "[data-theme=\"light\"]"]] as const) {
            const term = rule(css, selector);
            expect(term.size).toBe(22);
            expect(term.get("--term-bg")).toBe(litCell[variant].background);
            expect(term.get("--term-selection-bg")).toBe(color(variant, "base.selection").hex);
            expect(term.get("--term-bright-white")).toBe(color(variant, "ansi.bright-white").hex);
        }
    });

    test("sets every colour on each scheme class", () => {
        for (const variant of variants) {
            const scheme = rule(css, `.lc-${variant}`);
            const all = [...litCell[variant].byPath.values()];
            expect(scheme.size).toBe(all.length);
            for (const c of all) expect({path: c.path, hex: scheme.get(tokenVar(c.path))}).toEqual({path: c.path, hex: c.hex});
        }
    });

    test("points every role variable at a scheme variable", () => {
        const roleVars = rule(css, ".lc-dark,.lc-light");
        expect(roleVars.size).toBe(roles.length);
        for (const r of roles) expect(roleVars.get(`--lc-role-${r.path.replace(".", "-")}`)).toBe(`var(${tokenVar(r.ref)})`);
    });
});
