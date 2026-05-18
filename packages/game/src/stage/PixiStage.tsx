import { useEffect, useRef } from 'react'
import { Application, Graphics } from 'pixi.js'

export function PixiStage() {
  const containerRef = useRef<HTMLDivElement>(null)
  const appRef = useRef<Application | null>(null)

  useEffect(() => {
    if (!containerRef.current) return

    const container = containerRef.current
    let montado = true
    const app = new Application()

    app.init({
      background: '#1a1a2e',
      resizeTo: container,
    }).then(() => {
      if (!montado) {
        app.destroy()
        return
      }

      appRef.current = app
      container.appendChild(app.canvas)

      const circulo = new Graphics()
      circulo.circle(0, 0, 50)
      circulo.fill({ color: 0xe94560 })
      circulo.x = app.screen.width / 2
      circulo.y = app.screen.height / 2
      app.stage.addChild(circulo)
    })

    return () => {
      montado = false
      if (appRef.current) {
        appRef.current.destroy()
        appRef.current = null
      }
    }
  }, [])

  return (
    <div
      ref={containerRef}
      style={{ width: '100vw', height: '100vh' }}
    />
  )
}
