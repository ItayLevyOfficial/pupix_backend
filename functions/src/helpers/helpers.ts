import * as firebaseAdmin from 'firebase-admin'

export const userPIDocRef = (uid) => firebaseAdmin.firestore().collection('usersPrivateInfo').
	doc(uid)

export const userDocRef = (uid) => firebaseAdmin.firestore().collection('users').doc(uid)

export const videoCallDocRef = (videoRoomId) => firebaseAdmin.firestore().collection('videoCalls').
	doc(videoRoomId)

export const paymentIntentsCountDocRef = (uid) => firebaseAdmin.firestore().
	collection('paymentIntentsCount').doc(uid)

export const stripeDashboardCreationTimeRef = uid => firebaseAdmin.firestore().
	collection('stripeDashboardCreationTimeRef').doc(uid)

export const documentRef = (documentId, collectionName) => firebaseAdmin.firestore().
	collection(collectionName).doc(documentId)

let firstRun = true

export const initialFirebaseAdminIfNeeded = () => {
	if (firstRun) {
		firebaseAdmin.initializeApp()
		firstRun = false
	}
}

/**
 * @param uid {string}: The firebase uid of the user who calling the function.
 * @param collectionName {string}: The name of the firestore collection where the last function call time will be saved.
 *
 * @return {boolean}: True if the function call is allowed because the function not called in the last five seconds, false otherwise.
 */
export const isFunctionCallAllowedTimeLimit = async (uid, collectionName) => {
	return await firebaseAdmin.firestore().runTransaction(async transaction => {
		const beforeDoc = await transaction.get(documentRef(uid, collectionName))
		if (beforeDoc?.exists) {
			const {time} = beforeDoc.data()
			if (Date.now() - time < 5_000) {
				return false
			} else {
				await transaction.set(documentRef(uid, collectionName), {time: Date.now()})
				return true
			}
		} else {
			await transaction.set(documentRef(uid, collectionName), {time: Date.now()})
			return true
		}
	})
}

/**
 * Return true if the function is allowed to call again in the time limit, false otherwise.
 *
 * @param uid: The user id of the function caller.
 * @param collectionName: The name of the collection to save the calls count and the last call date.
 * @param dailyCallsCountLimit: The maximum amount of calls the function can have per day.
 */
export const isFunctionCallAllowedCountLimit = async (uid, collectionName: string, dailyCallsCountLimit: number) => {
	return await firebaseAdmin.firestore().runTransaction(async transaction => {
		const functionsCallAmountDoc = await transaction.get(documentRef(uid, collectionName))
		if (functionsCallAmountDoc?.exists) {
			const {date, count} = functionsCallAmountDoc.data()
			if (Date.now() - date < 24 * 60 * 60 * 1000) {
				if (count > dailyCallsCountLimit) {
					return false
				} else {
					await transaction.update(functionsCallAmountDoc.ref, {count: count + 1})
					return true
				}
			} else {
				await transaction.update(functionsCallAmountDoc.ref, {count: 1, date: Date.now()})
				return true
			}
		} else {
			await transaction.set(functionsCallAmountDoc.ref, {count: 1, date: Date.now()})
			return true
		}
	})
}