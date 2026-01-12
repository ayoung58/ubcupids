/**
 * Type declaration for edmonds-blossom package
 * This module provides maximum-weight perfect matching using the Blossom algorithm
 */
declare module "edmonds-blossom" {
  /**
   * Finds maximum-weight perfect matching in a graph
   *
   * @param edges - Array of edges, each edge is [nodeA, nodeB, weight]
   * @param maximum - If true, finds maximum weight matching; if false, finds minimum weight
   * @returns Array where result[i] = j means node i is matched to node j, -1 means unmatched
   */
  function Blossom(
    edges: [number, number, number][],
    maximum?: boolean
  ): number[];

  export = Blossom;
}
