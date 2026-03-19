import type { ChildNode, Root } from 'postcss';

export interface ASTSource {
  start: { line: number; column: number; offset: number };
  end: { line: number; column: number; offset: number } | null;
}

export interface ASTRootNode {
  type: 'root';
  children: ASTNode[];
  source?: ASTSource;
}

export interface ASTAtRuleNode {
  type: 'atrule';
  name: string;
  params: string;
  children?: ASTNode[];
  source?: ASTSource;
}

export interface ASTRuleNode {
  type: 'rule';
  selector: string;
  children: ASTNode[];
  source?: ASTSource;
}

export interface ASTDeclNode {
  type: 'decl';
  prop: string;
  value: string;
  important: boolean;
  source?: ASTSource;
}

export interface ASTCommentNode {
  type: 'comment';
  text: string;
  source?: ASTSource;
}

export interface ASTUnknownNode {
  type: string;
  source?: ASTSource;
}

export type ASTNode = ASTRootNode | ASTAtRuleNode | ASTRuleNode | ASTDeclNode | ASTCommentNode | ASTUnknownNode;

export interface ASTSelectedNode {
  type: string;
  name?: string;
  params?: string;
  selector?: string;
  prop?: string;
  value?: string;
  important?: boolean;
  text?: string;
  source?: ASTSource;
  childCount?: number;
}

/**
 * Convierte un nodo del AST de PostCSS a un objeto JSON plano.
 * Usado tanto por el servidor API como por el script de parsing standalone.
 */
export function nodeToJSON(node: Root | ChildNode): ASTNode {
  const result: Record<string, unknown> = { type: node.type };

  if (node.type === 'root') {
    result.children = node.nodes?.map(nodeToJSON) || [];
  } else if (node.type === 'atrule') {
    result.name = `@${node.name}`;
    result.params = node.params || '';
    if (node.nodes) {
      result.children = node.nodes.map(nodeToJSON);
    }
  } else if (node.type === 'rule') {
    result.selector = node.selector;
    result.children = node.nodes?.map(nodeToJSON) || [];
  } else if (node.type === 'decl') {
    result.prop = node.prop;
    result.value = node.value;
    result.important = node.important || false;
  } else if (node.type === 'comment') {
    result.text = node.text;
  }

  if (node.source?.start) {
    result.source = {
      start: node.source.start,
      end: node.source.end ?? null,
    };
  }

  return result as unknown as ASTNode;
}
