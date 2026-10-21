# zincterminal.dev

The website for [Zinc](https://zincterminal.dev), a native Windows terminal built on libghostty.

It has two pages:

- `/`: the Zinc landing page.
- `/lit-cell`: the page for Lit Cell, Zinc's default color scheme (dark and light).

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

## Where the colors come from

- **Site colors** (ground, ink, accent and the rest) are CSS custom properties in `src/styles/tokens.css`. They were converted once from the canvas design and are maintained by hand there. Components use the variables and never hex values.
- **Lit Cell colors** come from the design tokens in the [lit-cell](https://github.com/zerebos/lit-cell) repository, which is a dependency pinned to a commit in `bun.lock`. At build time, `src/data/lit-cell.ts` reads them and `LitCellVars.astro` writes the `--term-*`, `.lc-dark` and `.lc-light` variables into each page. The same module computes the palette's contrast ratios.
- **To update Lit Cell,** run `bun update lit-cell` to move to the repository's latest commit, then `bun test`. The tests check that every derived color still matches its mix recipe and that every role resolves.
- **To try token changes before they're pushed,** the site can't read a local lit-cell checkout yet. `bun link` and `file:` dependencies both need a `package.json` with a `name` in lit-cell, and it doesn't have one. Push the change to lit-cell and run `bun update lit-cell` instead, or add a minimal `package.json` to lit-cell to make linking possible.
- The four tuned setups in the gallery use their own scheme colors, kept as temporary CSS in `src/components/landing/Themes.astro`. They go away when real screenshots replace those mock-ups.

## Layout

- `src/pages/` holds the two pages, and `src/layouts/Base.astro` holds the shared document shell and the no-flash theme script.
- `src/components/site/` holds the shared pieces: header, footer, theme switch, buttons, sections and copy buttons.
- `src/components/landing/` and `src/components/lit-cell/` hold each page's sections.
- `src/components/mock/` holds the terminal and window mock-ups. Their content is data in `src/data/mocks/`, rendered by `Lines.astro`.
- `src/styles/zn/` holds the design system's component styles, ported as they were needed.
