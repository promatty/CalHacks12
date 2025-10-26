import { useEffect, useState } from "react";
import { Graph3D, type GraphData } from "../../components/homepage";
import { Canvas } from "@react-three/fiber";
import { SpinningLogo } from "../Landing/SpinningLogo";

function HomePage() {
  const [mockGraphData, setMockGraphData] = useState<GraphData | null>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const startTime = Date.now();
    const duration = 25000; // ~25 seconds in milliseconds

    const progressInterval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const currentProgress = Math.min((elapsed / duration) * 100, 100);
      setProgress(Math.floor(currentProgress));
    }, 100); // update every 100ms

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
        clearInterval(progressInterval);
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
        clearInterval(progressInterval);
        return;
      }

      const graphDataResponse = await lavaResponse.json();
      const graphData = JSON.parse(
        graphDataResponse.response.choices[0].message.content
      );

      clearInterval(progressInterval);
      setProgress(100);
      setMockGraphData(graphData);
    })();

    return () => {
      clearInterval(progressInterval);
    };
  }, []);

  return (
    <div className="w-screen bg-black h-screen relative">
      <div className="absolute inset-0 bg-gradient-radial from-transparent via-black/50 to-black" />
      {mockGraphData ? (
        <Graph3D nodes={mockGraphData.nodes} edges={mockGraphData.edges} />
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <Canvas
            camera={{ position: [0, 0, 5], fov: 75 }}
            className="w-full h-full"
          >
            <ambientLight intensity={0.5} />
            <pointLight position={[10, 10, 10]} />
            <SpinningLogo />
          </Canvas>
          <div className="absolute bottom-1/4 text-6xl font-bold text-white">
            {progress}%
          </div>
        </div>
      )}
    </div>
  );
}

export default HomePage;
