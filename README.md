# LatticeKB

LatticeKB is a dark-mode, local-first static knowledge base for IT Support Engineers. It runs entirely in the browser, keeps corpus data in a single portable JSON file, and is structured for long-term growth with modular feature and page composition rather than a single application file.

## Stack

- React 19
- TypeScript
- Vite 8
- Tailwind CSS 4
- BlockNote for block-based authoring
- MiniSearch for local BM25-style ranking
- Browser APIs only
- Optional IndexedDB draft persistence

## Core workflow

1. Load `corpus.json`
2. Search locally with ranked results
3. Preview an article
4. Open the modal editor to create or edit
5. Export the updated `corpus.json`

Everything stays local to the browser. There is no backend, auth, analytics, sync, or corpus API.

## Local development

```bash
npm install
npm run dev
```

Then open the local Vite URL printed in the terminal.

## Production build

```bash
npm run build
```

The compiled static site is written to `dist/`.

## GitHub Pages deployment

This repository includes `.github/workflows/deploy.yml` for GitHub Pages.

### Base-path behavior

The workflow now detects the deployment shape automatically:

- if the repository is the root Pages repo (`<owner>.github.io`), it builds with `VITE_BASE_PATH=/`
- otherwise it builds with `VITE_BASE_PATH=/<repo>/`

That covers both of these cases without editing the workflow each time:

- `https://<user>.github.io/`
- `https://<user>.github.io/<repo>/`

If you deploy to a custom domain, keep `VITE_BASE_PATH=/`.

### Enable Pages

In the GitHub repository settings:

1. Open **Settings → Pages**
2. Set **Source** to **GitHub Actions**
3. Push to `main` or run the workflow manually

## Sample corpus

A starter corpus is included at:

- `public/sample-corpus.json`

The app also boots with an in-memory demo corpus for local testing.

## Architecture

The codebase is intentionally modular and organized by app shell, pages, features, and shared UI:

```text
src/
  app/
    AppShell.tsx
    layout/
    providers/
    router/
  pages/
    workspace/
    editor/
  features/
    corpus/
    search/
    tags/
    images/
    editor/
    persistence/
  shared/
    ui/
    lib/
    styles/
```

### Design choices

- `AppShell` stays small
- workspace composition lives in `pages/workspace`
- editor composition lives in `pages/editor`
- schema, import/export, and normalization live in `features/corpus`
- search indexing and ranking live in `features/search`
- image and clipboard helpers live in `features/images`
- tag suggestion logic lives in `features/tags`
- reusable primitives live in `shared/ui`

## Corpus schema

Top-level shape:

```json
{
  "version": "1.1",
  "owner": {
    "name": "Optional",
    "team": "IT Support"
  },
  "entries": []
}
```

Each entry includes:

- `id`
- `title`
- `summary`
- `product`
- `category`
- `tags`
- `aliases`
- `pinned`
- `createdAt`
- `updatedAt`
- `body` as structured block content

Inline images are stored in the document body as embedded data URLs so the exported corpus remains a single self-contained JSON file.

## Notes

- Search indexes title, summary, body text, tags, aliases, and image captions
- Raw base64 image bytes are not indexed
- Drafts autosave to IndexedDB while the editor modal is open
- Routing is intentionally static-host-safe; the app behaves like a single workspace and does not require server-side route handling
