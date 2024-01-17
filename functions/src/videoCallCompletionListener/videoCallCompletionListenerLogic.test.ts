import {documentRef, initialFirebaseAdminIfNeeded} from '../helpers/helpers'
import {clearFirestoreData} from '../../tests/testingHelpers'
import {videoCallCompletionListenerLogic} from './videoCallCompletionListenerLogic'
import * as stripeConstants from '../stripeConstants'

jest.mock('../stripeConstants', () => ({
	...jest.requireActual('../stripeConstants')
}))

describe('The stripe payment intent webhook logic function', () => {
	beforeAll(initialFirebaseAdminIfNeeded)
	beforeEach(clearFirestoreData)
	afterAll(clearFirestoreData)
	
	it('should remove the payment method if the call status changes to a completed call', async () => {
		await documentRef('bob', 'clients').set({stripeCustomerId: 'bobId'})
		
		const listPaymentMethodsFn = jest.fn(() => ({data: [{id: 'bobPMID'}]}))
		// @ts-ignore
		stripeConstants.stripeClient.paymentMethods.list = listPaymentMethodsFn
		const detachPaymentMethodFn = jest.fn()
		stripeConstants.stripeClient.paymentMethods.detach = detachPaymentMethodFn
		await videoCallCompletionListenerLogic('bob', 'pending', 'missed')
		
		expect(listPaymentMethodsFn).toBeCalledWith({"customer": "bobId", "type": "card"})
		expect(detachPaymentMethodFn).toBeCalledWith('bobPMID')
	})
	
	it('should do nothing if the video call end status has not changed to call end status', async () => {
		await documentRef('bob', 'clients').set({stripeCustomerId: 'bobId'})
		
		const listPaymentMethodsFn = jest.fn(() => ({data: [{id: 'bobPMID'}]}))
		// @ts-ignore
		stripeConstants.stripeClient.paymentMethods.list = listPaymentMethodsFn
		const detachPaymentMethodFn = jest.fn()
		stripeConstants.stripeClient.paymentMethods.detach = detachPaymentMethodFn
		await videoCallCompletionListenerLogic('bob', 'pending', 'pending')
		await videoCallCompletionListenerLogic('bob', 'pending', 'in-progress')
		await videoCallCompletionListenerLogic('bob', 'ready', 'pending')
		
		expect(listPaymentMethodsFn).not.toBeCalled()
		expect(detachPaymentMethodFn).not.toBeCalled()
	})
})