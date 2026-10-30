// The source of the message keys and the fallback language. Every other file in
// this folder must have exactly these keys and the same {placeholders}; the
// build fails on a missing or extra key and `tests/i18n.test.ts` checks the rest.
// What the plugin writes into notes (the table of contents label, the numbers,
// the `number headings` property) is not here and is never translated.
const en = {
  // Commands
  'command.toggleShownNumbers': 'Show or hide heading numbers (without changing notes)',
  'command.insertLiveContents': 'Insert live table of contents',
  'command.copyWithNumbers': 'Copy this note with heading numbers',
  'command.numberHeadings': 'Number headings in this note',
  'command.removeNumbers': 'Remove heading numbers in this note',
  'command.tableOfContents': 'Insert or update table of contents',
  'command.saveToProperties': "Save numbering settings to this note's properties",

  // Notices
  'notice.showingNumbers': 'Showing heading numbers. Your notes are not changed.',
  'notice.hidingNumbers': 'Heading numbers are no longer shown.',
  'notice.copied': 'Copied the note with its headings numbered. The note itself is unchanged.',
  'notice.clipboardFailed': 'Could not write to the clipboard.',
  'notice.contentsUpdated': 'Updated the table of contents.',
  'notice.contentsUpToDate': 'The table of contents is up to date.',
  'notice.contentsInserted': 'Inserted a table of contents. Numbering the headings keeps it up to date.',
  'notice.propertiesSaved': "Saved the numbering settings to this note's properties.",
  'notice.propertiesSavedNotFollowed':
    'Saved the numbering settings to this note\'s properties. They only apply while "Follow Number Headings properties" is on.',
  'notice.propertiesFailed': "Could not write this note's properties. Check that they are valid YAML.",
  'notice.noteOff': 'This note has "number headings: off" in its properties, so its headings were left alone.',
  'notice.nothingToChangeContentsUpdated': 'No heading needed changing. Updated the table of contents.',
  'notice.nothingToChange': 'No heading needed changing.',
  'notice.numbered.one': 'Numbered 1 heading.',
  'notice.numbered.other': 'Numbered {count} headings.',
  'notice.removed.one': 'Removed numbers from 1 heading.',
  'notice.removed.other': 'Removed numbers from {count} headings.',
  'notice.linksUpdated.one': 'Updated 1 link in 1 other note.',
  'notice.linksUpdated.manyInOne': 'Updated {links} links in 1 other note.',
  'notice.linksUpdated.manyInMany': 'Updated {links} links in {notes} other notes.',

  // The live table of contents
  'contents.empty': 'No headings to list yet.',

  // Dropdown options
  'option.automatic': 'Automatic',
  'option.level': 'Heading {level}',
  'option.chineseNumerals': '一, 二, 三 (Chinese)',
  'option.headingExample': 'Heading',

  // Settings
  'setting.showNumbers.name': 'Show numbers without changing notes',
  'setting.showNumbers.desc':
    'Draw the numbers in front of headings, in the editor and in reading view, without writing them into the note. Links keep working with nothing to rewrite. A note whose headings already have written numbers, or whose properties say "number headings: off", is left as it is.',
  'setting.showInOutline.name': 'Show numbers in the Outline',
  'setting.showInOutline.desc':
    'When numbers are shown without changing notes, also show them in front of the headings in the Outline sidebar. Has no effect on notes whose numbers are written into the text, which the Outline already shows.',
  'setting.firstLevel.name': 'First numbered level',
  'setting.firstLevel.desc':
    'The heading level that gets a single number. Automatic uses the shallowest heading in each note. Shallower headings stay unnumbered and restart the count.',
  'setting.maxLevel.name': 'Last numbered level',
  'setting.maxLevel.desc': 'Deeper headings are left as they are.',
  'setting.topStyle.name': 'Top-level numbers',
  'setting.topStyle.desc': 'How the first number is written.',
  'setting.otherStyle.name': 'Lower-level numbers',
  'setting.otherStyle.desc': 'How every number after the first is written.',
  'setting.separator.name': 'Separator',
  'setting.separator.desc':
    'What follows the number. With no separator, a heading that already starts with a number, such as "2024 in review", is taken to be numbered and loses it.',
  'setting.skipAnchor.name': 'Skip anchor',
  'setting.skipAnchor.desc':
    'A heading whose line ends with this block id, such as "## Preface ^skipped", is not numbered and takes no number. It stays out of the table of contents. Leave empty to turn skipping off.',
  'setting.topTemplate.name': 'Top-level template',
  'setting.topTemplate.desc':
    'Text around the number of top-level headings, with {n} for the number: "Chapter {n}." gives "Chapter 1. Intro". Text after {n} replaces the separator; with none ("Chapter {n}") the separator still follows. Numbering again replaces text written by an earlier template.',
  'setting.otherTemplate.name': 'Lower-level template',
  'setting.otherTemplate.desc':
    'The same for every heading below the top level, where {n} is the whole number, as in "Section {n}" for "Section 1.2".',
  'setting.readFrontMatter.name': 'Follow Number Headings properties',
  'setting.readFrontMatter.desc':
    'A note whose properties have a "number headings" entry, as the Number Headings plugin writes it, is numbered the way that entry says, and "number headings: off" leaves the note alone.',
  'setting.updateLinks.name': 'Update links in other notes',
  'setting.updateLinks.desc':
    'When a heading is renumbered, rewrite links to it in the rest of the vault so they keep working. Links within the note itself are always updated.',
  'command.addFolderRule': 'Add a numbering rule for this note\'s folder',
  'notice.folderOff': 'The folder rule for {folder} turns numbering off, so this note\'s headings were left alone.',
  'setting.folderRules.name': 'Folder rules',
  'setting.folderRules.desc': 'Give a folder its own numbering. Write a rule like a note\'s "number headings" property, for example A.1 or off. The deepest folder wins, and a note\'s own property wins over any rule.',
  'setting.folderRules.button': 'Edit rules',
  'folderRules.title': 'Folder rules',
  'folderRules.empty': 'No folder rules yet.',
  'folderRules.add': 'Add rule',
  'folderRules.choose': 'Choose folder',
  'folderRules.valuePlaceholder': 'Numbering, e.g. A.1 or off',
  'folderRules.show.inherit': 'Numbers on screen: as set',
  'folderRules.show.on': 'Numbers on screen: on',
  'folderRules.show.off': 'Numbers on screen: off',
  'folderRules.missing': 'Folder not found',
  'folderRules.delete': 'Delete rule',
  'folderRules.up': 'Move up',
  'folderRules.down': 'Move down',
} as const;

export default en;
