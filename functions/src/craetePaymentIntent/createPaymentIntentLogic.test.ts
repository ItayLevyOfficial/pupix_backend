import {initialFirebaseAdminIfNeeded, userDocRef, userPIDocRef} from '../helpers/helpers'
import {clearFirestoreData} from '../../tests/testingHelpers'
import {createPaymentIntentLogic} from './createPaymentIntentLogic'
import * as stripeConstants from '../stripeConstants'

jest.mock('../stripeConstants', () => ({
	...jest.requireActual('../stripeConstants')
}))

describe('The create payment intent logic function', () => {
	beforeAll(initialFirebaseAdminIfNeeded)
	beforeEach(clearFirestoreData)
	afterAll(clearFirestoreData)
	
	it('should create a new stripe customer if it not exist yet, and create the payment intent with it', async () => {
		await userDocRef('alice').set({minuteWage: 10})
		await userPIDocRef('alice').set({stripeAccountId: 'aliceStripeId', stripeAccountStatus: 'enabled'})
		const createPaymentIntentFunction = jest.fn(() => 'testingPaymentIntent')
		const createStripeCustomerFunction = jest.fn(() => ({id: 'stripeCustomerId'}))
		
		// @ts-ignore
		stripeConstants.stripeClient.paymentIntents.create = createPaymentIntentFunction
		// @ts-ignore
		stripeConstants.stripeClient.customers.create = createStripeCustomerFunction
		const newPaymentIntent = await createPaymentIntentLogic('alice', 'bob', 8)
		
		expect(newPaymentIntent).toBe('testingPaymentIntent')
		expect(createPaymentIntentFunction).toBeCalledWith({
			amount: 8_270,
			currency: 'usd',
			payment_method_types: ['card'],
			capture_method: 'manual',
			metadata: {
				addresseeUid: 'alice', clientUid: 'bob', callLength: 8, type: 'video', callPrice: 80,
			},
			transfer_data: {
				destination: 'aliceStripeId',
				amount: 7200
			},
			payment_method_options: {
				card: {
					request_three_d_secure: 'any',
				},
			},
			customer: 'stripeCustomerId'
		})
		expect(createStripeCustomerFunction).toBeCalled()
	})
	
	it('should not create payment intent when the stripe account status is disabled', async () => {
		await userDocRef('alice').set({minuteWage: 10})
		await userPIDocRef('alice').set({stripeAccountId: 'aliceStripeId', stripeAccountStatus: 'disabled'})
		const newPaymentIntent = await createPaymentIntentLogic('alice', 'bob', 8)
		expect(newPaymentIntent).toBe(undefined)
	})
})