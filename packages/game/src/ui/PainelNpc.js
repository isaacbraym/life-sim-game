import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from 'react';
import { calcularModificador } from '@lifesim/core';
import './PainelNpc.css';
// ---------------------------------------------------------------------------
// Constantes
// ---------------------------------------------------------------------------
const ABAS = [
    { id: 'aparencia', rotulo: 'Aparência' },
    { id: 'bio', rotulo: 'Bio' },
    { id: 'relacionamento', rotulo: 'Relacionamento' },
    { id: 'atributos', rotulo: 'Atributos' },
    { id: 'timeline', rotulo: 'Linha do tempo' },
];
const MESES_PT = [
    '', 'jan', 'fev', 'mar', 'abr', 'mai', 'jun',
    'jul', 'ago', 'set', 'out', 'nov', 'dez',
];
const ROTULO_VINCULO = {
    familia_pai: 'Pai',
    familia_mae: 'Mãe',
    familia_irmao: 'Irmão / Irmã',
    familia_filho: 'Filho / Filha',
    familia_conjuge: 'Cônjuge',
    familia_extendida: 'Família',
    amigo_proximo: 'Amigo próximo',
    amigo_casual: 'Amigo casual',
    colega_trabalho: 'Colega de trabalho',
    colega_escola: 'Colega de escola',
    chefe: 'Chefe',
    subordinado: 'Subordinado',
    romance_atual: 'Romance atual',
    ex_romance: 'Ex-romance',
    inimigo: 'Inimigo',
    rival: 'Rival',
    profissional: 'Contato profissional',
    conhecido: 'Conhecido',
};
const ROTULO_FINANCEIRO = {
    pobre: 'Baixa',
    medio: 'Média',
    rico: 'Alta',
    milionario: 'Milionária',
};
const EMOJI_GENERO = { M: '👨', F: '👩', outro: '🧑' };
// ---------------------------------------------------------------------------
// Helpers puros
// ---------------------------------------------------------------------------
function calcularIdadeNpc(npc, anoAtual) {
    return anoAtual - npc.dataNascimento.ano;
}
function formatarMesAno(mes, ano) {
    const rotuloMes = MESES_PT[mes] ?? String(mes);
    return `${rotuloMes}. ${ano}`;
}
function formatarModificador(mod) {
    return mod >= 0 ? `+${mod}` : String(mod);
}
/** Converte afeto (−100..+100) para largura de barra (0..100%) */
function afetoParaLargura(afeto) {
    return ((afeto + 100) / 200) * 100;
}
function corAfetoValor(afeto) {
    if (afeto >= 40)
        return 'var(--pnpc-green)';
    if (afeto >= 0)
        return 'var(--pnpc-yellow)';
    return 'var(--pnpc-red)';
}
// ---------------------------------------------------------------------------
// Sub-componentes de aba
// ---------------------------------------------------------------------------
function AbaAparencia({ npc }) {
    const { tracosFisicos: fixos, tracosVariaveis: variaveis } = npc;
    return (_jsxs(_Fragment, { children: [_jsxs("div", { className: "painel-npc__rig-preview", children: [_jsxs("svg", { width: "70", height: "130", viewBox: "0 0 70 130", "aria-label": "Silhueta do NPC", children: [_jsx("ellipse", { cx: "35", cy: "18", rx: "14", ry: "16", fill: fixos.corPele }), _jsx("rect", { x: "29", y: "32", width: "12", height: "10", rx: "3", fill: fixos.corPele }), _jsx("path", { d: "M16 42 Q35 36 54 42 L51 82 Q35 86 19 82Z", fill: "#3a5fa0" }), _jsx("path", { d: "M16 44 L7 72 Q5 75 9 76 L16 77 L20 52Z", fill: "#3a5fa0" }), _jsx("path", { d: "M54 44 L63 72 Q65 75 61 76 L54 77 L50 52Z", fill: "#3a5fa0" }), _jsx("rect", { x: "19", y: "82", width: "13", height: "42", rx: "4", fill: "#2a3a60" }), _jsx("rect", { x: "38", y: "82", width: "13", height: "42", rx: "4", fill: "#2a3a60" })] }), _jsx("span", { className: "painel-npc__rig-preview-label", children: "PREVIEW" })] }), _jsxs("div", { className: "painel-npc__secao", children: [_jsx("div", { className: "painel-npc__secao-titulo", children: "Tra\u00E7os imut\u00E1veis" }), _jsxs("div", { className: "painel-npc__cartao", children: [_jsxs(LinhaFisica, { rotulo: "Cor de pele", children: [_jsx("span", { className: "painel-npc__cor-swatch", style: { background: fixos.corPele } }), fixos.corPele] }), _jsxs(LinhaFisica, { rotulo: "Cor dos olhos", children: [_jsx("span", { className: "painel-npc__cor-swatch", style: { background: fixos.corOlhos } }), fixos.corOlhos] }), _jsx(LinhaFisica, { rotulo: "Formato do rosto", children: fixos.formatoRosto }), _jsx(LinhaFisica, { rotulo: "Formato do nariz", children: fixos.formatoNariz }), _jsx(LinhaFisica, { rotulo: "Formato da boca", children: fixos.formatoBoca }), _jsx(LinhaFisica, { rotulo: "Estilo corporal", children: fixos.estiloCorporalBase }), _jsxs(LinhaFisica, { rotulo: "Altura base", children: [fixos.alturaBase.toFixed(2), " m"] })] })] }), _jsxs("div", { className: "painel-npc__secao", children: [_jsx("div", { className: "painel-npc__secao-titulo", children: "Apar\u00EAncia atual" }), _jsxs("div", { className: "painel-npc__cartao", children: [_jsxs(LinhaFisica, { rotulo: "Cor do cabelo", children: [_jsx("span", { className: "painel-npc__cor-swatch", style: { background: variaveis.corCabelo } }), variaveis.corCabelo] }), _jsx(LinhaFisica, { rotulo: "Estilo do cabelo", children: variaveis.estiloCabelo }), _jsxs(LinhaFisica, { rotulo: "Peso atual", children: [variaveis.pesoAtual, " kg"] }), _jsxs(LinhaFisica, { rotulo: "Altura atual", children: [variaveis.alturaAtual.toFixed(2), " m"] }), _jsx(LinhaFisica, { rotulo: "Grisalho", children: variaveis.temGrisalho ? 'Sim' : 'Não' }), _jsx(LinhaFisica, { rotulo: "Rugas", children: variaveis.temRugas ? 'Sim' : 'Não' }), _jsx(LinhaFisica, { rotulo: "Olheiras", children: variaveis.temOlheiras ? 'Sim' : 'Não' }), _jsx(LinhaFisica, { rotulo: "Usa \u00F3culos", children: variaveis.usaOculos ? 'Sim' : 'Não' })] })] })] }));
}
function AbaBio({ npc, anoAtual }) {
    const idadeAtual = calcularIdadeNpc(npc, anoAtual);
    const dataNasc = `${npc.dataNascimento.dia.toString().padStart(2, '0')}/${npc.dataNascimento.mes.toString().padStart(2, '0')}/${npc.dataNascimento.ano}`;
    const rotuloGenero = { M: 'Masculino', F: 'Feminino', outro: 'Outro' };
    return (_jsxs(_Fragment, { children: [_jsxs("div", { className: "painel-npc__secao", children: [_jsx("div", { className: "painel-npc__secao-titulo", children: "Identifica\u00E7\u00E3o" }), _jsxs("div", { className: "painel-npc__grid-bio", children: [_jsxs("div", { className: "painel-npc__bio-item painel-npc__bio-item--full", children: [_jsx("div", { className: "painel-npc__bi-label", children: "Nome completo" }), _jsxs("div", { className: "painel-npc__bi-valor", style: { fontSize: 16 }, children: [npc.nome, " ", npc.sobrenome] })] }), _jsxs("div", { className: "painel-npc__bio-item", children: [_jsx("div", { className: "painel-npc__bi-label", children: "G\u00EAnero" }), _jsx("div", { className: "painel-npc__bi-valor", children: rotuloGenero[npc.genero] ?? npc.genero })] }), _jsxs("div", { className: "painel-npc__bio-item", children: [_jsx("div", { className: "painel-npc__bi-label", children: "Nascimento" }), _jsx("div", { className: "painel-npc__bi-valor", children: dataNasc })] }), _jsxs("div", { className: "painel-npc__bio-item", children: [_jsx("div", { className: "painel-npc__bi-label", children: "Idade atual" }), _jsxs("div", { className: "painel-npc__bi-valor", children: [idadeAtual, " anos"] })] }), _jsxs("div", { className: "painel-npc__bio-item", children: [_jsx("div", { className: "painel-npc__bi-label", children: "Status" }), _jsx("div", { className: "painel-npc__bi-valor", style: { color: npc.vivo ? 'var(--pnpc-green)' : 'var(--pnpc-red)' }, children: npc.vivo ? '✓ Vivo' : '✕ Falecido' })] })] })] }), _jsxs("div", { className: "painel-npc__secao", children: [_jsx("div", { className: "painel-npc__secao-titulo", children: "Vida profissional" }), _jsxs("div", { className: "painel-npc__grid-bio", children: [_jsxs("div", { className: "painel-npc__bio-item painel-npc__bio-item--full", children: [_jsx("div", { className: "painel-npc__bi-label", children: "Profiss\u00E3o atual" }), _jsx("div", { className: "painel-npc__bi-valor", children: npc.profissaoAtual ?? 'Sem registro' })] }), _jsxs("div", { className: "painel-npc__bio-item", children: [_jsx("div", { className: "painel-npc__bi-label", children: "Situa\u00E7\u00E3o financeira" }), _jsx("div", { className: "painel-npc__bi-valor", children: ROTULO_FINANCEIRO[npc.statusFinanceiro] ?? npc.statusFinanceiro })] }), _jsxs("div", { className: "painel-npc__bio-item", children: [_jsx("div", { className: "painel-npc__bi-label", children: "Persist\u00EAncia" }), _jsx("div", { className: "painel-npc__bi-valor", style: { textTransform: 'capitalize' }, children: npc.persistencia })] })] })] }), npc.tags.length > 0 && (_jsxs("div", { className: "painel-npc__secao", children: [_jsx("div", { className: "painel-npc__secao-titulo", children: "Tags" }), _jsx("div", { style: { display: 'flex', gap: 6, flexWrap: 'wrap' }, children: npc.tags.map(tag => (_jsx("span", { className: "painel-npc__tl-tag", children: tag }, tag))) })] }))] }));
}
function AbaRelacionamento({ npc }) {
    const { relacionamentoComJogador: rel } = npc;
    const rotuloTipo = ROTULO_VINCULO[rel.tipo] ?? rel.tipo;
    const larguraBarra = afetoParaLargura(rel.afeto);
    const corAfeto = corAfetoValor(rel.afeto);
    const desde = formatarMesAno(rel.conhecidoDesde.mes, rel.conhecidoDesde.ano);
    return (_jsxs(_Fragment, { children: [_jsxs("div", { className: "painel-npc__rel-tipo", children: [_jsx("span", { className: "painel-npc__rel-icone", children: "\uD83E\uDD1D" }), _jsxs("div", { className: "painel-npc__rel-info", children: [_jsx("h4", { children: rotuloTipo }), _jsxs("p", { children: ["Conhecido(a) desde ", desde, rel.ultimaInteracao && (_jsxs(_Fragment, { children: [" \u00B7 \u00DAltima intera\u00E7\u00E3o: ", formatarMesAno(rel.ultimaInteracao.mes, rel.ultimaInteracao.ano)] }))] })] })] }), _jsxs("div", { className: "painel-npc__afeto-bloco", children: [_jsxs("div", { className: "painel-npc__afeto-header", children: [_jsx("span", { className: "painel-npc__afeto-label", children: "Afeto" }), _jsxs("span", { className: "painel-npc__afeto-valor", style: { color: corAfeto }, children: [rel.afeto >= 0 ? '+' : '', rel.afeto, " / 100"] })] }), _jsx("div", { className: "painel-npc__afeto-barra-bg", children: _jsx("div", { className: "painel-npc__afeto-barra-fill", style: { width: `${larguraBarra}%` } }) })] }), npc.historicoInteracoes.length > 0 && (_jsxs("div", { className: "painel-npc__secao", children: [_jsx("div", { className: "painel-npc__secao-titulo", children: "Hist\u00F3rico de intera\u00E7\u00F5es" }), _jsx("div", { className: "painel-npc__cartao", children: npc.historicoInteracoes
                            .slice()
                            .sort((a, b) => b.ano !== a.ano ? b.ano - a.ano : b.mes - a.mes)
                            .map((interacao, indice) => (_jsxs("div", { className: "painel-npc__historico-item", children: [_jsx("div", { className: "painel-npc__rel-dot" }), _jsxs("div", { className: "painel-npc__rel-text", children: [_jsx("strong", { children: formatarMesAno(interacao.mes, interacao.ano) }), ' — ', _jsx("span", { style: { fontFamily: "'DM Mono', monospace", fontSize: 11 }, children: interacao.eventoId })] })] }, `${interacao.eventoId}-${indice}`))) })] }))] }));
}
function AbaAtributos({ npc }) {
    if (!npc.atributos) {
        return (_jsx("p", { className: "painel-npc__sem-atributos", children: "Este NPC n\u00E3o possui atributos registrados." }));
    }
    const { atributos } = npc;
    return (_jsxs(_Fragment, { children: [_jsxs("div", { className: "painel-npc__secao", children: [_jsx("div", { className: "painel-npc__secao-titulo", children: "Status atual" }), _jsxs("div", { className: "painel-npc__status-pills", children: [_jsx("span", { className: "painel-npc__status-pill painel-npc__status-pill--vivo", children: npc.vivo ? '✓ Vivo' : '✕ Falecido' }), npc.profissaoAtual && (_jsx("span", { className: "painel-npc__status-pill painel-npc__status-pill--emprego", children: npc.profissaoAtual })), _jsxs("span", { className: "painel-npc__status-pill painel-npc__status-pill--financ", children: ["\uD83D\uDCB0 ", ROTULO_FINANCEIRO[npc.statusFinanceiro] ?? npc.statusFinanceiro] })] })] }), _jsxs("div", { className: "painel-npc__secao", children: [_jsx("div", { className: "painel-npc__secao-titulo", children: "Atributos RPG" }), _jsxs("div", { className: "painel-npc__attr-grid", children: [_jsx(CartaoAtributo, { nome: "For\u00E7a", valor: atributos.forca, modificador: calcularModificador(atributos.forca), classeExtra: "painel-npc__attr-card--forca" }), _jsx(CartaoAtributo, { nome: "Intelig\u00EAncia", valor: atributos.inteligencia, modificador: calcularModificador(atributos.inteligencia), classeExtra: "painel-npc__attr-card--int" }), _jsx(CartaoAtributo, { nome: "Carisma", valor: atributos.carisma, modificador: calcularModificador(atributos.carisma), classeExtra: "painel-npc__attr-card--car" }), _jsx(CartaoAtributo, { nome: "Constitui\u00E7\u00E3o", valor: atributos.constituicao, modificador: calcularModificador(atributos.constituicao), classeExtra: "painel-npc__attr-card--con" }), _jsx(CartaoAtributo, { nome: "Sorte", valor: atributos.sorte, modificador: calcularModificador(atributos.sorte), classeExtra: "painel-npc__attr-card--sor painel-npc__attr-card--full" })] })] })] }));
}
function AbaTimeline({ npc }) {
    const interacoesOrdenadas = npc.historicoInteracoes
        .slice()
        .sort((a, b) => b.ano !== a.ano ? b.ano - a.ano : b.mes - a.mes);
    if (interacoesOrdenadas.length === 0) {
        return (_jsx("p", { className: "painel-npc__sem-atributos", children: "Nenhuma intera\u00E7\u00E3o registrada ainda." }));
    }
    return (_jsxs("div", { className: "painel-npc__secao", children: [_jsx("div", { className: "painel-npc__secao-titulo", children: "Eventos compartilhados" }), interacoesOrdenadas.map((interacao, indice) => {
                const ehUltimo = indice === interacoesOrdenadas.length - 1;
                return (_jsxs("div", { className: "painel-npc__timeline-item", children: [_jsxs("div", { className: "painel-npc__tl-esquerda", children: [_jsx("div", { className: "painel-npc__tl-ano", children: interacao.ano }), _jsx("div", { className: "painel-npc__tl-dot" }), !ehUltimo && _jsx("div", { className: "painel-npc__tl-linha" })] }), _jsxs("div", { className: "painel-npc__tl-conteudo", children: [_jsx("div", { className: "painel-npc__tl-titulo", children: formatarMesAno(interacao.mes, interacao.ano) }), _jsx("div", { className: "painel-npc__tl-desc", children: interacao.eventoId }), _jsx("span", { className: "painel-npc__tl-tag", children: "evento" })] })] }, `${interacao.eventoId}-${indice}`));
            })] }));
}
// ---------------------------------------------------------------------------
// Micro-componentes reutilizáveis
// ---------------------------------------------------------------------------
function LinhaFisica({ rotulo, children, }) {
    return (_jsxs("div", { className: "painel-npc__atributo-fisico", children: [_jsx("span", { className: "painel-npc__af-label", children: rotulo }), _jsx("span", { className: "painel-npc__af-valor", children: children })] }));
}
function CartaoAtributo({ nome, valor, modificador, classeExtra, }) {
    return (_jsxs("div", { className: `painel-npc__attr-card ${classeExtra}`, children: [_jsx("div", { className: "painel-npc__a-nome", children: nome }), _jsx("div", { className: "painel-npc__a-val", children: valor }), _jsxs("div", { className: "painel-npc__a-mod", children: ["mod ", formatarModificador(modificador)] })] }));
}
// ---------------------------------------------------------------------------
// Componente principal
// ---------------------------------------------------------------------------
export function PainelNpc({ npc, anoAtual, aoFechar, aoInteragir, aoVisitar, }) {
    const [abaAtiva, definirAba] = useState('aparencia');
    const idadeAtual = calcularIdadeNpc(npc, anoAtual);
    const emojiGenero = EMOJI_GENERO[npc.genero] ?? '🧑';
    const rotuloVinculo = ROTULO_VINCULO[npc.relacionamentoComJogador.tipo] ?? npc.relacionamentoComJogador.tipo;
    function fecharAoClicarOverlay(evento) {
        if (evento.target === evento.currentTarget)
            aoFechar();
    }
    return (_jsx("div", { className: "painel-npc-overlay", role: "dialog", "aria-modal": "true", "aria-label": `Painel de NPC: ${npc.nome} ${npc.sobrenome}`, onClick: fecharAoClicarOverlay, children: _jsxs("div", { className: "painel-npc", children: [_jsxs("div", { className: "painel-npc__header", children: [_jsx("button", { className: "painel-npc__btn-fechar", onClick: aoFechar, "aria-label": "Fechar painel", children: "\u2715" }), _jsxs("div", { className: "painel-npc__identidade", children: [_jsxs("div", { className: "painel-npc__avatar-wrap", children: [_jsx("div", { className: "painel-npc__avatar", children: emojiGenero }), _jsx("span", { className: `painel-npc__badge-persistencia painel-npc__badge-persistencia--${npc.persistencia}`, children: npc.persistencia.toUpperCase() })] }), _jsxs("div", { className: "painel-npc__nome-bloco", children: [_jsxs("h2", { children: [npc.nome, " ", npc.sobrenome] }), _jsx("div", { className: "painel-npc__papel", children: rotuloVinculo }), _jsxs("div", { className: "painel-npc__dados-rapidos", children: [_jsxs("span", { className: "painel-npc__dado", children: ["\uD83D\uDC64 ", idadeAtual, " anos"] }), npc.profissaoAtual && (_jsxs("span", { className: "painel-npc__dado", children: ["\uD83D\uDCBC ", npc.profissaoAtual] })), _jsx("span", { className: "painel-npc__dado", style: { color: npc.vivo ? 'var(--pnpc-green)' : 'var(--pnpc-red)' }, children: npc.vivo ? '💚 Vivo' : '💀 Falecido' })] })] })] })] }), _jsx("div", { className: "painel-npc__abas", role: "tablist", children: ABAS.map(aba => (_jsx("button", { role: "tab", "aria-selected": abaAtiva === aba.id, className: `painel-npc__aba${abaAtiva === aba.id ? ' painel-npc__aba--ativa' : ''}`, onClick: () => definirAba(aba.id), children: aba.rotulo }, aba.id))) }), _jsxs("div", { className: "painel-npc__conteudo", role: "tabpanel", children: [abaAtiva === 'aparencia' && _jsx(AbaAparencia, { npc: npc }), abaAtiva === 'bio' && _jsx(AbaBio, { npc: npc, anoAtual: anoAtual }), abaAtiva === 'relacionamento' && _jsx(AbaRelacionamento, { npc: npc }), abaAtiva === 'atributos' && _jsx(AbaAtributos, { npc: npc }), abaAtiva === 'timeline' && _jsx(AbaTimeline, { npc: npc })] }), _jsxs("div", { className: "painel-npc__footer", children: [_jsx("button", { className: "painel-npc__btn painel-npc__btn--sec", onClick: () => aoVisitar?.(npc), disabled: !aoVisitar, children: "Visitar" }), _jsx("button", { className: "painel-npc__btn painel-npc__btn--primario", onClick: () => aoInteragir?.(npc), disabled: !aoInteragir, children: "Interagir" })] })] }) }));
}
//# sourceMappingURL=PainelNpc.js.map