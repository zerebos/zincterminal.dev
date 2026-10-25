import {describe, expect, test} from "bun:test";
import {parseCatalog, parseConstants} from "./catalog";
import {Scanner, type Value} from "./csharp";


/** A catalog shaped like Zinc's, with the given `All` entries */
const catalog = (all: string, extra = "") => `public static class SettingsCatalog
{
    public static IReadOnlyList<SettingsSection> Sections { get; } =
    [
        new("appearance", "Appearance", ""),
        new("profiles", "Profiles", ""),
    ];

    private static readonly SettingChoice[] Shared =
    [
        new("On", "on", "It's on."),
        new("Off", "off"),
    ];
${extra}
    public static IReadOnlyList<SettingDef> All { get; } =
    [
${all}
    ];

    public static IReadOnlyList<SettingDef> Discovery { get; } =
    [
        new("profiles", "Find shells on this PC", "discover.wsl", "WSL distributions", "", SettingKind.Toggle, true),
    ];

    public static IReadOnlyDictionary<string, string> FileOnly { get; } = new Dictionary<string, string>
    {
        ["colors.palette"] = "Palette colors by number are set in config.toml.",
    };
}
`;

const size = `new("appearance", "Font", "font.size", "Size", "Ctrl+0 returns to this size.", SettingKind.Number, 10.5)
            { Unit = "pt", Minimum = 4, Maximum = 72, Step = 0.5 },`;

describe("parseCatalog", () => {
    test("reads sections, settings, discovery and file-only keys", () => {
        const result = parseCatalog(catalog(size));
        expect(result.sections).toEqual([{id: "appearance", title: "Appearance"}, {id: "profiles", title: "Profiles"}]);
        expect(result.settings.map(s => s.key)).toEqual(["font.size", "discover.wsl"]);
        expect(result.fileOnly).toEqual([{key: "colors.palette", text: "Palette colors by number are set in config.toml."}]);
        expect(result.settings[0]).toEqual({
            section: "appearance",
            group: "Font",
            key: "font.size",
            label: "Size",
            description: "Ctrl+0 returns to this size.",
            kind: "number",
            default: 10.5,
            choices: [],
            unit: "pt",
            minimum: 4,
            maximum: 72,
            step: 0.5,
            placeholder: null,
            nullLabel: null,
            numbersAsNumbers: false,
        });
    });

    test("reads choices, a null choice value and shared choice lists", () => {
        const all = `new("appearance", "Colors", "colors.pane-header", "Pane headers", "", SettingKind.Color, null)
            { Choices = [new("Subtle", "subtle"), new("Standard", null)], NullLabel = "Standard", Placeholder = "From the background" },
        new("appearance", "Font", "font.ligatures", "Ligatures", "", SettingKind.Choice, "off") { Choices = Shared },`;
        const [pane, ligatures] = parseCatalog(catalog(all)).settings;
        expect(pane?.choices).toEqual([{label: "Subtle", value: "subtle", detail: null}, {label: "Standard", value: null, detail: null}]);
        expect(pane?.nullLabel).toBe("Standard");
        expect(pane?.placeholder).toBe("From the background");
        expect(ligatures?.choices).toEqual([{label: "On", value: "on", detail: "It's on."}, {label: "Off", value: "off", detail: null}]);
    });

    test("resolves constants, casts and long numbers", () => {
        const all = `new("appearance", "Scrollback", "terminal.scrollback-lines", "Scrollback lines", "", SettingKind.Number, (long)Config.DefaultScrollbackLines)
            { Maximum = Config.MaxScrollbackLines, Step = 1000 },
        new("appearance", "Spacing", "terminal.padding-x", "Padding", "", SettingKind.Number, 6L) { Maximum = double.MaxValue },`;
        const constants = parseConstants("public const int DefaultScrollbackLines = 10_000;\npublic const int MaxScrollbackLines = 100_000;", "Config");
        const [lines, padding] = parseCatalog(catalog(all), constants).settings;
        expect([lines?.default, lines?.maximum, lines?.step]).toEqual([10000, 100000, 1000]);
        expect([padding?.default, padding?.maximum]).toEqual([6, null]);
    });

    test("leaves out unfinished settings", () => {
        const all = `${size}\n        new("appearance", "Font", "font.later", "Later", "", SettingKind.Toggle, false) { Unfinished = true },`;
        expect(parseCatalog(catalog(all)).settings.map(s => s.key)).toEqual(["font.size", "discover.wsl"]);
    });

    test.each([
        ["an unknown kind", `new("appearance", "Font", "font.x", "X", "", SettingKind.Slider, 1),`, /font\.x has an unknown kind/],
        ["an unknown property", `new("appearance", "Font", "font.x", "X", "", SettingKind.Toggle, true) { Tooltip = "hi" },`, /font\.x has an unknown property Tooltip/],
        ["an unknown constant", `new("appearance", "Font", "font.x", "X", "", SettingKind.Number, Config.Nope),`, /font\.x's default must be a number or a known constant/],
        ["an unknown section", `new("keyboard", "Keys", "font.x", "X", "", SettingKind.Toggle, true),`, /font\.x is in an unknown section "keyboard"/],
        ["a duplicate key", `${size}\n${size}`, /font\.size is listed twice/],
        ["a missing argument", `new("appearance", "Font", "font.x", "X", SettingKind.Toggle, true),`, /7 arguments/],
        ["an unknown shared list", `new("appearance", "Font", "font.x", "X", "", SettingKind.Choice, "a") { Choices = Missing },`, /font\.x's choices must be a list/],
    ])("throws on %s", (_, all, error) => {
        expect(() => parseCatalog(catalog(all))).toThrow(error);
    });

    test("throws when a list is missing", () => {
        expect(() => parseCatalog("class X {}")).toThrow(/no `Sections \{ get; \} =` list/);
    });
});

describe("parseConstants", () => {
    test("reads int, float and double constants with underscores and suffixes", () => {
        const source = "public const int Max = 100_000;\npublic const float Size = 10.5f;\npublic const double Ratio = 0.25;\nprivate const int Hidden = 1;";
        expect(parseConstants(source, "Config")).toEqual({"Config.Max": 100000, "Config.Size": 10.5, "Config.Ratio": 0.25});
    });
});

describe("Scanner.value", () => {
    test.each<[string, Value]>([
        ["\"text\"", {kind: "string", value: "text"}],
        ["10_000L", {kind: "number", value: 10000}],
        ["-0.5", {kind: "number", value: -0.5}],
        ["true", {kind: "bool", value: true}],
        ["null", {kind: "null"}],
        ["(long)Config.Max", {kind: "name", value: "Config.Max"}],
        ["Environment.Version.ToString()", {kind: "name", value: "Environment.Version.ToString()"}],
        ["[1, 2,]", {kind: "array", items: [{kind: "number", value: 1}, {kind: "number", value: 2}]}],
        ["new(\"a\") { Step = 2, }", {kind: "new", args: [{kind: "string", value: "a"}], init: {Step: {kind: "number", value: 2}}}],
    ])("reads %s", (source, value) => {
        expect(new Scanner(source, "test.cs").value()).toEqual(value);
    });

    test("names the file and line when it fails", () => {
        expect(() => new Scanner("\n\n  ?", "test.cs").value()).toThrow(/test\.cs line 3: expected a value/);
    });
});
