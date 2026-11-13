// The site never names Windows Terminal in its own words. This checks the text we show as ours
// (changelog items, use texts, settings, actions, the schema), not URLs or license texts.

import type {Action, ChangelogEntry, Notice, Setting, SettingsCatalog} from "./types";


const banned = /windows\s+terminal/i;

export interface GuardedText {

    /** Where the text came from, for the error */
    where: string;
    text: string;
}

export function changelogTexts(entries: ChangelogEntry[]): GuardedText[] {
    return entries.flatMap(e => [
        ...e.notes.map(text => ({where: `${e.version} notes`, text})),
        ...e.groups.flatMap(g => [
            {where: `${e.version} group`, text: g.name},
            ...g.items.flatMap(item => [item.text, ...item.children].map(text => ({where: `${e.version} ${g.name}`, text}))),
        ]),
    ]);
}

export function noticeTexts(notices: Notice[]): GuardedText[] {
    return notices.flatMap(n => [
        {where: `${n.name} name`, text: n.name},
        {where: `${n.name} use`, text: n.use},
        {where: `${n.name} license`, text: n.license},
    ]);
}

function settingTexts(s: Setting, where: string): GuardedText[] {
    return [s.group, s.label, s.description, s.placeholder ?? "", s.nullLabel ?? "", s.unit ?? ""]
        .concat(s.choices.flatMap(c => [c.label, c.detail ?? ""]))
        .map(text => ({where, text}));
}

export function settingsTexts(catalog: SettingsCatalog): GuardedText[] {
    return [
        ...catalog.sections.map(s => ({where: `section ${s.id}`, text: s.title})),
        ...catalog.settings.flatMap(s => settingTexts(s, s.key)),
        ...catalog.fileOnly.map(f => ({where: f.key, text: f.text})),
        ...catalog.profileFields.flatMap(s => settingTexts(s, `profile field ${s.key}`)),
    ];
}

export function actionTexts(actions: Action[]): GuardedText[] {
    return actions.flatMap(a => [a.title, a.description, a.category].map(text => ({where: `action ${a.name}`, text})));
}

// Keys whose strings are names or patterns rather than text people read
const schemaSkip = new Set(["$schema", "$id", "$ref", "pattern"]);

/** Every string in the schema that an editor can show, such as titles, descriptions and enum values */
export function schemaTexts(schema: unknown, where = "schema"): GuardedText[] {
    if (typeof schema === "string") return [{where, text: schema}];
    if (Array.isArray(schema)) return schema.flatMap((item, i) => schemaTexts(item, `${where}[${i}]`));
    if (typeof schema !== "object" || schema === null) return [];
    return Object.entries(schema)
        .filter(([key]) => !schemaSkip.has(key))
        .flatMap(([key, value]) => schemaTexts(value, `${where}.${key}`));
}

/** The texts that name it, empty when all is well */
export function findBannedNames(texts: GuardedText[]) {
    return texts.filter(t => banned.test(t.text));
}

/**
 * Whether Markdown leaves a run of backticks unclosed. A run closes at the next run of the same
 * length, so a bare backtick in prose, such as "(Win+`)", pairs with the next code span and breaks
 * both. Write that key as a double-backtick span instead: ``Win+` ``.
 */
export function hasUnclosedCode(text: string) {
    const runs = [...text.matchAll(/`+/g)].map(match => match[0].length);
    for (let i = 0; i < runs.length; i++) {
        const close = runs.indexOf(runs[i] ?? 0, i + 1);
        if (close < 0) return true;
        i = close;
    }
    return false;
}
