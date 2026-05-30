import { Component, type ErrorInfo, type ReactNode } from 'react';

type Props = { readonly children: ReactNode; readonly nomeFerramenta: string };
type Estado = { readonly temErro: boolean; readonly mensagem: string };

export class ErrorBoundary extends Component<Props, Estado> {
  state: Estado = { temErro: false, mensagem: '' };

  static getDerivedStateFromError(erro: Error): Estado {
    return { temErro: true, mensagem: erro.message };
  }

  componentDidCatch(erro: Error, info: ErrorInfo): void {
    console.warn(`[DevTools/${this.props.nomeFerramenta}]`, erro, info);
  }

  render(): ReactNode {
    if (this.state.temErro) {
      return (
        <div style={{ padding: 32, color: '#fc8181', fontFamily: 'monospace' }}>
          <strong>❌ Erro em {this.props.nomeFerramenta}</strong>
          <pre style={{ fontSize: 12, marginTop: 8, color: '#a0aec0', whiteSpace: 'pre-wrap' }}>
            {this.state.mensagem}
          </pre>
          <button
            onClick={() => this.setState({ temErro: false, mensagem: '' })}
            style={{
              marginTop: 8,
              padding: '4px 12px',
              cursor: 'pointer',
              background: '#2d3748',
              color: '#e2e8f0',
              border: '1px solid #4a5568',
              borderRadius: 4,
              fontFamily: 'monospace',
            }}
          >
            Tentar novamente
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
