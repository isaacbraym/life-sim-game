import { Ponto } from '../rig/Skeleton';

export type PerfilBraco = {
  espessuraOmbro: number;
  espessuraBiceps: number;
  espessuraCotovelo: number;
  espessuraAntebraco: number;
  espessuraPulso: number;
};

export type PerfilPerna = {
  espessuraQuadril: number;
  espessuraCoxa: number;
  espessuraJoelho: number;
  espessuraPanturrilha: number;
  espessuraTornozelo: number;
};

export type PerfilTronco = {
  larguraOmbros: number;
  larguraCintura: number;
  larguraQuadril: number;
  profundidadeTorax: number;
};

export const PERFIL_BRACO_PADRAO: PerfilBraco = {
  espessuraOmbro: 22,
  espessuraBiceps: 20,
  espessuraCotovelo: 14,
  espessuraAntebraco: 16,
  espessuraPulso: 9,
};

export const PERFIL_PERNA_PADRAO: PerfilPerna = {
  espessuraQuadril: 22,
  espessuraCoxa: 28,
  espessuraJoelho: 18,
  espessuraPanturrilha: 22,
  espessuraTornozelo: 10,
};

export const PERFIL_TRONCO_PADRAO: PerfilTronco = {
  larguraOmbros: 50,
  larguraCintura: 32,
  larguraQuadril: 46,
  profundidadeTorax: 0.15,
};

function subtrair(a: Ponto, b: Ponto): Ponto {
  return { x: a.x - b.x, y: a.y - b.y };
}

function comprimentoVetor(v: Ponto): number {
  return Math.sqrt(v.x * v.x + v.y * v.y);
}

function normalizar(v: Ponto): Ponto {
  const c = comprimentoVetor(v);
  if (c < 0.001) return { x: 0, y: -1 };
  return { x: v.x / c, y: v.y / c };
}

