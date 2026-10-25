// Reads the C# literals Zinc's data files are written in: strings, numbers, booleans, null, names
// (`SettingKind.Toggle`, `Config.MaxScrollbackLines`), arrays, and `new(...)` with an optional
// `{ Name = value }` initializer. Anything else throws, so a new shape in Zinc stops the sync.

export type Value =
    | {kind: "string", value: string}
    | {kind: "number", value: number}
    | {kind: "bool", value: boolean}
    | {kind: "null"}

    /** A name or a call with no arguments, such as `SettingKind.Toggle` or `Environment.Version.ToString()` */
    | {kind: "name", value: string}
    | {kind: "array", items: Value[]}
    | {kind: "new", args: Value[], init: Record<string, Value>};

export class Scanner {
    pos = 0;
    readonly src: string;

    constructor(src: string, readonly file: string) {
        this.src = src.replace(/\r\n?/g, "\n");
    }

    fail(why: string): never {
        const line = this.src.slice(0, this.pos).split("\n").length;
        throw new Error(`${this.file} line ${line}: ${why}`);
    }

    peek(text: string) {
        return this.src.startsWith(text, this.pos);
    }

    expect(text: string) {
        if (!this.peek(text)) this.fail(`expected "${text}"`);
        this.pos += text.length;
    }

    /** Moves to just after the first match of `pattern`, or fails with `missing` */
    seek(pattern: RegExp, missing: string) {
        const match = pattern.exec(this.src);
        if (!match) this.fail(missing);
        this.pos = match.index + match[0].length;
    }

    skipSpace() {
        for (;;) {
            const rest = this.src.slice(this.pos);
            const space = /^(\s+|\/\/[^\n]*|\/\*[\s\S]*?\*\/)/.exec(rest);
            if (!space) return;
            this.pos += space[0].length;
        }
    }

    /** Skips a comma before the next item, if there is one */
    comma() {
        this.skipSpace();
        if (this.peek(",")) this.pos += 1;
        this.skipSpace();
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

    value(): Value {
        this.skipSpace();
        if (this.peek("\"") || this.peek("@\"") || this.peek("$")) return {kind: "string", value: this.string()};
        if (this.peek("[")) return {kind: "array", items: this.list("[", "]", () => this.value())};
        if (this.peek("new(")) return this.record();

        // A cast like `(long)` changes nothing the site needs
        const cast = /^\((long|int|double|float)\)/.exec(this.src.slice(this.pos));
        if (cast) {
            this.pos += cast[0].length;
            return this.value();
        }

        const rest = this.src.slice(this.pos);
        const number = /^-?[\d_]+(\.[\d_]+)?([eE][-+]?\d+)?[LlDdFfMm]?(?![\w.])/.exec(rest);
        if (number) {
            this.pos += number[0].length;
            return {kind: "number", value: Number(number[0].replace(/[_LlDdFfMm]/g, ""))};
        }
        const word = /^[A-Za-z_][\w.]*(\(\))?/.exec(rest);
        if (!word) this.fail("expected a value");
        this.pos += word[0].length;
        if (word[0] === "true" || word[0] === "false") return {kind: "bool", value: word[0] === "true"};
        if (word[0] === "null") return {kind: "null"};
        return {kind: "name", value: word[0]};
    }

    /** `new(args)`, with an optional `{ Name = value, ... }` after it */
    record(): Value {
        this.expect("new");
        const args = this.list("(", ")", () => this.value());
        const init: Record<string, Value> = {};
        this.skipSpace();
        if (this.peek("{")) {
            this.list("{", "}", () => {
                const name = /^[A-Z]\w*/.exec(this.src.slice(this.pos));
                if (!name) this.fail("expected a property name");
                this.pos += name[0].length;
                this.skipSpace();
                this.expect("=");
                init[name[0]] = this.value();
            });
        }
        return {kind: "new", args, init};
    }

    /** Items between `open` and `close`, separated by commas, with a trailing comma allowed */
    list<T>(open: string, close: string, item: () => T): T[] {
        this.expect(open);
        const items: T[] = [];
        for (;;) {
            this.skipSpace();
            if (this.peek(close)) break;
            items.push(item());
            this.skipSpace();
            if (this.peek(close)) break;
            this.expect(",");
        }
        this.pos += close.length;
        return items;
    }
}
