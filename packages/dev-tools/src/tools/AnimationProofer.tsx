import { useCallback, useEffect, useMemo, useState } from 'react';
import { z } from 'zod';
import {
  AnimacaoPersonagem as SchemaAnimacaoPersonagem,
  type AnimacaoPersonagem,
  type KeyframeAnimacao,
} from '@core/schemas/characterAnimation';
import { CamadaPersonagem } from '@core/schemas/characterPart';
import type { CamadaPersonagem as TipoCamadaPersonagem } from '@core/schemas/characterPart';
import type { DirecaoVisual } from '@core/schemas/direction';
import { CharacterPreview } from '../shared/CharacterPreview';
import {
  obterPastaRaiz,
  garantirPasta,
  escreverArquivo,
  SUPORTA_FILE_SYSTEM_ACCESS,
} from '../shared/ProjetoHandle';
import { exportarComoZip } from '../shared/ZipExporter';

type ClipBiblioteca = {
  readonly caminho: string;
  readonly rotulo: string;
  readonly clip?: AnimacaoPersonagem;
  readonly erro?: string;
};

type ResultadoListagem = {
  readonly caminhos: readonly string[];
  readonly origem: 'diretorio' | 'indice' | 'vazio';
};

type CampoNumericoKeyframe = 'tempoMs' | 'offsetX' | 'offsetY' | 'opacidade' | 'escala';

const DIRECOES: readonly DirecaoVisual[] = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
const CAMADAS = CamadaPersonagem.options;
const MENSAGEM_VAZIA = 'Nenhum clip encontrado. Rode o script de bake ou crie clips manualmente.';

function normalizarUrlClip(caminho: string): string {
  const limpo = caminho.trim().replaceAll('\\', '/');
  if (limpo.startsWith('/content/character-animations/')) return limpo;
  if (limpo.startsWith('content/character-animations/')) return `/${limpo}`;
  return `/content/character-animations/${limpo.replace(/^\/+/, '')}`;
}

