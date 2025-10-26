import { useEffect, useState, useRef } from "react";
import { Graph3D, type GraphData } from "../../components/homepage";
import { Canvas } from "@react-three/fiber";
import { SpinningLogo } from "../Landing/SpinningLogo";

function HomePage() {
  const [mockGraphData, setMockGraphData] = useState<GraphData | null>(null);
  const [progress, setProgress] = useState(0);
  const dataLoadedRef = useRef(false);

  useEffect(() => {
    const cacheKey = "home_graph_data_v1";

    // Try to read from sessionStorage first. If present, use it and skip network work.
    try {
      const cached = sessionStorage.getItem(cacheKey);
      if (cached) {
        const graph = JSON.parse(cached) as GraphData;
        dataLoadedRef.current = true;
        setProgress(100);
        // small timeout to ensure UI updates smoothly
        setTimeout(() => setMockGraphData(graph), 50);
        return;
      }
    } catch (e) {
      // sessionStorage can throw in some environments; fall back to network fetch
      console.warn("sessionStorage read failed", e);
    }

    const startTime = Date.now();
    const duration = 25000; // ~25 seconds in milliseconds

    const progressInterval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const currentProgress = Math.min((elapsed / duration) * 100, 99); // cap at 99% until loaded
      if (!dataLoadedRef.current) {
        setProgress(Math.floor(currentProgress));
      }
    }, 100); // update every 100ms

    (async () => {
      try {
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
          throw new Error("Failed to fetch chroma data");
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
          throw new Error("Failed to fetch lava data");
        }

        const graphDataResponse = await lavaResponse.json();
        const graphData = JSON.parse(
          graphDataResponse.response.choices[0].message.content
        );

        // cache result in sessionStorage so reloads don't re-run the heavy query
        try {
          sessionStorage.setItem(cacheKey, JSON.stringify(graphData));
        } catch (e) {
          console.warn("sessionStorage write failed", e);
        }

        dataLoadedRef.current = true;
        clearInterval(progressInterval);
        setProgress(100);

        // small delay to show 100% before displaying the graph
        setTimeout(() => {
          setMockGraphData(graphData);
        }, 100);
      } catch (err) {
        console.error(err);
        clearInterval(progressInterval);
      }
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
            Thinking... {progress}%
          </div>
        </div>
      )}
    </div>
  );
}

export default HomePage;
