import * as firebaseAdmin from 'firebase-admin'
import {documentRef, initialFirebaseAdminIfNeeded} from '../helpers/helpers'

export const rateCallLogic = async (clientUid: string, callRating: number, callId: string) => {
	await initialFirebaseAdminIfNeeded()
	await firebaseAdmin.firestore().runTransaction(async transaction => {
		const currentCallDoc = await transaction.get(documentRef(callId, 'videoCalls'))
		if (currentCallDoc.exists && !currentCallDoc.data().clientRating && clientUid ===
			currentCallDoc.data().clientUid) {
			const creatorUserDoc = await transaction.get(documentRef(currentCallDoc.data().addresseeUid, 'users'))
			const {callsAmount: currentCallsAMount, averageRating: currentAverageRating} = creatorUserDoc.data()
			if (currentCallsAMount) {
				const newAverageRating = (currentAverageRating * currentCallsAMount + callRating) /
					(currentCallsAMount + 1)
				await transaction.update(creatorUserDoc.ref,
					{callsAmount: currentCallsAMount + 1, averageRating: newAverageRating})
			} else {
				await transaction.update(creatorUserDoc.ref,
					{callsAmount: 1, averageRating: callRating})
			}
			await transaction.update(currentCallDoc.ref, {clientRating: callRating})
		}
	})
}