# Banane 3D : intégration web (Next.js)

## Contenu

```
banane-web/
├── public/
│   ├── models/banane.glb      ← modèle 3D (glTF binaire, textures WebP intégrées, 1,7 Mo)
│   └── images/banane.webp     ← rendu Blender (image statique / fallback)
└── components/banana/
    ├── BananaModel.tsx        ← charge le GLB (useGLTF) + animation
    ├── BananaScene.tsx        ← Canvas, éclairage studio, ombre, contrôles
    ├── BananaViewer.tsx       ← wrapper Next (import dynamique, ssr: false)
    └── index.ts
```

Le modèle : environ 19 cm à l'échelle réelle, 25 000 triangles, origine au centre.
Il contient 3 textures bakées en 2048×2048 (couleur, rugosité, normal map).

## Installation

```bash
npm i three @react-three/fiber @react-three/drei
npm i -D @types/three
```

> `@react-three/fiber` 9.x demande **React 19.0 à 19.2**. Si ton projet est en React 19.3+,
> garde React en 19.2 (`npm i react@~19.2.0 react-dom@~19.2.0`) jusqu'à la mise à jour de R3F.

Testé avec : Next 16.3, React 19.2, three 0.186, R3F 9.7, drei 10.7.

Copie `public/` et `components/banana/` dans ton projet (l'alias `@/` est supposé pointer vers la racine).

## Utilisation

```tsx
import { BananaViewer } from "@/components/banana";

export default function Hero() {
  return (
    <section style={{ height: 600 }}>
      <BananaViewer />
    </section>
  );
}
```

Le conteneur parent **doit avoir une hauteur**, sinon le canvas fait 0 px.

### Props

| Prop            | Défaut      | Rôle                                                |
|-----------------|-------------|-----------------------------------------------------|
| `animated`      | `true`      | rotation + légère flottaison                        |
| `rotationSpeed` | `0.35`      | vitesse de rotation (rad/s)                         |
| `scale`         | `10`        | taille du modèle dans la scène                      |
| `interactive`   | `true`      | rotation à la souris / au doigt (OrbitControls)     |
| `background`    | `"#0b0b0c"` | couleur de fond, ou `"transparent"`                 |
| `className`     | –           | classe CSS du conteneur                             |

Exemple fond transparent, sans interaction :

```tsx
<BananaViewer background="transparent" interactive={false} rotationSpeed={0.2} />
```

## Alternative sans React : `<model-viewer>`

Pour une page statique ou un CMS :

```html
<script type="module" src="https://cdn.jsdelivr.net/npm/@google/model-viewer/dist/model-viewer.min.js"></script>

<model-viewer
  src="/models/banane.glb"
  alt="Banane 3D"
  camera-controls
  auto-rotate
  shadow-intensity="1"
  exposure="1"
  style="width: 100%; height: 500px; background: #0b0b0c"
></model-viewer>
```

## Performance

- `banane.glb` fait 1,7 Mo. **`banane.min.glb` (130 Ko)** est la version compressée
  (meshopt, textures 1024 px), avec un rendu quasi identique. Pour l'utiliser, change
  `BANANA_MODEL_URL` en `"/models/banane.min.glb"` : drei `useGLTF` décode meshopt sans configuration.
  Commande utilisée : `npx @gltf-transform/cli optimize banane.glb banane.min.glb --compress meshopt --texture-size 1024`
- `useGLTF.preload` lance le téléchargement dès que le module est importé.
- Pendant le chargement, `BananaViewer` affiche `banane.webp` à la place du modèle.
