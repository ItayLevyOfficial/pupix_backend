import {documentRef, initialFirebaseAdminIfNeeded} from '../helpers/helpers'
import {clearFirestoreData} from '../../tests/testingHelpers'
import * as logicHelpers from './logicHelpers'
import {userCreationListenerLogic} from './userCreationListenerLogic'

jest.mock('./logicHelpers', () => ({
	...jest.requireActual('./logicHelpers')
}))

describe('Integration tests for the user creation listener logic function', () => {
	beforeAll(initialFirebaseAdminIfNeeded)
	beforeEach(clearFirestoreData)
	afterAll(clearFirestoreData)
	
	it('should call the correct functions with the correct parameters, and save the correct data', async () => {
		// @ts-ignore
		logicHelpers.getTwitterUserData =
			jest.fn(() => Promise.resolve({screen_name: 'aliceScreenName', profile_banner_url: 'aliceBannerUrl'}))
		// @ts-ignore
		logicHelpers.uploadPhoto = jest.fn((_, photoUrl) => Promise.resolve(`${photoUrl}_firebase`))
		await userCreationListenerLogic({
			uid: 'aliceUid', displayName: 'alice', providerData: [{
				photoUrl: 'alicePhotoUrl',
				uid: 'aliceTwitterUid'
			}]
		})
		
		const afterDoc = await documentRef('aliceUid','users').get()
		const {coverPhotoUrl, photoURL, displayName, twitterUsername} = afterDoc.data()
		
		expect(coverPhotoUrl).toBe('aliceBannerUrl_firebase')
		expect(photoURL).toBe('alicePhotoUrl_firebase')
		expect(displayName).toBe('alice')
		expect(twitterUsername).toBe('aliceScreenName')
	})
})