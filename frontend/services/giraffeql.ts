import axios from 'axios'
import { auth } from '~/services/fireinit'
import { Root, GetQuery, GetResponse } from '../../schema'

const prodResource = axios.create({
  baseURL: process.env.apiUrl,
})

export async function executeGiraffeql<Key extends keyof Root>(
  that,
  query: GetQuery<Key>,
  omitIdToken = false,
  attempts = 0
): Promise<GetResponse<Key>> {
  // fetches the idToken
  const currentUser = auth.currentUser
  const idToken =
    currentUser && !omitIdToken ? await currentUser.getIdToken() : null

  try {
    const request = idToken
      ? {
          headers: {
            Authorization: `Bearer ${idToken}`,
          },
        }
      : undefined

    const { data } = await prodResource.post('/giraffeql', query, request)

    return data.data
  } catch (err: any) {
    // if err.response is undefined, must be cors error. try again up to 3 times before giving up
    if (attempts < 3 && err.response === undefined) {
      console.log(`Failed due to CORS/network error. Attempt: ${attempts}`)
      return executeGiraffeql(that, query, omitIdToken, attempts + 1)
    }

    // else, throw the err
    throw err
  }
}
