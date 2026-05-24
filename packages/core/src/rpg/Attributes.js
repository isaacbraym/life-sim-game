export const ATRIBUTO_MINIMO = 1;
export const ATRIBUTO_MAXIMO = 20;
export function gerarAtributosIniciais() {
    return {
        forca: rolarQuatroDadosSeisSemMenor(),
        inteligencia: rolarQuatroDadosSeisSemMenor(),
        carisma: rolarQuatroDadosSeisSemMenor(),
        constituicao: rolarQuatroDadosSeisSemMenor(),
        sorte: rolarQuatroDadosSeisSemMenor(),
    };
}
function rolarQuatroDadosSeisSemMenor() {
    const rolagens = [rolarD6(), rolarD6(), rolarD6(), rolarD6()];
    const menorValor = Math.min(...rolagens);
    const somaSemMenor = rolagens.reduce((soma, dado) => soma + dado, 0) - menorValor;
    return clampAtributo(somaSemMenor);
}
function rolarD6() {
    return Math.floor(Math.random() * 6) + 1;
}
export function clampAtributo(valor) {
    return Math.min(ATRIBUTO_MAXIMO, Math.max(ATRIBUTO_MINIMO, valor));
}
export function calcularModificador(valorAtributo) {
    return Math.floor((valorAtributo - 10) / 2);
}
export function modificadorDe(atributos, atributo) {
    return calcularModificador(atributos[atributo]);
}
// Teste de sanidade para gerarAtributosGeneticos:
// pai: {forca:16, inteligencia:14, carisma:10, constituicao:12, sorte:8}
// mae: {forca:10, inteligencia:18, carisma:14, constituicao:10, sorte:12}
// resultado esperado: cada atributo entre ~9 e ~17 (média ± variância)
export function gerarAtributosGeneticos(atributosPai, atributosMae, semente) {
    const pseudoAleatorio = (s) => {
        let temp = s;
        temp += 0x6D2B79F5;
        let z = temp;
        z = Math.imul(z ^ (z >>> 15), z | 1);
        z ^= z + Math.imul(z ^ (z >>> 7), z | 61);
        return ((z ^ (z >>> 14)) >>> 0) / 4294967296;
    };
    const calcularAtributo = (pai, mae, offset) => {
        const mediaGenetica = (pai + mae) / 2;
        const variancia = pseudoAleatorio(semente + offset) * 6 - 3; // resultado entre -3 e +3
        let valorFinal = clampAtributo(Math.round(mediaGenetica + variancia));
        // Chance de talento especial (5%)
        if (pseudoAleatorio(semente + offset + 500) < 0.05) {
            valorFinal = clampAtributo(valorFinal + 3);
        }
        return valorFinal;
    };
    return {
        forca: calcularAtributo(atributosPai.forca, atributosMae.forca, 0),
        inteligencia: calcularAtributo(atributosPai.inteligencia, atributosMae.inteligencia, 100),
        carisma: calcularAtributo(atributosPai.carisma, atributosMae.carisma, 200),
        constituicao: calcularAtributo(atributosPai.constituicao, atributosMae.constituicao, 300),
        sorte: calcularAtributo(atributosPai.sorte, atributosMae.sorte, 400),
    };
}
//# sourceMappingURL=Attributes.js.map