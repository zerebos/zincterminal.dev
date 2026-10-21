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
