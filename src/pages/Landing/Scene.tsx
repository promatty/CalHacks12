import { Grid } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
//import { AnimatedBox } from "./AnimatedBox";
import { AnimatedSphere } from "./AnimatedSphere";

export function Scene() {
  // Rotate camera around the scene
  useFrame(({ camera, clock }) => {
    const elapsed = clock.getElapsedTime();
    const radius = 20;
    const speed = 0.05;

    const x = Math.sin(elapsed * speed) * radius;
    const z = Math.cos(elapsed * speed) * radius;
    const y = 10;

    camera.position.set(x, y, z);
    camera.lookAt(0, 0, 0);
  });
  const initialPositions: [number, number, number][] = [
    // Original diagonal line
    [-9, 0.5, -9],
    [-3, 0.5, -3],
    [0, 0.5, 0],
    [3, 0.5, 3],
    [9, 0.5, 9],
    [-6, 0.5, 6],
    [6, 0.5, -6],
    [-12, 0.5, 0],
    [12, 0.5, 0],
    [0, 0.5, 12],

    [-15, 0.5, -9],
    [15, 0.5, 9],
    [-9, 0.5, 15],
    [9, 0.5, -15],
    [0, 0.5, -15],
    [0, 0.5, 15],
  ];

  // interpolate between white (#ffffff) and blue (#2596be)
  const interpolateColor = (index: number, total: number): string => {
    const t = index / (total - 1);
    const startColor = { r: 255, g: 255, b: 255 }; // #ffffff
    const endColor = { r: 37, g: 150, b: 190 }; // #2596be

    const r = Math.round(startColor.r + (endColor.r - startColor.r) * t);
    const g = Math.round(startColor.g + (endColor.g - startColor.g) * t);
    const b = Math.round(startColor.b + (endColor.b - startColor.b) * t);

    return `#${r.toString(16).padStart(2, "0")}${g
      .toString(16)
      .padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
  };

  return (
    <>
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} />
      <Grid
        renderOrder={-1}
        position={[0, 0, 0]}
        infiniteGrid
        cellSize={1}
        cellThickness={0.5}
        sectionSize={3}
        sectionThickness={1}
        sectionColor="#808080"
        fadeDistance={50}
      />
      {initialPositions.map((position, index) => (
        <AnimatedSphere
          key={index}
          initialPosition={position}
          color={interpolateColor(index, initialPositions.length)}
        />
      ))}
    </>
  );
}
