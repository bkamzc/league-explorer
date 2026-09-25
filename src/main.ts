import './app/styles/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { PiniaColada } from '@pinia/colada'

import App from './app/App.vue'
import router from './app/router'

const app = createApp(App)

app.use(createPinia())
// Safe global defaults; each query also sets its own caching policy (see leagues.queries.ts).
app.use(PiniaColada, { queryOptions: { refetchOnWindowFocus: false, refetchOnReconnect: false } })
app.use(router)

// Last-resort handler for errors that escape components. A real app would report these.
app.config.errorHandler = (error, _instance, info) => {
  console.error(`[League Explorer] Unhandled error (${info})`, error)
}

app.mount('#app')
