// Parses the `new(...)` records in Zinc's OpenSourceNotices.cs. It reads only string literals, string
// arrays and the one runtime expression for .NET's version, and throws on anything else.

import {Scanner} from "./csharp";

/** A record as the C# file has it, before its license text is read */
export interface NoticeRecord {
    name: string;
    version: string | null;
    use: string;
    license: string;
    url: string;

    /** Relative to the exe's folder, such as `Licenses\dotnet.txt` */
    licenseFile: string;
}

// .NET's version is read at runtime, so the sync script passes it in
const runtimeVersion = "Environment.Version.ToString()";

export function parseNotices(source: string, dotnetVersion: string): NoticeRecord[] {
    const scanner: Scanner = new Scanner(source, "OpenSourceNotices.cs");
    scanner.seek(/Components\s*\{\s*get;\s*\}\s*=\s*/, "no `Components { get; } = [` list");

    const records = scanner.list("[", "]", () => {
        const record = scanner.value();
        if (record.kind !== "new") scanner.fail("expected `new(...)`");
        const {args} = record;
        if (args.length !== 7) scanner.fail(`expected 7 arguments, found ${args.length}`);
        const text = (i: number, field: string) => {
            const arg = args[i];
            if (arg?.kind !== "string") scanner.fail(`${field} must be a string literal`);
            return arg.value;
        };

        const version = args[1];
        let resolved: string;
        if (version?.kind === "string") resolved = version.value;
        else if (version?.kind === "name" && version.value === runtimeVersion) resolved = dotnetVersion;
        else scanner.fail(`unsupported version for ${text(0, "Name")}`);

        return {
            name: text(0, "Name"),
            version: resolved === "" ? null : resolved,
            use: text(2, "Use"),
            license: text(3, "License"),
            url: text(4, "Url"),
            licenseFile: text(5, "LicenseFile"),
        };
    });

    if (records.length === 0) scanner.fail("the list is empty");
    return records;
}

/** Where a license file sits in the Zinc repo: `Licenses\dotnet.txt` is assets/licenses/dotnet.txt */
export function licenseSourcePath(licenseFile: string) {
    const [folder = "", ...rest] = licenseFile.split(/[\\/]/);
    if (!folder || rest.length === 0) throw new Error(`Unexpected license file path "${licenseFile}"`);
    return ["assets", folder.toLowerCase(), ...rest].join("/");
}

/** The .NET major version from a project's `<TargetFramework>`, such as `net10.0-windows` */
export function dotnetMajor(csproj: string) {
    const match = /<TargetFramework>net(\d+)\.\d+[^<]*<\/TargetFramework>/.exec(csproj);
    if (!match?.[1]) throw new Error("No `<TargetFramework>netN.N` in the project file");
    return match[1];
}

/** License texts with LF line ends, no BOM and no trailing blank lines */
export function cleanLicenseText(text: string) {
    const noBom = text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
    return noBom.replace(/\r\n?/g, "\n").replace(/\s+$/, "");
}
