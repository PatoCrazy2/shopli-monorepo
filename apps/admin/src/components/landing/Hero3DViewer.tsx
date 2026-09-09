"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "three/addons/libs/meshopt_decoder.module.js";

export default function Hero3DViewer() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let isVisible = true;
    let isMounted = true;
    let animationFrameId: number;

    // Escena y Cámara
    const scene = new THREE.Scene();
    const width = container.clientWidth || 500;
    const height = container.clientHeight || 500;

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 0, 4.5);

    // Renderer optimizado
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.3;
    container.appendChild(renderer.domElement);

    // Luces de Estudio Cinematográfico (inician en 0 para encenderse de forma suave y elegante)
    const targetAmbient = 1.5;
    const targetDir1 = 3.5;
    const targetDir2 = 1.5;
    const targetPoint = 2.0;

    const ambientLight = new THREE.AmbientLight(0xffffff, 0);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0xffffff, 0);
    dirLight1.position.set(5, 8, 5);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0xa0a0a0, 0);
    dirLight2.position.set(-5, -4, -3);
    scene.add(dirLight2);

    const pointLight = new THREE.PointLight(0xffffff, 0, 10);
    pointLight.position.set(0, 0, 3);
    scene.add(pointLight);

    const modelGroup = new THREE.Group();
    scene.add(modelGroup);

    // Loader con decodificador Meshopt
    const loader = new GLTFLoader();
    loader.setMeshoptDecoder(MeshoptDecoder);

    const materialsToDispose: THREE.Material[] = [];
    const geometriesToDispose: THREE.BufferGeometry[] = [];

    let objectBoundingRadius = 1;

    // Función matemática para encuadrar la cámara al objeto perfectamente
    const fitCameraToObject = () => {
      if (!container) return;
      const w = container.clientWidth || 500;
      const h = container.clientHeight || 500;
      const aspect = w / h;

      camera.aspect = aspect;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);

      // Calcular distancia según FOV vertical y FOV horizontal
      const fovRad = (camera.fov * Math.PI) / 180;
      // Margen de padding para que el objeto ocupe un porcentaje ideal y tenga holgura al rotar
      const isMobile = window.innerWidth < 1024;
      const fitFactor = isMobile ? 1.25 : 1.15; // Da ~80% en desktop y ~75% en mobile

      // Distancia necesaria verticalmente
      let distance = (objectBoundingRadius * fitFactor) / Math.sin(fovRad / 2);

      // Si el aspecto es estrecho (móvil portrait), asegurarse de que tampoco se corte horizontalmente
      const hFovRad = 2 * Math.atan(Math.tan(fovRad / 2) * aspect);
      const distanceH = (objectBoundingRadius * fitFactor) / Math.sin(hFovRad / 2);

      camera.position.z = Math.max(distance, distanceH);
      camera.lookAt(0, 0, 0);
    };

    loader.load(
      "/svg-3d-conversion-web.glb",
      (gltf) => {
        if (!isMounted) return;
        const object = gltf.scene;

        // Centrar geométricamente el objeto en su origen (0, 0, 0)
        const box = new THREE.Box3().setFromObject(object);
        const center = box.getCenter(new THREE.Vector3());
        object.position.sub(center);

        // Normalizar tamaño base a radio 1 para máxima precisión matemática
        const sphere = new THREE.Sphere();
        box.getBoundingSphere(sphere);
        const radius = sphere.radius || 1;
        const normalizeScale = 1 / radius;
        object.scale.setScalar(normalizeScale);

        // El radio normalizado es 1
        objectBoundingRadius = 1;

        object.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            const mesh = child as THREE.Mesh;
            if (mesh.geometry) {
              geometriesToDispose.push(mesh.geometry);
            }

            const mat = new THREE.MeshStandardMaterial({
              color: 0xffffff,
              metalness: 0.75,
              roughness: 0.22,
            });
            materialsToDispose.push(mat);
            mesh.material = mat;
          }
        });

        modelGroup.add(object);

        // Encuadrar cámara inmediatamente con las dimensiones calculadas
        fitCameraToObject();
      },
      undefined,
      (err) => {
        console.error("Error cargando GLB:", err);
      }
    );

    let targetRotationX = 0;
    let targetRotationY = 0;

    // Escuchar interacción suave con el cursor o touch
    const handlePointerMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      if (e.clientY < rect.top - 100 || e.clientY > rect.bottom + 100) return;
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
      targetRotationY = Math.max(-0.6, Math.min(0.6, x * 0.5));
      targetRotationX = Math.max(-0.5, Math.min(0.5, -y * 0.4));
    };

    window.addEventListener("mousemove", handlePointerMove, { passive: true });

    // Loop de animación pausado si el elemento está fuera de pantalla
    const clock = new THREE.Clock();

    const animate = () => {
      if (!isMounted) return;
      animationFrameId = requestAnimationFrame(animate);

      if (!isVisible) return; // Ahorro de GPU/batería cuando se scrollea fuera

      const elapsedTime = clock.getElapsedTime();

      // Encendido gradual y cinematográfico de luces de estudio a partir de los 1.8s (dura ~2.5s)
      if (elapsedTime > 1.8) {
        const lightProgress = Math.min(1, (elapsedTime - 1.8) / 2.5);
        // Curva suave easeInOutCubic
        const smoothProgress =
          lightProgress < 0.5
            ? 4 * lightProgress * lightProgress * lightProgress
            : 1 - Math.pow(-2 * lightProgress + 2, 3) / 2;

        ambientLight.intensity = targetAmbient * smoothProgress;
        dirLight1.intensity = targetDir1 * smoothProgress;
        dirLight2.intensity = targetDir2 * smoothProgress;
        pointLight.intensity = targetPoint * smoothProgress;
      }

      modelGroup.position.y = Math.sin(elapsedTime * 1.5) * 0.08;
      modelGroup.rotation.y += (targetRotationY - modelGroup.rotation.y) * 0.05;
      modelGroup.rotation.x += (targetRotationX - modelGroup.rotation.x) * 0.05;

      renderer.render(scene, camera);
    };

    animate();

    // Intersection Observer para pausar render cuando no esté visible
    const observer = new IntersectionObserver(
      ([entry]) => {
        isVisible = entry?.isIntersecting ?? true;
      },
      { threshold: 0.05 }
    );
    observer.observe(container);

    // Resize Handler profesional: reajusta cámara y frustum matemáticamente
    const handleResize = () => {
      fitCameraToObject();
    };

    window.addEventListener("resize", handleResize);

    // Limpieza estricta de memoria VRAM y listeners
    return () => {
      isMounted = false;
      observer.disconnect();
      window.removeEventListener("mousemove", handlePointerMove);
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationFrameId);

      geometriesToDispose.forEach((g) => g.dispose());
      materialsToDispose.forEach((m) => m.dispose());

      ambientLight.dispose();
      dirLight1.dispose();
      dirLight2.dispose();
      pointLight.dispose();

      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="w-full h-full flex items-center justify-center select-none"
    />
  );
}
