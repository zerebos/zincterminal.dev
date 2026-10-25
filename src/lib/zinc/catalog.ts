// Parses Zinc's SettingsCatalog.cs: the sections, the settings the window edits (`All`), the shells it
// looks for (`Discovery`) and the keys only config.toml sets (`FileOnly`). Names it can't resolve,
// unknown kinds and unknown properties throw, so a new shape in Zinc stops the sync.

import {Scanner, type Value} from "./csharp";
import type {Setting, SettingChoice, SettingKind, SettingsCatalog, SettingValue} from "./types";


const kinds: Record<string, SettingKind> = {
    "SettingKind.Toggle": "toggle",
    "SettingKind.Choice": "choice",
    "SettingKind.Number": "number",
    "SettingKind.Text": "text",
    "SettingKind.Color": "color",
    "SettingKind.Font": "font",
    "SettingKind.Scheme": "scheme",
    "SettingKind.Files": "files",
};

/** The `public const` numbers in a C# file, keyed as `Class.Name` */
export function parseConstants(source: string, className: string): Record<string, number> {
    const constants: Record<string, number> = {};
    for (const match of source.matchAll(/public const (?:int|long|float|double) (\w+) = (-?[\d_.]+)[LlDdFf]?;/g)) {
        constants[`${className}.${match[1]}`] = Number(match[2]!.replace(/_/g, ""));
    }
    return constants;
}

export function parseCatalog(source: string, constants: Record<string, number> = {}): SettingsCatalog {
    // Typed so its `never`-returning `fail` narrows types
    const scanner: Scanner = new Scanner(source, "SettingsCatalog.cs");

    // Choice lists shared by several settings, such as `NotifyChoices`
    const shared: Record<string, Value> = {};
    for (const match of scanner.src.matchAll(/private static readonly SettingChoice\[\] (\w+) =/g)) {
        scanner.pos = match.index + match[0].length;
        shared[match[1]!] = scanner.value();
    }

    const property = (name: string) => {
        scanner.seek(new RegExp(`\\b${name}\\s*\\{\\s*get;\\s*\\}\\s*=\\s*`), `no \`${name} { get; } =\` list`);
    };

    const string = (value: Value | undefined, what: string) => {
        if (value?.kind !== "string") scanner.fail(`${what} must be a string literal`);
        return value.value;
    };

    const number = (value: Value | undefined, what: string): number | null => {
        if (value?.kind === "number") return value.value;
        if (value?.kind === "name" && value.value === "double.MaxValue") return null;
        if (value?.kind === "name" && value.value in constants) return constants[value.value]!;
        scanner.fail(`${what} must be a number or a known constant`);
    };

    const toml = (value: Value | undefined, what: string): SettingValue => {
        if (value?.kind === "string" || value?.kind === "bool") return value.value;
        if (value?.kind === "null") return null;
        return number(value, what);
    };

    const choices = (value: Value, key: string): SettingChoice[] => {
        const list = value.kind === "name" ? shared[value.value] : value;
        if (list?.kind !== "array") scanner.fail(`${key}'s choices must be a list or a shared choice list`);
        return list.items.map(item => {
            if (item.kind !== "new" || item.args.length < 2 || item.args.length > 3) scanner.fail(`${key} has a choice that isn't \`new(label, value, detail?)\``);
            const [label, choice, detail] = item.args;
            return {
                label: string(label, `${key}'s choice label`),
                value: toml(choice, `${key}'s choice value`),
                detail: detail ? string(detail, `${key}'s choice detail`) : null,
            };
        });
    };

    const settings = (name: string): Setting[] => {
        property(name);
        const list = scanner.value();
        if (list.kind !== "array") scanner.fail(`${name} must be a list`);
        return list.items.flatMap(item => {
            if (item.kind !== "new" || item.args.length !== 7) scanner.fail(`${name} has an entry that isn't \`new(...)\` with 7 arguments`);
            const [section, group, keyArg, label, description, kindArg, defaultArg] = item.args;
            const key = string(keyArg, "Key");
            const kind = kindArg?.kind === "name" ? kinds[kindArg.value] : undefined;
            if (!kind) scanner.fail(`${key} has an unknown kind`);

            const setting: Setting = {
                section: string(section, `${key}'s section`),
                group: string(group, `${key}'s group`),
                key,
                label: string(label, `${key}'s label`),
                description: string(description, `${key}'s description`),
                kind,
                default: toml(defaultArg, `${key}'s default`),
                choices: [],
                unit: null,
                minimum: 0,
                maximum: null,
                step: 1,
                placeholder: null,
                nullLabel: null,
                numbersAsNumbers: false,
            };

            let unfinished = false;
            for (const [prop, value] of Object.entries(item.init)) {
                if (prop === "Choices") setting.choices = choices(value, key);
                else if (prop === "Unit") setting.unit = string(value, `${key}'s unit`);
                else if (prop === "Minimum") setting.minimum = number(value, `${key}'s minimum`) ?? 0;
                else if (prop === "Maximum") setting.maximum = number(value, `${key}'s maximum`);
                else if (prop === "Step") setting.step = number(value, `${key}'s step`) ?? 1;
                else if (prop === "Placeholder") setting.placeholder = string(value, `${key}'s placeholder`);
                else if (prop === "NullLabel") setting.nullLabel = string(value, `${key}'s null label`);
                else if (prop === "NumbersAsNumbers" && value.kind === "bool") setting.numbersAsNumbers = value.value;
                else if (prop === "Unfinished" && value.kind === "bool") unfinished = value.value;
                else scanner.fail(`${key} has an unknown property ${prop}`);
            }

            // Kept out of the Settings window until the app does what it says
            return unfinished ? [] : [setting];
        });
    };

    property("Sections");
    const sections = scanner.list("[", "]", () => {
        const section = scanner.value();
        if (section.kind !== "new") scanner.fail("Sections has an entry that isn't `new(...)`");
        return {id: string(section.args[0], "A section's id"), title: string(section.args[1], "A section's title")};
    });

    const all = [...settings("All"), ...settings("Discovery")];

    scanner.seek(/\bFileOnly\s*\{\s*get;\s*\}\s*=\s*new Dictionary<string, string>\s*/, "no `FileOnly { get; } = new Dictionary<string, string>`");
    const fileOnly = scanner.list("{", "}", () => {
        scanner.expect("[");
        const key = scanner.string();
        scanner.expect("]");
        scanner.skipSpace();
        scanner.expect("=");
        scanner.skipSpace();
        return {key, text: scanner.string()};
    });

    const keys = new Set<string>();
    for (const setting of all) {
        if (keys.has(setting.key)) scanner.fail(`${setting.key} is listed twice`);
        keys.add(setting.key);
        if (!sections.some(s => s.id === setting.section)) scanner.fail(`${setting.key} is in an unknown section "${setting.section}"`);
    }
    if (all.length === 0) scanner.fail("there are no settings");

    return {sections, settings: all, fileOnly};
}
