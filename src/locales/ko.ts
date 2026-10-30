import type { Messages } from '../i18n.ts';

const ko: Messages = {
  // Commands
  'command.toggleShownNumbers': '제목 번호 표시 또는 숨기기(노트는 변경하지 않음)',
  'command.insertLiveContents': '실시간 목차 삽입',
  'command.copyWithNumbers': '제목 번호를 포함해 이 노트 복사',
  'command.numberHeadings': '이 노트의 제목에 번호 매기기',
  'command.removeNumbers': '이 노트의 제목 번호 제거',
  'command.tableOfContents': '목차 삽입 또는 업데이트',
  'command.saveToProperties': '번호 매기기 설정을 이 노트의 속성에 저장',

  // Notices
  'notice.showingNumbers': '제목 번호를 표시하고 있습니다. 노트는 변경되지 않습니다.',
  'notice.hidingNumbers': '제목 번호를 더 이상 표시하지 않습니다.',
  'notice.copied': '제목에 번호를 매긴 노트를 복사했습니다. 노트 자체는 변경되지 않았습니다.',
  'notice.clipboardFailed': '클립보드에 쓸 수 없습니다.',
  'notice.contentsUpdated': '목차를 업데이트했습니다.',
  'notice.contentsUpToDate': '목차가 최신 상태입니다.',
  'notice.contentsInserted': '목차를 삽입했습니다. 제목에 번호를 매기면 목차가 최신 상태로 유지됩니다.',
  'notice.propertiesSaved': '번호 매기기 설정을 이 노트의 속성에 저장했습니다.',
  'notice.propertiesSavedNotFollowed':
    '번호 매기기 설정을 이 노트의 속성에 저장했습니다. "Follow Number Headings properties"가 켜져 있는 동안에만 적용됩니다.',
  'notice.propertiesFailed': '이 노트의 속성을 쓸 수 없습니다. 올바른 YAML인지 확인하세요.',
  'notice.noteOff': '이 노트의 속성에 "number headings: off"가 있어 제목을 건드리지 않았습니다.',
  'notice.nothingToChangeContentsUpdated': '변경할 제목이 없습니다. 목차를 업데이트했습니다.',
  'notice.nothingToChange': '변경할 제목이 없습니다.',
  'notice.numbered.one': '제목 1개에 번호를 매겼습니다.',
  'notice.numbered.other': '제목 {count}개에 번호를 매겼습니다.',
  'notice.removed.one': '제목 1개의 번호를 제거했습니다.',
  'notice.removed.other': '제목 {count}개의 번호를 제거했습니다.',
  'notice.linksUpdated.one': '다른 노트 1개에서 링크 1개를 업데이트했습니다.',
  'notice.linksUpdated.manyInOne': '다른 노트 1개에서 링크 {links}개를 업데이트했습니다.',
  'notice.linksUpdated.manyInMany': '다른 노트 {notes}개에서 링크 {links}개를 업데이트했습니다.',

  // The live table of contents
  'contents.empty': '아직 나열할 제목이 없습니다.',

  // Dropdown options
  'option.automatic': '자동',
  'option.level': '제목 {level}',
  'option.chineseNumerals': '一, 二, 三(한자 숫자)',
  'option.headingExample': '제목',

  // Settings
  'setting.showNumbers.name': '노트를 변경하지 않고 번호 표시',
  'setting.showNumbers.desc':
    '노트에 쓰지 않고 편집기와 읽기 화면에서 제목 앞에 번호를 그려 보여 줍니다. 다시 쓸 것 없이 링크는 그대로 동작합니다. 제목에 번호가 이미 쓰여 있거나 속성에 "number headings: off"가 있는 노트는 그대로 둡니다.',
  'setting.showInOutline.name': '개요에 번호 표시',
  'setting.showInOutline.desc':
    '노트를 변경하지 않고 번호를 표시할 때, 개요 사이드바의 제목 앞에도 번호를 표시합니다. 번호가 본문에 쓰여 있는 노트에는 영향이 없으며, 개요는 이미 그 번호를 보여 줍니다.',
  'setting.firstLevel.name': '번호를 매기는 첫 수준',
  'setting.firstLevel.desc':
    '번호가 하나만 붙는 제목 수준입니다. "자동"은 각 노트에서 가장 얕은 제목을 사용합니다. 그보다 얕은 제목은 번호를 매기지 않으며 번호 세기를 다시 시작합니다.',
  'setting.maxLevel.name': '번호를 매기는 마지막 수준',
  'setting.maxLevel.desc': '그보다 깊은 제목은 그대로 둡니다.',
  'setting.topStyle.name': '최상위 수준 번호',
  'setting.topStyle.desc': '첫 번째 번호를 쓰는 방식입니다.',
  'setting.otherStyle.name': '하위 수준 번호',
  'setting.otherStyle.desc': '첫 번째 이후의 모든 번호를 쓰는 방식입니다.',
  'setting.separator.name': '구분자',
  'setting.separator.desc':
    '번호 뒤에 오는 문자입니다. 구분자가 없으면 "2024 in review"처럼 이미 숫자로 시작하는 제목은 번호가 매겨진 것으로 간주되어 그 숫자가 사라집니다.',
  'setting.skipAnchor.name': '건너뛰기 앵커',
  'setting.skipAnchor.desc':
    '줄 끝에 이 블록 ID가 붙은 제목(예: "## Preface ^skipped")은 번호를 매기지 않고 번호도 차지하지 않습니다. 목차에서도 제외됩니다. 비워 두면 건너뛰기를 끕니다.',
  'setting.topTemplate.name': '최상위 수준 템플릿',
  'setting.topTemplate.desc':
    '최상위 제목의 번호 주위에 붙는 텍스트이며, {n}이 번호입니다. "Chapter {n}."은 "Chapter 1. Intro"가 됩니다. {n} 뒤의 텍스트는 구분자를 대신하며, 없으면("Chapter {n}") 구분자가 그대로 뒤따릅니다. 다시 번호를 매기면 이전 템플릿이 쓴 텍스트를 대체합니다.',
  'setting.otherTemplate.name': '하위 수준 템플릿',
  'setting.otherTemplate.desc': '최상위 아래의 모든 제목에 똑같이 적용되며, {n}은 전체 번호입니다. "Section {n}"은 "Section 1.2"가 됩니다.',
  'setting.readFrontMatter.name': 'Follow Number Headings properties',
  'setting.readFrontMatter.desc':
    'Number Headings 플러그인이 쓰는 방식으로 속성에 "number headings" 항목이 있는 노트는 그 항목이 말하는 대로 번호가 매겨지며, "number headings: off"는 노트를 그대로 둡니다.',
  'setting.updateLinks.name': '다른 노트의 링크 업데이트',
  'setting.updateLinks.desc': '제목 번호가 바뀌면 보관함의 다른 노트에 있는 해당 링크를 다시 써서 계속 동작하게 합니다. 이 노트 안의 링크는 항상 업데이트됩니다.',
  'command.addFolderRule': '이 노트의 폴더에 번호 매기기 규칙 추가',
  'notice.folderOff': '{folder} 폴더 규칙이 번호 매기기를 끄므로 이 노트의 제목은 건드리지 않았습니다.',
  'setting.folderRules.name': '폴더 규칙',
  'setting.folderRules.desc': '폴더에 고유한 번호 매기기를 지정합니다. 규칙은 노트의 "number headings" 속성과 같은 형식으로 씁니다 (A.1, _.1.1, off 등). 가장 깊은 폴더가 우선하며, 노트 자체의 속성은 모든 규칙보다 우선합니다.',
  'setting.folderRules.button': '규칙 편집',
  'folderRules.title': '폴더 규칙',
  'folderRules.empty': '아직 폴더 규칙이 없습니다.',
  'folderRules.add': '규칙 추가',
  'folderRules.choose': '폴더 선택',
  'folderRules.valuePlaceholder': '번호 매기기 (예: A.1 또는 off)',
  'folderRules.show.inherit': '화면 번호: 설정에 따름',
  'folderRules.show.on': '화면 번호: 켜짐',
  'folderRules.show.off': '화면 번호: 꺼짐',
  'folderRules.missing': '폴더를 찾을 수 없음',
  'folderRules.delete': '규칙 삭제',
  'folderRules.up': '위로',
  'folderRules.down': '아래로',
};

export default ko;
