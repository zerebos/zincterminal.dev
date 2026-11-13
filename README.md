# zincterminal.dev

The website for [Zinc](https://zincterminal.dev), a native Windows terminal built on libghostty.

It has seven pages:

- `/`: the Zinc landing page.
- `/lit-cell`: the page for Lit Cell, Zinc's default color scheme (dark and light).
- `/docs`: using Zinc, from installing to the `zn` command line.
- `/docs/config`: every setting in `config.toml`, generated from Zinc's settings catalog.
- `/docs/keys`: every action a key can run, with its default keys, generated from Zinc's action list.
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
  - `zinc-settings.json` holds the Settings window's sections, its settings followed by the shells it looks for, the keys only `config.toml` sets, the profile fields, the keys at the top of the file, and what Settings calls a custom color. Each setting carries its default in words when its value can't say it, and an example when its placeholder is only one.
  - `zinc-actions.json` holds every action a key can be bound to with its default keys, the categories in Settings › Keyboard's order, what each kind of argument takes, and how `[keys]` writes keys. Zinc gives each key name a Windows virtual-key code, and the sync turns it into the browser's `KeyboardEvent.code` with the table in `src/lib/zinc/keys.ts`.
  - `zinc-notices.json` holds the notices with their license texts. Zinc's own notice is among them, and the notices page leaves it out because the page lists third-party software.
- **It also writes `public/schema/config.json`**, the config's JSON Schema, which editors fetch from `/schema/config.json`. That URL is the schema's `$id`, and the guide gives it in a `#:schema` line. `public/_headers` lets other sites fetch it too.
- **Run it after each Zinc release, and commit what it writes.** The build reads only those files.
- **The sync stops and writes nothing** in these cases. Fix the source in Zinc, then sync again.
  - The export's `format` isn't one the sync reads, or a field it reads is missing or has the wrong type.
  - An action's category or argument isn't listed, or a default key uses a key name, modifier or argument value that `[keys]` doesn't accept.
  - A key name's virtual-key code isn't in the table in `src/lib/zinc/keys.ts`. Add it there.
  - The export is from a release that isn't the changelog's newest build. A dev build's export has no release, so it's never checked.
  - The schema's `$id` isn't the URL the site serves it at.
  - Text the site shows as its own names a terminal the brand rules keep off the site (see `src/lib/zinc/guard.ts`).
  - A changelog backtick doesn't close.
- **The sync's code** lives in `src/lib/zinc/`, with tests that use small inline inputs, never `../zinc`.
- **"On this website"** on the notices page lists what reaches visitors' browsers: Astro, Geist Mono, Lit Cell and Svelte. That list is `src/data/website-notices.ts`, and its texts and versions are read from the packages at build time.

## The config reference

`/docs/config` is drawn entirely from `zinc-settings.json`, so a Zinc release that changes a setting only needs a sync. A few things live on the site instead:

- **Each table's title and opening line** are in `src/data/config-tables.ts`, in page order. When Zinc adds a table, the build stops and names it, so add its entry there. A listed table with no settings stops the build too.
- **The sentence about profiles** ("A profile can set its own, under `[profile.<id>.font]`") is added to a table whose settings are all per profile. A table where only some are stops the build, so give it its own wording.
- **The top-level keys** (`include`, `default-profile` and the rest) come first, under "Top level", and **the profile table**, `[profile.<id>]`, comes after `[discover]`. Their titles and opening lines are in `src/data/config-tables.ts` too.
- **The wording rules** are in `src/lib/zinc/settings.ts`, with tests: the type in words, ranges, and which settings share another's values. A default is Zinc's words when it gives them, then the value as TOML, then a text setting's placeholder unless Zinc marks it as an example. Examples come only from Zinc.

The filter is `src/components/reading/ConfigFilter.svelte`. Each setting carries its searchable text in `data-text`, and the island only hides what doesn't match.

## The keys page

`/docs/keys` is drawn entirely from `zinc-actions.json`. `actionGroups` in `src/lib/zinc/keys.ts` shapes the rows at build time, with tests:

- **Groups** follow Settings › Keyboard's order, and a category with no actions is left out.
- **"Takes"** lists an argument's fixed values joined with ` · `, or Zinc's words for it, and adds "(optional)".
- **Key caps** use Windows' names (Ctrl+Shift+C, PgUp, ↑, Numpad +). An action whose keys all come again with Shift, as zoom's do, shows them once. A run of three or more digits that each pass their own digit is one cap (Ctrl+Shift+1–9), and the four arrows, each passing its direction, are one cap (Alt+Arrows).
- **The `[keys]` example** at the top is written in the page, and the build stops if Zinc stops accepting one of its keys or actions.

The filter is `src/components/reading/KeysFilter.svelte`. Each action carries its searchable text in `data-text` and every default key in `data-keys`, including the Shift keys the page doesn't show. Typing matches the text, and typing a whole combination with a modifier, or pressing one in Press keys mode, matches the keys.

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

- `src/pages/` holds the seven pages. `src/layouts/Base.astro` holds the shared document shell and the no-flash theme script, and `src/layouts/ReadingLayout.astro` holds the sidebar layout for docs, changelog and notices.
- `src/data/site.ts` holds the links (the downloads, the feedback address and the Discord among them), the release info and the shared footer. Zinc's roadmap link is `null` and left out until it has an address.
- `src/components/site/` holds the shared pieces: header, footer, theme switch, buttons, sections and copy buttons.
- `src/components/landing/` and `src/components/lit-cell/` hold each page's sections.
- `src/components/reading/` holds the reading pages' pieces (the docs list, contents list, section spy, filters, setting entries, and changelog and notice rows), and `src/components/prose/` holds the docs' MDX components. Their styles are `src/styles/reading.css` and `src/styles/prose.css`.
- `src/assets/screenshots/` holds the screenshots of Zinc. In `src/components/site/`, `Screenshot.astro` shows one in a window frame and swaps in its light twin when the site is light, and `Shot.astro` puts a gallery screenshot on its dotted stage with a caption.
- The precision close-ups keep their terminal content as data in `src/components/landing/term.ts`, drawn by `Lines.astro` and `CellZoom.astro` beside it.
- `src/styles/zn/` holds the design system's component styles, ported as they were needed.
