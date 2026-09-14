<template>
  <footer class="night footer">
    <div class="container">
      <p class="eyebrow">Parlons-en</p>

      <NuxtLink to="/contact" class="cta-giant" v-magnetic style="margin-top: 1.5rem">
        Écrire à Luméa
      </NuxtLink>

      <div class="footer__cols">
        <div>
          <h4>Atelier</h4>
          <ul>
            <li v-for="line in site.address" :key="line">{{ line }}</li>
          </ul>
        </div>
        <div>
          <h4>Contact</h4>
          <ul>
            <li><a :href="`mailto:${site.email}`" class="link-under">{{ site.email }}</a></li>
            <li>
              <a :href="`tel:${site.phone.replace(/\s/g, '')}`" class="link-under">
                {{ site.phone }}
              </a>
            </li>
          </ul>
        </div>
        <div>
          <h4>Réseaux</h4>
          <ul>
            <li v-for="s in site.socials" :key="s.label">
              <a :href="s.href" target="_blank" rel="noopener" class="link-under">{{ s.label }}</a>
            </li>
          </ul>
        </div>
        <div>
          <h4>Navigation</h4>
          <ul>
            <li v-for="item in [...nav, ...navSecondary]" :key="item.to">
              <NuxtLink :to="item.to" class="link-under">{{ item.label }}</NuxtLink>
            </li>
          </ul>
        </div>
      </div>

      <div class="footer__bottom">
        <span>© {{ year }} {{ site.name }} — {{ site.city }}</span>
        <span>{{ time }} · {{ site.city }}</span>
        <NuxtLink to="/mentions-legales" class="link-under">Mentions légales</NuxtLink>
      </div>
    </div>
  </footer>
</template>

<script setup lang="ts">
const year = new Date().getFullYear()

// Horloge locale : rendue vide au SSR pour éviter un mismatch d'hydratation,
// remplie à la première frame client puis rafraîchie chaque minute.
const time = ref('')
onMounted(() => {
  const tick = () => {
    time.value = new Intl.DateTimeFormat('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Europe/Paris'
    }).format(new Date())
  }
  tick()
  const id = window.setInterval(tick, 60_000)
  onUnmounted(() => window.clearInterval(id))
})
</script>
