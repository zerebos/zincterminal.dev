// Terminal content as data for the precision close-ups, so `Lines` can render it without stray whitespace under
// `white-space: pre`

export type TermColor =
    | "black" | "red" | "green" | "yellow" | "blue" | "magenta" | "cyan" | "white"
    | "bright-black" | "bright-red" | "bright-green" | "bright-yellow"
    | "bright-blue" | "bright-magenta" | "bright-cyan" | "bright-white";

export interface Powerline {kind: "powerline", segments: Array<[text: string, color: TermColor]>;}
/** Arms are any of l, r, u and d. Width is in cells. */
export interface Box {kind: "box", arms: string, width: number, full: boolean;}
export interface Quadrant {kind: "quad", color?: TermColor;}

export type Segment = string | Powerline | Box | Quadrant;
export type Line = Segment[];

/** A Powerline prompt, each segment flowing into the next */
export const pl = (...segments: Array<[text: string, color: TermColor]>): Powerline => ({kind: "powerline", segments});

/** A box-drawing cell with arms toward l(eft), r(ight), u(p) and d(own), optionally stretched across cells */
export const bx = (arms: string, width = 1): Box => ({kind: "box", arms, width, full: false});

/** A full block */
export const block = (): Box => ({kind: "box", arms: "", width: 1, full: true});

/** The ▚ quadrant, two blocks that share one corner */
export const quad = (color?: TermColor): Quadrant => ({kind: "quad", color});

export const termVar = (color: TermColor) => `var(--term-${color})`;
