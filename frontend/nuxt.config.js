import colors from 'vuetify/es5/util/colors'
import { routesMap } from './services/config'

export default {
  // Disable server-side rendering (https://go.nuxtjs.dev/ssr-mode)
  ssr: false,

  env: {
    DEV: process.env.DEV,
    VER: process.env.VER,
    apiUrl: process.env.API_URL,
    imageServingUrl: process.env.IMAGE_SERVING_URL,
    buildDate: new Date().toDateString(),
    siteName: process.env.SITE_NAME,
    siteDescription: process.env.SITE_DESCRIPTION,
    siteImageUrl: process.env.SITE_IMAGE_URL,
    siteContactEmail: process.env.SITE_CONTACT_EMAIL,
    siteDiscordLink: process.env.SITE_DISCORD_LINK,
    siteGithubRepositoryUrl: process.env.SITE_GITHUB_REPOSITORY_URL,
    logoHasLightVariant: !!process.env.LOGO_HAS_LIGHT_VARIANT,
  },

  // Target (https://go.nuxtjs.dev/config-target)
  target: 'static',

  generate: {
    routes() {
      function camelToKebabCase(str) {
        return str
          .split('')
          .map((letter, idx) => {
            return letter.toUpperCase() === letter
              ? `${idx !== 0 ? '-' : ''}${letter.toLowerCase()}`
              : letter
          })
          .join('')
      }

      return Object.entries(routesMap).reduce((total, [key, val]) => {
        total.push(...val.map((type) => `/${key}/${camelToKebabCase(type)}`))
        total.push(
          ...val.map((type) => `/${key}/view/${camelToKebabCase(type)}`)
        )
        return total
      }, [])
    },
  },

  // Global page headers (https://go.nuxtjs.dev/config-head)
  head: {
    titleTemplate: (titleChunk) => {
      const siteName = process.env.SITE_NAME || process.env.siteName
      return titleChunk ? `${titleChunk} - ${siteName}` : siteName
    },
    meta: [
      { charset: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      {
        hid: 'description',
        name: 'description',
        content: process.env.SITE_DESCRIPTION,
      },
      {
        property: 'og:title',
        content: process.env.SITE_NAME,
      },
      {
        property: 'og:description',
        content: process.env.SITE_DESCRIPTION,
      },
      {
        property: 'og:image',
        content: process.env.SITE_IMAGE_URL,
      },
    ],
    link: [{ rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' }],
  },

  // Global CSS (https://go.nuxtjs.dev/config-css)
  css: ['vue-wysiwyg/dist/vueWysiwyg.css', '@/assets/main.css'],

  // Plugins to run before rendering page (https://go.nuxtjs.dev/config-plugins)
  plugins: [
    '@/plugins/notifier.js',
    '@/plugins/auth.js',
    '@/plugins/wysiwyg.js',
    '@/plugins/firebase.js',
    '@/plugins/vuetify.js',
  ],

  // Auto import components (https://go.nuxtjs.dev/config-components)
  components: true,

  // Modules for dev and build (recommended) (https://go.nuxtjs.dev/config-modules)
  buildModules: [
    // https://go.nuxtjs.dev/typescript
    '@nuxt/typescript-build',
    // https://go.nuxtjs.dev/vuetify
    '@nuxtjs/vuetify',
    '@nuxtjs/dotenv',
  ],

  // Modules (https://go.nuxtjs.dev/config-modules)
  modules: [],

  // Vuetify module configuration (https://go.nuxtjs.dev/config-vuetify)
  vuetify: {
    customVariables: ['~/assets/variables.scss'],
    theme: {
      dark: true,
      options: { customProperties: true },
      themes: {
        dark: {
          primary: colors.blue.darken2,
          secondary: colors.amber.darken3,
          accent: colors.grey.darken3,
          info: colors.teal.lighten1,
          warning: colors.amber.base,
          error: colors.deepOrange.accent4,
          success: colors.green.accent3,
        },
        light: {
          primary: colors.blue.darken1,
          secondary: colors.amber.lighten2,
          accent: colors.blue.lighten4,
          info: colors.teal.lighten1,
          warning: colors.amber.base,
          error: colors.red.accent3,
          success: colors.green.accent3,
        },
      },
    },
  },

  // Build Configuration (https://go.nuxtjs.dev/config-build)
  build: {},
}
