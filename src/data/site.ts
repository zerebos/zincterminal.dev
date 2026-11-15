import type {Release} from "../lib/zinc/types";
import zincRelease from "./generated/zinc-release.json";

// Zinc's roadmap link is null, and left out wherever it appears, until it has an address

const zincRepo = "https://github.com/zerebos/zinc";
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
    config: "/docs/config",
    keys: "/docs/keys",
    changelog: "/changelog",
    thirdPartyNotices: "/notices",

    zincRepo,
    zincIssues: `${zincRepo}/issues`,
    zincReleases: `${zincRepo}/releases`,
    zincLicense: `${zincRepo}/blob/main/LICENSE`,

    // Hidden until it has an address
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
}

/** A page that has its own link in the header */
export type NavPage = "docs" | "changelog" | "lit-cell";

export interface SiteNavLink extends NavLink {

    /** The page this link leads to, which the header marks as current while on it */
    page?: NavPage;
}

/** The header's links, the same on every page */
export const siteNav: SiteNavLink[] = [
    {label: "Docs", href: links.docs, page: "docs"},
    {label: "Changelog", href: links.changelog, page: "changelog"},
    {label: "Lit Cell", href: "/lit-cell", page: "lit-cell"},
    {label: "GitHub", href: links.zincRepo}
];

export interface FooterColumn {
    title: string;
    links: NavLink[];
}

/** The footer's columns, shared by every page. The Lit Cell page swaps the middle one for its own. */
export const footerProduct: FooterColumn = {
    title: "Product",
    links: [
        {label: "Features", href: "/#workflow"},
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
        {label: "The zn CLI", href: `${links.docs}#zn`},
        {label: "Config reference", href: links.config},
        {label: "Keys and actions", href: links.keys}
    ]
};

export const footerProject: FooterColumn = {
    title: "Project",
    links: [
        {label: "Source on GitHub", href: links.zincRepo},
        {label: "Report an issue", href: links.zincIssues},
        {label: "Send feedback", href: links.feedback},
        {label: "Discord", href: links.discord}
    ]
};

export const footer: FooterColumn[] = [footerProduct, footerDocs, footerProject];
