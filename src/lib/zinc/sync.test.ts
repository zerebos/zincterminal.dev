// Runs the sync on a tiny fake repo shaped like Zinc's, written to a temp folder, and checks the
// committed JSON with the guard. The parsing cases are in the parsers' own tests. None of it reads ../zinc.

import {afterEach, describe, expect, test} from "bun:test";
import {existsSync} from "node:fs";
import {mkdir, mkdtemp, readFile, rm, writeFile} from "node:fs/promises";
import {tmpdir} from "node:os";
import {dirname, join} from "node:path";
import {changelogTexts, findBannedNames, noticeTexts} from "./guard";
import {outputs, sources, syncZinc} from "./sync";
import type {ChangelogEntry, Notice} from "./types";


const generated = join(import.meta.dir, "../../data/generated");

const files = {
    [sources.changelog]: "# Changelog\n\n## Unreleased\n\n### New\n- Not yet.\n\n## 0.1.0-dev.12 (2026-02-03)\n\n### New\n- Panes as cards.\n",
    [sources.project]: "<Project><PropertyGroup><TargetFramework>net10.0-windows</TargetFramework></PropertyGroup></Project>",
    [sources.notices]: String.raw`class X {
    public static IReadOnlyList<OpenSourceComponent> Components { get; } =
    [
        new(".NET", Environment.Version.ToString(), "The runtime", "MIT", "https://github.com/dotnet/runtime", @"Licenses\dotnet.txt", []),
        new("Cascadia Mono NF", "2407.024", "The default font", "OFL-1.1", "https://github.com/microsoft/cascadia-code", @"Fonts\LICENSE-CascadiaCode.txt", []),
    ];
}`,
    "assets/licenses/dotnet.txt": "The MIT License (MIT)\r\n\r\n",
    "assets/fonts/LICENSE-CascadiaCode.txt": "SIL OPEN FONT LICENSE\n",
};

const temps: string[] = [];
afterEach(async () => {
    await Promise.all(temps.splice(0).map(dir => rm(dir, {recursive: true, force: true})));
});

/** Writes the fake repo, with any file swapped out */
async function fakeRepo(changes: Record<string, string> = {}) {
    const repo = await mkdtemp(join(tmpdir(), "sync-zinc-"));
    temps.push(repo);
    for (const [path, text] of Object.entries({...files, ...changes})) {
        await mkdir(dirname(join(repo, path)), {recursive: true});
        await writeFile(join(repo, path), text);
    }
    return repo;
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
    test("writes the changelog, notices and release", async () => {
        const repo = await fakeRepo();
        const out = join(repo, "out");
        await syncZinc(repo, out);

        expect(await readJson(join(out, outputs.release))).toEqual({version: "0.1.0-dev.12", date: "2026-02-03"});
        const changelog = await readJson<ChangelogEntry[]>(join(out, outputs.changelog));
        expect(changelog.map(e => e.version)).toEqual(["0.1.0-dev.12"]);

        const notices = await readJson<Notice[]>(join(out, outputs.notices));
        expect(notices.map(n => [n.name, n.version, n.licenseText])).toEqual([
            [".NET", "10", "The MIT License (MIT)"],
            ["Cascadia Mono NF", "2407.024", "SIL OPEN FONT LICENSE"],
        ]);
    });

    test("writes nothing when a text names Windows Terminal", async () => {
        const notices = files[sources.notices] ?? "";
        const repo = await fakeRepo({[sources.notices]: notices.replace("The default font", "The default font (from Windows Terminal)")});
        const out = join(repo, "out");
        expect(await failure(syncZinc(repo, out))).toMatch(/Cascadia Mono NF use: The default font \(from Windows Terminal\)/);
        expect(existsSync(out)).toBeFalse();
    });

    test("names the file it can't find", async () => {
        const repo = await fakeRepo();
        await rm(join(repo, "assets/fonts"), {recursive: true});
        expect(await failure(syncZinc(repo, join(repo, "out")))).toMatch(/Can't read assets\/fonts\/LICENSE-CascadiaCode\.txt/);
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

    test("passes on the committed JSON", async () => {
        const changelog = await readJson<ChangelogEntry[]>(join(generated, outputs.changelog));
        const notices = await readJson<Notice[]>(join(generated, outputs.notices));
        expect(findBannedNames([...changelogTexts(changelog), ...noticeTexts(notices)])).toEqual([]);
    });
});
