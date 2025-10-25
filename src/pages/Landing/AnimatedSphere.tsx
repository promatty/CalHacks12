import { useFrame } from "@react-three/fiber";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

export function AnimatedSphere({
	initialPosition,
}: {
	initialPosition: [number, number, number];
}) {
	const meshRef = useRef<THREE.Mesh>(null);
	const [targetPosition, setTargetPosition] = useState(
		new THREE.Vector3(...initialPosition)
	);
	const currentPosition = useRef(new THREE.Vector3(...initialPosition));

	const getAdjacentIntersection = (current: THREE.Vector3) => {
		const directions = [
			[1, 0],
			[-1, 0],
			[0, 1],
			[0, -1],
		];
		const randomDirection =
			directions[Math.floor(Math.random() * directions.length)];
		return new THREE.Vector3(
			current.x + randomDirection[0] * 3,
			0.5,
			current.z + randomDirection[1] * 3
		);
	};

	useEffect(() => {
		const interval = setInterval(() => {
			const newPosition = getAdjacentIntersection(currentPosition.current);
			newPosition.x = Math.max(-15, Math.min(15, newPosition.x));
			newPosition.z = Math.max(-15, Math.min(15, newPosition.z));
			setTargetPosition(newPosition);
		}, 1000);

		return () => clearInterval(interval);
	}, []);

	useFrame(() => {
		if (meshRef.current) {
			currentPosition.current.lerp(targetPosition, 0.1);
			meshRef.current.position.copy(currentPosition.current);
		}
	});

	return (
		<mesh ref={meshRef} position={initialPosition}>
			<sphereGeometry args={[0.5, 32, 32]} />
			<meshStandardMaterial color="#ffffff" opacity={0.9} transparent />
		</mesh>
	);
}
