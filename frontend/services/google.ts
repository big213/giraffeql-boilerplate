import { Loader } from '@googlemaps/js-api-loader'
import { firebaseConfig } from '../config'

const loader = new Loader({
  apiKey: firebaseConfig.apiKey,
  version: 'weekly',
})

let placesAutocompleteService

/* To-do */

// turn getQueryPredictions from a callback to a promise
export async function getQueryPredictions(query: string) {
  if (!placesAutocompleteService) {
    const places = await loader.importLibrary('places')
    placesAutocompleteService = new places.AutocompleteService()
    const placesService = new places.PlacesService()
    console.log(places)
    placesService.getDetails(
      {
        placeId: 'place_id',
      },
      (data, status) => {
        console.log(data)
      }
    )
  }
  return new Promise((resolve, reject) => {
    placesAutocompleteService.getPlacePredictions(
      {
        input: query,
        // types: ['(cities)'],
        componentRestrictions: { country: 'us' },
      },
      (predictions, status) => {
        if (status !== 'OK' || !predictions) reject(status)

        resolve(predictions)
      }
    )
  })
}

export async function loadMap(ele: HTMLElement) {
  const { Map } = await loader.importLibrary('maps')
  return new Map(ele, {
    center: { lat: -34.397, lng: 150.644 },
    zoom: 8,
  })
}

export async function getGoogleMapsSuggestions(query: string) {
  return getQueryPredictions(query).then((predictions: any) => {
    console.log(predictions)
    return predictions.map((ele) => ele.description)
  })
}
