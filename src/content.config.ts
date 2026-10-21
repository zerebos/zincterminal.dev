import {defineCollection} from "astro:content";
import {glob} from "astro/loaders";
import {z} from "astro/zod";


// The docs page. Its intro comes from the frontmatter, and the sections are the MDX body.
const docs = defineCollection({
    loader: glob({pattern: "**/*.mdx", base: "./src/content/docs"}),
    schema: z.object({
        title: z.string(),
        description: z.string(),
        lead: z.string()
    })
});

export const collections = {docs};
