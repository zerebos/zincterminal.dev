// Zinc's key names, as `[keys]` writes them, the browser's names for the same keys, and the actions
// with their default keys as the keys page shows them

import type {ActionArgument, ActionsFile, KeyName, KeySyntax, ReferenceKeyName} from "./types";


// Windows virtual-key codes that aren't in a run below, by the browser's `KeyboardEvent.code`.
// The OEM keys are the US layout's, which is what `KeyboardEvent.code` names.
const singleKeys: Record<number, string> = {
    8: "Backspace",
    9: "Tab",
    13: "Enter",
    27: "Escape",
    32: "Space",
    33: "PageUp",
    34: "PageDown",
    35: "End",
    36: "Home",
    37: "ArrowLeft",
    38: "ArrowUp",
    39: "ArrowRight",
    40: "ArrowDown",
    45: "Insert",
    46: "Delete",
    106: "NumpadMultiply",
    107: "NumpadAdd",
    109: "NumpadSubtract",
    110: "NumpadDecimal",
    111: "NumpadDivide",
    186: "Semicolon",
    187: "Equal",
    188: "Comma",
    189: "Minus",
    190: "Period",
    191: "Slash",
    192: "Backquote",
    219: "BracketLeft",
    220: "Backslash",
    221: "BracketRight",
    222: "Quote",
};

/** The browser's `KeyboardEvent.code` for a Windows virtual-key code, or `null` when it isn't known */
export function codeForVirtualKey(virtualKey: number): string | null {
    if (virtualKey >= 65 && virtualKey <= 90) return `Key${String.fromCharCode(virtualKey)}`;
    if (virtualKey >= 48 && virtualKey <= 57) return `Digit${virtualKey - 48}`;
    if (virtualKey >= 96 && virtualKey <= 105) return `Numpad${virtualKey - 96}`;
    if (virtualKey >= 112 && virtualKey <= 135) return `F${virtualKey - 111}`;
    return singleKeys[virtualKey] ?? null;
}

/** The key names with browser codes. Throws on a virtual key that has no code. */
export function keyNamesWithCodes(names: ReferenceKeyName[]): KeyName[] {
    const unknown = names.filter(n => codeForVirtualKey(n.virtualKey) === null);
    if (unknown.length) {
        throw new Error(`The sync doesn't know the browser's code for these virtual keys. Add them to codeForVirtualKey in src/lib/zinc/keys.ts:\n${unknown.map(n => `  ${n.name}: ${n.virtualKey}`).join("\n")}`);
    }
    return names.map(n => ({name: n.name, aliases: n.aliases, code: codeForVirtualKey(n.virtualKey)!}));
}

/** One chord of a binding, with its key's main name */
export interface Chord {
    modifiers: string[];
    key: string;
}

/**
 * Reads a binding such as `ctrl+shift+t` or `ctrl+a > c` into its chords, with each key under its main
 * name. Throws, naming the binding, when a part isn't a modifier or key that `[keys]` accepts.
 */
export function parseKeys(text: string, syntax: KeySyntax<{name: string, aliases: string[];}>): Chord[] {
    const names = new Map<string, string>();
    for (const n of syntax.names) for (const name of [n.name, ...n.aliases]) names.set(name, n.name);

    return text.split(syntax.sequenceSeparator).map(chordText => {
        const parts = chordText.trim().split(syntax.chordSeparator);
        const keyText = parts.pop() ?? "";
        const key = names.get(keyText);
        if (key === undefined) throw new Error(`"${text}" has the key "${keyText}", which isn't a key name`);
        for (const modifier of parts) {
            if (!syntax.modifiers.includes(modifier)) throw new Error(`"${text}" has the modifier "${modifier}", which isn't a modifier`);
        }
        return {modifiers: parts, key};
    });
}

/** Windows' names for the keys whose cap isn't the name with a capital letter */
const capNames: Record<string, string> = {
    plus: "Plus",
    minus: "Minus",
    comma: ",",
    grave: "`",
    pgup: "PgUp",
    pgdn: "PgDn",
    esc: "Esc",
    up: "↑",
    down: "↓",
    left: "←",
    right: "→",
    numpad_plus: "Numpad +",
    numpad_minus: "Numpad −",
};

