# Changelog

The release workflow uses the section named after the version being released
as the release description, so every version needs one. `npm version <x.y.z>`
renames the `Unreleased` heading below to that version.

## 0.4.0

- **Skip individual headings.** A heading whose line ends with `^skipped` (the anchor Number Headings uses; change it in the settings or with `skip ^name` in a note's `number headings` property) is not numbered and takes no number, and a number it already had is removed. Its subheadings are still numbered, as in Number Headings. The anchor is never touched and links to the heading are left alone.
- **Table of contents.** It now leaves out skipped headings and the heading that carries its own anchor, such as `## Contents ^toc`.
- **Save numbering settings to this note's properties.** A new command writes the current settings into the note's `number headings` property, in the form the plugin reads back, keeping an existing `contents ^id`. This needs Obsidian 1.4.4 or later.

## 0.3.0

- **Table of contents.** The new command *Insert or update table of contents*
  writes a list of links to the headings after a `^toc` line. Numbering,
  renumbering or removing numbers updates it in the same edit, so its links
  keep working. A note with Number Headings' `contents ^id` property keeps its
  table of contents where it was.

## 0.2.0

- Notes numbered by the Number Headings plugin keep their own settings. A
  `number headings` property in a note's front matter (`first-level`, `max`,
  `start-at`, and a style such as `1.1`, `A.1` or `I.1` with an optional
  separator) now overrides the plugin's settings for that note, and
  `number headings: off` leaves the note alone. A new setting, **Follow
  Number Headings properties**, turns this off.
- New per-note option `start-at N` sets the first top-level number.

## 0.1.5

- A changelog-style note, where every heading starts with a version listed
  newest first (`## 2.0.1`, `## 2.0.0`, `## 1.9.0`), keeps its versions when
  numbered or when numbers are removed. They were taken for outline numbers
  and replaced, because every heading started with one. A numbered note
  whose sections were moved out of order is still renumbered as before.

## 0.1.4

- Both commands have an icon, so they show what they do instead of a
  question mark when added to the mobile toolbar (Settings → Mobile →
  Manage toolbar options).

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
