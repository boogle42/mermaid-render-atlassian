# Chrome Web Store listing

Paste-ready text for the developer console. Upload `store/out/mermaid-render-atlassian-<version>.zip` from `npm run package`; images come from `scripts/store-images.sh`, also in `store/out/`.

## Store listing tab

**Category:** Developer Tools

**Language:** English

**Summary** (from the manifest, max 132 characters):

> Renders Mermaid code blocks as diagrams in Jira, Confluence and Bitbucket. Full screen with zoom. Runs locally.

**Description:**

```
See Mermaid diagrams where your team already writes them: in Jira issues, Confluence pages, and Bitbucket pull requests, comments and Markdown files.

Atlassian Cloud shows a Mermaid code block as plain text. This extension draws it as a diagram, right where the code block was.

WHAT IT DOES
• Draws flowcharts, sequence diagrams, class, state, ER, Gantt, mind maps and every other Mermaid diagram type.
• Works out of the box on Jira and Confluence Cloud (*.atlassian.net and older *.jira.com sites) and Bitbucket Cloud: file view, READMEs, PR descriptions and PR comments.
• Leaves other code alone. Only blocks whose content is Mermaid are touched. Your Java, SQL or Bash keeps its highlighting.
• Never edits the page. The original code block is hidden, not rewritten, and Show source brings it back.
• Full screen view with zoom and pan for big diagrams: scroll or pinch to zoom, drag to pan, fit to screen or view at 100%.
• Open in Mermaid Live, to edit a copy of any diagram. You can hide this link in settings.
• Follows the page's light or dark theme, or set it to always light or always dark.
• Add other Atlassian Cloud sites, such as a custom domain, in settings.

PRIVATE BY DESIGN
Mermaid is bundled with the extension and diagrams are drawn in your browser. The extension makes no network requests and collects no data. The only time a diagram leaves the page is when you click Open in Mermaid Live, which opens mermaid.live with the diagram in the link.

Self-hosted Jira, Confluence and Bitbucket Data Center are not supported.

Open source: https://github.com/boogle42/mermaid-render-atlassian

Not affiliated with or endorsed by Atlassian. Jira, Confluence and Bitbucket are trademarks of Atlassian.
```

**Images:**

| Slot | File |
|---|---|
| Store icon (128×128) | `src/icons/icon128.png` |
| Screenshots (1280×800) | `store/out/1-diagrams-light.png`, `2-dark-mode.png`, `3-full-screen.png` |
| Small promo tile (440×280) | `store/out/promo-tile-440x280.png` |

**Homepage URL:** https://github.com/boogle42/mermaid-render-atlassian

**Support URL:** https://github.com/boogle42/mermaid-render-atlassian/issues

## Privacy tab

**Single purpose:**

> Render Mermaid code blocks as diagrams on Atlassian Cloud pages (Jira, Confluence and Bitbucket).

**Permission justifications:**

- **scripting:** Injects the bundled Mermaid library into a tab only when that page contains a Mermaid code block, so pages without diagrams don't load it.
- **storage:** Saves the user's settings: diagram theme, whether the Mermaid Live link shows, and any extra Atlassian sites they add.
- **Host permissions** (`*.atlassian.net`, `*.jira.com`, `bitbucket.org`): The content script reads code blocks on Jira, Confluence and Bitbucket Cloud pages to find Mermaid source and draw it as a diagram.
- **Optional host permissions** (`https://*/*`, `http://*/*`): Requested only when the user adds a site in settings, for Atlassian Cloud sites on a custom domain. Chrome asks for access to that one site, and nothing else is granted.

**Remote code:** No, I am not using remote code. (Mermaid is bundled in the package.)

**Data usage:** Tick none of the data types. Certify all three statements:
- I do not sell or transfer user data to third parties, outside of the approved use cases.
- I do not use or transfer user data for purposes that are unrelated to my item's single purpose.
- I do not use or transfer user data to determine creditworthiness or for lending purposes.

**Privacy policy URL:** https://github.com/boogle42/mermaid-render-atlassian/blob/main/PRIVACY.md

## Distribution tab

- **Payments:** Free.
- **Visibility:** Public, or Unlisted to share by link only.
- **Regions:** All regions.
