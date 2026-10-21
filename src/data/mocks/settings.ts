// The settings mock-up's live preview
import {bx, cursor, palette, pl, ramp, s, swatch, type Line} from "../../components/mock/term";

const prompt = pl(["~/src/zinc", "blue"]);

export const settingsLabel = "The Zinc Settings window on a profile's font settings, with a live preview of the terminal";

export const settingsPreview: Line[] = [
    [prompt, " git diff --stat"],
    [" app.cs | 4 ", s("ok", "++"), s("bad", "--")],
    ["diff --git a/app.cs b/app.cs"],
    [s("acc", "@@ -1 +1 @@")],
    [s("bad", "-  Console.WriteLine(\"hello\");")],
    [s("ok", "+  Console.WriteLine(\"hello, Zinc\");")],
    [
        ...palette.map(swatch),
        "  ",
        bx("rd", 1, "mag"), bx("lr", 1, "mag"), s("mag", " build "), bx("lr", 1, "mag"), bx("ld", 1, "mag"),
        "  ",
        ramp("warn")
    ],
    [prompt, " ", cursor]
];
