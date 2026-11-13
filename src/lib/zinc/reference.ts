// Reads Zinc's reference export (`zinc-reference.json`) and its config schema (`config.schema.json`).
// A field Zinc adds is fine. A missing or mistyped field, or a format this code doesn't know, throws,
// so the sync stops instead of the site showing something wrong.

import {parseKeys} from "./keys";
import type {ActionArgument, SettingKind, ZincReference} from "./types";


/** The `format` this code reads. Zinc raises it when a field changes meaning or goes away. */
export const referenceFormat = 1;

/** Where the site serves the schema, which is also the schema's `$id` */
export const schemaUrl = "https://zincterminal.dev/schema/config.json";

const settingKinds: SettingKind[] = ["toggle", "choice", "number", "text", "color", "font", "scheme", "files"];

class ShapeError extends Error {}

/** Checks a value, and throws a `ShapeError` naming where it is when the value doesn't fit */
type Check = (value: unknown, where: string) => void;

function fail(where: string, expected: string, value: unknown): never {
    throw new ShapeError(`${where} is ${JSON.stringify(value) ?? "missing"}, expected ${expected}`);
}

const is = (type: string): Check => (value, where) => {
    if (typeof value !== type) fail(where, `a ${type}`, value);
};

const string = is("string");
const number = is("number");
const boolean = is("boolean");

const nullable = (check: Check): Check => (value, where) => {
    if (value !== null) check(value, where);
};

const oneOf = (values: readonly string[]): Check => (value, where) => {
    if (!values.includes(value as string)) fail(where, `one of ${values.join(", ")}`, value);
};

/** A value as config.toml writes it */
const settingValue: Check = (value, where) => {
    if (value !== null && !["string", "number", "boolean"].includes(typeof value)) fail(where, "a string, number, boolean or null", value);
};

const array = (check: Check): Check => (value, where) => {
    if (!Array.isArray(value)) fail(where, "an array", value);
    value.forEach((item, i) => check(item, `${where}[${i}]`));
};

/** Checks the listed fields and ignores any others */
const object = (fields: Record<string, Check>): Check => (value, where) => {
    if (typeof value !== "object" || value === null || Array.isArray(value)) fail(where, "an object", value);
    for (const [name, check] of Object.entries(fields)) check((value as Record<string, unknown>)[name], `${where}.${name}`);
};

const setting = object({
    key: string,
    section: string,
    group: string,
    label: string,
    description: string,
    kind: oneOf(settingKinds),
    default: settingValue,
    choices: array(object({label: string, value: settingValue, detail: nullable(string)})),
    unit: nullable(string),
    minimum: number,
    maximum: nullable(number),
    step: number,
    placeholder: nullable(string),
    nullLabel: nullable(string),
    numbersAsNumbers: boolean,
    example: nullable(string),
    defaultText: nullable(string),
    profileOverridable: boolean,
    oldNames: array(string),
});

const reference = object({
    zinc: object({version: string, release: nullable(string), date: nullable(string)}),
    sections: array(object({id: string, title: string})),
    topLevel: array(object({key: string, label: string, description: string, takes: string, defaultText: nullable(string)})),
    customColorLabel: string,
    settings: array(setting),
    fileOnly: array(object({key: string, text: string})),
    profileFields: array(setting),
    discovery: array(setting),
    actionCategories: array(string),
    actionArguments: array(object({name: string, values: array(string), optional: boolean, text: nullable(string)})),
    actions: array(object({
        name: string,
        title: string,
        description: string,
        argument: nullable(string),
        category: string,
        defaultKeys: array(object({keys: string, action: string})),
    })),
    keys: object({
        chordSeparator: string,
        sequenceSeparator: string,
        unbind: string,
        modifiers: array(string),
        names: array(object({name: string, aliases: array(string), virtualKey: number})),
    }),
    notices: array(object({name: string, version: nullable(string), use: string, license: string, url: string, licenseText: string})),
});

function duplicates(values: string[]) {
    return values.filter((value, i) => values.indexOf(value) !== i);
}

function parseJson(text: string, file: string): unknown {
    try {
        return JSON.parse(text);
    }
    catch (error) {
        throw new Error(`${file} isn't JSON: ${error instanceof Error ? error.message : String(error)}`, {cause: error});
    }
}

