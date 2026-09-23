# Section Numbering

[![Latest release](https://img.shields.io/github/v/release/perezamadorluisenrique-gif/section-numbering?sort=semver)](https://github.com/perezamadorluisenrique-gif/section-numbering/releases/latest)
[![CI](https://github.com/perezamadorluisenrique-gif/section-numbering/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/perezamadorluisenrique-gif/section-numbering/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/github/license/perezamadorluisenrique-gif/section-numbering)](LICENSE)

Outline numbers for your headings — `1.`, `1.1.`, `1.2.` — that stay right
when you move sections around, **without breaking the links that point at
them**.

```markdown
## 1. Introduction
### 1.1. Scope
### 1.2. Terms
## 2. Method
### 2.1. Setup
```

## Why links matter here

A link to a heading names the heading by its text: `[[Guide#Setup]]`. The
moment a number is added, that heading is called `2.1. Setup`, and every link
to it quietly stops going anywhere. Renumber after moving a section and it
happens again.

Section Numbering rewrites those links as part of the renumbering:

- wikilinks and embeds, `[[Guide#Setup|alias]]` and `![[Guide#Setup]]`, keeping
  the alias;
- Markdown links, `[text](Guide.md#Setup)`, encoded or in angle brackets;
- nested heading paths, `[[Guide#Method#Setup]]`;
- wikilinks inside properties;
- links within the note itself and, unless you switch it off, in every other
  note that links to it.

Links inside code, fenced or inline, are text about links and are left alone.
Block references (`#^id`) are not headings and are never touched.

## Commands

| Command | What it does |
|---|---|
| Number headings in this note | Numbers every heading in range, or renumbers it if it is already numbered. |
| Remove heading numbers in this note | Takes the numbers off again. |

Neither has a hotkey by default; assign one in **Settings → Hotkeys**.

In the note you are editing, the headings and the links change in one edit, so
a single **undo** puts everything back. Links in other notes are changed on
disk, and undo in this note does not reach them — number again, or remove the
numbers, to change them back.

## Settings

| Setting | Default | |
|---|---|---|
| First numbered level | Automatic | The level that gets a single number. Automatic uses the shallowest heading in each note. Shallower headings stay unnumbered and restart the count, so with level 2 each `#` chapter numbers its sections from 1. |
| Last numbered level | Heading 6 | Deeper headings are left as they are. |
| Top-level numbers | 1, 2, 3 | Or A, B, C, or I, II, III. |
| Lower-level numbers | 1, 2, 3 | The same choice for every level below. |
| Separator | `1.2. Heading` | Also `)`, `:`, ` —`, ` -` or none. |
| Update links in other notes | On | Links within the note are always updated. |

### Why the default separator is a dot

To renumber, the plugin has to recognise a number it wrote earlier. With a
separator that is unambiguous: `## 2024 in review` has no dot after the year,
so it becomes `## 1. 2024 in review` and keeps its year. With no separator,
a heading that starts with a number cannot be told apart from a numbered one,
and the year would be replaced. Dotted numbers such as `1.2 Scope` are
recognised whatever the separator.

## Details

- A level that is skipped counts as zero, the way Pandoc numbers it: a `###`
  straight under a `#` is `1.0.1.`.
- Headings inside frontmatter, code blocks and `%%` comments are not headings
  and are never numbered. Setext headings (text underlined with `===`) are not
  numbered either.
- Empty headings are skipped and take no number.
- When two headings share a name, a link to that name went to the first of
  them, and it still does after numbering.

## Coming from Number Headings

Notes numbered by the original *Number Headings* plugin are picked up and
renumbered in place. Its default writes top-level numbers with no separator
(`1 Introduction`), so set **Separator** to none and your notes renumber
exactly as they look now. To move to another separator, run *Remove heading
numbers in this note* while it is still none, then change it and number again.
While the separator is none, a heading that starts with a number, such as a
year, is read as numbered.

Automatic numbering as you type is not included: rewriting links in other notes
on every keystroke is not something a plugin should do behind your back.

## Installing

From Obsidian: **Settings → Community plugins → Browse**, search for *Section
Numbering*. Or copy `main.js` and `manifest.json` from the latest release into
`<vault>/.obsidian/plugins/section-numbering/`.

## Privacy

No network access, no telemetry. The plugin reads and writes only the notes
that link to the one you are numbering.

## Developing

```bash
npm install
npm test        # the numbering and link engine, under plain Node
npm run lint
npm run build
```

Everything under `src/` is free of Obsidian imports and fully unit tested;
`main.ts` is the only file that talks to the app.

## License

MIT
