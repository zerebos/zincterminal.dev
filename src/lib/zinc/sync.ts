// Turns Zinc's changelog, reference export and config schema into the files the site builds from.
// Nothing is written unless every source parses and passes the guard.

import {mkdir, readFile, writeFile} from "node:fs/promises";
import {dirname, join} from "node:path";
import {latestRelease, parseChangelog} from "./changelog";
import {actionTexts, changelogTexts, findBannedNames, hasUnclosedCode, noticeTexts, schemaTexts, settingsTexts} from "./guard";
import {parseReference, parseSchema, schemaFileText} from "./reference";
import type {SettingsCatalog} from "./types";


/** The text of each source the sync reads */
export interface ZincSources {
    changelog: string;
    reference: string;
    schema: string;
}

/** Where the sources sit in a Zinc checkout. The export script writes the last two. */
export const checkoutFiles = {
    changelog: "CHANGELOG.md",
    referenceDir: "dist/reference",
    reference: "zinc-reference.json",
    schema: "config.schema.json",
};

export const outputs = {
    actions: "zinc-actions.json",
    changelog: "zinc-changelog.json",
    notices: "zinc-notices.json",
    release: "zinc-release.json",
    settings: "zinc-settings.json",
};

export interface SyncTargets {

    /** The folder for the JSON the pages import */
    dataDir: string;

    /** The schema file the site serves */
    schemaFile: string;
}

async function read(path: string, hint = "") {
    try {
        return await readFile(path, "utf8");
    }
    catch {
        throw new Error(`Can't read ${path}${hint}`);
    }
}

/** Reads the sources from a Zinc checkout, with the reference from `referenceDir` when it's given */
export async function readCheckout(repo: string, referenceDir = join(repo, checkoutFiles.referenceDir)): Promise<ZincSources> {
    const hint = ". Run `dotnet run scripts/dev/export-reference.cs` in the Zinc repo, or set ZINC_REFERENCE to a folder that has it.";
    return {
        changelog: await read(join(repo, checkoutFiles.changelog)),
        reference: await read(join(referenceDir, checkoutFiles.reference), hint),
        schema: await read(join(referenceDir, checkoutFiles.schema), hint),
    };
}

function listed(texts: Array<{where: string, text: string}>) {
    return texts.map(t => `  ${t.where}: ${t.text}`).join("\n");
}

export async function syncZinc(sources: ZincSources, targets: SyncTargets) {
    const changelog = parseChangelog(sources.changelog);
    const release = latestRelease(changelog);
    const reference = parseReference(sources.reference);
    const schema = parseSchema(sources.schema);

    // The site doesn't show old names, so they stay out of the committed JSON
    const strip = <T extends {oldNames: string[]}>({oldNames: _, ...rest}: T) => rest;
    const settings: SettingsCatalog = {
        sections: reference.sections,
        settings: [...reference.settings, ...reference.discovery].map(strip),
        fileOnly: reference.fileOnly,
        profileFields: reference.profileFields.map(strip),
    };
    const {actions, notices} = reference;

    const named = findBannedNames([
        ...changelogTexts(changelog),
        ...noticeTexts(notices),
        ...settingsTexts(settings),
        ...actionTexts(actions),
        ...schemaTexts(schema),
    ]);
    if (named.length) {
        throw new Error(`These texts name Windows Terminal. Change them in the Zinc repo, then sync again.\n${listed(named)}`);
    }

    const unclosed = changelogTexts(changelog).filter(t => hasUnclosedCode(t.text));
    if (unclosed.length) {
        throw new Error(`These changelog texts have a backtick that doesn't close, so their code spans pair up wrongly. Write a literal backtick inside a double-backtick span (\`\`Win+\` \`\`) in the Zinc repo, then sync again.\n${listed(unclosed)}`);
    }

    await mkdir(targets.dataDir, {recursive: true});
    const write = (file: string, data: unknown) => writeFile(join(targets.dataDir, file), `${JSON.stringify(data, null, 4)}\n`);
    await write(outputs.actions, actions);
    await write(outputs.changelog, changelog);
    await write(outputs.notices, notices);
    await write(outputs.release, release);
    await write(outputs.settings, settings);

    await mkdir(dirname(targets.schemaFile), {recursive: true});
    await writeFile(targets.schemaFile, schemaFileText(sources.schema));

    return {actions, changelog, notices, reference, release, settings};
}
