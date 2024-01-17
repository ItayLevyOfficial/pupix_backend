import {initialFirebaseAdminIfNeeded} from '../helpers/helpers'
import {clearFirestoreData} from '../../tests/testingHelpers'
import {calculateStripeFee} from '../stripeConstants'

describe('The calculate stripe fee function', () => {
	beforeAll(initialFirebaseAdminIfNeeded)
	beforeEach(clearFirestoreData)
	afterAll(clearFirestoreData)
	
	it('should work great when the payment amount is $10', async () => {
		expect(calculateStripeFee(10)).toBe(0.61)
	})
	
	it('should work great when the payment amount is $20', async () => {
		expect(calculateStripeFee(20)).toBe(0.91)
	})
	
	it('should work great when the payment amount is $30', async () => {
		expect(calculateStripeFee(30)).toBe(1.21)
	})
	
	it('should work great when the payment amount is $1,000', async () => {
		expect(calculateStripeFee(1000)).toBe(30.18)
	})
})