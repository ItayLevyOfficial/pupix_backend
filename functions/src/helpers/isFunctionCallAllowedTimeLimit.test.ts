import {
	initialFirebaseAdminIfNeeded,
	isFunctionCallAllowedTimeLimit,
	documentRef
} from './helpers'
import {clearFirestoreData} from '../../tests/testingHelpers'

describe('The isFunctionCallAllowedTimeLimit function', () => {
	beforeAll(initialFirebaseAdminIfNeeded)
	beforeEach(clearFirestoreData)
	afterAll(clearFirestoreData)
	
	it('should return true and save the function call time if there are no previous function calls', async () => {
		const beforeFunctionCallTime = Date.now()
		const response = await isFunctionCallAllowedTimeLimit('alice', 'testingCollection')
		const afterFunctionCallTime = Date.now()
		const afterDoc = await documentRef('alice', 'testingCollection').get()
		const {time: lastTimeCreated} = afterDoc.data()
		
		expect(lastTimeCreated).toBeGreaterThanOrEqual(beforeFunctionCallTime)
		expect(lastTimeCreated).toBeLessThanOrEqual(afterFunctionCallTime)
		expect(response).toBe(true)
	})

	it('should return false and not update the creation time if a dashboard link created in the ' +
		'last five seconds', async () => {
		const previousLastTimeCreated = Date.now() - 2_000
		await documentRef('alice', 'testingCollection').set({time: previousLastTimeCreated})
		const response = await isFunctionCallAllowedTimeLimit('alice', 'testingCollection')
		const afterDoc = await documentRef('alice', 'testingCollection').get()
		const {time: afterLastTimeCreated} = afterDoc.data()

		expect(response).toBe(false)
		expect(afterLastTimeCreated).toBe(previousLastTimeCreated)
	})

	it('should return true and update the creation time if the previous dashboard url created more then ' +
		'five seconds ago', async () => {
		const previousLastTimeCreated = Date.now() - 6_000
		await documentRef('alice', 'testingCollection').set({time: previousLastTimeCreated})
		const beforeFunctionCallTime = Date.now()
		const response = await isFunctionCallAllowedTimeLimit('alice', 'testingCollection')
		const afterFunctionCallTime = Date.now()
		const afterDoc = await documentRef('alice', 'testingCollection').get()
		const {time: afterTime} = afterDoc.data()

		expect(response).toBe(true)
		expect(afterTime).toBeGreaterThanOrEqual(beforeFunctionCallTime)
		expect(afterTime).toBeLessThanOrEqual(afterFunctionCallTime)
	})
})