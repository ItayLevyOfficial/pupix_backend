import * as functions from 'firebase-functions'

/**
 * Wrapper function, to separate the input output handling and the function logic.
 */
export const createPaymentIntent = functions.https.onCall(
	async ({addresseeUid, callLength}, context) => {
		const {createPaymentIntentLogic} = await import('./createPaymentIntentLogic')
		const paymentIntent = await createPaymentIntentLogic(addresseeUid, context.auth.uid, callLength)
		return paymentIntent?.client_secret
	})
