// The shapes of the JSON that `bun run sync:zinc` writes to src/data/generated

/** One build in Zinc's changelog */
export interface ChangelogEntry {
    version: string;

    /** `YYYY-MM-DD` */
    date: string;

    /** Paragraphs before the first group, as Markdown */
    notes: string[];
    groups: ChangelogGroup[];
}

export interface ChangelogGroup {
    name: string;
    items: ChangelogItem[];
}

export interface ChangelogItem {

    /** Markdown, with continuation lines joined by a space */
    text: string;
    children: string[];
}

/** The newest build in the changelog */
export interface Release {
    version: string;
    date: string;
}

/** A piece of open-source software that ships inside Zinc */
export interface Notice {
    name: string;

    /** `null` when Zinc doesn't give one */
    version: string | null;
    use: string;
    license: string;
    url: string;
    licenseText: string;
}
