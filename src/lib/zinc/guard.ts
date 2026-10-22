// The site never names Windows Terminal in its own words. This checks the text we show as ours
// (changelog items, use texts, docs), not URLs or license texts.

import type {ChangelogEntry, Notice} from "./types";


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
