import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import type * as THREE from "three";
import * as THREE_LIB from "three";

export function SpinningLogo() {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.5;
    }
  });

  const vertexShader = `
    varying vec3 vNormal;
    varying vec3 vPosition;
    
    void main() {
      vNormal = normalize(normalMatrix * normal);
      vPosition = position;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `;

  const fragmentShader = `
    uniform vec3 color1;
    uniform vec3 color2;
    uniform vec3 color3;
    uniform float time;
    
    varying vec3 vNormal;
    varying vec3 vPosition;
    
    void main() {
      vec3 light = normalize(vec3(0.5, 1.0, 0.5));
      float dProd = max(0.0, dot(vNormal, light));
      
      float gradientMix = (vPosition.y + 1.0) * 0.5;
      vec3 baseColor = mix(color1, color2, gradientMix);
      vec3 finalColor = mix(baseColor, color3, vPosition.z * 0.3 + 0.5);
      
      vec3 diffuse = finalColor * (0.5 + dProd * 0.5);
      vec3 emissive = finalColor * 0.3;
      
      gl_FragColor = vec4(diffuse + emissive, 0.95);
    }
  `;

  const createShaderMaterial = (baseColor: THREE_LIB.Color) => {
    const darkerColor = baseColor.clone().multiplyScalar(0.6);
    const lighterColor = baseColor
      .clone()
      .lerp(new THREE_LIB.Color(0xffffff), 0.3);

    return new THREE_LIB.ShaderMaterial({
      uniforms: {
        color1: { value: darkerColor },
        color2: { value: baseColor },
        color3: { value: lighterColor },
        time: { value: 0 },
      },
      vertexShader,
      fragmentShader,
      transparent: true,
    });
  };

  return (
    <group ref={groupRef}>
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[0.6, 64, 64]} />
        <primitive
          object={createShaderMaterial(new THREE_LIB.Color(0xffffff))}
        />
      </mesh>
      <mesh position={[0.8, 0.8, 0.8]}>
        <sphereGeometry args={[0.3, 64, 64]} />
        <primitive
          object={createShaderMaterial(new THREE_LIB.Color(0xcccccc))}
        />
      </mesh>
      <mesh position={[-0.8, -0.8, -0.8]}>
        <sphereGeometry args={[0.3, 64, 64]} />
        <primitive
          object={createShaderMaterial(new THREE_LIB.Color(0x999999))}
        />
      </mesh>
    </group>
  );
}
