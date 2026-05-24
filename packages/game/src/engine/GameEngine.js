import { filtrarEventosElegiveis, sortearEvento, EventLoader, RosterDeNpcs, db } from '@lifesim/core';
// envelhecerRoster não está no barrel de @lifesim/core (NpcAging.ts não foi adicionado ao npc/index.ts)
import { envelhecerRoster } from '@core/npc/NpcAging';
import { salvarParaEstadoDeJogo } from '@core/events/EstadoDeJogo';
// ---------------------------------------------------------------------------
// Constantes
// ---------------------------------------------------------------------------
const MESES_POR_RITMO = {
    mensal: 1,
    semestral: 6,
    anual: 12,
};
// ---------------------------------------------------------------------------
// GameEngine
// ---------------------------------------------------------------------------
export class GameEngine {
    saveAtivo;
    rosterDeNpcs;
    eventLoader;
    constructor(saveAtivo) {
        this.saveAtivo = saveAtivo;
        this.eventLoader = new EventLoader();
        this.rosterDeNpcs = new RosterDeNpcs();
        for (const npc of saveAtivo.roster) {
            this.rosterDeNpcs.adicionar(npc);
        }
    }
    async avancarTurno() {
        // 1. Avançar meses conforme ritmo
        const incremento = MESES_POR_RITMO[this.saveAtivo.configuracoes.ritmo] ?? 1;
        let mesAtual = this.saveAtivo.estadoMundo.mesAtual + incremento;
        let anoAtual = this.saveAtivo.estadoMundo.anoAtual;
        let rosterAtual = this.saveAtivo.roster;
        // 2. Virar ano e envelhecer roster quando mês ultrapassa 12
        while (mesAtual > 12) {
            mesAtual -= 12;
            anoAtual += 1;
            rosterAtual = envelhecerRoster(rosterAtual, anoAtual);
        }
        this.saveAtivo = {
            ...this.saveAtivo,
            roster: rosterAtual,
            estadoMundo: { ...this.saveAtivo.estadoMundo, mesAtual, anoAtual },
        };
        // Sincronizar RosterDeNpcs com o novo estado
        this.rosterDeNpcs = new RosterDeNpcs();
        for (const npc of rosterAtual) {
            this.rosterDeNpcs.adicionar(npc);
        }
        // 3. Carregar eventos disponíveis
        const todosEventos = await this.eventLoader.carregarTodos();
        // 4. Converter SaveSlot para o estado canônico do motor de eventos
        const estadoParaFiltro = salvarParaEstadoDeJogo(this.saveAtivo, anoAtual);
        // 5. Filtrar eventos elegíveis
        const elegiveis = filtrarEventosElegiveis(todosEventos, estadoParaFiltro);
        // 6. Sortear evento
        const sorteado = sortearEvento(elegiveis);
        // 7. Persistir estado avançado
        await this.salvar();
        if (sorteado === undefined)
            return undefined;
        // 8. Buscar dados de exibição do evento sorteado
        const eventoCompleto = todosEventos.find(e => e.id === sorteado.id);
        if (eventoCompleto === undefined)
            return undefined;
        const opcoesComEfeitos = (eventoCompleto.opcoes ?? []).map(opcao => ({
            texto: opcao.texto,
            efeitos: opcao.efeitos ?? [],
            atributoCheck: opcao.atributoCheck,
        }));
        return {
            eventoId: eventoCompleto.id,
            titulo: eventoCompleto.titulo ?? eventoCompleto.id,
            descricao: eventoCompleto.descricao ?? '',
            icone: eventoCompleto.icone ?? '❓',
            opcoes: opcoesComEfeitos,
        };
    }
    obterEstadoAtual() {
        return this.saveAtivo;
    }
    registrarCooldown(eventoId, anoExpiracao) {
        this.saveAtivo = {
            ...this.saveAtivo,
            cooldownRegistry: {
                ...this.saveAtivo.cooldownRegistry,
                [eventoId]: anoExpiracao,
            },
        };
    }
    aplicarResultadoEfeitos(protagonistaAtualizado, rosterAtualizado) {
        this.saveAtivo = {
            ...this.saveAtivo,
            protagonista: protagonistaAtualizado,
            roster: [...rosterAtualizado],
            ultimaPartida: new Date().toISOString(),
        };
    }
    async salvarEstadoAtual() {
        await this.salvar();
    }
    async salvar() {
        await db.saves.put(this.saveAtivo);
    }
}
//# sourceMappingURL=GameEngine.js.map