function caminhoRelativoClip(caminho: string): string {
  return normalizarUrlClip(caminho).replace(/^\/content\/character-animations\//, '');
}

function rotuloClip(caminho: string): string {
  return caminhoRelativoClip(caminho).replace(/\.json$/i, '');
}

function extrairCaminhosDoIndice(dados: unknown): string[] {
  if (!Array.isArray(dados)) return [];

  return dados.flatMap((entrada) => {
    if (typeof entrada === 'string') return [entrada];
    if (typeof entrada !== 'object' || entrada === null) return [];

    const registro = entrada as Record<string, unknown>;
    const caminho = registro['caminho'] ?? registro['path'] ?? registro['arquivo'] ?? registro['file'];
    return typeof caminho === 'string' ? [caminho] : [];
  });
}

function extrairCaminhosDoHtml(html: string): string[] {
  const documento = new DOMParser().parseFromString(html, 'text/html');
  return Array.from(documento.querySelectorAll('a'))
    .map((link) => link.getAttribute('href'))
    .filter((href): href is string => href !== null && href.toLowerCase().endsWith('.json'))
    .filter((href) => !href.endsWith('/index.json'))
    .map((href) => {
      const url = new URL(href, `${window.location.origin}/content/character-animations/`);
      return url.pathname;
    });
}

async function listarClipsDisponiveis(): Promise<ResultadoListagem> {
  try {
    const respostaDiretorio = await fetch('/content/character-animations/');
    if (respostaDiretorio.ok) {
      const html = await respostaDiretorio.text();
      const caminhos = extrairCaminhosDoHtml(html);
      if (caminhos.length > 0) return { caminhos, origem: 'diretorio' };
    }
  } catch {
    // Vite normalmente nao lista diretorios; o index.json cobre esse caso.
  }

  try {
    const respostaIndice = await fetch('/content/character-animations/index.json');
    if (respostaIndice.ok) {
      const dados: unknown = await respostaIndice.json();
      const caminhos = extrairCaminhosDoIndice(dados).map(normalizarUrlClip);
      if (caminhos.length > 0) return { caminhos, origem: 'indice' };
    }
  } catch {
    return { caminhos: [], origem: 'vazio' };
  }

  return { caminhos: [], origem: 'vazio' };
}

function formatarErroZod(erro: z.ZodError): string {
  return erro.issues
    .map((issue) => `${issue.path.join('.') || 'clip'}: ${issue.message}`)
    .join('\n');
}

function chaveErroCampo(indice: number, campo: string): string {
  return `keyframes.${indice}.${campo}`;
}

function criarMapaErros(validacao: z.SafeParseReturnType<unknown, AnimacaoPersonagem> | undefined): ReadonlySet<string> {
  if (validacao === undefined || validacao.success) return new Set();
  return new Set(validacao.error.issues.map((issue) => issue.path.join('.')));
}

function criarKeyframePadrao(clip: AnimacaoPersonagem): KeyframeAnimacao {
  const ultimo = clip.keyframes[clip.keyframes.length - 1];
  return {
    tempoMs: clip.duracaoMs,
    camada: ultimo?.camada ?? 'corpo_base',
    offsetX: ultimo?.offsetX ?? 0,
    offsetY: ultimo?.offsetY ?? 0,
    opacidade: ultimo?.opacidade ?? 1,
    escala: ultimo?.escala ?? 1,
  };
}

function inputNumero(valor: number): string {
  return Number.isNaN(valor) ? '' : String(valor);
}

export function AnimationProofer() {
  const [clips, setClips] = useState<readonly ClipBiblioteca[]>([]);
  const [clipSelecionado, setClipSelecionado] = useState<AnimacaoPersonagem | undefined>();
  const [direcaoPreview, setDirecaoPreview] = useState<DirecaoVisual>('S');
  const [tempoAtualMs, setTempoAtualMs] = useState(0);
  const [reproduzindo, setReproduzindo] = useState(false);
  const [fpsPreview, setFpsPreview] = useState(12);
  const [mensagemBiblioteca, setMensagemBiblioteca] = useState('Carregando clips...');
  const [mensagemSave, setMensagemSave] = useState<string | undefined>();

  const validacaoClip = useMemo(
    () => clipSelecionado === undefined ? undefined : SchemaAnimacaoPersonagem.safeParse(clipSelecionado),
    [clipSelecionado],
  );
  const clipValido = validacaoClip?.success === true ? validacaoClip.data : undefined;
  const errosPorCampo = useMemo(() => criarMapaErros(validacaoClip), [validacaoClip]);
  const erroValidacao = validacaoClip?.success === false ? formatarErroZod(validacaoClip.error) : undefined;
  const duracaoPreview = Number.isFinite(clipSelecionado?.duracaoMs)
    ? Math.max(0, clipSelecionado?.duracaoMs ?? 0)
    : 0;

  useEffect(() => {
    let ativo = true;

    const carregar = async () => {
      const listagem = await listarClipsDisponiveis();
      if (!ativo) return;

      if (listagem.caminhos.length === 0) {
        setClips([]);
        setMensagemBiblioteca(MENSAGEM_VAZIA);
        return;
      }

      const itens = await Promise.all(listagem.caminhos.map(async (caminho) => {
        const url = normalizarUrlClip(caminho);
        try {
          const resposta = await fetch(url);
          if (!resposta.ok) {
            return {
              caminho: url,
              rotulo: rotuloClip(url),
              erro: `HTTP ${resposta.status} ao carregar ${url}`,
            } satisfies ClipBiblioteca;
          }

          const dados: unknown = await resposta.json();
          const resultado = SchemaAnimacaoPersonagem.safeParse(dados);
          if (!resultado.success) {
            return {
              caminho: url,
              rotulo: rotuloClip(url),
              erro: formatarErroZod(resultado.error),
            } satisfies ClipBiblioteca;
          }

          return {
            caminho: url,
            rotulo: rotuloClip(url),
            clip: resultado.data,
          } satisfies ClipBiblioteca;
        } catch (erro) {
          return {
            caminho: url,
            rotulo: rotuloClip(url),
            erro: erro instanceof Error ? erro.message : String(erro),
          } satisfies ClipBiblioteca;
        }
      }));

      if (!ativo) return;
      setClips(itens);
      setMensagemBiblioteca(
        listagem.origem === 'indice'
          ? 'Listagem carregada por content/character-animations/index.json.'
          : 'Listagem carregada por diretorio.',
      );

      const primeiroValido = itens.find((item) => item.clip !== undefined)?.clip;
      if (primeiroValido !== undefined) {
        setClipSelecionado(primeiroValido);
        setDirecaoPreview(primeiroValido.direcao);
        setTempoAtualMs(0);
      }
    };

    void carregar();

    return () => {
      ativo = false;
    };
  }, []);

  useEffect(() => {
    if (!reproduzindo || clipSelecionado === undefined || duracaoPreview <= 0) return undefined;

    const intervaloMs = Math.max(1, Math.round(1000 / Math.max(1, fpsPreview)));
    const id = window.setInterval(() => {
      setTempoAtualMs((tempoAnterior) => {
        const proximoTempo = tempoAnterior + intervaloMs;
        if (proximoTempo < duracaoPreview) return proximoTempo;

        if (clipSelecionado.loop) return 0;
        setReproduzindo(false);
        return duracaoPreview;
      });
    }, intervaloMs);

    return () => window.clearInterval(id);
  }, [clipSelecionado, duracaoPreview, fpsPreview, reproduzindo]);

  const selecionarClip = useCallback((item: ClipBiblioteca) => {
    if (item.clip === undefined) return;
    setClipSelecionado(item.clip);
    setDirecaoPreview(item.clip.direcao);
    setTempoAtualMs(0);
    setReproduzindo(false);
    setMensagemSave(undefined);
  }, []);

  const atualizarKeyframeNumerico = useCallback((
    indice: number,
    campo: CampoNumericoKeyframe,
    valorBruto: string,
  ) => {
    const valor = valorBruto.trim() === '' ? Number.NaN : Number(valorBruto);
    setClipSelecionado((clipAtual) => {
      if (clipAtual === undefined) return undefined;
      return {
        ...clipAtual,
        keyframes: clipAtual.keyframes.map((keyframe, indiceAtual) => (
          indiceAtual === indice ? { ...keyframe, [campo]: valor } : keyframe
        )),
      };
    });
  }, []);

  const atualizarCamadaKeyframe = useCallback((indice: number, camada: TipoCamadaPersonagem) => {
    setClipSelecionado((clipAtual) => {
      if (clipAtual === undefined) return undefined;
      return {
        ...clipAtual,
        keyframes: clipAtual.keyframes.map((keyframe, indiceAtual) => (
          indiceAtual === indice ? { ...keyframe, camada } : keyframe
        )),
      };
    });
  }, []);

  const adicionarKeyframe = useCallback(() => {
    setClipSelecionado((clipAtual) => {
      if (clipAtual === undefined) return undefined;
      return {
        ...clipAtual,
        keyframes: [...clipAtual.keyframes, criarKeyframePadrao(clipAtual)],
      };
    });
  }, []);

  const removerKeyframe = useCallback((indice: number) => {
    setClipSelecionado((clipAtual) => {
      if (clipAtual === undefined) return undefined;
      if (clipAtual.keyframes.length === 1 && !window.confirm('Remover o unico keyframe deste clip?')) {
        return clipAtual;
      }
      return {
        ...clipAtual,
        keyframes: clipAtual.keyframes.filter((_, indiceAtual) => indiceAtual !== indice),
      };
    });
  }, []);

  const alternarLoop = useCallback((loop: boolean) => {
    setClipSelecionado((clipAtual) => clipAtual === undefined ? undefined : { ...clipAtual, loop });
  }, []);

  const salvarClip = useCallback(async () => {
    setMensagemSave(undefined);
    const resultado = SchemaAnimacaoPersonagem.safeParse(clipSelecionado);
    if (!resultado.success) {
      setMensagemSave(`Corrija os erros antes de salvar:\n${formatarErroZod(resultado.error)}`);
      return;
    }

    const clip = resultado.data;
    const conteudo = `${JSON.stringify(clip, null, 2)}\n`;
    const caminhoZip = `content/character-animations/${clip.animacaoId}/${clip.direcao}.json`;

    if (!SUPORTA_FILE_SYSTEM_ACCESS) {
      await exportarComoZip([{ caminho: caminhoZip, conteudo }]);
      setMensagemSave(`ZIP gerado com ${caminhoZip}.`);
      return;
    }

    try {
      const pastaRaiz = obterPastaRaiz();
      const pastaClip = await garantirPasta(
        pastaRaiz,
        'content',
        'character-animations',
        clip.animacaoId,
      );
      await escreverArquivo(pastaClip, `${clip.direcao}.json`, conteudo);
      setMensagemSave(`Clip salvo em ${caminhoZip}.`);
    } catch (erro) {
      setMensagemSave(erro instanceof Error ? erro.message : String(erro));
    }
  }, [clipSelecionado]);

  return (
    <div style={estilos.raiz}>
      <section style={estilos.colunaEsquerda}>
        <h2 style={estilos.titulo}>Biblioteca de clips</h2>
        <p style={estilos.mensagem}>{mensagemBiblioteca}</p>
        <div style={estilos.listaClips}>
          {clips.map((item) => (
            <button
              key={item.caminho}
              type="button"
              title={item.erro}
              onClick={() => selecionarClip(item)}
              style={estiloItemClip(clipSelecionado?.animacaoId === item.clip?.animacaoId && clipSelecionado?.direcao === item.clip?.direcao)}
            >
              {item.clip === undefined ? (
                <>
                  <span style={estilos.linhaPrincipal}>{item.rotulo}</span>
                  <span style={estilos.badgeErro}>⚠ schema invalido</span>
                </>
              ) : (
                <>
                  <span style={estilos.linhaPrincipal}>{item.clip.animacaoId} / {item.clip.direcao}</span>
                  <span style={estilos.detalheClip}>
                    {item.clip.duracaoMs}ms · {item.clip.loop ? '🔄' : '✗'} · {item.clip.keyframes.length} keyframes
                  </span>
                </>
              )}
            </button>
          ))}
        </div>
      </section>

      <section style={estilos.colunaCentral}>
        <h2 style={estilos.titulo}>Preview</h2>
        <div style={estilos.preview}>
          <CharacterPreview
            direcao={direcaoPreview}
            animacaoAtual={clipValido}
            tempoAtualMs={tempoAtualMs}
            largura={256}
            altura={384}
          />
        </div>

        <div style={estilos.controles}>
          <div style={estilos.grupoDirecoes}>
            {DIRECOES.map((direcao) => (
              <button
                key={direcao}
                type="button"
                onClick={() => setDirecaoPreview(direcao)}
                style={estiloBotao(direcaoPreview === direcao)}
              >
                {direcao}
              </button>
            ))}
          </div>

          <div style={estilos.grupoBotoes}>
            <button type="button" onClick={() => setReproduzindo(true)} style={estiloBotao(false)}>▶ Play</button>
            <button type="button" onClick={() => setReproduzindo(false)} style={estiloBotao(false)}>⏸ Pause</button>
            <button
              type="button"
              onClick={() => {
                setReproduzindo(false);
                setTempoAtualMs(0);
              }}
              style={estiloBotao(false)}
            >
              ⏹ Stop
            </button>
          </div>

          <label style={estilos.label}>
            Scrubber
            <input
              type="range"
              min={0}
              max={duracaoPreview}
              value={Math.min(tempoAtualMs, duracaoPreview)}
              onChange={(event) => {
                setReproduzindo(false);
                setTempoAtualMs(Number(event.currentTarget.value));
              }}
              style={estilos.scrubber}
            />
            <span>{Math.round(tempoAtualMs)}ms / {duracaoPreview}ms</span>
          </label>

          <div style={estilos.linhaControles}>
            <label>
              FPS:{' '}
              <input
                type="number"
                min={1}
                max={60}
                value={fpsPreview}
                onChange={(event) => setFpsPreview(Math.max(1, Number(event.currentTarget.value)))}
                style={estilos.inputCurto}
              />
            </label>
            <label>
              Loop:{' '}
              <input
                type="checkbox"
                checked={clipSelecionado?.loop ?? false}
                onChange={(event) => alternarLoop(event.currentTarget.checked)}
              />
            </label>
          </div>

          <div style={estilos.tempoAtual}>Tempo atual: {Math.round(tempoAtualMs)}ms</div>
        </div>
      </section>

      <section style={estilos.colunaDireita}>
        <div style={estilos.cabecalhoEditor}>
          <h2 style={estilos.titulo}>Editor de keyframes</h2>
          <button type="button" onClick={adicionarKeyframe} disabled={clipSelecionado === undefined} style={estiloBotao(false)}>
            + Keyframe
          </button>
        </div>

        {clipSelecionado === undefined ? (
          <p style={estilos.mensagem}>Selecione um clip valido para editar.</p>
        ) : (
          <>
            <div style={estilos.infoClip}>
              <strong>{clipSelecionado.animacaoId}</strong> · {clipSelecionado.direcao} · {clipSelecionado.duracaoMs}ms
            </div>
            <div style={estilos.tabelaContainer}>
              <table style={estilos.tabela}>
                <thead>
                  <tr>
                    <th>tempoMs</th>
                    <th>camada</th>
                    <th>offsetX</th>
                    <th>offsetY</th>
                    <th>opacidade</th>
                    <th>escala</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {clipSelecionado.keyframes.map((keyframe, indice) => (
                    <tr key={`${keyframe.camada}-${indice}`}>
                      <td>
                        <input
                          type="number"
                          value={inputNumero(keyframe.tempoMs)}
                          onChange={(event) => atualizarKeyframeNumerico(indice, 'tempoMs', event.currentTarget.value)}
                          style={estiloInput(errosPorCampo.has(chaveErroCampo(indice, 'tempoMs')))}
                        />
                      </td>
                      <td>
                        <select
                          value={keyframe.camada}
                          onChange={(event) => atualizarCamadaKeyframe(indice, event.currentTarget.value as TipoCamadaPersonagem)}
                          style={estiloInput(errosPorCampo.has(chaveErroCampo(indice, 'camada')))}
                        >
                          {CAMADAS.map((camada) => <option key={camada} value={camada}>{camada}</option>)}
                        </select>
                      </td>
                      <td>
                        <input
                          type="number"
                          value={inputNumero(keyframe.offsetX)}
                          onChange={(event) => atualizarKeyframeNumerico(indice, 'offsetX', event.currentTarget.value)}
                          style={estiloInput(errosPorCampo.has(chaveErroCampo(indice, 'offsetX')))}
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          value={inputNumero(keyframe.offsetY)}
                          onChange={(event) => atualizarKeyframeNumerico(indice, 'offsetY', event.currentTarget.value)}
                          style={estiloInput(errosPorCampo.has(chaveErroCampo(indice, 'offsetY')))}
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          min={0}
                          max={1}
                          step={0.05}
                          value={inputNumero(keyframe.opacidade)}
                          onChange={(event) => atualizarKeyframeNumerico(indice, 'opacidade', event.currentTarget.value)}
                          style={estiloInput(errosPorCampo.has(chaveErroCampo(indice, 'opacidade')))}
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          min={0.05}
                          step={0.05}
                          value={inputNumero(keyframe.escala)}
                          onChange={(event) => atualizarKeyframeNumerico(indice, 'escala', event.currentTarget.value)}
                          style={estiloInput(errosPorCampo.has(chaveErroCampo(indice, 'escala')))}
                        />
                      </td>
                      <td>
                        <button type="button" onClick={() => removerKeyframe(indice)} style={estilos.botaoRemover}>✕</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {erroValidacao !== undefined && <pre style={estilos.erroValidacao}>{erroValidacao}</pre>}
            {mensagemSave !== undefined && <pre style={estilos.mensagemSave}>{mensagemSave}</pre>}
            <button type="button" onClick={() => void salvarClip()} style={estilos.botaoSalvar}>
              Salvar clip
            </button>
          </>
        )}
      </section>
    </div>
  );
}

function estiloBotao(ativo: boolean): React.CSSProperties {
  return {
    background: ativo ? '#3182ce' : '#2d3748',
    color: '#f7fafc',
    border: ativo ? '1px solid #90cdf4' : '1px solid #4a5568',
    borderRadius: 4,
    cursor: 'pointer',
    fontFamily: 'monospace',
    fontSize: 12,
    padding: '0.4rem 0.6rem',
  };
}

function estiloItemClip(ativo: boolean): React.CSSProperties {
  return {
    background: ativo ? '#1e3a5f' : '#202938',
    border: ativo ? '1px solid #63b3ed' : '1px solid #4a5568',
    borderRadius: 6,
    color: '#e2e8f0',
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
    fontFamily: 'monospace',
    gap: 4,
    padding: '0.6rem',
    textAlign: 'left',
  };
}

function estiloInput(invalido: boolean): React.CSSProperties {
  return {
    width: '100%',
    minWidth: 72,
    background: '#1a202c',
    color: '#e2e8f0',
    border: invalido ? '1px solid #fc8181' : '1px solid #4a5568',
    borderRadius: 4,
    fontFamily: 'monospace',
    fontSize: 12,
    padding: '0.25rem',
  };
}

const estilos: Record<string, React.CSSProperties> = {
  raiz: {
    display: 'grid',
    gridTemplateColumns: '280px minmax(360px, 1fr) minmax(520px, 1.35fr)',
    height: '100%',
    minHeight: 0,
    background: '#2d3748',
    color: '#e2e8f0',
    fontFamily: 'monospace',
  },
  colunaEsquerda: {
    borderRight: '1px solid #4a5568',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
    minHeight: 0,
    padding: '1rem',
  },
  colunaCentral: {
    alignItems: 'center',
    borderRight: '1px solid #4a5568',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.9rem',
    minHeight: 0,
    overflow: 'auto',
    padding: '1rem',
  },
  colunaDireita: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
    minHeight: 0,
    overflow: 'auto',
    padding: '1rem',
  },
  titulo: {
    color: '#90cdf4',
    fontSize: 16,
    margin: 0,
  },
  mensagem: {
    color: '#a0aec0',
    fontSize: 12,
    lineHeight: 1.45,
    margin: 0,
  },
  listaClips: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
    minHeight: 0,
    overflow: 'auto',
  },
  linhaPrincipal: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  detalheClip: {
    color: '#a0aec0',
    fontSize: 11,
  },
  badgeErro: {
    color: '#fc8181',
    fontSize: 11,
  },
  preview: {
    background: '#1a1a1a',
    border: '1px solid #4a5568',
    borderRadius: 6,
    lineHeight: 0,
    padding: 12,
  },
  controles: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.8rem',
    width: '100%',
    maxWidth: 560,
  },
  grupoDirecoes: {
    display: 'grid',
    gap: 6,
    gridTemplateColumns: 'repeat(8, minmax(0, 1fr))',
  },
  grupoBotoes: {
    display: 'flex',
    gap: 8,
    justifyContent: 'center',
  },
  label: {
    color: '#cbd5e0',
    display: 'flex',
    flexDirection: 'column',
    fontSize: 12,
    gap: 5,
  },
  scrubber: {
    width: '100%',
  },
  linhaControles: {
    alignItems: 'center',
    display: 'flex',
    gap: '1rem',
    justifyContent: 'center',
  },
  inputCurto: {
    background: '#1a202c',
    border: '1px solid #4a5568',
    borderRadius: 4,
    color: '#e2e8f0',
    fontFamily: 'monospace',
    padding: '0.25rem',
    width: 64,
  },
  tempoAtual: {
    color: '#fbd38d',
    fontSize: 12,
    textAlign: 'center',
  },
  cabecalhoEditor: {
    alignItems: 'center',
    display: 'flex',
    justifyContent: 'space-between',
    gap: '1rem',
  },
  infoClip: {
    background: '#1a202c',
    border: '1px solid #4a5568',
    borderRadius: 6,
    color: '#cbd5e0',
    fontSize: 12,
    padding: '0.5rem',
  },
  tabelaContainer: {
    minHeight: 0,
    overflow: 'auto',
  },
  tabela: {
    borderCollapse: 'collapse',
    fontSize: 12,
    width: '100%',
  },
  botaoRemover: {
    background: '#742a2a',
    border: '1px solid #fc8181',
    borderRadius: 4,
    color: '#ffffff',
    cursor: 'pointer',
    fontFamily: 'monospace',
    padding: '0.25rem 0.45rem',
  },
  erroValidacao: {
    background: '#2a1717',
    border: '1px solid #fc8181',
    borderRadius: 6,
    color: '#fed7d7',
    fontSize: 11,
    margin: 0,
    maxHeight: 140,
    overflow: 'auto',
    padding: '0.65rem',
    whiteSpace: 'pre-wrap',
  },
  mensagemSave: {
    background: '#1a202c',
    border: '1px solid #4a5568',
    borderRadius: 6,
    color: '#c6f6d5',
    fontSize: 11,
    margin: 0,
    padding: '0.65rem',
    whiteSpace: 'pre-wrap',
  },
  botaoSalvar: {
    alignSelf: 'flex-end',
    background: '#2f855a',
    border: 'none',
    borderRadius: 4,
    color: '#ffffff',
    cursor: 'pointer',
    fontFamily: 'monospace',
    fontSize: 12,
    padding: '0.55rem 0.8rem',
  },
};

export default AnimationProofer;
