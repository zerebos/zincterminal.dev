// A tiny reference export, changelog and schema shaped like Zinc's, for the sync's tests

import {referenceFormat, schemaUrl} from "./reference";
import type {ReferenceSetting, ZincReference} from "./types";


export function fakeSetting(fields: Partial<ReferenceSetting> & {key: string;}): ReferenceSetting {
    return {
        section: "terminal",
        group: "Scrollback",
        label: "Scrollback lines",
        description: "How far back you can scroll.",
        kind: "number",
        default: 10000,
        choices: [],
        unit: null,
        minimum: 0,
        maximum: 100000,
        step: 1000,
        placeholder: null,
        nullLabel: null,
        numbersAsNumbers: false,
        profileOverridable: true,
        oldNames: [],
        ...fields,
    };
}

export function fakeReference(): ZincReference {
    return {
        format: referenceFormat,
        zinc: {version: "0.1.0-dev+abc1234"},
        sections: [{id: "terminal", title: "Terminal"}, {id: "profiles", title: "Profiles"}],
        settings: [fakeSetting({key: "terminal.scrollback-lines", oldNames: ["terminal.scrollback"]})],
        fileOnly: [{key: "colors.palette", text: "Palette colors by number are set in config.toml."}],
        profileFields: [fakeSetting({key: "command", section: "profiles", group: "General", label: "Command", kind: "text", default: null, profileOverridable: false})],
        discovery: [fakeSetting({key: "discover.wsl", section: "profiles", group: "Find shells on this PC", label: "WSL distributions", kind: "toggle", default: true, profileOverridable: false})],
        actions: [{name: "split", title: "Split", description: "Split the focused pane: right, down, left or up.", argument: "direction", category: "Panes", defaultKeys: [{keys: "alt+shift+plus", action: "split right"}]}],
        notices: [
            {name: "Zinc", version: null, use: "This app", license: "Apache-2.0", url: "https://zincterminal.dev", licenseText: "Apache License"},
            {name: ".NET", version: "10.0.13", use: "The runtime", license: "MIT", url: "https://github.com/dotnet/runtime", licenseText: "The MIT License (MIT)"},
        ],
    };
}

export const fakeChangelog = "# Changelog\n\n## Unreleased\n\n### New\n- Not yet.\n\n## 0.1.0-dev.12 (2026-02-03)\n\n### New\n- Panes as cards.\n";

export function fakeSchema() {
    return {
        $schema: "http://json-schema.org/draft-07/schema#",
        $id: schemaUrl,
        title: "Zinc config.toml",
        type: "object",
        properties: {
            terminal: {type: "object", properties: {"scrollback-lines": {type: "integer", description: "How far back you can scroll."}}},
        },
    };
}

/** Zinc writes its files with CRLF line ends */
export const crlf = (data: unknown) => JSON.stringify(data, null, 2).replace(/\n/g, "\r\n");
