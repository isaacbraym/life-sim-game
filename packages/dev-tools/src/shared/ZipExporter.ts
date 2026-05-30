// packages/dev-tools/src/shared/ZipExporter.ts

export async function exportarComoZip(
  arquivos: Array<{ caminho: string; conteudo: string | ArrayBuffer }>
): Promise<void> {
  const { default: JSZip } = await import('jszip');
  const zip = new JSZip();
  for (const { caminho, conteudo } of arquivos) {
    zip.file(caminho, conteudo);
  }
  const blob = await zip.generateAsync({ type: 'blob' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = 'vida25d-assets.zip';
  a.click();
  URL.revokeObjectURL(url);
}
