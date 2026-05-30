import { z } from 'zod';
import { FurnitureDefinition } from '@core/schemas/furniture';
import { ComodoDefinition } from '@core/schemas/location';
import { Event } from '@core/schemas/event';
import { FurnitureAssetMetadata, type RotacaoMovel } from '@core/schemas/furnitureAsset';

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

// Retorna a URL de imagem para um asset em determinada rotação
export function urlImagemAsset(
  assetId: string,
  rotacao: RotacaoMovel,
  metadata?: FurnitureAssetMetadata,
): string {
  const spriteDeclarado = metadata?.spritesPorRotacao?.[String(rotacao)];
  return `/content/furniture-assets/${assetId}/${spriteDeclarado ?? `rot_${rotacao}.png`}`;
}

// Carrega e valida metadata.json de um asset via fetch (requer plugin serve-content no vite.config)
export async function carregarFurnitureAssetMetadata(
  assetId: string
): Promise<FurnitureAssetMetadata | undefined> {
  try {
    const resposta = await fetch(`/content/furniture-assets/${assetId}/metadata.json`);
    if (!resposta.ok) return undefined;
    const dados: unknown = await resposta.json();
    const resultado = FurnitureAssetMetadata.safeParse(dados);
    return resultado.success ? resultado.data : undefined;
  } catch {
    return undefined;
  }
}
