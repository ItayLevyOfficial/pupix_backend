import * as functions from 'firebase-functions'

export const createTipPaymentIntent = functions.https.onCall(
	async ({tipAmount, addresseeUid, videoRoomId}, context) => {
		const clientUid = context.auth.uid
		const {createTipPaymentIntentLogic} = await import('./createTipPaymentIntentLogic')
		const paymentIntent = await createTipPaymentIntentLogic(addresseeUid, clientUid, videoRoomId, parseInt(tipAmount))
		return paymentIntent?.client_secret
	})