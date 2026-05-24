import type { Ponto } from '../rig/Joint';
export type { Ponto };
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
export type PerfilMembro = {
    readonly espessuraInicio: number;
    readonly espessuraMeio: number;
    readonly espessuraFim: number;
    readonly curvatura: number;
};
export type SegmentoPath = {
    readonly pontos: readonly Ponto[];
    readonly handles: readonly Ponto[];
};
export declare const PERFIL_BRACO_PADRAO: PerfilBraco;
export declare const PERFIL_PERNA_PADRAO: PerfilPerna;
export declare const PERFIL_TRONCO_PADRAO: PerfilTronco;
export declare function normalPerpendicular(a: Ponto, b: Ponto): Ponto;
export declare function lerpPonto(a: Ponto, b: Ponto, t: number): Ponto;
export declare function gerarPathMembroOrganico(inicio: Ponto, meio: Ponto, fim: Ponto, perfil: PerfilMembro, lado: 'L' | 'R'): SegmentoPath;
export declare function gerarPathTronco(pescoco: Ponto, ombroL: Ponto, ombroR: Ponto, quadrilL: Ponto, quadrilR: Ponto, perfil: {
    readonly larguraTopo: number;
    readonly larguraBase: number;
    readonly curvatura: number;
}): SegmentoPath;
export declare function gerarPathCabeca(centro: Ponto, raioH: number, raioV: number): SegmentoPath;
export type PathBraco = {
    esq: {
        p0: Ponto;
        cp1: Ponto;
        cp2: Ponto;
        p1: Ponto;
        cp3: Ponto;
        cp4: Ponto;
        p2: Ponto;
    };
    dir: {
        p0: Ponto;
        cp1: Ponto;
        cp2: Ponto;
        p1: Ponto;
        cp3: Ponto;
        cp4: Ponto;
        p2: Ponto;
    };
    capOmbro: Ponto;
    capPulso: Ponto;
};
export declare function gerarPathBraco(ombro: Ponto, cotovelo: Ponto, pulso: Ponto, perfil: PerfilBraco, espelhar?: boolean): PathBraco;
export declare function gerarPathPerna(quadril: Ponto, joelho: Ponto, tornozelo: Ponto, perfil: PerfilPerna, espelhar?: boolean): PathBraco;
//# sourceMappingURL=BezierSegment.d.ts.map