import type { Npc } from '../schemas/npc';
import type { SelectorNpc } from '../schemas/event';
import type { Atributos } from '../schemas/character';
export declare function gerarNpcNovo(seletor: SelectorNpc, semente: number): Npc;
export declare function gerarRosterInicial(anoNascimentoProtagonista: number, sementeBase: number): Npc[];
export declare function gerarAtributosNpcComHeranca(atributosPai: Atributos | undefined, atributosMae: Atributos | undefined, semente: number): Atributos;
//# sourceMappingURL=NpcGenerator.d.ts.map