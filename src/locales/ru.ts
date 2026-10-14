import type { Messages } from '../i18n.ts';

const ru: Messages = {
  // Commands
  'command.toggleShownNumbers': 'Показать или скрыть номера заголовков (без изменения заметок)',
  'command.insertLiveContents': 'Вставить динамическое оглавление',
  'command.copyWithNumbers': 'Скопировать эту заметку с номерами заголовков',
  'command.numberHeadings': 'Пронумеровать заголовки в этой заметке',
  'command.removeNumbers': 'Удалить номера заголовков в этой заметке',
  'command.tableOfContents': 'Вставить или обновить оглавление',
  'command.saveToProperties': 'Сохранить настройки нумерации в свойствах этой заметки',

  // Notices
  'notice.showingNumbers': 'Номера заголовков показаны. Ваши заметки не изменены.',
  'notice.hidingNumbers': 'Номера заголовков больше не показываются.',
  'notice.copied': 'Заметка скопирована с пронумерованными заголовками. Сама заметка не изменена.',
  'notice.clipboardFailed': 'Не удалось записать в буфер обмена.',
  'notice.contentsUpdated': 'Оглавление обновлено.',
  'notice.contentsUpToDate': 'Оглавление актуально.',
  'notice.contentsInserted': 'Оглавление вставлено. Нумерация заголовков поддерживает его актуальным.',
  'notice.propertiesSaved': 'Настройки нумерации сохранены в свойствах этой заметки.',
  'notice.propertiesSavedNotFollowed':
    'Настройки нумерации сохранены в свойствах этой заметки. Они действуют, только пока включено «Follow Number Headings properties».',
  'notice.propertiesFailed': 'Не удалось записать свойства этой заметки. Проверьте, что это корректный YAML.',
  'notice.noteOff': 'В свойствах этой заметки есть "number headings: off", поэтому её заголовки не тронуты.',
  'notice.nothingToChangeContentsUpdated': 'Ни один заголовок менять не потребовалось. Оглавление обновлено.',
  'notice.nothingToChange': 'Ни один заголовок менять не потребовалось.',
  'notice.numbered.one': 'Пронумерован 1 заголовок.',
  'notice.numbered.other': 'Пронумеровано заголовков: {count}.',
  'notice.removed.one': 'Номер удалён у 1 заголовка.',
  'notice.removed.other': 'Номера удалены у заголовков: {count}.',
  'notice.linksUpdated.one': 'Обновлена 1 ссылка в 1 другой заметке.',
  'notice.linksUpdated.manyInOne': 'Обновлено ссылок: {links}, в 1 другой заметке.',
  'notice.linksUpdated.manyInMany': 'Обновлено ссылок: {links}, в других заметках: {notes}.',

  // The live table of contents
  'contents.empty': 'Пока нет заголовков для списка.',

  // Dropdown options
  'option.automatic': 'Автоматически',
  'option.level': 'Заголовок {level}',
  'option.chineseNumerals': '一, 二, 三 (китайские)',
  'option.headingExample': 'Заголовок',

  // Settings
  'setting.showNumbers.name': 'Показывать номера, не изменяя заметки',
  'setting.showNumbers.desc':
    'Рисует номера перед заголовками в редакторе и в режиме просмотра, не записывая их в заметку. Ссылки продолжают работать, переписывать ничего не нужно. Заметка, у заголовков которой номера уже написаны, или в свойствах которой указано "number headings: off", остаётся как есть.',
  'setting.showInOutline.name': 'Показывать номера в структуре',
  'setting.showInOutline.desc':
    'Если номера показываются без изменения заметок, показывает их и перед заголовками на боковой панели «Структура». Не действует на заметки, номера которых записаны в тексте: их структура и так показывает.',
  'setting.firstLevel.name': 'Первый нумеруемый уровень',
  'setting.firstLevel.desc':
    'Уровень заголовков, получающий одиночный номер. «Автоматически» берёт самый верхний уровень заголовков в каждой заметке. Более высокие заголовки остаются без номеров и начинают счёт заново.',
  'setting.maxLevel.name': 'Последний нумеруемый уровень',
  'setting.maxLevel.desc': 'Более глубокие заголовки остаются как есть.',
  'setting.topStyle.name': 'Номера верхнего уровня',
  'setting.topStyle.desc': 'Как записывается первый номер.',
  'setting.otherStyle.name': 'Номера нижних уровней',
  'setting.otherStyle.desc': 'Как записывается каждый номер после первого.',
  'setting.separator.name': 'Разделитель',
  'setting.separator.desc':
    'Что стоит после номера. Без разделителя заголовок, который уже начинается с числа, например "2024 in review", считается пронумерованным и теряет его.',
  'setting.skipAnchor.name': 'Якорь пропуска',
  'setting.skipAnchor.desc':
    'Заголовок, строка которого заканчивается этим идентификатором блока, например "## Preface ^skipped", не нумеруется и не занимает номер. В оглавление он не попадает. Оставьте пустым, чтобы отключить пропуск.',
  'setting.topTemplate.name': 'Шаблон верхнего уровня',
  'setting.topTemplate.desc':
    'Текст вокруг номера заголовков верхнего уровня, где {n} — номер: "Chapter {n}." даёт "Chapter 1. Intro". Текст после {n} заменяет разделитель; если его нет ("Chapter {n}"), разделитель всё равно идёт следом. Повторная нумерация заменяет текст, записанный прежним шаблоном.',
  'setting.otherTemplate.name': 'Шаблон нижних уровней',
  'setting.otherTemplate.desc':
    'То же для каждого заголовка ниже верхнего уровня, где {n} — полный номер, например "Section {n}" для "Section 1.2".',
  'setting.readFrontMatter.name': 'Follow Number Headings properties',
  'setting.readFrontMatter.desc':
    'Заметка, в свойствах которой есть запись "number headings", в том виде, как её пишет плагин Number Headings, нумеруется так, как сказано в этой записи, а "number headings: off" оставляет заметку в покое.',
  'setting.updateLinks.name': 'Обновлять ссылки в других заметках',
  'setting.updateLinks.desc':
    'Когда заголовок получает новый номер, переписывает ссылки на него в остальном хранилище, чтобы они продолжали работать. Ссылки внутри самой заметки обновляются всегда.',
};

export default ru;
