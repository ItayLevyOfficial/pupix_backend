import {videoCallDocRef} from '../helpers/helpers'
import {createVideoCallDocIfNotExist} from './createVideoCallIfNotExist'
import * as Twilio from 'twilio'
import {
	twilioAccountSid,
	twilioApiKey,
	twilioApiSecret,
	twilioClient,
	twilioStatusCallbackUrl
} from '../twilioConstants'
import * as firebaseAdmin from 'firebase-admin'
import {calculateStripeFee} from '../stripeConstants'
import {environment} from '../constants'

const AccessToken = Twilio.jwt.AccessToken
const VideoGrant = AccessToken.VideoGrant

const saveTwilioToken = async ({twilioToken, uid, videoRoomId}) => {
	await firebaseAdmin.firestore().collection('twilioTokens').add({videoRoomId, twilioToken, uid})
}

export const createVideoRoom = async (videoRoomId) => {
	return await twilioClient.video.rooms.create(
		{
			type: environment === 'live' ? 'group' : 'go',
			statusCallback: twilioStatusCallbackUrl,
			uniqueName: videoRoomId,
			recordParticipantsOnConnect: true
		}
	)
}

export const generateTwilioToken = (videoRoomId: string, uid: string) => {
	const userTwilioToken = new AccessToken(
		twilioAccountSid, twilioApiKey, twilioApiSecret, {identity: uid})
	const userVideoGrant = new VideoGrant({room: videoRoomId})
	userTwilioToken.addGrant(userVideoGrant)
	return userTwilioToken.toJwt()
}

const createAndSaveVideoRoom = async (videoRoomId, callPrice: number) => {
	const videoRoom = await createVideoRoom(videoRoomId)
	await videoCallDocRef(videoRoomId).
		update({status: 'ready', roomCreationTime: videoRoom.dateCreated.getTime(), callPrice: callPrice})
}

/**
 * @param callPrice: The call price, in USD.
 */
export const stripeVideoPaymentIntentWebhookLogic = async (
	addresseeUid, clientUid, callLength: number, paymentIntentId, callPrice: number) => {
	const videoRoomId = await createVideoCallDocIfNotExist(
		{addresseeUid, clientUid, callLength, paymentIntentId})
	if (videoRoomId) {
		const addresseeToken = generateTwilioToken(videoRoomId, addresseeUid)
		const clientToken = generateTwilioToken(videoRoomId, clientUid)
		await Promise.all([
			saveTwilioToken({twilioToken: addresseeToken, uid: addresseeUid, videoRoomId}),
			saveTwilioToken({twilioToken: clientToken, uid: clientUid, videoRoomId}),
			createAndSaveVideoRoom(videoRoomId, callPrice)
		])
	}
}
