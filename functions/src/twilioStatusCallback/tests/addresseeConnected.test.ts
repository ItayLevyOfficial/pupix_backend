import {videoCallDocRef, initialFirebaseAdminIfNeeded} from '../../helpers/helpers'
import {clearFirestoreData} from '../../../tests/testingHelpers'
import {twilioStatusCallbackLogic} from '../twilioStatusCallbackLogic'

describe('The twilio status callback addressee connection events', () => {
	beforeAll(initialFirebaseAdminIfNeeded)
	beforeEach(clearFirestoreData)
	afterAll(clearFirestoreData)
	
	it('should change the call status to "in-progress" and save ' +
		'the addressee connection time when the addressee connected to the room in time', async () => {
		const clientRealConnectionTime = Date.now()
		await videoCallDocRef('testingId').set({
			status: 'pending',
			clientUid: 'bob',
			addresseeUid: 'alice',
			clientConnectionTime: clientRealConnectionTime
		})
		const addresseeRealConnectionTime = Date.now()
		await twilioStatusCallbackLogic({
			videoRoomId: 'testingId',
			eventTime: addresseeRealConnectionTime,
			eventIdentity: 'alice',
			eventName: 'participant-connected'
		})
		const afterDoc = await videoCallDocRef('testingId').get()
		const {status, addresseeConnectionTime} = afterDoc.data()
		
		expect(status).toBe('in-progress')
		expect(addresseeConnectionTime).toBe(addresseeRealConnectionTime)
	})
	
	it('should change the call status to missed if the addressee connected too late', async () => {
			const clientRealConnectionTime = Date.now()
			await videoCallDocRef('testingId').set({
				status: 'pending',
				clientUid: 'bob',
				addresseeUid: 'alice',
				clientConnectionTime: clientRealConnectionTime,
				paymentIntentId: 'testingPaymentIntentId'
			})
			const addresseeRealConnectionTime = Date.now() + 120_000
			await twilioStatusCallbackLogic({
				videoRoomId: 'testingId',
				eventTime: addresseeRealConnectionTime,
				eventIdentity: 'alice',
				eventName: 'participant-connected'
				
			})
			const afterDoc = await videoCallDocRef('testingId').get()
			const {status, addresseeConnectionTime} = afterDoc.data()
			
			expect(status).toBe('missed')
			expect(addresseeConnectionTime).toBe(addresseeRealConnectionTime)
		}
	)
	
	it('should not change the room status if the addressee connected after the client disconnected',
		async () => {
			const clientRealConnectionTime = Date.now()
			await videoCallDocRef('testingId').set({
				status: 'client-left',
				clientUid: 'bob',
				addresseeUid: 'alice',
				clientConnectionTime: clientRealConnectionTime,
				clientDisconnectionTime: clientRealConnectionTime + 30_000
			})
			const addresseeRealConnectionTime = Date.now()
			await twilioStatusCallbackLogic({
				videoRoomId: 'testingId',
				eventTime: addresseeRealConnectionTime,
				eventIdentity: 'alice',
				eventName: 'participant-connected'
			})
			const afterDoc = await videoCallDocRef('testingId').get()
			const {status, addresseeConnectionTime} = afterDoc.data()
			
			expect(status).toBe('client-left')
			expect(addresseeConnectionTime).toBe(addresseeRealConnectionTime)
		}
	)
	
	it('should not change the addressee connection time' +
		' and the room status if the addressee connection been set already', async () => {
		const clientRealConnectionTime = Date.now()
		const addresseeRealConnectionTime = Date.now()
		await videoCallDocRef('testingId').set({
			status: 'in-progress',
			clientUid: 'bob',
			addresseeUid: 'alice',
			clientConnectionTime: clientRealConnectionTime,
			clientDisconnectionTime: clientRealConnectionTime + 30_000,
			addresseeConnectionTime: addresseeRealConnectionTime
		})
		await twilioStatusCallbackLogic({
			videoRoomId: 'testingId',
			eventTime: addresseeRealConnectionTime + 200_000,
			eventIdentity: 'alice',
			eventName: 'participant-connected'
		})
		const afterDoc = await videoCallDocRef('testingId').get()
		const {status, addresseeConnectionTime} = afterDoc.data()
		
		expect(status).toBe('in-progress')
		expect(addresseeConnectionTime).toBe(addresseeRealConnectionTime)
	})
})