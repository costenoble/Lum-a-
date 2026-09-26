// ---------------------------------------------------------------------------
// Moment de la journée du visiteur — l'heure de sa machine, pas celle de Lyon :
// l'idée est que le site parle de la pièce dans laquelle il se trouve. Sert à
// la ligne de contexte du hero.
// ---------------------------------------------------------------------------

export interface TimeOfDay {
  key: 'matin' | 'journee' | 'gouter' | 'soir' | 'nuit'
  /** Formule affichée dans le hero. */
  moment: string
}

const MOMENTS: Record<TimeOfDay['key'], string> = {
  matin: 'le premier verre',
  journee: 'plein jour',
  gouter: 'l’heure du goûter',
  soir: 'la fin de journée',
  nuit: 'la nuit'
}

export function timeOfDay(date = new Date()): TimeOfDay {
  const hour = date.getHours()
  const key: TimeOfDay['key'] =
    hour < 5 ? 'nuit' : hour < 10 ? 'matin' : hour < 16 ? 'journee' : hour < 19 ? 'gouter' : hour < 22 ? 'soir' : 'nuit'
  return { key, moment: MOMENTS[key] }
}

export function formatLocalTime(date = new Date()) {
  return new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit' }).format(date)
}
