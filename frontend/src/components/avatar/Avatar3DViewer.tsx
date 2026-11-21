"use client";

import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { AlertTriangle, Loader2, RotateCcw, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export interface Avatar3DViewerProps {
  avatarId: string;
  garmentUrl?: string | null;
  className?: string;
  fallbackContent?: React.ReactNode;
  onError?: (error: Error) => void;
}

export function Avatar3DViewer({
  avatarId,
  garmentUrl,
  className,
  fallbackContent,
  onError,
}: Avatar3DViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [pose, setPose] = useState<"apose" | "tpose">("apose");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // References to mutable Three.js objects
  const sceneRef = useRef<THREE.Scene | null>(null);
  const currentModelRef = useRef<THREE.Group | null>(null);
  const currentGarmentRef = useRef<THREE.Group | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);

  // Initialize Three.js scene once
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    let animId: number;

    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    renderer.shadowMap.enabled = true;

    const width = container.clientWidth || 300;
    const height = container.clientHeight || 400;
    renderer.setSize(width, height);

    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(38, width / height, 0.05, 50);
    camera.position.set(0, 1.15, 2.75);
    cameraRef.current = camera;

    const controls = new OrbitControls(camera, canvas);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.target.set(0, 0.9, 0);
    controls.minDistance = 0.6;
    controls.maxDistance = 5.0;
    controlsRef.current = controls;

    // Lighting
    scene.add(new THREE.HemisphereLight(0xeef4ff, 0x222836, 1.1));

    const keyLight = new THREE.DirectionalLight(0xffffff, 1.6);
    keyLight.position.set(2.2, 3.8, 2.6);
    keyLight.castShadow = true;
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0xbfd6ff, 0.65);
    fillLight.position.set(-2.5, 2.0, 1.5);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0x88b4ff, 0.85);
    rimLight.position.set(0, 2.5, -3.0);
    scene.add(rimLight);

    // Floor grid
    const grid = new THREE.GridHelper(3.0, 30, 0x8b5cf6, 0xddd6fe);
    (grid.material as THREE.Material).transparent = true;
    (grid.material as THREE.Material).opacity = 0.45;
    scene.add(grid);

    // Render loop
    function animate() {
      animId = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    }
    animate();

    // Resize observer
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width: w, height: h } = entry.contentRect;
        if (w > 0 && h > 0) {
          camera.aspect = w / h;
          camera.updateProjectionMatrix();
          renderer.setSize(w, h);
        }
      }
    });
    resizeObserver.observe(container);

    return () => {
      cancelAnimationFrame(animId);
      resizeObserver.disconnect();
      controls.dispose();
      renderer.dispose();
      sceneRef.current = null;
      currentModelRef.current = null;
      controlsRef.current = null;
      cameraRef.current = null;
    };
  }, []);

  // Load avatar model when avatarId or pose changes
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene || !avatarId) return;

    let isMounted = true;
    setIsLoading(true);
    setLoadError(null);

    const filename = pose === "tpose" ? "tpose.glb" : "apose.glb";
    const assetUrl = `/api/avatar/assets/${encodeURIComponent(
      avatarId
    )}/${filename}`;

    const loader = new GLTFLoader();
    loader.load(
      assetUrl,
      (gltf) => {
        if (!isMounted) return;

        // Remove previous model
        if (currentModelRef.current) {
          scene.remove(currentModelRef.current);
          currentModelRef.current = null;
        }

        const model = gltf.scene;
        model.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            const mesh = child as THREE.Mesh;
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            if (mesh.material) {
              const mat = mesh.material as THREE.MeshStandardMaterial;
              mat.roughness = 0.6;
              mat.metalness = 0.1;
            }
          }
        });

        // Center model
        const box = new THREE.Box3().setFromObject(model);
        const center = new THREE.Vector3();
        box.getCenter(center);
        model.position.x = -center.x;
        model.position.z = -center.z;
        model.position.y = -box.min.y;

        scene.add(model);
        currentModelRef.current = model;
        setIsLoading(false);
      },
      undefined,
      (err) => {
        if (!isMounted) return;
        const msg = err instanceof Error ? err.message : "Failed to load 3D asset";
        setLoadError(msg);
        setIsLoading(false);
        if (onError && err instanceof Error) {
          onError(err);
        }
      }
    );

    return () => {
      isMounted = false;
    };
  }, [avatarId, pose, onError]);

  // Load garment model when garmentUrl changes
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    let isMounted = true;

    // Remove previous garment
    if (currentGarmentRef.current) {
      scene.remove(currentGarmentRef.current);
      // Dispose geometries and materials
      currentGarmentRef.current.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          const mesh = child as THREE.Mesh;
          if (mesh.geometry) mesh.geometry.dispose();
          if (mesh.material) {
            if (Array.isArray(mesh.material)) {
              mesh.material.forEach((m) => m.dispose());
            } else {
              mesh.material.dispose();
            }
          }
        }
      });
      currentGarmentRef.current = null;
    }

    if (!garmentUrl) return;

    const loader = new GLTFLoader();
    loader.load(
      garmentUrl,
      (gltf) => {
        if (!isMounted) return;

        const garment = gltf.scene;
        garment.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            const mesh = child as THREE.Mesh;
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            // Use double-sided material for garment
            if (mesh.material) {
              if (Array.isArray(mesh.material)) {
                mesh.material.forEach((mat) => {
                  if (mat instanceof THREE.MeshStandardMaterial) {
                    mat.side = THREE.DoubleSide;
                    mat.roughness = 0.5;
                    mat.metalness = 0.1;
                  }
                });
              } else if (mesh.material instanceof THREE.MeshStandardMaterial) {
                mesh.material.side = THREE.DoubleSide;
                mesh.material.roughness = 0.5;
                mesh.material.metalness = 0.1;
              }
            }
          }
        });

        // Garment uses same coordinate frame as avatar (no extra transform unless visibly misaligned)
        scene.add(garment);
        currentGarmentRef.current = garment;
      },
      undefined,
      (err) => {
        if (!isMounted) return;
        console.warn("Failed to load garment:", err);
        // Don't set loadError for garment - it's optional
      }
    );

    return () => {
      isMounted = false;
    };
  }, [garmentUrl]);

  function handleResetCamera() {
    if (!cameraRef.current || !controlsRef.current) return;
    cameraRef.current.position.set(0, 1.15, 2.75);
    controlsRef.current.target.set(0, 0.9, 0);
    controlsRef.current.update();
  }

  // If asset failed to load, display honest fallback
  if (loadError && fallbackContent) {
    return (
      <div className={cn("flex flex-col gap-3", className)}>
        <div className="rounded-xl border border-amber-300 bg-amber-50/90 p-3 text-xs text-amber-950">
          <div className="flex items-center gap-2 font-bold text-amber-900">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <span>3D Asset Temporarily Unavailable — Using Fit Fallback</span>
          </div>
          <p className="mt-1 text-[11px] text-amber-800">
            {loadError} (DEC-005: Fallback output is an illustrative proportional guide, not a 3D scan).
          </p>
        </div>
        {fallbackContent}
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative flex h-[380px] w-full flex-col overflow-hidden rounded-2xl border border-violet-200/80 bg-gradient-to-b from-[#FAF7FF] via-white to-violet-50/70 p-2 shadow-2xs sm:h-[430px]",
        className
      )}
    >
      {/* 3D Canvas */}
      <canvas
        ref={canvasRef}
        className="h-full w-full cursor-grab active:cursor-grabbing"
      />

      {/* Top Floating Controls */}
      <div className="pointer-events-none absolute left-3 right-3 top-3 flex items-center justify-between gap-2">
        <Badge variant="success" size="sm" className="pointer-events-auto">
          <Sparkles className="h-3 w-3" aria-hidden="true" />
          Real 3D Avatar (SMPL)
        </Badge>

        <div className="pointer-events-auto flex items-center gap-1.5 rounded-lg border border-violet-200/80 bg-white/90 p-1 shadow-2xs backdrop-blur-xs">
          <button
            type="button"
            onClick={() => setPose("apose")}
            aria-pressed={pose === "apose"}
            className={cn(
              "cursor-pointer rounded-md px-2 py-0.5 text-[11px] font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6633EE]",
              pose === "apose"
                ? "bg-[#6633EE] text-white"
                : "text-slate-600 hover:bg-violet-50 hover:text-slate-900"
            )}
          >
            A-Pose
          </button>
          <button
            type="button"
            onClick={() => setPose("tpose")}
            aria-pressed={pose === "tpose"}
            className={cn(
              "cursor-pointer rounded-md px-2 py-0.5 text-[11px] font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6633EE]",
              pose === "tpose"
                ? "bg-[#6633EE] text-white"
                : "text-slate-600 hover:bg-violet-50 hover:text-slate-900"
            )}
          >
            T-Pose
          </button>
          <button
            type="button"
            onClick={handleResetCamera}
            aria-label="Reset Camera"
            title="Reset camera view"
            className="cursor-pointer rounded-md p-1 text-slate-500 hover:bg-violet-50 hover:text-slate-800"
          >
            <RotateCcw className="h-3 w-3" />
          </button>
        </div>
      </div>

      {/* Loading Overlay */}
      {isLoading && (
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center bg-white/70 backdrop-blur-2xs">
          <Loader2 className="h-6 w-6 animate-spin text-[#6633EE]" />
          <p className="mt-2 text-xs font-semibold text-slate-700">
            Loading {pose.toUpperCase()} 3D Mesh...
          </p>
        </div>
      )}

      {/* Bottom Hint */}
      <div className="pointer-events-none absolute bottom-2 left-0 right-0 text-center text-[10px] text-slate-400">
        Drag to rotate &bull; Scroll to zoom &bull; Right-click drag to pan
      </div>
    </div>
  );
}
export default Avatar3DViewer;
