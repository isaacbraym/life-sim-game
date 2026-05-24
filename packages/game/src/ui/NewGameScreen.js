import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { calcularModificador } from '@lifesim/core';
import './NewGameScreen.css';
const GENEROS = [
    { valor: 'M', rotulo: 'Masculino' },
    { valor: 'F', rotulo: 'Feminino' },
    { valor: 'outro', rotulo: 'Outro' },
];
const RITMOS = [
    { valor: 'anual', rotulo: 'Anual', descricao: 'Uma decisão por ano de vida (recomendado)' },
    { valor: 'semestral', rotulo: 'Semestral', descricao: 'Uma decisão a cada 6 meses' },
    { valor: 'mensal', rotulo: 'Mensal', descricao: 'Uma decisão por mês (intenso)' },
];
const ENTRADAS_ATRIBUTO = [
    { chave: 'forca', rotulo: 'Força' },
    { chave: 'inteligencia', rotulo: 'Inteligência' },
    { chave: 'carisma', rotulo: 'Carisma' },
    { chave: 'constituicao', rotulo: 'Constituição' },
    { chave: 'sorte', rotulo: 'Sorte' },
];
// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
// gerarAtributosIniciais() de @core/rpg/Attributes ainda não está implementada.
// Usamos esta versão local com o método 4d6-drop-lowest do D&D 5e.
function rolarAtributos() {
    function rolar4d6() {
        const d1 = Math.floor(Math.random() * 6) + 1;
        const d2 = Math.floor(Math.random() * 6) + 1;
        const d3 = Math.floor(Math.random() * 6) + 1;
        const d4 = Math.floor(Math.random() * 6) + 1;
        return d1 + d2 + d3 + d4 - Math.min(d1, d2, d3, d4);
    }
    return {
        forca: rolar4d6(),
        inteligencia: rolar4d6(),
        carisma: rolar4d6(),
        constituicao: rolar4d6(),
        sorte: rolar4d6(),
    };
}
function formatarModificador(valor) {
    const mod = calcularModificador(valor);
    return mod >= 0 ? `+${mod}` : `${mod}`;
}
export function NewGameScreen({ aoConfirmar, aoCancelar }) {
    const [nomeSelecionado, setNomeSelecionado] = useState('');
    const [sobrenomeSelecionado, setSobrenomeSelecionado] = useState('');
    const [generoSelecionado, setGeneroSelecionado] = useState('M');
    const [ritmoSelecionado, setRitmoSelecionado] = useState('anual');
    const [atributos, setAtributos] = useState(rolarAtributos);
    const [erroNome, setErroNome] = useState(undefined);
    const podeConfirmar = nomeSelecionado.trim().length > 0 && sobrenomeSelecionado.trim().length > 0;
    function handleConfirmar() {
        if (nomeSelecionado.trim().length < 2 || sobrenomeSelecionado.trim().length < 2) {
            setErroNome('Nome e sobrenome devem ter pelo menos 2 caracteres.');
            return;
        }
        setErroNome(undefined);
        aoConfirmar({
            nome: nomeSelecionado.trim(),
            sobrenome: sobrenomeSelecionado.trim(),
            genero: generoSelecionado,
            ritmo: ritmoSelecionado,
            atributos,
        });
    }
    return (_jsx("div", { className: "ng-tela", children: _jsxs("div", { className: "ng-card", children: [_jsx("h1", { className: "ng-titulo", children: "Novo Personagem" }), _jsxs("section", { className: "ng-secao", children: [_jsxs("div", { className: "ng-inputs", children: [_jsxs("div", { className: "ng-campo", children: [_jsx("label", { className: "ng-label", htmlFor: "ng-nome", children: "Nome" }), _jsx("input", { id: "ng-nome", className: "ng-input", type: "text", value: nomeSelecionado, onChange: e => setNomeSelecionado(e.target.value), placeholder: "Ex: Lucas" })] }), _jsxs("div", { className: "ng-campo", children: [_jsx("label", { className: "ng-label", htmlFor: "ng-sobrenome", children: "Sobrenome" }), _jsx("input", { id: "ng-sobrenome", className: "ng-input", type: "text", value: sobrenomeSelecionado, onChange: e => setSobrenomeSelecionado(e.target.value), placeholder: "Ex: Mendes" })] })] }), erroNome !== undefined && (_jsx("p", { className: "ng-erro", role: "alert", children: erroNome }))] }), _jsxs("section", { className: "ng-secao", children: [_jsx("div", { className: "ng-secao-titulo", children: "G\u00EAnero" }), _jsx("div", { className: "ng-toggle-grupo", role: "group", "aria-label": "G\u00EAnero", children: GENEROS.map(g => (_jsx("button", { className: `ng-toggle-btn${generoSelecionado === g.valor ? ' ng-toggle-btn--ativo' : ''}`, onClick: () => setGeneroSelecionado(g.valor), children: g.rotulo }, g.valor))) })] }), _jsxs("section", { className: "ng-secao", children: [_jsx("div", { className: "ng-secao-titulo", children: "Ritmo de jogo" }), _jsx("div", { className: "ng-ritmo-grupo", role: "group", "aria-label": "Ritmo de jogo", children: RITMOS.map(r => (_jsxs("button", { className: `ng-ritmo-btn${ritmoSelecionado === r.valor ? ' ng-ritmo-btn--ativo' : ''}`, onClick: () => setRitmoSelecionado(r.valor), children: [_jsx("span", { className: "ng-ritmo-nome", children: r.rotulo }), _jsx("span", { className: "ng-ritmo-desc", children: r.descricao })] }, r.valor))) })] }), _jsxs("section", { className: "ng-secao", children: [_jsxs("div", { className: "ng-secao-titulo-row", children: [_jsx("span", { className: "ng-secao-titulo", children: "Atributos" }), _jsx("button", { className: "ng-rolar-btn", onClick: () => setAtributos(rolarAtributos()), children: "\uD83C\uDFB2 Rolar novamente" })] }), _jsx("div", { className: "ng-atrib-grid", children: ENTRADAS_ATRIBUTO.map(({ chave, rotulo }) => (_jsxs("div", { className: "ng-atrib-card", children: [_jsx("span", { className: "ng-atrib-nome", children: rotulo }), _jsx("span", { className: "ng-atrib-valor", children: atributos[chave] }), _jsx("span", { className: "ng-atrib-mod", children: formatarModificador(atributos[chave]) })] }, chave))) })] }), _jsxs("div", { className: "ng-acoes", children: [aoCancelar !== undefined && (_jsx("button", { className: "ng-btn-cancelar", onClick: aoCancelar, children: "Cancelar" })), _jsx("button", { className: "ng-btn-comecar", onClick: handleConfirmar, disabled: !podeConfirmar, children: "Come\u00E7ar" })] })] }) }));
}
//# sourceMappingURL=NewGameScreen.js.map