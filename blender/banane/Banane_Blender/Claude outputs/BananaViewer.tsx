"use client";

import dynamic from "next/dynamic";
import type { BananaSceneProps } from "./BananaScene";

/**
 * Point d'entrée à utiliser dans les pages Next.js (App Router).
 * Three.js a besoin du navigateur : on désactive le rendu serveur
 * et on affiche l'image statique pendant le chargement.
 */
const BananaScene = dynamic(() => import("./BananaScene"), {
  ssr: false,
  loading: () => (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/images/banane.webp"
      alt="Banane"
      style={{ width: "100%", height: "100%", objectFit: "cover" }}
    />
  ),
});

export default function BananaViewer(props: BananaSceneProps) {
  return <BananaScene {...props} />;
}
