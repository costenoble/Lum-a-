<template>
  <section class="container legal">
    <p class="eyebrow" v-reveal>Informations</p>
    <h1 v-lines="0.05" style="font-size: var(--fs-h1); margin-block: 1.5rem var(--sp-4)">
      <span class="line-mask"><span>Mentions légales</span></span>
    </h1>

    <div class="legal__body">
      <section v-for="block in blocks" :key="block.title" v-reveal>
        <h2>{{ block.title }}</h2>
        <p v-for="(p, i) in block.paragraphs" :key="i">{{ p }}</p>
      </section>
    </div>
  </section>
</template>

<script setup lang="ts">
useHead({ title: 'Mentions légales — Luméa' })

// Contenu de démonstration : à remplacer par les informations réelles de la
// société avant toute mise en ligne.
const blocks = [
  {
    title: 'Éditeur',
    paragraphs: [
      `${site.name} SAS — ${site.address.join(', ')}.`,
      `Contact : ${site.email} · ${site.phone}.`,
      'SAS au capital de 10 000 €, RCS Lyon 000 000 000.'
    ]
  },
  {
    title: 'Hébergement',
    paragraphs: ['Site hébergé par un prestataire à renseigner avant publication.']
  },
  {
    title: 'Propriété intellectuelle',
    paragraphs: [
      'L’ensemble des contenus (textes, photos, visuels, identité) est la propriété de Luméa.',
      'Toute reproduction sans autorisation écrite est interdite.'
    ]
  },
  {
    title: 'Données personnelles',
    paragraphs: [
      'Les informations transmises via le formulaire de contact servent uniquement à répondre à la demande.',
      'Vous disposez d’un droit d’accès, de rectification et de suppression à l’adresse ' + site.email + '.'
    ]
  }
]
</script>

<style scoped>
.legal {
  padding-block: calc(var(--header-h) + 6rem) var(--sp-6);
}
.legal__body {
  display: grid;
  gap: var(--sp-4);
  max-width: 62ch;
}
.legal__body h2 {
  font-size: 1.4rem;
  margin-bottom: 0.9rem;
}
.legal__body p + p {
  margin-top: 0.6rem;
}
.legal__body p {
  color: var(--ink-soft);
}
</style>
