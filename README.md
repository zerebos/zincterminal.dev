# zincterminal.dev

The website for [Zinc](https://zincterminal.dev), a native Windows terminal built on libghostty.

It has five pages:

- `/`: the Zinc landing page.
- `/lit-cell`: the page for Lit Cell, Zinc's default color scheme (dark and light).
- `/docs`: using Zinc, from installing to the `zn` command line.
- `/changelog`: what changed in each build, generated from Zinc's changelog.
- `/notices`: the third-party notices for Zinc and for this site.

## Working on it

The site is static Astro with a few Svelte islands, built with Bun.

| Command | What it does |
|---|---|
| `bun install` | Installs the dependencies |
| `bun run dev` | Starts the dev server |
| `bun run build` | Builds the site into `dist/` |
| `bun run preview` | Serves the built site |
| `bun run typecheck` | Checks types with `astro check` |
| `bun check` | Checks types with Bun's checker, as a second opinion |
| `bun run lint` | Lints the TypeScript and Svelte files |
| `bun test` | Runs the tests |
| `bun run deploy` | Builds and deploys to Cloudflare with wrangler |
| `bun run sync:zinc` | Refreshes the changelog, notices and release info from a Zinc checkout |

## Content from Zinc

The changelog, the third-party notices and the site-wide version come from the Zinc repository. It's private for now, so the build can't read it, and a committed snapshot stands in.

- **`bun run sync:zinc`** reads a Zinc checkout (`../zinc`, or the path in `ZINC_REPO`) and writes JSON to `src/data/generated/`:
  - `zinc-changelog.json` holds every released build from `CHANGELOG.md`, skipping `## Unreleased`.
  - `zinc-notices.json` holds the components in `src/Zinc.Core/OpenSourceNotices.cs`, with their license texts from `assets/`. The .NET version comes from `<TargetFramework>` in `src/Zinc/Zinc.csproj`.
  - `zinc-release.json` holds the newest build's version and date, which the hero, "Try the alpha", the docs and the notices show.
- **Run it after each Zinc release, and commit the JSON.** The build reads only the JSON.
- **The sync stops and writes nothing** when a source has a shape it doesn't know, when text the site shows as its own names a terminal the brand rules keep off the site (see `src/lib/zinc/guard.ts`), or when a changelog backtick doesn't close. Fix the text in Zinc, then sync again. The parsers live in `src/lib/zinc/`, with tests that use small inline inputs, never `../zinc`.
- **"On this website"** on the notices page lists what reaches visitors' browsers: Astro, Geist Mono, Lit Cell and Svelte. That list is `src/data/website-notices.ts`, and its texts and versions are read from the packages at build time.

## Writing the docs

The docs are one MDX file, `src/content/docs/using-zinc.mdx`, in the `docs` content collection. Its frontmatter holds the title, description and lead, and the page builds its contents list from the headings.

- **Settings paths:** inline code like `` `Settings > About > Updates` ``, or any chain of capitalized names joined by ` > `, renders as a bold path with `›`.
- **Heading ids** come from the text. Give one explicitly with `## The zn CLI {#zn}`.
- **Code blocks** get a name and a copy button. Write ```` ```toml title="config.toml" ````, and add `copy="…"` when the copy button needs a clearer name than the title.
- **Components,** with no imports needed: `<Note title="…">`, `<Warning title="…">`, `<Steps>` around an ordered list, and `<Yes />` and `<Partly>…</Partly>` for table marks. Write keys as `<kbd>Ctrl+,</kbd>`.
- Markdown and MDX run through Sätteri, Astro 7's processor. The plugins are in `src/lib/markdown/` and registered in `astro.config.mjs`.

## Where the colors come from

- **Site colors** (ground, ink, accent and the rest) are CSS custom properties in `src/styles/tokens.css`. They were converted once from the canvas design and are maintained by hand there. Components use the variables and never hex values.
- **Lit Cell colors** come from the design tokens in the [lit-cell](https://github.com/zerebos/lit-cell) repository, which is a dependency pinned to a commit in `bun.lock`. At build time, `src/data/lit-cell.ts` reads them and `LitCellVars.astro` writes the `--term-*`, `.lc-dark` and `.lc-light` variables into each page. The same module computes the palette's contrast ratios.
- **To update Lit Cell,** run `bun update lit-cell` to move to the repository's latest commit, then `bun test`. The tests check that every derived color still matches its mix recipe and that every role resolves.
- **To try token changes before they're pushed,** run `bun link` in your lit-cell checkout, then `bun link lit-cell` here, so the site reads your local tokens. Run `bun install` to go back to the pinned commit.

## Layout

- `src/pages/` holds the five pages. `src/layouts/Base.astro` holds the shared document shell and the no-flash theme script, and `src/layouts/ReadingLayout.astro` holds the sidebar layout for docs, changelog and notices.
- `src/data/site.ts` holds the links, the release info and the shared footer. Undecided links are `#`, and Zinc's GitHub links are `null` and left out until the repo is public.
- `src/components/site/` holds the shared pieces: header, footer, theme switch, buttons, sections and copy buttons.
- `src/components/landing/` and `src/components/lit-cell/` hold each page's sections.
- `src/components/reading/` holds the reading pages' pieces (contents list, section spy, changelog and notice rows), and `src/components/prose/` holds the docs' MDX components. Their styles are `src/styles/reading.css` and `src/styles/prose.css`.
- `src/assets/screenshots/` holds the screenshots of Zinc. `Screenshot.astro` in `src/components/site/` shows one in a window frame and swaps in its light twin when the site is light.
- `src/components/mock/` holds the gallery's frame (`Shot.astro`) and the precision close-ups' terminal content as data (`term.ts`), drawn by `Lines.astro` and `CellZoom.astro`.
- `src/styles/zn/` holds the design system's component styles, ported as they were needed.
