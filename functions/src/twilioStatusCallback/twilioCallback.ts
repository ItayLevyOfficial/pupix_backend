import * as functions from 'firebase-functions'

export const twilioStatusCallback = functions.https.onRequest(async (request, response) => {
	const {initialFirebaseAdminIfNeeded} = await import('../helpers/helpers')
	initialFirebaseAdminIfNeeded()
	const {validateTwilioRequest} = await import('./twilioCallbackHelpers')
	if (validateTwilioRequest(request)) {
		try {
			const {
				StatusCallbackEvent: eventName,
				RoomName: roomId,
				Timestamp,
				ParticipantIdentity: eventIdentity
			} = request.body
			const {twilioStatusCallbackLogic} = await import('./twilioStatusCallbackLogic')
			await twilioStatusCallbackLogic(
				{videoRoomId: roomId, eventName, eventTime: (new Date(Timestamp)).getTime(), eventIdentity})
			response.status(200).send()
		} catch (error) {
			functions.logger.error(error.message)
			response.status(200).send()
		}
	} else {
		functions.logger.error(`Received not signed twilio webhook request for room ${request?.body?.RoomName}`)
		response.status(403).send()
	}
})
