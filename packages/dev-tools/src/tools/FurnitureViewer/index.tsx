import { useState, useRef, useEffect, type ChangeEvent } from 'react';
import { z } from 'zod';
import { FurnitureDefinition } from '@lifesim/core';
import type { FurnitureAssetMetadata, RotacaoMovel } from '@core/schemas/furnitureAsset';
import { carregarFurnitureAssetMetadata, urlImagemAsset } from '../../shared/SchemaLoader';
import {
  escreverArquivo,
  escreverBinario,
  obterPastaRaiz,
  selecionarPastaRaiz,
  garantirPasta,
  SUPORTA_FILE_SYSTEM_ACCESS,
} from '../../shared/ProjetoHandle';
import { CartaoDeMovel } from './FurnitureCard';
import { exportarComoZip } from '../../shared/ZipExporter';
import { FootprintEditor } from './FootprintEditor';

type FiltroEra = 'todos' | 'eighties' | 'nineties' | 'twothousands' | 'modern';
type CatalogoId = Exclude<FiltroEra, 'todos'>;
type FiltroCategoria = 'todos' | FurnitureDefinition['categoria'];

type OrigemCatalogo = {
  readonly id: CatalogoId;
  readonly url: string;
  readonly rotulo: string;
  readonly caminho: readonly string[];
};

type ItemDoCatalogo =
  | { readonly ok: true; readonly movel: FurnitureDefinition; readonly origemCatalogo: OrigemCatalogo | undefined }
  | { readonly ok: false; readonly bruto: unknown; readonly erro: z.ZodError };

type ItemValidoCatalogo = Extract<ItemDoCatalogo, { readonly ok: true }>;

type ReferenciaComodo = {
  nomeComodo: string;
  caminho: string[];
  tipo: 'classic' | 'iso';
  objId: string;
};

type ResultadoCatalogo = {
  readonly itens: ItemDoCatalogo[];
  readonly mensagem: string;
};

function anoParaEra(startYear: number): CatalogoId {
  if (startYear < 1990) return 'eighties';
  if (startYear < 2000) return 'nineties';
  if (startYear < 2010) return 'twothousands';
  return 'modern';
}

function itemPassaFiltros(
  item: ItemDoCatalogo,
  era: FiltroEra,
  categoria: FiltroCategoria,
  precoMin: number,
  precoMax: number,
  busca: string,
): boolean {
  if (!item.ok) return true;
  const { movel } = item;
  if (era !== 'todos' && anoParaEra(movel.availability.startYear) !== era) return false;
  if (categoria !== 'todos' && movel.categoria !== categoria) return false;
  if (precoMax > 0 && (movel.preco < precoMin || movel.preco > precoMax)) return false;
  if (busca.trim()) {
    const termo = busca.toLowerCase();
    if (!movel.nome.toLowerCase().includes(termo) && !movel.tags.some((t) => t.toLowerCase().includes(termo))) {
      return false;
    }
  }
  return true;
}

function parsearDadosCatalogo(dados: unknown, origemCatalogo?: OrigemCatalogo): ResultadoCatalogo {
  const lista: unknown[] = Array.isArray(dados) ? dados : [dados];

  const itens: ItemDoCatalogo[] = lista.map((entrada) => {
    const resultado = FurnitureDefinition.safeParse(entrada);
    return resultado.success
      ? { ok: true as const, movel: resultado.data, origemCatalogo }
      : { ok: false as const, bruto: entrada, erro: resultado.error };
  });

  const numErros = itens.filter((i) => !i.ok).length;
  const msg = `${itens.length - numErros} válidos${numErros > 0 ? ` · ${numErros} com erro de schema` : ''}`;
  return { itens, mensagem: msg };
}

async function parsearCatalogo(arquivo: File): Promise<ResultadoCatalogo> {
  const texto = await arquivo.text();
  const dados: unknown = JSON.parse(texto);
  return parsearDadosCatalogo(dados);
}

const CATEGORIAS: FurnitureDefinition['categoria'][] = [
  'assento', 'mesa', 'cama', 'tecnologia', 'eletrodomestico', 'decoracao', 'treino', 'outro',
];

const CATALOGOS_PADRAO: readonly OrigemCatalogo[] = [
  {
    id: 'eighties',
    url: '/content/furniture/eighties/catalogo.json',
    rotulo: 'Anos 80',
    caminho: ['content', 'furniture', 'eighties', 'catalogo.json'],
  },
  {
    id: 'nineties',
    url: '/content/furniture/nineties/catalogo.json',
    rotulo: 'Anos 90',
    caminho: ['content', 'furniture', 'nineties', 'catalogo.json'],
  },
  {
    id: 'twothousands',
    url: '/content/furniture/twothousands/catalogo.json',
    rotulo: 'Anos 2000',
    caminho: ['content', 'furniture', 'twothousands', 'catalogo.json'],
  },
  {
    id: 'modern',
    url: '/content/furniture/modern/catalogo.json',
    rotulo: 'Moderno',
    caminho: ['content', 'furniture', 'modern', 'catalogo.json'],
  },
] as const;

const ANO_INICIAL_POR_CATALOGO: Record<CatalogoId, number> = {
  eighties: 1985,
  nineties: 1990,
  twothousands: 2000,
  modern: 2010,
};

const ACOES_PADRAO = [
  'sentar', 'relaxar', 'dormir', 'descansar', 'pensar_deitado',
  'jogar_videogame', 'usar_computador', 'trabalhar', 'estudar',
  'comer', 'verificar_comida', 'cozinhar', 'assistir_tv', 'ver_noticias',
  'ouvir_musica', 'cantar_karaoke', 'ver_aparencia', 'praticar_discurso',
  'treinar_em_casa', 'fazer_ligacao', 'verificar_mensagens',
];

async function obterPastaPorCaminho(
  base: FileSystemDirectoryHandle,
  caminho: readonly string[],
): Promise<FileSystemDirectoryHandle> {
  let pastaAtual = base;
  for (const parte of caminho) {
    pastaAtual = await pastaAtual.getDirectoryHandle(parte);
  }
  return pastaAtual;
}

async function lerArquivoTextoLocal(
  pasta: FileSystemDirectoryHandle,
  nomeArquivo: string,
): Promise<string> {
  const arquivo = await pasta.getFileHandle(nomeArquivo);
  const file = await arquivo.getFile();
  return file.text();
}

function entradaPertenceAoMovel(entrada: unknown, movel: FurnitureDefinition): boolean {
  if (typeof entrada !== 'object' || entrada === null) return false;
  const registro = entrada as Record<string, unknown>;
  return registro.id === movel.id || registro.assetId === movel.assetId;
}

function obterCatalogoPorId(id: CatalogoId): OrigemCatalogo {
  const catalogo = CATALOGOS_PADRAO.find((origem) => origem.id === id);
  if (catalogo === undefined) {
    throw new Error(`Catalogo ${id} nao encontrado.`);
  }
  return catalogo;
}

function moverMovelParaCatalogo(movel: FurnitureDefinition, catalogoId: CatalogoId, nome: string): FurnitureDefinition {
  return {
    ...movel,
    nome,
    availability: {
      ...movel.availability,
      startYear: ANO_INICIAL_POR_CATALOGO[catalogoId],
    },
  };
}

// --- Scanner de Referências nos Cômodos ---

async function varrerDiretorioLocations(
  diretorio: FileSystemDirectoryHandle,
  caminhoBase: string[],
  idsMovel: string[],
  assetsMovel: string[],
  referencias: Record<string, ReferenciaComodo[]>,
) {
  for await (const [nome, handle] of (diretorio as any).entries()) {
    if (handle.kind === 'directory') {
      await varrerDiretorioLocations(handle, [...caminhoBase, nome], idsMovel, assetsMovel, referencias);
    } else if (handle.kind === 'file' && nome.endsWith('.json')) {
      try {
        const file = await handle.getFile();
        const texto = await file.text();
        const comodo = JSON.parse(texto);
        if (comodo && Array.isArray(comodo.objetos)) {
          for (const obj of comodo.objetos) {
            for (let i = 0; i < idsMovel.length; i++) {
              const id = idsMovel[i]!;
              const asset = assetsMovel[i]!;
              if (obj.assetId === asset || obj.assetId === id || obj.furnitureId === id || obj.furnitureId === asset) {
                const refsList = referencias[id];
                if (refsList !== undefined) {
                  refsList.push({
                    nomeComodo: comodo.nome || comodo.id || nome,
                    caminho: [...caminhoBase, nome],
                    tipo: 'classic',
                    objId: obj.id,
                  });
                }
              }
            }
          }
        }
      } catch (err) {
        console.warn(`Erro ao ler cômodo clássico ${nome} para varredura:`, err);
      }
    }
  }
}

async function varrerDiretorioLocationsIso(
  diretorio: FileSystemDirectoryHandle,
  caminhoBase: string[],
  idsMovel: string[],
  assetsMovel: string[],
  referencias: Record<string, ReferenciaComodo[]>,
) {
  for await (const [nome, handle] of (diretorio as any).entries()) {
    if (handle.kind === 'directory') {
      await varrerDiretorioLocationsIso(handle, [...caminhoBase, nome], idsMovel, assetsMovel, referencias);
    } else if (handle.kind === 'file' && nome.endsWith('.json')) {
      try {
        const file = await handle.getFile();
        const texto = await file.text();
        const comodo = JSON.parse(texto);
        if (comodo && Array.isArray(comodo.objetos)) {
          for (const obj of comodo.objetos) {
            for (let i = 0; i < idsMovel.length; i++) {
              const id = idsMovel[i]!;
              const asset = assetsMovel[i]!;
              if (obj.furnitureId === id || obj.furnitureId === asset || obj.assetId === asset || obj.assetId === id) {
                const refsList = referencias[id];
                if (refsList !== undefined) {
                  refsList.push({
                    nomeComodo: comodo.nome || comodo.id || nome,
                    caminho: [...caminhoBase, nome],
                    tipo: 'iso',
                    objId: obj.id,
                  });
                }
              }
            }
          }
        }
      } catch (err) {
        console.warn(`Erro ao ler cômodo ISO ${nome} para varredura:`, err);
      }
    }
  }
}

async function buscarReferenciasDeMoveis(
  idsMovel: string[],
  assetsMovel: string[],
): Promise<Record<string, ReferenciaComodo[]>> {
  try {
    const resposta = await fetch('/__devtools/furniture/scan-references', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: idsMovel, assets: assetsMovel }),
    });
    if (resposta.ok) {
      const dados = await resposta.json().catch(() => null);
      if (dados && typeof dados === 'object') {
        console.log('[DevTools] Referências escaneadas com sucesso via servidor.');
        return dados as Record<string, ReferenciaComodo[]>;
      }
    }
  } catch (erro) {
    console.warn('[DevTools] Falha ao buscar referências via servidor, tentando fallback local:', erro);
  }

  const referencias: Record<string, ReferenciaComodo[]> = {};
  for (const id of idsMovel) {
    referencias[id] = [];
  }

  try {
    const raiz = obterPastaRaiz();

    // 1. Cômodos clássicos
    try {
      const pastaLocations = await obterPastaPorCaminho(raiz, ['content', 'locations']);
      await varrerDiretorioLocations(pastaLocations, ['content', 'locations'], idsMovel, assetsMovel, referencias);
    } catch (e) {
      console.warn('Pasta content/locations não encontrada ou inacessível para varredura de referências.', e);
    }

    // 2. Cômodos ISO
    try {
      const pastaLocationsIso = await obterPastaPorCaminho(raiz, ['content', 'locations-iso']);
      await varrerDiretorioLocationsIso(pastaLocationsIso, ['content', 'locations-iso'], idsMovel, assetsMovel, referencias);
    } catch (e) {
      console.warn('Pasta content/locations-iso não encontrada ou inacessível para varredura de referências.', e);
    }
  } catch (err) {
    console.warn('Pasta raiz do projeto não está conectada. Pulando varredura de referências.', err);
  }

  return referencias;
}

