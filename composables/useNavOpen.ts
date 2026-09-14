// État partagé de la nav plein écran, lu par TheHeader (le bouton) et
// NavOverlay (le panneau + sa timeline GSAP).
export function useNavOpen() {
  return useState('nav-open', () => false)
}
