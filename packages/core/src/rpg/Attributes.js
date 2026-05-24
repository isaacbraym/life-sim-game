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
//# sourceMappingURL=Attributes.js.map