type EstadoLock = {
  bloqueado: boolean;
};

const _estado: EstadoLock = { bloqueado: false };

export const interactionLock = {
  travar(): void {
    _estado.bloqueado = true;
  },
  destravar(): void {
    _estado.bloqueado = false;
  },
  estaLocked(): boolean {
    return _estado.bloqueado;
  },
};
