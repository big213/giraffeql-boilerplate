import { logEvent } from 'firebase/analytics'
import { analytics } from './fireinit'

export function logAnalyticsEvent(type: string, params: any) {
  return logEvent(analytics, type, params)
}
