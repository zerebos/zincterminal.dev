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

/** Zinc's settings catalog: what the Settings window edits, by section */
export interface SettingsCatalog {
    sections: SettingsSection[];
    settings: Setting[];

    /** Keys that only config.toml sets, with what Zinc tells people about them */
    fileOnly: Array<{key: string, text: string}>;
}

export interface SettingsSection {
    id: string;
    title: string;
}

/** A value as config.toml writes it. `null` means nothing is written. */
export type SettingValue = string | number | boolean | null;

export type SettingKind = "toggle" | "choice" | "number" | "text" | "color" | "font" | "scheme" | "files";

export interface Setting {

    /** The Settings window section's id, such as `appearance` */
    section: string;

    /** The group inside that section, such as `Font` */
    group: string;

    /** Its path in config.toml, such as `font.size` */
    key: string;
    label: string;

    /** Empty when Zinc gives none */
    description: string;
    kind: SettingKind;
    default: SettingValue;
    choices: SettingChoice[];

    /** Shown after a number, or as a text setting's hint */
    unit: string | null;
    minimum: number;

    /** `null` when there's no upper limit */
    maximum: number | null;
    step: number;

    /** Shown in an empty text field */
    placeholder: string | null;

    /** A color setting's "no color" choice, when it isn't the scheme's color */
    nullLabel: string | null;

    /** For text settings: `10` is written as a number, `30s` as a string */
    numbersAsNumbers: boolean;
}

export interface SettingChoice {
    label: string;

    /** `null` is the default, which writes nothing */
    value: SettingValue;
    detail: string | null;
}
