import { z } from 'zod';
import { FurnitureDefinition, ComodoDefinition, Event } from '@lifesim/core';

export type ErroSchemaComIndice = {
  readonly indice: number;
  readonly erro: z.ZodError;
};

async function lerArquivoJson(arquivo: File): Promise<unknown> {
  const texto = await arquivo.text();
  return JSON.parse(texto) as unknown;
}

export async function carregarFurnitureCatalog(
  arquivo: File
): Promise<{ validos: FurnitureDefinition[]; erros: ErroSchemaComIndice[] }> {
  const dados = await lerArquivoJson(arquivo);
  const lista: unknown[] = Array.isArray(dados) ? dados : [dados];

  const validos: FurnitureDefinition[] = [];
  const erros: ErroSchemaComIndice[] = [];

  for (let i = 0; i < lista.length; i++) {
    const resultado = FurnitureDefinition.safeParse(lista[i]);
    if (resultado.success) {
      validos.push(resultado.data);
    } else {
      erros.push({ indice: i, erro: resultado.error });
    }
  }

  return { validos, erros };
}

export async function carregarComodoDefinition(
  arquivo: File
): Promise<{ valido: ComodoDefinition | undefined; erro: z.ZodError | undefined }> {
  const dados = await lerArquivoJson(arquivo);
  const resultado = ComodoDefinition.safeParse(dados);

  if (resultado.success) {
    return { valido: resultado.data, erro: undefined };
  }
  return { valido: undefined, erro: resultado.error };
}

export async function carregarEventosLote(
  arquivo: File
): Promise<{ validos: Event[]; erros: ErroSchemaComIndice[] }> {
  const dados = await lerArquivoJson(arquivo);
  const lista: unknown[] = Array.isArray(dados) ? dados : [dados];

  const validos: Event[] = [];
  const erros: ErroSchemaComIndice[] = [];

  for (let i = 0; i < lista.length; i++) {
    const resultado = Event.safeParse(lista[i]);
    if (resultado.success) {
      validos.push(resultado.data);
    } else {
      erros.push({ indice: i, erro: resultado.error });
    }
  }

  return { validos, erros };
}
