import {userDocRef, userPIDocRef} from '../helpers/helpers'
import * as functions from 'firebase-functions'
import * as firebaseAdmin from 'firebase-admin'
import {twilioClient, twilioPhoneNumber} from '../twilioConstants'
import {environment, websiteUrl} from '../constants'

export const generateSmsMessageBody = (callLength, videoCallId, callPrice) => (
	`You have a new Pupix incoming call of ${callLength} minutes! To accept and earn ${callPrice}$: ${websiteUrl}/video-room/${videoCallId}`
)

export let notifyAddressee = async (
	addresseeUid: string, callLength: number, videoCallId: string, inTest = false) => {
	try {
		const addresseeUserDoc = await userDocRef(addresseeUid).get()
		const {isAvailable, minuteWage} = addresseeUserDoc.data()
		if (isAvailable) {
			const addresseePrivateInfoDoc = await userPIDocRef(addresseeUid).get()
			const {phoneNumber: addresseePhoneNumber} = addresseePrivateInfoDoc.data()
			if (environment === 'live' || inTest) {
				await twilioClient.messages.create(
					{
						from: twilioPhoneNumber,
						to: '+' + addresseePhoneNumber,
						body: generateSmsMessageBody(callLength, videoCallId, callLength * minuteWage)
					}
				)
			}
		}
	} catch (error) {
		functions.logger.error(error.message)
	}
}