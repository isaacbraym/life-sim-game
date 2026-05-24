import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { PainelAtributos } from './PainelAtributos';
import './HudLateral.css';
const ATIVIDADES_LIVRES = [
    { id: 'academia', rotulo: '🏋️ Academia' },
    { id: 'estudar', rotulo: '📚 Estudar' },
    { id: 'sair_noite', rotulo: '🍺 Sair à noite' },
    { id: 'consulta_medica', rotulo: '💊 Consulta médica' },
    { id: 'ver_roster', rotulo: '👥 Ver pessoas' },
];
// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function formatarDinheiro(valor) {
    return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
}
function corBarra(valor) {
    if (valor >= 70)
        return 'verde';
    if (valor >= 40)
        return 'amarelo';
    return 'vermelho';
}
// ---------------------------------------------------------------------------
// Sub-componentes
// ---------------------------------------------------------------------------
function BarraStat({ rotulo, valor, }) {
    const cor = corBarra(valor);
    return (_jsxs("div", { className: "hud-stat-card", children: [_jsxs("div", { className: "hud-stat-topo", children: [_jsx("span", { className: "hud-stat-rotulo", children: rotulo }), _jsx("span", { className: `hud-stat-valor hud-stat-valor--${cor}`, children: valor })] }), _jsx("div", { className: "hud-barra-trilho", children: _jsx("div", { className: `hud-barra-fill hud-barra-fill--${cor}`, style: { width: `${valor}%` } }) })] }));
}
// ---------------------------------------------------------------------------
// Componente principal
// ---------------------------------------------------------------------------
export function HudLateral({ nomePersonagem, profissaoAtual, idadeAnos, anoAtual, humor, saude, dinheiro, atributos, aoClicarAtividade, aoNovoJogo, }) {
    return (_jsxs("aside", { className: "hud-lateral", "aria-label": "Status do personagem", children: [aoNovoJogo !== undefined && (_jsx("button", { className: "hud-novo-jogo-btn", onClick: aoNovoJogo, children: "+ Novo Jogo" })), _jsxs("div", { className: "hud-identidade", children: [_jsx("div", { className: "hud-nome", children: nomePersonagem }), _jsx("div", { className: "hud-profissao", children: profissaoAtual }), _jsxs("div", { className: "hud-badges", children: [_jsxs("span", { className: "hud-badge", children: [idadeAnos, " anos"] }), _jsx("span", { className: "hud-badge", children: anoAtual })] })] }), _jsx("div", { className: "hud-divisor" }), _jsx("div", { className: "hud-secao-titulo", children: "Status" }), _jsx(BarraStat, { rotulo: "Humor", valor: humor }), _jsx(BarraStat, { rotulo: "Sa\u00FAde", valor: saude }), _jsxs("div", { className: "hud-dinheiro-card", children: [_jsx("div", { className: "hud-dinheiro-rotulo", children: "Dinheiro" }), _jsx("div", { className: "hud-dinheiro-valor", children: formatarDinheiro(dinheiro) })] }), _jsx("div", { className: "hud-divisor" }), _jsx("div", { className: "hud-secao-titulo", children: "Atributos" }), _jsx(PainelAtributos, { atributos: atributos }), _jsx("div", { className: "hud-divisor" }), _jsx("div", { className: "hud-secao-titulo", children: "Atividades" }), ATIVIDADES_LIVRES.map((atividade) => (_jsx("button", { className: "hud-atividade-btn", onClick: () => aoClicarAtividade(atividade.id), children: atividade.rotulo }, atividade.id)))] }));
}
//# sourceMappingURL=HudLateral.js.map