import {initialFirebaseAdminIfNeeded, userDocRef} from '../helpers/helpers'
import {clearFirestoreData} from '../../tests/testingHelpers'
import {getAvailableUsername} from './logicHelpers'

describe('The get twitter username function', () => {
	beforeAll(initialFirebaseAdminIfNeeded)
	beforeEach(clearFirestoreData)
	afterAll(clearFirestoreData)
	
	it('should successfully return the current twitter username when it\'s available', async () => {
		const pupikTwitterUsername = await getAvailableUsername('alice', {uid: 'testingId'})
		
		expect(pupikTwitterUsername).toBe('alice')
	})
	
	it('should return the twitter username with "1" at the end when there already user with that username.',
		async () => {
			await userDocRef('testingId').set({twitterUsername: 'alice'})
			const pupikTwitterUsername = await getAvailableUsername('alice', {uid: 'testingId_2'})
			
			expect(pupikTwitterUsername).toBe('alice1')
		}
	)
	
	it('should successfully return the twitter username with "111" end extension when a user doc with the' +
		' username and the two next "1" already exists',
		async () => {
			await userDocRef('testingId').set({twitterUsername: 'alice'})
			await userDocRef('testingId_1').set({twitterUsername: 'alice1'})
			await userDocRef('testingId_2').set({twitterUsername: 'alice11'})
			const pupikTwitterUsername = await getAvailableUsername('alice', {uid: 'testingId_2'})
			
			expect(pupikTwitterUsername).toBe('alice111')
		}
	)
	
	it('should return the same twitter username if the user who already has that twitter username' +
		'is the same user, and the user creation listener called twice for some reason', async () => {
		await userDocRef('testingId').set({twitterUsername: 'alice'})
		const pupikTwitterUsername = await getAvailableUsername('alice', {uid: 'testingId'})
		
		expect(pupikTwitterUsername).toBe('alice')
	})
})

