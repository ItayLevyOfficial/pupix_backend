
import * as firebase from '@firebase/testing'
import {aliceAuth, clearFirestoreData, getAdminApp, getTestingApp} from '../testingHelpers'
import {initialFirebaseAdminIfNeeded, userPIDocRef} from '../../src/helpers/helpers'

describe('user private information collection security rules', () => {
	beforeAll(initialFirebaseAdminIfNeeded)
	beforeEach(clearFirestoreData)
	afterAll(clearFirestoreData)
	
	it('successfully updates a user private info doc', async () => {
		const adminDb = getAdminApp()
		await adminDb.firestore().collection('usersPrivateInfo').doc('alice').set({
			phoneNumber: '972544677134',
			stripeAccountId: 'alice',
			stripeAccountStatus: 'enabled'
		})
		const testDb = getTestingApp(aliceAuth)
		const testDoc = testDb.firestore().collection('usersPrivateInfo').doc('alice')
		await firebase.assertSucceeds(testDoc.update(
			{phoneNumber: '972544677135'}))
	})
	
	it('successfully read a user private info doc', async () => {
		const adminDb = getAdminApp()
		await adminDb.firestore().collection('usersPrivateInfo').doc('alice').set({
			phoneNumber: '972544677134',
			stripeAccountId: 'alice',
			stripeAccountStatus: 'enabled'
		})
		const testDb = getTestingApp(aliceAuth)
		const testDoc = testDb.firestore().collection('usersPrivateInfo').doc('alice')
		firebase.assertSucceeds(testDoc.get())
	})
	
	it('successfully create user private info document', async () => {
		const testDb = getTestingApp(aliceAuth)
		const testDoc = testDb.firestore().collection('usersPrivateInfo').doc('alice')
		await firebase.assertSucceeds(testDoc.set({phoneNumber: '972544677134'}))
	})
	
	it('Fails to delete user private info document', async () => {
		await userPIDocRef('alice').set({phoneNumber: 'ababab', registeredBy: ''})
		const testDb = getTestingApp(aliceAuth)
		const testDoc = testDb.firestore().collection('usersPrivateInfo').doc('alice')
		await firebase.assertFails(testDoc.delete())
		await firebase.assertFails(testDoc.set({}))
	})
	
	it('fails to create another user user private info document', async () => {
		const testDb = getTestingApp(aliceAuth)
		const testDoc = testDb.firestore().collection('usersPrivateInfo').doc('itay')
		await firebase.assertFails(testDoc.set(
			{phoneNumber: '972544677134'}))
		
	})
	
	it('fails to update another user private info document', async () => {
		const testDb = getTestingApp(aliceAuth)
		await userPIDocRef('itay').set({})
		const testDoc = testDb.firestore().collection('usersPrivateInfo').doc('itay')
		await firebase.assertFails(testDoc.update({phoneNumber: '972544677134'}))
	})
	
	it('fails to read an other user private info document', async () => {
		const adminDb = getAdminApp()
		await adminDb.firestore().collection('usersPrivateInfo').doc('itay').set({
			phoneNumber: '972544677134'
		})
		const testDb = getTestingApp(aliceAuth)
		const testDoc = testDb.firestore().collection('usersPrivateInfo').doc('itay')
		await firebase.assertFails(testDoc.get())
	})
	
	it('fails to update the user registered by field', async () => {
		const adminDb = getAdminApp()
		await adminDb.firestore().collection('usersPrivateInfo').doc('alice').set({
			phoneNumber: '972544677134',
			registeredBy: 'bob'
		})
		const testDb = getTestingApp(aliceAuth)
		const testDoc = testDb.firestore().collection('usersPrivateInfo').doc('alice')
		await firebase.assertFails(testDoc.update({registeredBy: 'aliceFriend'}))
	})
})