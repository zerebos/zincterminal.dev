// Terminal mock-up content as data, so Term.astro can render it without stray whitespace under `white-space: pre`

export type TermColor =
    | "black" | "red" | "green" | "yellow" | "blue" | "magenta" | "cyan" | "white"
    | "bright-black" | "bright-red" | "bright-green" | "bright-yellow"
    | "bright-blue" | "bright-magenta" | "bright-cyan" | "bright-white";

/** The bundle's text styles inside .zn-term */
export type TermStyle = "dim" | "ok" | "warn" | "bad" | "info" | "acc" | "mag" | "sel" | "cur";

export interface Styled {kind: "styled", style: TermStyle, text: string;}
export interface Powerline {kind: "powerline", segments: Array<[text: string, color: TermColor]>;}
/** Arms are any of l, r, u and d. Width is in cells. */
export interface Box {kind: "box", arms: string, width: number, full: boolean, style?: TermStyle;}
export interface Quadrant {kind: "quad", color?: TermColor;}
export interface Swatch {kind: "swatch", color: TermColor;}
export interface Ramp {kind: "ramp", style?: TermStyle;}
export interface Gutter {kind: "gutter", mark?: "command" | "failed";}
export interface CursorShape {kind: "cursor", shape: "bar" | "outline" | "underline";}

export type Segment = string | Styled | Powerline | Box | Quadrant | Swatch | Ramp | Gutter | CursorShape;
export type Line = Segment[];

/** Text in one of the term styles */
export const s = (style: TermStyle, text: string): Styled => ({kind: "styled", style, text});

/** A Powerline prompt, each segment flowing into the next */
export const pl = (...segments: Array<[text: string, color: TermColor]>): Powerline => ({kind: "powerline", segments});

/** A box-drawing cell with arms toward l(eft), r(ight), u(p) and d(own), optionally stretched across cells and colored */
export const bx = (arms: string, width = 1, style?: TermStyle): Box => ({kind: "box", arms, width, full: false, style});

/** A full block */
export const block = (): Box => ({kind: "box", arms: "", width: 1, full: true});

/** The ▚ quadrant, two blocks that share one corner */
export const quad = (color?: TermColor): Quadrant => ({kind: "quad", color});

/** Two cells filled with one palette color */
export const swatch = (color: TermColor): Swatch => ({kind: "swatch", color});

/** The 16 palette colors as swatches, black to bright white */
export const palette: TermColor[] = [
    "black", "red", "green", "yellow", "blue", "magenta", "cyan", "white",
    "bright-black", "bright-red", "bright-green", "bright-yellow", "bright-blue", "bright-magenta", "bright-cyan", "bright-white"
];

/** The eight eighth-blocks, ▁ to █, rising across eight cells */
export const ramp = (style?: TermStyle): Ramp => ({kind: "ramp", style});

/** The shell-integration gutter at the start of a line, with a mark where a command starts */
export const gut = (mark?: "command" | "failed"): Gutter => ({kind: "gutter", mark});

/** The block cursor, one cell */
export const cursor = s("cur", " ");

/** The other cursor shapes... a bar, an outlined block or an underline */
export const cursorShape = (shape: CursorShape["shape"]): CursorShape => ({kind: "cursor", shape});

export const termVar = (color: TermColor) => `var(--term-${color})`;

export type AttentionState = "attention" | "caution" | "error";

export interface Workspace {
    name: string;
    icon: "tabs" | "folder";
    selected?: boolean;

    /** One tab wants you, or a count when two or more do */
    dot?: {state: AttentionState, pulse?: boolean;};
    count?: {value: number, state: AttentionState;};

    /** Has a workspace color, which the page sets with `.zn-ws.colored` */
    colored?: boolean;
}

export interface Tab {
    name: string;
    selected?: boolean;

    /** A selected workspace tab sits on the solid backing of the cards area instead of the terminal */
    workspace?: boolean;

    /** What fills the slot at the tab's end */
    slot?: "close" | {dot: "attention" | "caution" | "error", pulse?: boolean;};
}
