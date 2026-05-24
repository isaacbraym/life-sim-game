import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useHudStore } from '../state/hudStore';
import './EventoBase.css';
// ---------------------------------------------------------------------------
// Componente
// ---------------------------------------------------------------------------
export function EventoBase({ evento, aoEscolher, }) {
    const avancarTurno = useHudStore((s) => s.avancarTurno);
    if (evento === undefined) {
        return (_jsx("div", { className: "evento-base evento-base--vazio", children: _jsx("button", { className: "evento-btn-avancar", onClick: () => { void avancarTurno(); }, children: "Avan\u00E7ar \u2192" }) }));
    }
    return (_jsxs("div", { className: "evento-base", role: "region", "aria-label": "Evento atual", children: [_jsxs("div", { className: "evento-header", children: [_jsx("span", { className: "evento-icone", "aria-hidden": "true", children: evento.icone }), _jsx("span", { className: "evento-titulo", children: evento.titulo })] }), _jsx("p", { className: "evento-descricao", children: evento.descricao }), _jsxs("div", { className: "evento-acoes", role: "group", "aria-label": "Op\u00E7\u00F5es de resposta", children: [evento.opcoes.map((opcao, indice) => (_jsx("button", { className: "evento-btn-opcao", onClick: () => aoEscolher(indice), children: opcao.texto }, indice))), _jsx("button", { className: "evento-btn-avancar", onClick: () => { void avancarTurno(); }, "aria-label": "Avan\u00E7ar sem tomar decis\u00E3o", children: "Avan\u00E7ar \u2192" })] })] }));
}
//# sourceMappingURL=EventoBase.js.map