export function parseReference(text: string): ZincReference {
    const file = "zinc-reference.json";
    const data = parseJson(text, file);

    const format = (data as {format?: unknown} | null)?.format;
    if (format !== referenceFormat) {
        throw new Error(`${file} has format ${JSON.stringify(format) ?? "(none)"}, and the sync reads format ${referenceFormat}. Update the sync for the new format.`);
    }

    try {
        reference(data, "reference");
    }
    catch (error) {
        if (error instanceof ShapeError) throw new Error(`${file} has a shape the sync doesn't know: ${error.message}`, {cause: error});
        throw error;
    }

    const parsed = data as ZincReference;
    const problems: string[] = [];
    const sectionIds = parsed.sections.map(s => s.id);
    for (const s of [...parsed.settings, ...parsed.discovery, ...parsed.profileFields]) {
        if (!sectionIds.includes(s.section)) problems.push(`${s.key} is in section "${s.section}", which isn't in sections`);
    }

    // Profile fields live in their own table, so they only clash with each other
    const keys = [...parsed.settings, ...parsed.discovery].map(s => s.key);
    for (const key of duplicates(keys)) problems.push(`the setting key ${key} appears more than once`);
    for (const key of duplicates(parsed.profileFields.map(s => s.key))) problems.push(`the profile field ${key} appears more than once`);
    for (const name of duplicates(parsed.actions.map(a => a.name))) problems.push(`the action ${name} appears more than once`);
    for (const key of duplicates(parsed.topLevel.map(k => k.key))) problems.push(`the top-level key ${key} appears more than once`);
    for (const name of duplicates(parsed.actionCategories)) problems.push(`the action category ${name} appears more than once`);
    for (const name of duplicates(parsed.actionArguments.map(a => a.name))) problems.push(`the action argument ${name} appears more than once`);
    const keyNames = parsed.keys.names.flatMap(n => [n.name, ...n.aliases]);
    for (const name of duplicates(keyNames)) problems.push(`the key name ${name} appears more than once`);
    problems.push(...actionProblems(parsed));

    if (parsed.zinc.date !== null && parsed.zinc.release === null) problems.push(`zinc.date is ${parsed.zinc.date}, but zinc.release is null`);

    if (problems.length) throw new Error(`${file} doesn't add up:\n${problems.map(p => `  ${p}`).join("\n")}`);
    return parsed;
}

/** What doesn't add up between the actions, their categories and arguments, and the key names */
function actionProblems(parsed: ZincReference) {
    const problems: string[] = [];
    const argumentsByName = new Map(parsed.actionArguments.map(a => [a.name, a]));
    for (const action of parsed.actions) {
        const where = `the action ${action.name}`;
        if (!parsed.actionCategories.includes(action.category)) problems.push(`${where} is in the category "${action.category}", which isn't in actionCategories`);
        const argument = action.argument === null ? null : argumentsByName.get(action.argument);
        if (argument === undefined) problems.push(`${where} takes the argument "${action.argument}", which isn't in actionArguments`);

        for (const binding of action.defaultKeys) {
            try {
                parseKeys(binding.keys, parsed.keys);
            }
            catch (error) {
                problems.push(`${where}: ${error instanceof Error ? error.message : String(error)}`);
            }
            const problem = boundArgumentProblem(binding.action, action.name, argument);
            if (problem) problems.push(`${where} ${problem}`);
        }
    }
    return problems;
}

/** Why a default key's action text doesn't fit its action, or `null` when it fits */
function boundArgumentProblem(bound: string, name: string, argument: ActionArgument | null | undefined) {
    const [boundName, ...rest] = bound.split(" ");
    const value = rest.join(" ");
    if (boundName !== name) return `has a default key for "${bound}"`;
    if (!value || argument === undefined) return null;
    if (argument === null) return `binds "${bound}", but it takes no argument`;
    if (!argument.values.includes(value) && argument.text === null) return `binds "${bound}", but ${argument.name} takes only ${argument.values.join(", ")}`;
    return null;
}

/** The parsed schema. Only its `$id` and the texts the guard reads matter to the site. */
export function parseSchema(text: string): Record<string, unknown> {
    const file = "config.schema.json";
    const data = parseJson(text, file);
    if (typeof data !== "object" || data === null || Array.isArray(data)) throw new Error(`${file} isn't a JSON object`);
    const id = (data as {$id?: unknown}).$id;
    if (id !== schemaUrl) {
        throw new Error(`${file} has the $id ${JSON.stringify(id) ?? "(none)"}, but the site serves it at ${schemaUrl}. Change one to match the other.`);
    }
    return data as Record<string, unknown>;
}

/** The schema as the site serves it: Zinc's text with LF line ends and a final newline */
export function schemaFileText(text: string) {
    const lf = text.replace(/\r\n?/g, "\n");
    return lf.endsWith("\n") ? lf : `${lf}\n`;
}
