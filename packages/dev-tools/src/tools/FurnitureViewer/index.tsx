import { useState, useRef, useEffect, type ChangeEvent } from 'react';
import { z } from 'zod';
import { FurnitureDefinition } from '@lifesim/core';
import type { FurnitureAssetMetadata, RotacaoMovel } from '@core/schemas/furnitureAsset';
import { carregarFurnitureAssetMetadata, urlImagemAsset } from '../../shared/SchemaLoader';
import {
  escreverArquivo,
  obterPastaRaiz,
  selecionarPastaRaiz,
} from '../../shared/ProjetoHandle';
import { CartaoDeMovel } from './FurnitureCard';

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

const estiloSelect: React.CSSProperties = {
  background: '#ffffff',
  color: '#374151',
  border: '1px solid #d1d5db',
  borderRadius: 6,
  padding: '0.3rem 0.5rem',
  fontSize: 12,
};

const estiloCampoEdicao: React.CSSProperties = {
  ...estiloSelect,
  width: '100%',
  boxSizing: 'border-box',
};

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
  origemCatalogo: OrigemCatalogo,
  destinoCatalogo: OrigemCatalogo,
): Promise<void> {
  const salvoViaServidor = await salvarMovelViaServidor(movel, origemCatalogo, destinoCatalogo);
  if (salvoViaServidor) return;

  const raiz = await obterOuSelecionarPastaRaiz();
  const origemPasta = origemCatalogo.caminho.slice(0, -1);
  const origemArquivo = origemCatalogo.caminho[origemCatalogo.caminho.length - 1];
  const destinoPasta = destinoCatalogo.caminho.slice(0, -1);
  const destinoArquivo = destinoCatalogo.caminho[destinoCatalogo.caminho.length - 1];

  if (origemArquivo === undefined || destinoArquivo === undefined) {
    throw new Error('Catalogo de origem ou destino invalido.');
  }

  const pastaOrigem = await obterPastaPorCaminho(raiz, origemPasta);
  const textoOrigem = await lerArquivoTextoLocal(pastaOrigem, origemArquivo);
  const dadosOrigem: unknown = JSON.parse(textoOrigem);
  if (!Array.isArray(dadosOrigem)) {
    throw new Error(`Catalogo ${origemCatalogo.rotulo} nao e uma lista JSON.`);
  }

  const origemAtualizada = dadosOrigem.filter((entrada) => !entradaPertenceAoMovel(entrada, movel));
  if (origemAtualizada.length === dadosOrigem.length) {
    throw new Error(`Movel ${movel.id} nao foi encontrado no catalogo ${origemCatalogo.rotulo}.`);
  }

  if (origemCatalogo.id === destinoCatalogo.id) {
    const catalogoAtualizado = dadosOrigem.map((entrada) =>
      entradaPertenceAoMovel(entrada, movel) ? movel : entrada,
    );
    await escreverArquivo(pastaOrigem, origemArquivo, `${JSON.stringify(catalogoAtualizado, null, 2)}\n`);
    return;
  }

  const pastaDestino = await obterPastaPorCaminho(raiz, destinoPasta);
  const textoDestino = await lerArquivoTextoLocal(pastaDestino, destinoArquivo);
  const dadosDestino: unknown = JSON.parse(textoDestino);
  if (!Array.isArray(dadosDestino)) {
    throw new Error(`Catalogo ${destinoCatalogo.rotulo} nao e uma lista JSON.`);
  }

  const destinoSemDuplicata = dadosDestino.filter((entrada) => !entradaPertenceAoMovel(entrada, movel));
  await escreverArquivo(pastaOrigem, origemArquivo, `${JSON.stringify(origemAtualizada, null, 2)}\n`);
  await escreverArquivo(pastaDestino, destinoArquivo, `${JSON.stringify([...destinoSemDuplicata, movel], null, 2)}\n`);
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

    if (resposta.status === 404) {
      return false;
    }

    const dados: unknown = await resposta.json();
    if (!resposta.ok) {
      const erro = typeof dados === 'object' && dados !== null && 'erro' in dados
        ? String((dados as { erro: unknown }).erro)
        : `HTTP ${resposta.status}`;
      throw new Error(erro);
    }

    return true;
  } catch (erro) {
    if (erro instanceof SyntaxError) return false;
    throw erro;
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

    if (resposta.status === 404) {
      return false;
    }

    const dados: unknown = await resposta.json();
    if (!resposta.ok) {
      const erro = typeof dados === 'object' && dados !== null && 'erro' in dados
        ? String((dados as { erro: unknown }).erro)
        : `HTTP ${resposta.status}`;
      throw new Error(erro);
    }

    return true;
  } catch (erro) {
    if (erro instanceof SyntaxError) return false;
    throw erro;
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
  const inputArquivoRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let cancelado = false;

    const carregarCatalogosPadrao = async () => {
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

      if (cancelado) return;

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

    void carregarCatalogosPadrao();

    return () => { cancelado = true; };
  }, []);

  const aoCarregarArquivo = async (e: ChangeEvent<HTMLInputElement>) => {
    const arquivo = e.target.files?.[0];
    if (!arquivo) return;
    setMensagem('Carregando...');
    try {
      const { itens, mensagem: msg } = await parsearCatalogo(arquivo);
      setItensCatalogo(itens);
      setMensagem(msg);
    } catch (err) {
      setMensagem(`Erro: ${err instanceof Error ? err.message : String(err)}`);
    }
    if (e.target) e.target.value = '';
  };

  const aoExcluirMovel = async (item: ItemValidoCatalogo) => {
    if (item.origemCatalogo === undefined) {
      setMensagem('Este movel veio de um arquivo carregado manualmente; remova no arquivo de origem.');
      return;
    }

    const confirmado = window.confirm(
      `Excluir "${item.movel.nome}"?\n\nIsso remove a entrada do catalogo ${item.origemCatalogo.rotulo} e apaga content/furniture-assets/${item.movel.assetId}.`,
    );
    if (!confirmado) return;

    setMensagem(`Excluindo ${item.movel.nome}...`);
    try {
      await removerMovelDoProjeto(item.movel, item.origemCatalogo);
      setItensCatalogo((atuais) => atuais.filter((atual) => {
        if (!atual.ok) return true;
        return !(
          atual.movel.id === item.movel.id
          && atual.origemCatalogo?.id === item.origemCatalogo?.id
        );
      }));
      setItemInspecionado(undefined);
      setMensagem(`${item.movel.nome} excluido do catalogo e dos assets.`);
    } catch (erro) {
      const mensagemErro = `Erro ao excluir: ${erro instanceof Error ? erro.message : String(erro)}`;
      setMensagem(mensagemErro);
      window.alert(mensagemErro);
    }
  };

  const aoSalvarDetalhesMovel = async (
    item: ItemValidoCatalogo,
    nome: string,
    catalogoId: CatalogoId,
  ) => {
    if (item.origemCatalogo === undefined) {
      setMensagem('Este movel veio de um arquivo carregado manualmente; edite no arquivo de origem.');
      return;
    }

    const nomeLimpo = nome.trim();
    if (!nomeLimpo) {
      const mensagemErro = 'Informe um nome para salvar o movel.';
      setMensagem(mensagemErro);
      window.alert(mensagemErro);
      return;
    }

    const destinoCatalogo = obterCatalogoPorId(catalogoId);
    const movelAtualizado = moverMovelParaCatalogo(item.movel, catalogoId, nomeLimpo);
    setMensagem(`Salvando ${nomeLimpo}...`);

    try {
      await salvarMovelNoProjeto(movelAtualizado, item.origemCatalogo, destinoCatalogo);
      const itemAtualizado: ItemValidoCatalogo = {
        ok: true,
        movel: movelAtualizado,
        origemCatalogo: destinoCatalogo,
      };

      setItensCatalogo((atuais) => {
        const semAtual = atuais.filter((atual) => {
          if (!atual.ok) return true;
          return !(atual.movel.id === item.movel.id && atual.movel.assetId === item.movel.assetId);
        });
        return [...semAtual, itemAtualizado];
      });
      setItemInspecionado(itemAtualizado);
      setMensagem(`${nomeLimpo} salvo em ${destinoCatalogo.rotulo}.`);
    } catch (erro) {
      const mensagemErro = `Erro ao salvar: ${erro instanceof Error ? erro.message : String(erro)}`;
      setMensagem(mensagemErro);
      window.alert(mensagemErro);
    }
  };

  const itensFiltrados = itensCatalogo.filter((item) =>
    itemPassaFiltros(item, filtroEra, filtroCategoria, precoMin, precoMax, termoBusca),
  );
  const numValidos = itensCatalogo.filter((i) => i.ok).length;

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      {/* Barra de filtros */}
      <div style={{
        display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center',
        padding: '0.75rem 1rem', background: '#ffffff', borderBottom: '1px solid #e5e7eb',
        justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={() => inputArquivoRef.current?.click()}
            style={{
              background: '#2563eb', color: '#fff', border: 'none', borderRadius: 6,
              padding: '0.35rem 0.75rem', cursor: 'pointer', fontSize: 12,
            }}
          >
            Carregar catálogo
          </button>
          <input ref={inputArquivoRef} type="file" accept=".json" onChange={aoCarregarArquivo} style={{ display: 'none' }} />

          <select value={filtroEra} onChange={(e) => setFiltroEra(e.target.value as FiltroEra)} style={estiloSelect}>
            <option value="todos">Todas as eras</option>
            <option value="eighties">Anos 80</option>
            <option value="nineties">Anos 90</option>
            <option value="twothousands">Anos 2000</option>
            <option value="modern">Moderno (2010+)</option>
          </select>

          <select value={filtroCategoria} onChange={(e) => setFiltroCategoria(e.target.value as FiltroCategoria)} style={estiloSelect}>
            <option value="todos">Todas as categorias</option>
            {CATEGORIAS.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
          </select>

          <span style={{ fontSize: 12, color: '#6b7280' }}>Preço:</span>
          <input
            type="number" placeholder="min" value={precoMin || ''}
            onChange={(e) => setPrecoMin(Number(e.target.value))}
            style={{ ...estiloSelect, width: 80 }}
          />
          <input
            type="number" placeholder="max" value={precoMax || ''}
            onChange={(e) => setPrecoMax(Number(e.target.value))}
            style={{ ...estiloSelect, width: 80 }}
          />
          <input
            type="text" placeholder="Buscar nome/tag…"
            value={termoBusca} onChange={(e) => setTermoBusca(e.target.value)}
            style={{ ...estiloSelect, width: 160 }}
          />
        </div>
        <span style={{ fontSize: 12, color: '#6b7280', whiteSpace: 'nowrap' }}>
          {itensFiltrados.length}/{numValidos} · {mensagem}
        </span>
      </div>

      {/* Grid de cards */}
      {itensCatalogo.length === 0 ? (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', fontSize: 14 }}>
          Carregue um arquivo{' '}
          <code style={{ margin: '0 0.3rem', color: '#2563eb' }}>content/furniture/**/*.json</code>
        </div>
      ) : (
        <div style={{
          flex: 1, overflow: 'auto', padding: '1rem',
          display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
          gap: '0.75rem', alignContent: 'start',
        }}>
          {itensFiltrados.map((item, idx) =>
            item.ok ? (
              <CartaoDeMovel
                key={item.movel.id}
                movel={item.movel}
                aoClicar={() => setItemInspecionado(item)}
              />
            ) : (
              <CartaoDeMovelComErro key={idx} bruto={item.bruto} erro={item.erro} />
            )
          )}
          {itensFiltrados.length === 0 && (
            <div style={{ gridColumn: '1 / -1', color: '#9ca3af', fontSize: 14, textAlign: 'center', paddingTop: '2rem' }}>
              Nenhum móvel corresponde aos filtros
            </div>
          )}
        </div>
      )}

      {/* Drawer de inspeção */}
      {itemInspecionado !== undefined && (
        <PainelInspecao
          item={itemInspecionado}
          aoFechar={() => setItemInspecionado(undefined)}
          aoExcluir={() => void aoExcluirMovel(itemInspecionado)}
          aoSalvarDetalhes={(nome, catalogoId) => void aoSalvarDetalhesMovel(itemInspecionado, nome, catalogoId)}
        />
      )}
    </div>
  );
}

// --- Cartão de erro de schema ---

type PropsCartaoComErro = { readonly bruto: unknown; readonly erro: z.ZodError };

function CartaoDeMovelComErro({ bruto, erro }: PropsCartaoComErro) {
  const nome = (bruto !== null && typeof bruto === 'object' && 'nome' in bruto)
    ? String((bruto as Record<string, unknown>)['nome'])
    : 'Item inválido';

  return (
    <div style={{
      background: '#fff7ed', border: '2px solid #f59e0b', borderRadius: 8,
      padding: '0.75rem', fontSize: 12, color: '#374151',
    }}>
      <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', marginBottom: '0.4rem' }}>
        <span>⚠️</span>
        <strong style={{ color: '#d97706' }}>{nome}</strong>
      </div>
      <div style={{ color: '#dc2626', fontSize: 11 }}>
        {erro.issues.slice(0, 3).map((issue, i) => (
          <div key={i}>{issue.path.join('.') || 'raiz'}: {issue.message}</div>
        ))}
        {erro.issues.length > 3 && <div>+{erro.issues.length - 3} outros erros</div>}
      </div>
    </div>
  );
}

// --- Painel de inspeção lateral ---

const TAMANHO_TILE_INSPECAO = 128;

type PropsPainelInspecao = {
  readonly item: ItemValidoCatalogo;
  readonly aoFechar: () => void;
  readonly aoExcluir: () => void;
  readonly aoSalvarDetalhes: (nome: string, catalogoId: CatalogoId) => void;
};

function PainelInspecao({ item, aoFechar, aoExcluir, aoSalvarDetalhes }: PropsPainelInspecao) {
  const { movel } = item;
  const [estadoAsset, setEstadoAsset] = useState<
    | { tipo: 'carregando' }
    | { tipo: 'disponivel'; metadata: FurnitureAssetMetadata }
    | { tipo: 'ausente' }
  >({ tipo: 'carregando' });
  const [rotacaoAtual, setRotacaoAtual] = useState<RotacaoMovel>(0);
  const [imagemComErro, setImagemComErro] = useState(false);
  const [nomeEditado, setNomeEditado] = useState(movel.nome);
  const [catalogoEditado, setCatalogoEditado] = useState<CatalogoId>(item.origemCatalogo?.id ?? anoParaEra(movel.availability.startYear));

  useEffect(() => {
    let cancelado = false;
    setEstadoAsset({ tipo: 'carregando' });
    setImagemComErro(false);

    void carregarFurnitureAssetMetadata(movel.assetId).then((metadata) => {
      if (cancelado) return;
      if (metadata) {
        setRotacaoAtual(metadata.rotacoesDisponiveis[0] ?? 0);
        setEstadoAsset({ tipo: 'disponivel', metadata });
      } else {
        setEstadoAsset({ tipo: 'ausente' });
      }
    });

    return () => { cancelado = true; };
  }, [movel.assetId]);

  useEffect(() => {
    setNomeEditado(movel.nome);
    setCatalogoEditado(item.origemCatalogo?.id ?? anoParaEra(movel.availability.startYear));
  }, [item.origemCatalogo?.id, movel.availability.startYear, movel.nome]);

  const efeitosAtivos = Object.entries(movel.efeitos ?? {}).filter(([, v]) => v !== undefined && v !== 0);
  const detalhesAlterados =
    nomeEditado.trim() !== movel.nome
    || catalogoEditado !== (item.origemCatalogo?.id ?? anoParaEra(movel.availability.startYear));

  return (
    <>
      {/* Overlay */}
      <div
        onClick={aoFechar}
        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', zIndex: 50 }}
      />
      {/* Painel */}
      <div style={{
        position: 'fixed', right: 0, top: 0, bottom: 0, width: 460,
        background: '#ffffff', boxShadow: '-4px 0 24px rgba(0,0,0,0.15)',
        overflow: 'auto', zIndex: 51, display: 'flex', flexDirection: 'column',
      }}>
        {/* Topo */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '1rem', borderBottom: '1px solid #e5e7eb', position: 'sticky', top: 0, background: '#fff',
        }}>
          <strong style={{ fontSize: 16 }}>{movel.nome}</strong>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button
              onClick={aoExcluir}
              title="Remove do catalogo e apaga a pasta do asset"
              style={{
                border: '1px solid #fecaca',
                background: '#fef2f2',
                color: '#b91c1c',
                borderRadius: 6,
                padding: '0.3rem 0.55rem',
                fontSize: 12,
                cursor: 'pointer',
              }}
            >
              Excluir
            </button>
            <button
              onClick={aoFechar}
              style={{ border: 'none', background: 'transparent', fontSize: 20, cursor: 'pointer', color: '#6b7280' }}
            >
              ✕
            </button>
          </div>
        </div>

        <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Preview grande */}
          <SecaoPreviewInspecao
            estadoAsset={estadoAsset}
            assetId={movel.assetId}
            rotacaoAtual={rotacaoAtual}
            imagemComErro={imagemComErro}
            aoErroImagem={() => setImagemComErro(true)}
            aoAlterarRotacao={(rot) => { setRotacaoAtual(rot); setImagemComErro(false); }}
          />

          <Secao titulo="Edição rápida">
            <div style={{ display: 'grid', gap: '0.5rem' }}>
              <label style={{ display: 'grid', gap: 4, fontSize: 12, color: '#4b5563' }}>
                Nome
                <input
                  value={nomeEditado}
                  onChange={(e) => setNomeEditado(e.target.value)}
                  style={estiloCampoEdicao}
                />
              </label>
              <label style={{ display: 'grid', gap: 4, fontSize: 12, color: '#4b5563' }}>
                Catálogo
                <select
                  value={catalogoEditado}
                  onChange={(e) => setCatalogoEditado(e.target.value as CatalogoId)}
                  style={estiloCampoEdicao}
                >
                  {CATALOGOS_PADRAO.map((catalogo) => (
                    <option key={catalogo.id} value={catalogo.id}>{catalogo.rotulo}</option>
                  ))}
                </select>
              </label>
              <button
                onClick={() => aoSalvarDetalhes(nomeEditado, catalogoEditado)}
                disabled={!detalhesAlterados || nomeEditado.trim().length === 0}
                style={{
                  justifySelf: 'start',
                  border: '1px solid #bfdbfe',
                  background: detalhesAlterados ? '#eff6ff' : '#f9fafb',
                  color: detalhesAlterados ? '#1d4ed8' : '#9ca3af',
                  borderRadius: 6,
                  padding: '0.35rem 0.7rem',
                  fontSize: 12,
                  cursor: detalhesAlterados ? 'pointer' : 'default',
                }}
              >
                Salvar alterações
              </button>
            </div>
          </Secao>

          {/* Dados do FurnitureDefinition */}
          <Secao titulo="FurnitureDefinition">
            <CampoInfo rotulo="ID" valor={movel.id} />
            <CampoInfo rotulo="Categoria" valor={movel.categoria} />
            <CampoInfo rotulo="Era" valor={
              movel.availability.endYear !== undefined
                ? `${movel.availability.startYear}–${movel.availability.endYear}`
                : `${movel.availability.startYear}+`
            } />
            <CampoInfo rotulo="Preço" valor={`R$${movel.preco}`} />
            <CampoInfo rotulo="Revenda" valor={`R$${movel.valorDeRevenda}`} />
            <CampoInfo rotulo="Grid" valor={`${movel.tamanhoGrid.largura}×${movel.tamanhoGrid.altura} tiles`} />
            <CampoInfo rotulo="Ações" valor={movel.acoes.length > 0 ? movel.acoes.join(', ') : '⚠️ nenhuma'} />
            {efeitosAtivos.length > 0 && (
              <CampoInfo rotulo="Efeitos" valor={
                efeitosAtivos.map(([k, v]) => `${k} ${(v as number) > 0 ? '+' : ''}${String(v)}`).join(' · ')
              } />
            )}
            {movel.tags.length > 0 && (
              <CampoInfo rotulo="Tags" valor={movel.tags.join(', ')} />
            )}
            {movel.descricao && <CampoInfo rotulo="Descrição" valor={movel.descricao} />}
          </Secao>

          {/* Dados do FurnitureAssetMetadata */}
          {estadoAsset.tipo === 'disponivel' && (
            <Secao titulo="FurnitureAssetMetadata">
              <CampoInfo rotulo="assetId" valor={estadoAsset.metadata.assetId} />
              <CampoInfo rotulo="Âncora" valor={`${estadoAsset.metadata.anchorX} × ${estadoAsset.metadata.anchorY}`} />
              <CampoInfo rotulo="Escala base" valor={String(estadoAsset.metadata.escalaBase)} />
              <CampoInfo rotulo="Rotações" valor={estadoAsset.metadata.rotacoesDisponiveis.map((r) => `${r}°`).join(', ')} />
              {estadoAsset.metadata.spritesPorRotacao !== undefined && (
                <CampoInfo
                  rotulo="Sprites"
                  valor={Object.entries(estadoAsset.metadata.spritesPorRotacao)
                    .map(([rotacao, arquivo]) => `${rotacao}°: ${arquivo}`)
                    .join(' · ')}
                />
              )}
              {estadoAsset.metadata.material && <CampoInfo rotulo="Material" valor={estadoAsset.metadata.material} />}
              {estadoAsset.metadata.era && <CampoInfo rotulo="Era" valor={estadoAsset.metadata.era} />}
              {estadoAsset.metadata.tags.length > 0 && (
                <CampoInfo rotulo="Tags" valor={estadoAsset.metadata.tags.join(', ')} />
              )}
            </Secao>
          )}

          {estadoAsset.tipo === 'ausente' && (
            <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 6, padding: '0.75rem', fontSize: 12 }}>
              <strong style={{ color: '#d97706' }}>⚠️ Asset não encontrado</strong>
              <div style={{ color: '#6b7280', marginTop: '0.25rem' }}>
                Pasta esperada: <code style={{ color: '#374151' }}>content/furniture-assets/{movel.assetId}/</code>
              </div>
            </div>
          )}

          {/* Caminho do asset */}
          <Secao titulo="Localização">
            <div style={{ fontSize: 12, color: '#6b7280', wordBreak: 'break-all' }}>
              📁 <code style={{ color: '#374151' }}>content/furniture-assets/{movel.assetId}/</code>
            </div>
          </Secao>
        </div>
      </div>
    </>
  );
}

