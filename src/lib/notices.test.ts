import {expect, test} from "bun:test";
import notices from "../data/generated/zinc-notices.json";
import {displayUrl, noticeId} from "./notices";


test.each([
    [".NET", "dotnet"],
    ["Ghostty (libghostty-vt)", "ghostty"],
    ["Cascadia Mono NF", "cascadia-mono-nf"],
    ["Vortice.Windows", "vortice-windows"],
    ["iTerm2-Color-Schemes", "iterm2-color-schemes"],
])("noticeId(%j) is %j", (name, id) => {
    expect(noticeId(name)).toBe(id);
});

test("every synced notice gets its own id, apart from the page's section ids", () => {
    const ids = [...notices.map(n => n.name), "Astro", "Geist Mono", "Svelte"].map(noticeId);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids).not.toContain("in-zinc");
    expect(ids).not.toContain("on-this-site");
});

test.each([
    ["https://github.com/dotnet/runtime", "github.com/dotnet/runtime"],
    ["https://heroicons.com", "heroicons.com"],
    ["https://ziglang.org/", "ziglang.org"],
])("displayUrl(%j) is %j", (url, text) => {
    expect(displayUrl(url)).toBe(text);
});
