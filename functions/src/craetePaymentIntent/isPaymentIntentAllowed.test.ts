import {paymentIntentsCountDocRef, initialFirebaseAdminIfNeeded} from '../helpers/helpers'
import {clearFirestoreData} from '../../tests/testingHelpers'
import {isPaymentIntentAllowed} from './createPaymentIntentLogic'
import * as chai from 'chai'

const assert = chai.assert

describe('The isPaymentIntentAllowed function', () => {
	beforeAll(initialFirebaseAdminIfNeeded)
	beforeEach(clearFirestoreData)
	afterAll(clearFirestoreData)
	
	it(
		'should return true when no payment intents been created before',
		async () => {
			const result = await isPaymentIntentAllowed('bob', 'alice', 8, 'enabled')
			assert.ok(result)
		}
	)
	
	it(
		'should save the payment intent count to firestore when no payment intents created before',
		async () => {
			const result = await isPaymentIntentAllowed('bob', 'alice', 8, 'need-review')
			const paymentIntentCountDoc = await paymentIntentsCountDocRef('bob').get()
			const {date, count} = paymentIntentCountDoc.data()
			assert.ok(result)
			assert.equal(count, 1)
			assert.ok(Date.now() - 1000 < date)
		}
	)
	
	it('should increase the count by 1 on the second call', async () => {
		const previousDate = Date.now()
		const previousCount = 1
		await paymentIntentsCountDocRef('bob').set({date: previousDate, count: previousCount})
		const result = await isPaymentIntentAllowed('bob', 'alice', 8, 'enabled')
		const paymentIntentCountDoc = await paymentIntentsCountDocRef('bob').get()
		const {date, count} = paymentIntentCountDoc.data()
		assert.ok(result)
		assert.equal(count, previousCount + 1)
		assert.equal(date, previousDate)
	})
	
	it(
		'should return false if more then 1000 payment intents created',
		async () => {
			const previousDate = Date.now()
			const previousCount = 1001
			await paymentIntentsCountDocRef('bob').set({date: previousDate, count: previousCount})
			const result = await isPaymentIntentAllowed('bob', 'alice', 8, 'enabled')
			const paymentIntentCountDoc = await paymentIntentsCountDocRef('bob').get()
			const {date, count} = paymentIntentCountDoc.data()
			assert.isFalse(result)
			assert.equal(count, previousCount)
			assert.equal(date, previousDate)
		}
	)
	
	it(
		'should return true and update the date and count if the last payment intent been created ' +
		'more then one day ago',
		async () => {
			const previousDate = Date.now() - 24 * 60 * 63 * 1000
			const previousCount = 5
			await paymentIntentsCountDocRef('bob').set({date: previousDate, count: previousCount})
			const result = await isPaymentIntentAllowed('bob', 'alice', 8, 'enabled')
			const paymentIntentCountDoc = await paymentIntentsCountDocRef('bob').get()
			const {date, count} = paymentIntentCountDoc.data()
			assert.isTrue(result)
			assert.equal(count, 1)
			assert.isTrue(Date.now() - 1000 < date)
		}
	)
	
	it(
		'should return true and update the date and count if the last payment intent been created ' +
		'more then one day ago and more then 300 payment intents been created on this day',
		async () => {
			const previousDate = Date.now() - 24 * 60 * 63 * 1000
			const previousCount = 301
			await paymentIntentsCountDocRef('bob').set({date: previousDate, count: previousCount})
			const result = await isPaymentIntentAllowed('bob', 'alice', 8, 'need-review')
			const paymentIntentCountDoc = await paymentIntentsCountDocRef('bob').get()
			const {date, count} = paymentIntentCountDoc.data()
			assert.isTrue(result)
			assert.equal(count, 1)
			assert.isTrue(Date.now() - 1000 < date)
		}
	)
	
	it('should return false when the stripe account status is disabled', async () => {
		expect(await isPaymentIntentAllowed('bob', 'alice', 8, 'disabled')).
			toBe(false)
	})
	
	it('should return false when the stripe account status is onboarding', async () => {
		expect(await isPaymentIntentAllowed('bob', 'alice', 8, 'onboarding')).
			toBe(false)
	})
	
	it('should return false when the stripe account status is null', async () => {
		expect(await isPaymentIntentAllowed('bob', 'alice', 8, null)).
			toBe(false)
	})
})