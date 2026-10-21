// A Shiki transformer that keeps what the code block component needs... the fence's `title="…"`
// and `copy="…"`, and the raw code for its copy button

interface Context {
    source: string;
    options: {meta?: {__raw?: string}};
}

/** A `name="…"` option from a fence's meta, as in ` ```toml title="config.toml" ` */
export const fenceOption = (meta: string | undefined, name: string) => new RegExp(`(?:^|\\s)${name}="([^"]*)"`).exec(meta ?? "")?.[1];

export const codeMeta = {
    name: "code-meta",
    pre(this: Context, node: {properties: Record<string, unknown>}) {
        const meta = this.options.meta?.__raw;
        const title = fenceOption(meta, "title");
        const copy = fenceOption(meta, "copy");
        if (title) node.properties.dataTitle = title;
        if (copy) node.properties.dataCopy = copy;
        node.properties.dataCode = this.source;
    }
};