function perpendicularEsquerda(v: Ponto): Ponto {
  return { x: -v.y, y: v.x };
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function pontoPerpendicular(
  origem: Ponto,
  direcao: Ponto,
  distancia: number
): { esq: Ponto; dir: Ponto } {
  const perp = perpendicularEsquerda(normalizar(direcao));
  return {
    esq: { x: origem.x + perp.x * distancia, y: origem.y + perp.y * distancia },
    dir: { x: origem.x - perp.x * distancia, y: origem.y - perp.y * distancia },
  };
}

// ─── BRACO ───────────────────────────────────────────────────────────────────

export type PathBraco = {
  // lado esquerdo (indo da raiz ao terminal)
  esq: { p0: Ponto; cp1: Ponto; cp2: Ponto; p1: Ponto; cp3: Ponto; cp4: Ponto; p2: Ponto };
  // lado direito (voltando do terminal à raiz)
  dir: { p0: Ponto; cp1: Ponto; cp2: Ponto; p1: Ponto; cp3: Ponto; cp4: Ponto; p2: Ponto };
  // caps de ponta
  capOmbro: Ponto;
  capPulso: Ponto;
};

export function gerarPathBraco(
  ombro: Ponto,
  cotovelo: Ponto,
  pulso: Ponto,
  perfil: PerfilBraco,
  espelhar = false
): PathBraco {
  const sinal = espelhar ? -1 : 1;

  const dirBraco = subtrair(cotovelo, ombro);
  const dirAntebraco = subtrair(pulso, cotovelo);

  // Pontos perpendiculares nos 3 joints
  const pOmbro    = pontoPerpendicular(ombro,    dirBraco,       perfil.espessuraOmbro    / 2 * sinal);
  const pBiceps   = pontoPerpendicular(cotovelo,  dirBraco,       perfil.espessuraBiceps   / 2 * sinal);
  const pCotovelo = pontoPerpendicular(cotovelo,  dirAntebraco,   perfil.espessuraCotovelo / 2 * sinal);
  const pAntebraco= pontoPerpendicular(cotovelo,  dirAntebraco,   perfil.espessuraAntebraco/ 2 * sinal);
  const pPulso    = pontoPerpendicular(pulso,     dirAntebraco,   perfil.espessuraPulso    / 2 * sinal);

  // Handles de controle para suavidade
  const t = 0.35;
  const midBracoX = lerp(ombro.x, cotovelo.x, t);
  const midBracoY = lerp(ombro.y, cotovelo.y, t);
  const midAntX   = lerp(cotovelo.x, pulso.x, t);
  const midAntY   = lerp(cotovelo.y, pulso.y, t);

  const cp_bE: Ponto = { x: midBracoX + (pBiceps.esq.x - cotovelo.x) * 0.5, y: midBracoY + (pBiceps.esq.y - cotovelo.y) * 0.5 };
  const cp_bD: Ponto = { x: midBracoX + (pBiceps.dir.x - cotovelo.x) * 0.5, y: midBracoY + (pBiceps.dir.y - cotovelo.y) * 0.5 };
  const cp_aE: Ponto = { x: midAntX + (pAntebraco.esq.x - cotovelo.x) * 0.5, y: midAntY + (pAntebraco.esq.y - cotovelo.y) * 0.5 };
  const cp_aD: Ponto = { x: midAntX + (pAntebraco.dir.x - cotovelo.x) * 0.5, y: midAntY + (pAntebraco.dir.y - cotovelo.y) * 0.5 };

  return {
    esq: {
      p0: pOmbro.esq,
      cp1: cp_bE, cp2: pBiceps.esq,
      p1: pCotovelo.esq,
      cp3: cp_aE, cp4: pAntebraco.esq,
      p2: pPulso.esq,
    },
    dir: {
      p0: pPulso.dir,
      cp1: cp_aD, cp2: pAntebraco.dir,
      p1: pCotovelo.dir,
      cp3: cp_bD, cp4: pBiceps.dir,
      p2: pOmbro.dir,
    },
    capOmbro: ombro,
    capPulso: pulso,
  };
}

// ─── PERNA ───────────────────────────────────────────────────────────────────

export function gerarPathPerna(
  quadril: Ponto,
  joelho: Ponto,
  tornozelo: Ponto,
  perfil: PerfilPerna,
  espelhar = false
): PathBraco {
  const sinal = espelhar ? -1 : 1;

  const dirCoxa     = subtrair(joelho,    quadril);
  const dirPanturrilha = subtrair(tornozelo, joelho);

  const pQuadril    = pontoPerpendicular(quadril,   dirCoxa,          perfil.espessuraQuadril    / 2 * sinal);
  const pCoxa       = pontoPerpendicular(joelho,    dirCoxa,          perfil.espessuraCoxa       / 2 * sinal);
  const pJoelho     = pontoPerpendicular(joelho,    dirPanturrilha,   perfil.espessuraJoelho     / 2 * sinal);
  const pPanturrilha= pontoPerpendicular(joelho,    dirPanturrilha,   perfil.espessuraPanturrilha/ 2 * sinal);
  const pTornozelo  = pontoPerpendicular(tornozelo, dirPanturrilha,   perfil.espessuraTornozelo  / 2 * sinal);

  const t = 0.4;
  const midCoxaX  = lerp(quadril.x, joelho.x, t);
  const midCoxaY  = lerp(quadril.y, joelho.y, t);
  const midPantX  = lerp(joelho.x, tornozelo.x, t);
  const midPantY  = lerp(joelho.y, tornozelo.y, t);

  const cp_cE: Ponto = { x: midCoxaX + (pCoxa.esq.x - joelho.x) * 0.5, y: midCoxaY + (pCoxa.esq.y - joelho.y) * 0.5 };
  const cp_cD: Ponto = { x: midCoxaX + (pCoxa.dir.x - joelho.x) * 0.5, y: midCoxaY + (pCoxa.dir.y - joelho.y) * 0.5 };
  const cp_pE: Ponto = { x: midPantX + (pPanturrilha.esq.x - joelho.x) * 0.5, y: midPantY + (pPanturrilha.esq.y - joelho.y) * 0.5 };
  const cp_pD: Ponto = { x: midPantX + (pPanturrilha.dir.x - joelho.x) * 0.5, y: midPantY + (pPanturrilha.dir.y - joelho.y) * 0.5 };

  return {
    esq: {
      p0: pQuadril.esq,
      cp1: cp_cE, cp2: pCoxa.esq,
      p1: pJoelho.esq,
      cp3: cp_pE, cp4: pPanturrilha.esq,
      p2: pTornozelo.esq,
    },
    dir: {
      p0: pTornozelo.dir,
      cp1: cp_pD, cp2: pPanturrilha.dir,
      p1: pJoelho.dir,
      cp3: cp_cD, cp4: pCoxa.dir,
      p2: pQuadril.dir,
    },
    capOmbro: quadril,
    capPulso: tornozelo,
  };
}