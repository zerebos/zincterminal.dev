// Undecided ones are "#" so they show as visible placeholders

export const links = {
    discord: "https://discord.gg/Fq7WMRDPWu",
    litCellRepo: "https://github.com/zerebos/lit-cell",
    litCellSpec: "https://github.com/zerebos/lit-cell/blob/main/SPEC.md",
    litCellIssues: "https://github.com/zerebos/lit-cell/issues",
    iterm2Schemes: "https://github.com/mbadolato/iTerm2-Color-Schemes",
    libghostty: "https://github.com/ghostty-org/ghostty",

    // Undecided until after the alpha
    zincRepo: "#",
    zincReleases: "#",
    zincIssues: "#",
    zincRoadmap: "#",
    docs: "#",
    changelog: "#",
    license: "#",
    thirdPartyNotices: "#"
} as const;

export const release = {
    version: "0.1.0-dev",
    requirements: "Windows 10 version 2004 or later, or Windows 11"
} as const;

export interface NavLink {
    label: string;
    href: string;
    current?: boolean;

    /** Hidden on phones when the header collapses links instead of using a menu */
    optional?: boolean;
}

export interface FooterColumn {
    title: string;
    links: NavLink[];
}
