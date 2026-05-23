import type { Event } from '../schemas/event';

// TODO: implementar loader que lê content/events/**/*.json e gera índices
export class EventLoader {
  carregarTodos(_diretorio: string): Promise<Event[]> {
    throw new Error('not implemented');
  }
}
