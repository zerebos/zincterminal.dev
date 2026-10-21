// The workflow mock-up... the sidebar plus Cards, with a failed command in the focused card
import {cursor, gut, pl, s, type Line, type Workspace} from "../../components/mock/term";

const prompt = pl(["zinc", "blue"], ["main", "green"]);

export const workflowLabel = "Zinc with workspaces in a sidebar, two tabs, a split, a failed-command mark and attention dots";

export const workflowWorkspaces: Workspace[] = [
    {name: "zinc", icon: "tabs", selected: true},
    {name: "api", icon: "folder", count: {value: 2, state: "error"}},
    {name: "docs", icon: "tabs", dot: {state: "attention", pulse: true}},
    {name: "prod", icon: "folder", dot: {state: "caution", pulse: true}}
];

export const workflowBuild: Line[] = [
    [gut("command"), prompt, " cmake --build build"],
    [gut(), s("dim", "[212/212] Linking zinc.exe")],
    [gut()],
    [gut("failed"), prompt, " ctest -j 8"],
    [gut(), "glyphs/powerline_joins ... ", s("bad", "Failed")],
    [gut()],
    [gut(), s("bad", "1 tests failed"), " out of 216"],
    [gut()],
    [gut(), pl(["zinc", "blue"], ["exit 8", "red"]), " ", cursor]
];

export const workflowLog: Line[] = [
    [gut("command"), s("ok", "$"), " git log --oneline"],
    [gut(), s("warn", "4e1c9a2"), " Draw ▚ cells"],
    [gut(), s("warn", "b07d311"), " Heavy arms"],
    [gut(), s("warn", "9a2f5c8"), " Odd widths"],
    [gut(), s("warn", "71e04bd"), " Reset arrows"],
    [gut(), s("warn", "2c88e17"), " Reopen tabs"],
    [gut()],
    [gut(), s("ok", "$"), " "]
];
