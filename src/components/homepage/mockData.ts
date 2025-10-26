import type { GraphData } from './types';

export const mockGraphData: GraphData = {
  nodes: [
    { id: '1', name: 'App.tsx', editCount: 45 },
    { id: '2', name: 'HomePage.tsx', editCount: 32 },
    { id: '3', name: 'LandingPage.tsx', editCount: 28 },
    { id: '4', name: 'index.tsx', editCount: 15 },
    { id: '5', name: 'utils.ts', editCount: 52 },
    { id: '6', name: 'api.ts', editCount: 38 },
    { id: '7', name: 'types.ts', editCount: 20 },
    { id: '8', name: 'Header.tsx', editCount: 12 },
    { id: '9', name: 'Footer.tsx', editCount: 8 },
    { id: '10', name: 'config.ts', editCount: 25 },
  ],
  edges: [
    { id: 'e1', source: '1', target: '2' },
    { id: 'e2', source: '1', target: '3' },
    { id: 'e3', source: '1', target: '4' },
    { id: 'e4', source: '2', target: '5' },
    { id: 'e5', source: '3', target: '5' },
    { id: 'e6', source: '4', target: '6' },
    { id: 'e7', source: '5', target: '6' },
    { id: 'e8', source: '5', target: '7' },
    { id: 'e9', source: '2', target: '8' },
    { id: 'e10', source: '3', target: '9' },
    { id: 'e11', source: '6', target: '10' },
    { id: 'e12', source: '7', target: '10' },
  ],
};

