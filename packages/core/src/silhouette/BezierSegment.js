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
function clamp(valor, minimo, maximo) {
    return Math.min(Math.max(valor, minimo), maximo);
}
function somar(a, b) {
    return { x: a.x + b.x, y: a.y + b.y };
}
function multiplicar(v, escala) {
    return { x: v.x * escala, y: v.y * escala };
}
function distanciaEntre(a, b) {
    return comprimentoVetor(subtrair(b, a));
}
export function normalPerpendicular(a, b) {
    return normalizar(perpendicularEsquerda(subtrair(b, a)));
}
export function lerpPonto(a, b, t) {
    return { x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t) };
}
function normalMedia(a, b) {
    const media = normalizar(somar(a, b));
    if (comprimentoVetor(media) < 0.001) {
        return a;
    }
    return media;
}
function criarHandlesFechados(pontos, curvatura) {
    if (pontos.length < 2) {
        return [];
    }
    const intensidade = clamp(0.1 + curvatura * 0.16, 0.08, 0.28);
    const handles = [];
    for (let indice = 0; indice < pontos.length; indice += 1) {
        const atual = pontos[indice];
        const anterior = pontos[(indice - 1 + pontos.length) % pontos.length];
        const proximo = pontos[(indice + 1) % pontos.length];
        const destino = pontos[(indice + 1) % pontos.length];
        const destinoProximo = pontos[(indice + 2) % pontos.length];
        if (atual === undefined ||
            anterior === undefined ||
            proximo === undefined ||
            destino === undefined ||
            destinoProximo === undefined) {
            continue;
        }
        const tangenteAtual = subtrair(proximo, anterior);
        const tangenteDestino = subtrair(destinoProximo, atual);
        handles.push(somar(atual, multiplicar(tangenteAtual, intensidade)));
        handles.push(subtrair(destino, multiplicar(tangenteDestino, intensidade)));
    }
    return handles;
}
export function gerarPathMembroOrganico(inicio, meio, fim, perfil, lado) {
    const sinal = lado === 'L' ? 1 : -1;
    const curvatura = clamp(perfil.curvatura, 0, 1);
    const n1 = multiplicar(normalPerpendicular(inicio, meio), sinal);
    const n2 = multiplicar(normalPerpendicular(meio, fim), sinal);
    const nMeioBase = normalMedia(n1, n2);
    const nMeio = normalizar(lerpPonto(nMeioBase, normalMedia(n1, n2), curvatura));
    const pontoInicioA = somar(inicio, multiplicar(n1, perfil.espessuraInicio));
    const pontoMeioA = somar(meio, multiplicar(nMeio, perfil.espessuraMeio));
    const pontoFimA = somar(fim, multiplicar(n2, perfil.espessuraFim));
    const pontoFimB = subtrair(fim, multiplicar(n2, perfil.espessuraFim));
    const pontoMeioB = subtrair(meio, multiplicar(nMeio, perfil.espessuraMeio));
    const pontoInicioB = subtrair(inicio, multiplicar(n1, perfil.espessuraInicio));
    const pontos = [
        pontoInicioA,
        pontoMeioA,
        pontoFimA,
        pontoFimB,
        pontoMeioB,
        pontoInicioB,
    ];
    return {
        pontos,
        handles: criarHandlesFechados(pontos, curvatura),
    };
}
export function gerarPathTronco(pescoco, ombroL, ombroR, quadrilL, quadrilR, perfil) {
    const curvatura = clamp(perfil.curvatura, 0, 1);
    const centroOmbros = lerpPonto(ombroL, ombroR, 0.5);
    const centroQuadril = lerpPonto(quadrilL, quadrilR, 0.5);
    const eixoHorizontalBase = normalizar(subtrair(ombroR, ombroL));
    const eixoHorizontal = comprimentoVetor(eixoHorizontalBase) < 0.001
        ? { x: 1, y: 0 }
        : eixoHorizontalBase;
    const centroCintura = lerpPonto(pescoco, centroQuadril, 0.62);
    const meiaLarguraOmbros = Math.max(perfil.larguraTopo / 2, distanciaEntre(ombroL, ombroR) / 2);
    const meiaLarguraQuadril = Math.max(perfil.larguraBase / 2, distanciaEntre(quadrilL, quadrilR) / 2);
    const meiaLarguraCintura = lerp(meiaLarguraOmbros, meiaLarguraQuadril, 0.45) * (0.82 - curvatura * 0.08);
    const ombroEsquerdo = subtrair(centroOmbros, multiplicar(eixoHorizontal, meiaLarguraOmbros));
    const ombroDireito = somar(centroOmbros, multiplicar(eixoHorizontal, meiaLarguraOmbros));
    const cinturaEsquerda = subtrair(centroCintura, multiplicar(eixoHorizontal, meiaLarguraCintura));
    const cinturaDireita = somar(centroCintura, multiplicar(eixoHorizontal, meiaLarguraCintura));
    const quadrilEsquerdo = subtrair(centroQuadril, multiplicar(eixoHorizontal, meiaLarguraQuadril));
    const quadrilDireito = somar(centroQuadril, multiplicar(eixoHorizontal, meiaLarguraQuadril));
    const pontos = [
        ombroEsquerdo,
        cinturaEsquerda,
        quadrilEsquerdo,
        quadrilDireito,
        cinturaDireita,
        ombroDireito,
    ];
    return {
        pontos,
        handles: criarHandlesFechados(pontos, curvatura),
    };
}
export function gerarPathCabeca(centro, raioH, raioV) {
    const kappa = 0.552284749831;
    const pontoTopo = { x: centro.x, y: centro.y - raioV };
    const pontoDireito = { x: centro.x + raioH, y: centro.y };
    const pontoBase = { x: centro.x, y: centro.y + raioV };
    const pontoEsquerdo = { x: centro.x - raioH, y: centro.y };
    const ajusteH = raioH * kappa;
    const ajusteV = raioV * kappa;
    return {
        pontos: [pontoTopo, pontoDireito, pontoBase, pontoEsquerdo],
        handles: [
            { x: centro.x + ajusteH, y: centro.y - raioV },
            { x: centro.x + raioH, y: centro.y - ajusteV },
            { x: centro.x + raioH, y: centro.y + ajusteV },
            { x: centro.x + ajusteH, y: centro.y + raioV },
            { x: centro.x - ajusteH, y: centro.y + raioV },
            { x: centro.x - raioH, y: centro.y + ajusteV },
            { x: centro.x - raioH, y: centro.y - ajusteV },
            { x: centro.x - ajusteH, y: centro.y - raioV },
        ],
    };
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