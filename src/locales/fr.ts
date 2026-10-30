import type { Messages } from '../i18n.ts';

const fr: Messages = {
  // Commands
  'command.toggleShownNumbers': 'Afficher ou masquer la numérotation des titres (sans modifier les notes)',
  'command.insertLiveContents': 'Insérer une table des matières dynamique',
  'command.copyWithNumbers': 'Copier cette note avec la numérotation des titres',
  'command.numberHeadings': 'Numéroter les titres de cette note',
  'command.removeNumbers': 'Supprimer la numérotation des titres de cette note',
  'command.tableOfContents': 'Insérer ou mettre à jour la table des matières',
  'command.saveToProperties': 'Enregistrer les réglages de numérotation dans les propriétés de cette note',

  // Notices
  'notice.showingNumbers': 'Les numéros de titres sont affichés. Vos notes ne sont pas modifiées.',
  'notice.hidingNumbers': 'Les numéros de titres ne sont plus affichés.',
  'notice.copied': 'La note a été copiée avec ses titres numérotés. La note elle-même n’est pas modifiée.',
  'notice.clipboardFailed': 'Impossible d’écrire dans le presse-papiers.',
  'notice.contentsUpdated': 'Table des matières mise à jour.',
  'notice.contentsUpToDate': 'La table des matières est à jour.',
  'notice.contentsInserted': 'Table des matières insérée. La numérotation des titres la maintient à jour.',
  'notice.propertiesSaved': 'Réglages de numérotation enregistrés dans les propriétés de cette note.',
  'notice.propertiesSavedNotFollowed':
    'Réglages de numérotation enregistrés dans les propriétés de cette note. Ils ne s’appliquent que lorsque « Follow Number Headings properties » est activé.',
  'notice.propertiesFailed': 'Impossible d’écrire les propriétés de cette note. Vérifiez qu’elles sont en YAML valide.',
  'notice.noteOff': 'Cette note a « number headings: off » dans ses propriétés ; ses titres n’ont donc pas été touchés.',
  'notice.claimed': '{owner} numbers this note, so its headings were left alone.',
  'notice.unknownProfile': 'This note has "numbering profile: {profile}" in its properties and no active plugin handles it, so its headings were left alone.',
  'notice.nothingToChangeContentsUpdated': 'Aucun titre à modifier. Table des matières mise à jour.',
  'notice.nothingToChange': 'Aucun titre à modifier.',
  'notice.numbered.one': '1 titre numéroté.',
  'notice.numbered.other': '{count} titres numérotés.',
  'notice.removed.one': 'Numéro supprimé sur 1 titre.',
  'notice.removed.other': 'Numéros supprimés sur {count} titres.',
  'notice.linksUpdated.one': '1 lien mis à jour dans 1 autre note.',
  'notice.linksUpdated.manyInOne': '{links} liens mis à jour dans 1 autre note.',
  'notice.linksUpdated.manyInMany': '{links} liens mis à jour dans {notes} autres notes.',

  // The live table of contents
  'contents.empty': 'Aucun titre à lister pour l’instant.',

  // Dropdown options
  'option.automatic': 'Automatique',
  'option.level': 'Titre {level}',
  'option.chineseNumerals': '一, 二, 三 (chinois)',
  'option.headingExample': 'Titre',

  // Settings
  'setting.showNumbers.name': 'Afficher les numéros sans modifier les notes',
  'setting.showNumbers.desc':
    'Dessine les numéros devant les titres, dans l’éditeur et en mode lecture, sans les écrire dans la note. Les liens continuent de fonctionner sans rien à réécrire. Une note dont les titres ont déjà des numéros écrits, ou dont les propriétés indiquent « number headings: off », est laissée telle quelle.',
  'setting.showInOutline.name': 'Afficher les numéros dans le Plan',
  'setting.showInOutline.desc':
    'Lorsque les numéros sont affichés sans modifier les notes, les affiche aussi devant les titres dans la barre latérale Plan. Sans effet sur les notes dont les numéros sont écrits dans le texte, que le Plan affiche déjà.',
  'setting.firstLevel.name': 'Premier niveau numéroté',
  'setting.firstLevel.desc':
    'Le niveau de titre qui reçoit un seul numéro. « Automatique » prend le titre de niveau le plus haut de chaque note. Les titres de niveau supérieur restent non numérotés et relancent le décompte.',
  'setting.maxLevel.name': 'Dernier niveau numéroté',
  'setting.maxLevel.desc': 'Les titres plus profonds sont laissés tels quels.',
  'setting.topStyle.name': 'Numéros du niveau supérieur',
  'setting.topStyle.desc': 'Comment le premier numéro est écrit.',
  'setting.otherStyle.name': 'Numéros des niveaux inférieurs',
  'setting.otherStyle.desc': 'Comment chaque numéro après le premier est écrit.',
  'setting.separator.name': 'Séparateur',
  'setting.separator.desc':
    'Ce qui suit le numéro. Sans séparateur, un titre qui commence déjà par un nombre, comme « 2024 in review », est considéré comme numéroté et le perd.',
  'setting.skipAnchor.name': 'Ancre d’exclusion',
  'setting.skipAnchor.desc':
    'Un titre dont la ligne se termine par cet identifiant de bloc, comme « ## Preface ^skipped », n’est pas numéroté et ne prend aucun numéro. Il reste hors de la table des matières. Laissez vide pour désactiver l’exclusion.',
  'setting.topTemplate.name': 'Modèle du niveau supérieur',
  'setting.topTemplate.desc':
    'Texte autour du numéro des titres de niveau supérieur, avec {n} pour le numéro : « Chapter {n}. » donne « Chapter 1. Intro ». Le texte après {n} remplace le séparateur ; sans texte (« Chapter {n} »), le séparateur suit toujours. Numéroter de nouveau remplace le texte écrit par un modèle précédent.',
  'setting.otherTemplate.name': 'Modèle des niveaux inférieurs',
  'setting.otherTemplate.desc':
    'La même chose pour chaque titre sous le niveau supérieur, où {n} est le numéro complet, comme « Section {n} » pour « Section 1.2 ».',
  'setting.readFrontMatter.name': 'Follow Number Headings properties',
  'setting.readFrontMatter.desc':
    'Une note dont les propriétés ont une entrée « number headings », telle que l’écrit le module Number Headings, est numérotée comme l’indique cette entrée, et « number headings: off » laisse la note tranquille.',
  'setting.updateLinks.name': 'Mettre à jour les liens dans les autres notes',
  'setting.updateLinks.desc':
    'Lorsqu’un titre est renuméroté, réécrit les liens qui y mènent dans le reste du coffre pour qu’ils continuent de fonctionner. Les liens dans la note elle-même sont toujours mis à jour.',
  'command.addFolderRule': 'Ajouter une règle de numérotation pour le dossier de cette note',
  'notice.folderOff': 'La règle du dossier {folder} désactive la numérotation ; les titres de cette note n’ont donc pas été touchés.',
  'setting.folderRules.name': 'Règles par dossier',
  'setting.folderRules.desc': 'Donnez à un dossier sa propre numérotation. Une règle s’écrit comme la propriété « number headings » d’une note (A.1, _.1.1, off, ...). Le dossier le plus profond l’emporte, et la propriété de la note l’emporte sur toute règle.',
  'setting.folderRules.button': 'Modifier les règles',
  'folderRules.title': 'Règles par dossier',
  'folderRules.empty': 'Aucune règle par dossier pour l’instant.',
  'folderRules.add': 'Ajouter une règle',
  'folderRules.choose': 'Choisir un dossier',
  'folderRules.valuePlaceholder': 'Numérotation, p. ex. A.1 ou off',
  'folderRules.show.inherit': 'Numéros à l’écran : selon le réglage',
  'folderRules.show.on': 'Numéros à l’écran : oui',
  'folderRules.show.off': 'Numéros à l’écran : non',
  'folderRules.missing': 'dossier introuvable',
  'folderRules.delete': 'Supprimer la règle',
  'folderRules.up': 'Monter',
  'folderRules.down': 'Descendre',
};

export default fr;
