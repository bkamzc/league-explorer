<script setup lang="ts">
import { computed, type Component } from 'vue'
import IconSoccer from '~icons/mdi/soccer'
import IconBasketball from '~icons/mdi/basketball'
import IconMotorsport from '~icons/mdi/racing-helmet'
import IconFighting from '~icons/mdi/boxing-glove'
import IconBaseball from '~icons/mdi/baseball'
import IconAmericanFootball from '~icons/mdi/football'
import IconIceHockey from '~icons/mdi/hockey-puck'
import IconFieldHockey from '~icons/mdi/hockey-sticks'
import IconGolf from '~icons/mdi/golf'
import IconRugby from '~icons/mdi/rugby'
import IconTennis from '~icons/mdi/tennis'
import IconCricket from '~icons/mdi/cricket'
import IconCycling from '~icons/mdi/bike'
import IconEsports from '~icons/mdi/controller'
import IconVolleyball from '~icons/mdi/volleyball'
import IconHandball from '~icons/mdi/handball'
import IconNetball from '~icons/mdi/basketball-hoop'
import IconDarts from '~icons/mdi/bullseye-arrow'
import IconSnooker from '~icons/mdi/billiards'
import IconOlympics from '~icons/mdi/medal'
import IconTrophy from '~icons/mdi/trophy-outline'

const { sport } = defineProps<{ sport: string }>()

// SVG icons rather than emoji: emoji render inconsistently on older Android and are read aloud.
const ICONS: Readonly<Record<string, Component>> = {
  Soccer: IconSoccer,
  Basketball: IconBasketball,
  Motorsport: IconMotorsport,
  Fighting: IconFighting,
  Baseball: IconBaseball,
  'American Football': IconAmericanFootball,
  'Ice Hockey': IconIceHockey,
  'Field Hockey': IconFieldHockey,
  Golf: IconGolf,
  Rugby: IconRugby,
  'Australian Football': IconRugby,
  Tennis: IconTennis,
  Cricket: IconCricket,
  Cycling: IconCycling,
  Esports: IconEsports,
  Volleyball: IconVolleyball,
  Handball: IconHandball,
  Netball: IconNetball,
  Darts: IconDarts,
  Snooker: IconSnooker,
  Olympics: IconOlympics,
}

const icon = computed(() => ICONS[sport] ?? IconTrophy)
</script>

<template>
  <component :is="icon" aria-hidden="true" />
</template>
