// How to install Lit Cell in each terminal, from the reference's `T` array
import {links} from "./site";

export interface InstallStep {
    text: string;

    /** A snippet to copy, and the file or context it belongs in */
    code?: string;
    file?: string;
}

export interface Terminal {
    id: string;
    name: string;

    /** The steps for a variant, given its file name (lit-cell or lit-cell-light) and its title */
    steps: (file: string, title: string) => InstallStep[];
    link: {href: string, text: string;};
}

const folder = (name: string) => ({href: `${links.litCellRepo}/tree/main/${name}`, text: `Open the ${name} folder on GitHub`});

export const terminals: Terminal[] = [
    {
        id: "ghostty",
        name: "Ghostty",
        steps: (n, t) => [
            {text: `Built in as "${t}" once your Ghostty release includes it. Until then, copy the theme into Ghostty’s themes folder:`, code: `cp ghostty/${n} ~/.config/ghostty/themes/`, file: "shell"},
            {text: "Then set it in your Ghostty config:", code: `theme = ${n}`, file: "config"}
        ],
        link: folder("ghostty")
    },
    {
        id: "wt",
        name: "Windows Terminal",
        steps: (n, t) => [
            {text: `Paste windows-terminal/${n}.json into "schemes" in settings.json, then set it on a profile:`, code: `"colorScheme": "${t}"`, file: "settings.json"}
        ],
        link: folder("windows-terminal")
    },
    {
        id: "iterm2",
        name: "iTerm2",
        steps: n => [{text: `Settings > Profiles > Colors > Color Presets > Import, then choose iterm2/${n}.itermcolors.`}],
        link: folder("iterm2")
    },
    {
        id: "kitty",
        name: "kitty",
        steps: n => [{text: `Copy kitty/${n}.conf next to kitty.conf, then add:`, code: `include ${n}.conf`, file: "kitty.conf"}],
        link: folder("kitty")
    },
    {
        id: "wezterm",
        name: "WezTerm",
        steps: n => [{text: `Copy wezterm/${n}.toml to ~/.config/wezterm/colors/, then set:`, code: `config.color_scheme = "${n}"`, file: "wezterm.lua"}],
        link: folder("wezterm")
    },
    {
        id: "alacritty",
        name: "Alacritty",
        steps: n => [{text: "Add the file to import under [general]:", code: `[general]\nimport = ["/path/to/alacritty/${n}.toml"]`, file: "alacritty.toml"}],
        link: folder("alacritty")
    },
    {
        id: "foot",
        name: "foot",
        steps: n => [{text: "Include it under [main]:", code: `[main]\ninclude=/path/to/foot/${n}.ini`, file: "foot.ini"}],
        link: folder("foot")
    },
    {
        id: "konsole",
        name: "Konsole",
        steps: n => [{text: "Copy the scheme into Konsole’s folder:", code: `cp konsole/${n}.colorscheme ~/.local/share/konsole/`, file: "shell"}],
        link: folder("konsole")
    },
    {
        id: "vscode",
        name: "VS Code",
        steps: n => [{text: `Merge vscode/${n}.json into your user settings.json. It colors the integrated terminal.`}],
        link: folder("vscode")
    },
    {
        id: "zinc",
        name: "Zinc",
        steps: (_, t) => [{text: `Built in. Open Settings > Appearance and choose ${t}.`}],
        link: {href: "/", text: "Meet Zinc"}
    },
    {
        id: "more",
        name: "30+ more",
        steps: (_, t) => [{text: `PuTTY, Termux, Rio, Tilda and over 30 more formats come through iTerm2-Color-Schemes. Look for ${t} in its folder for your terminal.`}],
        link: {href: links.iterm2Schemes, text: "Open iTerm2-Color-Schemes"}
    }
];
