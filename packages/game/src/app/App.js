import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from 'react';
import { PixiStage } from '../stage/PixiStage';
import { HudLateral } from '../ui/HudLateral';
import { BarraSuperior } from '../ui/BarraSuperior';
import { EventoBase } from '../ui/EventoBase';
import { NewGameScreen } from '../ui/NewGameScreen';
import { SettingsScreen } from '../ui/SettingsScreen';
import { DeathScreen } from '../ui/DeathScreen';
import { useHudStore } from '../state/hudStore';
import { v4 as uuidv4 } from 'uuid';
import { SaveManager } from '@core/persistence/SaveManager';
import { gerarRosterInicial } from '@core/npc/NpcGenerator';
import '../app/App.css';
// ---------------------------------------------------------------------------
// Componente
// ---------------------------------------------------------------------------
export function App() {
    const [telaAtual, setTelaAtual] = useState('jogo');
    const [dadosMorte, setDadosMorte] = useState(undefined);
    const { nomePersonagem, profissaoAtual, idadeAnos, anoAtual, humor, saude, dinheiro, atributos, eventoAtivo, eventosVividos, resolverOpcao, inicializarEngine, } = useHudStore();
    // ── Novo personagem ────────────────────────────────────────────────────────
    async function aoConfirmarNovoPersonagem(dados) {
        const anoNascimento = 1990 + Math.floor(Math.random() * 16); // 1990–2005
        const saveManager = new SaveManager();
        const rosterFamiliar = gerarRosterInicial(anoNascimento, Date.now() % 100000);
        const novoSave = await saveManager.criarNovoSave({
            nomeSlot: `${dados.nome} ${dados.sobrenome}`,
            ritmo: dados.ritmo,
            roster: rosterFamiliar,
            protagonista: {
                schemaVersion: '1.0.0',
                characterId: uuidv4(),
                nome: dados.nome,
                sobrenome: dados.sobrenome,
                genero: dados.genero,
                dataNascimento: { ano: anoNascimento, mes: 1, dia: 1 },
                idadeAtualMeses: 0,
                tracosFisicos: {
                    corPele: '#f1c27d',
                    corOlhos: '#634e34',
                    formatoRosto: 'oval',
                    formatoNariz: 'reto',
                    formatoBoca: 'fina',
                    estiloCorporalBase: 'medio',
                    alturaBase: 1.70,
                },
                tracosVariaveis: {
                    corCabelo: '#090806',
                    estiloCabelo: 'curto',
                    temGrisalho: false,
                    temRugas: false,
                    temOlheiras: false,
                    usaOculos: false,
                    pesoAtual: 70,
                    alturaAtual: 1.70,
                },
                atributos: dados.atributos,
                atributosGeneticos: dados.atributos,
                dinheiro: 0,
                humorAtual: 70,
                saudeAtual: 100,
                salarioMensal: 0,
                flags: [],
                eventosVividos: [],
            },
        });
        inicializarEngine(novoSave);
        setTelaAtual('jogo');
    }
    // ── Atividades ────────────────────────────────────────────────────────────
    function aoClicarAtividade(idAtividade) {
        // TODO Sprint 1.6: conectar ao ActivityEngine
        console.log('Atividade selecionada:', idAtividade);
    }
    // ── Simulação de morte (stub para teste) ──────────────────────────────────
    // TODO Sprint 1.6: remover botão de simulação
    function simularMorte() {
        const buscarValor = (nome) => atributos.find((a) => a.nome === nome)?.valor ?? 10;
        setDadosMorte({
            nomeCompleto: nomePersonagem,
            anoNascimento: anoAtual - idadeAnos,
            anoMorte: anoAtual,
            atributosFinal: {
                forca: buscarValor('Força'),
                inteligencia: buscarValor('Inteligência'),
                carisma: buscarValor('Carisma'),
                constituicao: buscarValor('Constituição'),
                sorte: buscarValor('Sorte'),
            },
            dinheirFinal: dinheiro,
            totalEventosVividos: eventosVividos.length,
            profissaoFinal: profissaoAtual !== '' ? profissaoAtual : undefined,
        });
        setTelaAtual('morte');
    }
    // ── Renderização condicional ───────────────────────────────────────────────
    if (telaAtual === 'novo_personagem') {
        return (_jsx(NewGameScreen, { aoConfirmar: (dados) => { void aoConfirmarNovoPersonagem(dados); }, aoCancelar: () => setTelaAtual('jogo') }));
    }
    if (telaAtual === 'configuracoes') {
        return (_jsxs(_Fragment, { children: [_jsxs("div", { className: "vida-app", children: [_jsx(BarraSuperior, { nomePersonagem: nomePersonagem, profissaoAtual: profissaoAtual, idadeAnos: idadeAnos, anoAtual: anoAtual, dinheiro: dinheiro, aoNovoJogo: () => setTelaAtual('novo_personagem'), aoAbrirConfig: () => setTelaAtual('configuracoes') }), _jsxs("div", { className: "vida-app__corpo", children: [_jsx(HudLateral, { nomePersonagem: nomePersonagem, profissaoAtual: profissaoAtual, idadeAnos: idadeAnos, anoAtual: anoAtual, humor: humor, saude: saude, dinheiro: dinheiro, atributos: atributos, aoClicarAtividade: aoClicarAtividade, aoNovoJogo: () => setTelaAtual('novo_personagem') }), _jsxs("div", { className: "vida-app__centro", children: [_jsx("div", { className: "vida-app__stage", children: _jsx(PixiStage, {}) }), _jsx(EventoBase, { evento: eventoAtivo, aoEscolher: resolverOpcao })] })] })] }), _jsx(SettingsScreen, { aoFechar: () => setTelaAtual('jogo') })] }));
    }
    if (telaAtual === 'morte' && dadosMorte !== undefined) {
        return (_jsx(DeathScreen, { ...dadosMorte, aoNovaVida: () => {
                setDadosMorte(undefined);
                setTelaAtual('novo_personagem');
            }, aoMenuPrincipal: () => {
                setDadosMorte(undefined);
                setTelaAtual('jogo');
            } }));
    }
    // ── Layout principal de jogo ──────────────────────────────────────────────
    return (_jsxs("div", { className: "vida-app", children: [_jsx(BarraSuperior, { nomePersonagem: nomePersonagem, profissaoAtual: profissaoAtual, idadeAnos: idadeAnos, anoAtual: anoAtual, dinheiro: dinheiro, aoNovoJogo: () => setTelaAtual('novo_personagem'), aoAbrirConfig: () => setTelaAtual('configuracoes') }), _jsxs("div", { className: "vida-app__corpo", children: [_jsx(HudLateral, { nomePersonagem: nomePersonagem, profissaoAtual: profissaoAtual, idadeAnos: idadeAnos, anoAtual: anoAtual, humor: humor, saude: saude, dinheiro: dinheiro, atributos: atributos, aoClicarAtividade: aoClicarAtividade, aoNovoJogo: () => setTelaAtual('novo_personagem') }), _jsxs("div", { className: "vida-app__centro", children: [_jsx("div", { className: "vida-app__stage", children: _jsx(PixiStage, {}) }), _jsx(EventoBase, { evento: eventoAtivo, aoEscolher: resolverOpcao })] })] }), _jsx("button", { style: {
                    position: 'fixed',
                    bottom: 12,
                    right: 12,
                    background: 'rgba(236, 104, 104, 0.12)',
                    border: '1px solid var(--vida-red)',
                    borderRadius: 8,
                    color: 'var(--vida-red)',
                    padding: '6px 12px',
                    fontSize: 11,
                    cursor: 'pointer',
                    fontFamily: 'var(--vida-font)',
                    zIndex: 50,
                }, onClick: simularMorte, "aria-label": "Simular morte (modo teste)", children: "\u2620 Simular morte" })] }));
}
//# sourceMappingURL=App.js.map