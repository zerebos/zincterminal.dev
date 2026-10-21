// Reads a Zinc checkout and writes the JSON the site builds from. Nothing is written unless every
// source parses and passes the guard.

import {mkdir, readFile, writeFile} from "node:fs/promises";
import {join} from "node:path";
import {latestRelease, parseChangelog} from "./changelog";
import {changelogTexts, findBannedNames, noticeTexts} from "./guard";
import {cleanLicenseText, dotnetMajor, licenseSourcePath, parseNotices} from "./notices";
import type {Notice} from "./types";


export const sources = {
    changelog: "CHANGELOG.md",
    notices: "src/Zinc.Core/OpenSourceNotices.cs",
    project: "src/Zinc/Zinc.csproj",
};

export const outputs = {
    changelog: "zinc-changelog.json",
    notices: "zinc-notices.json",
    release: "zinc-release.json",
};

async function read(repo: string, path: string) {
    try {
        return await readFile(join(repo, path), "utf8");
    }
    catch {
        throw new Error(`Can't read ${path} in ${repo}`);
    }
}

export async function syncZinc(repo: string, outDir: string) {
    const changelog = parseChangelog(await read(repo, sources.changelog));
    const release = latestRelease(changelog);
    const dotnet = dotnetMajor(await read(repo, sources.project));

    const records = parseNotices(await read(repo, sources.notices), dotnet);
    const notices: Notice[] = await Promise.all(records.map(async ({licenseFile, ...record}) => ({
        ...record,
        licenseText: cleanLicenseText(await read(repo, licenseSourcePath(licenseFile))),
    })));

    const named = findBannedNames([...changelogTexts(changelog), ...noticeTexts(notices)]);
    if (named.length) {
        const list = named.map(t => `  ${t.where}: ${t.text}`).join("\n");
        throw new Error(`These texts name Windows Terminal. Change them in the Zinc repo, then sync again.\n${list}`);
    }

    await mkdir(outDir, {recursive: true});
    const write = (file: string, data: unknown) => writeFile(join(outDir, file), `${JSON.stringify(data, null, 4)}\n`);
    await write(outputs.changelog, changelog);
    await write(outputs.notices, notices);
    await write(outputs.release, release);

    return {changelog, notices, release};
}