/** A key or modifier as its key cap shows it: `Ctrl`, `PgUp`, `Numpad 0`, `↑` */
export function capName(name: string) {
    const numpad = /^numpad(\d)$/.exec(name);
    if (numpad) return `Numpad ${numpad[1]}`;
    return capNames[name] ?? name.charAt(0).toUpperCase() + name.slice(1);
}

/** A key name, or a run of them like `f1` to `f24`, as the keys page lists them */
export interface KeyNameRun {
    first: string;

    /** The run's last name, or null for a single name */
    last: string | null;
    aliases: string[];
}

/** Whether `name` comes straight after `previous`, as `b` after `a` or `f2` after `f1` */
function follows(previous: string, name: string) {
    if (/^[a-z]$/.test(previous) && /^[a-z]$/.test(name)) return name.charCodeAt(0) === previous.charCodeAt(0) + 1;
    const a = /^(\D*)(\d+)$/.exec(previous);
    const b = /^(\D*)(\d+)$/.exec(name);
    return Boolean(a && b && a[1] === b[1] && Number(b[2]) === Number(a[2]) + 1);
}

/**
 * Folds runs of three or more names in a row into one, so the page lists `a`–`z` instead of 26 names. Leaves out
 * single-character aliases like `,`, which would be too small to read as chips, and which the spelled-out name covers.
 */
export function keyNameRuns(names: Array<{name: string, aliases: string[];}>): KeyNameRun[] {
    const runs: Array<typeof names> = [];
    for (const named of names) {
        const key = {...named, aliases: named.aliases.filter(alias => alias.length > 1)};
        const run = runs.at(-1);
        const previous = run?.at(-1);
        if (run && previous && !previous.aliases.length && !key.aliases.length && follows(previous.name, key.name)) run.push(key);
        else runs.push([key]);
    }
    return runs.flatMap((run): KeyNameRun[] => run.length >= 3
        ? [{first: run[0]!.name, last: run.at(-1)!.name, aliases: []}]
        : run.map(key => ({first: key.name, last: null, aliases: key.aliases})));
}

/** One key cap on the page, with the argument the binding passes ("" for none) */
export interface KeyCap {
    label: string;
    argument: string;
}

export interface ActionRow {
    name: string;
    title: string;
    description: string;

    /** What its argument takes, in words, or "" when it takes none */
    takes: string;
    keys: KeyCap[];

    /** Every default binding, modifiers in `[keys]` order and the key's main name, for the filter's Press keys */
    match: string[];

    /** What the filter's text matches, in lowercase */
    text: string;
}

export interface ActionGroup {
    id: string;
    title: string;
    rows: ActionRow[];
}

/** A category's anchor: `Find and scroll` is `find-scroll` */
export const groupId = (category: string) => category.toLowerCase().split(/[^a-z0-9]+/).filter(word => word && word !== "and").join("-");

/** What an argument takes, as the page's "Takes" line says it */
export function takesText(argument: ActionArgument) {
    const text = argument.text === null
        ? argument.values.join(" · ")
        : /^[A-Z][a-z ]/.test(argument.text) ? argument.text.charAt(0).toLowerCase() + argument.text.slice(1) : argument.text;
    return argument.optional ? `${text} (optional)` : text;
}

interface Binding {
    chords: Chord[];

    /** The argument it passes, "" for none */
    argument: string;
}

type Syntax = KeySyntax<{name: string, aliases: string[];}>;

const arrows = ["up", "down", "left", "right"];

/** A chord's modifiers in `[keys]` order */
const orderedModifiers = (chord: Chord, syntax: Syntax) => syntax.modifiers.filter(m => chord.modifiers.includes(m));

/** A binding's keys as `[keys]` writes them, with modifiers in order and each key's main name */
const bindingKeys = (b: Binding, syntax: Syntax) => b.chords
    .map(chord => [...orderedModifiers(chord, syntax), chord.key].join(syntax.chordSeparator))
    .join(` ${syntax.sequenceSeparator} `);

const single = (b: Binding) => b.chords.length === 1 ? b.chords[0]! : null;

