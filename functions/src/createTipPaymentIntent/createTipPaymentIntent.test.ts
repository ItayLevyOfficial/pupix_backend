import {documentRef, initialFirebaseAdminIfNeeded, userPIDocRef} from '../helpers/helpers'
import {clearFirestoreData} from '../../tests/testingHelpers'
import * as stripeConstants from '../stripeConstants'
import {createTipPaymentIntentLogic} from './createTipPaymentIntentLogic'

jest.mock('../stripeConstants', () => ({
	...jest.requireActual('../stripeConstants')
}))

describe('The create tip payment intent logic function', () => {
	beforeAll(initialFirebaseAdminIfNeeded)
	beforeEach(clearFirestoreData)
	afterAll(clearFirestoreData)
	
	it('Successfully creates a tip payment intent with the correct values', async () => {
		const createPaymentIntentFunction = jest.fn(() => 'testingPaymentIntent')
		const listPaymentMethodsFn = jest.fn(() => ({data: [{id: 'testingPMID'}]}))
		// @ts-ignore
		stripeConstants.stripeClient.paymentIntents.create = createPaymentIntentFunction
		// @ts-ignore
		stripeConstants.stripeClient.paymentMethods.list = listPaymentMethodsFn
		
		await userPIDocRef('alice').set({stripeAccountId: 'testingStripeId'})
		await documentRef('bob', 'clients').set({stripeCustomerId: 'testingCustomerId'})
		const paymentIntent = await createTipPaymentIntentLogic('alice', 'bob', 'testingRoomId', 10)
		
		expect(paymentIntent).toBe('testingPaymentIntent')
		expect(createPaymentIntentFunction).toBeCalledWith({
			amount: 1061,
			currency: 'usd',
			metadata: {videoRoomId: 'testingRoomId', type: 'tip', tipAmount: 10},
			transfer_data: {
				destination: 'testingStripeId',
				amount: 900
			},
			customer: 'testingCustomerId',
			payment_method: 'testingPMID',
			payment_method_options: {
				card: {
					request_three_d_secure: 'any',
				},
			}
		})
		expect(listPaymentMethodsFn).toBeCalledWith({customer: 'testingCustomerId', type: 'card'})
	})
})