type PropsSecaoPreviewInspecao = {
  readonly estadoAsset: { tipo: 'carregando' } | { tipo: 'disponivel'; metadata: FurnitureAssetMetadata } | { tipo: 'ausente' };
  readonly assetId: string;
  readonly rotacaoAtual: RotacaoMovel;
  readonly imagemComErro: boolean;
  readonly aoErroImagem: () => void;
  readonly aoAlterarRotacao: (rot: RotacaoMovel) => void;
};

function SecaoPreviewInspecao({ estadoAsset, assetId, rotacaoAtual, imagemComErro, aoErroImagem, aoAlterarRotacao }: PropsSecaoPreviewInspecao) {
  if (estadoAsset.tipo === 'carregando') {
    return (
      <div style={{ height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', fontSize: 13 }}>
        carregando asset…
      </div>
    );
  }

  if (estadoAsset.tipo === 'ausente' || imagemComErro) {
    return (
      <div style={{
        height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: '#f9fafb', borderRadius: 6, border: '1px dashed #d1d5db',
        color: '#9ca3af', fontSize: 13,
      }}>
        Sem asset disponível
      </div>
    );
  }

  const { metadata } = estadoAsset;
  const footprint = metadata.footprintPorRotacao[String(rotacaoAtual)] ?? { largura: 1, altura: 1 };
  const larguraPx = footprint.largura * TAMANHO_TILE_INSPECAO;
  const alturaPx = footprint.altura * TAMANHO_TILE_INSPECAO;
  const todasRotacoes: RotacaoMovel[] = [0, 45, 90, 135, 180, 225, 270, 315];
  const rotacoesDisponiveis = todasRotacoes.filter((rot) => metadata.rotacoesDisponiveis.includes(rot));
  const podeGirar = rotacoesDisponiveis.length > 1;

  const irParaAnterior = () => {
    if (!podeGirar) return;
    const indiceAtual = rotacoesDisponiveis.indexOf(rotacaoAtual);
    const indiceSeguro = indiceAtual >= 0 ? indiceAtual : 0;
    const anterior = rotacoesDisponiveis[(indiceSeguro - 1 + rotacoesDisponiveis.length) % rotacoesDisponiveis.length];
    if (anterior !== undefined) aoAlterarRotacao(anterior);
  };

  const irParaProxima = () => {
    if (!podeGirar) return;
    const indiceAtual = rotacoesDisponiveis.indexOf(rotacaoAtual);
    const indiceSeguro = indiceAtual >= 0 ? indiceAtual : 0;
    const proxima = rotacoesDisponiveis[(indiceSeguro + 1) % rotacoesDisponiveis.length];
    if (proxima !== undefined) aoAlterarRotacao(proxima);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
      <div style={{ maxWidth: '100%', overflow: 'auto', padding: '0.25rem' }}>
        <div style={{ position: 'relative', width: larguraPx, height: alturaPx }}>
          <div style={{
            position: 'absolute', inset: 0,
            backgroundImage: [
              `repeating-linear-gradient(rgba(100,100,100,0.2) 0 1px, transparent 1px 100%)`,
              `repeating-linear-gradient(90deg, rgba(100,100,100,0.2) 0 1px, transparent 1px 100%)`,
            ].join(', '),
            backgroundSize: `${TAMANHO_TILE_INSPECAO}px ${TAMANHO_TILE_INSPECAO}px`,
            border: '1px solid rgba(100,100,100,0.2)',
            borderRadius: 2,
            backgroundColor: '#f3f4f6',
          }} />
          <img
            src={urlImagemAsset(assetId, rotacaoAtual, metadata)}
            alt={`${assetId} rot${rotacaoAtual}`}
            onError={aoErroImagem}
            style={{
              position: 'absolute', inset: 0,
              width: '100%', height: '100%',
              objectFit: 'contain', imageRendering: 'pixelated',
            }}
          />
        </div>
      </div>

      {/* Controles de rotação */}
      {rotacoesDisponiveis.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
          <button
            onClick={irParaAnterior}
            disabled={!podeGirar}
            title="Rotação anterior"
            style={{
              width: 38, height: 32,
              border: '1px solid #d1d5db',
              borderRadius: 6,
              background: '#ffffff',
              color: '#374151',
              fontSize: 18,
              lineHeight: 1,
              cursor: podeGirar ? 'pointer' : 'default',
              opacity: podeGirar ? 1 : 0.35,
            }}
          >
            ↺
          </button>
          <span style={{ minWidth: 58, textAlign: 'center', fontSize: 13, fontWeight: 700, color: '#374151' }}>
            {rotacaoAtual}°
          </span>
          <button
            onClick={irParaProxima}
            disabled={!podeGirar}
            title="Próxima rotação"
            style={{
              width: 38, height: 32,
              border: '1px solid #d1d5db',
              borderRadius: 6,
              background: '#ffffff',
              color: '#374151',
              fontSize: 18,
              lineHeight: 1,
              cursor: podeGirar ? 'pointer' : 'default',
              opacity: podeGirar ? 1 : 0.35,
            }}
          >
            ↻
          </button>
        </div>
      )}

      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'center' }}>
        {todasRotacoes.map((rot) => {
          const disponivel = metadata.rotacoesDisponiveis.includes(rot);
          const ativo = rot === rotacaoAtual;
          return (
            <button
              key={rot}
              disabled={!disponivel}
              onClick={() => disponivel && aoAlterarRotacao(rot)}
              style={{
                padding: '4px 10px', fontSize: 12,
                border: `1px solid ${ativo ? '#2563eb' : disponivel ? '#d1d5db' : '#f3f4f6'}`,
                borderRadius: 6,
                background: ativo ? '#eff6ff' : '#ffffff',
                color: ativo ? '#1d4ed8' : disponivel ? '#374151' : '#d1d5db',
                cursor: disponivel ? 'pointer' : 'not-allowed',
              }}
            >
              {rot}°
            </button>
          );
        })}
      </div>

      <div style={{ fontSize: 11, color: '#9ca3af' }}>
        footprint {footprint.largura}×{footprint.altura} tiles · {larguraPx}×{alturaPx}px
      </div>
    </div>
  );
}

function Secao({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div>
      <div style={{ fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
        {titulo}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
        {children}
      </div>
    </div>
  );
}

function CampoInfo({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <div style={{ display: 'flex', gap: '0.5rem', fontSize: 12 }}>
      <span style={{ color: '#9ca3af', minWidth: 80, flexShrink: 0 }}>{rotulo}</span>
      <span style={{ color: '#111827', wordBreak: 'break-all' }}>{valor}</span>
    </div>
  );
}
