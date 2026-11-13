// Runs the sync on small sources shaped like Zinc's, writing to a temp folder, and checks the committed
// files with the guard. The parsing cases are in the parsers' own tests. None of it reads ../zinc.

import {afterEach, describe, expect, test} from "bun:test";
import {existsSync} from "node:fs";
import {mkdir, mkdtemp, readFile, rm, writeFile} from "node:fs/promises";
import {tmpdir} from "node:os";
import {join} from "node:path";
import {crlf, fakeChangelog, fakeReference, fakeSchema} from "./fixtures";
import {actionTexts, changelogTexts, findBannedNames, hasUnclosedCode, noticeTexts, schemaTexts, settingsTexts} from "./guard";
import {checkoutFiles, outputs, readCheckout, syncZinc, type ZincSources} from "./sync";
import type {ActionsFile, ChangelogEntry, Notice, SettingsCatalog, ZincReference} from "./types";


const root = join(import.meta.dir, "../../..");
const generated = join(root, "src/data/generated");
const servedSchema = join(root, "public/schema/config.json");

const temps: string[] = [];
afterEach(async () => {
    await Promise.all(temps.splice(0).map(dir => rm(dir, {recursive: true, force: true})));
});

async function tempDir() {
    const dir = await mkdtemp(join(tmpdir(), "sync-zinc-"));
    temps.push(dir);
    return dir;
}

function sources(changeReference: (reference: ZincReference) => void = () => {}): ZincSources {
    const reference = fakeReference();
    changeReference(reference);
    return {changelog: fakeChangelog, reference: crlf(reference), schema: crlf(fakeSchema())};
}

async function targets() {
    const dir = await tempDir();
    return {dataDir: join(dir, "data"), schemaFile: join(dir, "public/schema/config.json")};
}

async function failure(promise: Promise<unknown>) {
    try {
        await promise;
    }
    catch (error) {
        return error instanceof Error ? error.message : String(error);
    }
    throw new Error("Expected it to throw");
}

const readJson = async <T>(path: string) => JSON.parse(await readFile(path, "utf8")) as T;

