import {clearFirestoreData} from '../../../tests/testingHelpers'
import {initialFirebaseAdminIfNeeded, userDocRef, userPIDocRef, videoCallDocRef} from '../../helpers/helpers'
import {generateSmsMessageBody, notifyAddressee} from '../notifyAddressee'
import * as twilioConstants from '../../twilioConstants'

jest.mock('../../twilioConstants', () => (
	{...jest.requireActual('../../twilioConstants')}
))

describe('The notify addressee helper function', () => {
	beforeAll(initialFirebaseAdminIfNeeded)
	beforeEach(clearFirestoreData)
	afterAll(clearFirestoreData)
	
	it('should call the twilio programmable messaging api with the correct arguments on incoming calls', async () => {
		await userPIDocRef('alice').set({phoneNumber: '972544677134'})
		await userDocRef('alice').set({isAvailable: true, minuteWage: 10})
		const createMessageFunction = jest.fn()
		twilioConstants.twilioClient.messages.create = createMessageFunction
		await notifyAddressee('alice', 8, 'testingId', true)
		expect(createMessageFunction).toBeCalledWith(
			{
				from: twilioConstants.twilioPhoneNumber,
				to: '+' + '972544677134',
				body: generateSmsMessageBody(8, 'testingId', 10 * 8)
			}
		)
		expect(createMessageFunction).toBeCalledTimes(1)
	})
	
	it('should not send any sms when the addressee is not available', async () => {
		await userPIDocRef('alice').set({phoneNumber: '972544677134'})
		await userDocRef('alice').set({isAvailable: false})
		const createMessageFunction = jest.fn()
		twilioConstants.twilioClient.messages.create = createMessageFunction
		await notifyAddressee('alice', 8, 'testingId', true)
		expect(createMessageFunction).not.toHaveBeenCalled()
	})
	
	it('should do nothing if the create message function throws an error from any reason', async () => {
		await userPIDocRef('alice').set({phoneNumber: '972544677134'})
		await userDocRef('alice').set({isAvailable: true})
		await videoCallDocRef('testingId').set({status: 'in-progress', addresseeUid: 'alice'})
		twilioConstants.twilioClient.messages.create = jest.fn(() => {
			throw new Error()
		})
		await notifyAddressee('alice', 8, 'testingId', true)
	})
})