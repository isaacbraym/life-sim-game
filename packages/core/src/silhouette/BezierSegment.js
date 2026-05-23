export const PERFIL_BRACO_PADRAO = {
    espessuraOmbro: 14,
    espessuraBiceps: 18,
    espessuraCotovelo: 13,
    espessuraAntebraco: 16,
    espessuraPulso: 7,
};
export const PERFIL_PERNA_PADRAO = {
    espessuraQuadril: 26,
    espessuraCoxa: 28,
    espessuraJoelho: 16,
    espessuraPanturrilha: 20,
    espessuraTornozelo: 10,
};
export const PERFIL_TRONCO_PADRAO = {
    larguraOmbros: 50,
    larguraCintura: 32,
    larguraQuadril: 46,
    profundidadeTorax: 0.15,
};
function subtrair(a, b) {
    return { x: a.x - b.x, y: a.y - b.y };
}
function comprimentoVetor(v) {
    return Math.sqrt(v.x * v.x + v.y * v.y);
}
function normalizar(v) {
    const c = comprimentoVetor(v);
    if (c < 0.001)
        return { x: 0, y: -1 };
    return { x: v.x / c, y: v.y / c };
}
function perpendicularEsquerda(v) {
    return { x: -v.y, y: v.x };
}
function lerp(a, b, t) {
    return a + (b - a) * t;
}
function pontoPerpendicular(origem, direcao, distancia) {
    const perp = perpendicularEsquerda(normalizar(direcao));
    return {
        esq: { x: origem.x + perp.x * distancia, y: origem.y + perp.y * distancia },
        dir: { x: origem.x - perp.x * distancia, y: origem.y - perp.y * distancia },
    };
}
const calcularCPCubicoAlongado = (pInicio, pFim, pMeio, dirNorm, stretch) => {
    const cX = (4 / 3) * pMeio.x - (1 / 6) * pInicio.x - (1 / 6) * pFim.x;
    const cY = (4 / 3) * pMeio.y - (1 / 6) * pInicio.y - (1 / 6) * pFim.y;
    return {
        cp1: { x: cX - dirNorm.x * stretch, y: cY - dirNorm.y * stretch },
        cp2: { x: cX + dirNorm.x * stretch, y: cY + dirNorm.y * stretch },
    };
};
export function gerarPathBraco(ombro, cotovelo, pulso, perfil, espelhar = false) {
    const sinal = espelhar ? -1 : 1;
    const dirBraco = subtrair(cotovelo, ombro);
    const dirAntebraco = subtrair(pulso, cotovelo);
    const meioBraco = { x: lerp(ombro.x, cotovelo.x, 0.45), y: lerp(ombro.y, cotovelo.y, 0.45) };
    const meioAntebraco = { x: lerp(cotovelo.x, pulso.x, 0.35), y: lerp(cotovelo.y, pulso.y, 0.35) };
    const pOmbro = pontoPerpendicular(ombro, dirBraco, perfil.espessuraOmbro / 2 * sinal);
    const pBiceps = pontoPerpendicular(meioBraco, dirBraco, perfil.espessuraBiceps / 2 * sinal);
    const dirCotovelo = normalizar({ x: dirBraco.x + dirAntebraco.x, y: dirBraco.y + dirAntebraco.y });
    const pCotovelo = pontoPerpendicular(cotovelo, dirCotovelo, perfil.espessuraCotovelo / 2 * sinal);
    const pAntebraco = pontoPerpendicular(meioAntebraco, dirAntebraco, perfil.espessuraAntebraco / 2 * sinal);
    const pPulso = pontoPerpendicular(pulso, dirAntebraco, perfil.espessuraPulso / 2 * sinal);
    const dirBNorm = normalizar(dirBraco);
    const dirANorm = normalizar(dirAntebraco);
    const stretchB = comprimentoVetor(dirBraco) * 0.2;
    const stretchA = comprimentoVetor(dirAntebraco) * 0.2;
    const cps_bE = calcularCPCubicoAlongado(pOmbro.esq, pCotovelo.esq, pBiceps.esq, dirBNorm, stretchB);
    const cps_bD = calcularCPCubicoAlongado(pOmbro.dir, pCotovelo.dir, pBiceps.dir, dirBNorm, stretchB);
    const cps_aE = calcularCPCubicoAlongado(pCotovelo.esq, pPulso.esq, pAntebraco.esq, dirANorm, stretchA);
    const cps_aD = calcularCPCubicoAlongado(pCotovelo.dir, pPulso.dir, pAntebraco.dir, dirANorm, stretchA);
    return {
        esq: {
            p0: pOmbro.esq,
            cp1: cps_bE.cp1, cp2: cps_bE.cp2,
            p1: pCotovelo.esq,
            cp3: cps_aE.cp1, cp4: cps_aE.cp2,
            p2: pPulso.esq,
        },
        dir: {
            p0: pPulso.dir,
            cp1: cps_aD.cp2, cp2: cps_aD.cp1,
            p1: pCotovelo.dir,
            cp3: cps_bD.cp2, cp4: cps_bD.cp1,
            p2: pOmbro.dir,
        },
        capOmbro: ombro,
        capPulso: pulso,
    };
}
// ─── PERNA ───────────────────────────────────────────────────────────────────
export function gerarPathPerna(quadril, joelho, tornozelo, perfil, espelhar = false) {
    const sinal = espelhar ? -1 : 1;
    const dirCoxa = subtrair(joelho, quadril);
    const dirPanturrilha = subtrair(tornozelo, joelho);
    const meioCoxa = { x: lerp(quadril.x, joelho.x, 0.45), y: lerp(quadril.y, joelho.y, 0.45) };
    const meioPant = { x: lerp(joelho.x, tornozelo.x, 0.25), y: lerp(joelho.y, tornozelo.y, 0.25) };
    const pQuadril = pontoPerpendicular(quadril, dirCoxa, perfil.espessuraQuadril / 2 * sinal);
    const pCoxa = pontoPerpendicular(meioCoxa, dirCoxa, perfil.espessuraCoxa / 2 * sinal);
    const dirJoelho = normalizar({ x: dirCoxa.x + dirPanturrilha.x, y: dirCoxa.y + dirPanturrilha.y });
    const pJoelho = pontoPerpendicular(joelho, dirJoelho, perfil.espessuraJoelho / 2 * sinal);
    const pPanturrilha = pontoPerpendicular(meioPant, dirPanturrilha, perfil.espessuraPanturrilha / 2 * sinal);
    const pTornozelo = pontoPerpendicular(tornozelo, dirPanturrilha, perfil.espessuraTornozelo / 2 * sinal);
    const dirCNorm = normalizar(dirCoxa);
    const dirPNorm = normalizar(dirPanturrilha);
    const stretchC = comprimentoVetor(dirCoxa) * 0.2;
    const stretchP = comprimentoVetor(dirPanturrilha) * 0.2;
    const cps_cE = calcularCPCubicoAlongado(pQuadril.esq, pJoelho.esq, pCoxa.esq, dirCNorm, stretchC);
    const cps_cD = calcularCPCubicoAlongado(pQuadril.dir, pJoelho.dir, pCoxa.dir, dirCNorm, stretchC);
    const cps_pE = calcularCPCubicoAlongado(pJoelho.esq, pTornozelo.esq, pPanturrilha.esq, dirPNorm, stretchP);
    const cps_pD = calcularCPCubicoAlongado(pJoelho.dir, pTornozelo.dir, pPanturrilha.dir, dirPNorm, stretchP);
    return {
        esq: {
            p0: pQuadril.esq,
            cp1: cps_cE.cp1, cp2: cps_cE.cp2,
            p1: pJoelho.esq,
            cp3: cps_pE.cp1, cp4: cps_pE.cp2,
            p2: pTornozelo.esq,
        },
        dir: {
            p0: pTornozelo.dir,
            cp1: cps_pD.cp2, cp2: cps_pD.cp1,
            p1: pJoelho.dir,
            cp3: cps_cD.cp2, cp4: cps_cD.cp1,
            p2: pQuadril.dir,
        },
        capOmbro: quadril,
        capPulso: tornozelo,
    };
}
//# sourceMappingURL=BezierSegment.js.map