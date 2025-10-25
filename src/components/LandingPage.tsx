import { Canvas } from "@react-three/fiber";
import { Header } from "./Header";
import { Hero } from "./Hero";
import { Scene } from "./Scene";

export default function LandingPage() {
  return (
    <div className="relative w-full h-screen bg-black text-white overflow-hidden font-sans">
      <Header />
      <Hero />
      <Canvas
        shadows
        camera={{ position: [30, 30, 30], fov: 50 }}
        className="absolute inset-0"
      >
        <Scene />
      </Canvas>
    </div>
  );
}
