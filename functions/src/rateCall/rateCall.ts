import * as functions from 'firebase-functions'

export const rateCall = functions.https.onCall((async ({callRating, callId}, context) => {
	const clientUid = context.auth.uid
	const {rateCallLogic} = await import('./rateCallLogic')
	await rateCallLogic(clientUid, callRating, callId)
}))