// Turns the synced settings catalog into what the config reference shows

import type {Setting, SettingsSection, SettingValue} from "./types";


/** A setting's table in config.toml: `font` for `font.size` */
export const tableOf = (key: string) => key.split(".")[0] ?? key;

/**
 * The settings grouped by table, in the order `tables` gives. Throws when the catalog has a table
 * that isn't listed, or a listed table has no settings, so the two can't drift apart.
 */
export function byTable<T extends {table: string}>(settings: Setting[], tables: T[]) {
    const listed = new Set(tables.map(t => t.table));
    const missing = [...new Set(settings.map(s => tableOf(s.key)))].filter(table => !listed.has(table));
    if (missing.length) throw new Error(`The config reference has no title for ${missing.map(t => `[${t}]`).join(", ")}. Add it to src/data/config-tables.ts.`);

    return tables.map(table => {
        const entries = settings.filter(s => tableOf(s.key) === table.table);
        if (entries.length === 0) throw new Error(`[${table.table}] has no settings in Zinc's catalog. Remove it from src/data/config-tables.ts.`);
        return {...table, settings: entries};
    });
}

const kindWords: Record<Setting["kind"], string> = {
    toggle: "On or off",
    choice: "Choice",
    number: "Number",
    text: "Text",
    color: "Color",
    font: "Font family",
    scheme: "Scheme name, or a light and dark pair",
    files: "List of files",
};

/** What a setting takes, in words, such as "On or off" */
export function kindText(setting: Setting) {
    if (setting.kind === "color" && setting.choices.length) return "Choice or color";
    if (setting.kind === "text" && setting.numbersAsNumbers) return "Number or text";
    return kindWords[setting.kind];
}

const number = (n: number) => n.toLocaleString("en-US", {maximumFractionDigits: 6});

/** A number setting's range, such as "4 to 72 pt, in steps of 0.5", or "" for other kinds */
export function rangeText(setting: Setting) {
    if (setting.kind !== "number") return "";
    const unit = !setting.unit ? "" : setting.unit === "%" ? "%" : ` ${setting.unit}`;
    const range = setting.maximum === null ? `${number(setting.minimum)}${unit} or more` : `${number(setting.minimum)} to ${number(setting.maximum)}${unit}`;
    return setting.step === 1 ? range : `${range}, in steps of ${number(setting.step)}`;
}

/** A value as config.toml writes it: `"normal"`, `10.5`, `true` */
export function tomlLiteral(value: Exclude<SettingValue, null>) {
    return typeof value === "string" ? JSON.stringify(value) : String(value);
}

/** A text setting's field text as the TOML literal it writes: `0` or `"50%"` */
function textLiteral(setting: Setting, text: string) {
    const asNumber = Number(text);
    return tomlLiteral(setting.numbersAsNumbers && text.trim() !== "" && !Number.isNaN(asNumber) ? asNumber : text);
}

/**
 * The default as a TOML literal (`code`), or in words (`words`). Zinc's words come first, then the
 * value. When nothing is written, the words come from the "no value" choice or label, a color's
 * placeholder, which describes it, or "The scheme's". A text setting's placeholder is its default
 * unless Zinc marks it as an example. Anything else is "Not set".
 */
export function defaultText(setting: Setting): {code: string} | {words: string} {
    if (setting.defaultText) return {words: setting.defaultText};
    if (setting.default !== null) return {code: tomlLiteral(setting.default)};
    const label = setting.choices.find(c => c.value === null)?.label ?? setting.nullLabel;
    if (label) {
        const words = label.replace(/^Use /, "");
        return {words: words.charAt(0).toUpperCase() + words.slice(1)};
    }
    if (setting.kind === "color") return {words: setting.placeholder ?? "The scheme's"};
    if (setting.kind === "text" && setting.placeholder && setting.example === null) return {code: textLiteral(setting, setting.placeholder)};
    return {words: "Not set"};
}

/** The example Zinc gives as the value it would write, such as `"Symbols Nerd Font"`, or "" when there's none */
export function exampleText(setting: Setting) {
    return setting.example ? textLiteral(setting, setting.example) : "";
}

/**
 * The sentence that says a profile can set a table's settings, or "" when it can't. Throws when only
 * some of the table's settings are per profile, because one sentence can't say that.
 */
export function perProfileText(table: string, settings: Setting[]) {
    const perProfile = settings.filter(s => s.profileOverridable).length;
    if (perProfile === 0) return "";
    if (perProfile < settings.length) {
        throw new Error(`Only some of [${table}]'s settings are per profile, so its opening line can't say whether a profile can set them. Give [${table}] its own wording in src/pages/docs/config.astro.`);
    }
    return `A profile can set its own, under \`[profile.<id>.${table}]\`.`;
}

/** Where a setting is in the Settings window, step by step: Settings, Appearance, Font */
export function settingsPath(setting: Setting, sections: SettingsSection[]) {
    const section = sections.find(s => s.id === setting.section)?.title ?? setting.section;
    return ["Settings", section, setting.group];
}

/** For each setting whose choices repeat an earlier one's, the key of that earlier setting */
export function sameValuesAs(settings: Setting[]) {
    const first = new Map<string, string>();
    const same = new Map<string, string>();
    for (const setting of settings) {
        if (setting.choices.length === 0) continue;
        const values = JSON.stringify(setting.choices);
        const earlier = first.get(values);
        if (earlier) same.set(setting.key, earlier);
        else first.set(values, setting.key);
    }
    return same;
}

export interface ChoiceRow {

    /** A TOML literal, or `null` for the choice that writes nothing */
    value: string | null;
    label: string;
    detail: string;
    isDefault: boolean;
}

/** A choice setting's values table. A color setting with choices also takes any color, under `customLabel`. */
export function choiceRows(setting: Setting, customLabel: string): ChoiceRow[] {
    const rows = setting.choices.map(c => ({
        value: c.value === null ? null : tomlLiteral(c.value),
        label: c.label,
        detail: c.detail ?? "",
        isDefault: c.value === setting.default,
    }));
    if (setting.kind === "color" && rows.length) rows.push({value: "\"#rrggbb\"", label: customLabel, detail: "", isDefault: false});
    return rows;
}

export interface TextPart {
    text: string;
    isCode: boolean;
}

/**
 * A description split into plain text and code spans, by Zinc's own rule: a backtick opens a span
 * and the next one closes it, and a backtick with no partner, as in "Win+`", stays as text. The
 * backticks themselves are dropped, and an empty pair (``) leaves nothing.
 */
export function codeSpans(text: string): TextPart[] {
    const parts: TextPart[] = [];
    let start = 0;
    while (start < text.length) {
        const open = text.indexOf("`", start);
        const close = open < 0 ? -1 : text.indexOf("`", open + 1);
        if (close < 0) {
            parts.push({text: text.slice(start), isCode: false});
            break;
        }
        if (open > start) parts.push({text: text.slice(start, open), isCode: false});
        if (close > open + 1) parts.push({text: text.slice(open + 1, close), isCode: true});
        start = close + 1;
    }
    return parts;
}

/** A description without its code spans' backticks, for search */
export const plainText = (text: string) => codeSpans(text).map(part => part.text).join("");
