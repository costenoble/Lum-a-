<template>
  <div>
    <section class="container page-head">
      <p class="eyebrow" v-reveal>Contact</p>
      <h1 v-lines="0.05" style="font-size: var(--fs-hero); margin-top: 1.5rem">
        <span class="line-mask"><span>Écrivez-nous</span></span>
      </h1>
      <p class="lead" v-reveal="0.3" style="margin-top: 2rem">
        Revendeur, presse, collaboration ou simple curiosité : on répond sous 48 h.
      </p>
    </section>

    <section class="container section--tight contact-grid">
      <form class="form" @submit.prevent="submit" v-reveal>
        <div class="field">
          <label for="name">Nom</label>
          <input id="name" v-model="form.name" type="text" required autocomplete="name" />
        </div>
        <div class="field">
          <label for="email">E-mail</label>
          <input id="email" v-model="form.email" type="email" required autocomplete="email" />
        </div>
        <div class="field">
          <label for="subject">Sujet</label>
          <input id="subject" v-model="form.subject" type="text" />
        </div>
        <div class="field">
          <label for="message">Message</label>
          <textarea id="message" v-model="form.message" required />
        </div>

        <button type="submit" class="btn" v-magnetic style="justify-self: start">
          <span>{{ sent ? 'Merci !' : 'Envoyer' }}</span>
        </button>

        <!-- Pas de backend ici : le formulaire confirme localement. Brancher
             une route serveur ou un service tiers avant mise en ligne. -->
        <p v-if="sent" class="muted" role="status">
          Message enregistré côté navigateur. Branchez un endpoint dans
          <code>submit()</code> pour l’envoyer réellement.
        </p>
      </form>

      <aside class="contact-info" v-reveal="0.1">
        <div>
          <h2 class="eyebrow">Atelier</h2>
          <p v-for="line in site.address" :key="line">{{ line }}</p>
        </div>
        <div>
          <h2 class="eyebrow">Direct</h2>
          <p><a :href="`mailto:${site.email}`" class="link-under">{{ site.email }}</a></p>
          <p>
            <a :href="`tel:${site.phone.replace(/\s/g, '')}`" class="link-under">{{ site.phone }}</a>
          </p>
        </div>
        <div>
          <h2 class="eyebrow">Réseaux</h2>
          <p v-for="s in site.socials" :key="s.label">
            <a :href="s.href" target="_blank" rel="noopener" class="link-under">{{ s.label }}</a>
          </p>
        </div>
      </aside>
    </section>
  </div>
</template>

<script setup lang="ts">
useHead({ title: 'Contact — Luméa' })

const form = reactive({ name: '', email: '', subject: '', message: '' })
const sent = ref(false)

function submit() {
  sent.value = true
}
</script>

<style scoped>
.page-head {
  padding-block: calc(var(--header-h) + 6rem) var(--sp-4);
}
.contact-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.4fr) minmax(0, 1fr);
  gap: clamp(2rem, 6vw, 5rem);
  padding-bottom: var(--sp-6);
}
.contact-info {
  display: grid;
  gap: var(--sp-3);
  align-content: start;
  font-size: 1.05rem;
}
.contact-info .eyebrow {
  margin-bottom: 0.9rem;
}
@media (max-width: 900px) {
  .contact-grid {
    grid-template-columns: 1fr;
  }
}
code {
  font-family: var(--font-mono);
  font-size: 0.85em;
}
</style>
