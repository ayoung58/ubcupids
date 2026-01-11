declare module "edmonds-blossom" {
  /**
   * Edmonds Blossom algorithm for maximum-weight matching
   *
   * @param edges - Array of edges in format [nodeA, nodeB, weight]
   * @param maxCardinality - If true, finds maximum-weight matching; if false, finds maximum cardinality
   * @returns Array where result[i] = j means node i is matched to node j, or -1 if unmatched
   */
  function Blossom(
    edges: [number, number, number][],
    maxCardinality?: boolean
  ): number[];

  export = Blossom;
}
