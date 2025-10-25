import type { EdgeData, NodeData } from './types';

export const getHeatMapColor = (editCount: number, maxEdits: number): string => {
  const intensity = Math.min(editCount / maxEdits, 1);
  
  if (intensity < 0.33) {
    const r = Math.floor(100 + intensity * 3 * 155);
    return `rgb(${r}, 200, 255)`;
  } else if (intensity < 0.66) {
    const g = Math.floor(200 - (intensity - 0.33) * 3 * 100);
    return `rgb(255, ${g}, 100)`;
  } else {
    const b = Math.floor(100 - (intensity - 0.66) * 3 * 100);
    return `rgb(255, 100, ${b})`;
  }
};

export const applyForces = (nodes: NodeData[], edges: EdgeData[], deltaTime: number) => {
  const updatedNodes = nodes.map(node => ({
    ...node,
    velocity: node.velocity || { x: 0, y: 0, z: 0 }
  }));

  const repulsionStrength = 5;
  const attractionStrength = 0.05;
  const damping = 0.9;
  const centeringStrength = 0.01;

  for (let i = 0; i < updatedNodes.length; i++) {
    const nodeA = updatedNodes[i];
    
    for (let j = i + 1; j < updatedNodes.length; j++) {
      const nodeB = updatedNodes[j];
      
      const dx = nodeB.position.x - nodeA.position.x;
      const dy = nodeB.position.y - nodeA.position.y;
      const dz = nodeB.position.z - nodeA.position.z;
      const distance = Math.sqrt(dx * dx + dy * dy + dz * dz) + 0.01;
      
      const force = repulsionStrength / (distance * distance);
      const fx = (dx / distance) * force;
      const fy = (dy / distance) * force;
      const fz = (dz / distance) * force;
      
      nodeA.velocity!.x -= fx * deltaTime;
      nodeA.velocity!.y -= fy * deltaTime;
      nodeA.velocity!.z -= fz * deltaTime;
      nodeB.velocity!.x += fx * deltaTime;
      nodeB.velocity!.y += fy * deltaTime;
      nodeB.velocity!.z += fz * deltaTime;
    }
  }

  edges.forEach(edge => {
    const sourceNode = updatedNodes.find(n => n.id === edge.source);
    const targetNode = updatedNodes.find(n => n.id === edge.target);
    
    if (sourceNode && targetNode) {
      const dx = targetNode.position.x - sourceNode.position.x;
      const dy = targetNode.position.y - sourceNode.position.y;
      const dz = targetNode.position.z - sourceNode.position.z;
      const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
      
      const force = (distance - 3) * attractionStrength;
      const fx = (dx / distance) * force;
      const fy = (dy / distance) * force;
      const fz = (dz / distance) * force;
      
      sourceNode.velocity!.x += fx * deltaTime;
      sourceNode.velocity!.y += fy * deltaTime;
      sourceNode.velocity!.z += fz * deltaTime;
      targetNode.velocity!.x -= fx * deltaTime;
      targetNode.velocity!.y -= fy * deltaTime;
      targetNode.velocity!.z -= fz * deltaTime;
    }
  });

  updatedNodes.forEach(node => {
    node.velocity!.x -= node.position.x * centeringStrength * deltaTime;
    node.velocity!.y -= node.position.y * centeringStrength * deltaTime;
    node.velocity!.z -= node.position.z * centeringStrength * deltaTime;
    
    node.velocity!.x *= damping;
    node.velocity!.y *= damping;
    node.velocity!.z *= damping;
    
    node.position.x += node.velocity!.x * deltaTime;
    node.position.y += node.velocity!.y * deltaTime;
    node.position.z += node.velocity!.z * deltaTime;
  });

  return updatedNodes;
};

export const getConnectedNodeIds = (nodeId: string, edges: EdgeData[]): Set<string> => {
  const connected = new Set<string>();
  
  edges.forEach(edge => {
    if (edge.source === nodeId) {
      connected.add(edge.target);
    }
    if (edge.target === nodeId) {
      connected.add(edge.source);
    }
  });
  
  return connected;
};

export const applyMouseInfluence = (
  nodes: NodeData[],
  mousePosition: { x: number; y: number; z: number },
  influenceRadius: number = 1,
  influenceStrength: number = 0.01
) => {
  return nodes.map(node => {
    const dx = node.position.x - mousePosition.x;
    const dy = node.position.y - mousePosition.y;
    const dz = node.position.z - mousePosition.z;
    const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);

    if (distance < influenceRadius && distance > 0.1) {
      const influence = (1 - distance / influenceRadius) * influenceStrength;
      const offsetX = (dx / distance) * influence;
      const offsetY = (dy / distance) * influence;
      const offsetZ = (dz / distance) * influence;

      return {
        ...node,
        position: {
          x: node.position.x + offsetX,
          y: node.position.y + offsetY,
          z: node.position.z + offsetZ,
        }
      };
    }

    return node;
  });
};