async function removerReferenciasDeMoveis(
  referencias: Record<string, ReferenciaComodo[]>,
): Promise<void> {
  try {
    const resposta = await fetch('/__devtools/furniture/clean-references', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ referencias }),
    });
    if (resposta.ok) {
      const dados = await resposta.json().catch(() => null);
      if (dados && dados.ok) {
        console.log('[DevTools] Referências limpas com sucesso via servidor.');
        return;
      }
    }
  } catch (erro) {
    console.warn('[DevTools] Falha ao limpar referências via servidor, tentando fallback local:', erro);
  }

  const raiz = obterPastaRaiz();
  const arquivosParaModificar: Record<string, { caminho: string[]; objIdsParaRemover: string[] }> = {};

  for (const refs of Object.values(referencias)) {
    for (const ref of refs) {
      const chave = ref.caminho.join('/');
      if (!arquivosParaModificar[chave]) {
        arquivosParaModificar[chave] = {
          caminho: ref.caminho,
          objIdsParaRemover: [],
        };
      }
      arquivosParaModificar[chave].objIdsParaRemover.push(ref.objId);
    }
  }

  for (const { caminho, objIdsParaRemover } of Object.values(arquivosParaModificar)) {
    try {
      const pastaCaminho = caminho.slice(0, -1);
      const nomeArquivo = caminho[caminho.length - 1]!;
      const pasta = await obterPastaPorCaminho(raiz, pastaCaminho);
      const texto = await lerArquivoTextoLocal(pasta, nomeArquivo);
      const comodo = JSON.parse(texto);

      if (comodo && Array.isArray(comodo.objetos)) {
        comodo.objetos = comodo.objetos.filter((obj: any) => !objIdsParaRemover.includes(obj.id));
        await escreverArquivo(pasta, nomeArquivo, `${JSON.stringify(comodo, null, 2)}\n`);
        console.log(`Referências removidas e cômodo atualizado: ${caminho.join('/')}`);
      }
    } catch (e) {
      console.error(`Erro ao limpar referências no cômodo ${caminho.join('/')}:`, e);
    }
  }
}

// --- Fim Scanner de Referências ---

async function removerMovelDoProjeto(movel: FurnitureDefinition, origemCatalogo: OrigemCatalogo): Promise<void> {
  const removidoViaServidor = await removerMovelViaServidor(movel, origemCatalogo);
  if (removidoViaServidor) return;

  const raiz = await obterOuSelecionarPastaRaiz();
  const caminhoPastaCatalogo = origemCatalogo.caminho.slice(0, -1);
  const nomeArquivoCatalogo = origemCatalogo.caminho[origemCatalogo.caminho.length - 1];

  if (nomeArquivoCatalogo === undefined) {
    throw new Error('Catalogo de origem invalido.');
  }

  const pastaCatalogo = await obterPastaPorCaminho(raiz, caminhoPastaCatalogo);
  const textoCatalogo = await lerArquivoTextoLocal(pastaCatalogo, nomeArquivoCatalogo);
  const dadosCatalogo: unknown = JSON.parse(textoCatalogo);

  if (!Array.isArray(dadosCatalogo)) {
    throw new Error(`Catalogo ${origemCatalogo.rotulo} nao e uma lista JSON.`);
  }

  const catalogoAtualizado = dadosCatalogo.filter((entrada) => !entradaPertenceAoMovel(entrada, movel));
  if (catalogoAtualizado.length === dadosCatalogo.length) {
    throw new Error(`Movel ${movel.id} nao foi encontrado no catalogo ${origemCatalogo.rotulo}.`);
  }

  await escreverArquivo(pastaCatalogo, nomeArquivoCatalogo, `${JSON.stringify(catalogoAtualizado, null, 2)}\n`);

  const pastaAssets = await obterPastaPorCaminho(raiz, ['content', 'furniture-assets']);
  try {
    await pastaAssets.removeEntry(movel.assetId, { recursive: true });
  } catch (erro) {
    console.warn(`Asset ${movel.assetId} nao foi removido de content/furniture-assets.`, erro);
  }
}

async function salvarMovelNoProjeto(
  movel: FurnitureDefinition,
  origemCatalogo: OrigemCatalogo | undefined,
  destinoCatalogo: OrigemCatalogo,
): Promise<void> {
  if (origemCatalogo !== undefined) {
    const salvoViaServidor = await salvarMovelViaServidor(movel, origemCatalogo, destinoCatalogo);
    if (salvoViaServidor) return;
  }

  const raiz = await obterOuSelecionarPastaRaiz();
  const destinoPasta = destinoCatalogo.caminho.slice(0, -1);
  const destinoArquivo = destinoCatalogo.caminho[destinoCatalogo.caminho.length - 1];

  if (destinoArquivo === undefined) {
    throw new Error('Catalogo de destino invalido.');
  }

  if (origemCatalogo !== undefined && origemCatalogo.id !== destinoCatalogo.id) {
    const origemPasta = origemCatalogo.caminho.slice(0, -1);
    const origemArquivo = origemCatalogo.caminho[origemCatalogo.caminho.length - 1];
    if (origemArquivo !== undefined) {
      const pastaOrigem = await obterPastaPorCaminho(raiz, origemPasta);
      const textoOrigem = await lerArquivoTextoLocal(pastaOrigem, origemArquivo);
      const dadosOrigem: unknown = JSON.parse(textoOrigem);
      if (Array.isArray(dadosOrigem)) {
        const origemAtualizada = dadosOrigem.filter((entrada) => !entradaPertenceAoMovel(entrada, movel));
        await escreverArquivo(pastaOrigem, origemArquivo, `${JSON.stringify(origemAtualizada, null, 2)}\n`);
      }
    }
  }

  const pastaDestino = await obterPastaPorCaminho(raiz, destinoPasta);
  const textoDestino = await lerArquivoTextoLocal(pastaDestino, destinoArquivo);
  const dadosDestino: unknown = JSON.parse(textoDestino);
  if (!Array.isArray(dadosDestino)) {
    throw new Error(`Catalogo ${destinoCatalogo.rotulo} nao e uma lista JSON.`);
  }

  const destinoAtualizado = dadosDestino.filter((entrada) => !entradaPertenceAoMovel(entrada, movel));
  await escreverArquivo(pastaDestino, destinoArquivo, `${JSON.stringify([...destinoAtualizado, movel], null, 2)}\n`);
}

async function obterOuSelecionarPastaRaiz(): Promise<FileSystemDirectoryHandle> {
  try {
    return obterPastaRaiz();
  } catch {
    try {
      return await selecionarPastaRaiz();
    } catch (erro) {
      throw new Error(
        `Pasta raiz nao selecionada. Selecione a pasta life-sim-game para salvar ou excluir. ${
          erro instanceof Error ? erro.message : String(erro)
        }`,
      );
    }
  }
}

async function salvarMovelViaServidor(
  movel: FurnitureDefinition,
  origemCatalogo: OrigemCatalogo,
  destinoCatalogo: OrigemCatalogo,
): Promise<boolean> {
  try {
    const resposta = await fetch('/__devtools/furniture/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        furnitureId: movel.id,
        assetId: movel.assetId,
        origemCatalogoPath: origemCatalogo.caminho,
        destinoCatalogoPath: destinoCatalogo.caminho,
        movel,
      }),
    });

    const dados: unknown = await resposta.json().catch(() => null);

    if (resposta.status === 404) {
      if (dados && typeof dados === 'object' && 'erro' in dados) {
        throw new Error(String((dados as any).erro));
      }
      return false;
    }

    if (!resposta.ok) {
      const erro = typeof dados === 'object' && dados !== null && 'erro' in dados
        ? String((dados as { erro: unknown }).erro)
        : `HTTP ${resposta.status}`;
      throw new Error(erro);
    }

    return true;
  } catch (erro) {
    console.warn('[DevTools] Falha ao salvar movel via servidor, tentando fallback local:', erro);
    return false;
  }
}

async function removerMovelViaServidor(movel: FurnitureDefinition, origemCatalogo: OrigemCatalogo): Promise<boolean> {
  try {
    const resposta = await fetch('/__devtools/furniture/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        furnitureId: movel.id,
        assetId: movel.assetId,
        catalogoPath: origemCatalogo.caminho,
      }),
    });

    const dados: unknown = await resposta.json().catch(() => null);

    if (resposta.status === 404) {
      if (dados && typeof dados === 'object' && 'erro' in dados) {
        throw new Error(String((dados as any).erro));
      }
      return false;
    }

    if (!resposta.ok) {
      const erro = typeof dados === 'object' && dados !== null && 'erro' in dados
        ? String((dados as { erro: unknown }).erro)
        : `HTTP ${resposta.status}`;
      throw new Error(erro);
    }

    return true;
  } catch (erro) {
    console.warn('[DevTools] Falha ao remover movel via servidor, tentando fallback local:', erro);
    return false;
  }
}

