# zincterminal.dev

The website for [Zinc](https://zincterminal.dev), a native Windows terminal built on libghostty.

It has six pages:

- `/`: the Zinc landing page.
- `/lit-cell`: the page for Lit Cell, Zinc's default color scheme (dark and light).
- `/docs`: using Zinc, from installing to the `zn` command line.
- `/docs/config`: every setting in `config.toml`, generated from Zinc's settings catalog.
- `/changelog`: what changed in each build, generated from Zinc's changelog.
- `/notices`: the third-party notices for Zinc and for this site.

Any other address gets the 404 page, `src/pages/404.astro`.

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
| `bun run sync:zinc` | Refreshes the changelog, settings, actions, notices, release info and config schema from a Zinc checkout |

## Downloads and short links

Every download button links straight to `downloads.zincterminal.dev`, which always holds the latest build. For links to share, `public/_redirects` sends `/download` to the installer and `/download/portable` to the zip, as temporary (302) redirects so the targets can change.

The site is a Worker with only static assets (`wrangler.jsonc`), and Cloudflare reads `_redirects` from the assets folder, so the redirects need no other setup. Each rule needs its trailing-slash form too, because `/download/` doesn't match `/download`. `bunx wrangler dev` serves `dist/` locally with the redirects applied, and its log says how many rules it parsed.

A path with nothing behind it answers 404 with the built `404.html`, because `wrangler.jsonc` sets `not_found_handling` to `"404-page"`. When a page moves, give its old address a redirect in `_redirects` instead of leaving it to the 404 page.

## Content from Zinc

The changelog, the settings, the actions, the third-party notices, the config schema and the site-wide version come from the Zinc repository. It's private for now, so the build can't read it, and a committed snapshot stands in.

- **`bun run sync:zinc`** reads a Zinc checkout (`../zinc`, or the path in `ZINC_REPO`). The changelog comes from `CHANGELOG.md`. Everything else comes from Zinc's reference export in `dist/reference/`, which `dotnet run scripts/dev/export-reference.cs` writes in the Zinc repo. To read the export from another folder, such as a release's downloaded `zinc-reference.json` and `config.schema.json`, set `ZINC_REFERENCE`. The sync writes JSON to `src/data/generated/`:
  - `zinc-changelog.json` holds every released build from `CHANGELOG.md`, skipping `## Unreleased`.
  - `zinc-release.json` holds the newest build's version and date, which the hero, "Try the alpha", the docs and the notices show.
  - `zinc-settings.json` holds the Settings window's sections, its settings followed by the shells it looks for, the keys only `config.toml` sets, and the profile fields.
  - `zinc-actions.json` holds every action a key can be bound to, with its default keys.
  - `zinc-notices.json` holds the notices with their license texts. Zinc's own notice is among them, and the notices page leaves it out because the page lists third-party software.
- **It also writes `public/schema/config.json`**, the config's JSON Schema, which editors fetch from `/schema/config.json`. That URL is the schema's `$id`, and the guide gives it in a `#:schema` line. `public/_headers` lets other sites fetch it too.
- **Run it after each Zinc release, and commit what it writes.** The build reads only those files.
- **The sync stops and writes nothing** in these cases. Fix the source in Zinc, then sync again.
  - The export's `format` isn't one the sync reads, or a field it reads is missing or has the wrong type.
  - The schema's `$id` isn't the URL the site serves it at.
  - Text the site shows as its own names a terminal the brand rules keep off the site (see `src/lib/zinc/guard.ts`).
  - A changelog backtick doesn't close.
- **The sync's code** lives in `src/lib/zinc/`, with tests that use small inline inputs, never `../zinc`.
- **"On this website"** on the notices page lists what reaches visitors' browsers: Astro, Geist Mono, Lit Cell and Svelte. That list is `src/data/website-notices.ts`, and its texts and versions are read from the packages at build time.

## The config reference

`/docs/config` is drawn entirely from `zinc-settings.json`, so a Zinc release that changes a setting only needs a sync. A few things live on the site instead:

- **Each table's title and opening line** are in `src/data/config-tables.ts`, in page order. When Zinc adds a table, the build stops and names it, so add its entry there. A listed table with no settings stops the build too.
- **The profile table**, `[profile.<id>]`, comes after `[discover]`. Its title and opening line are in `src/data/config-tables.ts`, with the profile fields' defaults in words, because Zinc gives those defaults as `null`.
- **The wording rules** are in `src/lib/zinc/settings.ts`, with tests: the type in words, ranges, defaults as TOML values or in words, examples from a text setting's placeholder, and which settings share another's values.

The filter is `src/components/reading/ConfigFilter.svelte`. Each setting carries its searchable text in `data-text`, and the island only hides what doesn't match.

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

- `src/pages/` holds the six pages. `src/layouts/Base.astro` holds the shared document shell and the no-flash theme script, and `src/layouts/ReadingLayout.astro` holds the sidebar layout for docs, changelog and notices.
- `src/data/site.ts` holds the links (the downloads, the feedback address and the Discord among them), the release info and the shared footer. Zinc's GitHub links are `null` and left out until the repo is public.
- `src/components/site/` holds the shared pieces: header, footer, theme switch, buttons, sections and copy buttons.
- `src/components/landing/` and `src/components/lit-cell/` hold each page's sections.
- `src/components/reading/` holds the reading pages' pieces (contents list, section spy, changelog and notice rows), and `src/components/prose/` holds the docs' MDX components. Their styles are `src/styles/reading.css` and `src/styles/prose.css`.
- `src/assets/screenshots/` holds the screenshots of Zinc. In `src/components/site/`, `Screenshot.astro` shows one in a window frame and swaps in its light twin when the site is light, and `Shot.astro` puts a gallery screenshot on its dotted stage with a caption.
- The precision close-ups keep their terminal content as data in `src/components/landing/term.ts`, drawn by `Lines.astro` and `CellZoom.astro` beside it.
- `src/styles/zn/` holds the design system's component styles, ported as they were needed.
