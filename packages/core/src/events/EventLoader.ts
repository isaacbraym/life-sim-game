declare global {
  interface ImportMeta {
    glob(padrao: string, opcoes: { readonly eager: true }): Record<string, unknown>;
  }
}

type EfeitoOpcao = {
  readonly tipo: string;
  readonly [chave: string]: unknown;
};

type OpcaoEvento = {
  readonly texto: string;
  readonly efeitos?: readonly EfeitoOpcao[];
  readonly atributoCheck?: {
    readonly atributo: string;
    readonly dificuldade: number;
  };
};

type Evento = {
  readonly id: string;
  readonly faseDaVida?: string;
  readonly condicao?: unknown;
  readonly triggers?: {
    readonly uniqueOnce?: boolean;
    readonly cooldownMeses?: number;
    readonly peso?: number;
  };
  readonly titulo?: string;
  readonly descricao?: string;
  readonly icone?: string;
  readonly opcoes?: readonly OpcaoEvento[];
};

type ModuloEvento = {
  readonly default: unknown;
};

const modulosDeEventos = import.meta.glob('/content/events/**/*.json', { eager: true });

function ehObjeto(valor: unknown): valor is Readonly<Record<string, unknown>> {
  return typeof valor === 'object' && Boolean(valor);
}

function normalizarId(valor: unknown): string | undefined {
  if (!ehObjeto(valor)) return undefined;

  const id = 'id' in valor ? valor.id : 'eventoId' in valor ? valor.eventoId : undefined;
  return typeof id === 'string' ? id : undefined;
}

function extrairExportDefault(modulo: unknown): unknown {
  if (!ehObjeto(modulo) || !('default' in modulo)) {
    return undefined;
  }

  const exportDefault = (modulo as ModuloEvento).default;
  const id = normalizarId(exportDefault);

  if (!ehObjeto(exportDefault) || id === undefined) {
    return exportDefault;
  }

  return {
    ...exportDefault,
    id,
  };
}

function ehEvento(valor: unknown): valor is Evento {
  return normalizarId(valor) !== undefined;
}

export async function carregarTodosEventos(): Promise<readonly Evento[]> {
  const eventos: Evento[] = [];
  let descartados = 0;

  for (const modulo of Object.values(modulosDeEventos)) {
    const candidato = extrairExportDefault(modulo);

    if (ehEvento(candidato)) {
      eventos.push(candidato);
    } else {
      descartados += 1;
    }
  }

  if (descartados > 0) {
    console.warn(`EventLoader descartou ${descartados} evento(s) sem id string.`);
  }

  return eventos;
}

export class EventLoader {
  carregarTodos(): Promise<readonly Evento[]> {
    return carregarTodosEventos();
  }
}
