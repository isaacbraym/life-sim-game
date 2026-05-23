import { jsx as _jsx } from "react/jsx-runtime";
import { useEffect, useRef } from 'react';
import * as PIXI from 'pixi.js';
export function PixiStage() {
    const containerRef = useRef(null);
    useEffect(() => {
        if (!containerRef.current)
            return;
        const app = new PIXI.Application();
        app.init({
            width: window.innerWidth,
            height: window.innerHeight,
            backgroundColor: 0x1a1a2e,
            antialias: true,
        }).then(() => {
            containerRef.current?.appendChild(app.canvas);
            // Placeholder: quadrado vermelho para smoke test
            const quadrado = new PIXI.Graphics();
            quadrado.rect(window.innerWidth / 2 - 50, window.innerHeight / 2 - 50, 100, 100);
            quadrado.fill({ color: 0xe74c3c });
            app.stage.addChild(quadrado);
        });
        return () => {
            app.destroy(true);
        };
    }, []);
    return _jsx("div", { ref: containerRef, style: { width: '100%', height: '100%' } });
}
//# sourceMappingURL=PixiStage.js.map