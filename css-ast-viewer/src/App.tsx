import { useState, useEffect, useRef, useMemo, useCallback, type ChangeEvent } from 'react';
import { demoCSS } from './demo-css.ts';

import { TreeNode } from './TreeNode.tsx';
import type { ASTNode, ASTSelectedNode, ASTSource } from '../lib/node-to-json.ts';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB — mismo limite que el servidor

function SourceBadge({ source }: { source?: ASTSource }) {
  if (!source?.start) return null;
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-surface-3 text-text-faint text-xs font-mono">
      <svg className="w-3 h-3" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
        <path d="M1 3.5A1.5 1.5 0 012.5 2h3.879a1.5 1.5 0 011.06.44l1.122 1.12A1.5 1.5 0 009.62 4H13.5A1.5 1.5 0 0115 5.5v7a1.5 1.5 0 01-1.5 1.5h-11A1.5 1.5 0 011 12.5v-9z" />
      </svg>
      L{source.start.line}:{source.start.column}
      {source.end && <span className="text-text-faint/50">– L{source.end.line}:{source.end.column}</span>}
    </span>
  );
}

async function parseCSSViaServer(cssText: string, signal?: AbortSignal): Promise<ASTNode> {
  const res = await fetch('/api/parse', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ css: cssText }),
    signal,
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Parse failed');
  }
  return res.json();
}

