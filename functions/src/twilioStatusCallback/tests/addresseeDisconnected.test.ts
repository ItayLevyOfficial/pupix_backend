import {initialFirebaseAdminIfNeeded, videoCallDocRef} from '../../helpers/helpers'
import {clearFirestoreData} from '../../../tests/testingHelpers'
import {twilioStatusCallbackLogic} from '../twilioStatusCallbackLogic'
import * as stripeConstants from '../../stripeConstants'

jest.mock('../twilioCallbackHelpers', () => ({
	...jest.requireActual('../twilioCallbackHelpers')
}))
jest.mock('../../stripeConstants')


describe('The twilio status callback addressee disconnection events', () => {
	beforeAll(initialFirebaseAdminIfNeeded)
	beforeEach(clearFirestoreData)
	afterAll(clearFirestoreData)
	
	it('should change the call status to addressee-left if the addressee disconnected in the ' +
		'middle of the call',
		async () => {
			const clientConnectionTime = Date.now()
			const addresseeConnectionTime = clientConnectionTime + 30_000
			const stripeCaptureFunction = jest.fn()
			stripeConstants.stripeClient.paymentIntents.capture = stripeCaptureFunction
			await videoCallDocRef('testingId').set({
				status: 'in-progress',
				clientConnectionTime: clientConnectionTime,
				addresseeConnectionTime: addresseeConnectionTime,
				paymentIntentId: 'paymentIntentId',
				addresseeUid: 'alice',
				clientUid: 'bob'
			})
			const addresseeRealDisconnectionTime = addresseeConnectionTime + 120_000
			await twilioStatusCallbackLogic({
				videoRoomId: 'testingId',
				eventTime: addresseeRealDisconnectionTime,
				eventIdentity: 'alice',
				eventName: 'participant-disconnected'
			})
			const afterDoc = await videoCallDocRef('testingId').get()
			const {status, addresseeDisconnectionTime} = afterDoc.data()
			
			expect(status).toBe('addressee-left')
			expect(addresseeRealDisconnectionTime).toBe(addresseeDisconnectionTime)
			expect(stripeCaptureFunction).not.toBeCalled()
		}
	)
	
	it(
		'should change the call status to completed if the addressee disconnected after the ' +
		'call ended, and capture the stripe payment',
		async () => {
			const clientConnectionTime = Date.now()
			const addresseeConnectionTime = clientConnectionTime + 30_000
			await videoCallDocRef('testingId').set({
				status: 'in-progress',
				clientConnectionTime,
				addresseeConnectionTime,
				paymentIntentId: 'paymentIntentId',
				addresseeUid: 'alice',
				clientUid: 'bob',
				callLength: 3
			})
			const addresseeRealDisconnectionTime = addresseeConnectionTime + 3 * 60_000
			const stripeCaptureFunction = jest.fn()
			stripeConstants.stripeClient.paymentIntents.capture = stripeCaptureFunction
			await twilioStatusCallbackLogic({
				videoRoomId: 'testingId',
				eventTime: addresseeRealDisconnectionTime,
				eventIdentity: 'alice',
				eventName: 'participant-disconnected'
			})
			const afterDoc = await videoCallDocRef('testingId').get()
			const {status, addresseeDisconnectionTime} = afterDoc.data()
			
			expect(status).toBe('completed')
			expect(addresseeDisconnectionTime).toBe(addresseeRealDisconnectionTime)
			expect(stripeCaptureFunction).toBeCalledWith('paymentIntentId')
		}
	)
	
	it('should save the addressee disconnection time if the addressee disconnected after the call ' +
		'completed', async () => {
		const clientConnectionTime = Date.now()
		const addresseeConnectionTime = clientConnectionTime + 30_000
		await videoCallDocRef('testingId').set({
			status: 'completed',
			clientConnectionTime,
			addresseeConnectionTime,
			paymentIntentId: 'paymentIntentId',
			addresseeUid: 'alice',
			clientUid: 'bob',
			callLength: 3
		})
		const addresseeRealDisconnectionTime = addresseeConnectionTime + 3 * 60_000
		const stripeCaptureFunction = jest.fn()
		stripeConstants.stripeClient.paymentIntents.capture = stripeCaptureFunction
		await twilioStatusCallbackLogic({
			videoRoomId: 'testingId',
			eventTime: addresseeRealDisconnectionTime,
			eventIdentity: 'alice',
			eventName: 'participant-disconnected'
		})
		const afterDoc = await videoCallDocRef('testingId').get()
		const {status, addresseeDisconnectionTime} = afterDoc.data()
		
		expect(status).toBe('completed')
		expect(addresseeDisconnectionTime).toBe(addresseeRealDisconnectionTime)
		expect(stripeCaptureFunction).not.toBeCalled()
	})
	
	it('should save the addressee disconnection time if the addressee disconnected after the ' +
		'client left', async () => {
		const clientConnectionTime = Date.now()
		const addresseeConnectionTime = clientConnectionTime + 30_000
		await videoCallDocRef('testingId').set({
			status: 'client-left',
			clientConnectionTime,
			addresseeConnectionTime,
			paymentIntentId: 'paymentIntentId',
			addresseeUid: 'alice',
			clientUid: 'bob',
			callLength: 3
		})
		const stripeCaptureFunction = jest.fn()
		stripeConstants.stripeClient.paymentIntents.capture = stripeCaptureFunction
		const addresseeRealDisconnectionTime = addresseeConnectionTime + 3 * 60_000
		await twilioStatusCallbackLogic({
			videoRoomId: 'testingId',
			eventTime: addresseeRealDisconnectionTime,
			eventIdentity: 'alice',
			eventName: 'participant-disconnected'
		})
		const afterDoc = await videoCallDocRef('testingId').get()
		const {status, addresseeDisconnectionTime} = afterDoc.data()
		
		expect(status).toBe('client-left')
		expect(addresseeDisconnectionTime).toBe(addresseeRealDisconnectionTime)
		expect(stripeCaptureFunction).not.toBeCalled()
	})
	
	it('should do nothing if the addressee disconnection time been saved already', async () => {
		const clientConnectionTime = Date.now()
		const addresseeConnectionTime = clientConnectionTime + 30_000
		const addresseeRealDisconnectionTime = addresseeConnectionTime + 3 * 60_000
		await videoCallDocRef('testingId').set({
			status: 'client-left',
			clientConnectionTime,
			addresseeConnectionTime,
			paymentIntentId: 'paymentIntentId',
			addresseeUid: 'alice',
			clientUid: 'bob',
			callLength: 3,
			addresseeDisconnectionTime: addresseeRealDisconnectionTime
		})
		const stripeCaptureFunction = jest.fn()
		stripeConstants.stripeClient.paymentIntents.capture = stripeCaptureFunction
		await twilioStatusCallbackLogic({
			videoRoomId: 'testingId',
			eventTime: addresseeRealDisconnectionTime + 30_000,
			eventIdentity: 'alice',
			eventName: 'participant-disconnected'
		})
		const afterDoc = await videoCallDocRef('testingId').get()
		const {status, addresseeDisconnectionTime} = afterDoc.data()
		
		expect(status).toBe('client-left')
		expect(addresseeDisconnectionTime).toBe(addresseeRealDisconnectionTime)
		expect(stripeCaptureFunction).not.toBeCalled()
	})
})