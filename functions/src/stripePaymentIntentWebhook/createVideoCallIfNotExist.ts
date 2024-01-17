import * as firebaseAdmin from 'firebase-admin'

/**
 * Creates a new video call document if it there's no video call document for the given payment intent.
 * Need this function and transaction to be safe from multiple invocations of the stripe webhook with the same
 * paymentIntentId.
 *
 * Thanks to this function, there can be only one video call document for payment intent.
 *
 * @return: The new video call document id if the video call document not exist yet, false otherwise.
 */
export const createVideoCallDocIfNotExist = async ({addresseeUid, clientUid, callLength, paymentIntentId}) => {
	return await firebaseAdmin.firestore().runTransaction(async transaction => {
		const currentVideoCallQuery = firebaseAdmin.firestore().collection('videoCalls').
			where('paymentIntentId', '==', paymentIntentId)
		const currentVideoCalls = await transaction.get(currentVideoCallQuery)
		if (currentVideoCalls.docs.length === 0) {
			// No video calls been created already for that payment intent, so we can start the call securely.
			const newVideoCallRef = firebaseAdmin.firestore().collection('videoCalls').doc()
			await transaction.set(newVideoCallRef, {
				paymentIntentId, addresseeUid, clientUid, callLength: parseInt(callLength), status: 'started'
			})
			return newVideoCallRef.id
		} else {
			// There's already a video call that been created for that payment intent, so we return false.
			return false
		}
	})
}
