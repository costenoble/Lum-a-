"use client";

import { useLayoutEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import type { Group, Mesh } from "three";

export const BANANA_MODEL_URL = "/models/banane.glb";

export type BananaModelProps = {
  /** Échelle appliquée au modèle (le GLB est à l'échelle réelle : ~19 cm). */
  scale?: number;
  /** Active une légère rotation / flottaison. */
  animated?: boolean;
  /** Vitesse de rotation en rad/s. */
  rotationSpeed?: number;
};

export function BananaModel({
  scale = 10,
  animated = true,
  rotationSpeed = 0.35,
}: BananaModelProps) {
  const group = useRef<Group>(null);
  const { scene } = useGLTF(BANANA_MODEL_URL);

  useLayoutEffect(() => {
    scene.traverse((child) => {
      if ((child as Mesh).isMesh) {
        child.castShadow = true;
      }
    });
  }, [scene]);

  useFrame((state, delta) => {
    if (!animated || !group.current) return;
    group.current.rotation.y += delta * rotationSpeed;
    group.current.position.y = Math.sin(state.clock.elapsedTime * 1.2) * 0.04;
  });

  return (
    <group ref={group} dispose={null}>
      <primitive object={scene} scale={scale} />
    </group>
  );
}

useGLTF.preload(BANANA_MODEL_URL);
