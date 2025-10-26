export interface NodeData {
  id: string;
  name: string;
  editCount: number;
  position?: {
    x: number;
    y: number;
    z: number;
  };
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

