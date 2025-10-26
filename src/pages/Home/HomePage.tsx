import { useEffect, useState } from "react";
import { Graph3D, type GraphData } from "../../components/homepage";

function HomePage() {
  const [mockGraphData, setMockGraphData] = useState<GraphData | null>(null);

  useEffect(() => {
    (async () => {
      const chromaResponse = await fetch(
        // change eventually to the actual filename
        `http://localhost:8000/api/chroma/all`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!chromaResponse.ok) {
        console.error("Failed to fetch chroma data");
        return;
      }

      const chromaData = await chromaResponse.json();

      const lavaResponse = await fetch(
        // change eventually to the actual filename
        `http://localhost:8000/api/lava`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ query: chromaData }),
        }
      );
      if (!lavaResponse.ok) {
        console.error("Failed to fetch lava data");
        return;
      }

      const graphDataResponse = await lavaResponse.json();
      const graphData = JSON.parse(
        graphDataResponse.response.choices[0].message.content
      );

      setMockGraphData(graphData);
    })();

    return () => {};
  }, []);

  return (
    <div className="w-screen bg-black h-screen relative">
      <div className="absolute inset-0 bg-gradient-radial from-transparent via-black/50 to-black" />
      {mockGraphData && (
        <Graph3D nodes={mockGraphData.nodes} edges={mockGraphData.edges} />
      )}
    </div>
  );
}

export default HomePage;
