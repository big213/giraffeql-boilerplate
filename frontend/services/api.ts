import { auth } from '~/services/fireinit'
import { Root, GetQuery, GetResponse } from '../../schema'

type GiraffeqlErrorData = {
  message: string
  fieldPath: string[] | null
  type: string
  stack: string
}

export class GiraffeqlError extends Error {
  data: GiraffeqlErrorData
  statusCode: number
  query: any
  apiVersion: string | null
  constructor({
    data,
    statusCode,
    query,
    apiVersion,
  }: {
    data: GiraffeqlErrorData
    statusCode: number
    query: any
    apiVersion: string | null
  }) {
    super(data.message)
    this.data = data
    this.statusCode = statusCode
    this.query = query
    this.apiVersion = apiVersion
    this.name = GiraffeqlError.name
  }
}

export async function executeApiRequest<Key extends keyof Root>(
  query: GetQuery<Key>,
  { omitIdToken = false, maxAttempts = 3 } = {},
  attempt = 1
): Promise<GetResponse<Key>> {
  // fetches the idToken
  const currentUser = auth.currentUser
  const idToken =
    currentUser && !omitIdToken ? await currentUser.getIdToken() : undefined

  try {
    const response = await fetch(`${process.env.apiUrl}/giraffeql`, {
      headers: {
        'Content-Type': 'application/json',
        ...(idToken && {
          Authorization: `Bearer ${idToken}`,
        }),
      },
      method: 'POST',
      body: JSON.stringify(query),
    })

    if (!response.ok) {
      console.log(response)
      // if error, attempt to fetch the response
      const errorResponse = await response.json()

      // if it has error field, use that to throw the err
      response.headers
      if (errorResponse.error) {
        throw new GiraffeqlError({
          data: errorResponse.error,
          statusCode: response.status,
          query,
          apiVersion: response.headers.get('api-version'),
        })
      } else {
        throw new Error(`HTTP Error, status: ${response.status}`)
      }
    }

    const data = await response.json()

    return data.data
  } catch (err: any) {
    // if error is not a giraffeql error, must be network error (CORS or simply the network is not available). try again up to maxAttempts times before stopping
    if (!(err instanceof GiraffeqlError)) {
      console.log(
        `Failed due to network error. Attempt: ${attempt}${
          attempt === maxAttempts ? ` (Final Attempt)` : ''
        }`
      )
      if (attempt < maxAttempts) {
        return executeApiRequest(
          query,
          {
            omitIdToken,
            maxAttempts,
          },
          attempt + 1
        )
      }
    }

    // else, throw the err
    throw err
  }
}
