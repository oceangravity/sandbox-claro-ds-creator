import { useState, useCallback, memo, type MouseEvent, type KeyboardEvent } from 'react';
import type {
  ASTNode, ASTSelectedNode,
  ASTAtRuleNode, ASTRuleNode, ASTDeclNode, ASTCommentNode,
} from '../lib/node-to-json.ts';

interface TypeStyle {
  color: string;
  bg: string;
  icon: string;
}

const TYPE_CONFIG: Record<string, TypeStyle> = {
  root: { color: 'text-node-root', bg: 'bg-node-root/15', icon: '\u25c6' },
  atrule: { color: 'text-node-atrule', bg: 'bg-node-atrule/15', icon: '@' },
  rule: { color: 'text-node-rule', bg: 'bg-node-rule/15', icon: '#' },
  decl: { color: 'text-node-decl', bg: 'bg-node-decl/15', icon: '\u2192' },
  comment: { color: 'text-node-comment', bg: 'bg-node-comment/15', icon: '//' },
};

function getLabel(node: ASTNode): string {
  switch (node.type) {
    case 'root': return 'Root';
    case 'atrule': return `${(node as ASTAtRuleNode).name} ${(node as ASTAtRuleNode).params || ''}`.trim();
    case 'rule': return (node as ASTRuleNode).selector || '';
    case 'decl': return `${(node as ASTDeclNode).prop || ''}: ${(node as ASTDeclNode).value || ''}`;
    case 'comment': return `/* ${(node as ASTCommentNode).text || ''} */`;
    default: return node.type;
  }
}

function getNodeKey(node: ASTNode, index: number): string {
  switch (node.type) {
    case 'decl': return `decl-${(node as ASTDeclNode).prop}-${index}`;
    case 'rule': return `rule-${(node as ASTRuleNode).selector}-${index}`;
    case 'atrule': return `atrule-${(node as ASTAtRuleNode).name}-${(node as ASTAtRuleNode).params || ''}-${index}`;
    case 'comment': return `comment-${index}`;
    default: return `${node.type}-${index}`;
  }
}

function getChildren(node: ASTNode): ASTNode[] | undefined {
  if ('children' in node) return node.children as ASTNode[];
  return undefined;
}

interface TreeNodeProps {
  node: ASTNode;
  depth: number;
  selected: ASTNode | null;
  onSelect: (node: ASTSelectedNode) => void;
}

export const TreeNode = memo(function TreeNode({ node, depth, selected, onSelect }: TreeNodeProps) {
  const [expanded, setExpanded] = useState(depth < 2);
  const children = getChildren(node);
  const hasChildren = children != null && children.length > 0;
  const config = TYPE_CONFIG[node.type] || TYPE_CONFIG.comment;
  const isSelected = selected === node;
  const label = getLabel(node);

  const handleToggle = useCallback((e: MouseEvent | KeyboardEvent) => {
    e.stopPropagation();
    if (hasChildren) setExpanded(prev => !prev);
  }, [hasChildren]);

  const handleSelect = useCallback((e: MouseEvent | KeyboardEvent) => {
    e.stopPropagation();
    const { children: _, ...details } = node as ASTNode & { children?: ASTNode[] };
    onSelect({ ...details, childCount: children?.length } as ASTSelectedNode);
  }, [node, onSelect, children]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleSelect(e);
    } else if (e.key === 'ArrowRight' && hasChildren && !expanded) {
      e.preventDefault();
      setExpanded(true);
    } else if (e.key === 'ArrowLeft' && hasChildren && expanded) {
      e.preventDefault();
      setExpanded(false);
    }
  }, [handleSelect, hasChildren, expanded]);

  return (
    <div role="treeitem" aria-expanded={hasChildren ? expanded : undefined} aria-selected={isSelected}>
      {/* Row */}
      <div
        onClick={handleSelect}
        onDoubleClick={handleToggle}
        onKeyDown={handleKeyDown}
        tabIndex={0}
        role="button"
        aria-label={`${node.type}: ${label}`}
        className={`
          group flex items-center gap-1.5 py-1 pr-3 cursor-pointer select-none text-[13px] leading-6
          transition-colors duration-75 outline-none focus-visible:ring-1 focus-visible:ring-accent-blue/50
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
          aria-hidden="true"
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
        <span className={`text-xs font-bold w-4 text-center shrink-0 ${config.color}`} aria-hidden="true">
          {config.icon}
        </span>

        {/* Type badge */}
        <span className={`text-[10px] font-semibold px-1.5 py-px rounded shrink-0 uppercase tracking-wider ${config.bg} ${config.color}`}>
          {node.type}
        </span>

        {/* Label */}
        <span className="text-text-secondary truncate font-mono text-[13px] group-hover:text-text-primary transition-colors">
          {label}
        </span>

        {/* Child count */}
        {hasChildren && children && (
          <span className="ml-auto shrink-0 text-[11px] text-text-faint tabular-nums bg-surface-3 px-1.5 py-px rounded-full" aria-label={`${children.length} hijos`}>
            {children.length}
          </span>
        )}
      </div>

      {/* Children */}
      {expanded && hasChildren && children && (
        <div className="relative" role="group">
          {/* Guide line */}
          <div
            className="absolute top-0 bottom-0 w-px bg-border-subtle"
            style={{ left: `${22 + depth * 20}px` }}
            aria-hidden="true"
          />
          {children.map((child, i) => (
            <TreeNode
              key={getNodeKey(child, i)}
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
});
