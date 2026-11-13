// `bun run sync:zinc` refreshes src/data/generated and public/schema from a Zinc checkout (ZINC_REPO,
// default ../zinc). The reference export comes from the checkout's dist/reference, or from the folder in
// ZINC_REFERENCE. Run it after each Zinc release and commit what it writes. The build reads only those files.

import {resolve} from "node:path";
import {readCheckout, syncZinc} from "../src/lib/zinc/sync";


const repo = resolve(process.env.ZINC_REPO ?? "../zinc");
const referenceDir = process.env.ZINC_REFERENCE ? resolve(process.env.ZINC_REFERENCE) : undefined;
const root = resolve(import.meta.dir, "..");

try {
    const sources = await readCheckout(repo, referenceDir);
    const {actions, changelog, notices, reference, release, settings} = await syncZinc(sources, {
        dataDir: resolve(root, "src/data/generated"),
        schemaFile: resolve(root, "public/schema/config.json"),
    });
    console.log(`Synced ${release.version} (${release.date}) from ${repo}`);
    console.log(`  The reference export is from Zinc ${reference.zinc.version}`);
    console.log(`  ${changelog.length} builds, ${notices.length} notices, ${settings.settings.length} settings, ${settings.profileFields.length} profile fields, ${settings.topLevel.length} top-level keys`);
    console.log(`  ${actions.actions.length} actions in ${actions.categories.length} categories, ${actions.keys.names.length} key names`);
}
catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
}
