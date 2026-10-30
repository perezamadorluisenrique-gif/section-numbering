import type { Messages } from '../i18n.ts';

const zh: Messages = {
  // Commands
  'command.toggleShownNumbers': '显示或隐藏标题编号（不修改笔记）',
  'command.insertLiveContents': '插入实时目录',
  'command.copyWithNumbers': '复制带标题编号的此笔记',
  'command.numberHeadings': '为此笔记的标题编号',
  'command.removeNumbers': '移除此笔记的标题编号',
  'command.tableOfContents': '插入或更新目录',
  'command.saveToProperties': '将编号设置保存到此笔记的属性',

  // Notices
  'notice.showingNumbers': '正在显示标题编号。你的笔记不会被修改。',
  'notice.hidingNumbers': '不再显示标题编号。',
  'notice.copied': '已复制带标题编号的笔记。笔记本身没有改动。',
  'notice.clipboardFailed': '无法写入剪贴板。',
  'notice.contentsUpdated': '已更新目录。',
  'notice.contentsUpToDate': '目录已是最新。',
  'notice.contentsInserted': '已插入目录。为标题编号会让它保持最新。',
  'notice.propertiesSaved': '已将编号设置保存到此笔记的属性。',
  'notice.propertiesSavedNotFollowed': '已将编号设置保存到此笔记的属性。仅当“Follow Number Headings properties”开启时才会生效。',
  'notice.propertiesFailed': '无法写入此笔记的属性。请检查它们是否是有效的 YAML。',
  'notice.noteOff': '此笔记的属性中有 "number headings: off"，因此其标题未做改动。',
  'notice.nothingToChangeContentsUpdated': '没有需要修改的标题。已更新目录。',
  'notice.nothingToChange': '没有需要修改的标题。',
  'notice.numbered.one': '已为 1 个标题编号。',
  'notice.numbered.other': '已为 {count} 个标题编号。',
  'notice.removed.one': '已移除 1 个标题的编号。',
  'notice.removed.other': '已移除 {count} 个标题的编号。',
  'notice.linksUpdated.one': '已更新另外 1 篇笔记中的 1 个链接。',
  'notice.linksUpdated.manyInOne': '已更新另外 1 篇笔记中的 {links} 个链接。',
  'notice.linksUpdated.manyInMany': '已更新另外 {notes} 篇笔记中的 {links} 个链接。',

  // The live table of contents
  'contents.empty': '还没有可列出的标题。',

  // Dropdown options
  'option.automatic': '自动',
  'option.level': '{level} 级标题',
  'option.chineseNumerals': '一, 二, 三（中文数字）',
  'option.headingExample': '标题',

  // Settings
  'setting.showNumbers.name': '显示编号但不修改笔记',
  'setting.showNumbers.desc':
    '在编辑器和阅读视图中，于标题前绘制编号，而不把它们写入笔记。链接照常有效，无需改写。标题已写有编号的笔记，或属性中写有 "number headings: off" 的笔记，保持原样。',
  'setting.showInOutline.name': '在大纲中显示编号',
  'setting.showInOutline.desc': '在不修改笔记而显示编号时，同时在大纲侧边栏的标题前显示编号。对编号已写入正文的笔记无影响，大纲本来就会显示这些编号。',
  'setting.firstLevel.name': '起始编号层级',
  'setting.firstLevel.desc': '获得单个编号的标题层级。“自动”使用每篇笔记中最浅的标题层级。更浅的标题不编号，并重新开始计数。',
  'setting.maxLevel.name': '最末编号层级',
  'setting.maxLevel.desc': '更深层级的标题保持原样。',
  'setting.topStyle.name': '顶层编号',
  'setting.topStyle.desc': '第一个编号的写法。',
  'setting.otherStyle.name': '下级编号',
  'setting.otherStyle.desc': '第一个之后每个编号的写法。',
  'setting.separator.name': '分隔符',
  'setting.separator.desc': '编号后面跟什么。若不使用分隔符，以数字开头的标题（例如 "2024 in review"）会被当作已编号，并失去该数字。',
  'setting.skipAnchor.name': '跳过锚点',
  'setting.skipAnchor.desc': '行尾带有此块 ID 的标题（例如 "## Preface ^skipped"）不会被编号，也不占用编号，并且不出现在目录中。留空则关闭跳过功能。',
  'setting.topTemplate.name': '顶层模板',
  'setting.topTemplate.desc':
    '顶层标题编号两侧的文字，用 {n} 表示编号："Chapter {n}." 得到 "Chapter 1. Intro"。{n} 之后的文字会取代分隔符；若没有（"Chapter {n}"），分隔符仍会跟在后面。再次编号会替换早先模板写入的文字。',
  'setting.otherTemplate.name': '下级模板',
  'setting.otherTemplate.desc': '顶层以下的每个标题同理，其中 {n} 是完整编号，例如用 "Section {n}" 得到 "Section 1.2"。',
  'setting.readFrontMatter.name': 'Follow Number Headings properties',
  'setting.readFrontMatter.desc':
    '属性中带有 "number headings" 条目（如 Number Headings 插件所写）的笔记，会按该条目所述方式编号，而 "number headings: off" 会让笔记保持原样。',
  'setting.updateLinks.name': '更新其他笔记中的链接',
  'setting.updateLinks.desc': '标题重新编号后，改写整个仓库中指向它的链接，使其保持有效。本笔记内部的链接始终会更新。',
  'command.addFolderRule': '为此笔记所在文件夹添加编号规则',
  'notice.folderOff': '文件夹 {folder} 的规则关闭了编号，因此此笔记的标题未做改动。',
  'setting.folderRules.name': '文件夹规则',
  'setting.folderRules.desc': '为文件夹设置专属编号。规则的写法与笔记的 "number headings" 属性相同（A.1、_.1.1、off 等）。最深层的文件夹优先，笔记自身的属性优先于任何规则。',
  'setting.folderRules.button': '编辑规则',
  'folderRules.title': '文件夹规则',
  'folderRules.empty': '还没有文件夹规则。',
  'folderRules.add': '添加规则',
  'folderRules.choose': '选择文件夹',
  'folderRules.valuePlaceholder': '编号，例如 A.1 或 off',
  'folderRules.show.inherit': '屏幕上的编号：按设置',
  'folderRules.show.on': '屏幕上的编号：开',
  'folderRules.show.off': '屏幕上的编号：关',
  'folderRules.missing': '未找到文件夹',
  'folderRules.delete': '删除规则',
  'folderRules.up': '上移',
  'folderRules.down': '下移',
};

export default zh;
