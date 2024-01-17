import {documentRef, initialFirebaseAdminIfNeeded} from '../../src/helpers/helpers'
import {aliceAuth, clearFirestoreData, getTestingApp} from '../testingHelpers'
import * as firebase from '@firebase/testing'

describe('Pupik security rules for the registeredBy', () => {
	beforeAll(initialFirebaseAdminIfNeeded)
	beforeEach(clearFirestoreData)
	afterAll(clearFirestoreData)
	
	it('should allow creation when the private info doc does not exist & the user authorized with ' +
		'the doc id', async () => {
		const testDb = getTestingApp(aliceAuth)
		const testDoc = testDb.firestore().collection('registeredBy').doc('alice')
		await firebase.assertSucceeds(testDoc.set({registeredBy: 'spoilelodie'}))
	})
	
	it('should not allow document creation when the user private info document exist', async () => {
		await documentRef('alice', 'usersPrivateInfo').set({})
		const testDb = getTestingApp(aliceAuth)
		const testDoc = testDb.firestore().collection('registeredBy').doc('alice')
		await firebase.assertFails(testDoc.set({registeredBy: 'spoilelodie'}))
	})
	
	it('should not allow document creation of another user', async () => {
		const testDb = getTestingApp(aliceAuth)
		const testDoc = testDb.firestore().collection('registeredBy').doc('bob')
		await firebase.assertFails(testDoc.set({registeredBy: 'spoilelodie'}))
	})
})