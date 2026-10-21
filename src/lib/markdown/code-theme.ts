// The Shiki theme for code blocks. Its colors are the terminal tokens, so blocks follow the site's
// theme with no CSS of their own. The scopes match the reference... keys blue, table headers cyan,
// quoted strings green, numbers and booleans yellow, comments bright black, the rest foreground.

const color = (name: string) => ({foreground: `var(--term-${name})`});

export const codeTheme = {
    name: "zinc-terminal",
    type: "dark",
    colors: {
        "editor.foreground": "var(--term-fg)",
        "editor.background": "var(--term-bg)"
    },
    tokenColors: [
        {scope: ["comment", "punctuation.definition.comment"], settings: color("bright-black")},
        {scope: ["variable.other.key", "support.type.property-name"], settings: color("blue")},
        {scope: ["entity.name.section", "meta.group.toml"], settings: color("cyan")},
        {scope: ["string.quoted"], settings: color("green")},
        {scope: ["constant.numeric", "constant.language"], settings: color("yellow")},
        {scope: ["entity.name.command"], settings: color("green")}
    ]
};
