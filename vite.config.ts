import { fileURLToPath, URL } from 'node:url'

import { defineConfig, loadEnv, type Plugin } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import tailwindcss from '@tailwindcss/vite'
import Icons from 'unplugin-icons/vite'

/**
 * Adds a Content-Security-Policy <meta> to production builds only.
 * The dev server needs inline styles for HMR, and static hosts such as GitHub Pages
 * can't set response headers, so the meta tag is the portable option.
 */
function contentSecurityPolicy(apiOrigin: string): Plugin {
  const policy = [
    "default-src 'self'",
    "script-src 'self'",
    "style-src 'self'",
    "img-src 'self' data: https://r2.thesportsdb.com https://www.thesportsdb.com",
    `connect-src 'self' ${apiOrigin}`,
    "font-src 'self'",
    "object-src 'none'",
    "base-uri 'none'",
    "form-action 'none'",
  ].join('; ')

  return {
    name: 'league-explorer:csp',
    apply: 'build',
    // Right after <meta charset> so it applies to every script and stylesheet that follows.
    transformIndexHtml: (html) =>
      html.replace(
        /<meta charset="UTF-8" \/>/,
        (charset) => `${charset}\n    <meta http-equiv="Content-Security-Policy" content="${policy}" />`,
      ),
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_')
  const apiOrigin = new URL(env.VITE_SPORTSDB_BASE_URL || 'https://www.thesportsdb.com/api/v1/json')
    .origin

  return {
    plugins: [
      vue(),
      tailwindcss(),
      Icons({ compiler: 'vue3' }),
      vueDevTools(),
      contentSecurityPolicy(apiOrigin),
    ],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
  }
})
