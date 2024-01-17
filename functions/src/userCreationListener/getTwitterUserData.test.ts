import {initialFirebaseAdminIfNeeded} from '../helpers/helpers'
import {clearFirestoreData} from '../../tests/testingHelpers'
import {environment} from '../constants'
import * as twitterConstants from './twitterConstants'
import {getTwitterUserData} from './logicHelpers'

// Need it for the twitter fetch to actually run, so the mock function will be tested
// @ts-ignore
environment = 'staging'

jest.mock('./twitterConstants')

describe('The get twitter user data function', () => {
	beforeAll(initialFirebaseAdminIfNeeded)
	beforeEach(clearFirestoreData)
	afterAll(clearFirestoreData)
	
	it('should fetch the user data with the correct parameters', async () => {
		const getTwitterFunction = jest.fn(() => Promise.resolve('testingData'))
		// @ts-ignore
		twitterConstants.twitterClient.get = getTwitterFunction
		const userData = await getTwitterUserData({providerData: [{uid: 'alice'}]})
		
		expect(getTwitterFunction).toBeCalledWith('users/show', {user_id: 'alice'})
		expect(userData).toBe('testingData')
	})
})