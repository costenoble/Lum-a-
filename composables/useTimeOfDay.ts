// ---------------------------------------------------------------------------
// Moment de la journée du visiteur — l'heure de sa machine, pas celle de Lyon :
// l'idée est que le site soit éclairé comme la pièce dans laquelle il se
// trouve. Sert à la fois à la lumière de la bouteille 3D et à la ligne de
// contexte du hero.
// ---------------------------------------------------------------------------

export interface TimeOfDay {
  key: 'matin' | 'journee' | 'gouter' | 'soir' | 'nuit'
  /** Formule affichée dans le hero. */
  moment: string
  /** Teinte de la lumière principale de la scène 3D. */
  light: string
  /** Exposition du rendu : plus basse le soir, plus haute en plein jour. */
  exposure: number
}

const MOMENTS: Record<TimeOfDay['key'], Omit<TimeOfDay, 'key'>> = {
  matin: { moment: 'le premier verre', light: '#ffe7d2', exposure: 1.05 },
  journee: { moment: 'plein jour', light: '#ffffff', exposure: 1.2 },
  gouter: { moment: 'l’heure du goûter', light: '#ffcf95', exposure: 1.25 },
  soir: { moment: 'la fin de journée', light: '#a9b8ff', exposure: 0.95 },
  nuit: { moment: 'la nuit', light: '#7d8ada', exposure: 0.8 }
}

export function timeOfDay(date = new Date()): TimeOfDay {
  const hour = date.getHours()
  const key: TimeOfDay['key'] =
    hour < 5 ? 'nuit' : hour < 10 ? 'matin' : hour < 16 ? 'journee' : hour < 19 ? 'gouter' : hour < 22 ? 'soir' : 'nuit'
  return { key, ...MOMENTS[key] }
}

export function formatLocalTime(date = new Date()) {
  return new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit' }).format(date)
}
