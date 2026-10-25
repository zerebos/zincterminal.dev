import {describe, expect, test} from "bun:test";
import {byTable, choiceRows, defaultText, exampleText, kindText, perProfile, rangeText, sameValuesAs, settingsPath, tableOf} from "./settings";
import type {Setting} from "./types";


const setting = (key: string, more: Partial<Setting> = {}): Setting => ({section: "appearance", group: "Font", key, label: key, description: "", kind: "toggle", default: false, choices: [], unit: null, minimum: 0, maximum: null, step: 1, placeholder: null, nullLabel: null, numbersAsNumbers: false, ...more});

describe("tableOf and perProfile", () => {
    test.each([
        ["font.size", "font", true],
        ["shaders.files", "shaders", true],
        ["quick-terminal.size", "quick-terminal", false],
        ["window.backdrop", "window", false],
    ])("%s is in [%s], per profile %p", (key, table, profile) => {
        expect(tableOf(key)).toBe(table);
        expect(perProfile(key)).toBe(profile);
    });
});

describe("byTable", () => {
    const settings = [setting("window.backdrop"), setting("font.size"), setting("font.weight")];

    test("groups settings in the listed order, keeping the catalog's order inside each", () => {
        const tables = byTable(settings, [{table: "font"}, {table: "window"}]);
        expect(tables.map(t => [t.table, t.settings.map(s => s.key)])).toEqual([
            ["font", ["font.size", "font.weight"]],
            ["window", ["window.backdrop"]],
        ]);
    });

    test("throws on a table that isn't listed", () => {
        expect(() => byTable(settings, [{table: "font"}])).toThrow(/no title for \[window\]/);
    });

    test("throws on a listed table with no settings", () => {
        expect(() => byTable(settings, [{table: "font"}, {table: "window"}, {table: "debug"}])).toThrow(/\[debug\] has no settings/);
    });
});

describe("kindText and rangeText", () => {
    test.each<[Partial<Setting>, string, string]>([
        [{kind: "toggle"}, "On or off", ""],
        [{kind: "color", choices: [{label: "Subtle", value: "subtle", detail: null}]}, "Choice or color", ""],
        [{kind: "text", numbersAsNumbers: true}, "Number or text", ""],
        [{kind: "number", minimum: 4, maximum: 72, step: 0.5, unit: "pt"}, "Number", "4 to 72 pt, in steps of 0.5"],
        [{kind: "number", minimum: 1, maximum: 50, unit: "%"}, "Number", "1 to 50%"],
        [{kind: "number", minimum: 0, maximum: 100000, step: 1000}, "Number", "0 to 100,000, in steps of 1,000"],
        [{kind: "number", minimum: 0, maximum: null}, "Number", "0 or more"],
    ])("%o", (more, kind, range) => {
        expect(kindText(setting("a.b", more))).toBe(kind);
        expect(rangeText(setting("a.b", more))).toBe(range);
    });
});

describe("defaultText", () => {
    test.each<[Partial<Setting>, ReturnType<typeof defaultText>]>([
        [{default: "normal"}, {code: "\"normal\""}],
        [{default: 10.5}, {code: "10.5"}],
        [{default: true}, {code: "true"}],
        [{default: null, choices: [{label: "Automatic", value: null, detail: null}]}, {words: "Automatic"}],
        [{default: null, kind: "color", nullLabel: "Use Zinc's green", placeholder: "Zinc's green"}, {words: "Zinc's green"}],
        [{default: null, kind: "color", nullLabel: "Use the terminal's background"}, {words: "The terminal's background"}],
        [{default: null, kind: "color", placeholder: "Same as the text"}, {words: "Same as the text"}],
        [{default: null, kind: "color"}, {words: "The scheme's"}],
        [{default: null, kind: "text", placeholder: "50%"}, {words: "Not set"}],
    ])("%o", (more, text) => {
        expect(defaultText(setting("a.b", more))).toEqual(text);
    });
});

describe("exampleText", () => {
    test.each<[Partial<Setting>, string]>([
        [{kind: "text", placeholder: "50%"}, "\"50%\""],
        [{kind: "text", placeholder: "0", numbersAsNumbers: true}, "0"],
        [{kind: "text", placeholder: "60", numbersAsNumbers: true, default: 60}, ""],
        [{kind: "color", placeholder: "Zinc's grey"}, ""],
        [{kind: "text"}, ""],
    ])("%o", (more, example) => {
        expect(exampleText(setting("a.b", more))).toBe(example);
    });
});

describe("settingsPath, sameValuesAs and choiceRows", () => {
    test("names the section and group", () => {
        expect(settingsPath(setting("font.size"), [{id: "appearance", title: "Appearance"}])).toEqual(["Settings", "Appearance", "Font"]);
    });

    test("points repeated choices at the first setting with them", () => {
        const choices = [{label: "On", value: "on", detail: null}];
        const same = sameValuesAs([setting("a.one", {choices}), setting("a.two"), setting("a.three", {choices})]);
        expect([...same]).toEqual([["a.three", "a.one"]]);
    });

    test("marks the default, keeps the choice that writes nothing, and adds a custom color", () => {
        const rows = choiceRows(setting("colors.x", {kind: "color", default: null, choices: [{label: "Subtle", value: "subtle", detail: "Quiet"}, {label: "Standard", value: null, detail: null}]}));
        expect(rows).toEqual([
            {value: "\"subtle\"", label: "Subtle", detail: "Quiet", isDefault: false},
            {value: null, label: "Standard", detail: "", isDefault: true},
            {value: "\"#rrggbb\"", label: "Custom color", detail: "", isDefault: false},
        ]);
    });
});
