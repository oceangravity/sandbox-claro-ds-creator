import React, { useState } from 'react';

const TYPE_CONFIG = {
  root: { color: 'text-node-root', bg: 'bg-node-root/15', icon: '\u25c6' },
  atrule: { color: 'text-node-atrule', bg: 'bg-node-atrule/15', icon: '@' },
  rule: { color: 'text-node-rule', bg: 'bg-node-rule/15', icon: '#' },
  decl: { color: 'text-node-decl', bg: 'bg-node-decl/15', icon: '\u2192' },
  comment: { color: 'text-node-comment', bg: 'bg-node-comment/15', icon: '//' },
};

function getLabel(node) {
  switch (node.type) {
    case 'root':
      return 'Root';
    case 'atrule':
      return `${node.name} ${node.params || ''}`.trim();
    case 'rule':
      return node.selector;
    case 'decl':
      return `${node.prop}: ${node.value}`;
    case 'comment':
      return `/* ${node.text} */`;
    default:
      return node.type;
  }
}

export function TreeNode({ node, depth, selected, onSelect }) {
  const [expanded, setExpanded] = useState(depth < 2);
  const hasChildren = node.children && node.children.length > 0;
  const config = TYPE_CONFIG[node.type] || TYPE_CONFIG.comment;
  const isSelected = selected === node;

  const handleToggle = (e) => {
    e.stopPropagation();
    if (hasChildren) setExpanded(!expanded);
  };

  const handleSelect = (e) => {
    e.stopPropagation();
    const { children, ...details } = node;
    onSelect({ ...details, childCount: children?.length });
  };

  return (
    <div>
      {/* Row */}
      <div
        onClick={handleSelect}
        onDoubleClick={handleToggle}
        className={`
          group flex items-center gap-1.5 py-1 pr-3 cursor-pointer select-none text-[13px] leading-6
          transition-colors duration-75
          ${isSelected
            ? 'bg-accent-blue/10 border-r-2 border-accent-blue'
            : 'hover:bg-surface-2/60 border-r-2 border-transparent'
          }
        `}
        style={{ paddingLeft: `${12 + depth * 20}px` }}
      >
        {/* Chevron */}
        <span
          onClick={handleToggle}
          className={`
            inline-flex items-center justify-center w-4 h-4 shrink-0 text-[10px] text-text-faint
            transition-transform duration-150 cursor-pointer rounded
            hover:bg-surface-4 hover:text-text-muted
            ${hasChildren ? 'visible' : 'invisible'}
            ${expanded ? 'rotate-90' : 'rotate-0'}
          `}
        >
          &#9656;
        </span>

        {/* Type icon */}
        <span className={`text-xs font-bold w-4 text-center shrink-0 ${config.color}`}>
          {config.icon}
        </span>

        {/* Type badge */}
        <span className={`text-[10px] font-semibold px-1.5 py-px rounded shrink-0 uppercase tracking-wider ${config.bg} ${config.color}`}>
          {node.type}
        </span>

        {/* Label */}
        <span className="text-text-secondary truncate font-mono text-[13px] group-hover:text-text-primary transition-colors">
          {getLabel(node)}
        </span>

        {/* Child count */}
        {hasChildren && (
          <span className="ml-auto shrink-0 text-[11px] text-text-faint tabular-nums bg-surface-3 px-1.5 py-px rounded-full">
            {node.children.length}
          </span>
        )}
      </div>

      {/* Children */}
      {expanded && hasChildren && (
        <div className="relative">
          {/* Guide line */}
          <div
            className="absolute top-0 bottom-0 w-px bg-border-subtle"
            style={{ left: `${22 + depth * 20}px` }}
          />
          {node.children.map((child, i) => (
            <TreeNode
              key={i}
              node={child}
              depth={depth + 1}
              selected={selected}
              onSelect={onSelect}
            />
          ))}
        </div>
      )}
    </div>
  );
}
