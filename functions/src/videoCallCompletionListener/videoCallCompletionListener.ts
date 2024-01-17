import * as functions from 'firebase-functions'

export const videoCallCompletionListener = functions.firestore.document('videoCalls/{videoRoomId}').
	onUpdate(async (change, context) => {
		const previousCallStatus = change.before.data().status
		const newCallStatus = change.after.data().status
		const clientUid = change.after.data().clientUid
		const {videoCallCompletionListenerLogic} = await import('./videoCallCompletionListenerLogic')
		await videoCallCompletionListenerLogic(clientUid, previousCallStatus, newCallStatus)
	})