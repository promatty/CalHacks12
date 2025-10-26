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

export interface EdgeData {
  id: string;
  source: string;
  target: string;
}

export interface GraphData {
  nodes: NodeData[];
  edges: EdgeData[];
}
