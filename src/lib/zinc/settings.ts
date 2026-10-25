// Turns the synced settings catalog into what the config reference shows

import type {Setting, SettingsSection, SettingValue} from "./types";


/** A setting's table in config.toml: `font` for `font.size` */
export const tableOf = (key: string) => key.split(".")[0] ?? key;

/** Whether a profile can set its own value, as Zinc's `ProfileOverridable` decides */
export const perProfile = (key: string) => ["font", "colors", "terminal", "shaders"].includes(tableOf(key));

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

/**
 * The default as a TOML literal (`code`), or in words when nothing is written (`words`). The words
 * come from the "no value" choice or label, then a color's placeholder, which describes it, then
 * "The scheme's" for colors, then "Not set".
 */
export function defaultText(setting: Setting): {code: string} | {words: string} {
    if (setting.default !== null) return {code: tomlLiteral(setting.default)};
    const label = setting.choices.find(c => c.value === null)?.label ?? setting.nullLabel;
    if (label) {
        const words = label.replace(/^Use /, "");
        return {words: words.charAt(0).toUpperCase() + words.slice(1)};
    }
    if (setting.kind === "color") return {words: setting.placeholder ?? "The scheme's"};
    return {words: "Not set"};
}

/**
 * A text setting's placeholder as the value it would write, such as `"50%"` or `0`, or "" when there
 * isn't one or it's the default. Other kinds' placeholders are words, not values.
 */
export function exampleText(setting: Setting) {
    if (setting.kind !== "text" || !setting.placeholder) return "";
    const asNumber = Number(setting.placeholder);
    const value = setting.numbersAsNumbers && setting.placeholder.trim() !== "" && !Number.isNaN(asNumber) ? asNumber : setting.placeholder;
    return value === setting.default ? "" : tomlLiteral(value);
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

/** A choice setting's values table. A color setting with choices also takes any color. */
export function choiceRows(setting: Setting): ChoiceRow[] {
    const rows = setting.choices.map(c => ({
        value: c.value === null ? null : tomlLiteral(c.value),
        label: c.label,
        detail: c.detail ?? "",
        isDefault: c.value === setting.default,
    }));
    if (setting.kind === "color" && rows.length) rows.push({value: "\"#rrggbb\"", label: "Custom color", detail: "", isDefault: false});
    return rows;
}
