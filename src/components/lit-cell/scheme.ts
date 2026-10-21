// Lit Cell sample content as data, rendered by SchemePane without stray whitespace under `white-space: pre`

/** Plain text, or text with space-separated style classes such as "b bold" */
export type Span = string | [style: string, text: string];

export interface SampleLine {
    spans: Span[];

    /** A line number in the gutter */
    no?: number;

    /** The current line, or a whole-line diff tint */
    kind?: "cur" | "add" | "del";
}

export type Sample = Array<Span[] | SampleLine>;

export const isSampleLine = (line: Span[] | SampleLine): line is SampleLine => !Array.isArray(line);
