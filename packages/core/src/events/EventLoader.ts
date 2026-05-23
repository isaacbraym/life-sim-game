declare global {
  interface ImportMeta {
    glob(padrao: string, opcoes: { readonly eager: true }): Record<string, unknown>;
  }
}

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
  readonly opcoes?: readonly { readonly texto: string }[];
};

type ModuloEvento = {
  readonly default: unknown;
};

const modulosDeEventos = import.meta.glob('/content/events/**/*.json', { eager: true });

function ehObjeto(valor: unknown): valor is Readonly<Record<string, unknown>> {
  return typeof valor === 'object' && Boolean(valor);
}

function extrairExportDefault(modulo: unknown): unknown {
  if (!ehObjeto(modulo) || !('default' in modulo)) {
    return undefined;
  }

  return (modulo as ModuloEvento).default;
}

function ehEvento(valor: unknown): valor is Evento {
  return ehObjeto(valor) && typeof valor.id === 'string';
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
