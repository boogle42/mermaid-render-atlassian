# Mermaid Render for Jira, Confluence & Bitbucket

A Chrome extension that shows Mermaid code blocks as diagrams in Jira, Confluence and Bitbucket.

- **Works out of the box** on Jira and Confluence Cloud (`*.atlassian.net` and older `*.jira.com` sites) and Bitbucket Cloud (file view, READMEs, PR descriptions and comments).
- **Leaves other code alone.** Only blocks whose content is Mermaid are touched. The original block is hidden, never rewritten, and a **Show source** button brings it back.
- **Full screen** with zoom (scroll, pinch, + and −, fit, 100%) and drag to pan, for diagrams too big for the page.
- **Open in Mermaid Live** to edit a copy at [mermaid.live](https://mermaid.live). The link can be hidden in settings.
- **Follows the page theme**, light or dark, and re-renders when it changes.
- **Local only.** Mermaid is bundled; nothing is sent anywhere unless you click Open in Mermaid Live. See [PRIVACY.md](PRIVACY.md).

## How it finds diagrams

Atlassian drops the `mermaid` language tag when it renders a code block, so the extension looks at each code block's content instead:

| Where | Rendered markup |
|---|---|
| Jira, Confluence, Bitbucket PR descriptions and comments | `[data-testid="renderer-code-block"] code` |
| Bitbucket file view and READMEs | `div.codehilite > pre` |

A block is treated as Mermaid when its first line (after optional front matter, `%%` comments and `%%{init}%%` directives) declares a diagram type, such as `flowchart LR` or `sequenceDiagram`. Mermaid itself is injected only on pages that contain such a block.

## Settings

Click the toolbar icon:

- **Diagram theme:** match the page, always light, or always dark.
- **Toolbar:** show or hide the Open in Mermaid Live link.
- **Sites:** add other Atlassian Cloud hosts, such as a custom domain. Chrome asks for access to each one. Self-hosted Data Center sites are not supported.

## Development

```sh
npm install
npm test          # unit tests for detection and host parsing
npm run build     # assembles dist/
```

Load `dist/` at `chrome://extensions` with **Developer mode** on and **Load unpacked**. After code changes, run `npm run build` and click the reload icon on the extension card.

`npm run icons` regenerates the PNG icons from `scripts/icon.svg` (needs `rsvg-convert`).

## Publishing

1. Bump `version` in `src/manifest.json` and `package.json`.
2. `npm run package` writes `store/out/mermaid-render-atlassian-<version>.zip`. `scripts/store-images.sh` regenerates the listing images there too; the listing text is in `store/listing.md`.
3. Upload it in the [Chrome Web Store developer dashboard](https://chrome.google.com/webstore/devconsole).

## Licence

MIT. Bundles [Mermaid](https://github.com/mermaid-js/mermaid) (MIT).

Not affiliated with or endorsed by Atlassian. Jira, Confluence and Bitbucket are trademarks of Atlassian.
