import {describe, expect, test} from "bun:test";
import {byTable, perProfile, tableOf} from "./settings";
import type {Setting} from "./types";


const setting = (key: string): Setting => ({section: "appearance", group: "Font", key, label: key, description: "", kind: "toggle", default: false, choices: [], unit: null, minimum: 0, maximum: null, step: 1, placeholder: null, nullLabel: null, numbersAsNumbers: false});

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
