import type {Release} from "../lib/zinc/types";
import zincRelease from "./generated/zinc-release.json";

// Zinc's GitHub links are null, and left out wherever they appear, until the Zinc repo is public

const feedbackEmail = "feedback@zincterminal.dev";

export const links = {
    // Always the latest build
    download: "https://downloads.zincterminal.dev/Zinc-win-Setup.exe",
    downloadPortable: "https://downloads.zincterminal.dev/Zinc-win-Portable.zip",

    feedbackEmail,
    feedback: `mailto:${feedbackEmail}`,
    discord: "https://discord.gg/hfBuYW9JTe",
    litCellRepo: "https://github.com/zerebos/lit-cell",
    litCellSpec: "https://github.com/zerebos/lit-cell/blob/main/SPEC.md",
    litCellIssues: "https://github.com/zerebos/lit-cell/issues",
    iterm2Schemes: "https://github.com/mbadolato/iTerm2-Color-Schemes",
    libghostty: "https://github.com/ghostty-org/ghostty",

    docs: "/docs",
    changelog: "/changelog",
    thirdPartyNotices: "/notices",

    // Hidden until the Zinc repo is public
    zincRepo: null as string | null,
    zincReleases: null as string | null,
    zincIssues: null as string | null,
    zincRoadmap: null as string | null
};

// The newest build in Zinc's changelog, from `bun run sync:zinc`
const latest: Release = zincRelease;

export const release = {
    version: latest.version,

    /** `YYYY-MM-DD` */
    date: latest.date,
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

/** Leaves out links that are hidden for now */
export const shown = <T extends {href: string | null;}>(items: T[]) => items.filter((item): item is T & {href: string;} => item.href !== null);

/** The footer's columns, shared by every page. The Lit Cell page swaps the middle one for its own. */
export const footerProduct: FooterColumn = {
    title: "Product",
    links: [
        {label: "Features", href: "/#precision"},
        {label: "Themes", href: "/#themes"},
        {label: "Lit Cell", href: "/lit-cell"},
        {label: "Changelog", href: links.changelog},
        {label: "Download", href: "/#install"}
    ]
};

export const footerDocs: FooterColumn = {
    title: "Docs",
    links: [
        {label: "Getting started", href: `${links.docs}#getting-started`},
        {label: "Configuration", href: `${links.docs}#configuration`},
        {label: "Shell integration", href: `${links.docs}#shell-integration`},
        {label: "The zn CLI", href: `${links.docs}#zn`}
    ]
};

export const footerProject: FooterColumn = {
    title: "Project",
    links: shown([
        {label: "Source on GitHub", href: links.zincRepo},
        {label: "Releases", href: links.zincReleases},
        {label: "Send feedback", href: links.feedback},
        {label: "Discord", href: links.discord}
    ])
};

export const footer: FooterColumn[] = [footerProduct, footerDocs, footerProject];
