// Turns the synced settings catalog into what the config reference shows

import type {Setting} from "./types";


/** A setting's table in config.toml: `font` for `font.size` */
export const tableOf = (key: string) => key.split(".")[0] ?? key;

/** Whether a profile can set its own value, as Zinc's `ProfileOverridable` decides */
export const perProfile = (key: string) => ["font", "colors", "terminal", "shaders"].includes(tableOf(key));

/**
 * The settings grouped by table, in the order `tables` gives. Throws when the catalog has a table
 * that isn't listed, or a listed table has no settings, so the two can't drift apart.
 */
export function byTable<T extends {table: string}>(settings: Setting[], tables: T[]) {
    const listed = new Set(tables.map(t => t.table));
    const missing = [...new Set(settings.map(s => tableOf(s.key)))].filter(table => !listed.has(table));
    if (missing.length) throw new Error(`The config reference has no title for ${missing.map(t => `[${t}]`).join(", ")}. Add it to src/data/config-tables.ts.`);

    return tables.map(table => {
        const entries = settings.filter(s => tableOf(s.key) === table.table);
        if (entries.length === 0) throw new Error(`[${table.table}] has no settings in Zinc's catalog. Remove it from src/data/config-tables.ts.`);
        return {...table, settings: entries};
    });
}
