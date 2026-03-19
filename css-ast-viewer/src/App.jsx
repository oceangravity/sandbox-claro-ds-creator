import React, { useState } from 'react';
import astData from './ast-data.json';
import { TreeNode } from './TreeNode.jsx';

function NodeDetailValue({ label, value }) {
  if (value === undefined || value === null) return null;
  return (
    <div className="flex items-baseline gap-2 py-1">
      <span className="text-text-muted text-xs font-medium uppercase tracking-wider shrink-0">{label}</span>
      <span className="text-text-secondary font-mono text-sm break-all">{String(value)}</span>
    </div>
  );
}

function SourceBadge({ source }) {
  if (!source?.start) return null;
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-surface-3 text-text-faint text-xs font-mono">
      <svg className="w-3 h-3" viewBox="0 0 16 16" fill="currentColor">
        <path d="M1 3.5A1.5 1.5 0 012.5 2h3.879a1.5 1.5 0 011.06.44l1.122 1.12A1.5 1.5 0 009.62 4H13.5A1.5 1.5 0 0115 5.5v7a1.5 1.5 0 01-1.5 1.5h-11A1.5 1.5 0 011 12.5v-9z" />
      </svg>
      L{source.start.line}:{source.start.column}
      {source.end && <span className="text-text-faint/50">– L{source.end.line}:{source.end.column}</span>}
    </span>
  );
}

export default function App() {
  const [selected, setSelected] = useState(null);

  return (
    <div className="min-h-screen bg-surface-0 text-text-secondary font-sans flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-3 border-b border-border-subtle bg-surface-1/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-accent-purple/15">
            <svg className="w-4 h-4 text-accent-purple" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="16 18 22 12 16 6" />
              <polyline points="8 6 2 12 8 18" />
            </svg>
          </div>
          <h1 className="text-lg font-semibold text-text-primary tracking-tight">CSS AST Viewer</h1>
          <span className="px-2 py-0.5 text-xs font-medium text-text-muted bg-surface-3 rounded-md border border-border-subtle">
            PostCSS Parse Tree
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs text-text-faint">
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
        </div>
      </header>

      {/* Main content */}
      <div className="flex h-[calc(100vh-53px)]">
        {/* Tree panel */}
        <div className="flex-1 overflow-auto py-2">
          <TreeNode node={astData} depth={0} selected={selected} onSelect={setSelected} />
        </div>

        {/* Detail panel - fixed height, independent scroll */}
        <aside className="w-[420px] shrink-0 border-l border-border-subtle bg-surface-1 overflow-auto flex flex-col">
          <div className="px-5 py-3 border-b border-border-subtle bg-surface-2/50">
            <h2 className="text-xs font-semibold text-text-muted uppercase tracking-widest">Node Details</h2>
          </div>

          <div className="flex-1 p-5">
            {selected ? (
              <div className="space-y-4">
                {/* Type + source header */}
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

                {/* Properties */}
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
                  {selected.childCount !== undefined && (
                    <div className="px-4 py-3">
                      <div className="text-[10px] font-semibold uppercase tracking-widest text-text-faint mb-1">Children</div>
                      <span className="text-sm font-mono text-text-secondary">{selected.childCount ?? 0}</span>
                    </div>
                  )}
                </div>

                {/* Raw JSON */}
                <details className="group">
                  <summary className="text-xs font-medium text-text-faint cursor-pointer hover:text-text-muted transition-colors flex items-center gap-1.5">
                    <svg className="w-3 h-3 transition-transform group-open:rotate-90" viewBox="0 0 16 16" fill="currentColor">
                      <path d="M6.22 3.22a.75.75 0 011.06 0l4.25 4.25a.75.75 0 010 1.06l-4.25 4.25a.75.75 0 01-1.06-1.06L9.94 8 6.22 4.28a.75.75 0 010-1.06z" />
                    </svg>
                    Raw JSON
                  </summary>
                  <pre className="mt-2 p-3 rounded-lg bg-surface-0 border border-border-subtle text-xs font-mono text-node-decl leading-relaxed overflow-auto whitespace-pre-wrap break-all">
                    {JSON.stringify(selected, null, 2)}
                  </pre>
                </details>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center gap-3 opacity-60">
                <svg className="w-10 h-10 text-text-faint" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
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
