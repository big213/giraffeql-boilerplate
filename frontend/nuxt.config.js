import colors from 'vuetify/es5/util/colors'
import { readdirSync } from 'fs'

export default {
  // Disable server-side rendering (https://go.nuxtjs.dev/ssr-mode)
  ssr: false,

  env: {
    isDev: !!process.env.DEV,
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
    defaultGridView: !!process.env.DEFAULT_GRID_VIEW,
    defaultLightMode: !!process.env.DEFAULT_LIGHT_MODE,
    stripePubKey: process.env.STRIPE_PUB_KEY,
    socialLoginEnabled: !!process.env.SOCIAL_LOGIN_ENABLED,
    tempStoragePath: process.env.TEMP_STORAGE_PATH,
    hideNullInputIcon: process.env.HIDE_NULL_INPUT_ICON,
    paypalClientId: process.env.PAYPAL_CLIENT_ID,
  },

  // Target (https://go.nuxtjs.dev/config-target)
  target: 'static',

  generate: {
    routes() {
      function retrieveRouteNamesFromDirectory(directory) {
        return readdirSync(directory)
          .map((filename) => filename.match(/^(.*)\.ts$/)?.[1])
          .filter((filename) => filename !== 'index')
      }

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

      // build the routesMap by loading the contents of the models directory
      const routesMap = {
        view: {},
        crud: {},
        action: retrieveRouteNamesFromDirectory('models/actions'),
      }

      const specialRoutesMap = {
        base: 'a',
        public: 'i',
      }

      // get the remaining compound model dirs
      readdirSync('models/views')
        .filter((entry) => entry !== 'index.ts')
        .forEach((compoundModelType) => {
          const routeNames = retrieveRouteNamesFromDirectory(
            `models/views/${compoundModelType}`
          )

          routesMap.view[compoundModelType] = routeNames
          routesMap.crud[compoundModelType] = routeNames
        })

      const routes = new Set()

      Object.entries(routesMap.view).forEach(([key, val]) => {
        val.forEach((type) => {
          routes.add(
            `/${specialRoutesMap[key] ?? key}/view/${camelToKebabCase(type)}`
          )
        })
      })

      Object.entries(routesMap.crud).forEach(([key, val]) => {
        val.forEach((type) => {
          routes.add(
            `/${specialRoutesMap[key] ?? key}/${camelToKebabCase(type)}`
          )
        })
      })

      routesMap.action.forEach((action) => {
        routes.add(`/action/${camelToKebabCase(action)}`)
      })

      return [...routes]
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
      {
        property: 'og:site_name',
        content: process.env.SITE_NAME,
      },
    ],
    script: [
      {
        src: 'https://js.stripe.com/v3/',
      },
      process.env.PAYPAL_CLIENT_ID
        ? {
            src: `https://www.paypal.com/sdk/js?client-id=${process.env.PAYPAL_CLIENT_ID}&currency=USD&components=buttons&enable-funding=venmo&disable-funding=card,paylater`,
          }
        : null,
    ].filter((e) => e),
    link: [{ rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' }],
  },

  router: {
    middleware: ['analytics'],
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
          accent: colors.grey.lighten2,
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
