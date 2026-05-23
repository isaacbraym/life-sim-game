const CONEXOES = [
    ['root_pelvis', 'spine'],
    ['spine', 'neck'],
    ['neck', 'head'],
    ['spine', 'shoulder_L'],
    ['shoulder_L', 'elbow_L'],
    ['elbow_L', 'wrist_L'],
    ['spine', 'shoulder_R'],
    ['shoulder_R', 'elbow_R'],
    ['elbow_R', 'wrist_R'],
    ['root_pelvis', 'hip_L'],
    ['hip_L', 'knee_L'],
    ['knee_L', 'ankle_L'],
    ['root_pelvis', 'hip_R'],
    ['hip_R', 'knee_R'],
    ['knee_R', 'ankle_R'],
];
export function desenharEsqueleto(gfx, esqueleto, offsetX, offsetY) {
    gfx.clear();
    // Ossos
    gfx.setStrokeStyle({ width: 2, color: 0x4fc3f7 });
    for (const [idA, idB] of CONEXOES) {
        try {
            const a = esqueleto.posicaoMundialDe(idA);
            const b = esqueleto.posicaoMundialDe(idB);
            gfx.moveTo(offsetX + a.x, offsetY + a.y);
            gfx.lineTo(offsetX + b.x, offsetY + b.y);
        }
        catch {
            // joint ainda não implementado (ankle_R), ignora
        }
    }
    gfx.stroke();
    // Joints
    for (const id of esqueleto.juntas.keys()) {
        const pos = esqueleto.posicaoMundialDe(id);
        const ehRaiz = id === 'root_pelvis';
        gfx.circle(offsetX + pos.x, offsetY + pos.y, ehRaiz ? 6 : 4);
        gfx.fill({ color: ehRaiz ? 0xff6b6b : 0xffd54f });
    }
}
//# sourceMappingURL=RigDebug.js.map