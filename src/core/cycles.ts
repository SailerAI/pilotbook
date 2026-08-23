export function findCycle(graph: Map<string, string[]>): string[] | null {
  const visiting = new Set<string>();
  const visited = new Set<string>();
  const stack: string[] = [];

  function dfs(node: string): string[] | null {
    if (visiting.has(node)) {
      const start = stack.indexOf(node);
      return [...stack.slice(start), node];
    }
    if (visited.has(node)) return null;
    visiting.add(node);
    stack.push(node);
    for (const next of graph.get(node) ?? []) {
      const found = dfs(next);
      if (found) return found;
    }
    stack.pop();
    visiting.delete(node);
    visited.add(node);
    return null;
  }

  for (const node of graph.keys()) {
    const found = dfs(node);
    if (found) return found;
  }
  return null;
}

/** Returns the cycle that would be created by adding edge from -> to, or null. */
export function cycleIfAdded(
  graph: Map<string, string[]>,
  from: string,
  to: string,
): string[] | null {
  const copy = new Map<string, string[]>();
  for (const [k, v] of graph) copy.set(k, [...v]);
  if (!copy.has(from)) copy.set(from, []);
  copy.get(from)?.push(to);
  if (!copy.has(to)) copy.set(to, []);
  return findCycle(copy);
}
