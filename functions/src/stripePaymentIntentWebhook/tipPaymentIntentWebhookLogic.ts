import {documentRef} from '../helpers/helpers'
import * as firebaseAdmin from 'firebase-admin'

export const tipPaymentIntentWebhookLogic = async (videoRoomId: string, tipAmount: number, tipId: string) => {
	await firebaseAdmin.firestore().runTransaction(async transaction => {
		const tipDocRef = firebaseAdmin.firestore().doc(`videoCalls/${videoRoomId}/tips/${tipId}`)
		const tipDoc = await tipDocRef.get()
		if (!tipDoc.exists) {
			const videoCallDocRef = documentRef(videoRoomId, 'videoCalls')
			const videoCallDoc = await transaction.get(videoCallDocRef)
			const currentTotalTips = videoCallDoc.data().totalTips ?? 0
			const tipRequest = videoCallDoc.data().tipRequest
			await transaction.set(tipDocRef, {amount: tipAmount, time: Date.now()})
			if (tipRequest === tipAmount) {
				await transaction.update(videoCallDocRef, {totalTips: currentTotalTips + tipAmount, tipRequest: 0})
			} else {
				await transaction.update(videoCallDocRef, {totalTips: currentTotalTips + tipAmount})
			}
		}
	})
}
