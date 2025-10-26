import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import type { Commit, EdgeData, InitializedNodeData, NodeData } from "./types";
import {
  applyForces,
  getConnectedNodeIds,
  getFileName,
  getHeatMapColor,
  initializeNodePositions,
} from "./utils";
import { Sidebar } from "./sidebar/Sidebar";
import useEscape from "../../hooks/useEscape";

interface Graph3DProps {
  nodes: NodeData[];
  edges: EdgeData[];
}

export default function Graph3D({ nodes: initialNodes, edges }: Graph3DProps) {
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const nodesRef = useRef<InitializedNodeData[]>(
    initializeNodePositions(initialNodes)
  );
  const nodeMeshesRef = useRef<Map<string, THREE.Mesh>>(new Map());
  const edgeLinesRef = useRef<Map<string, THREE.Line>>(new Map());
  const nodeLabelsRef = useRef<Map<string, THREE.Sprite>>(new Map());
  const raycasterRef = useRef<THREE.Raycaster>(new THREE.Raycaster());
  const mouseRef = useRef<THREE.Vector2>(new THREE.Vector2());
  const mouse3DRef = useRef<THREE.Vector3>(new THREE.Vector3());
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [showXZPlane, setShowXZPlane] = useState<boolean>(true);
  const [showXYPlane, setShowXYPlane] = useState<boolean>(true);
  const [showYZPlane, setShowYZPlane] = useState<boolean>(true);
  const [showGridControls, setShowGridControls] = useState<boolean>(false);
  const [is2DMode, setIs2DMode] = useState<boolean>(false);
  // selected node will have a loading state when clicked to fetch from API
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedNodeIdLoading, setSelectedNodeIdLoading] =
    useState<boolean>(false);
  const [commitData, setCommitData] = useState<Commit[]>([]);
  const xzPlaneRef = useRef<THREE.Object3D | null>(null);
  const xyPlaneRef = useRef<THREE.Object3D | null>(null);
  const yzPlaneRef = useRef<THREE.Object3D | null>(null);
  const nodeTargetPositionsRef = useRef<Map<string, { x: number; y: number; z: number }>>(new Map());
  const axisLinesRef = useRef<THREE.Line[]>([]);
  const originalPositionsRef = useRef<Map<string, { x: number; y: number; z: number }>>(new Map());
  const cameraOriginalPosRef = useRef<{ position: THREE.Vector3; target: THREE.Vector3 } | null>(null);
  const isAnimatingRef = useRef<boolean>(false);

  useEscape(() => {
    setSelectedNodeId(null);
  }, true);

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const nodeMeshes = nodeMeshesRef.current;
    const edgeLines = edgeLinesRef.current;
    const nodeLabels = nodeLabelsRef.current;

    const scene = new THREE.Scene();
    scene.background = null;
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(
      75,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );
    camera.position.set(0, 10, 25);
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

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 15;
    controls.maxDistance = 40;
    controls.enablePan = true;
    controls.target.set(0, 0, 0);
    controls.enableZoom = true;
    controls.autoRotate = false;
    controlsRef.current = controls;

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

    const gridSize = 40;
    const gridDivisions = 20;

    const gridHelperXZ = new THREE.GridHelper(
      gridSize,
      gridDivisions,
      0x444444,
      0x222222
    );
    gridHelperXZ.position.y = 0;
    scene.add(gridHelperXZ);
    xzPlaneRef.current = gridHelperXZ;

    const gridHelperXY = new THREE.GridHelper(
      gridSize,
      gridDivisions,
      0x444444,
      0x222222
    );
    gridHelperXY.rotation.x = Math.PI / 2;
    gridHelperXY.position.z = 0;
    scene.add(gridHelperXY);
    xyPlaneRef.current = gridHelperXY;

    const gridHelperYZ = new THREE.GridHelper(
      gridSize,
      gridDivisions,
      0x444444,
      0x222222
    );
    gridHelperYZ.rotation.z = Math.PI / 2;
    gridHelperYZ.position.x = 0;
    scene.add(gridHelperYZ);
    yzPlaneRef.current = gridHelperYZ;

    const createTextSprite = (text: string) => {
      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d");
      if (!context) return null;

      canvas.width = 512;
      canvas.height = 128;

      context.fillStyle = "rgba(0, 0, 0, 0.7)";
      context.fillRect(0, 0, canvas.width, canvas.height);

      context.font = "bold 48px Arial";
      context.fillStyle = "white";
      context.textAlign = "center";
      context.textBaseline = "middle";
      context.fillText(text, canvas.width / 2, canvas.height / 2);

      const texture = new THREE.CanvasTexture(canvas);
      const spriteMaterial = new THREE.SpriteMaterial({
        map: texture,
        transparent: true,
        depthTest: false,
        depthWrite: false,
      });
      const sprite = new THREE.Sprite(spriteMaterial);
      sprite.scale.set(4, 1, 1);

      return sprite;
    };

    const maxEdits = Math.max(...nodesRef.current.map((n) => n.editCount));

    console.log("=== Node fileLength values ===");
    nodesRef.current.forEach((node) => {
      console.log(`${node.name}: ${node.lengthOfFile} lines`);
    });

    nodesRef.current.forEach((node) => {
      const geometry = new THREE.SphereGeometry(1, 64, 64);
      const color = getHeatMapColor(node.editCount, maxEdits);
      const baseColor = new THREE.Color(color);
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

      const darkerColor = baseColor.clone().multiplyScalar(0.6);
      const lighterColor = baseColor
        .clone()
        .lerp(new THREE.Color(0xffffff), 0.3);

      const material = new THREE.ShaderMaterial({
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

      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(node.position.x, node.position.y, node.position.z);
      mesh.userData = { nodeId: node.id, baseColor: color };
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      scene.add(mesh);
      nodeMeshes.set(node.id, mesh);

      const label = createTextSprite(node.name);
      if (label) {
        label.position.set(
          node.position.x,
          node.position.y + 1.5,
          node.position.z
        );
        scene.add(label);
        nodeLabels.set(node.id, label);
      }
    });

    edges.forEach((edge) => {
      const sourceNode = nodesRef.current.find((n) => n.id === edge.source);
      const targetNode = nodesRef.current.find((n) => n.id === edge.target);

      if (sourceNode && targetNode) {
        const points = [
          new THREE.Vector3(
            sourceNode.position.x,
            sourceNode.position.y,
            sourceNode.position.z
          ),
          new THREE.Vector3(
            targetNode.position.x,
            targetNode.position.y,
            targetNode.position.z
          ),
        ];
        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        const material = new THREE.LineBasicMaterial({
          color: 0xffffff,
          opacity: 1,
          transparent: false,
        });
        const line = new THREE.Line(geometry, material);
        scene.add(line);
        edgeLines.set(edge.id, line);
      }
    });

    const handleMouseMove = (event: MouseEvent) => {
      if (!container || !camera) return;
      const rect = container.getBoundingClientRect();
      mouseRef.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouseRef.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      const vector = new THREE.Vector3(
        mouseRef.current.x,
        mouseRef.current.y,
        0.5
      );
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

    const handleClick = async (event: MouseEvent) => {
      if (!container || !camera) return;
      const rect = container.getBoundingClientRect();
      const mouseX = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      const mouseY = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycasterRef.current.setFromCamera(
        new THREE.Vector2(mouseX, mouseY),
        camera
      );
      const meshes = Array.from(nodeMeshesRef.current.values());
      const intersects = raycasterRef.current.intersectObjects(meshes);

      if (intersects.length > 0) {
        const clickedMesh = intersects[0].object as THREE.Mesh;
        const nodeId = clickedMesh.userData.nodeId;
        
        // Find the clicked node's position
        const clickedNode = nodesRef.current.find(n => n.id === nodeId);
        if (clickedNode && controlsRef.current && cameraRef.current) {
          // Save current camera position before animating
          if (!cameraOriginalPosRef.current) {
            cameraOriginalPosRef.current = {
              position: cameraRef.current.position.clone(),
              target: controlsRef.current.target.clone()
            };
          }
          
          // Calculate target camera position (offset from node)
          const offset = 8;
          const targetCamPos = new THREE.Vector3(
            clickedNode.position.x,
            clickedNode.position.y + 2,
            clickedNode.position.z + offset
          );
          const targetLookAt = new THREE.Vector3(
            clickedNode.position.x,
            clickedNode.position.y,
            clickedNode.position.z
          );
          
          // Smoothly animate camera to node, then stop after 1 second to allow free movement
          isAnimatingRef.current = true;
          const animationStartTime = Date.now();
          const animationDuration = 1000;
          
          const animateCamera = () => {
            if (!cameraRef.current || !controlsRef.current || !isAnimatingRef.current) return;
            
            const elapsed = Date.now() - animationStartTime;
            
            if (elapsed >= animationDuration) {
              // Animation time is up - stop and allow free movement
              isAnimatingRef.current = false;
              return;
            }
            
            const easing = 0.08;
            
            // Animate camera position
            const dx = targetCamPos.x - cameraRef.current.position.x;
            const dy = targetCamPos.y - cameraRef.current.position.y;
            const dz = targetCamPos.z - cameraRef.current.position.z;
            
            const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
            
            if (distance > 0.01) {
              cameraRef.current.position.x += dx * easing;
              cameraRef.current.position.y += dy * easing;
              cameraRef.current.position.z += dz * easing;
            } else {
              // Reached target early - stop animation
              cameraRef.current.position.set(targetCamPos.x, targetCamPos.y, targetCamPos.z);
              isAnimatingRef.current = false;
              return;
            }
            
            // Animate camera target
            const targetDx = targetLookAt.x - controlsRef.current.target.x;
            const targetDy = targetLookAt.y - controlsRef.current.target.y;
            const targetDz = targetLookAt.z - controlsRef.current.target.z;
            
            controlsRef.current.target.x += targetDx * easing;
            controlsRef.current.target.y += targetDy * easing;
            controlsRef.current.target.z += targetDz * easing;
            
            controlsRef.current.update();
            
            if (isAnimatingRef.current && distance > 0.01) {
              requestAnimationFrame(animateCamera);
            }
          };
          
          requestAnimationFrame(animateCamera);
        }
        
        setSelectedNodeId(nodeId);
        setSelectedNodeIdLoading(true);

        const fileName = getFileName(nodeId, initialNodes);

        const response = await fetch(
          // change eventually to the actual filename
          `http://localhost:8000/api/github/?path=${fileName}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        const data = await response.json();

        setSelectedNodeIdLoading(false);
        setCommitData(data.response);
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("resize", handleResize);
    window.addEventListener("click", handleClick);

    let lastTime = Date.now();
    const animate = () => {
      requestAnimationFrame(animate);

      const currentTime = Date.now();
      const deltaTime = Math.min((currentTime - lastTime) / 1000, 0.1);
      lastTime = currentTime;
      
      controls.update();

      if (!is2DMode) {
        nodesRef.current = applyForces(nodesRef.current, edges, deltaTime);
      } else {
        // Animate nodes smoothly to their 2D positions with slower, more visible animation
        nodesRef.current.forEach((node) => {
          const targetPos = nodeTargetPositionsRef.current.get(node.id);
          if (targetPos) {
            const easing = 0.025; // Much slower for very visible travel
            
            const dx = targetPos.x - node.position.x;
            const dy = targetPos.y - node.position.y;
            const dz = targetPos.z - node.position.z;
            
            const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
            
            if (distance > 0.01) {
              node.position.x += dx * easing;
              node.position.y += dy * easing;
              node.position.z += dz * easing;
            } else {
              node.position.x = targetPos.x;
              node.position.y = targetPos.y;
              node.position.z = targetPos.z;
            }
          }
        });
      }

      nodesRef.current.forEach((node) => {
        const mesh = nodeMeshesRef.current.get(node.id);
        if (mesh) {
          const dx = node.position.x - mouse3DRef.current.x;
          const dy = node.position.y - mouse3DRef.current.y;
          const dz = node.position.z - mouse3DRef.current.z;
          const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);

          const influenceRadius = 8;
          const influenceStrength = 1.2;

          let visualX = node.position.x;
          let visualY = node.position.y;
          let visualZ = node.position.z;

          if (!is2DMode && distance < influenceRadius && distance > 0.1) {
            const influence =
              (1 - distance / influenceRadius) * influenceStrength;
            const offsetX = (dx / distance) * influence;
            const offsetY = (dy / distance) * influence;
            const offsetZ = (dz / distance) * influence;

            visualX += offsetX;
            visualY += offsetY;
            visualZ += offsetZ;
          }

          mesh.position.set(visualX, visualY, visualZ);
          mesh.rotation.x += 0.005;
          mesh.rotation.y += 0.005;

          const label = nodeLabelsRef.current.get(node.id);
          if (label) {
            label.position.set(visualX, visualY + 1.5, visualZ);
          }
        }
      });

      edges.forEach((edge) => {
        const line = edgeLinesRef.current.get(edge.id);
        const sourceNode = nodesRef.current.find((n) => n.id === edge.source);
        const targetNode = nodesRef.current.find((n) => n.id === edge.target);

        if (line && sourceNode && targetNode) {
          const calculateVisualPosition = (node: InitializedNodeData) => {
            const dx = node.position.x - mouse3DRef.current.x;
            const dy = node.position.y - mouse3DRef.current.y;
            const dz = node.position.z - mouse3DRef.current.z;
            const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);

            const influenceRadius = 8;
            const influenceStrength = 1.2;

            let x = node.position.x;
            let y = node.position.y;
            let z = node.position.z;

            if (distance < influenceRadius && distance > 0.1) {
              const influence =
                (1 - distance / influenceRadius) * influenceStrength;
              x += (dx / distance) * influence;
              y += (dy / distance) * influence;
              z += (dz / distance) * influence;
            }

            return { x, y, z };
          };

          const sourcePos = calculateVisualPosition(sourceNode);
          const targetPos = calculateVisualPosition(targetNode);

          const positions = new Float32Array([
            sourcePos.x,
            sourcePos.y,
            sourcePos.z,
            targetPos.x,
            targetPos.y,
            targetPos.z,
          ]);
          line.geometry.setAttribute(
            "position",
            new THREE.BufferAttribute(positions, 3)
          );
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
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("click", handleClick);

      nodeMeshes.forEach((mesh) => {
        scene.remove(mesh);
      });
      nodeMeshes.clear();

      edgeLines.forEach((line) => {
        scene.remove(line);
      });
      edgeLines.clear();

      nodeLabels.forEach((label) => {
        scene.remove(label);
        label.material.map?.dispose();
        label.material.dispose();
      });
      nodeLabels.clear();

      if (renderer && container) {
        container.removeChild(renderer.domElement);
      }
      renderer?.dispose();
      controls?.dispose();
    };
  }, [edges, initialNodes, is2DMode]);

  useEffect(() => {
    if (xzPlaneRef.current) {
      xzPlaneRef.current.visible = showXZPlane;
    }
  }, [showXZPlane]);

  useEffect(() => {
    if (xyPlaneRef.current) {
      xyPlaneRef.current.visible = showXYPlane;
    }
  }, [showXYPlane]);

  useEffect(() => {
    if (yzPlaneRef.current) {
      yzPlaneRef.current.visible = showYZPlane;
    }
  }, [showYZPlane]);

  useEffect(() => {
    if (is2DMode && sceneRef.current) {
      // Save original positions before transforming
      nodesRef.current.forEach(node => {
        originalPositionsRef.current.set(node.id, { ...node.position });
      });
      
      // Sort by file length (least to greatest)
      const sortedNodes = [...nodesRef.current].sort((a, b) => a.lengthOfFile - b.lengthOfFile);
      
      const maxLength = Math.max(...sortedNodes.map(n => n.lengthOfFile));
      const minLength = Math.min(...sortedNodes.map(n => n.lengthOfFile));
      const lengthRange = maxLength - minLength || 1;
      
      const xSpacing = 3;
      const maxX = (sortedNodes.length - 1) * xSpacing / 2;
      const minX = -maxX;
      const maxY = 10;
      const minY = 0;
      
      sortedNodes.forEach((node, index) => {
        const normalizedLength = (node.lengthOfFile - minLength) / lengthRange;
        
        const targetX = (index - sortedNodes.length / 2) * xSpacing;
        const targetY = normalizedLength * 10;
        const targetZ = 0;
        
        // Save original position if not already saved
        if (!originalPositionsRef.current.has(node.id)) {
          originalPositionsRef.current.set(node.id, { ...node.position });
        }
        
        nodeTargetPositionsRef.current.set(node.id, { x: targetX, y: targetY, z: targetZ });
      });
      
      setShowXYPlane(false);
      setShowXZPlane(false);
      setShowYZPlane(false);
      
      // Hide edges in 2D mode
      edgeLinesRef.current.forEach((line) => {
        line.visible = false;
      });
      
      // Clear existing axis lines and labels
      axisLinesRef.current.forEach(obj => {
        sceneRef.current?.remove(obj);
        if (obj instanceof THREE.Line) {
          obj.geometry.dispose();
          (obj.material as THREE.LineBasicMaterial).dispose();
        }
      });
      axisLinesRef.current = [];
      
      // Create axis lines and grid
      const axisMaterial = new THREE.LineBasicMaterial({ color: 0x00ff00 });
      const gridMaterial = new THREE.LineBasicMaterial({ color: 0x333333, transparent: true, opacity: 0.3 });
      
      // Create grid lines
      for (let i = 0; i <= sortedNodes.length; i++) {
        const x = minX - 2 + (i * xSpacing);
        const gridGeometry = new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(x, minY - 1, 0),
          new THREE.Vector3(x, maxY + 1, 0)
        ]);
        const gridLine = new THREE.Line(gridGeometry, gridMaterial);
        sceneRef.current.add(gridLine);
        axisLinesRef.current.push(gridLine);
      }
      
      for (let i = 0; i <= 10; i++) {
        const y = i;
        const gridGeometry = new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(minX - 2, y, 0),
          new THREE.Vector3(maxX + 2, y, 0)
        ]);
        const gridLine = new THREE.Line(gridGeometry, gridMaterial);
        sceneRef.current.add(gridLine);
        axisLinesRef.current.push(gridLine);
      }
      
      // X-axis (horizontal)
      const xAxisGeometry = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(minX - 2, minY - 1, 0),
        new THREE.Vector3(maxX + 2, minY - 1, 0)
      ]);
      const xAxisLine = new THREE.Line(xAxisGeometry, axisMaterial);
      sceneRef.current.add(xAxisLine);
      axisLinesRef.current.push(xAxisLine);
      
      // Y-axis (vertical)
      const yAxisGeometry = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(minX - 2, minY - 1, 0),
        new THREE.Vector3(minX - 2, maxY + 1, 0)
      ]);
      const yAxisLine = new THREE.Line(yAxisGeometry, axisMaterial);
      sceneRef.current.add(yAxisLine);
      axisLinesRef.current.push(yAxisLine);
      
      // Add axis labels using sprites (3D and bigger)
      const createTextSprite = (text: string) => {
        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");
        if (!context) return null;

        canvas.width = 512;
        canvas.height = 128;

        context.fillStyle = "rgba(0, 0, 0, 0.7)";
        context.fillRect(0, 0, canvas.width, canvas.height);
        
        context.fillStyle = "white";
        context.font = "bold 48px Arial";
        context.textAlign = "center";
        context.textBaseline = "middle";
        context.fillText(text, canvas.width / 2, canvas.height / 2);

        const texture = new THREE.CanvasTexture(canvas);
        const spriteMaterial = new THREE.SpriteMaterial({
          map: texture,
          transparent: true,
        });
        const sprite = new THREE.Sprite(spriteMaterial);
        sprite.scale.set(4, 1, 1);
        return sprite;
      };
      
      // X-axis label
      const xLabel = createTextSprite("File Name");
      if (xLabel) {
        xLabel.position.set((minX + maxX) / 2, minY - 2.5, 0);
        sceneRef.current.add(xLabel);
        axisLinesRef.current.push(xLabel as unknown as THREE.Line);
      }
      
      // Y-axis label
      const yLabel = createTextSprite("File Length");
      if (yLabel) {
        yLabel.position.set(minX - 4, (minY + maxY) / 2, 0);
        yLabel.rotation.z = Math.PI / 2;
        sceneRef.current.add(yLabel);
        axisLinesRef.current.push(yLabel as unknown as THREE.Line);
      }
      
      if (controlsRef.current && cameraRef.current) {
        const centerX = 0;
        const centerY = maxY / 2;
        const cameraOffsetX = 0;
        
        // Smoothly animate camera to 2D view position
        const targetPos = new THREE.Vector3(centerX + cameraOffsetX, centerY, 20);
        const targetLookAt = new THREE.Vector3(centerX + cameraOffsetX, centerY, 0);
        
        // Use one-time animation to 2D view position
        isAnimatingRef.current = true;
        const animateCamera = () => {
          if (!cameraRef.current || !controlsRef.current || !isAnimatingRef.current) return;
          
          const easing = 0.03; // Smooth but visible transition
          
          // Animate camera position from wherever it currently is
          const dx = targetPos.x - cameraRef.current.position.x;
          const dy = targetPos.y - cameraRef.current.position.y;
          const dz = targetPos.z - cameraRef.current.position.z;
          
          const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
          
          if (distance > 0.01) {
            cameraRef.current.position.x += dx * easing;
            cameraRef.current.position.y += dy * easing;
            cameraRef.current.position.z += dz * easing;
          } else {
            cameraRef.current.position.set(targetPos.x, targetPos.y, targetPos.z);
            isAnimatingRef.current = false;
            return;
          }
          
          // Animate camera target
          const targetDx = targetLookAt.x - controlsRef.current.target.x;
          const targetDy = targetLookAt.y - controlsRef.current.target.y;
          const targetDz = targetLookAt.z - controlsRef.current.target.z;
          
          controlsRef.current.target.x += targetDx * easing;
          controlsRef.current.target.y += targetDy * easing;
          controlsRef.current.target.z += targetDz * easing;
          
          controlsRef.current.update();
          
          if (isAnimatingRef.current && distance > 0.01) {
            requestAnimationFrame(animateCamera);
          }
        };
        
        requestAnimationFrame(animateCamera);
        
        console.log(`Camera animating to: (${targetPos.x.toFixed(2)}, ${targetPos.y.toFixed(2)}, ${targetPos.z.toFixed(2)})`);
      }
    } else {
      // Don't animate camera - let user move freely
      // Just restore original node positions
      // Restore original positions
      nodesRef.current.forEach(node => {
        const originalPos = originalPositionsRef.current.get(node.id);
        if (originalPos) {
          node.position.x = originalPos.x;
          node.position.y = originalPos.y;
          node.position.z = originalPos.z;
        }
      });
      
      // Show edges again
      edgeLinesRef.current.forEach((line) => {
        line.visible = true;
      });
      
      // Clean up axis lines
      if (sceneRef.current) {
        axisLinesRef.current.forEach(obj => {
          sceneRef.current?.remove(obj);
          if (obj instanceof THREE.Line) {
            obj.geometry.dispose();
            (obj.material as THREE.LineBasicMaterial).dispose();
          }
        });
        axisLinesRef.current = [];
      }
      
      nodeTargetPositionsRef.current.clear();
      setShowXYPlane(true);
      setShowXZPlane(true);
      setShowYZPlane(true);
    }
  }, [is2DMode, initialNodes]);

  // Handle camera return when node is deselected
  useEffect(() => {
    if (!selectedNodeId && controlsRef.current && cameraRef.current) {
      // Always ensure animation is stopped when no node is selected
      isAnimatingRef.current = false;
      
      if (cameraOriginalPosRef.current) {
        const originalPos = cameraOriginalPosRef.current;
        
        // Smoothly animate camera back to original position
        isAnimatingRef.current = true;
        const animateCamera = () => {
          if (!cameraRef.current || !controlsRef.current || !isAnimatingRef.current) return;
          
          const easing = 0.08;
          
          // Animate camera position back
          const dx = originalPos.position.x - cameraRef.current.position.x;
          const dy = originalPos.position.y - cameraRef.current.position.y;
          const dz = originalPos.position.z - cameraRef.current.position.z;
          
          const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
          
          if (distance > 0.01) {
            cameraRef.current.position.x += dx * easing;
            cameraRef.current.position.y += dy * easing;
            cameraRef.current.position.z += dz * easing;
          } else {
            // Animation complete - stop and clear
            cameraRef.current.position.set(originalPos.position.x, originalPos.position.y, originalPos.position.z);
            controlsRef.current.target.set(originalPos.target.x, originalPos.target.y, originalPos.target.z);
            isAnimatingRef.current = false;
            cameraOriginalPosRef.current = null;
            return;
          }
          
          // Animate camera target back
          const targetDx = originalPos.target.x - controlsRef.current.target.x;
          const targetDy = originalPos.target.y - controlsRef.current.target.y;
          const targetDz = originalPos.target.z - controlsRef.current.target.z;
          
          controlsRef.current.target.x += targetDx * easing;
          controlsRef.current.target.y += targetDy * easing;
          controlsRef.current.target.z += targetDz * easing;
          
          controlsRef.current.update();
          
          if (isAnimatingRef.current && distance > 0.01) {
            requestAnimationFrame(animateCamera);
          }
        };
        
        requestAnimationFrame(animateCamera);
      }
    }
  }, [selectedNodeId]);

  useEffect(() => {
    if (!hoveredNodeId) {
      nodeMeshesRef.current.forEach((mesh, nodeId) => {
        const node = nodesRef.current.find((n) => n.id === nodeId);
        if (node && mesh.material instanceof THREE.ShaderMaterial) {
          const maxEdits = Math.max(
            ...nodesRef.current.map((n) => n.editCount)
          );
          const color = getHeatMapColor(node.editCount, maxEdits);
          const baseColor = new THREE.Color(color);
          const darkerColor = baseColor.clone().multiplyScalar(0.6);
          const lighterColor = baseColor
            .clone()
            .lerp(new THREE.Color(0xffffff), 0.3);

          mesh.material.uniforms.color1.value = darkerColor;
          mesh.material.uniforms.color2.value = baseColor;
          mesh.material.uniforms.color3.value = lighterColor;
        }
      });

      edgeLinesRef.current.forEach((line) => {
        (line.material as THREE.LineBasicMaterial).opacity = 1;
        (line.material as THREE.LineBasicMaterial).color.set(0xffffff);
      });
      return;
    }

    const connectedIds = getConnectedNodeIds(hoveredNodeId, edges);

    nodeMeshesRef.current.forEach((mesh, nodeId) => {
      if (mesh.material instanceof THREE.ShaderMaterial) {
        if (nodeId === hoveredNodeId || connectedIds.has(nodeId)) {
          const highlightColor = new THREE.Color(0xffffff);
          mesh.material.uniforms.color1.value = highlightColor
            .clone()
            .multiplyScalar(0.7);
          mesh.material.uniforms.color2.value = highlightColor;
          mesh.material.uniforms.color3.value = highlightColor
            .clone()
            .multiplyScalar(1.2);
        } else {
          const node = nodesRef.current.find((n) => n.id === nodeId);
          if (node) {
            const maxEdits = Math.max(
              ...nodesRef.current.map((n) => n.editCount)
            );
            const color = getHeatMapColor(node.editCount, maxEdits);
            const baseColor = new THREE.Color(color);
            const dimmedColor = baseColor.clone().multiplyScalar(0.3);

            mesh.material.uniforms.color1.value = dimmedColor;
            mesh.material.uniforms.color2.value = dimmedColor
              .clone()
              .multiplyScalar(1.2);
            mesh.material.uniforms.color3.value = dimmedColor
              .clone()
              .multiplyScalar(1.4);
          }
        }
      }
    });

    edgeLinesRef.current.forEach((line, edgeId) => {
      const edge = edges.find((e) => e.id === edgeId);
      if (
        edge &&
        (edge.source === hoveredNodeId || edge.target === hoveredNodeId)
      ) {
        (line.material as THREE.LineBasicMaterial).opacity = 1;
        (line.material as THREE.LineBasicMaterial).color.set(0x00ffff);
      } else {
        (line.material as THREE.LineBasicMaterial).opacity = 0.3;
        (line.material as THREE.LineBasicMaterial).color.set(0x444444);
      }
    });
  }, [hoveredNodeId, edges]);

  const maxEdits = Math.max(...initialNodes.map((n) => n.editCount));
  const minEdits = Math.min(...initialNodes.map((n) => n.editCount));

  return (
    <div className="relative w-full h-full">
      <div ref={containerRef} className="w-full h-full" />

      {hoveredNodeId && (
        <div className="absolute top-4 left-31   bg-black/80 text-white px-4 py-2 rounded-lg backdrop-blur-sm">
          <p className="text-sm font-semibold">
            {nodesRef.current.find((n) => n.id === hoveredNodeId)?.name}
          </p>
          <p className="text-xs text-gray-400">
            Edits:{" "}
            {nodesRef.current.find((n) => n.id === hoveredNodeId)?.editCount}
          </p>
        </div>
      )}

      <div className="absolute bottom-6 left-6 bg-black/80 backdrop-blur-sm rounded-lg p-3">
        <button
          onClick={() => setShowGridControls(!showGridControls)}
          className="text-white text-sm font-medium hover:text-gray-300 transition-colors flex items-center gap-2"
        >
          <span>Grid Planes (View Controls)</span>
          <svg
            className={`w-4 h-4 transition-transform ${
              showGridControls ? "rotate-180" : ""
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>

        <div className="flex items-center justify-between text-sm mt-3 pt-3 border-t border-gray-700">
          <span className="text-gray-300">2D View</span>
          <button
            onClick={() => setIs2DMode(!is2DMode)}
            className={`w-11 h-6 rounded-full relative ${
              is2DMode ? "bg-blue-600" : "bg-gray-600"
            }`}
          >
            <motion.div
              className="absolute top-px left-0.5 w-5 h-5 rounded-full bg-white shadow-md"
              animate={{
                x: is2DMode ? 21 : -3,
              }}
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
            />
          </button>
        </div>

        <AnimatePresence>
          {showGridControls && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="mt-3 space-y-2 border-t  pt-3 overflow-hidden"
            >
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-300">XZ Plane</span>
                <button
                  onClick={() => setShowXZPlane(!showXZPlane)}
                  className={`w-11 h-6 rounded-full relative  ${
                    showXZPlane ? "bg-green-600!" : "bg-red-600!"
                  }`}
                >
                  <motion.div
                    className="absolute top-px left-0.5 w-5 h-5 rounded-full bg-white shadow-md"
                    animate={{
                      x: showXZPlane ? 21 : -3,
                    }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-300">XY Plane</span>
                <button
                  onClick={() => setShowXYPlane(!showXYPlane)}
                  className={`w-11 h-6 rounded-full relative ${
                    showXYPlane ? "bg-green-600!" : "bg-red-600!"
                  }`}
                >
                  <motion.div
                    className="absolute top-px left-0.5 w-5 h-5 rounded-full bg-white shadow-md"
                    animate={{
                      x: showXYPlane ? 21 : -3,
                    }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-300">YZ Plane</span>
                <button
                  onClick={() => setShowYZPlane(!showYZPlane)}
                  className={`w-11 h-6 rounded-full relative ${
                    showYZPlane ? "bg-green-600!" : "bg-red-600!"
                  }`}
                >
                  <motion.div
                    className="absolute top-px left-0.5 w-5 h-5 rounded-full bg-white shadow-md"
                    animate={{
                      x: showYZPlane ? 21 : -3,
                    }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="absolute top-6 left-6 flex flex-col gap-3">
        <button
          onClick={() => navigate("/")}
          className="w-14 h-7 flex items-center justify-center rounded-full bg-black/60 hover:bg-black/80 transition-all duration-200 group"
          aria-label="Back to landing page"
        >
          <svg
            className="w-3.5 h-3.5 text-gray-400 group-hover:text-white transition-colors"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
        </button>

        <div className="bg-black/80 backdrop-blur-sm rounded-lg p-4 min-w-[200px]">
          <h3 className="text-white text-sm font-semibold mb-3">
            Edit Activity
          </h3>

          <div className="relative h-6 rounded-full overflow-hidden mb-2">
            <div
              className="absolute inset-0"
              style={{
                background: `linear-gradient(to right, 
                  ${getHeatMapColor(minEdits, maxEdits)}, 
                  ${getHeatMapColor(Math.floor(maxEdits * 0.33), maxEdits)}, 
                  ${getHeatMapColor(Math.floor(maxEdits * 0.66), maxEdits)}, 
                  ${getHeatMapColor(maxEdits, maxEdits)})`,
              }}
            />
          </div>

          <div className="flex justify-between text-xs text-gray-300">
            <span>{minEdits} edits</span>
            <span>{maxEdits} edits</span>
          </div>

          <div className="mt-3 pt-3 border-t border-gray-700">
            <div className="flex items-center justify-between text-xs text-gray-400">
              <span>Total Files:</span>
              <span className="text-white font-semibold">
                {initialNodes.length}
              </span>
            </div>
          </div>
        </div>
      </div>

      {selectedNodeId && (
        <Sidebar
          setSelectedNodeId={setSelectedNodeId}
          selectedNodeId={selectedNodeId}
          nodesRef={nodesRef}
          loading={selectedNodeIdLoading}
          commits={commitData}
        />
      )}
    </div>
  );
}
