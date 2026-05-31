import type { Container } from 'pixi.js';
import { gsap } from 'gsap';
import {
  AnimacaoPersonagem,
  type AnimacaoPersonagem as TipoAnimacao,
  type KeyframeAnimacao,
} from '@core/schemas/characterAnimation';
import type { DirecaoVisual } from '@core/schemas/direction';

type EstadoAnimacao = {
  readonly clip: TipoAnimacao;
  readonly chave: string;          // `${animacaoId}/${direcao}`
  readonly timeline: gsap.core.Timeline;
};

/**
 * Lê `AnimacaoPersonagem` (keyframes de offset/escala/opacidade por camada) e
 * anima as camadas filhas do container do CharacterRenderer via GSAP.
 *
 * As camadas são localizadas por `label` (o CharacterRenderer rotula cada filho
 * com o nome da `CamadaPersonagem`). Camadas ausentes na composição atual são
 * ignoradas silenciosamente.
 *
 * O loop é gerenciado manualmente (onComplete → restart) em vez de `repeat: -1`,
 * para permitir troca de clip sem glitch.
 */
export class CharacterAnimator {
  private readonly container: Container;
  private readonly cache = new Map<string, TipoAnimacao | null>(); // null = falhou (não retentar)
  private estado: EstadoAnimacao | undefined;
  private destruido = false;

  constructor(container: Container) {
    this.container = container;
  }

  /** Carrega (com cache) e reproduz o clip. Retorna `false` se o clip não existir/for inválido. */
  async reproduzir(animacaoId: string, direcao: DirecaoVisual): Promise<boolean> {
    if (this.destruido) return false;
    const chave = `${animacaoId}/${direcao}`;

    // Mesmo clip já tocando → não reinicia (evita glitch ao chamar por tile).
    if (this.estado?.chave === chave) return true;

    const clip = await this.carregarClip(animacaoId, direcao, chave);
    if (this.destruido || clip === undefined) return false;

    this.pararInterno();
    this.estado = { clip, chave, timeline: this.montarTimeline(clip) };
    return true;
  }

  parar(): void {
    this.pararInterno();
    this.estado = undefined;
  }

  destruir(): void {
    this.destruido = true;
    this.pararInterno();
    this.estado = undefined;
    this.cache.clear();
  }

  // ─── interno ──────────────────────────────────────────────────────────────

  private async carregarClip(
    animacaoId: string,
    direcao: DirecaoVisual,
    chave: string,
  ): Promise<TipoAnimacao | undefined> {
    const cacheado = this.cache.get(chave);
    if (cacheado !== undefined) return cacheado ?? undefined;

    try {
      const res = await fetch(`/content/character-animations/${animacaoId}/${direcao}.json`);
      const ct = res.headers.get('content-type') ?? '';
      if (!res.ok || !ct.includes('json')) {
        this.cache.set(chave, null);
        return undefined;
      }
      const dados: unknown = await res.json();
      const resultado = AnimacaoPersonagem.safeParse(dados);
      if (!resultado.success) {
        console.warn(`[CharacterAnimator] clip inválido "${chave}": ${resultado.error.issues[0]?.message ?? 'schema'}`);
        this.cache.set(chave, null);
        return undefined;
      }
      this.cache.set(chave, resultado.data);
      return resultado.data;
    } catch (erro) {
      console.warn(`[CharacterAnimator] falha ao carregar clip "${chave}"`, erro);
      this.cache.set(chave, null);
      return undefined;
    }
  }

  private camadasDoClip(clip: TipoAnimacao): ReadonlySet<string> {
    return new Set(clip.keyframes.map((k) => k.camada));
  }

  /** Mata a timeline ativa e reseta as camadas que ela animava ao estado-base. */
  private pararInterno(): void {
    if (this.estado === undefined) return;
    this.estado.timeline.kill();
    for (const camada of this.camadasDoClip(this.estado.clip)) {
      const alvo = this.container.getChildByLabel(camada);
      if (alvo === null) continue;
      gsap.killTweensOf(alvo);
      gsap.killTweensOf(alvo.scale);
      alvo.position.set(0, 0);
      alvo.alpha = 1;
      alvo.scale.set(1);
    }
  }

  private montarTimeline(clip: TipoAnimacao): gsap.core.Timeline {
    const tl = gsap.timeline({
      onComplete: () => {
        if (clip.loop && !this.destruido) tl.restart();
      },
    });

    // Agrupa keyframes por camada (ordenados por tempo).
    const porCamada = new Map<string, KeyframeAnimacao[]>();
    for (const kf of clip.keyframes) {
      const lista = porCamada.get(kf.camada) ?? [];
      lista.push(kf);
      porCamada.set(kf.camada, lista);
    }

    for (const [camada, kfs] of porCamada) {
      const alvo = this.container.getChildByLabel(camada);
      if (alvo === null) continue; // camada não presente nesta composição
      kfs.sort((a, b) => a.tempoMs - b.tempoMs);

      const primeiro = kfs[0];
      if (primeiro === undefined) continue;
      tl.set(alvo, { x: primeiro.offsetX, y: primeiro.offsetY, alpha: primeiro.opacidade }, 0);
      tl.set(alvo.scale, { x: primeiro.escala, y: primeiro.escala }, 0);

      for (let i = 1; i < kfs.length; i += 1) {
        const anterior = kfs[i - 1]!;
        const atual = kfs[i]!;
        const inicioSeg = anterior.tempoMs / 1000;
        const duracaoSeg = Math.max(0, atual.tempoMs - anterior.tempoMs) / 1000;
        tl.to(alvo, { x: atual.offsetX, y: atual.offsetY, alpha: atual.opacidade, duration: duracaoSeg, ease: 'none' }, inicioSeg);
        tl.to(alvo.scale, { x: atual.escala, y: atual.escala, duration: duracaoSeg, ease: 'none' }, inicioSeg);
      }
    }

    // Padding para garantir que a timeline tenha ao menos a duração do clip,
    // mesmo que a última transição de camada termine antes (onComplete no tempo certo).
    tl.to({}, { duration: clip.duracaoMs / 1000 }, 0);

    return tl;
  }
}
