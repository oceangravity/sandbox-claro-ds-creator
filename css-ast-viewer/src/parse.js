import postcss from 'postcss';

function nodeToJSON(node) {
  const result = { type: node.type };

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

  if (node.source) {
    result.source = {
      start: node.source.start,
      end: node.source.end,
    };
  }

  return result;
}

export function parseCSS(cssText) {
  const root = postcss.parse(cssText);
  return nodeToJSON(root);
}
