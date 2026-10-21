import {markdownToHtml} from "satteri";
import {settingsPaths} from "./plugins";


/** One paragraph of Markdown as inline HTML, with settings paths and smart punctuation as in the docs */
export function inlineMarkdown(text: string) {
    const {html} = markdownToHtml(text, {features: {smartPunctuation: true}, hastPlugins: [settingsPaths]});
    return html.trim().replace(/^<p>([\s\S]*)<\/p>$/, "$1");
}
