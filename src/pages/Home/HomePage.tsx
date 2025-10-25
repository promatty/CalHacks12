import { Graph3D, mockGraphData } from '../../components/homepage';

function HomePage() {
  return (
    <div className="w-screen h-screen bg-black overflow-hidden">
      <Graph3D nodes={mockGraphData.nodes} edges={mockGraphData.edges} />
    </div>
  );
}

export default HomePage;

