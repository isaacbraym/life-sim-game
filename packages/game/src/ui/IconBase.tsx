/* ============================================================================
   IconBase — fonte ÚNICA de ícones do projeto
   ----------------------------------------------------------------------------
   ▸ Destino: packages/game/src/ui/IconBase.tsx
   ▸ Componente NOVO. Centraliza SVGs para evitar emoji + manter consistência.
   ▸ Substitui os emojis usados em HudLateral, EventoBase e PainelNpc.
   ▸ Para adicionar um ícone: incluir um case novo no switch.
   ============================================================================ */

import React from 'react';

export type IconName =
  | 'menu' | 'settings' | 'save' | 'calendar' | 'wallet'
  | 'dice' | 'sparkle' | 'plus' | 'close' | 'pause' | 'play'
  | 'arrow-right' | 'arrow-left'
  | 'heart' | 'people'
  | 'dumbbell' | 'book' | 'glass' | 'cross';

type PropsIconBase = {
  readonly name: IconName;
  readonly size?: number;
  readonly strokeWidth?: number;
  readonly title?: string;
};

export function IconBase({
  name,
  size = 16,
  strokeWidth = 1.6,
  title,
}: PropsIconBase): React.JSX.Element {
  const common = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    role: title ? 'img' : 'presentation',
    'aria-label': title,
  };

  switch (name) {
    case 'menu':        return <svg {...common}><path d="M4 7h16M4 12h16M4 17h16"/></svg>;
    case 'settings':    return <svg {...common}><circle cx="12" cy="12" r="3"/><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2 2M16.4 16.4l2 2M5.6 18.4l2-2M16.4 7.6l2-2"/></svg>;
    case 'save':        return <svg {...common}><path d="M5 4h11l4 4v12a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1z"/><path d="M8 4v5h7V4M8 20v-6h9v6"/></svg>;
    case 'calendar':    return <svg {...common}><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/></svg>;
    case 'wallet':      return <svg {...common}><rect x="3" y="6" width="18" height="13" rx="2"/><path d="M16 12h3"/><path d="M3 9V7a2 2 0 0 1 2-2h12"/></svg>;
    case 'dice':        return <svg {...common}><rect x="4" y="4" width="16" height="16" rx="3"/><circle cx="9" cy="9" r="1" fill="currentColor"/><circle cx="15" cy="15" r="1" fill="currentColor"/><circle cx="15" cy="9" r="1" fill="currentColor"/></svg>;
    case 'sparkle':     return <svg {...common}><path d="M12 3l2 5 5 2-5 2-2 5-2-5-5-2 5-2 2-5z"/></svg>;
    case 'plus':        return <svg {...common}><path d="M12 5v14M5 12h14"/></svg>;
    case 'close':       return <svg {...common}><path d="M6 6l12 12M18 6L6 18"/></svg>;
    case 'pause':       return <svg {...common}><path d="M8 5v14M16 5v14"/></svg>;
    case 'play':        return <svg {...common}><path d="M7 5l12 7-12 7V5z"/></svg>;
    case 'arrow-right': return <svg {...common}><path d="M5 12h14M13 6l6 6-6 6"/></svg>;
    case 'arrow-left':  return <svg {...common}><path d="M19 12H5M11 6l-6 6 6 6"/></svg>;
    case 'heart':       return <svg {...common}><path d="M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.5-7 10-7 10z"/></svg>;
    case 'people':      return <svg {...common}><circle cx="9" cy="8" r="3"/><circle cx="17" cy="9" r="2.4"/><path d="M3 19a6 6 0 0 1 12 0M14 19a5 5 0 0 1 7 0"/></svg>;
    case 'dumbbell':    return <svg {...common}><path d="M6 8v8M3 10v4M18 8v8M21 10v4M7 12h10"/></svg>;
    case 'book':        return <svg {...common}><path d="M4 5a2 2 0 0 1 2-2h13v15H6a2 2 0 0 0-2 2V5z"/><path d="M19 18v3H6a2 2 0 0 1-2-2"/></svg>;
    case 'glass':       return <svg {...common}><path d="M6 4h12l-2 9a4 4 0 0 1-4 3 4 4 0 0 1-4-3L6 4z"/><path d="M12 16v4M9 20h6"/></svg>;
    case 'cross':       return <svg {...common}><path d="M12 4v16M4 12h16"/></svg>;
    default:            return <svg {...common} />;
  }
}
