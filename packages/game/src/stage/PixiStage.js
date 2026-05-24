import { jsx as _jsx } from "react/jsx-runtime";
import { useEffect, useRef } from 'react';
import * as PIXI from 'pixi.js';
export function PixiStage() {
    const containerRef = useRef(null);
    const appRef = useRef(null);
    useEffect(() => {
        const container = containerRef.current;
        if (!container || appRef.current)
            return;
        const app = new PIXI.Application();
        void app.init({
            width: window.innerWidth,
            height: window.innerHeight,
            backgroundColor: 0x1a1a2e,
            antialias: true,
        }).then(() => {
            appRef.current = app;
            container.appendChild(app.canvas);
            const quadradoTeste = new PIXI.Graphics();
            quadradoTeste.rect(window.innerWidth / 2 - 50, window.innerHeight / 2 - 50, 100, 100);
            quadradoTeste.fill({ color: 0xe74c3c });
            app.stage.addChild(quadradoTeste);
        });
        return () => {
            if (appRef.current) {
                appRef.current.destroy();
                appRef.current = null;
            }
        };
    }, []);
    return _jsx("div", { ref: containerRef, style: { width: '100%', height: '100%' } });
}
//# sourceMappingURL=PixiStage.js.map