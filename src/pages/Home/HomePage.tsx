import { Graph3D, mockGraphData } from '../../components/homepage';

function HomePage() {
  return (
    <div className="w-screen bg-black h-screen relative">
      <div className="absolute inset-0 bg-gradient-radial from-transparent via-black/50 to-black" />
      <Graph3D nodes={mockGraphData.nodes} edges={mockGraphData.edges} />
    </div>
  );
}

export default HomePage;

