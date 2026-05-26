import { useState, useEffect, useRef } from 'react';
import { ComodoDefinition } from '@lifesim/core';

type PropsPainelJson = {
  readonly comodo: ComodoDefinition;
  readonly onAtualizar: (novoComodo: ComodoDefinition) => void;
};

export function PainelJson({ comodo, onAtualizar }: PropsPainelJson) {
  const [textoJson, setTextoJson] = useState(() => JSON.stringify(comodo, null, 2));
  const [erroValidacao, setErroValidacao] = useState<string | undefined>();
  const focadoRef = useRef(false);

  // Sincroniza o textarea quando o comodo muda externamente (drag no canvas)
  useEffect(() => {
    if (!focadoRef.current) {
      setTextoJson(JSON.stringify(comodo, null, 2));
      setErroValidacao(undefined);
    }
  }, [comodo]);

  const aoAlterarTexto = (novoTexto: string) => {
    setTextoJson(novoTexto);
    try {
      const dados: unknown = JSON.parse(novoTexto);
      const resultado = ComodoDefinition.safeParse(dados);
      if (resultado.success) {
        setErroValidacao(undefined);
        onAtualizar(resultado.data);
      } else {
        const primeiroErro = resultado.error.issues[0];
        setErroValidacao(
          primeiroErro
            ? `${primeiroErro.path.join('.') || 'raiz'}: ${primeiroErro.message}`
            : 'Schema inválido',
        );
      }
    } catch {
      setErroValidacao('JSON malformado');
    }
  };

  return (
    <div style={{
      width: 340,
      minWidth: 340,
      display: 'flex',
      flexDirection: 'column',
      background: '#1a202c',
      borderLeft: '1px solid #4a5568',
    }}>
      <div style={{
        padding: '0.5rem 0.75rem',
        background: '#171923',
        borderBottom: '1px solid #4a5568',
        fontSize: 12,
        color: '#a0aec0',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <span>ComodoDefinition JSON</span>
        {erroValidacao !== undefined ? (
          <span style={{ color: '#fc8181', fontSize: 11 }}>⚠️ {erroValidacao}</span>
        ) : (
          <span style={{ color: '#68d391', fontSize: 11 }}>✓ válido</span>
        )}
      </div>
      <textarea
        value={textoJson}
        onChange={(e) => aoAlterarTexto(e.target.value)}
        onFocus={() => { focadoRef.current = true; }}
        onBlur={() => { focadoRef.current = false; }}
        spellCheck={false}
        style={{
          flex: 1,
          resize: 'none',
          background: '#1a202c',
          color: erroValidacao !== undefined ? '#fc8181' : '#e2e8f0',
          border: 'none',
          outline: 'none',
          padding: '0.75rem',
          fontSize: 11,
          fontFamily: 'monospace',
          lineHeight: 1.5,
        }}
      />
    </div>
  );
}
