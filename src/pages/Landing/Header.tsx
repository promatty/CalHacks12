import { Canvas } from "@react-three/fiber";
import { SpinningLogo } from "./SpinningLogo";

export function Header() {
  return (
    <header className="absolute top-0 left-0 right-0 z-10 p-4">
      <nav className="flex items-center max-w-6xl mx-auto">
        <div className="flex items-center space-x-2">
          <div className="w-16 h-16">
            <Canvas camera={{ position: [0, 0, 5] }}>
              <ambientLight intensity={0.5} />
              <pointLight position={[10, 10, 10]} />
              <SpinningLogo />
            </Canvas>
          </div>
          <span className="text-2xl font-bold">ProjectTitle</span>
        </div>
      </nav>
    </header>
  );
}
