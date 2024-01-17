import {initialFirebaseAdminIfNeeded, videoCallDocRef} from '../../helpers/helpers'
import {clearFirestoreData} from '../../../tests/testingHelpers'
import {twilioStatusCallbackLogic} from '../twilioStatusCallbackLogic'
import * as notifyAddresseeModule from '../notifyAddressee'

jest.mock('../notifyAddressee')

describe('The twilio status callback client connection events', () => {
	beforeAll(initialFirebaseAdminIfNeeded)
	beforeEach(clearFirestoreData)
	afterAll(clearFirestoreData)
	
	it(
		'should save set the client connection time, change the call status to ' +
		'pending and notify the addressee when the client first connects to the room',
		async () => {
			const notifyAddresseeFunction = jest.fn()
			// @ts-ignore
			notifyAddresseeModule.notifyAddressee = notifyAddresseeFunction
			await videoCallDocRef('testingId').set({
				status: 'ready',
				clientUid: 'bob',
				addresseeUid: 'alice',
				callLength: 3
			})
			const clientRealConnectionTime = Date.now()
			await twilioStatusCallbackLogic({
				videoRoomId: 'testingId', eventName: 'participant-connected',
				eventTime: clientRealConnectionTime, eventIdentity: 'bob'
			})
			const afterDoc = await videoCallDocRef('testingId').get()
			const {status, clientConnectionTime} = afterDoc.data()
			
			expect(status).toBe('pending')
			expect(clientConnectionTime).toBe(clientRealConnectionTime)
			expect(notifyAddresseeFunction).toBeCalledWith('alice', 3, 'testingId')
		}
	)
	
	it('should not change the client connection time if the function been called again after the' +
		' clientConnectionTime been saved already',
		async () => {
			const notifyAddresseeFunction = jest.fn()
			// @ts-ignore
			notifyAddresseeModule.notifyAddressee = notifyAddresseeFunction
			const clientRealConnectionTime = Date.now()
			await videoCallDocRef('testingId').set({
				status: 'pending',
				clientUid: 'bob',
				addresseeUid: 'alice',
				clientConnectionTime: clientRealConnectionTime
			})
			await twilioStatusCallbackLogic({
				videoRoomId: 'testingId', eventName: 'participant-connected',
				eventTime: clientRealConnectionTime + 50_000, eventIdentity: 'bob'
			})
			const afterDoc = await videoCallDocRef('testingId').get()
			const {status, clientConnectionTime} = afterDoc.data()
			
			expect(status).toBe('pending')
			expect(clientConnectionTime).toBe(clientRealConnectionTime)
			expect(notifyAddresseeFunction).not.toBeCalled()
		})
	
})