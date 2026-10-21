// The gallery's mock-up tiles, until real screenshots replace them
import {cursor, cursorShape, pl, s, type Line, type Workspace} from "../../components/mock/term";

const prompt = pl(["~\\src\\zinc", "blue"], ["main", "green"]);

/** The same diff and selection in Lit Cell and Lit Cell Light */
export const litCellSample: Line[] = [
    [prompt, " git diff --stat"],
    [" renderer/box_drawing.cpp ", s("dim", "|"), " 14 ", s("ok", "++++++++"), s("bad", "----")],
    [" renderer/powerline.cpp   ", s("dim", "|"), "  6 ", s("ok", "+++++"), s("bad", "-")],
    [" 2 files changed, ", s("ok", "13 insertions(+)"), ", ", s("bad", "5 deletions(-)")],
    [s("dim", "# the selected word:"), " ", s("sel", "glyph"), "_cache"],
    [prompt, " ", cursor]
];

export const nightfallWorkspaces: Workspace[] = [
    {name: "api", icon: "tabs", selected: true},
    {name: "web", icon: "folder", dot: {state: "attention"}},
    {name: "infra", icon: "tabs", colored: true}
];

export const nightfall: Line[] = [
    ["PS C:\\src\\api> git log --oneline -3"],
    [s("warn", "a41c0de"), " Retry on 503"],
    [s("warn", "7be92f1"), " Add a health check"],
    [s("warn", "03d5e8a"), " Move to .NET 9"],
    ["PS C:\\src\\api> ", cursor]
];

const dotfiles = pl(["~\\dotfiles", "blue"], ["main", "magenta"]);

export const overnightSlumber: Line[] = [
    [dotfiles, " ls"],
    [s("info", "ghostty"), "  ", s("info", "nvim"), "  zinc.toml"],
    [dotfiles, " git diff --stat"],
    [" zinc.toml ", s("dim", "|"), " 4 ", s("ok", "++"), s("bad", "--")],
    [dotfiles, " ", cursorShape("bar")]
];

export const peppermintWorkspaces: Workspace[] = [
    {name: "work", icon: "folder", selected: true},
    {name: "home", icon: "tabs"},
    {name: "scratch", icon: "tabs"}
];

export const peppermint: Line[] = [
    [s("ok", "C:\\work>"), "dir /b"],
    [s("info", "build")],
    [s("info", "src")],
    ["README.md"],
    [s("ok", "C:\\work>"), cursorShape("outline")]
];

const ubuntu = [s("ok", "ubuntu"), " ", s("info", "~/notes"), " $ "];

export const pyrokaiLight: Line[] = [
    [...ubuntu, "wc -l *.md"],
    ["  48 todo.md"],
    [" 112 zinc.md"],
    [" 160 total"],
    [...ubuntu, "head -2 zinc.md"],
    [s("info", "# Zinc")],
    ["Notes for the landing page."],
    [...ubuntu, cursorShape("underline")]
];
