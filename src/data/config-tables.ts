// The config reference's tables, in page order, with the title and line that open each one. Zinc's
// catalog has nothing per table, so these are ours. A table Zinc adds stops the build until it's here.

export interface ConfigTable {

    /** Its name in config.toml, such as `font` for `[font]` */
    table: string;
    title: string;

    /** One sentence, as Markdown */
    about: string;
}

export const configTables: ConfigTable[] = [
    {table: "font", title: "Font", about: "The terminal's font. A profile can set its own, under `[profile.<id>.font]`."},
    {table: "colors", title: "Colors", about: "The color scheme, and colors that override it. A profile can set its own, under `[profile.<id>.colors]`."},
    {table: "terminal", title: "Terminal", about: "How the terminal behaves. A profile can set its own, under `[profile.<id>.terminal]`."},
    {table: "shaders", title: "Shaders", about: "Effects drawn over the terminal. A profile can set its own, under `[profile.<id>.shaders]`."},
    {table: "window", title: "Window", about: "The window, its workspaces and panes. These apply to every profile."},
    {table: "notify", title: "Notifications", about: "What Zinc does when a command finishes, fails or rings the bell in a pane you aren't looking at."},
    {table: "quick-terminal", title: "Quick terminal", about: "The terminal a hotkey brings in from the edge of the screen, wherever you are."},
    {table: "discover", title: "Finding shells", about: "Which shells Zinc looks for on your PC and lists as profiles. Each is on until you turn it off."},
    {table: "cli", title: "Command line", about: "What `zn`, Zinc's command-line tool, may do, and where it runs."},
    {table: "updates", title: "Updates", about: "How Zinc keeps itself up to date."},
    {table: "debug", title: "Troubleshooting", about: "A log of what Zinc does, for bug reports."}
];
