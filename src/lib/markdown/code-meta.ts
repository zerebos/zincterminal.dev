// A Shiki transformer that keeps what the code block component needs... the fence's `title="…"`
// and the raw code for its copy button

interface Context {
    source: string;
    options: {meta?: {__raw?: string}};
}

/** The `title="…"` from a fence's meta, as in ` ```toml title="config.toml" ` */
export const fenceTitle = (meta = "") => /(?:^|\s)title="([^"]*)"/.exec(meta)?.[1];

export const codeMeta = {
    name: "code-meta",
    pre(this: Context, node: {properties: Record<string, unknown>}) {
        const title = fenceTitle(this.options.meta?.__raw);
        if (title) node.properties.dataTitle = title;
        node.properties.dataCode = this.source;
    }
};
