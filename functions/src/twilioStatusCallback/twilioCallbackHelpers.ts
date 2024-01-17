import {twilioAuthToken, twilioClient, twilioStatusCallbackUrl} from '../twilioConstants'
import * as twilioSdk from 'twilio'

/**
 * Validates that the request been sent from twilio.
 *
 * @param request: The http request.
 * @return {boolean}: True if the request been sent from the twilio servers, false otherwise.
 */
export const validateTwilioRequest = (request) => {
	try {
		const callbackParameters = request.body
		const callbackUrl = twilioStatusCallbackUrl
		const requestTwilioSignature = request.headers['x-twilio-signature']
		return twilioSdk.validateRequest(twilioAuthToken,
			requestTwilioSignature, callbackUrl,
			callbackParameters)
	} catch (error) {
		return false
	}
}

/**
 * @return: True if the given participant connected right now to the given room, false otherwise.
 */
export const isTwilioParticipantConnected = async ({participantIdentity, videoRoomId}) => {
	try {
		const participant = await twilioClient.video.rooms(videoRoomId).participants.
			get(participantIdentity).fetch()
		return participant.status !== 'disconnected'
	} catch (error) {
		return false
	}
}


/**
 * Return true if the call completed before the given disconnection time, false otherwise.
 */
export const isCallCompleted = ({addresseeConnectionTime, disconnectionTime, callLength}) => {
	return (disconnectionTime - addresseeConnectionTime) / 1000 >= callLength * 60
}