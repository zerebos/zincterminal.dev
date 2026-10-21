// The palette panels' data, built from the lit-cell tokens on the server so the island doesn't ship the tokens
import {litCell, type LitCellColor, type VariantId} from "../../data/lit-cell";

export interface Swatch {
    /** Shown under the swatch, with the ANSI slot in front for palette colours */
    label: string;

    /** Used in the copy button's accessible name */
    name: string;
    hex: string;

    /** "13.6:1", "9.3:1 on selection", "fill", or empty when it has no ratio */
    ratio: string;

    /** Shows the "Aa" sample in the colour */
    sample: boolean;
}

export interface Panel {
    id: VariantId;
    name: string;
    note: string;
    groups: Array<{label: string, base: boolean, swatches: Swatch[];}>;
}

const notes: Record<VariantId, string> = {
    dark: "Every colour but black is text-safe",
    light: "White and bright white are fills only"
};

const spaced = (key: string) => key.replace(/-/g, " ");

function swatch(c: LitCellColor): Swatch {
    const name = spaced(c.key);
    const onSelection = c.ratioOn === "base.selection";
    let ratio = "";
    if (c.ratio !== undefined) ratio = `${c.ratio.toFixed(1)}:1${onSelection ? " on selection" : ""}`;
    else if (c.use === "fill") ratio = "fill";
    return {
        label: c.slot === undefined ? name : `${c.slot} ${name}`,
        name,
        hex: c.hex,
        ratio,
        sample: c.ratio !== undefined && !onSelection
    };
}

export function panels(): Panel[] {
    return (["dark", "light"] as const).map(id => {
        const v = litCell[id];
        const ansi = [...v.colors.ansi].sort((a, b) => a.slot! - b.slot!);
        return {
            id,
            name: v.name,
            note: notes[id],
            groups: [
                {label: "Base", base: true, swatches: v.colors.base.map(swatch)},
                {label: "ANSI 0–7", base: false, swatches: ansi.slice(0, 8).map(swatch)},
                {label: "ANSI 8–15, bright", base: false, swatches: ansi.slice(8).map(swatch)}
            ]
        };
    });
}
