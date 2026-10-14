import type { Messages } from '../i18n.ts';

const de: Messages = {
  // Commands
  'command.toggleShownNumbers': 'Überschriftennummern ein- oder ausblenden (ohne Notizen zu ändern)',
  'command.insertLiveContents': 'Live-Inhaltsverzeichnis einfügen',
  'command.copyWithNumbers': 'Diese Notiz mit Überschriftennummern kopieren',
  'command.numberHeadings': 'Überschriften in dieser Notiz nummerieren',
  'command.removeNumbers': 'Überschriftennummern in dieser Notiz entfernen',
  'command.tableOfContents': 'Inhaltsverzeichnis einfügen oder aktualisieren',
  'command.saveToProperties': 'Nummerierungseinstellungen in den Eigenschaften dieser Notiz speichern',

  // Notices
  'notice.showingNumbers': 'Überschriftennummern werden angezeigt. Deine Notizen bleiben unverändert.',
  'notice.hidingNumbers': 'Überschriftennummern werden nicht mehr angezeigt.',
  'notice.copied': 'Die Notiz wurde mit nummerierten Überschriften kopiert. Die Notiz selbst bleibt unverändert.',
  'notice.clipboardFailed': 'In die Zwischenablage konnte nicht geschrieben werden.',
  'notice.contentsUpdated': 'Inhaltsverzeichnis aktualisiert.',
  'notice.contentsUpToDate': 'Das Inhaltsverzeichnis ist auf dem neuesten Stand.',
  'notice.contentsInserted': 'Inhaltsverzeichnis eingefügt. Beim Nummerieren der Überschriften bleibt es aktuell.',
  'notice.propertiesSaved': 'Nummerierungseinstellungen in den Eigenschaften dieser Notiz gespeichert.',
  'notice.propertiesSavedNotFollowed':
    'Nummerierungseinstellungen in den Eigenschaften dieser Notiz gespeichert. Sie gelten nur, solange „Follow Number Headings properties“ eingeschaltet ist.',
  'notice.propertiesFailed': 'Die Eigenschaften dieser Notiz konnten nicht geschrieben werden. Prüfe, ob sie gültiges YAML sind.',
  'notice.noteOff': 'Diese Notiz hat „number headings: off“ in ihren Eigenschaften, daher wurden ihre Überschriften nicht angetastet.',
  'notice.nothingToChangeContentsUpdated': 'Keine Überschrift musste geändert werden. Inhaltsverzeichnis aktualisiert.',
  'notice.nothingToChange': 'Keine Überschrift musste geändert werden.',
  'notice.numbered.one': '1 Überschrift nummeriert.',
  'notice.numbered.other': '{count} Überschriften nummeriert.',
  'notice.removed.one': 'Nummer von 1 Überschrift entfernt.',
  'notice.removed.other': 'Nummern von {count} Überschriften entfernt.',
  'notice.linksUpdated.one': '1 Link in 1 weiteren Notiz aktualisiert.',
  'notice.linksUpdated.manyInOne': '{links} Links in 1 weiteren Notiz aktualisiert.',
  'notice.linksUpdated.manyInMany': '{links} Links in {notes} weiteren Notizen aktualisiert.',

  // The live table of contents
  'contents.empty': 'Noch keine Überschriften zum Auflisten.',

  // Dropdown options
  'option.automatic': 'Automatisch',
  'option.level': 'Überschrift {level}',
  'option.chineseNumerals': '一, 二, 三 (Chinesisch)',
  'option.headingExample': 'Überschrift',

  // Settings
  'setting.showNumbers.name': 'Nummern anzeigen, ohne Notizen zu ändern',
  'setting.showNumbers.desc':
    'Zeichnet die Nummern vor die Überschriften, im Editor und in der Leseansicht, ohne sie in die Notiz zu schreiben. Links funktionieren weiter, ohne dass etwas umgeschrieben werden muss. Eine Notiz, deren Überschriften schon geschriebene Nummern haben oder deren Eigenschaften „number headings: off“ sagen, bleibt unverändert.',
  'setting.showInOutline.name': 'Nummern in der Gliederung anzeigen',
  'setting.showInOutline.desc':
    'Wenn Nummern angezeigt werden, ohne Notizen zu ändern, zeigt dies sie auch vor den Überschriften in der Seitenleiste „Gliederung“. Ohne Wirkung bei Notizen, deren Nummern im Text stehen; die zeigt die Gliederung ohnehin an.',
  'setting.firstLevel.name': 'Erste nummerierte Ebene',
  'setting.firstLevel.desc':
    'Die Überschriftenebene, die eine einzelne Nummer erhält. „Automatisch“ nimmt die höchste Überschriftenebene jeder Notiz. Höhere Überschriften bleiben unnummeriert und beginnen die Zählung neu.',
  'setting.maxLevel.name': 'Letzte nummerierte Ebene',
  'setting.maxLevel.desc': 'Tiefere Überschriften bleiben, wie sie sind.',
  'setting.topStyle.name': 'Nummern der obersten Ebene',
  'setting.topStyle.desc': 'Wie die erste Nummer geschrieben wird.',
  'setting.otherStyle.name': 'Nummern der unteren Ebenen',
  'setting.otherStyle.desc': 'Wie jede Nummer nach der ersten geschrieben wird.',
  'setting.separator.name': 'Trennzeichen',
  'setting.separator.desc':
    'Was auf die Nummer folgt. Ohne Trennzeichen gilt eine Überschrift, die schon mit einer Zahl beginnt, etwa „2024 in review“, als nummeriert und verliert sie.',
  'setting.skipAnchor.name': 'Überspringen-Anker',
  'setting.skipAnchor.desc':
    'Eine Überschrift, deren Zeile mit dieser Block-ID endet, etwa „## Preface ^skipped“, wird nicht nummeriert und verbraucht keine Nummer. Sie bleibt aus dem Inhaltsverzeichnis heraus. Leer lassen, um das Überspringen auszuschalten.',
  'setting.topTemplate.name': 'Vorlage der obersten Ebene',
  'setting.topTemplate.desc':
    'Text um die Nummer der Überschriften der obersten Ebene, mit {n} für die Nummer: „Chapter {n}.“ ergibt „Chapter 1. Intro“. Text nach {n} ersetzt das Trennzeichen; ohne ihn („Chapter {n}“) folgt das Trennzeichen weiterhin. Erneutes Nummerieren ersetzt Text, der von einer früheren Vorlage geschrieben wurde.',
  'setting.otherTemplate.name': 'Vorlage der unteren Ebenen',
  'setting.otherTemplate.desc':
    'Dasselbe für jede Überschrift unterhalb der obersten Ebene, wobei {n} die ganze Nummer ist, etwa „Section {n}“ für „Section 1.2“.',
  'setting.readFrontMatter.name': 'Follow Number Headings properties',
  'setting.readFrontMatter.desc':
    'Eine Notiz, deren Eigenschaften einen Eintrag „number headings“ haben, wie ihn die Erweiterung Number Headings schreibt, wird so nummeriert, wie dieser Eintrag sagt; „number headings: off“ lässt die Notiz in Ruhe.',
  'setting.updateLinks.name': 'Links in anderen Notizen aktualisieren',
  'setting.updateLinks.desc':
    'Wenn eine Überschrift neu nummeriert wird, schreibt dies die Links darauf im Rest des Vaults um, damit sie weiter funktionieren. Links innerhalb der Notiz selbst werden immer aktualisiert.',
};

export default de;
