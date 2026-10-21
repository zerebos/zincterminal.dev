// The hero mock-up's terminal content
import {bx, cursor, pl, s, type Line, type Tab} from "../../components/mock/term";

const prompt = pl(["~\\src\\zinc", "blue"], ["main", "green"]);

export const heroLabel = "Zinc with panes as cards: a focused card with a Powerline prompt, a file tree and a box-drawn test summary, beside two smaller cards";

export const heroWorkspaces: Tab[] = [
    {name: "zinc", selected: true, workspace: true, slot: "close"},
    {name: "api"},
    {name: "docs", slot: {dot: "attention", pulse: true}}
];

export const heroFocused: Line[] = [
    [prompt, " eza --tree -L 2 renderer"],
    [s("info", "renderer")],
    [bx("udr"), bx("lr", 2), " ", s("info", "atlas")],
    [bx("ud"), "   ", bx("udr"), bx("lr", 2), " glyph_cache.cpp"],
    [bx("ud"), "   ", bx("ur"), bx("lr", 2), " glyph_cache.h"],
    [bx("udr"), bx("lr", 2), " box_drawing.cpp"],
    [bx("udr"), bx("lr", 2), " legacy_blocks.cpp"],
    [bx("ur"), bx("lr", 2), " powerline.cpp"],
    [],
    [prompt, " ctest -R glyphs"],
    [bx("rd"), bx("lr", 40), bx("ld")],
    [bx("ud"), " glyphs/box_drawing          ", s("ok", "128 passed"), " ", bx("ud")],
    [bx("ud"), " glyphs/powerline             ", s("ok", "24 passed"), " ", bx("ud")],
    [bx("ud"), " glyphs/legacy_blocks         ", s("ok", "64 passed"), " ", bx("ud")],
    [bx("udr"), bx("lr", 40), bx("udl")],
    [bx("ud"), " 216 tests                       ", s("dim", "1.24 s"), " ", bx("ud")],
    [bx("ur"), bx("lr", 40), bx("lu")],
    [],
    [prompt, " ", cursor]
];

export const heroGitLog: Line[] = [
    [s("ok", "❯"), " git log --oneline -4"],
    [s("warn", "4e1c9a2"), " Draw ▚ cells"],
    [s("warn", "b07d311"), " Heavy arms"],
    [s("warn", "9a2f5c8"), " Odd widths"],
    [s("warn", "71e04bd"), " Reset arrows"],
    [s("ok", "❯"), " "]
];

export const heroDevServer: Line[] = [
    ["  ", s("ok", "VITE v6.2.0"), "  ready"],
    [],
    ["  ", s("ok", "➜"), "  Local: ", s("info", "localhost:5173")],
    ["  ", s("dim", "➜  press h for help")]
];
