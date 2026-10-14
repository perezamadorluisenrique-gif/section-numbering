import type { Messages } from '../i18n.ts';

const ja: Messages = {
  // Commands
  'command.toggleShownNumbers': '見出し番号を表示／非表示（ノートは変更しない）',
  'command.insertLiveContents': 'ライブ目次を挿入',
  'command.copyWithNumbers': '見出し番号付きでこのノートをコピー',
  'command.numberHeadings': 'このノートの見出しに番号を付ける',
  'command.removeNumbers': 'このノートの見出し番号を削除',
  'command.tableOfContents': '目次を挿入または更新',
  'command.saveToProperties': '番号付けの設定をこのノートのプロパティに保存',

  // Notices
  'notice.showingNumbers': '見出し番号を表示しています。ノートは変更されません。',
  'notice.hidingNumbers': '見出し番号を表示しなくなりました。',
  'notice.copied': '見出しに番号を付けたノートをコピーしました。ノート自体は変更されていません。',
  'notice.clipboardFailed': 'クリップボードに書き込めませんでした。',
  'notice.contentsUpdated': '目次を更新しました。',
  'notice.contentsUpToDate': '目次は最新です。',
  'notice.contentsInserted': '目次を挿入しました。見出しに番号を付けると、目次も最新の状態に保たれます。',
  'notice.propertiesSaved': '番号付けの設定をこのノートのプロパティに保存しました。',
  'notice.propertiesSavedNotFollowed':
    '番号付けの設定をこのノートのプロパティに保存しました。「Follow Number Headings properties」がオンの間だけ有効です。',
  'notice.propertiesFailed': 'このノートのプロパティを書き込めませんでした。有効な YAML か確認してください。',
  'notice.noteOff': 'このノートのプロパティに "number headings: off" があるため、見出しは変更しませんでした。',
  'notice.nothingToChangeContentsUpdated': '変更が必要な見出しはありませんでした。目次を更新しました。',
  'notice.nothingToChange': '変更が必要な見出しはありませんでした。',
  'notice.numbered.one': '1 件の見出しに番号を付けました。',
  'notice.numbered.other': '{count} 件の見出しに番号を付けました。',
  'notice.removed.one': '1 件の見出しから番号を削除しました。',
  'notice.removed.other': '{count} 件の見出しから番号を削除しました。',
  'notice.linksUpdated.one': '他の 1 件のノートで 1 件のリンクを更新しました。',
  'notice.linksUpdated.manyInOne': '他の 1 件のノートで {links} 件のリンクを更新しました。',
  'notice.linksUpdated.manyInMany': '他の {notes} 件のノートで {links} 件のリンクを更新しました。',

  // The live table of contents
  'contents.empty': '一覧にする見出しはまだありません。',

  // Dropdown options
  'option.automatic': '自動',
  'option.level': '見出し {level}',
  'option.chineseNumerals': '一, 二, 三（漢数字）',
  'option.headingExample': '見出し',

  // Settings
  'setting.showNumbers.name': 'ノートを変更せずに番号を表示',
  'setting.showNumbers.desc':
    'ノートに書き込まずに、エディタとリーディングビューで見出しの前に番号を表示します。リンクは書き換えなしでそのまま機能します。見出しにすでに番号が書かれているノートや、プロパティに "number headings: off" があるノートは、そのままにします。',
  'setting.showInOutline.name': 'アウトラインに番号を表示',
  'setting.showInOutline.desc':
    'ノートを変更せずに番号を表示しているとき、アウトラインのサイドバーの見出しの前にも番号を表示します。番号が本文に書かれているノートでは、アウトラインがもともと番号を表示するため、効果はありません。',
  'setting.firstLevel.name': '番号を付ける最初のレベル',
  'setting.firstLevel.desc':
    '単独の番号を付ける見出しのレベル。「自動」では、各ノートで最も浅い見出しを使います。それより浅い見出しには番号を付けず、カウントをやり直します。',
  'setting.maxLevel.name': '番号を付ける最後のレベル',
  'setting.maxLevel.desc': 'それより深い見出しはそのままにします。',
  'setting.topStyle.name': '最上位レベルの番号',
  'setting.topStyle.desc': '最初の番号の書き方。',
  'setting.otherStyle.name': '下位レベルの番号',
  'setting.otherStyle.desc': '2 つ目以降の各番号の書き方。',
  'setting.separator.name': '区切り文字',
  'setting.separator.desc':
    '番号の後ろに付ける文字。区切り文字なしの場合、"2024 in review" のようにすでに数字で始まる見出しは番号付き済みとみなされ、その数字が取り除かれます。',
  'setting.skipAnchor.name': 'スキップ用アンカー',
  'setting.skipAnchor.desc':
    '行末にこのブロック ID が付いた見出し（例: "## Preface ^skipped"）には番号を付けず、番号も消費しません。目次にも含まれません。空にするとスキップを無効にします。',
  'setting.topTemplate.name': '最上位レベルのテンプレート',
  'setting.topTemplate.desc':
    '最上位の見出しの番号まわりのテキスト。{n} が番号を表します: "Chapter {n}." なら "Chapter 1. Intro" になります。{n} の後ろのテキストは区切り文字の代わりになり、ない場合（"Chapter {n}"）は区切り文字が続きます。再度番号を付けると、以前のテンプレートで書かれたテキストが置き換えられます。',
  'setting.otherTemplate.name': '下位レベルのテンプレート',
  'setting.otherTemplate.desc': '最上位より下のすべての見出しに同様に適用されます。{n} は番号全体で、"Section {n}" なら "Section 1.2" になります。',
  'setting.readFrontMatter.name': 'Follow Number Headings properties',
  'setting.readFrontMatter.desc':
    'Number Headings プラグインが書き込む形式で、プロパティに "number headings" の項目があるノートは、その内容どおりに番号付けされます。"number headings: off" ならそのノートは変更しません。',
  'setting.updateLinks.name': '他のノートのリンクを更新',
  'setting.updateLinks.desc': '見出しの番号が変わったとき、保管庫内の残りのノートにあるそのリンクを書き換えて、リンクが機能し続けるようにします。このノート内のリンクは常に更新されます。',
};

export default ja;
