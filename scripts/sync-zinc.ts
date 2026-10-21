// `bun run sync:zinc` ... refreshes src/data/generated from a Zinc checkout (ZINC_REPO, default ../zinc).
// Run it after each Zinc release and commit the JSON. The build reads only the JSON.

import {resolve} from "node:path";
import {syncZinc} from "../src/lib/zinc/sync";


const repo = resolve(process.env.ZINC_REPO ?? "../zinc");
const outDir = resolve(import.meta.dir, "../src/data/generated");

try {
    const {changelog, notices, release} = await syncZinc(repo, outDir);
    console.log(`Synced ${release.version} (${release.date}) from ${repo}`);
    console.log(`  ${changelog.length} builds, ${notices.length} components`);
}
catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
}
