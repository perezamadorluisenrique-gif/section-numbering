import type { Messages } from '../i18n.ts';

const es: Messages = {
  // Commands
  'command.toggleShownNumbers': 'Mostrar u ocultar la numeración de los encabezados (sin modificar las notas)',
  'command.insertLiveContents': 'Insertar tabla de contenidos en vivo',
  'command.copyWithNumbers': 'Copiar esta nota con la numeración de los encabezados',
  'command.numberHeadings': 'Numerar los encabezados de esta nota',
  'command.removeNumbers': 'Quitar la numeración de los encabezados de esta nota',
  'command.tableOfContents': 'Insertar o actualizar la tabla de contenidos',
  'command.saveToProperties': 'Guardar los ajustes de numeración en las propiedades de esta nota',

  // Notices
  'notice.showingNumbers': 'Se muestra la numeración de los encabezados. Tus notas no cambian.',
  'notice.hidingNumbers': 'Ya no se muestra la numeración de los encabezados.',
  'notice.copied': 'Se copió la nota con sus encabezados numerados. La nota en sí no cambia.',
  'notice.clipboardFailed': 'No se pudo escribir en el portapapeles.',
  'notice.contentsUpdated': 'Se actualizó la tabla de contenidos.',
  'notice.contentsUpToDate': 'La tabla de contenidos está al día.',
  'notice.contentsInserted': 'Se insertó una tabla de contenidos. Al numerar los encabezados se mantiene al día.',
  'notice.propertiesSaved': 'Se guardaron los ajustes de numeración en las propiedades de esta nota.',
  'notice.propertiesSavedNotFollowed':
    'Se guardaron los ajustes de numeración en las propiedades de esta nota. Solo se aplican mientras "Follow Number Headings properties" esté activado.',
  'notice.propertiesFailed': 'No se pudieron escribir las propiedades de esta nota. Comprueba que sean YAML válido.',
  'notice.noteOff': 'Esta nota tiene "number headings: off" en sus propiedades, así que sus encabezados se dejaron como estaban.',
  'notice.nothingToChangeContentsUpdated': 'Ningún encabezado necesitaba cambios. Se actualizó la tabla de contenidos.',
  'notice.nothingToChange': 'Ningún encabezado necesitaba cambios.',
  'notice.numbered.one': 'Se numeró 1 encabezado.',
  'notice.numbered.other': 'Se numeraron {count} encabezados.',
  'notice.removed.one': 'Se quitó la numeración de 1 encabezado.',
  'notice.removed.other': 'Se quitó la numeración de {count} encabezados.',
  'notice.linksUpdated.one': 'Se actualizó 1 enlace en 1 nota más.',
  'notice.linksUpdated.manyInOne': 'Se actualizaron {links} enlaces en 1 nota más.',
  'notice.linksUpdated.manyInMany': 'Se actualizaron {links} enlaces en {notes} notas más.',

  // The live table of contents
  'contents.empty': 'Aún no hay encabezados que listar.',

  // Dropdown options
  'option.automatic': 'Automático',
  'option.level': 'Encabezado {level}',
  'option.chineseNumerals': '一, 二, 三 (chino)',
  'option.headingExample': 'Encabezado',

  // Settings
  'setting.showNumbers.name': 'Mostrar la numeración sin modificar las notas',
  'setting.showNumbers.desc':
    'Dibuja los números delante de los encabezados, en el editor y en la vista de lectura, sin escribirlos en la nota. Los enlaces siguen funcionando sin nada que reescribir. Una nota cuyos encabezados ya tienen números escritos, o cuyas propiedades dicen "number headings: off", se deja como está.',
  'setting.showInOutline.name': 'Mostrar la numeración en el Esquema',
  'setting.showInOutline.desc':
    'Cuando se muestran los números sin modificar las notas, los muestra también delante de los encabezados en la barra lateral del Esquema. No tiene efecto en las notas cuyos números están escritos en el texto, que el Esquema ya muestra.',
  'setting.firstLevel.name': 'Primer nivel numerado',
  'setting.firstLevel.desc':
    'El nivel de encabezado que recibe un solo número. Automático usa el encabezado de nivel más alto de cada nota. Los encabezados de nivel superior quedan sin numerar y reinician la cuenta.',
  'setting.maxLevel.name': 'Último nivel numerado',
  'setting.maxLevel.desc': 'Los encabezados más profundos se dejan como están.',
  'setting.topStyle.name': 'Números del nivel superior',
  'setting.topStyle.desc': 'Cómo se escribe el primer número.',
  'setting.otherStyle.name': 'Números de los niveles inferiores',
  'setting.otherStyle.desc': 'Cómo se escribe cada número después del primero.',
  'setting.separator.name': 'Separador',
  'setting.separator.desc':
    'Lo que sigue al número. Sin separador, un encabezado que ya empieza por un número, como "2024 in review", se toma por numerado y lo pierde.',
  'setting.skipAnchor.name': 'Ancla para omitir',
  'setting.skipAnchor.desc':
    'Un encabezado cuya línea termina con este id de bloque, como "## Preface ^skipped", no se numera ni ocupa número. No aparece en la tabla de contenidos. Déjalo vacío para desactivar la omisión.',
  'setting.topTemplate.name': 'Plantilla del nivel superior',
  'setting.topTemplate.desc':
    'Texto alrededor del número de los encabezados de nivel superior, con {n} para el número: "Chapter {n}." da "Chapter 1. Intro". El texto después de {n} sustituye al separador; si no hay ninguno ("Chapter {n}"), el separador sigue detrás. Volver a numerar reemplaza el texto escrito por una plantilla anterior.',
  'setting.otherTemplate.name': 'Plantilla de los niveles inferiores',
  'setting.otherTemplate.desc':
    'Lo mismo para cada encabezado por debajo del nivel superior, donde {n} es el número completo, como en "Section {n}" para "Section 1.2".',
  'setting.readFrontMatter.name': 'Follow Number Headings properties',
  'setting.readFrontMatter.desc':
    'Una nota cuyas propiedades tienen una entrada "number headings", tal como la escribe el complemento Number Headings, se numera como dice esa entrada, y "number headings: off" deja la nota en paz.',
  'setting.updateLinks.name': 'Actualizar los enlaces de otras notas',
  'setting.updateLinks.desc':
    'Cuando un encabezado cambia de número, reescribe los enlaces que apuntan a él en el resto de la bóveda para que sigan funcionando. Los enlaces dentro de la propia nota siempre se actualizan.',
};

export default es;
