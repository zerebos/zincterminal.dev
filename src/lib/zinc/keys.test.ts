import {describe, expect, test} from "bun:test";
import {fakeReference} from "./fixtures";
import {codeForVirtualKey, parseKeys} from "./keys";


describe("codeForVirtualKey", () => {
    test.each([
        [65, "KeyA"],
        [90, "KeyZ"],
        [48, "Digit0"],
        [57, "Digit9"],
        [96, "Numpad0"],
        [107, "NumpadAdd"],
        [112, "F1"],
        [135, "F24"],
        [187, "Equal"],
        [192, "Backquote"],
        [38, "ArrowUp"],
        [33, "PageUp"],
    ])("%i is %s", (virtualKey, code) => {
        expect(codeForVirtualKey(virtualKey)).toBe(code);
    });

    test("is null for a virtual key it doesn't know", () => {
        expect(codeForVirtualKey(223)).toBeNull();
        expect(codeForVirtualKey(136)).toBeNull();
    });
});

describe("parseKeys", () => {
    const syntax = fakeReference().keys;

    test("reads a chord, with aliases under the key's main name", () => {
        expect(parseKeys("ctrl+shift+pageup", syntax)).toEqual([{modifiers: ["ctrl", "shift"], key: "pgup"}]);
        expect(parseKeys("insert", syntax)).toEqual([{modifiers: [], key: "insert"}]);
    });

    test("reads a sequence, with or without spaces around the separator", () => {
        const chords = [{modifiers: ["ctrl"], key: "a"}, {modifiers: [], key: "p"}];
        expect(parseKeys("ctrl+a>p", syntax)).toEqual(chords);
        expect(parseKeys("ctrl+a > p", syntax)).toEqual(chords);
    });

    test("refuses a key or modifier it doesn't know", () => {
        expect(() => parseKeys("ctrl+equal", syntax)).toThrow(`"ctrl+equal" has the key "equal", which isn't a key name`);
        expect(() => parseKeys("meta+a", syntax)).toThrow(`"meta+a" has the modifier "meta", which isn't a modifier`);
    });
});
