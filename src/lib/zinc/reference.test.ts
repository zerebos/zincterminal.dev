import {describe, expect, test} from "bun:test";
import {readFile} from "node:fs/promises";
import {join} from "node:path";
import {crlf, fakeReference, fakeSchema, fakeSetting} from "./fixtures";
import {parseReference, parseSchema, schemaFileText, schemaUrl} from "./reference";
import type {ZincReference} from "./types";


/** Parses the fake reference after a change, and returns the error message */
function refusal(change: (reference: ZincReference) => void) {
    const reference = fakeReference();
    change(reference);
    try {
        parseReference(crlf(reference));
    }
    catch (error) {
        return error instanceof Error ? error.message : String(error);
    }
    throw new Error("Expected it to throw");
}

describe("parseReference", () => {
    test("reads Zinc's file as it is", () => {
        const reference = parseReference(crlf(fakeReference()));
        expect(reference.settings.map(s => s.key)).toEqual(["terminal.scrollback-lines"]);
        expect(reference.actions.map(a => a.name)).toEqual(["split", "paste"]);
        expect(reference.keys.names.map(n => n.name)).toContain("pgup");
    });

    test("ignores fields it doesn't read", () => {
        const reference = {...fakeReference(), folds: [{lead: "terminal.scrollback-lines"}], somethingNew: true};
        expect(() => parseReference(JSON.stringify(reference))).not.toThrow();
    });

    test("refuses a format it doesn't know", () => {
        expect(refusal(r => r.format = 2)).toMatch(/has format 2, and the sync reads format 1/);
    });

    test("names the field that has the wrong shape", () => {
        expect(refusal(r => (r.settings[0]!.kind as string) = "slider")).toMatch(/reference\.settings\[0\]\.kind is "slider", expected one of toggle/);
        expect(refusal(r => delete (r.actions[0] as Partial<typeof r.actions[0]>).category)).toMatch(/reference\.actions\[0\]\.category is missing, expected a string/);
        expect(refusal(r => (r.notices[1]!.version as unknown) = 10)).toMatch(/reference\.notices\[1\]\.version is 10, expected a string/);
    });

    test("refuses a section that isn't listed, and keys that repeat", () => {
        const message = refusal(r => {
            r.settings.push(fakeSetting({key: "terminal.scrollback-lines"}));
            r.discovery[0]!.section = "shells";
            r.actions.push(r.actions[0]!);
        });
        expect(message).toContain("discover.wsl is in section \"shells\"");
        expect(message).toContain("the setting key terminal.scrollback-lines appears more than once");
        expect(message).toContain("the action split appears more than once");
    });

    test("refuses actions whose category, argument or default keys aren't listed", () => {
        const message = refusal(r => {
            r.actions[0]!.category = "Splits";
            r.actions[1]!.argument = "paste-mode";
            r.actions[1]!.defaultKeys.push({keys: "ctrl+shift+pageup", action: "paste"}, {keys: "win+p", action: "paste"}, {keys: "ctrl+a", action: "quit"});
        });
        expect(message).toContain(`the action split is in the category "Splits", which isn't in actionCategories`);
        expect(message).toContain(`the action paste takes the argument "paste-mode", which isn't in actionArguments`);
        expect(message).not.toContain("ctrl+shift+pageup");
        expect(message).toContain(`the action paste: "win+p" has the modifier "win", which isn't a modifier`);
        expect(message).toContain(`the action paste has a default key for "quit"`);
    });

    test("refuses a default key with a key name it doesn't know", () => {
        expect(refusal(r => r.actions[0]!.defaultKeys[0]!.keys = "alt+shift+equal")).toContain(`"alt+shift+equal" has the key "equal", which isn't a key name`);
    });

    test("refuses a bound argument the action doesn't take", () => {
        const message = refusal(r => {
            r.actions[0]!.defaultKeys[0]!.action = "split sideways";
            r.actions[1]!.defaultKeys[0]!.action = "paste plain";
        });
        expect(message).toContain(`the action split binds "split sideways", but direction takes only right, down, left, up`);
        expect(message).toContain(`the action paste binds "paste plain", but it takes no argument`);
    });

    test("takes any bound value when the argument also takes free text", () => {
        expect(() => parseReference(JSON.stringify({
            ...fakeReference(),
            actionArguments: [{name: "direction", values: ["last"], optional: false, text: "A number from 1, or last"}],
        }))).not.toThrow();
    });

    test("refuses repeated categories, arguments, top-level keys and key names", () => {
        const message = refusal(r => {
            r.actionCategories.push("Panes");
            r.actionArguments.push(r.actionArguments[0]!);
            r.topLevel.push(r.topLevel[0]!);
            r.keys.names.push({name: "page_up", aliases: ["pageup"], virtualKey: 33});
        });
        expect(message).toContain("the action category Panes appears more than once");
        expect(message).toContain("the action argument direction appears more than once");
        expect(message).toContain("the top-level key include appears more than once");
        expect(message).toContain("the key name pageup appears more than once");
    });

    test("lets a profile field share a setting's key", () => {
        expect(() => parseReference(JSON.stringify({...fakeReference(), profileFields: [fakeSetting({key: "terminal.scrollback-lines"})]}))).not.toThrow();
    });

    test("says when the file isn't JSON", () => {
        expect(() => parseReference("{")).toThrow(/zinc-reference\.json isn't JSON/);
    });
});

describe("parseSchema", () => {
    test("reads a schema with the site's $id", () => {
        expect(parseSchema(crlf(fakeSchema())).title).toBe("Zinc config.toml");
    });

    test("refuses another $id", () => {
        expect(() => parseSchema(JSON.stringify({...fakeSchema(), $id: "https://example.com/zinc.json"}))).toThrow(/\$id "https:\/\/example\.com\/zinc\.json", but the site serves it at https:\/\/zincterminal\.dev\/schema\/config\.json/);
    });

    test("is the URL the guide gives", async () => {
        const guide = await readFile(join(import.meta.dir, "../../content/docs/using-zinc.mdx"), "utf8");
        expect(guide).toContain(`#:schema ${schemaUrl}`);
    });

    test("serves Zinc's text with LF line ends and a final newline", () => {
        expect(schemaFileText("{\r\n  \"a\": 1\r\n}")).toBe("{\n  \"a\": 1\n}\n");
        expect(schemaFileText("{}\n")).toBe("{}\n");
    });
});
