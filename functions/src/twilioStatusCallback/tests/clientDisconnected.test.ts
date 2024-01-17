import {initialFirebaseAdminIfNeeded, videoCallDocRef} from '../../helpers/helpers'
import {clearFirestoreData} from '../../../tests/testingHelpers'
import {twilioStatusCallbackLogic} from '../twilioStatusCallbackLogic'
import * as stripeConstants from '../../stripeConstants'

jest.mock('../../stripeConstants', () => ({
	...jest.requireActual('../../stripeConstants')
}))

describe('The twilio status callback when the client get disconnected from the room', () => {
		beforeAll(initialFirebaseAdminIfNeeded)
		beforeEach(clearFirestoreData)
		afterAll(clearFirestoreData)
		
		it('should change the call status to client-left and give the addressee the money if ' +
			'the client disconnected before 120 seconds passed',
			async () => {
				const clientConnectionTime = Date.now()
				await videoCallDocRef('testingRoomId').set({
					status: 'pending',
					clientConnectionTime,
					clientUid: 'bob',
					addresseeUid: 'alice',
					paymentIntentId: 'testingPaymentIntentId'
				})
				
				const stripeCaptureFunction = jest.fn()
				stripeConstants.stripeClient.paymentIntents.capture = stripeCaptureFunction
				const realClientDisconnectionTime = clientConnectionTime + 119_000
				await twilioStatusCallbackLogic({
					videoRoomId: 'testingRoomId', eventName: 'participant-disconnected',
					eventTime: realClientDisconnectionTime, eventIdentity: 'bob'
				})
				const afterDoc = await videoCallDocRef('testingRoomId').get()
				const {status, clientDisconnectionTime} = afterDoc.data()
				
				expect(status).toBe('client-left')
				expect(clientDisconnectionTime).toBe(realClientDisconnectionTime)
				expect(stripeCaptureFunction).toBeCalledWith('testingPaymentIntentId')
			}
		)
		
		it('should change the call status to missed if ' +
			'the client disconnected after 120 seconds passed and the addressee not connected yet', async () => {
			const clientConnectionTime = Date.now()
			await videoCallDocRef('testingRoomId').set({
				status: 'pending',
				clientConnectionTime,
				clientUid: 'bob',
				addresseeUid: 'alice',
				paymentIntentId: 'paymentIntentId'
			})
			
			const realClientDisconnectionTime = clientConnectionTime + 121_000
			await twilioStatusCallbackLogic({
				videoRoomId: 'testingRoomId', eventName: 'participant-disconnected',
				eventTime: realClientDisconnectionTime, eventIdentity: 'bob'
			})
			const afterDoc = await videoCallDocRef('testingRoomId').get()
			const {status, clientDisconnectionTime} = afterDoc.data()
			
			expect(clientDisconnectionTime).toBe(realClientDisconnectionTime)
			expect(status).toBe('missed')
		})
		
		it(
			'should change the call status to client-left and give the addressee the money if ' +
			'the client disconnected after the addressee connected to the room and the call status changed to in-progress',
			async () => {
				const clientConnectionTime = Date.now()
				const stripeCaptureFunction = jest.fn()
				stripeConstants.stripeClient.paymentIntents.capture = stripeCaptureFunction
				await videoCallDocRef('testingRoomId').set({
					status: 'in-progress',
					clientConnectionTime,
					addresseeConnectionTime: clientConnectionTime + 30_000,
					clientUid: 'bob',
					addresseeUid: 'alice',
					paymentIntentId: 'paymentIntentId'
				})
				const realClientDisconnectionTime = clientConnectionTime + 120_000
				await twilioStatusCallbackLogic({
					videoRoomId: 'testingRoomId', eventName: 'participant-disconnected',
					eventTime: realClientDisconnectionTime, eventIdentity: 'bob'
				})
				const afterDoc = await videoCallDocRef('testingRoomId').get()
				const {status, clientDisconnectionTime} = afterDoc.data()
				
				expect(realClientDisconnectionTime).toBe(clientDisconnectionTime)
				expect(stripeCaptureFunction).toBeCalledWith('paymentIntentId')
				expect(status).toBe('client-left')
			}
		)
		
		it('should save the client disconnection time if the client disconnects after the' +
			' room status changed to missed', async () => {
				const clientConnectionTime = Date.now()
				await videoCallDocRef('testingRoomId').set({
					clientConnectionTime,
					addresseeConnectionTime: clientConnectionTime + 61_000,
					clientUid: 'bob',
					addresseeUid: 'alice',
					paymentIntentId: 'paymentIntentId',
					status: 'missed'
				})
				const realClientDisconnectionTime = clientConnectionTime + 121_000
				await twilioStatusCallbackLogic({
					videoRoomId: 'testingRoomId', eventName: 'participant-disconnected',
					eventTime: realClientDisconnectionTime, eventIdentity: 'bob'
				})
				const afterDoc = await videoCallDocRef('testingRoomId').get()
				const {status, clientDisconnectionTime} = afterDoc.data()
				
				expect(clientDisconnectionTime).toBe(realClientDisconnectionTime)
				expect(status).toBe('missed')
			}
		)

		it('should only save the client disconnection time if the client disconnects after the' +
			' room status changed to denied',
			async () => {
				const clientConnectionTime = Date.now()
				await videoCallDocRef('roomId').set({
					clientConnectionTime,
					clientUid: 'bob',
					addresseeUid: 'alice',
					paymentIntentId: 'paymentIntentId',
					status: 'denied'
				})
				await twilioStatusCallbackLogic({
					videoRoomId: 'roomId', eventName: 'participant-disconnected',
					eventTime: clientConnectionTime + 121_000, eventIdentity: 'bob'
				})
				const afterDoc = await videoCallDocRef('roomId').get()
				const {status} = afterDoc.data()

				expect(status).toBe('denied')
			}
		)

		it(
			'should do nothing if the client disconnects after the room status changed to addressee-left',
			async () => {
				const clientConnectionTime = Date.now()
				await videoCallDocRef('roomId').set({
					clientConnectionTime,
					clientUid: 'bob',
					addresseeUid: 'alice',
					paymentIntentId: 'paymentIntentId',
					status: 'addressee-left',
					addresseeConnectionTime: clientConnectionTime + 30_000,
					addresseeDisconnectionTime: clientConnectionTime + 70_000
				})
				const realClientDisconnectionTime = clientConnectionTime + 119_000
				await twilioStatusCallbackLogic({
					videoRoomId: 'roomId', eventName: 'participant-disconnected',
					eventTime: clientConnectionTime + 119_000, eventIdentity: 'bob'
				})
				const afterDoc = await videoCallDocRef('roomId').get()
				const {status, clientDisconnectionTime} = afterDoc.data()
				
				expect(status).toBe('addressee-left')
				expect(clientDisconnectionTime).toBe(realClientDisconnectionTime)
			}
		)

		it(
			'should do nothing if the client disconnects after the room status changed to completed',
			async () => {
				const clientConnectionTime = Date.now()
				await videoCallDocRef('roomId').set({
					clientConnectionTime,
					clientUid: 'bob',
					addresseeUid: 'alice',
					status: 'completed',
				})
				
				await twilioStatusCallbackLogic({
					videoRoomId: 'roomId', eventName: 'participant-disconnected',
					eventTime: clientConnectionTime + 119_000, eventIdentity: 'bob'
				})
				const afterDoc = await videoCallDocRef('roomId').get()
				const {status} = afterDoc.data()

				expect(status).toBe('completed')
			}
		)
	}
)