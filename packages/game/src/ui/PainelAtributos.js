import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import './PainelAtributos.css';
// ---------------------------------------------------------------------------
// Constantes
// ---------------------------------------------------------------------------
const ABREVIACOES = {
    Força: 'FOR',
    Inteligência: 'INT',
    Carisma: 'CAR',
    Constituição: 'CON',
    Sorte: 'SOR',
};
// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function calcularModificador(valor) {
    const mod = Math.floor((valor - 10) / 2);
    return mod >= 0 ? `+${mod}` : `${mod}`;
}
function classeModificador(valor) {
    const mod = Math.floor((valor - 10) / 2);
    if (mod > 0)
        return 'positivo';
    if (mod < 0)
        return 'negativo';
    return 'zero';
}
// ---------------------------------------------------------------------------
// Sub-componente
// ---------------------------------------------------------------------------
function CardAtributo({ atributo }) {
    const abrev = ABREVIACOES[atributo.nome] ?? atributo.nome.slice(0, 3).toUpperCase();
    const modificador = calcularModificador(atributo.valor);
    const classeMod = classeModificador(atributo.valor);
    const ehSorte = atributo.nome === 'Sorte';
    return (_jsxs("div", { className: `painel-atrib-card${ehSorte ? ' painel-atrib-card--sorte' : ''}`, children: [_jsx("span", { className: "painel-atrib-abrev", children: abrev }), _jsx("span", { className: "painel-atrib-valor", children: atributo.valor }), _jsx("span", { className: `painel-atrib-mod painel-atrib-mod--${classeMod}`, children: modificador })] }));
}
// ---------------------------------------------------------------------------
// Componente principal
// ---------------------------------------------------------------------------
export function PainelAtributos({ atributos }) {
    return (_jsx("div", { className: "painel-atributos", children: atributos.map((atributo) => (_jsx(CardAtributo, { atributo: atributo }, atributo.nome))) }));
}
//# sourceMappingURL=PainelAtributos.js.map