import { defaultLightMode } from '~/services/config'

export default (context) => {
  if (process.client) {
    const savedTheme = localStorage.getItem('theme')

    if (savedTheme) {
      context.$vuetify.theme.dark = savedTheme === 'dark'
    } else {
      context.$vuetify.theme.dark = defaultLightMode ? false : true
    }
  }
}
