import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import type { EdgeData, NodeData } from './types';
import { applyForces, getConnectedNodeIds, getHeatMapColor, applyMouseInfluence } from './utils';

interface Graph3DProps {
  nodes: NodeData[];
  edges: EdgeData[];
}

export default function Graph3D({ nodes: initialNodes, edges }: Graph3DProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const nodesRef = useRef<NodeData[]>(initialNodes);
  const nodeMeshesRef = useRef<Map<string, THREE.Mesh>>(new Map());
  const edgeLinesRef = useRef<Map<string, THREE.Line>>(new Map());
  const raycasterRef = useRef<THREE.Raycaster>(new THREE.Raycaster());
  const mouseRef = useRef<THREE.Vector2>(new THREE.Vector2());
  const mouse3DRef = useRef<THREE.Vector3>(new THREE.Vector3());
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0a0a);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(
      75,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );
    camera.position.set(0, 0, 20);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);

    const pointLight1 = new THREE.PointLight(0xffffff, 1.5);
    pointLight1.position.set(10, 10, 10);
    scene.add(pointLight1);

    const pointLight2 = new THREE.PointLight(0x4488ff, 0.8);
    pointLight2.position.set(-10, -10, -10);
    scene.add(pointLight2);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
    directionalLight.position.set(5, 10, 7.5);
    scene.add(directionalLight);

    const maxEdits = Math.max(...nodesRef.current.map(n => n.editCount));

    nodesRef.current.forEach(node => {
      const geometry = new THREE.IcosahedronGeometry(0.6, 1);
      const color = getHeatMapColor(node.editCount, maxEdits);
      const material = new THREE.MeshPhysicalMaterial({
        color: new THREE.Color(color),
        emissive: new THREE.Color(color),
        emissiveIntensity: 0.4,
        metalness: 0.3,
        roughness: 0.2,
        clearcoat: 1.0,
        clearcoatRoughness: 0.1,
        reflectivity: 0.8,
        transmission: 0.1,
        transparent: true,
        opacity: 0.95,
      });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(node.position.x, node.position.y, node.position.z);
      mesh.userData = { nodeId: node.id };
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      scene.add(mesh);
      nodeMeshesRef.current.set(node.id, mesh);
    });

    edges.forEach(edge => {
      const sourceNode = nodesRef.current.find(n => n.id === edge.source);
      const targetNode = nodesRef.current.find(n => n.id === edge.target);
      
      if (sourceNode && targetNode) {
        const points = [
          new THREE.Vector3(sourceNode.position.x, sourceNode.position.y, sourceNode.position.z),
          new THREE.Vector3(targetNode.position.x, targetNode.position.y, targetNode.position.z),
        ];
        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        const material = new THREE.LineBasicMaterial({
          color: 0x444444,
          opacity: 0.6,
          transparent: true,
        });
        const line = new THREE.Line(geometry, material);
        scene.add(line);
        edgeLinesRef.current.set(edge.id, line);
      }
    });

    const handleMouseMove = (event: MouseEvent) => {
      if (!container || !camera) return;
      const rect = container.getBoundingClientRect();
      mouseRef.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouseRef.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      const vector = new THREE.Vector3(mouseRef.current.x, mouseRef.current.y, 0.5);
      vector.unproject(camera);
      const dir = vector.sub(camera.position).normalize();
      const distance = -camera.position.z / dir.z;
      const pos = camera.position.clone().add(dir.multiplyScalar(distance));
      
      mouse3DRef.current.copy(pos);
    };

    const handleResize = () => {
      if (!container || !camera || !renderer) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('resize', handleResize);

    let lastTime = Date.now();
    const animate = () => {
      requestAnimationFrame(animate);

      const currentTime = Date.now();
      const deltaTime = Math.min((currentTime - lastTime) / 1000, 0.1);
      lastTime = currentTime;

      if (camera) {
        const targetX = mouseRef.current.x * 2;
        const targetY = mouseRef.current.y * 2;
        camera.position.x += (targetX - camera.position.x) * 0.02;
        camera.position.y += (targetY - camera.position.y) * 0.02;
        camera.lookAt(0, 0, 0);
      }

      nodesRef.current = applyForces(nodesRef.current, edges, deltaTime);

      nodesRef.current = applyMouseInfluence(
        nodesRef.current,
        {
          x: mouse3DRef.current.x,
          y: mouse3DRef.current.y,
          z: mouse3DRef.current.z,
        },
        6,
        0.3
      );

      nodesRef.current.forEach(node => {
        const mesh = nodeMeshesRef.current.get(node.id);
        if (mesh) {
          mesh.position.set(node.position.x, node.position.y, node.position.z);
          mesh.rotation.x += 0.005;
          mesh.rotation.y += 0.005;
        }
      });

      edges.forEach(edge => {
        const line = edgeLinesRef.current.get(edge.id);
        const sourceNode = nodesRef.current.find(n => n.id === edge.source);
        const targetNode = nodesRef.current.find(n => n.id === edge.target);
        
        if (line && sourceNode && targetNode) {
          const positions = new Float32Array([
            sourceNode.position.x, sourceNode.position.y, sourceNode.position.z,
            targetNode.position.x, targetNode.position.y, targetNode.position.z,
          ]);
          line.geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        }
      });

      if (camera && renderer && scene) {
        raycasterRef.current.setFromCamera(mouseRef.current, camera);
        const meshes = Array.from(nodeMeshesRef.current.values());
        const intersects = raycasterRef.current.intersectObjects(meshes);

        if (intersects.length > 0) {
          const hoveredMesh = intersects[0].object as THREE.Mesh;
          const nodeId = hoveredMesh.userData.nodeId;
          setHoveredNodeId(nodeId);
        } else {
          setHoveredNodeId(null);
        }

        renderer.render(scene, camera);
      }
    };

    animate();

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      if (renderer && container) {
        container.removeChild(renderer.domElement);
      }
      renderer?.dispose();
    };
  }, [edges, initialNodes]);

  useEffect(() => {
    if (!hoveredNodeId) {
      nodeMeshesRef.current.forEach((mesh, nodeId) => {
        const node = nodesRef.current.find(n => n.id === nodeId);
        if (node) {
          const maxEdits = Math.max(...nodesRef.current.map(n => n.editCount));
          const color = getHeatMapColor(node.editCount, maxEdits);
          (mesh.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.3;
          (mesh.material as THREE.MeshStandardMaterial).color.set(new THREE.Color(color));
        }
      });

      edgeLinesRef.current.forEach(line => {
        (line.material as THREE.LineBasicMaterial).opacity = 0.6;
        (line.material as THREE.LineBasicMaterial).color.set(0x444444);
      });
      return;
    }

    const connectedIds = getConnectedNodeIds(hoveredNodeId, edges);

    nodeMeshesRef.current.forEach((mesh, nodeId) => {
      if (nodeId === hoveredNodeId || connectedIds.has(nodeId)) {
        (mesh.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.8;
        (mesh.material as THREE.MeshStandardMaterial).color.set(0xffffff);
      } else {
        const node = nodesRef.current.find(n => n.id === nodeId);
        if (node) {
          const maxEdits = Math.max(...nodesRef.current.map(n => n.editCount));
          const color = getHeatMapColor(node.editCount, maxEdits);
          (mesh.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.1;
          (mesh.material as THREE.MeshStandardMaterial).color.set(new THREE.Color(color));
        }
      }
    });

    edgeLinesRef.current.forEach((line, edgeId) => {
      const edge = edges.find(e => e.id === edgeId);
      if (edge && (edge.source === hoveredNodeId || edge.target === hoveredNodeId)) {
        (line.material as THREE.LineBasicMaterial).opacity = 1;
        (line.material as THREE.LineBasicMaterial).color.set(0x00ffff);
      } else {
        (line.material as THREE.LineBasicMaterial).opacity = 0.3;
        (line.material as THREE.LineBasicMaterial).color.set(0x444444);
      }
    });
  }, [hoveredNodeId, edges]);

  return (
    <div className="relative w-full h-full">
      <div ref={containerRef} className="w-full h-full" />
      {hoveredNodeId && (
        <div className="absolute top-4 left-4 bg-black/80 text-white px-4 py-2 rounded-lg backdrop-blur-sm">
          <p className="text-sm font-semibold">
            {nodesRef.current.find(n => n.id === hoveredNodeId)?.name}
          </p>
          <p className="text-xs text-gray-400">
            Edits: {nodesRef.current.find(n => n.id === hoveredNodeId)?.editCount}
          </p>
        </div>
      )}
    </div>
  );
}

