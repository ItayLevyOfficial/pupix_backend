import {documentRef, initialFirebaseAdminIfNeeded, isFunctionCallAllowedCountLimit} from './helpers'
import {clearFirestoreData} from '../../tests/testingHelpers'

describe('The isFunctionCallAllowedCountLimit function', () => {
	beforeAll(initialFirebaseAdminIfNeeded)
	beforeEach(clearFirestoreData)
	afterAll(clearFirestoreData)
	
	it('should return true and save the function creation count if there was no function calls before', async () => {
		const isFunctionCallAllowed = await isFunctionCallAllowedCountLimit('testingUid', 'testingCollection', 100)
		const callCountDoc = await documentRef('testingUid', 'testingCollection').get()
		const {count, date} = callCountDoc.data()
		
		expect(count).toBe(1)
		expect(date).toBeLessThanOrEqual(Date.now())
		expect(date).toBeGreaterThanOrEqual(Date.now() - 2_000)
		expect(isFunctionCallAllowed).toBe(true)
	})
	
	it('should update the function call count and return true on another function call', async () => {
		const lastDate = Date.now() - 5_000
		await documentRef('testingUid', 'testingCollection').set({date: lastDate, count: 1})
		const isFunctionCallAllowed = await isFunctionCallAllowedCountLimit('testingUid', 'testingCollection', 100)
		const callCountDoc = await documentRef('testingUid', 'testingCollection').get()
		const {count, date} = callCountDoc.data()
		
		expect(count).toBe(2)
		expect(date).toBe(lastDate)
		expect(isFunctionCallAllowed).toBe(true)
	})
	
	it('should not update the function call count or date and return false if there was too many calls', async () => {
		const lastDate = Date.now() - 5_000
		await documentRef('testingUid', 'testingCollection').set({date: lastDate, count: 101})
		const isFunctionCallAllowed = await isFunctionCallAllowedCountLimit('testingUid', 'testingCollection', 100)
		const callCountDoc = await documentRef('testingUid', 'testingCollection').get()
		const {count, date} = callCountDoc.data()
		
		expect(count).toBe(101)
		expect(date).toBe(lastDate)
		expect(isFunctionCallAllowed).toBe(false)
	})
	
	it('should return true and update the date & count if the function called more than one day after the last call when ' +
		'there are already too many calls',
		async () => {
			const lastDate = Date.now() - 25 * 60 * 60 * 1000
			await documentRef('testingUid', 'testingCollection').set({date: lastDate, count: 101})
			const isFunctionCallAllowed = await isFunctionCallAllowedCountLimit('testingUid', 'testingCollection', 100)
			const callCountDoc = await documentRef('testingUid', 'testingCollection').get()
			const {count, date} = callCountDoc.data()
			
			expect(count).toBe(1)
			expect(date).toBeLessThanOrEqual(Date.now())
			expect(date).toBeGreaterThanOrEqual(Date.now() - 2_000)
			expect(isFunctionCallAllowed).toBe(true)
		})
	
	it('should return true and update the date & count if the function called more than one day after the last ' +
		'call and the current count is ok',
		async () => {
			const lastDate = Date.now() - 25 * 60 * 60 * 1000
			await documentRef('testingUid', 'testingCollection').set({date: lastDate, count: 3})
			const isFunctionCallAllowed = await isFunctionCallAllowedCountLimit('testingUid', 'testingCollection', 100)
			const callCountDoc = await documentRef('testingUid', 'testingCollection').get()
			const {count, date} = callCountDoc.data()
			
			expect(count).toBe(1)
			expect(date).toBeLessThanOrEqual(Date.now())
			expect(date).toBeGreaterThanOrEqual(Date.now() - 2_000)
			expect(isFunctionCallAllowed).toBe(true)
		})
})