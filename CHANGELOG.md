# Changelog

The release workflow uses the section named after the version being released
as the release description, so every version needs one. `npm version <x.y.z>`
renames the `Unreleased` heading below to that version.

## 0.1.3

- A heading that starts with a version or a decimal, such as `## 2.0
  migration`, no longer loses it when the note is numbered: it becomes
  `## 1.1. 2.0 migration`. A dotted number with no separator after it is now
  only replaced when every heading in the note is numbered, which is how a
  note numbered by the original Number Headings plugin looks. Removing
  numbers leaves such a version alone too.

## 0.1.2

- A link with an alias inside a table, written `[[Note#Heading\|alias]]` so
  the pipe does not end the cell, lost its backslash when the heading was
  renumbered, which split the table cell in two. The backslash now stays.

## 0.1.1

- Settings now turn up in Obsidian's settings search on 1.13 and later: the
  tab is described with the declarative settings API. The settings and what
  they do are unchanged.
- The source no longer relies on Node's type definitions for
  `String.prototype.trimEnd`, which the plugin review flagged as an unsafe
  call. The behaviour is identical.

## 0.1.0

First release.

- **Number headings in this note** numbers every heading as an outline
  (`1.`, `1.1.`, `1.2.`) and renumbers them after sections move or change
  level. Running it twice changes nothing the second time.
- **Remove heading numbers in this note** takes them off again.
- Links to a renumbered heading are rewritten so they keep working: wikilinks,
  embeds, Markdown links and nested heading paths, within the note and, unless
  switched off, in every other note that links to it. Links inside code are
  left alone.
- The headings and the links within the note change in a single edit, so one
  undo puts the note back.
- Settings for the first and last numbered level, arabic numbers, letters or
  Roman numerals, and the separator after the number.
