// The Lit Cell page's terminal samples, from the reference
import type {Sample} from "../components/lit-cell/scheme";

const prompt = ["g", "❯"] as [string, string];

/** A directory listing, a build with a warning and an error, git status, a selection and the cursor */
export const heroSample: Sample = [
    [["b bold", "~/src/lit-cell"], " ", ["sub", "on"], " ", ["m", "main"]],
    [prompt, " ls"],
    ["README.md  ", ["selx", "SPEC.md"], "  ", ["b bold", "alacritty/"], "  ", ["b bold", "ghostty/"], "  ", ["b bold", "kitty/"], "  ", ["b bold", "src/"]],
    [prompt, " cargo build"],
    ["   ", ["g bold", "Compiling"], " lit-cell v1.2.0 (~/src/lit-cell)"],
    [["y bold", "warning"], ["bold", ": unused variable: `glow`"]],
    ["  ", ["b bold", "-->"], " src/palette.rs:42:9"],
    [["b bold", "42 |"], "     let glow = mix(fg, bg, 0.04);"],
    [["b bold", "   |"], "         ", ["y bold", "^^^^"], " ", ["cy", "help: try `_glow`"]],
    [["r bold", "error[E0308]"], ["bold", ": mismatched types"]],
    ["  ", ["b bold", "-->"], " src/contrast.rs:17:5"],
    [["b bold", "17 |"], "     ratio"],
    [["b bold", "   |"], "     ", ["r bold", "^^^^^"], " ", ["r", "expected `f32`, found `f64`"]],
    [["r bold", "error"], ["bold", ": could not compile `lit-cell`"]],
    [prompt, " git status -s"],
    [" ", ["y", "M"], " SPEC.md"],
    [" ", ["g", "A"], " src/light.rs"],
    [" ", ["r", "D"], " palette.svg"],
    [prompt, " ", ["cursor", " "]]
];

/** Python source, with the current line and an active search match */
export const codeSample: Sample = [
    {no: 1, spans: [["m", "from"], " dataclasses ", ["m", "import"], " dataclass"]},
    {no: 2, spans: [["m", "import"], " re"]},
    {no: 3, spans: [["y", "RUN"], " ", ["sub", "="], " re", ["sub", "."], ["b", "compile"], ["sub", "("], ["g", "r\"[█▚]+"], ["by", "\\n"], ["g", "?\""], ["sub", ")"]]},
    {no: 4, spans: []},
    {no: 5, spans: [["bb", "@dataclass"], ["sub", "("], "frozen", ["sub", "="], ["y", "True"], ["sub", ")"]]},
    {no: 6, spans: [["m", "class"], " ", ["cy", "Cell"], ["sub", ":"]]},
    {no: 7, spans: ["    ", ["g", "\"\"\"A lit cell on the grid.\"\"\""]]},
    {no: 8, spans: ["    ", ["bc", "x"], ["sub", ":"], " ", ["cy", "int"]]},
    {no: 9, spans: ["    ", ["bc", "glow"], ["sub", ":"], " ", ["cy", "float"], " ", ["sub", "="], " ", ["y", "0.86"]]},
    {no: 10, spans: []},
    {no: 11, kind: "cur", spans: ["    ", ["m", "def"], " ", ["b", "lit"], ["sub", "("], ["bm", "self"], ["sub", ","], " ", ["sa", "pattern"], ["sub", ":"], " ", ["cy", "str"], ["sub", ") ->"], " ", ["cy", "bool"], ["sub", ":"]]},
    {no: 12, spans: ["        ", ["bk", "# a run of lit or half-lit cells"]]},
    {no: 13, spans: ["        ", ["m", "return"], " ", ["y", "RUN"], ["sub", "."], ["b", "fullmatch"], ["sub", "("], "pattern", ["sub", ")"], " ", ["m", "is not"], " ", ["y", "None"]]}
];

/** A git diff, with + and - markers and the changed words tinted */
export const diffSample: Sample = [
    [["file-header", "diff --git a/src/cell.py b/src/cell.py"]],
    [["extended-header", "index 3f1c2a0..9b7e4d1 100644"]],
    [["file-header", "--- a/src/cell.py"]],
    [["file-header", "+++ b/src/cell.py"]],
    [["hunk-header", "@@ -7,5 +7,6 @@"], " class Cell:"],
    ["     \"\"\"A lit cell on the grid.\"\"\""],
    ["     x: int"],
    {kind: "del", spans: [["r", "-    glow: float = "], ["r wdel", "0.80"]]},
    {kind: "add", spans: [["g", "+    glow: float = "], ["g wadd", "0.86"]]},
    {kind: "add", spans: [["g", "+    dim: float = 0.50"]]},
    [],
    ["     def lit(self, pattern: str) -> bool:"]
];

/** A type checker's error, warning, info and hint, each with its own underline shape */
export const diagnosticsSample: Sample = [
    [["r bold", "error"], "  ", ["bk", "src/glow.py:12:16"]],
    ["  Cannot access attribute \"fullmach\" for \"Pattern[str]\""],
    [["bk", "12 │"], "     return RUN.", ["ew", "fullmach"], "(text)"],
    [],
    [["y bold", "warning"], "  ", ["bk", "src/glow.py:2:8"]],
    ["  Import \"os\" is not accessed"],
    [["bk", " 2 │"], " import ", ["wd", "os"]],
    [],
    [["b bold", "info"], "  ", ["bk", "src/glow.py:7:5"]],
    ["  Function \"dim\" has no docstring"],
    [["bk", " 7 │"], " def ", ["id", "dim"], "(level: float) -> float:"],
    [],
    [["cy bold", "hint"], "  ", ["bk", "src/glow.py:9:9"]],
    ["  \"step\" can be inlined"],
    [["bk", " 9 │"], "     ", ["hd", "step"], " = level * 0.5"]
];
