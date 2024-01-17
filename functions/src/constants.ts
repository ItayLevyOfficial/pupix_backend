import * as functions from 'firebase-functions'

// Have to be testing, staging or live.
export let environment: string = functions.config()?.environment?.state ?? 'testing'

// The time call is pending to the addressee, in milliseconds.
export const pendingCallLength = 120_000

export const functionsUrl = environment === 'testing' ? 'https://pupik-functions.eu.ngrok.io/levy-c62af/us-central1' :
	environment === 'staging' ?
		'https://us-central1-levy-c62af.cloudfunctions.net' : 'https://us-central1-pupik-897d8.cloudfunctions.net'

export const websiteUrl = environment === 'testing' ? 'http://localhost:3000' :
	environment === 'staging' ? 'https://pupik-staging.vercel.app' : 'https://pupix.com'
