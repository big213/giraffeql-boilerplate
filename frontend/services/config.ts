export const siteName = process.env.siteName
export const siteDescription = process.env.siteDescription
export const siteImageUrl = process.env.siteImageUrl
export const siteContactEmail = process.env.siteContactEmail
export const siteDiscordLink = process.env.siteDiscordLink
export const siteGithubRepositoryUrl = process.env.siteGithubRepositoryUrl
export const logoHasLightVariant = process.env.logoHasLightVariant
export const defaultGridView = process.env.defaultGridView

export const firebaseConfig = {
  apiKey: 'AIzaSyDMuwUROWZQyG93I21ofU7Cx52q42_XZ0Q',
  authDomain: 'giraffeql-boilerplate.firebaseapp.com',
  projectId: 'giraffeql-boilerplate',
  storageBucket: 'giraffeql-boilerplate.appspot.com',
  messagingSenderId: '229325360702',
  appId: '1:229325360702:web:30786fc003bc2972970b6f',
}

export const routesMap = {
  a: ['apiKey', 'file', 'user', 'userUserFollowLink'],
  i: ['user'],
  my: ['apiKey', 'file'],
  s: [],
}