/** Whether every binding comes twice, once as it is and once with Shift, as zoom's do */
function isDoubledWithShift(bindings: Binding[], syntax: Syntax) {
    const id = (b: Binding, without = "") => {
        const chord = single(b);
        return chord && `${orderedModifiers(chord, syntax).filter(m => m !== without).join("+")}|${chord.key}|${b.argument}`;
    };
    const shifted = bindings.filter(b => single(b)?.modifiers.includes("shift"));
    const unshifted = bindings.filter(b => !shifted.includes(b));
    const shiftedIds = new Set(shifted.map(b => id(b, "shift")));
    const unshiftedIds = new Set(unshifted.map(b => id(b)));
    return shifted.length > 0 && shifted.length === unshifted.length
        && shifted.every(b => unshiftedIds.has(id(b, "shift"))) && unshifted.every(b => shiftedIds.has(id(b)));
}

/**
 * Groups the single-chord bindings that `fits` by their modifiers, as indexes into `bindings`. A
 * binding fits when its key and the argument it passes say the same thing.
 */
function byModifiers(bindings: Binding[], syntax: Syntax, fits: (key: string) => boolean) {
    const groups = new Map<string, number[]>();
    bindings.forEach((b, i) => {
        const chord = single(b);
        if (!chord || !fits(chord.key) || b.argument !== chord.key) return;
        const modifiers = orderedModifiers(chord, syntax).join("+");
        groups.set(modifiers, [...groups.get(modifiers) ?? [], i]);
    });
    return [...groups.values()];
}

/**
 * The key caps for an action's default bindings. A set doubled with Shift shows once, a run of three
 * or more digits that each pass their digit is one cap (`Ctrl+Shift+1–9`), and the four arrows, each
 * passing its direction, are one cap (`Alt+Arrows`).
 */
function keyCaps(all: Binding[], syntax: Syntax): KeyCap[] {
    const bindings = isDoubledWithShift(all, syntax) ? all.filter(b => !single(b)?.modifiers.includes("shift")) : all;
    const prefix = (chord: Chord) => orderedModifiers(chord, syntax).map(m => `${capName(m)}+`).join("");
    const caps: Array<KeyCap | null> = bindings.map(b => ({
        label: b.chords.map(chord => `${prefix(chord)}${capName(chord.key)}`).join(` ${syntax.sequenceSeparator} `),
        argument: b.argument,
    }));

    // Replaces the caps at `indexes` with one, at the first one's place
    const merge = (indexes: number[], label: string, argument: string) => {
        caps[indexes[0]!] = {label: `${prefix(single(bindings[indexes[0]!]!)!)}${label}`, argument};
        for (const i of indexes.slice(1)) caps[i] = null;
    };

    for (const indexes of byModifiers(bindings, syntax, key => /^\d$/.test(key))) {
        const digit = (i: number) => Number(single(bindings[i]!)!.key);
        const sorted = indexes.toSorted((a, b) => digit(a) - digit(b));
        let start = 0;
        for (let end = 1; end <= sorted.length; end++) {
            if (end < sorted.length && digit(sorted[end]!) === digit(sorted[end - 1]!) + 1) continue;
            const run = sorted.slice(start, end);
            if (run.length >= 3) {
                const range = `${digit(run[0]!)}–${digit(run.at(-1)!)}`;
                merge(run, range, range);
            }
            start = end;
        }
    }

    for (const indexes of byModifiers(bindings, syntax, key => arrows.includes(key))) {
        if (indexes.length === arrows.length) merge(indexes, "Arrows", "that direction");
    }

    return caps.filter(cap => cap !== null);
}

/** The actions as the keys page shows them, grouped by category in Settings › Keyboard's order */
export function actionGroups(file: ActionsFile): ActionGroup[] {
    const argumentsByName = new Map(file.arguments.map(a => [a.name, a]));
    return file.categories.map(category => ({
        id: groupId(category),
        title: category,
        rows: file.actions.filter(a => a.category === category).map(action => {
            const bindings = action.defaultKeys.map(binding => ({
                chords: parseKeys(binding.keys, file.keys),
                argument: binding.action.slice(action.name.length).trim(),
            }));
            const argument = action.argument === null ? undefined : argumentsByName.get(action.argument);
            const keys = keyCaps(bindings, file.keys);
            return {
                name: action.name,
                title: action.title,
                description: action.description,
                takes: argument ? takesText(argument) : "",
                keys,
                match: bindings.map(b => bindingKeys(b, file.keys)),
                text: [action.name, action.title, action.description, category, ...action.defaultKeys.map(b => b.keys), ...keys.map(k => k.label)].join(" ").toLowerCase(),
            };
        }),
    })).filter(group => group.rows.length > 0);
}
