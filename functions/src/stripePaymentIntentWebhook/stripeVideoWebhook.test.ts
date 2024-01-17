import {clearFirestoreData} from '../../tests/testingHelpers'
import {initialFirebaseAdminIfNeeded, videoCallDocRef} from '../helpers/helpers'
import {stripeVideoPaymentIntentWebhookLogic} from './stripeVideoPaymentIntentWebhookLogic'
import * as twilioConstants from '../twilioConstants'
import {twilioStatusCallbackUrl} from '../twilioConstants'
import * as firebaseAdmin from 'firebase-admin'

jest.mock('../twilioConstants', () => ({
	...jest.requireActual('../twilioConstants')
}))

describe('The stripe payment intent webhook logic function', () => {
	beforeAll(initialFirebaseAdminIfNeeded)
	beforeEach(clearFirestoreData)
	afterAll(clearFirestoreData)
	
	it('Should successfully create the video room and tokens on good payment intent', async () => {
		const roomCreationDate = new Date()
		const createVideoRoomFunction = jest.fn(() => ({dateCreated: roomCreationDate}))
		// @ts-ignore
		twilioConstants.twilioClient = {video: {rooms: {create: createVideoRoomFunction}}}
		await stripeVideoPaymentIntentWebhookLogic(
			'alice', 'bob', 8, 'testingPaymentIntentId', 80)
		const videoDoc = (await firebaseAdmin.firestore().collection('videoCalls').
			where('paymentIntentId', '==', 'testingPaymentIntentId').get()).docs[0]
		const videoRoomId = videoDoc.ref.id
		
		expect(videoDoc.data()).toMatchObject({
			callLength: 8,
			clientUid: 'bob',
			addresseeUid: 'alice',
			status: 'ready',
			roomCreationTime: roomCreationDate.getTime(),
			paymentIntentId: 'testingPaymentIntentId',
			callPrice: 80
		})
		expect(createVideoRoomFunction).toBeCalledWith({
				type: 'group',
				statusCallback: twilioStatusCallbackUrl,
				uniqueName: videoRoomId,
				recordParticipantsOnConnect: true
			}
		)
	})
	
	it('Should do nothing when there is already a video call document for this payment intent', async () => {
		const roomCreationDate = new Date()
		await videoCallDocRef('testingVideoRoomId').set({
			paymentIntentId: 'testingPaymentIntentId',
			callLength: 8,
			clientUid: 'bob',
			addresseeUid: 'alice',
			status: 'ready',
			roomCreationTime: roomCreationDate.getTime(),
			callPrice: 80,
			stripeCustomerId: 'testingCustomerId'
		})
		const secondRoomCreationDate = new Date()
		const createVideoRoomFunction = jest.fn(() => ({dateCreated: secondRoomCreationDate}))
		// @ts-ignore
		twilioConstants.twilioClient = {video: {rooms: {create: createVideoRoomFunction}}}
		await stripeVideoPaymentIntentWebhookLogic(
			'alice', 'bob', 8, 'testingPaymentIntentId', 80)
		const videoDoc = (await firebaseAdmin.firestore().collection('videoCalls').
			where('paymentIntentId', '==', 'testingPaymentIntentId').get()).docs[0]
		
		expect(videoDoc.data()).toMatchObject({
			callLength: 8,
			clientUid: 'bob',
			addresseeUid: 'alice',
			status: 'ready',
			roomCreationTime: roomCreationDate.getTime(),
			paymentIntentId: 'testingPaymentIntentId',
			callPrice: 80,
			stripeCustomerId: 'testingCustomerId'
		})
		expect(createVideoRoomFunction).not.toBeCalled()
	})
})
