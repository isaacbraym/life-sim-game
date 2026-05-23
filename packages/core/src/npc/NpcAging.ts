import type { Npc } from '../schemas/npc';

// ---------------------------------------------------------------------------
// Tipos exportados
// ---------------------------------------------------------------------------

export type ResultadoEnvelhecimento = {
  readonly npc: Npc;
  /** true se algum traço variável mudou nesta chamada */
  readonly houveMudancaVisual: boolean;
};

// ---------------------------------------------------------------------------
// Constantes de faixas etárias (conforme 04-mecanicas-jogo.md)
// ---------------------------------------------------------------------------

const IDADE_GRISALHO_MIN         = 50;
const IDADE_RUGAS_EXPRESSAO_MIN  = 40;
const IDADE_RUGAS_MARCANTES_MIN  = 60;
const IDADE_OLHEIRAS_MIN         = 60;
const IDADE_OCULOS_MIN           = 50;
const IDADE_DECAIMENTO_FORCA_MIN = 60;

/** Probabilidade de ter grisalho ao atingir a faixa etária (dependência genética simulada via seed do npcId) */
const PROB_GRISALHO = 0.65;
const PROB_OCULOS   = 0.45;

// ---------------------------------------------------------------------------
// Helpers internos
// ---------------------------------------------------------------------------

/**
 * Deriva um número pseudo-aleatório estável em [0, 1) a partir do npcId + semente.
 * Usado para simular predisposição genética sem depender de Math.random em runtime,
 * garantindo que a aparência seja determinística entre sessões (conforme arquitetura).
 */
function derivarFatorGenetico(npcId: string, semente: string): number {
  let hash = 2166136261;
  const entrada = npcId + semente;
  for (let i = 0; i < entrada.length; i++) {
    hash ^= entrada.charCodeAt(i);
    // Multiplicação com overflow intencional (FNV-1a 32 bits)
    hash = (hash * 16777619) >>> 0;
  }
  return (hash >>> 0) / 4294967296;
}

function calcularIdade(npc: Npc, anoAtual: number): number {
  return anoAtual - npc.dataNascimento.ano;
}

// ---------------------------------------------------------------------------
// Lógica de envelhecimento por traço
// ---------------------------------------------------------------------------

function deveAtivarGrisalho(npc: Npc, idadeAtual: number): boolean {
  if (idadeAtual < IDADE_GRISALHO_MIN) return false;
  if (npc.tracosVariaveis.temGrisalho) return true; // já tem, mantém
  return derivarFatorGenetico(npc.npcId, 'grisalho') < PROB_GRISALHO;
}

function deveAtivarOculos(npc: Npc, idadeAtual: number): boolean {
  if (idadeAtual < IDADE_OCULOS_MIN) return false;
  if (npc.tracosVariaveis.usaOculos) return true;
  return derivarFatorGenetico(npc.npcId, 'oculos') < PROB_OCULOS;
}

function deveAtivarRugas(idadeAtual: number): boolean {
  return idadeAtual >= IDADE_RUGAS_MARCANTES_MIN;
}

function deveAtivarOlheiras(idadeAtual: number): boolean {
  return idadeAtual >= IDADE_OLHEIRAS_MIN;
}

/**
 * Calcula decaimento de peso por faixa etária.
 * A partir dos 60, metabolismo mais lento tende a aumentar o peso base levemente.
 * Acima dos 75, pode haver perda por sarcopenia.
 * Retorna o peso ajustado sem ultrapassar limites plausíveis.
 */
function calcularPesoEnvelhecido(pesoAtual: number, idadeAtual: number): number {
  if (idadeAtual >= 75) {
    const reducao = Math.floor((idadeAtual - 74) * 0.3);
    return Math.max(pesoAtual - reducao, pesoAtual * 0.85);
  }
  return pesoAtual;
}

// ---------------------------------------------------------------------------
// API pública
// ---------------------------------------------------------------------------

/**
 * Aplica envelhecimento a um único NPC para o ano informado.
 * NPCs mortos não são alterados.
 * Traços fixos (tracosFisicos) NUNCA são modificados — só tracosVariaveis.
 *
 * @param npc      NPC a envelhecer
 * @param anoAtual Ano corrente no calendário do jogo
 */
export function envelhecerNpc(npc: Npc, anoAtual: number): ResultadoEnvelhecimento {
  if (!npc.vivo) return { npc, houveMudancaVisual: false };

  const idadeAtual     = calcularIdade(npc, anoAtual);
  const variaveis      = npc.tracosVariaveis;

  const novoGrisalho   = deveAtivarGrisalho(npc, idadeAtual);
  const novoRugas      = variaveis.temRugas  || deveAtivarRugas(idadeAtual);
  const novoOlheiras   = variaveis.temOlheiras || deveAtivarOlheiras(idadeAtual);
  const novoOculos     = deveAtivarOculos(npc, idadeAtual);
  const novoPeso       = calcularPesoEnvelhecido(variaveis.pesoAtual, idadeAtual);

  // Rugas de expressão surgem antes das marcantes — altera estilo de cabelo para
  // refletir fios brancos nas têmporas quando entre 40 e 49 anos
  const npcComRugas40  = idadeAtual >= IDADE_RUGAS_EXPRESSAO_MIN && idadeAtual < IDADE_RUGAS_MARCANTES_MIN;

  const novasVariaveis: Npc['tracosVariaveis'] = {
    ...variaveis,
    temGrisalho:  novoGrisalho,
    temRugas:     novoRugas || npcComRugas40,
    temOlheiras:  novoOlheiras,
    usaOculos:    novoOculos,
    pesoAtual:    novoPeso,
  };

  const houveMudancaVisual =
    novasVariaveis.temGrisalho  !== variaveis.temGrisalho  ||
    novasVariaveis.temRugas     !== variaveis.temRugas     ||
    novasVariaveis.temOlheiras  !== variaveis.temOlheiras  ||
    novasVariaveis.usaOculos    !== variaveis.usaOculos    ||
    novasVariaveis.pesoAtual    !== variaveis.pesoAtual;

  if (!houveMudancaVisual) return { npc, houveMudancaVisual: false };

  return {
    npc: { ...npc, tracosVariaveis: novasVariaveis },
    houveMudancaVisual: true,
  };
}

/**
 * Aplica envelhecimento a todo o roster de uma vez.
 * Retorna novo array — nunca muta o roster original.
 * NPCs descartáveis são incluídos normalmente (a coleta de lixo é responsabilidade do NpcRoster).
 *
 * @param roster   Roster completo do save
 * @param anoAtual Ano corrente no calendário do jogo
 */
export function envelhecerRoster(
  roster: readonly Npc[],
  anoAtual: number,
): Npc[] {
  return roster.map(npc => envelhecerNpc(npc, anoAtual).npc);
}

/**
 * Versão com relatório: retorna quais NPCs tiveram mudança visual.
 * Útil para disparar animações de transição ou log de debug.
 *
 * @param roster   Roster completo do save
 * @param anoAtual Ano corrente no calendário do jogo
 */
export function envelhecerRosterComRelatorio(
  roster: readonly Npc[],
  anoAtual: number,
): {
  readonly rosterAtualizado: Npc[];
  readonly npcsMudados: readonly string[];
} {
  const rosterAtualizado: Npc[] = [];
  const npcsMudados: string[]   = [];

  for (const npc of roster) {
    const resultado = envelhecerNpc(npc, anoAtual);
    rosterAtualizado.push(resultado.npc);
    if (resultado.houveMudancaVisual) npcsMudados.push(npc.npcId);
  }

  return { rosterAtualizado, npcsMudados };
}
