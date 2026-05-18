import { useEffect, useRef } from 'react'
import { Application, Graphics } from 'pixi.js'
import { Esqueleto } from '@lifesim/core'
import { desenharSilhueta } from './SilhouetteRenderer'

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

      const esqueleto = new Esqueleto()
      const gfx = new Graphics()
      app.stage.addChild(gfx)

      const offsetX = app.screen.width / 2
      const offsetY = app.screen.height / 2

      desenharSilhueta(gfx, esqueleto, offsetX, offsetY)
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
      style={{ width: '100%', height: '100%' }}
    />
  )
}