export default function App() {
  const [selected, setSelected] = useState<ASTSelectedNode | null>(null);
  const [astData, setAstData] = useState<ASTNode | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState('demo.css');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const rawJson = useMemo(() => {
    if (!selected) return '';
    return JSON.stringify(selected, null, 2);
  }, [selected]);

  const parseCSS = useCallback(async (cssText: string, name: string) => {
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError(null);
    setSelected(null);

    try {
      const ast = await parseCSSViaServer(cssText, controller.signal);
      setAstData(ast);
      setFileName(name);
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return;
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    parseCSS(demoCSS, 'demo.css');
  }, [parseCSS]);

  const handleFileUpload = useCallback(async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.css')) {
      setError(`"${file.name}" no es un archivo CSS. Solo se aceptan archivos .css`);
      e.target.value = '';
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setError(`El archivo excede el limite de 5MB (${(file.size / 1024 / 1024).toFixed(1)}MB)`);
      e.target.value = '';
      return;
    }

    setError(null);
    const text = await file.text();
    await parseCSS(text, file.name);
    e.target.value = '';
  }, [parseCSS]);

  const handleLoadDemo = useCallback(() => {
    parseCSS(demoCSS, 'demo.css');
  }, [parseCSS]);

  return (
    <div className="min-h-screen bg-surface-0 text-text-secondary font-sans flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-3 border-b border-border-subtle bg-surface-1/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-accent-purple/15">
            <svg className="w-4 h-4 text-accent-purple" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <polyline points="16 18 22 12 16 6" />
              <polyline points="8 6 2 12 8 18" />
            </svg>
          </div>
          <h1 className="text-lg font-semibold text-text-primary tracking-tight">CSS AST Viewer</h1>
          <span className="px-2 py-0.5 text-xs font-medium text-text-muted bg-surface-3 rounded-md border border-border-subtle">
            PostCSS Parse Tree
          </span>
          <span className="px-2 py-0.5 text-xs font-mono text-text-faint bg-surface-2 rounded-md border border-border-subtle" data-testid="file-name">
            {fileName}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <input
            ref={fileInputRef}
            type="file"
            accept=".css"
            onChange={handleFileUpload}
            className="hidden"
            data-testid="file-input"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            data-testid="upload-btn"
            className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-md
                       bg-accent-purple/15 text-accent-purple border border-accent-purple/25
                       hover:bg-accent-purple/25 transition-colors cursor-pointer"
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            Load CSS File
          </button>

          {fileName !== 'demo.css' && (
            <button
              type="button"
              onClick={handleLoadDemo}
              data-testid="demo-btn"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md
                         bg-surface-3 text-text-muted border border-border-subtle
                         hover:bg-surface-4 hover:text-text-secondary transition-colors cursor-pointer"
            >
              Demo
            </button>
          )}

          <div className="flex items-center gap-2 text-xs text-text-faint ml-2">
            <span className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-surface-2">
              <span className="w-1.5 h-1.5 rounded-full bg-node-root" />root
            </span>
            <span className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-surface-2">
              <span className="w-1.5 h-1.5 rounded-full bg-node-atrule" />atrule
            </span>
            <span className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-surface-2">
              <span className="w-1.5 h-1.5 rounded-full bg-node-rule" />rule
            </span>
            <span className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-surface-2">
              <span className="w-1.5 h-1.5 rounded-full bg-node-decl" />decl
            </span>
            <span className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-surface-2">
              <span className="w-1.5 h-1.5 rounded-full bg-node-comment" />comment
            </span>
          </div>
        </div>
      </header>

      {/* Main content */}
      <div className="flex h-[calc(100vh-53px)]">
        <div className="flex-1 overflow-auto py-2">
          {error && (
            <div className="mx-4 mt-2 mb-1 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm font-mono flex items-center justify-between" data-testid="error-msg">
              <span>Parse error: {error}</span>
              <button type="button" onClick={() => setError(null)} aria-label="Cerrar error" className="ml-3 text-red-400/60 hover:text-red-400 text-xs cursor-pointer">✕</button>
            </div>
          )}
          {loading && (
            <div className="flex items-center justify-center h-full text-text-faint">
              <svg className="w-5 h-5 animate-spin mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
                <path d="M12 2a10 10 0 0 1 10 10" />
              </svg>
              Parsing CSS...
            </div>
          )}
          {!loading && astData && (
            <TreeNode node={astData} depth={0} selected={selected} onSelect={setSelected} />
          )}
        </div>

        <aside className="w-[420px] shrink-0 border-l border-border-subtle bg-surface-1 overflow-auto flex flex-col">
          <div className="px-5 py-3 border-b border-border-subtle bg-surface-2/50">
            <h2 className="text-xs font-semibold text-text-muted uppercase tracking-widest">Node Details</h2>
          </div>

          <div className="flex-1 p-5">
            {selected ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold uppercase tracking-wide ${
                    selected.type === 'root' ? 'bg-node-root/15 text-node-root' :
                    selected.type === 'atrule' ? 'bg-node-atrule/15 text-node-atrule' :
                    selected.type === 'rule' ? 'bg-node-rule/15 text-node-rule' :
                    selected.type === 'decl' ? 'bg-node-decl/15 text-node-decl' :
                    'bg-node-comment/15 text-node-comment'
                  }`}>
                    {selected.type}
                  </span>
                  <SourceBadge source={selected.source} />
                </div>

                <div className="rounded-lg border border-border-subtle bg-surface-2/50 divide-y divide-border-subtle">
                  {selected.selector && (
                    <div className="px-4 py-3">
                      <div className="text-[10px] font-semibold uppercase tracking-widest text-text-faint mb-1">Selector</div>
                      <code className="text-sm font-mono text-node-rule">{selected.selector}</code>
                    </div>
                  )}
                  {selected.name && (
                    <div className="px-4 py-3">
                      <div className="text-[10px] font-semibold uppercase tracking-widest text-text-faint mb-1">Name</div>
                      <code className="text-sm font-mono text-node-atrule">{selected.name}</code>
                    </div>
                  )}
                  {selected.params && (
                    <div className="px-4 py-3">
                      <div className="text-[10px] font-semibold uppercase tracking-widest text-text-faint mb-1">Params</div>
                      <code className="text-sm font-mono text-text-secondary">{selected.params}</code>
                    </div>
                  )}
                  {selected.prop && (
                    <div className="px-4 py-3">
                      <div className="text-[10px] font-semibold uppercase tracking-widest text-text-faint mb-1">Property</div>
                      <code className="text-sm font-mono text-node-decl">{selected.prop}</code>
                    </div>
                  )}
                  {selected.value && (
                    <div className="px-4 py-3">
                      <div className="text-[10px] font-semibold uppercase tracking-widest text-text-faint mb-1">Value</div>
                      <code className="text-sm font-mono text-text-primary">{selected.value}</code>
                    </div>
                  )}
                  {selected.important && (
                    <div className="px-4 py-3">
                      <div className="text-[10px] font-semibold uppercase tracking-widest text-text-faint mb-1">Important</div>
                      <span className="text-xs font-mono text-red-400 bg-red-400/10 px-1.5 py-0.5 rounded">!important</span>
                    </div>
                  )}
                  {selected.text !== undefined && (
                    <div className="px-4 py-3">
                      <div className="text-[10px] font-semibold uppercase tracking-widest text-text-faint mb-1">Comment</div>
                      <code className="text-sm font-mono text-node-comment whitespace-pre-wrap">{selected.text}</code>
                    </div>
                  )}
                  {selected.childCount !== undefined && (
                    <div className="px-4 py-3">
                      <div className="text-[10px] font-semibold uppercase tracking-widest text-text-faint mb-1">Children</div>
                      <span className="text-sm font-mono text-text-secondary">{selected.childCount ?? 0}</span>
                    </div>
                  )}
                </div>

                <details className="group">
                  <summary className="text-xs font-medium text-text-faint cursor-pointer hover:text-text-muted transition-colors flex items-center gap-1.5">
                    <svg className="w-3 h-3 transition-transform group-open:rotate-90" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
                      <path d="M6.22 3.22a.75.75 0 011.06 0l4.25 4.25a.75.75 0 010 1.06l-4.25 4.25a.75.75 0 01-1.06-1.06L9.94 8 6.22 4.28a.75.75 0 010-1.06z" />
                    </svg>
                    Raw JSON
                  </summary>
                  <pre className="mt-2 p-3 rounded-lg bg-surface-0 border border-border-subtle text-xs font-mono text-node-decl leading-relaxed overflow-auto whitespace-pre-wrap break-all">
                    {rawJson}
                  </pre>
                </details>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center gap-3 opacity-60">
                <svg className="w-10 h-10 text-text-faint" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.042 21.672L13.684 16.6m0 0l-2.51 2.225.569-9.47 5.227 7.917-3.286-.672zM12 2.25V4.5m5.834.166l-1.591 1.591M20.25 10.5H18M7.757 14.743l-1.59 1.59M6 10.5H3.75m4.007-4.243l-1.59-1.59" />
                </svg>
                <p className="text-text-faint text-sm">Click a node to see its details</p>
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
