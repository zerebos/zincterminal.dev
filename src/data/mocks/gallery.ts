// The gallery's mock-up tiles, until real screenshots replace them
import {cursor, pl, s, type Line} from "../../components/mock/term";

const prompt = pl(["~\\src\\zinc", "blue"], ["main", "green"]);

/** The same diff and selection in Lit Cell and Lit Cell Light */
export const litCellSample: Line[] = [
    [prompt, " git diff --stat"],
    [" renderer/box_drawing.cpp ", s("dim", "|"), " 14 ", s("ok", "++++++++"), s("bad", "----")],
    [" renderer/powerline.cpp   ", s("dim", "|"), "  6 ", s("ok", "+++++"), s("bad", "-")],
    [" 2 files changed, ", s("ok", "13 insertions(+)"), ", ", s("bad", "5 deletions(-)")],
    [s("dim", "# the selected word:"), " ", s("sel", "glyph"), "_cache"],
    [prompt, " ", cursor]
];
