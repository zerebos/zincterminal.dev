export interface TocLink {
    label: string;
    href: string;
}

export interface TocEntry extends TocLink {

    /** Sets the label in mono, as the changelog's build numbers are */
    mono?: boolean;

    /** Muted text at the right, such as a date or a count */
    detail?: string;

    /** Shown nested under the entry, without markers */
    children?: TocLink[];
}
