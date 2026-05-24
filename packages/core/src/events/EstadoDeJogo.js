export function salvarParaEstadoDeJogo(save, anoAtual) {
    return {
        anoNascimento: save.protagonista.dataNascimento.ano,
        anoAtual,
        humor: save.protagonista.humorAtual,
        saude: save.protagonista.saudeAtual,
        dinheiro: save.protagonista.dinheiro,
        atributos: save.protagonista.atributos,
        flags: save.protagonista.flags,
        cooldownRegistry: save.cooldownRegistry,
    };
}
//# sourceMappingURL=EstadoDeJogo.js.map