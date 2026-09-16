"use client";

import { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import {
  Center,
  Environment,
  Lightformer,
  OrbitControls,
  useProgress,
  Html,
} from "@react-three/drei";
import { BananaModel, type BananaModelProps } from "./BananaModel";

export type BananaSceneProps = BananaModelProps & {
  className?: string;
  /** Autorise l'utilisateur à tourner autour du modèle. */
  interactive?: boolean;
  /** Couleur de fond. `transparent` pour laisser voir le fond de la page. */
  background?: string | "transparent";
};

function Loader() {
  const { progress } = useProgress();
  return (
    <Html center>
      <span style={{ color: "#aaa", fontSize: 14 }}>{Math.round(progress)} %</span>
    </Html>
  );
}

export default function BananaScene({
  className,
  interactive = true,
  background = "#0b0b0c",
  ...modelProps
}: BananaSceneProps) {
  return (
    <div className={className} style={{ width: "100%", height: "100%" }}>
      <Canvas
        dpr={[1, 2]}
        shadows="soft"
        camera={{ position: [0, 0.9, 3.2], fov: 35 }}
        gl={{ antialias: true, alpha: background === "transparent" }}
      >
        {background !== "transparent" && <color attach="background" args={[background]} />}

        {/* Éclairage studio autonome (aucun HDRI externe à télécharger) */}
        <ambientLight intensity={0.15} />
        <directionalLight
          position={[-3, 5, 3]}
          intensity={2.2}
          castShadow
          shadow-mapSize={[2048, 2048]}
          shadow-bias={-0.0004}
          shadow-radius={6}
        >
          <orthographicCamera attach="shadow-camera" args={[-3, 3, 3, -3, 0.1, 20]} />
        </directionalLight>
        <Environment resolution={256}>
          <Lightformer form="rect" intensity={3} position={[-3, 3, 3]} scale={[4, 3, 1]} />
          <Lightformer form="rect" intensity={1.5} position={[3, 2, -3]} scale={[4, 1, 1]} />
          <Lightformer form="ring" intensity={0.6} position={[0, 4, 0]} scale={3} />
        </Environment>

        <Suspense fallback={<Loader />}>
          <Center>
            <BananaModel {...modelProps} />
          </Center>
        </Suspense>

        {/* Sol invisible qui ne reçoit que l'ombre */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.34, 0]} receiveShadow>
          <planeGeometry args={[10, 10]} />
          <shadowMaterial transparent opacity={0.45} />
        </mesh>

        {interactive && (
          <OrbitControls
            enablePan={false}
            minDistance={2}
            maxDistance={6}
            minPolarAngle={Math.PI / 6}
            maxPolarAngle={Math.PI / 2}
          />
        )}
      </Canvas>
    </div>
  );
}
