import { Canvas } from "@react-three/fiber"
import { SpinningLogo } from "./SpinningLogo"

export function Header() {
  return (
    <header className="absolute top-0 left-0 right-0 z-10 p-4">
      <nav className="flex justify-between items-center max-w-6xl mx-auto">
        <div className="flex items-center">
          <div className="w-20 h-20">
            <Canvas camera={{ position: [0, 0, 5] }}>
              <ambientLight intensity={0.5} />
              <pointLight position={[10, 10, 10]} />
              <SpinningLogo />
            </Canvas>
          </div>
          <span className="text-2xl font-bold">ChainSwitch</span>
        </div>
        <ul className="flex space-x-6">
          <li>
            <a href="#" className="hover:text-gray-300">
              Home
            </a>
          </li>
          <li>
            <a href="#" className="hover:text-gray-300">
              Features
            </a>
          </li>
          <li>
            <a href="#" className="hover:text-gray-300">
              Pricing
            </a>
          </li>
          <li>
            <a href="#" className="hover:text-gray-300">
              Contact
            </a>
          </li>
        </ul>
      </nav>
    </header>
  )
}
