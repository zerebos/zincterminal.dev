import {describe, expect, test} from "bun:test";
import {fakeReference} from "./fixtures";
import {actionGroups, capName, codeForVirtualKey, groupId, keyNameRuns, parseKeys, takesText} from "./keys";
import type {Action, ActionsFile} from "./types";


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

describe("capName, groupId and takesText", () => {
    test.each([
        ["ctrl", "Ctrl"],
        ["t", "T"],
        ["pgup", "PgUp"],
        ["numpad0", "Numpad 0"],
        ["numpad_minus", "Numpad −"],
        ["comma", ","],
        ["up", "↑"],
        ["f12", "F12"],
    ])("the cap for %s is %s", (name, cap) => {
        expect(capName(name)).toBe(cap);
    });

    test("makes anchors from category names", () => {
        expect(groupId("Find and scroll")).toBe("find-scroll");
        expect(groupId("Workspaces and windows")).toBe("workspaces-windows");
        expect(groupId("Zinc")).toBe("zinc");
    });

    test("lists fixed values, or uses the words, and marks optional ones", () => {
        expect(takesText({name: "direction", values: ["right", "down"], optional: false, text: null})).toBe("right · down");
        expect(takesText({name: "mode", values: ["rail"], optional: true, text: null})).toBe("rail (optional)");
        expect(takesText({name: "workspace", values: ["last"], optional: false, text: "A workspace number from 1, or last"})).toBe("a workspace number from 1, or last");
    });
});

describe("keyNameRuns", () => {
    const named = (...list: string[]) => list.map(name => ({name, aliases: []}));

    test("folds letters, digits and numbered keys into runs", () => {
        expect(keyNameRuns(named("a", "b", "c", "0", "1", "2", "f1", "f2", "f3", "numpad0", "numpad1", "numpad2"))).toEqual([
            {first: "a", last: "c", aliases: []},
            {first: "0", last: "2", aliases: []},
            {first: "f1", last: "f3", aliases: []},
            {first: "numpad0", last: "numpad2", aliases: []},
        ]);
    });

    test("keeps short runs, gaps and names with aliases apart", () => {
        expect(keyNameRuns([...named("a", "b", "d", "e", "f"), {name: "esc", aliases: ["escape"]}, ...named("tab")])).toEqual([
            {first: "a", last: null, aliases: []},
            {first: "b", last: null, aliases: []},
            {first: "d", last: "f", aliases: []},
            {first: "esc", last: null, aliases: ["escape"]},
            {first: "tab", last: null, aliases: []},
        ]);
    });
});

describe("actionGroups", () => {
    const names = ["a", "c", "t", "v", "0", "1", "2", "3", "4", "9", "plus", "numpad_plus", "insert", "up", "down", "left", "right"];
    const action = (name: string, keys: Array<[string, string?]>, more: Partial<Action> = {}): Action => ({
        name,
        title: name,
        description: "",
        argument: null,
        category: "Tabs",
        defaultKeys: keys.map(([k, argument]) => ({keys: k, action: argument ? `${name} ${argument}` : name})),
        ...more,
    });
    const file = (actions: Action[]): ActionsFile => ({
        categories: ["Tabs", "Zoom"],
        arguments: [
            {name: "direction", values: ["right", "down", "left", "up"], optional: false, text: null},
            {name: "number", values: ["last"], optional: false, text: "A number from 1, or last"},
        ],
        keys: {chordSeparator: "+", sequenceSeparator: ">", unbind: "none", modifiers: ["ctrl", "alt", "shift"], names: names.map(name => ({name, aliases: [], code: ""}))},
        actions,
    });
    const caps = (a: Action) => actionGroups(file([a])).flatMap(g => g.rows)[0]!.keys.map(k => k.argument ? `${k.label} ${k.argument}` : k.label);

    test("groups by category in the given order", () => {
        const groups = actionGroups(file([action("zoom-in", [], {category: "Zoom"}), action("new-tab", [])]));
        expect(groups.map(g => [g.id, g.rows.map(r => r.name)])).toEqual([["tabs", ["new-tab"]], ["zoom", ["zoom-in"]]]);
    });

    test("leaves out a category with no actions", () => {
        expect(actionGroups(file([action("new-tab", [])])).map(g => g.id)).toEqual(["tabs"]);
    });

    test("shows a set doubled with Shift once, and still matches the Shift keys", () => {
        const zoom = action("zoom-in", [["ctrl+plus"], ["ctrl+numpad_plus"], ["ctrl+shift+plus"], ["ctrl+shift+numpad_plus"]]);
        expect(caps(zoom)).toEqual(["Ctrl+Plus", "Ctrl+Numpad +"]);
        expect(actionGroups(file([zoom]))[0]!.rows[0]!.match).toContain("ctrl+shift+plus");
    });

    test("keeps Shift keys when not every key has a Shift twin", () => {
        expect(caps(action("paste", [["ctrl+v"], ["ctrl+shift+v"], ["shift+insert"]]))).toEqual(["Ctrl+V", "Ctrl+Shift+V", "Shift+Insert"]);
        expect(caps(action("copy", [["ctrl+shift+c"], ["ctrl+c", "if-selection"]], {argument: null}))).toEqual(["Ctrl+Shift+C", "Ctrl+C if-selection"]);
    });

    test("collapses digits that pass their digit, and keeps the rest apart", () => {
        const go = action("go", [["ctrl+alt+1", "1"], ["ctrl+alt+2", "2"], ["ctrl+alt+3", "3"], ["ctrl+alt+4", "4"], ["ctrl+alt+9", "last"]], {argument: "number"});
        expect(caps(go)).toEqual(["Ctrl+Alt+1–4 1–4", "Ctrl+Alt+9 last"]);
    });

    test("leaves two digits as they are", () => {
        expect(caps(action("go", [["ctrl+1", "1"], ["ctrl+2", "2"]], {argument: "number"}))).toEqual(["Ctrl+1 1", "Ctrl+2 2"]);
    });

    test("collapses the four arrows when each passes its direction", () => {
        const focus = action("focus", [["alt+left", "left"], ["alt+right", "right"], ["alt+up", "up"], ["alt+down", "down"]], {argument: "direction"});
        expect(caps(focus)).toEqual(["Alt+Arrows that direction"]);
        const jump = action("jump", [["ctrl+shift+up", "up"], ["ctrl+shift+down", "down"]], {argument: "direction"});
        expect(caps(jump)).toEqual(["Ctrl+Shift+↑ up", "Ctrl+Shift+↓ down"]);
    });

    test("writes modifiers in order and shows sequences", () => {
        const row = actionGroups(file([action("new-tab", [["shift+ctrl+t"], ["ctrl+a > c"]])]))[0]!.rows[0]!;
        expect(row.keys.map(k => k.label)).toEqual(["Ctrl+Shift+T", "Ctrl+A > C"]);
        expect(row.match).toEqual(["ctrl+shift+t", "ctrl+a > c"]);
    });

    test("says what the argument takes and puts everything searchable in the text", () => {
        const row = actionGroups(file([action("split", [["alt+shift+plus", "right"]], {title: "Split", description: "Split the pane.", argument: "direction"})]))[0]!.rows[0]!;
        expect(row.takes).toBe("right · down · left · up");
        expect(row.text).toBe("split split split the pane. tabs alt+shift+plus alt+shift+plus");
    });
});
