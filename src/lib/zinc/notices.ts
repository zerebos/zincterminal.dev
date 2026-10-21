// Parses the `new(...)` records in Zinc's OpenSourceNotices.cs. It reads only string literals, string
// arrays and the one runtime expression for .NET's version, and throws on anything else.

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

type Arg = {kind: "string", value: string} | {kind: "array", value: string[]} | {kind: "expression", value: string};

// .NET's version is read at runtime, so the sync script passes it in
const runtimeVersion = "Environment.Version.ToString()";

class Scanner {
    pos = 0;
    constructor(readonly src: string) {}

    fail(why: string): never {
        const line = this.src.slice(0, this.pos).split("\n").length;
        throw new Error(`OpenSourceNotices.cs line ${line}: ${why}`);
    }

    peek(text: string) {
        return this.src.startsWith(text, this.pos);
    }

    expect(text: string) {
        if (!this.peek(text)) this.fail(`expected "${text}"`);
        this.pos += text.length;
    }

    skipSpace() {
        for (;;) {
            const rest = this.src.slice(this.pos);
            const space = /^(\s+|\/\/[^\n]*|\/\*[\s\S]*?\*\/)/.exec(rest);
            if (!space) return;
            this.pos += space[0].length;
        }
    }

    string(): string {
        if (this.peek("@\"")) {
            this.pos += 2;
            let value = "";
            for (;;) {
                const end = this.src.indexOf("\"", this.pos);
                if (end < 0) this.fail("unclosed verbatim string");
                value += this.src.slice(this.pos, end);
                this.pos = end + 1;
                if (!this.peek("\"")) return value;
                value += "\"";
                this.pos += 1;
            }
        }
        if (this.peek("$")) this.fail("interpolated strings aren't supported");
        this.expect("\"");
        let value = "";
        const escapes: Record<string, string> = {"\"": "\"", "\\": "\\", "'": "'", "n": "\n", "t": "\t"};
        for (;;) {
            const ch = this.src[this.pos];
            if (ch === undefined || ch === "\n") this.fail("unclosed string");
            this.pos += 1;
            if (ch === "\"") return value;
            if (ch === "\\") {
                const next = this.src[this.pos] ?? "";
                const escaped = escapes[next];
                if (escaped === undefined) this.fail(`unsupported escape "\\${next}"`);
                value += escaped;
                this.pos += 1;
            }
            else {
                value += ch;
            }
        }
    }

    arg(): Arg {
        this.skipSpace();
        if (this.peek("\"") || this.peek("@\"") || this.peek("$")) return {kind: "string", value: this.string()};
        if (this.peek("[")) {
            this.pos += 1;
            const value: string[] = [];
            for (;;) {
                this.skipSpace();
                if (this.peek("]")) break;
                value.push(this.string());
                this.skipSpace();
                if (this.peek(",")) this.pos += 1;
            }
            this.pos += 1;
            return {kind: "array", value};
        }
        const expression = /^[\w.]+(\(\))?/.exec(this.src.slice(this.pos));
        if (!expression) this.fail("expected a string, a string array or a property");
        this.pos += expression[0].length;
        return {kind: "expression", value: expression[0]};
    }

    args(): Arg[] {
        this.expect("new(");
        const args: Arg[] = [];
        for (;;) {
            args.push(this.arg());
            this.skipSpace();
            if (this.peek(")")) break;
            this.expect(",");
        }
        this.pos += 1;
        return args;
    }
}

export function parseNotices(source: string, dotnetVersion: string): NoticeRecord[] {
    const scanner: Scanner = new Scanner(source.replace(/\r\n?/g, "\n"));
    const list = /Components\s*\{\s*get;\s*\}\s*=\s*\[/.exec(scanner.src);
    if (!list) scanner.fail("no `Components { get; } = [` list");
    scanner.pos = list.index + list[0].length;

    const records: NoticeRecord[] = [];
    for (;;) {
        scanner.skipSpace();
        if (scanner.peek("]")) break;

        const args = scanner.args();
        if (args.length !== 7) scanner.fail(`expected 7 arguments, found ${args.length}`);
        const text = (i: number, field: string) => {
            const arg = args[i];
            if (arg?.kind !== "string") scanner.fail(`${field} must be a string literal`);
            return arg.value;
        };

        const version = args[1];
        let resolved: string;
        if (version?.kind === "string") resolved = version.value;
        else if (version?.kind === "expression" && version.value === runtimeVersion) resolved = dotnetVersion;
        else scanner.fail(`unsupported version for ${text(0, "Name")}`);

        records.push({
            name: text(0, "Name"),
            version: resolved === "" ? null : resolved,
            use: text(2, "Use"),
            license: text(3, "License"),
            url: text(4, "Url"),
            licenseFile: text(5, "LicenseFile"),
        });

        scanner.skipSpace();
        if (scanner.peek(",")) scanner.pos += 1;
    }

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