describe("syncZinc", () => {
    test("writes the changelog, release, notices, settings, actions and schema", async () => {
        const to = await targets();
        await syncZinc(sources(), to);

        expect(await readJson(join(to.dataDir, outputs.release))).toEqual({version: "0.1.0-dev.12", date: "2026-02-03"});
        const changelog = await readJson<ChangelogEntry[]>(join(to.dataDir, outputs.changelog));
        expect(changelog.map(e => e.version)).toEqual(["0.1.0-dev.12"]);

        const notices = await readJson<Notice[]>(join(to.dataDir, outputs.notices));
        expect(notices.map(n => [n.name, n.version])).toEqual([["Zinc", null], [".NET", "10.0.13"]]);

        const actions = await readJson<ActionsFile>(join(to.dataDir, outputs.actions));
        expect(actions.actions.map(a => a.name)).toEqual(["split", "paste"]);

        const schema = await readFile(to.schemaFile, "utf8");
        expect(schema).not.toContain("\r");
        expect(JSON.parse(schema)).toEqual(fakeSchema());
    });

    test("puts discovery after the settings and leaves out old names", async () => {
        const to = await targets();
        await syncZinc(sources(), to);

        const catalog = await readJson<SettingsCatalog>(join(to.dataDir, outputs.settings));
        expect(catalog.settings.map(s => s.key)).toEqual(["terminal.scrollback-lines", "discover.wsl"]);
        expect(catalog.profileFields.map(s => s.key)).toEqual(["command"]);
        expect(catalog.settings[0]).not.toHaveProperty("oldNames");
        expect(catalog.settings[0]?.profileOverridable).toBeTrue();
        expect(catalog.profileFields[0]?.defaultText).toBe("The found shell's own command");
        expect(catalog.topLevel.map(k => k.key)).toEqual(["include"]);
        expect(catalog.customColorLabel).toBe("Custom color");
    });

    test("writes the actions with their categories, arguments and key names as browser codes", async () => {
        const to = await targets();
        await syncZinc(sources(), to);

        const file = await readJson<ActionsFile>(join(to.dataDir, outputs.actions));
        expect(file.categories).toEqual(["Clipboard", "Panes"]);
        expect(file.arguments.map(a => a.name)).toEqual(["direction"]);
        expect(file.keys.sequenceSeparator).toBe(">");
        expect(file.keys.names.map(n => [n.name, n.code])).toEqual([["a", "KeyA"], ["p", "KeyP"], ["plus", "Equal"], ["insert", "Insert"], ["pgup", "PageUp"]]);
        expect(file.keys.names[4]).toEqual({name: "pgup", aliases: ["pageup"], code: "PageUp"});
    });

    test("writes nothing when a key name's virtual key has no browser code", async () => {
        const to = await targets();
        expect(await failure(syncZinc(sources(r => r.keys.names.push({name: "oem8", aliases: [], virtualKey: 223})), to))).toMatch(/codeForVirtualKey[\s\S]*oem8: 223/);
        expect(existsSync(to.dataDir)).toBeFalse();
    });

    test("takes a release's reference only with the changelog of that release", async () => {
        const matching = await targets();
        await syncZinc(sources(r => r.zinc = {version: "0.1.0-dev.12+abc1234", release: "0.1.0-dev.12", date: "2026-02-03"}), matching);
        expect(existsSync(matching.dataDir)).toBeTrue();

        const other = await targets();
        expect(await failure(syncZinc(sources(r => r.zinc = {version: "0.1.0+abc1234", release: "0.1.0", date: "2026-03-01"}), other))).toMatch(/from Zinc 0\.1\.0 \(2026-03-01\), but the changelog's newest build is 0\.1\.0-dev\.12 \(2026-02-03\)/);
        expect(existsSync(other.dataDir)).toBeFalse();
    });

    test.each([
        ["a setting", (r: ZincReference) => r.settings[0]!.description = "As in Windows Terminal.", /terminal\.scrollback-lines: As in Windows Terminal\./],
        ["a profile field", (r: ZincReference) => r.profileFields[0]!.description = "Like Windows Terminal's.", /profile field command: Like Windows Terminal's\./],
        ["an action", (r: ZincReference) => r.actions[0]!.title = "Split, as in Windows Terminal", /action split: Split, as in Windows Terminal/],
        ["an action argument", (r: ZincReference) => r.actionArguments[0]!.text = "Any Windows Terminal direction", /action argument direction: Any Windows Terminal direction/],
        ["a top-level key", (r: ZincReference) => r.topLevel[0]!.takes = "A Windows Terminal file", /include: A Windows Terminal file/],
        ["a default in words", (r: ZincReference) => r.settings[0]!.defaultText = "What Windows Terminal does", /terminal\.scrollback-lines: What Windows Terminal does/],
        ["a notice", (r: ZincReference) => r.notices[1]!.use = "From windows  terminal", /\.NET use: From windows {2}terminal/],
    ])("writes nothing when %s names Windows Terminal", async (_, change, message) => {
        const to = await targets();
        expect(await failure(syncZinc(sources(change), to))).toMatch(message);
        expect(existsSync(to.dataDir)).toBeFalse();
        expect(existsSync(to.schemaFile)).toBeFalse();
    });

    test("writes nothing when the schema names Windows Terminal", async () => {
        const schema = fakeSchema();
        schema.properties.terminal.properties["scrollback-lines"].description = "As in Windows Terminal.";
        const to = await targets();
        expect(await failure(syncZinc({...sources(), schema: JSON.stringify(schema)}, to))).toMatch(/schema\.properties\.terminal\.properties\.scrollback-lines\.description: As in Windows Terminal\./);
        expect(existsSync(to.dataDir)).toBeFalse();
    });

    test("writes nothing when a changelog backtick doesn't close", async () => {
        const changelog = fakeChangelog.replace("- Panes as cards.", "- The quick terminal (Win+`) in `Settings > Quick terminal`.");
        const to = await targets();
        expect(await failure(syncZinc({...sources(), changelog}, to))).toMatch(/backtick that doesn't close[\s\S]*0\.1\.0-dev\.12 New: The quick terminal/);
        expect(existsSync(to.dataDir)).toBeFalse();
    });

    test("writes nothing when the reference has a format it doesn't know", async () => {
        const to = await targets();
        expect(await failure(syncZinc(sources(r => r.format = 2), to))).toMatch(/format 2/);
        expect(existsSync(to.dataDir)).toBeFalse();
    });
});

describe("readCheckout", () => {
    async function fakeCheckout(referenceDir = checkoutFiles.referenceDir) {
        const repo = await tempDir();
        await writeFile(join(repo, checkoutFiles.changelog), fakeChangelog);
        await mkdir(join(repo, referenceDir), {recursive: true});
        await writeFile(join(repo, referenceDir, checkoutFiles.reference), crlf(fakeReference()));
        await writeFile(join(repo, referenceDir, checkoutFiles.schema), crlf(fakeSchema()));
        return repo;
    }

    test("reads the export from dist/reference", async () => {
        const read = await readCheckout(await fakeCheckout());
        expect(read.changelog).toBe(fakeChangelog);
        expect((JSON.parse(read.reference) as ZincReference).zinc.version).toBe("0.1.0-dev+abc1234");
    });

    test("reads the export from another folder when it's given", async () => {
        const repo = await fakeCheckout("downloads");
        const {schema} = await readCheckout(repo, join(repo, "downloads"));
        expect((JSON.parse(schema) as {$id: string;}).$id).toBe(fakeSchema().$id);
    });

    test("says how to make the export when it's missing", async () => {
        const repo = await fakeCheckout();
        await rm(join(repo, checkoutFiles.referenceDir), {recursive: true});
        expect(await failure(readCheckout(repo))).toMatch(/Can't read .*zinc-reference\.json\. Run `dotnet run scripts\/dev\/export-reference\.cs`/);
    });
});

describe("the guard", () => {
    test("finds the name in our text, in any case and spacing", () => {
        const notice: Notice = {name: "ConPTY", version: "1", use: "Runs console programs (from windows  Terminal)", license: "MIT", url: "https://github.com/microsoft/terminal", licenseText: "Windows Terminal"};
        expect(findBannedNames(noticeTexts([notice])).map(t => t.where)).toEqual(["ConPTY use"]);
    });

    test("checks changelog notes, groups, items and nested items", () => {
        const entry: ChangelogEntry = {version: "1", date: "2026-01-01", notes: ["Windows Terminal"], groups: [{name: "Windows Terminal", items: [{text: "Windows Terminal", children: ["Windows Terminal"]}]}]};
        expect(findBannedNames(changelogTexts([entry]))).toHaveLength(4);
    });

    test("skips the schema's ids, references and patterns", () => {
        const schema = {$id: "windows terminal", $ref: "windows terminal", pattern: "windows terminal", enum: ["windows terminal"]};
        expect(findBannedNames(schemaTexts(schema)).map(t => t.where)).toEqual(["schema.enum[0]"]);
    });

    test.each([
        ["Plain text", false],
        ["One `code` and ``Win+` `` and `more`", false],
        ["The quick terminal (Win+`) in `Settings > Quick terminal`.", true],
        ["A lone ` backtick", true],
        ["``unclosed double` ", true],
    ])("hasUnclosedCode(%j) is %p", (text, unclosed) => {
        expect(hasUnclosedCode(text)).toBe(unclosed);
    });

    test("passes on the committed files", async () => {
        const changelog = await readJson<ChangelogEntry[]>(join(generated, outputs.changelog));
        const notices = await readJson<Notice[]>(join(generated, outputs.notices));
        const settings = await readJson<SettingsCatalog>(join(generated, outputs.settings));
        const actions = await readJson<ActionsFile>(join(generated, outputs.actions));
        const schema = await readJson<unknown>(servedSchema);
        const texts = [...changelogTexts(changelog), ...noticeTexts(notices), ...settingsTexts(settings), ...actionTexts(actions), ...schemaTexts(schema)];
        expect(findBannedNames(texts)).toEqual([]);
        expect(changelogTexts(changelog).filter(t => hasUnclosedCode(t.text)).map(t => t.where)).toEqual([]);
    });
});