export function VisualizadorDeMovel() {
  const [itensCatalogo, setItensCatalogo] = useState<ItemDoCatalogo[]>([]);
  const [mensagem, setMensagem] = useState('');
  const [filtroEra, setFiltroEra] = useState<FiltroEra>('todos');
  const [filtroCategoria, setFiltroCategoria] = useState<FiltroCategoria>('todos');
  const [precoMin, setPrecoMin] = useState(0);
  const [precoMax, setPrecoMax] = useState(0);
  const [termoBusca, setTermoBusca] = useState('');
  const [itemInspecionado, setItemInspecionado] = useState<ItemValidoCatalogo | undefined>();
  const [modalNovoMovelAberto, setModalNovoMovelAberto] = useState(false);
  const inputArquivoRef = useRef<HTMLInputElement>(null);

  // Estados para Múltipla Seleção
  const [itensSelecionados, setItensSelecionados] = useState<string[]>([]);

  // Estado para Confirmação de Exclusão com Scanner de Referências
  const [confirmacaoExclusao, setConfirmacaoExclusao] = useState<{
    itens: ItemValidoCatalogo[];
    referencias: Record<string, ReferenciaComodo[]>;
    aberto: boolean;
    escanearConcluido: boolean;
  } | null>(null);

  const carregarCatalogos = async () => {
    setMensagem('Carregando catalogos padrao...');
    const resultados: ResultadoCatalogo[] = [];
    let carregados = 0;
    let falhas = 0;

    for (const origem of CATALOGOS_PADRAO) {
      try {
        const resposta = await fetch(origem.url);
        if (!resposta.ok) {
          falhas++;
          continue;
        }
        const dados: unknown = await resposta.json();
        resultados.push(parsearDadosCatalogo(dados, origem));
        carregados++;
      } catch {
        falhas++;
      }
    }

    const itens = resultados.flatMap((resultado) => resultado.itens);
    if (itens.length === 0) {
      setMensagem('Carregue um catalogo');
      return;
    }

    const numErros = itens.filter((item) => !item.ok).length;
    const numValidos = itens.length - numErros;
    setItensCatalogo(itens);
    setMensagem(`${numValidos} validos · ${carregados} catalogos padrao${falhas > 0 ? ` · ${falhas} falhas` : ''}`);
  };

  useEffect(() => {
    void carregarCatalogos();
  }, []);

  const aoCarregarArquivo = async (e: ChangeEvent<HTMLInputElement>) => {
    const arquivo = e.target.files?.[0];
    if (!arquivo) return;
    setMensagem('Carregando...');
    try {
      const { itens, message } = await parsearCatalogo(arquivo) as any;
      setItensCatalogo(itens);
      setMensagem(message || 'Carregado com sucesso');
    } catch (err) {
      setMensagem(`Erro: ${err instanceof Error ? err.message : String(err)}`);
    }
    if (e.target) e.target.value = '';
  };

  // --- Função unificada para abrir tela de exclusão (Single ou Bulk) ---
  const prepararExclusao = async (itensParaExcluir: ItemValidoCatalogo[]) => {
    if (itensParaExcluir.length === 0) return;

    setMensagem('Buscando referências dos móveis nos cômodos...');
    setConfirmacaoExclusao({
      itens: itensParaExcluir,
      referencias: {},
      aberto: true,
      escanearConcluido: false,
    });

    const ids = itensParaExcluir.map((i) => i.movel.id);
    const assets = itensParaExcluir.map((i) => i.movel.assetId);

    const refs = await buscarReferenciasDeMoveis(ids, assets);

    setConfirmacaoExclusao({
      itens: itensParaExcluir,
      referencias: refs,
      aberto: true,
      escanearConcluido: true,
    });
    setMensagem('Varredura de referências concluída.');
  };

  const confirmarEExecutarExclusao = async (limparReferencias: boolean) => {
    if (!confirmacaoExclusao) return;

    const { itens, referencias } = confirmacaoExclusao;
    setMensagem('Excluindo móveis...');
    setConfirmacaoExclusao(null);

    try {
      // 1. Limpar referências nos arquivos JSON se solicitado
      if (limparReferencias && Object.keys(referencias).length > 0) {
        await removerReferenciasDeMoveis(referencias);
      }

      // 2. Excluir os móveis (entradas e pastas de assets)
      for (const item of itens) {
        if (item.origemCatalogo === undefined) continue;
        await removerMovelDoProjeto(item.movel, item.origemCatalogo);
      }

      // 3. Atualizar estado dos itens na UI
      const idsExcluidos = itens.map((i) => i.movel.id);
      setItensCatalogo((atuais) =>
        atuais.filter((atual) => {
          if (!atual.ok) return true;
          return !idsExcluidos.includes(atual.movel.id);
        })
      );

      // Limpar seleção
      setItensSelecionados((prev) => prev.filter((id) => !idsExcluidos.includes(id)));
      setItemInspecionado(undefined);
      setMensagem(`${itens.length} móvel(is) excluído(s) e limpo(s) do projeto.`);
    } catch (erro) {
      const msgErro = `Erro ao excluir: ${erro instanceof Error ? erro.message : String(erro)}`;
      setMensagem(msgErro);
      window.alert(msgErro);
    }
  };

  const aoSalvarMovelCompleto = async (
    movelAtualizado: FurnitureDefinition,
    metadataAtualizado: FurnitureAssetMetadata,
    spritesParaSalvar: Record<string, File>,
    origemCatalogo: OrigemCatalogo | undefined,
    destinoCatalogo: OrigemCatalogo,
  ) => {
    setMensagem(`Salvando ${movelAtualizado.nome}...`);
    try {
      let temAcessoLocal = false;
      try {
        const raiz = obterPastaRaiz();
        temAcessoLocal = raiz !== undefined;
      } catch {}

      if (temAcessoLocal) {
        const raiz = obterPastaRaiz();
        const pastaAsset = await garantirPasta(raiz, 'content', 'furniture-assets', movelAtualizado.assetId);

        const novosSprites = { ...metadataAtualizado.spritesPorRotacao };
        for (const [rotacaoStr, arquivo] of Object.entries(spritesParaSalvar)) {
          const buffer = await arquivo.arrayBuffer();
          await escreverBinario(pastaAsset, arquivo.name, buffer);
          novosSprites[rotacaoStr] = arquivo.name;
        }
        metadataAtualizado.spritesPorRotacao = novosSprites;

        await escreverArquivo(
          pastaAsset,
          'metadata.json',
          JSON.stringify(metadataAtualizado, null, 2) + '\n',
        );
      } else if (Object.keys(spritesParaSalvar).length > 0) {
        console.warn('Sprites adicionados mas sem pasta do projeto conectada. As imagens não serão gravadas no disco local (utilize Exportar ZIP).');
      }

      await salvarMovelNoProjeto(movelAtualizado, origemCatalogo, destinoCatalogo);

      const novoItem: ItemValidoCatalogo = {
        ok: true,
        movel: movelAtualizado,
        origemCatalogo: destinoCatalogo,
      };

      setItensCatalogo((atuais) => {
        const semAtual = atuais.filter((atual) => {
          if (!atual.ok) return true;
          return !(atual.movel.id === movelAtualizado.id && atual.movel.assetId === movelAtualizado.assetId);
        });
        return [...semAtual, novoItem];
      });

      setItemInspecionado(novoItem);
      setMensagem(`${movelAtualizado.nome} salvo com sucesso!`);
    } catch (erro) {
      const mensagemErro = `Erro ao salvar: ${erro instanceof Error ? erro.message : String(erro)}`;
      setMensagem(mensagemErro);
      window.alert(mensagemErro);
    }
  };

  const aoExportarMovelZip = async (
    movel: FurnitureDefinition,
    metadata: FurnitureAssetMetadata,
    spritesParaSalvar: Record<string, File>,
    destinoCatalogo: OrigemCatalogo,
  ) => {
    setMensagem('Exportando ZIP...');
    try {
      const arquivosZip: Array<{ caminho: string; conteudo: string | ArrayBuffer }> = [];

      const metadataZip = { ...metadata };
      const novosSprites = { ...metadata.spritesPorRotacao };
      for (const [rot, arq] of Object.entries(spritesParaSalvar)) {
        const buffer = await arq.arrayBuffer();
        arquivosZip.push({
          caminho: `content/furniture-assets/${movel.assetId}/${arq.name}`,
          conteudo: buffer,
        });
        novosSprites[rot] = arq.name;
      }
      metadataZip.spritesPorRotacao = novosSprites;

      arquivosZip.push({
        caminho: `content/furniture-assets/${movel.assetId}/metadata.json`,
        conteudo: JSON.stringify(metadataZip, null, 2) + '\n',
      });

      for (const catalogo of CATALOGOS_PADRAO) {
        let listaCatalogada = itensCatalogo
          .filter((item) => item.ok && item.origemCatalogo?.id === catalogo.id)
          .map((item) => (item as ItemValidoCatalogo).movel);

        listaCatalogada = listaCatalogada.filter((m) => m.id !== movel.id);

        if (catalogo.id === destinoCatalogo.id) {
          listaCatalogada.push(movel);
        }

        arquivosZip.push({
          caminho: `content/furniture/${catalogo.id}/catalogo.json`,
          conteudo: JSON.stringify(listaCatalogada, null, 2) + '\n',
        });
      }

      await exportarComoZip(arquivosZip);
      setMensagem('Exportado com sucesso!');
    } catch (erro) {
      setMensagem(`Erro na exportacao: ${erro instanceof Error ? erro.message : String(erro)}`);
    }
  };

  const aoCriarNovoMovel = (novoMovel: FurnitureDefinition) => {
    const era = anoParaEra(novoMovel.availability.startYear);
    const origem = CATALOGOS_PADRAO.find((c) => c.id === era);
    const novoItem: ItemValidoCatalogo = {
      ok: true,
      movel: novoMovel,
      origemCatalogo: origem,
    };
    setItensCatalogo((atuais) => [...atuais, novoItem]);
    setItemInspecionado(novoItem);
    setModalNovoMovelAberto(false);
    setMensagem(`Criado móvel temporário "${novoMovel.nome}". Salve no projeto para persistir.`);
  };

  const itensFiltrados = itensCatalogo.filter((item) =>
    itemPassaFiltros(item, filtroEra, filtroCategoria, precoMin, precoMax, termoBusca),
  );
  const numValidos = itensCatalogo.filter((i) => i.ok).length;

  // Handlers para Múltipla Seleção
  const aoAlternarSelecaoItem = (id: string) => {
    setItensSelecionados((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const aoSelecionarTodosFiltrados = () => {
    const idsFiltradosValidos = itensFiltrados
      .filter((i) => i.ok)
      .map((i) => (i as ItemValidoCatalogo).movel.id);

    const todosSelecionados = idsFiltradosValidos.every((id) => itensSelecionados.includes(id));

    if (todosSelecionados) {
      // Deselecionar apenas os filtrados
      setItensSelecionados((prev) => prev.filter((id) => !idsFiltradosValidos.includes(id)));
    } else {
      // Adicionar filtrados à seleção, evitando duplicatas
      setItensSelecionados((prev) => Array.from(new Set([...prev, ...idsFiltradosValidos])));
    }
  };

  const aoExcluirSelecionados = () => {
    const itensParaDeletar = itensCatalogo
      .filter((i) => i.ok && itensSelecionados.includes(i.movel.id))
      .map((i) => i as ItemValidoCatalogo);

    prepararExclusao(itensParaDeletar);
  };

  const totalSelecionados = itensSelecionados.length;
  const idsFiltradosValidos = itensFiltrados
    .filter((i) => i.ok)
    .map((i) => (i as ItemValidoCatalogo).movel.id);
  const todosFiltradosSelecionados = idsFiltradosValidos.length > 0 && idsFiltradosValidos.every((id) => itensSelecionados.includes(id));

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', position: 'relative', background: '#121214' }}>
      {/* Estilos Premium */}
      <style>{`
        .dev-select, .dev-input {
          background: #202024;
          color: #e1e1e6;
          border: 1px solid #323238;
          border-radius: 6px;
          padding: 6px 12px;
          font-size: 13px;
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .dev-select:focus, .dev-input:focus {
          border-color: #3b82f6;
          box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
        }
        .btn-primary {
          background: linear-gradient(135deg, #3b82f6, #1d4ed8);
          color: #fff;
          border: none;
          border-radius: 6px;
          padding: 6px 14px;
          font-weight: 600;
          cursor: pointer;
          font-size: 13px;
          display: flex;
          align-items: center;
          gap: 6px;
          transition: opacity 0.2s;
        }
        .btn-primary:hover {
          opacity: 0.9;
        }
        .btn-secondary {
          background: #29292e;
          color: #c4c4cc;
          border: 1px solid #38383f;
          border-radius: 6px;
          padding: 6px 14px;
          cursor: pointer;
          font-size: 13px;
          transition: background 0.2s;
        }
        .btn-secondary:hover {
          background: #323238;
        }
        .btn-danger {
          background: linear-gradient(135deg, #ef4444, #dc2626);
          color: #fff;
          border: none;
          border-radius: 6px;
          padding: 6px 14px;
          font-weight: 600;
          cursor: pointer;
          font-size: 13px;
          display: flex;
          align-items: center;
          gap: 6px;
          transition: opacity 0.2s;
        }
        .btn-danger:hover {
          opacity: 0.9;
        }
        .btn-tab {
          background: transparent;
          color: #8d8d99;
          border: none;
          border-bottom: 2px solid transparent;
          padding: 8px 16px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }
        .btn-tab.active {
          color: #3b82f6;
          border-bottom-color: #3b82f6;
        }
        .slot-dropzone {
          border: 2px dashed #323238;
          background: #1e1e22;
          border-radius: 6px;
          padding: 10px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 4px;
          cursor: pointer;
          transition: border-color 0.2s, background 0.2s;
        }
        .slot-dropzone:hover {
          border-color: #3b82f6;
          background: #222226;
        }
      `}</style>

      {/* Barra de filtros */}
      <div style={{
        display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center',
        padding: '1rem', background: '#121214', borderBottom: '1px solid #202024',
        justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <button onClick={() => setModalNovoMovelAberto(true)} className="btn-primary">
            <span>+</span> Novo Móvel
          </button>

          <button onClick={() => inputArquivoRef.current?.click()} className="btn-secondary">
            Carregar catálogo
          </button>
          <input ref={inputArquivoRef} type="file" accept=".json" onChange={aoCarregarArquivo} style={{ display: 'none' }} />

          {/* Selecionar todos os filtrados */}
          {itensFiltrados.length > 0 && (
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#c4c4cc', fontSize: 13, cursor: 'pointer', userSelect: 'none' }}>
              <input
                type="checkbox"
                checked={todosFiltradosSelecionados}
                onChange={aoSelecionarTodosFiltrados}
                style={{ width: 15, height: 15, cursor: 'pointer' }}
              />
              Selecionar Todos ({itensFiltrados.length})
            </label>
          )}

          {/* Botão de Excluir Selecionados */}
          {totalSelecionados > 0 && (
            <button onClick={aoExcluirSelecionados} className="btn-danger">
              🗑️ Excluir Selecionados ({totalSelecionados})
            </button>
          )}

          {totalSelecionados > 0 && (
            <button onClick={() => setItensSelecionados([])} className="btn-secondary" style={{ padding: '6px 10px' }}>
              Limpar seleção
            </button>
          )}

          <span style={{ borderLeft: '1px solid #323238', height: 20, margin: '0 0.25rem' }} />

          <select value={filtroEra} onChange={(e) => setFiltroEra(e.target.value as FiltroEra)} className="dev-select">
            <option value="todos">Todas as eras</option>
            <option value="eighties">Anos 80</option>
            <option value="nineties">Anos 90</option>
            <option value="twothousands">Anos 2000</option>
            <option value="modern">Moderno (2010+)</option>
          </select>

          <select value={filtroCategoria} onChange={(e) => setFiltroCategoria(e.target.value as FiltroCategoria)} className="dev-select">
            <option value="todos">Todas as categorias</option>
            {CATEGORIAS.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
          </select>

          <input
            type="number" placeholder="Preço mín" value={precoMin || ''}
            onChange={(e) => setPrecoMin(Number(e.target.value))}
            className="dev-input" style={{ width: 90 }}
          />
          <input
            type="number" placeholder="Preço máx" value={precoMax || ''}
            onChange={(e) => setPrecoMax(Number(e.target.value))}
            className="dev-input" style={{ width: 90 }}
          />
          <input
            type="text" placeholder="Buscar nome/tag…"
            value={termoBusca} onChange={(e) => setTermoBusca(e.target.value)}
            className="dev-input" style={{ width: 150 }}
          />
        </div>
        <span style={{ fontSize: 13, color: '#8d8d99', whiteSpace: 'nowrap' }}>
          {itensFiltrados.length}/{numValidos} · {mensagem}
        </span>
      </div>

      {/* Grid de cards */}
      {itensCatalogo.length === 0 ? (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#7c7c8a', fontSize: 15 }}>
          Carregue um arquivo{' '}
          <code style={{ margin: '0 0.4rem', color: '#3b82f6', background: '#1e1e22', padding: '3px 6px', borderRadius: 4 }}>content/furniture/**/*.json</code>
        </div>
      ) : (
        <div style={{
          flex: 1, overflow: 'auto', padding: '1.25rem',
          display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
          gap: '1rem', alignContent: 'start',
        }}>
          {itensFiltrados.map((item, idx) =>
            item.ok ? (
              <CartaoDeMovel
                key={item.movel.id}
                movel={item.movel}
                aoClicar={() => setItemInspecionado(item)}
                selecionado={itensSelecionados.includes(item.movel.id)}
                aoAlternarSelecao={() => aoAlternarSelecaoItem(item.movel.id)}
              />
            ) : (
              <CartaoDeMovelComErro key={idx} bruto={item.bruto} erro={item.erro} />
            )
          )}
          {itensFiltrados.length === 0 && (
            <div style={{ gridColumn: '1 / -1', color: '#7c7c8a', fontSize: 14, textAlign: 'center', paddingTop: '3rem' }}>
              Nenhum móvel corresponde aos filtros aplicados
            </div>
          )}
        </div>
      )}

      {/* Drawer de inspeção lateral */}
      {itemInspecionado !== undefined && (
        <PainelInspecao
          item={itemInspecionado}
          itensCatalogoAtuais={itensCatalogo}
          aoFechar={() => setItemInspecionado(undefined)}
          aoExcluir={() => prepararExclusao([itemInspecionado])}
          aoSalvarMovelCompleto={(movel, metadata, sprites) =>
            aoSalvarMovelCompleto(
              movel,
              metadata,
              sprites,
              itemInspecionado.origemCatalogo,
              obterCatalogoPorId(anoParaEra(movel.availability.startYear)),
            )
          }
          aoExportarMovelZip={(movel, metadata, sprites) =>
            aoExportarMovelZip(
              movel,
              metadata,
              sprites,
              obterCatalogoPorId(anoParaEra(movel.availability.startYear)),
            )
          }
        />
      )}

      {/* Modal de Confirmação de Exclusão com Scanner de Referências */}
      {confirmacaoExclusao && confirmacaoExclusao.aberto && (
        <ModalConfirmacaoExclusao
          itens={confirmacaoExclusao.itens}
          referencias={confirmacaoExclusao.referencias}
          concluido={confirmacaoExclusao.escanearConcluido}
          aoFechar={() => setConfirmacaoExclusao(null)}
          aoConfirmar={confirmarEExecutarExclusao}
        />
      )}

      {/* Modal de Criação de Novo Móvel */}
      {modalNovoMovelAberto && (
        <ModalNovoMovel
          aoFechar={() => setModalNovoMovelAberto(false)}
          aoCriar={aoCriarNovoMovel}
        />
      )}
    </div>
  );
}

// --- Modal de Confirmação de Exclusão + Scanner de Referências ---

type PropsModalConfirmacao = {
  itens: ItemValidoCatalogo[];
  referencias: Record<string, ReferenciaComodo[]>;
  concluido: boolean;
  aoFechar: () => void;
  aoConfirmar: (limparReferencias: boolean) => void;
};

function ModalConfirmacaoExclusao({
  itens,
  referencias,
  concluido,
  aoFechar,
  aoConfirmar,
}: PropsModalConfirmacao) {
  // Contar referências totais encontradas
  const totalRefs = Object.values(referencias).reduce((acc, curr) => acc + curr.length, 0);

  return (
    <>
      <div onClick={aoFechar} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 100, backdropFilter: 'blur(4px)' }} />
      <div style={{
        position: 'fixed', left: '50%', top: '50%', transform: 'translate(-50%, -50%)',
        width: 540, maxWidth: '90%', maxHeight: '85vh', overflowY: 'auto',
        background: '#18181b', border: '1px solid #3f3f46', borderRadius: 8,
        boxShadow: '0 25px 50px rgba(0,0,0,0.7)', zIndex: 101,
        display: 'flex', flexDirection: 'column',
      }}>
        {/* Header */}
        <div style={{
          padding: '1.25rem', borderBottom: '1px solid #27272a',
          background: '#ef4444', color: '#fff',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          borderTopLeftRadius: 6, borderTopRightRadius: 6,
        }}>
          <strong style={{ fontSize: 16 }}>⚠️ Confirmar Exclusão de Móvel(is)</strong>
          <button onClick={aoFechar} style={{ border: 'none', background: 'transparent', fontSize: 20, cursor: 'pointer', color: '#fca5a5' }}>✕</button>
        </div>

        {/* Corpo do modal */}
        <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem', color: '#e4e4e7' }}>
          <div>
            <strong>Móvel(is) selecionado(s) para exclusão ({itens.length}):</strong>
            <ul style={{ margin: '8px 0', paddingLeft: 20, color: '#a1a1aa', fontSize: 13, maxHeight: 100, overflowY: 'auto' }}>
              {itens.map((item) => (
                <li key={item.movel.id}>
                  <strong>{item.movel.nome}</strong> (ID: {item.movel.id} | Asset: {item.movel.assetId})
                </li>
              ))}
            </ul>
            <p style={{ fontSize: 12, color: '#f87171', margin: '4px 0 0 0' }}>
              *Isso removerá as definições dos catálogos e apagará completamente as pastas de assets contendo metadados e imagens do projeto.*
            </p>
          </div>

          <hr style={{ border: 'none', borderBottom: '1px solid #27272a', margin: '4px 0' }} />

          {/* Status do Scanner */}
          <div>
            <strong style={{ display: 'block', marginBottom: 6 }}>Varredura de Referências no Projeto:</strong>
            {!concluido ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#3b82f6', fontSize: 13 }}>
                <span className="spinner" style={{ display: 'inline-block', width: 14, height: 14, border: '2px solid #3b82f6', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                Escaneando cômodos em <code>content/locations/</code>...
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
              </div>
            ) : totalRefs === 0 ? (
              <div style={{ background: '#14532d', color: '#4ade80', padding: '8px 12px', borderRadius: 6, fontSize: 13 }}>
                ✓ **Nenhuma referência encontrada:** Nenhum cômodo (classic ou ISO) utiliza os móveis selecionados. Exclusão segura e limpa!
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div style={{ background: '#7f1d1d', color: '#fca5a5', padding: '8px 12px', borderRadius: 6, fontSize: 13 }}>
                  ⚠️ **Conexões detectadas:** Encontramos **{totalRefs}** uso(s) desse(s) móvel(is) nos seguintes cômodos:
                </div>
                <div style={{
                  maxHeight: 150, overflowY: 'auto', background: '#202024',
                  borderRadius: 6, padding: '8px 12px', border: '1px solid #27272a',
                  fontSize: 12, display: 'flex', flexDirection: 'column', gap: 4,
                }}>
                  {Object.entries(referencias).map(([id, refs]) => {
                    if (refs.length === 0) return null;
                    const itemMovel = itens.find((i) => i.movel.id === id);
                    return (
                      <div key={id} style={{ marginBottom: 4 }}>
                        <strong style={{ color: '#3b82f6' }}>{itemMovel?.movel.nome || id}:</strong>
                        <ul style={{ margin: '4px 0 0 0', paddingLeft: 16, color: '#d4d4d8' }}>
                          {refs.map((ref, idx) => (
                            <li key={idx}>
                              Cômodo: <strong>{ref.nomeComodo}</strong> (Objeto ID: <code>{ref.objId}</code> em {ref.tipo === 'iso' ? 'ISO' : 'Clássico'})
                            </li>
                          ))}
                        </ul>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Botões de Ação */}
          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '0.75rem' }}>
            <button onClick={aoFechar} className="btn-secondary">
              Cancelar
            </button>

            {concluido && totalRefs > 0 && (
              <button
                onClick={() => aoConfirmar(false)}
                className="btn-secondary"
                style={{ border: '1px solid #f59e0b', color: '#fbbf24' }}
                title="Deleta os móveis mas deixa as marcações órfãs nos arquivos dos cômodos"
              >
                Apenas Excluir (Deixar órfão)
              </button>
            )}

            <button
              onClick={() => aoConfirmar(true)}
              disabled={!concluido}
              className="btn-danger"
              style={{ opacity: concluido ? 1 : 0.6, cursor: concluido ? 'pointer' : 'not-allowed' }}
            >
              {totalRefs > 0 ? '🗑️ Excluir e Limpar Cômodos' : '🗑️ Confirmar Exclusão'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// --- Painel de inspeção lateral completo ---

type PropsPainelInspecao = {
  readonly item: ItemValidoCatalogo;
  readonly itensCatalogoAtuais: ItemDoCatalogo[];
  readonly aoFechar: () => void;
  readonly aoExcluir: () => void;
  readonly aoSalvarMovelCompleto: (
    movel: FurnitureDefinition,
    metadata: FurnitureAssetMetadata,
    sprites: Record<string, File>,
  ) => void;
  readonly aoExportarMovelZip: (
    movel: FurnitureDefinition,
    metadata: FurnitureAssetMetadata,
    sprites: Record<string, File>,
  ) => void;
};

type TabId = 'atributos' | 'acoes_efeitos' | 'sprites' | 'ancora_grid' | 'footprint';

function PainelInspecao({
  item,
  itensCatalogoAtuais,
  aoFechar,
  aoExcluir,
  aoSalvarMovelCompleto,
  aoExportarMovelZip,
}: PropsPainelInspecao) {
  const { movel } = item;

  const [nome, setNome] = useState(movel.nome);
  const [descricao, setDescricao] = useState(movel.descricao || '');
  const [preco, setPreco] = useState(movel.preco);
  const [valorDeRevenda, setValorDeRevenda] = useState(movel.valorDeRevenda);
  const [categoria, setCategoria] = useState(movel.categoria);
  const [startYear, setStartYear] = useState(movel.availability.startYear);
  const [endYear, setEndYear] = useState(movel.availability.endYear || '');
  const [tags, setTags] = useState(movel.tags.join(', '));
  const [acoes, setAcoes] = useState<string[]>(movel.acoes);

  const [conforto, setConforto] = useState(movel.efeitos?.conforto || 0);
  const [humor, setHumor] = useState(movel.efeitos?.humor || 0);
  const [energia, setEnergia] = useState(movel.efeitos?.energia || 0);
  const [statusSocial, setStatusSocial] = useState(movel.efeitos?.statusSocial || 0);

  const [estadoAsset, setEstadoAsset] = useState<
    | { tipo: 'carregando' }
    | { tipo: 'disponivel'; metadata: FurnitureAssetMetadata }
    | { tipo: 'ausente' }
  >({ tipo: 'carregando' });

  const [anchorX, setAnchorX] = useState(0.5);
  const [anchorY, setAnchorY] = useState(1.0);
  const [escalaBase, setEscalaBase] = useState(1.0);
  const [rotacoesDisponiveis, setRotacoesDisponiveis] = useState<RotacaoMovel[]>([135]);
  const [footprintPorRotacao, setFootprintPorRotacao] = useState<Record<string, { largura: number; altura: number }>>({
    '135': { largura: movel.tamanhoGrid.largura, altura: movel.tamanhoGrid.altura },
  });
  const [material, setMaterial] = useState('');
  const [spritesPorRotacao, setSpritesPorRotacao] = useState<Record<string, string>>({});

  const [novosSprites, setNovosSprites] = useState<Record<string, File>>({});
  const [spritePreviewUrls, setSpritePreviewUrls] = useState<Record<string, string>>({});

  const [rotacaoPreview, setRotacaoPreview] = useState<RotacaoMovel>(135);
  const [tabAtiva, setTabAtiva] = useState<TabId>('atributos');

  useEffect(() => {
    let cancelado = false;
    setEstadoAsset({ tipo: 'carregando' });
    setNovosSprites({});
    setSpritePreviewUrls({});

    void carregarFurnitureAssetMetadata(movel.assetId).then((metadata) => {
      if (cancelado) return;
      if (metadata) {
        setEstadoAsset({ tipo: 'disponivel', metadata });
        setAnchorX(metadata.anchorX);
        setAnchorY(metadata.anchorY);
        setEscalaBase(metadata.escalaBase);
        setRotacoesDisponiveis(metadata.rotacoesDisponiveis);
        setFootprintPorRotacao(metadata.footprintPorRotacao);
        setMaterial(metadata.material || '');
        setSpritesPorRotacao(metadata.spritesPorRotacao || {});

        const rotaInicial = metadata.rotacoesDisponiveis.includes(135)
          ? 135
          : metadata.rotacoesDisponiveis[0] ?? 135;
        setRotacaoPreview(rotaInicial);
      } else {
        setEstadoAsset({ tipo: 'ausente' });
        setAnchorX(0.5);
        setAnchorY(1.0);
        setEscalaBase(1.0);
        setRotacoesDisponiveis([135]);
        setFootprintPorRotacao({
          '135': { largura: movel.tamanhoGrid.largura, altura: movel.tamanhoGrid.altura },
        });
        setMaterial('');
        setSpritesPorRotacao({});
        setRotacaoPreview(135);
      }
    });

    return () => { cancelado = true; };
  }, [movel.assetId]);

  useEffect(() => {
    setNome(movel.nome);
    setDescricao(movel.descricao || '');
    setPreco(movel.preco);
    setValorDeRevenda(movel.valorDeRevenda);
    setCategoria(movel.categoria);
    setStartYear(movel.availability.startYear);
    setEndYear(movel.availability.endYear || '');
    setTags(movel.tags.join(', '));
    setAcoes(movel.acoes);

    setConforto(movel.efeitos?.conforto || 0);
    setHumor(movel.efeitos?.humor || 0);
    setEnergia(movel.efeitos?.energia || 0);
    setStatusSocial(movel.efeitos?.statusSocial || 0);
  }, [movel]);

  const aoCarregarSpriteLocal = (graus: RotacaoMovel, arquivo: File) => {
    setNovosSprites((prev) => ({ ...prev, [String(graus)]: arquivo }));
    const url = URL.createObjectURL(arquivo);
    setSpritePreviewUrls((prev) => ({ ...prev, [String(graus)]: url }));

    if (!rotacoesDisponiveis.includes(graus)) {
      setRotacoesDisponiveis((prev) => [...prev, graus]);
      setFootprintPorRotacao((prev) => ({
        ...prev,
        [String(graus)]: { largura: movel.tamanhoGrid.largura, altura: movel.tamanhoGrid.altura },
      }));
    }
  };

  const alternarRotacaoDisponivel = (graus: RotacaoMovel) => {
    if (rotacoesDisponiveis.includes(graus)) {
      if (rotacoesDisponiveis.length <= 1) {
        window.alert('Deve haver pelo menos uma rotação ativa no móvel.');
        return;
      }
      setRotacoesDisponiveis((prev) => prev.filter((r) => r !== graus));
      const cpy = { ...footprintPorRotacao };
      delete cpy[String(graus)];
      setFootprintPorRotacao(cpy);
    } else {
      setRotacoesDisponiveis((prev) => [...prev, graus]);
      setFootprintPorRotacao((prev) => ({
        ...prev,
        [String(graus)]: { largura: movel.tamanhoGrid.largura, altura: movel.tamanhoGrid.altura },
      }));
    }
  };

  const salvarTudo = () => {
    const tagList = tags.split(',').map((t) => t.trim()).filter((t) => t.length > 0);
    const efeitosObj: any = {};
    if (conforto !== 0) efeitosObj.conforto = conforto;
    if (humor !== 0) efeitosObj.humor = humor;
    if (energia !== 0) efeitosObj.energia = energia;
    if (statusSocial !== 0) efeitosObj.statusSocial = statusSocial;

    const defFinal: FurnitureDefinition = {
      id: movel.id,
      nome: nome.trim(),
      categoria,
      assetId: movel.assetId,
      tamanhoGrid: {
        largura: footprintPorRotacao[String(rotacaoPreview)]?.largura ?? 1,
        altura: footprintPorRotacao[String(rotacaoPreview)]?.altura ?? 1,
      },
      preco: Number(preco),
      valorDeRevenda: Number(valorDeRevenda),
      acoes,
      efeitos: Object.keys(efeitosObj).length > 0 ? efeitosObj : undefined,
      availability: {
        startYear: Number(startYear),
        endYear: endYear !== '' ? Number(endYear) : undefined,
      },
      tags: tagList,
      descricao: descricao.trim() !== '' ? descricao.trim() : undefined,
    };

    const metaFinal: FurnitureAssetMetadata = {
      assetId: movel.assetId,
      anchorX,
      anchorY,
      escalaBase,
      rotacoesDisponiveis,
      footprintPorRotacao: footprintPorRotacao,
      spritesPorRotacao: spritesPorRotacao,
      material: material.trim() !== '' ? material.trim() : undefined,
      era: anoParaEra(Number(startYear)),
      tags: tagList,
    };

    aoSalvarMovelCompleto(defFinal, metaFinal, novosSprites);
  };

  const exportarZip = () => {
    const tagList = tags.split(',').map((t) => t.trim()).filter((t) => t.length > 0);
    const efeitosObj: any = {};
    if (conforto !== 0) efeitosObj.conforto = conforto;
    if (humor !== 0) efeitosObj.humor = humor;
    if (energia !== 0) efeitosObj.energia = energia;
    if (statusSocial !== 0) efeitosObj.statusSocial = statusSocial;

    const defFinal: FurnitureDefinition = {
      id: movel.id,
      nome: nome.trim(),
      categoria,
      assetId: movel.assetId,
      tamanhoGrid: {
        largura: footprintPorRotacao[String(rotacaoPreview)]?.largura ?? 1,
        altura: footprintPorRotacao[String(rotacaoPreview)]?.altura ?? 1,
      },
      preco: Number(preco),
      valorDeRevenda: Number(valorDeRevenda),
      acoes,
      efeitos: Object.keys(efeitosObj).length > 0 ? efeitosObj : undefined,
      availability: {
        startYear: Number(startYear),
        endYear: endYear !== '' ? Number(endYear) : undefined,
      },
      tags: tagList,
      descricao: descricao.trim() !== '' ? descricao.trim() : undefined,
    };

    const metaFinal: FurnitureAssetMetadata = {
      assetId: movel.assetId,
      anchorX,
      anchorY,
      escalaBase,
      rotacoesDisponiveis,
      footprintPorRotacao: footprintPorRotacao,
      spritesPorRotacao: spritesPorRotacao,
      material: material.trim() !== '' ? material.trim() : undefined,
      era: anoParaEra(Number(startYear)),
      tags: tagList,
    };

    aoExportarMovelZip(defFinal, metaFinal, novosSprites);
  };

  const editado =
    nome !== movel.nome ||
    descricao !== (movel.descricao || '') ||
    preco !== movel.preco ||
    valorDeRevenda !== movel.valorDeRevenda ||
    categoria !== movel.categoria ||
    startYear !== movel.availability.startYear ||
    endYear !== (movel.availability.endYear || '') ||
    tags !== movel.tags.join(', ') ||
    acoes.length !== movel.acoes.length ||
    conforto !== (movel.efeitos?.conforto || 0) ||
    humor !== (movel.efeitos?.humor || 0) ||
    energia !== (movel.efeitos?.energia || 0) ||
    statusSocial !== (movel.efeitos?.statusSocial || 0) ||
    Object.keys(novosSprites).length > 0 ||
    (estadoAsset.tipo === 'disponivel' &&
      (anchorX !== estadoAsset.metadata.anchorX ||
        anchorY !== estadoAsset.metadata.anchorY ||
        escalaBase !== estadoAsset.metadata.escalaBase ||
        rotacoesDisponiveis.length !== estadoAsset.metadata.rotacoesDisponiveis.length ||
        material !== (estadoAsset.metadata.material || '')));

  return (
    <>
      <div onClick={aoFechar} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 50, backdropFilter: 'blur(3px)' }} />
      <div style={{
        position: 'fixed', right: 0, top: 0, bottom: 0, width: 480,
        background: '#121214', borderLeft: '1px solid #202024',
        boxShadow: '-10px 0 30px rgba(0,0,0,0.5)', overflow: 'hidden',
        zIndex: 51, display: 'flex', flexDirection: 'column',
      }}>
        {/* Cabeçalho */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '1.25rem', borderBottom: '1px solid #202024', background: '#18181b',
        }}>
          <div>
            <strong style={{ fontSize: 17, color: '#f5f5f5', display: 'block' }}>{nome || 'Sem Nome'}</strong>
            <span style={{ fontSize: 11, color: '#7c7c8a' }}>ID: {movel.id}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button
              onClick={aoExcluir}
              className="btn-secondary"
              style={{ border: '1px solid #ef4444', color: '#f87171', padding: '4px 10px', fontSize: 12 }}
            >
              Excluir
            </button>
            <button onClick={aoFechar} style={{ border: 'none', background: 'transparent', fontSize: 22, cursor: 'pointer', color: '#8d8d99' }}>✕</button>
          </div>
        </div>

        {/* Abas */}
        <div style={{ display: 'flex', background: '#18181b', borderBottom: '1px solid #202024', padding: '0 0.5rem' }}>
          <button className={`btn-tab ${tabAtiva === 'atributos' ? 'active' : ''}`} onClick={() => setTabAtiva('atributos')}>Atributos</button>
          <button className={`btn-tab ${tabAtiva === 'acoes_efeitos' ? 'active' : ''}`} onClick={() => setTabAtiva('acoes_efeitos')}>Ações/Efeitos</button>
          <button className={`btn-tab ${tabAtiva === 'sprites' ? 'active' : ''}`} onClick={() => setTabAtiva('sprites')}>Sprites</button>
          <button className={`btn-tab ${tabAtiva === 'ancora_grid' ? 'active' : ''}`} onClick={() => setTabAtiva('ancora_grid')}>Âncora/Grid</button>
          <button className={`btn-tab ${tabAtiva === 'footprint' ? 'active' : ''}`} onClick={() => setTabAtiva('footprint')}>Footprint</button>
        </div>

        {/* Conteúdo scrollable */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          {/* Aba Atributos */}
          {tabAtiva === 'atributos' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <label style={estiloLabel}>
                Nome
                <input value={nome} onChange={(e) => setNome(e.target.value)} className="dev-input" />
              </label>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <label style={estiloLabel}>
                  Categoria
                  <select value={categoria} onChange={(e) => setCategoria(e.target.value as any)} className="dev-select">
                    {CATEGORIAS.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                </label>
                <label style={estiloLabel}>
                  Material (Opcional)
                  <input value={material} onChange={(e) => setMaterial(e.target.value)} className="dev-input" placeholder="ex: madeira, metal" />
                </label>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <label style={estiloLabel}>
                  Preço de Compra (R$)
                  <input type="number" value={preco} onChange={(e) => setPreco(Number(e.target.value))} className="dev-input" />
                </label>
                <label style={estiloLabel}>
                  Valor de Revenda (R$)
                  <input type="number" value={valorDeRevenda} onChange={(e) => setValorDeRevenda(Number(e.target.value))} className="dev-input" />
                </label>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <label style={estiloLabel}>
                  Ano Início (Era)
                  <input type="number" value={startYear} onChange={(e) => setStartYear(Number(e.target.value))} className="dev-input" />
                </label>
                <label style={estiloLabel}>
                  Ano Fim (Opcional)
                  <input type="number" value={endYear} onChange={(e) => setEndYear(e.target.value === '' ? '' : Number(e.target.value))} className="dev-input" placeholder="Sempre disponível" />
                </label>
              </div>

              <label style={estiloLabel}>
                Tags (Separadas por vírgula)
                <input value={tags} onChange={(e) => setTags(e.target.value)} className="dev-input" />
              </label>

              <label style={estiloLabel}>
                Descrição
                <textarea
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  className="dev-input"
                  style={{ minHeight: 80, resize: 'vertical', fontFamily: 'sans-serif' }}
                />
              </label>
            </div>
          )}

          {/* Aba Ações e Efeitos */}
          {tabAtiva === 'acoes_efeitos' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <span style={{ ...estiloSubtitulo, marginBottom: 8, display: 'block' }}>Ações Disponíveis</span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {ACOES_PADRAO.map((acaoItem) => {
                    const ativo = acoes.includes(acaoItem);
                    return (
                      <button
                        key={acaoItem}
                        onClick={() => {
                          setAcoes((prev) =>
                            ativo ? prev.filter((a) => a !== acaoItem) : [...prev, acaoItem]
                          );
                        }}
                        style={{
                          background: ativo ? '#1d4ed8' : '#29292e',
                          color: ativo ? '#ffffff' : '#c4c4cc',
                          border: `1px solid ${ativo ? '#3b82f6' : '#38383f'}`,
                          borderRadius: 20,
                          padding: '4px 10px',
                          fontSize: 12,
                          cursor: 'pointer',
                        }}
                      >
                        {acaoItem}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <span style={{ ...estiloSubtitulo, marginBottom: 12, display: 'block' }}>Efeitos Passivos (Máx +3 por atributo)</span>
                <div style={{ display: 'grid', gap: '0.75rem' }}>
                  <label style={estiloSliderLabel}>
                    <span>🛋️ Conforto: {conforto > 0 ? `+${conforto}` : conforto}</span>
                    <input type="range" min="-3" max="3" value={conforto} onChange={(e) => setConforto(Number(e.target.value))} />
                  </label>
                  <label style={estiloSliderLabel}>
                    <span>😊 Humor: {humor > 0 ? `+${humor}` : humor}</span>
                    <input type="range" min="-3" max="3" value={humor} onChange={(e) => setHumor(Number(e.target.value))} />
                  </label>
                  <label style={estiloSliderLabel}>
                    <span>⚡ Energia: {energia > 0 ? `+${energia}` : energia}</span>
                    <input type="range" min="-3" max="3" value={energia} onChange={(e) => setEnergia(Number(e.target.value))} />
                  </label>
                  <label style={estiloSliderLabel}>
                    <span>✨ Status Social: {statusSocial > 0 ? `+${statusSocial}` : statusSocial}</span>
                    <input type="range" min="-3" max="3" value={statusSocial} onChange={(e) => setStatusSocial(Number(e.target.value))} />
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Aba Sprites e Rotações */}
          {tabAtiva === 'sprites' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ display: 'flex', gap: 6, justifyContent: 'center', background: '#1c1c1e', padding: 8, borderRadius: 6 }}>
                {[0, 45, 90, 135, 180, 225, 270, 315].map((graus) => {
                  const ativo = rotacoesDisponiveis.includes(graus as RotacaoMovel);
                  return (
                    <button
                      key={graus}
                      onClick={() => alternarRotacaoDisponivel(graus as RotacaoMovel)}
                      style={{
                        padding: '4px 8px', fontSize: 11,
                        background: ativo ? '#3b82f6' : '#2c2c2e',
                        color: ativo ? '#fff' : '#8e8e93',
                        border: 'none', borderRadius: 4, cursor: 'pointer',
                        fontWeight: 600,
                      }}
                    >
                      {graus}°
                    </button>
                  );
                })}
              </div>

              <div>
                <span style={{ ...estiloSubtitulo, marginBottom: 8, display: 'block' }}>Upload / Sprites por Direção</span>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                  {[
                    { num: 1, dir: 'N', graus: 0 },
                    { num: 2, dir: 'NE', graus: 45 },
                    { num: 3, dir: 'E', graus: 90 },
                    { num: 4, dir: 'SE', graus: 135 },
                    { num: 5, dir: 'S', graus: 180 },
                    { num: 6, dir: 'SW', graus: 225 },
                    { num: 7, dir: 'W', graus: 270 },
                    { num: 8, dir: 'NW', graus: 315 },
                  ].map((slot) => {
                    const ativo = rotacoesDisponiveis.includes(slot.graus as RotacaoMovel);
                    const localFile = novosSprites[String(slot.graus)];
                    const localUrl = spritePreviewUrls[String(slot.graus)];
                    
                    const hasSprite = localFile !== undefined || (estadoAsset.tipo === 'disponivel' && ativo);

                    return (
                      <div
                        key={slot.graus}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => {
                          e.preventDefault();
                          const f = e.dataTransfer.files?.[0];
                          if (f) aoCarregarSpriteLocal(slot.graus as RotacaoMovel, f);
                        }}
                        onClick={() => {
                          const input = document.getElementById(`file-input-${slot.graus}`);
                          if (input) (input as HTMLInputElement).click();
                        }}
                        className="slot-dropzone"
                        style={{
                          opacity: ativo ? 1 : 0.4,
                          borderColor: localFile ? '#10b981' : ativo ? '#323238' : '#1c1c1e',
                        }}
                      >
                        <input
                          id={`file-input-${slot.graus}`}
                          type="file"
                          accept=".webp,.png"
                          style={{ display: 'none' }}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) aoCarregarSpriteLocal(slot.graus as RotacaoMovel, f);
                          }}
                        />
                        <span style={{ fontSize: 11, fontWeight: 'bold', color: '#c4c4cc' }}>{slot.dir}</span>
                        
                        {hasSprite ? (
                          <img
                            src={localUrl || urlImagemAsset(movel.assetId, slot.graus as RotacaoMovel, estadoAsset.tipo === 'disponivel' ? estadoAsset.metadata : undefined)}
                            alt={slot.dir}
                            style={{ width: 44, height: 44, objectFit: 'contain', imageRendering: 'pixelated' }}
                          />
                        ) : (
                          <div style={{ width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#48484a', fontSize: 18 }}>—</div>
                        )}

                        <span style={{ fontSize: 9, color: localFile ? '#34d399' : '#8e8e93' }}>
                          {localFile ? '✓ Novo' : hasSprite ? '✓ Salvo' : 'Drop WebP'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {estadoAsset.tipo === 'disponivel' && (
                <div style={{ marginTop: '0.5rem' }}>
                  <SecaoSequenciaSlots key={movel.assetId} metadata={estadoAsset.metadata} assetId={movel.assetId} />
                </div>
              )}
            </div>
          )}

          {/* Aba Footprint */}
          {tabAtiva === 'footprint' && (
            estadoAsset.tipo === 'disponivel' ? (
              <FootprintEditor
                metadata={estadoAsset.metadata}
                onSalvar={async (novoMetadata) => {
                  try {
                    const resp = await fetch('/__devtools/asset/update-metadata', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ assetId: movel.assetId, metadata: novoMetadata }),
                    });
                    const dados: unknown = await resp.json().catch(() => null);
                    if (!resp.ok) {
                      const err = typeof dados === 'object' && dados !== null && 'erro' in dados
                        ? String((dados as { erro: unknown }).erro)
                        : `HTTP ${resp.status}`;
                      throw new Error(err);
                    }
                    setFootprintPorRotacao(novoMetadata.footprintPorRotacao);
                    setEscalaBase(novoMetadata.escalaBase);
                  } catch (err) {
                    throw err;
                  }
                }}
              />
            ) : (
              <div style={{ color: '#8d8d99', fontSize: 13 }}>
                {estadoAsset.tipo === 'carregando' ? 'Carregando metadata...' : 'Metadata não encontrada para este asset.'}
              </div>
            )
          )}

          {/* Aba Âncora e Grid */}
          {tabAtiva === 'ancora_grid' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <span style={{ ...estiloSubtitulo, marginBottom: 8, display: 'block' }}>Editor de Âncora (SE / Rot{rotacaoPreview}°)</span>
                <InteractiveAnchorCanvas
                  assetId={movel.assetId}
                  rotacao={rotacaoPreview}
                  anchorX={anchorX}
                  anchorY={anchorY}
                  metadata={estadoAsset.tipo === 'disponivel' ? estadoAsset.metadata : undefined}
                  localUrl={spritePreviewUrls[String(rotacaoPreview)]}
                  onAnchorChange={(x, y) => {
                    setAnchorX(x);
                    setAnchorY(y);
                  }}
                />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginTop: 10 }}>
                  <label style={estiloLabel}>
                    Âncora X (0.0 - 1.0)
                    <input type="number" step="0.01" value={anchorX} onChange={(e) => setAnchorX(Number(e.target.value))} className="dev-input" />
                  </label>
                  <label style={estiloLabel}>
                    Âncora Y (0.0 - 1.0)
                    <input type="number" step="0.01" value={anchorY} onChange={(e) => setAnchorY(Number(e.target.value))} className="dev-input" />
                  </label>
                </div>
              </div>

              <div>
                <span style={{ ...estiloSubtitulo, marginBottom: 8, display: 'block' }}>Tamanho do Grid (Footprint)</span>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <label style={estiloLabel}>
                    Largura padrão (tiles)
                    <input
                      type="number"
                      value={footprintPorRotacao[String(rotacaoPreview)]?.largura ?? 1}
                      onChange={(e) => {
                        const val = Math.max(1, Number(e.target.value));
                        setFootprintPorRotacao((prev) => ({
                          ...prev,
                          [String(rotacaoPreview)]: { ...prev[String(rotacaoPreview)]!, largura: val },
                        }));
                      }}
                      className="dev-input"
                    />
                  </label>
                  <label style={estiloLabel}>
                    Altura padrão (tiles)
                    <input
                      type="number"
                      value={footprintPorRotacao[String(rotacaoPreview)]?.altura ?? 1}
                      onChange={(e) => {
                        const val = Math.max(1, Number(e.target.value));
                        setFootprintPorRotacao((prev) => ({
                          ...prev,
                          [String(rotacaoPreview)]: { ...prev[String(rotacaoPreview)]!, altura: val },
                        }));
                      }}
                      className="dev-input"
                    />
                  </label>
                </div>
              </div>

              <div>
                <span style={{ ...estiloSubtitulo, marginBottom: 8, display: 'block' }}>Selecionar rotação para calibrar</span>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {rotacoesDisponiveis.map((rot) => (
                    <button
                      key={rot}
                      onClick={() => setRotacaoPreview(rot)}
                      style={{
                        padding: '4px 10px', fontSize: 12,
                        background: rot === rotacaoPreview ? '#eff6ff' : '#29292e',
                        color: rot === rotacaoPreview ? '#1d4ed8' : '#c4c4cc',
                        border: `1px solid ${rot === rotacaoPreview ? '#2563eb' : '#38383f'}`,
                        borderRadius: 4, cursor: 'pointer',
                      }}
                    >
                      {rot}°
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Rodapé de Ações de Salvamento */}
        <div style={{
          padding: '1.25rem', borderTop: '1px solid #202024', background: '#18181b',
          display: 'flex', flexDirection: 'column', gap: '0.5rem',
        }}>
          {SUPORTA_FILE_SYSTEM_ACCESS ? (
            <button
              onClick={salvarTudo}
              disabled={!editado}
              className="btn-primary"
              style={{ width: '100%', justifyContent: 'center', padding: '10px' }}
            >
              Salvar no Projeto
            </button>
          ) : (
            <div style={{ color: '#d69e2e', fontSize: 11, textAlign: 'center', marginBottom: 4 }}>
              ⚠️ File System Access API ausente. Use Chrome/Edge ou baixe o ZIP.
            </div>
          )}

          <button
            onClick={exportarZip}
            className="btn-secondary"
            style={{ width: '100%', justifyContent: 'center', padding: '10px' }}
          >
            Exportar como ZIP (Download)
          </button>
        </div>
      </div>
    </>
  );
}

// --- Canvas interativo de calibração de âncora ---

type PropsAnchorCanvas = {
  assetId: string;
  rotacao: RotacaoMovel;
  anchorX: number;
  anchorY: number;
  metadata?: FurnitureAssetMetadata;
  localUrl?: string;
  onAnchorChange: (x: number, y: number) => void;
};

function InteractiveAnchorCanvas({
  assetId,
  rotacao,
  anchorX,
  anchorY,
  metadata,
  localUrl,
  onAnchorChange,
}: PropsAnchorCanvas) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [hasError, setHasError] = useState(false);

  const footprint = metadata?.footprintPorRotacao?.[String(rotacao)] ?? { largura: 1, altura: 1 };
  const W_px = footprint.largura * 140;
  const H_px = footprint.altura * 140;

  const url = localUrl || urlImagemAsset(assetId, rotacao, metadata);

  useEffect(() => {
    setHasError(false);
  }, [url]);

  const handlePointerDown = () => {
    setIsDragging(true);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    
    const clamp = (val: number) => Math.max(0, Math.min(1, val));
    onAnchorChange(Number(clamp(x).toFixed(3)), Number(clamp(y).toFixed(3)));
  };

  const handlePointerUp = () => {
    setIsDragging(false);
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', background: '#1c1c1e', padding: '1.5rem', borderRadius: 8 }}>
      <div
        ref={containerRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        style={{
          position: 'relative',
          width: W_px,
          height: H_px,
          cursor: 'crosshair',
          touchAction: 'none',
          userSelect: 'none',
        }}
      >
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: [
            `repeating-linear-gradient(rgba(255,255,255,0.07) 0 1px, transparent 1px 100%)`,
            `repeating-linear-gradient(90deg, rgba(255,255,255,0.07) 0 1px, transparent 1px 100%)`,
          ].join(', '),
          backgroundSize: '35px 35px',
          border: '1px solid rgba(255,255,255,0.1)',
          backgroundColor: '#111',
          borderRadius: 4,
        }} />

        {!hasError ? (
          <img
            src={url}
            alt="Asset Anchor View"
            onError={() => setHasError(true)}
            style={{
              position: 'absolute', inset: 0,
              width: '100%', height: '100%',
              objectFit: 'contain', imageRendering: 'pixelated',
              pointerEvents: 'none',
            }}
          />
        ) : (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#555', fontSize: 12 }}>
            (Sem imagem)
          </div>
        )}

        <div style={{
          position: 'absolute',
          left: `${anchorX * 100}%`,
          top: `${anchorY * 100}%`,
          transform: 'translate(-50%, -50%)',
          pointerEvents: 'none',
        }}>
          <div style={{ position: 'absolute', left: 0, top: -14, bottom: -14, width: 2, background: '#f59e0b' }} />
          <div style={{ position: 'absolute', left: -14, right: -14, top: 0, height: 2, background: '#f59e0b' }} />
          <div style={{
            width: 10, height: 10, borderRadius: '50%',
            border: '2px solid #f59e0b', background: 'rgba(245, 158, 11, 0.4)',
            position: 'absolute', left: -6, top: -6,
          }} />
        </div>
      </div>
    </div>
  );
}

// --- Modal de criação de Novo Móvel ---

type PropsModalNovoMovel = {
  aoFechar: () => void;
  aoCriar: (novoMovel: FurnitureDefinition) => void;
};

function ModalNovoMovel({ aoFechar, aoCriar }: PropsModalNovoMovel) {
  const [id, setId] = useState('');
  const [nome, setNome] = useState('');
  const [categoria, setCategoria] = useState<FurnitureDefinition['categoria']>('assento');
  const [preco, setPreco] = useState(100);
  const [valorDeRevenda, setValorDeRevenda] = useState(50);
  const [era, setEra] = useState<CatalogoId>('nineties');
  const [largura, setLargura] = useState(1);
  const [altura, setAltura] = useState(1);
  const [tags, setTags] = useState('');
  const [descricao, setDescricao] = useState('');
  const [acoes, setAcoes] = useState<string[]>(['sentar']);

  const submeter = (e: React.FormEvent) => {
    e.preventDefault();

    const cleanId = id.trim().toLowerCase().replace(/[^a-z0-9_]/g, '_');
    if (!cleanId) {
      window.alert('Informe um ID válido para o móvel.');
      return;
    }

    const cleanNome = nome.trim();
    if (!cleanNome) {
      window.alert('Informe um nome para o móvel.');
      return;
    }

    const novoMovel: FurnitureDefinition = {
      id: cleanId,
      nome: cleanNome,
      categoria,
      assetId: cleanId,
      tamanhoGrid: { largura, altura },
      preco,
      valorDeRevenda,
      acoes,
      availability: {
        startYear: ANO_INICIAL_POR_CATALOGO[era],
      },
      tags: tags.split(',').map((t) => t.trim()).filter((t) => t.length > 0),
      descricao: descricao.trim() !== '' ? descricao.trim() : undefined,
    };

    aoCriar(novoMovel);
  };

  return (
    <>
      <div onClick={aoFechar} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 60, backdropFilter: 'blur(4px)' }} />
      <div style={{
        position: 'fixed', left: '50%', top: '50%', transform: 'translate(-50%, -50%)',
        width: 500, maxWidth: '90%', maxHeight: '90vh', overflowY: 'auto',
        background: '#121214', border: '1px solid #323238', borderRadius: 8,
        boxShadow: '0 20px 40px rgba(0,0,0,0.6)', zIndex: 61,
        display: 'flex', flexDirection: 'column',
      }}>
        <div style={{ padding: '1.25rem', borderBottom: '1px solid #202024', background: '#18181b', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <strong style={{ fontSize: 16, color: '#f5f5f5' }}>Criar Novo Móvel</strong>
          <button onClick={aoFechar} style={{ border: 'none', background: 'transparent', fontSize: 20, cursor: 'pointer', color: '#8d8d99' }}>✕</button>
        </div>

        <form onSubmit={submeter} style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <label style={estiloLabel}>
              ID Único (snake_case)
              <input value={id} onChange={(e) => setId(e.target.value)} placeholder="ex: cama_solteiro_retro" className="dev-input" required />
            </label>
            <label style={estiloLabel}>
              Nome Comercial
              <input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="ex: Cama de Solteiro Retrô" className="dev-input" required />
            </label>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <label style={estiloLabel}>
              Categoria
              <select value={categoria} onChange={(e) => setCategoria(e.target.value as any)} className="dev-select">
                {CATEGORIAS.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
              </select>
            </label>
            <label style={estiloLabel}>
              Era Inicial
              <select value={era} onChange={(e) => setEra(e.target.value as any)} className="dev-select">
                <option value="eighties">Anos 80 (1985)</option>
                <option value="nineties">Anos 90 (1990)</option>
                <option value="twothousands">Anos 2000 (2000)</option>
                <option value="modern">Moderno (2010)</option>
              </select>
            </label>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <label style={estiloLabel}>
              Preço de Venda (R$)
              <input type="number" value={preco} onChange={(e) => setPreco(Number(e.target.value))} className="dev-input" required />
            </label>
            <label style={estiloLabel}>
              Valor de Revenda (R$)
              <input type="number" value={valorDeRevenda} onChange={(e) => setValorDeRevenda(Number(e.target.value))} className="dev-input" required />
            </label>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <label style={estiloLabel}>
              Largura (Grid Tiles)
              <input type="number" min="1" max="10" value={largura} onChange={(e) => setLargura(Number(e.target.value))} className="dev-input" required />
            </label>
            <label style={estiloLabel}>
              Altura (Grid Tiles)
              <input type="number" min="1" max="10" value={altura} onChange={(e) => setAltura(Number(e.target.value))} className="dev-input" required />
            </label>
          </div>

          <label style={estiloLabel}>
            Ações Iniciais
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 4 }}>
              {ACOES_PADRAO.slice(0, 10).map((acaoItem) => {
                const ativo = acoes.includes(acaoItem);
                return (
                  <button
                    type="button"
                    key={acaoItem}
                    onClick={() => {
                      setAcoes((prev) =>
                        ativo ? prev.filter((a) => a !== acaoItem) : [...prev, acaoItem]
                      );
                    }}
                    style={{
                      background: ativo ? '#1d4ed8' : '#29292e',
                      color: ativo ? '#ffffff' : '#c4c4cc',
                      border: `1px solid ${ativo ? '#3b82f6' : '#38383f'}`,
                      borderRadius: 12,
                      padding: '3px 8px',
                      fontSize: 11,
                      cursor: 'pointer',
                    }}
                  >
                    {acaoItem}
                  </button>
                );
              })}
            </div>
          </label>

          <label style={estiloLabel}>
            Tags (Separadas por vírgula)
            <input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="ex: quarto, retro, sono" className="dev-input" />
          </label>

          <label style={estiloLabel}>
            Descrição
            <textarea value={descricao} onChange={(e) => setDescricao(e.target.value)} className="dev-input" style={{ minHeight: 60, resize: 'vertical' }} />
          </label>

          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
            <button type="button" onClick={aoFechar} className="btn-secondary">Cancelar</button>
            <button type="submit" className="btn-primary">Criar Móvel</button>
          </div>
        </form>
      </div>
    </>
  );
}

// --- Editor de sequência de slots de sprites ---

const SLOTS_SEQUENCIA = [
  { num: 1, direcao: 'N',  graus: 0   },
  { num: 2, direcao: 'NE', graus: 45  },
  { num: 3, direcao: 'E',  graus: 90  },
  { num: 4, direcao: 'SE', graus: 135 },
  { num: 5, direcao: 'S',  graus: 180 },
  { num: 6, direcao: 'SW', graus: 225 },
  { num: 7, direcao: 'W',  graus: 270 },
  { num: 8, direcao: 'NW', graus: 315 },
] as const;

type EstadoEdicaoSlots = {
  modoEdicao: boolean;
  mapeamentoEditado: Record<string, string>;
  slotArrastado: string | undefined;
};

function buildMapeamento(metadata: FurnitureAssetMetadata): Record<string, string> {
  const resultado: Record<string, string> = {};
  if (!metadata) return resultado;
  const rotacoes = Array.isArray(metadata.rotacoesDisponiveis) ? metadata.rotacoesDisponiveis : [];
  for (const slot of SLOTS_SEQUENCIA) {
    if (!rotacoes.includes(slot.graus)) continue;
    const grausStr = String(slot.graus);
    resultado[grausStr] = metadata.spritesPorRotacao?.[grausStr] ?? `${slot.num}.webp`;
  }
  return resultado;
}

type PropsSecaoSequenciaSlots = {
  readonly metadata: FurnitureAssetMetadata;
  readonly assetId: string;
};

function SecaoSequenciaSlots({ metadata, assetId }: PropsSecaoSequenciaSlots) {
  const [mapeamentoPersistido, setMapeamentoPersistido] = useState(() => buildMapeamento(metadata));
  const [estado, setEstado] = useState<EstadoEdicaoSlots>({
    modoEdicao: false,
    mapeamentoEditado: {},
    slotArrastado: undefined,
  });
  const [mensagemSalvar, setMensagemSalvar] = useState<string | undefined>();

  const mapeamentoAtual = estado.modoEdicao ? estado.mapeamentoEditado : mapeamentoPersistido;

  const iniciarEdicao = () => {
    setEstado({ modoEdicao: true, mapeamentoEditado: { ...mapeamentoPersistido }, slotArrastado: undefined });
    setMensagemSalvar(undefined);
  };

  const cancelar = () => {
    setEstado({ modoEdicao: false, mapeamentoEditado: {}, slotArrastado: undefined });
    setMensagemSalvar(undefined);
  };

  const aoIniciarArraste = (grausStr: string) =>
    setEstado((s) => ({ ...s, slotArrastado: grausStr }));

  const aoSoltarSobre = (grausAlvo: string) => {
    setEstado((s) => {
      const grausOrigem = s.slotArrastado;
      if (!grausOrigem || grausOrigem === grausAlvo) return { ...s, slotArrastado: undefined };
      const v1 = s.mapeamentoEditado[grausOrigem];
      const v2 = s.mapeamentoEditado[grausAlvo];
      if (v1 === undefined || v2 === undefined) return { ...s, slotArrastado: undefined };
      return {
        ...s,
        slotArrastado: undefined,
        mapeamentoEditado: { ...s.mapeamentoEditado, [grausOrigem]: v2, [grausAlvo]: v1 },
      };
    });
  };

  const salvar = async () => {
    const metadataAtualizado: FurnitureAssetMetadata = { ...metadata, spritesPorRotacao: estado.mapeamentoEditado };
    setMensagemSalvar(undefined);
    try {
      const resp = await fetch('/__devtools/asset/update-metadata', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assetId, metadata: metadataAtualizado }),
      });
      const dados: unknown = await resp.json();
      if (!resp.ok) {
        const erro =
          typeof dados === 'object' && dados !== null && 'erro' in dados
            ? String((dados as { erro: unknown }).erro)
            : `HTTP ${resp.status}`;
        throw new Error(erro);
      }
      setMapeamentoPersistido({ ...estado.mapeamentoEditado });
      setEstado({ modoEdicao: false, mapeamentoEditado: {}, slotArrastado: undefined });
      setMensagemSalvar('Sequência salva com sucesso.');
    } catch (err) {
      setMensagemSalvar(`Erro ao salvar: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  return (
    <div>
      <span style={{ ...estiloSubtitulo, marginBottom: 8, display: 'block' }}>Reordenar Sequência de Sprites</span>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.4rem' }}>
          {SLOTS_SEQUENCIA.map((slot) => {
            const grausStr = String(slot.graus);
            const arquivo: string | undefined = mapeamentoAtual[grausStr];
            const estaArrastando = estado.slotArrastado === grausStr;
            const temSprite = arquivo !== undefined;
            const draggable = estado.modoEdicao && temSprite;

            return (
              <div
                key={grausStr}
                draggable={draggable}
                onDragStart={draggable ? () => aoIniciarArraste(grausStr) : undefined}
                onDragOver={draggable ? (e) => { e.preventDefault(); } : undefined}
                onDrop={draggable ? () => aoSoltarSobre(grausStr) : undefined}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 2,
                  padding: 4,
                  borderRadius: 4,
                  border: estado.modoEdicao
                    ? `1.5px solid ${estaArrastando ? '#3b82f6' : '#323238'}`
                    : '1px solid #202024',
                  background: estaArrastando ? '#1e1e24' : '#18181b',
                  cursor: draggable ? 'grab' : 'default',
                  opacity: estaArrastando ? 0.6 : 1,
                }}
              >
                <div style={{ position: 'relative' }}>
                  {temSprite ? (
                    <img
                      src={`/content/furniture-assets/${assetId}/${arquivo}`}
                      alt={`slot ${slot.num} ${slot.direcao}`}
                      style={{ width: 40, height: 40, objectFit: 'contain', imageRendering: 'pixelated', display: 'block' }}
                    />
                  ) : (
                    <div style={{
                      width: 40, height: 40, background: '#2c2c2e', borderRadius: 2,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 14, color: '#48484a',
                    }}>
                      —
                    </div>
                  )}
                  <span style={{
                    position: 'absolute', top: -4, right: -4,
                    background: '#3a3a3c', color: '#fff',
                    borderRadius: '50%', width: 14, height: 14,
                    fontSize: 9, fontWeight: 700, lineHeight: 1,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {slot.num}
                  </span>
                </div>
                <span style={{ fontSize: 10, color: '#8e8e93' }}>{slot.direcao}</span>
              </div>
            );
          })}
        </div>

        <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', flexWrap: 'wrap' }}>
          {!estado.modoEdicao ? (
            <button onClick={iniciarEdicao} className="btn-secondary" style={{ padding: '4px 10px', fontSize: 12 }}>
              Editar ordenação
            </button>
          ) : (
            <>
              <button onClick={() => { void salvar(); }} className="btn-primary" style={{ padding: '4px 10px', fontSize: 12 }}>
                Salvar ordenação
              </button>
              <button onClick={cancelar} className="btn-secondary" style={{ padding: '4px 10px', fontSize: 12 }}>
                Cancelar
              </button>
            </>
          )}
          {mensagemSalvar !== undefined && (
            <span style={{ fontSize: 11, color: mensagemSalvar.startsWith('Erro') ? '#f87171' : '#34d399' }}>
              {mensagemSalvar}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// --- Estilos compartilhados ---

const estiloLabel: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 4,
  fontSize: 12,
  color: '#c4c4cc',
  fontWeight: '600',
};

const estiloSubtitulo: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 700,
  color: '#8d8d99',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
};

const estiloSliderLabel: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  fontSize: 13,
  color: '#e1e1e6',
  background: '#1c1c1e',
  padding: '6px 10px',
  borderRadius: 6,
};

// --- Cartão de erro de schema ---
type PropsCartaoComErro = { readonly bruto: unknown; readonly erro: z.ZodError };

function CartaoDeMovelComErro({ bruto, erro }: PropsCartaoComErro) {
  const nome = (bruto !== null && typeof bruto === 'object' && 'nome' in bruto)
    ? String((bruto as Record<string, unknown>)['nome'])
    : 'Item inválido';

  return (
    <div style={{
      background: '#2c1e1a', border: '2px solid #ef4444', borderRadius: 8,
      padding: '0.75rem', fontSize: 13, color: '#f5f5f5',
    }}>
      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.5rem' }}>
        <span>⚠️</span>
        <strong style={{ color: '#fca5a5' }}>{nome}</strong>
      </div>
      <div style={{ color: '#fca5a5', fontSize: 12 }}>
        {erro.issues.slice(0, 3).map((issue, i) => (
          <div key={i} style={{ wordBreak: 'break-all', marginBottom: '2px' }}>
            <strong>{issue.path.join('.') || 'raiz'}</strong>: {issue.message}
          </div>
        ))}
        {erro.issues.length > 3 && <div>+{erro.issues.length - 3} outros erros de validação</div>}
      </div>
    </div>
  );
}
