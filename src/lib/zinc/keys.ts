// Zinc's key names, as `[keys]` writes them, and the browser's names for the same keys

import type {KeyName, KeySyntax, ReferenceKeyName} from "./types";


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
