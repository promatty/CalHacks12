import type { Endpoints } from "@octokit/types";

export interface NodeData {
  id: string;
  name: string;
  editCount: number;
  fileLength: number;
  velocity?: {
    x: number;
    y: number;
    z: number;
  };
}

export type InitializedNodeData = NodeData & {
  position: {
    x: number;
    y: number;
    z: number;
  };
};

export interface EdgeData {
  id: string;
  source: string;
  target: string;
}

export interface GraphData {
  nodes: NodeData[];
  edges: EdgeData[];
}

// github types
export type GetCommitResponse =
  Endpoints["GET /repos/{owner}/{repo}/commits"]["response"];

// Single-commit/list item type for the commits list endpoint
export type Commit =
  Endpoints["GET /repos/{owner}/{repo}/commits"]["response"]["data"][0];
