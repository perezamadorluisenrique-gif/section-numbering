import type { Messages } from '../i18n.ts';

const ptBR: Messages = {
  // Commands
  'command.toggleShownNumbers': 'Mostrar ou ocultar a numeração dos títulos (sem alterar as notas)',
  'command.insertLiveContents': 'Inserir índice dinâmico',
  'command.copyWithNumbers': 'Copiar esta nota com a numeração dos títulos',
  'command.numberHeadings': 'Numerar os títulos desta nota',
  'command.removeNumbers': 'Remover a numeração dos títulos desta nota',
  'command.tableOfContents': 'Inserir ou atualizar o índice',
  'command.saveToProperties': 'Salvar as configurações de numeração nas propriedades desta nota',

  // Notices
  'notice.showingNumbers': 'Mostrando a numeração dos títulos. Suas notas não foram alteradas.',
  'notice.hidingNumbers': 'A numeração dos títulos não é mais mostrada.',
  'notice.copied': 'A nota foi copiada com os títulos numerados. A nota em si não foi alterada.',
  'notice.clipboardFailed': 'Não foi possível escrever na área de transferência.',
  'notice.contentsUpdated': 'Índice atualizado.',
  'notice.contentsUpToDate': 'O índice está atualizado.',
  'notice.contentsInserted': 'Índice inserido. Numerar os títulos o mantém atualizado.',
  'notice.propertiesSaved': 'Configurações de numeração salvas nas propriedades desta nota.',
  'notice.propertiesSavedNotFollowed':
    'Configurações de numeração salvas nas propriedades desta nota. Elas só valem enquanto "Follow Number Headings properties" estiver ativado.',
  'notice.propertiesFailed': 'Não foi possível escrever as propriedades desta nota. Verifique se são YAML válido.',
  'notice.noteOff': 'Esta nota tem "number headings: off" nas propriedades, então seus títulos foram deixados como estavam.',
  'notice.nothingToChangeContentsUpdated': 'Nenhum título precisou de alteração. Índice atualizado.',
  'notice.nothingToChange': 'Nenhum título precisou de alteração.',
  'notice.numbered.one': '1 título numerado.',
  'notice.numbered.other': '{count} títulos numerados.',
  'notice.removed.one': 'Numeração removida de 1 título.',
  'notice.removed.other': 'Numeração removida de {count} títulos.',
  'notice.linksUpdated.one': '1 link atualizado em 1 outra nota.',
  'notice.linksUpdated.manyInOne': '{links} links atualizados em 1 outra nota.',
  'notice.linksUpdated.manyInMany': '{links} links atualizados em {notes} outras notas.',

  // The live table of contents
  'contents.empty': 'Ainda não há títulos para listar.',

  // Dropdown options
  'option.automatic': 'Automático',
  'option.level': 'Título {level}',
  'option.chineseNumerals': '一, 二, 三 (chinês)',
  'option.headingExample': 'Título',

  // Settings
  'setting.showNumbers.name': 'Mostrar números sem alterar as notas',
  'setting.showNumbers.desc':
    'Desenha os números na frente dos títulos, no editor e na visualização de leitura, sem escrevê-los na nota. Os links continuam funcionando sem nada para reescrever. Uma nota cujos títulos já têm números escritos, ou cujas propriedades dizem "number headings: off", fica como está.',
  'setting.showInOutline.name': 'Mostrar números no Sumário',
  'setting.showInOutline.desc':
    'Quando os números são mostrados sem alterar as notas, também os mostra na frente dos títulos na barra lateral do Sumário. Não tem efeito em notas cujos números estão escritos no texto, que o Sumário já mostra.',
  'setting.firstLevel.name': 'Primeiro nível numerado',
  'setting.firstLevel.desc':
    'O nível de título que recebe um único número. Automático usa o título de nível mais alto de cada nota. Títulos de nível mais alto ficam sem número e reiniciam a contagem.',
  'setting.maxLevel.name': 'Último nível numerado',
  'setting.maxLevel.desc': 'Títulos mais profundos são deixados como estão.',
  'setting.topStyle.name': 'Números do nível superior',
  'setting.topStyle.desc': 'Como o primeiro número é escrito.',
  'setting.otherStyle.name': 'Números dos níveis inferiores',
  'setting.otherStyle.desc': 'Como cada número depois do primeiro é escrito.',
  'setting.separator.name': 'Separador',
  'setting.separator.desc':
    'O que vem depois do número. Sem separador, um título que já começa com um número, como "2024 in review", é tomado como numerado e o perde.',
  'setting.skipAnchor.name': 'Âncora para ignorar',
  'setting.skipAnchor.desc':
    'Um título cuja linha termina com este id de bloco, como "## Preface ^skipped", não é numerado e não ocupa número. Fica fora do índice. Deixe vazio para desativar a omissão.',
  'setting.topTemplate.name': 'Modelo do nível superior',
  'setting.topTemplate.desc':
    'Texto em volta do número dos títulos de nível superior, com {n} para o número: "Chapter {n}." resulta em "Chapter 1. Intro". O texto depois de {n} substitui o separador; sem ele ("Chapter {n}"), o separador continua depois. Numerar de novo substitui o texto escrito por um modelo anterior.',
  'setting.otherTemplate.name': 'Modelo dos níveis inferiores',
  'setting.otherTemplate.desc':
    'O mesmo para cada título abaixo do nível superior, onde {n} é o número inteiro, como em "Section {n}" para "Section 1.2".',
  'setting.readFrontMatter.name': 'Follow Number Headings properties',
  'setting.readFrontMatter.desc':
    'Uma nota cujas propriedades têm uma entrada "number headings", como o plugin Number Headings a escreve, é numerada do jeito que essa entrada diz, e "number headings: off" deixa a nota em paz.',
  'setting.updateLinks.name': 'Atualizar links em outras notas',
  'setting.updateLinks.desc':
    'Quando um título é renumerado, reescreve os links para ele no restante do cofre para que continuem funcionando. Os links dentro da própria nota são sempre atualizados.',
};

export default ptBR;
