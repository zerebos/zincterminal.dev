import {describe, expect, test} from "bun:test";
import {cleanLicenseText, dotnetMajor, licenseSourcePath, parseNotices} from "./notices";


const list = (records: string) => `class X {\n    public static IReadOnlyList<OpenSourceComponent> Components { get; } =\n    [\n${records}\n    ];\n}\n`;
const record = (version = "\"1.0\"", use = "\"Does a thing\"") => `new("Thing", ${version}, ${use}, "MIT", "https://example.com", @"Licenses\\Thing.txt", ["Pkg"]),`;

describe("parseNotices", () => {
    test("reads a record", () => {
        expect(parseNotices(list(record()), "10")).toEqual([
            {name: "Thing", version: "1.0", use: "Does a thing", license: "MIT", url: "https://example.com", licenseFile: "Licenses\\Thing.txt"},
        ]);
    });

    test("fills .NET's runtime version", () => {
        expect(parseNotices(list(record("Environment.Version.ToString()")), "10")[0]?.version).toBe("10");
    });

    test("turns an empty version into null", () => {
        expect(parseNotices(list(record("\"\"")), "10")[0]?.version).toBeNull();
    });

    test("reads escapes and verbatim quotes", () => {
        const [n] = parseNotices(list(record("@\"a \"\"b\"\"\"", "\"say \\\"hi\\\" \\\\ now\"")), "10");
        expect(n?.version).toBe("a \"b\"");
        expect(n?.use).toBe("say \"hi\" \\ now");
    });

    test("skips comments, including ones with URLs", () => {
        const records = `        // https://example.com, new("Not", "a", "record")\n        ${record()}\n        /* new( */ ${record()}`;
        expect(parseNotices(list(records), "10")).toHaveLength(2);
    });

    test("reads a last record without a trailing comma", () => {
        expect(parseNotices(list(record().replace(/,$/, "")), "10")).toHaveLength(1);
    });

    test.each([
        ["no list", "class X {}", /no `Components/],
        ["an empty list", list(""), /list is empty/],
        ["a missing argument", list("new(\"A\", \"1\", \"use\", \"MIT\", \"url\", @\"Licenses\\A.txt\"),"), /expected 7 arguments, found 6/],
        ["another expression as a version", list(record("Some.Other.Value")), /unsupported version for Thing/],
        ["an expression elsewhere", list(record("\"1\"", "Use.Text")), /Use must be a string literal/],
        ["an interpolated string", list(record("$\"{v}\"")), /interpolated/],
    ])("throws on %s", (_, source, error) => {
        expect(() => parseNotices(source, "10")).toThrow(error);
    });
});

describe("licenseSourcePath", () => {
    test.each([
        ["Licenses\\dotnet.txt", "assets/licenses/dotnet.txt"],
        ["Fonts\\LICENSE-CascadiaCode.txt", "assets/fonts/LICENSE-CascadiaCode.txt"],
        ["Themes/LICENSE.txt", "assets/themes/LICENSE.txt"],
    ])("maps %s", (from, to) => {
        expect(licenseSourcePath(from)).toBe(to);
    });

    test("throws on a bare file name", () => {
        expect(() => licenseSourcePath("LICENSE.txt")).toThrow(/Unexpected/);
    });
});

describe("dotnetMajor", () => {
    test.each([
        ["net10.0-windows10.0.26100.0", "10"],
        ["net9.0", "9"],
    ])("reads %s", (framework, major) => {
        expect(dotnetMajor(`<Project><PropertyGroup><TargetFramework>${framework}</TargetFramework></PropertyGroup></Project>`)).toBe(major);
    });

    test("throws without a target framework", () => {
        expect(() => dotnetMajor("<Project />")).toThrow(/TargetFramework/);
    });
});

test("cleanLicenseText drops the BOM, CRLF and trailing blank lines", () => {
    expect(cleanLicenseText(String.fromCharCode(0xfeff) + "MIT\r\n\r\nText  \r\n\r\n")).toBe("MIT\n\nText");
});
