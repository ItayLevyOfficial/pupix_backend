import * as firebase from '@firebase/testing'
import {aliceAuth, clearFirestoreData, getAdminApp, getTestingApp} from '../testingHelpers'

describe('The twilio tokens collection security rules', () => {
	beforeEach(clearFirestoreData)
	afterAll(clearFirestoreData)
	
	it('successfully read a user twilio token document', async () => {
		const adminDb = getAdminApp()
		const newDocRef = await adminDb.firestore().collection('twilioTokens').
			add({uid: 'alice', videoRoomId: 'testing video room id', twilioToken: 'testing twilio token'})
		const testDb = getTestingApp(aliceAuth)
		const testDoc = testDb.firestore().collection('twilioTokens').doc(newDocRef.id)
		await firebase.assertSucceeds(testDoc.get())
	})
	
	it('fails to read another user twilio token document', async () => {
		const adminDb = getAdminApp()
		const newDocRef = await adminDb.firestore().collection('twilioTokens').
			add({uid: 'itay', videoRoomId: 'testing video room id', twilioToken: 'testing twilio token'})
		const testDb = getTestingApp(aliceAuth)
		const testDoc = testDb.firestore().collection('twilioTokens').doc(newDocRef.id)
		await firebase.assertFails(testDoc.get())
	})
	
	it('fails to create twilio token document', async () => {
		const testDb = getTestingApp(aliceAuth)
		const twilioTokensCollection = testDb.firestore().collection('twilioTokens')
		await firebase.assertFails(twilioTokensCollection.add({twilioToken: 'test', uid: 'alice', videoRoomId: 'aaa'}))
	})
	
	it('fails to update twilio token document', async () => {
		const adminDb = getAdminApp()
		const newDocRef = await adminDb.firestore().collection('twilioTokens').
			add({uid: 'alice', videoRoomId: 'testing video room id', twilioToken: 'testing twilio token'})
		const testDb = getTestingApp(aliceAuth)
		const testDoc = testDb.firestore().collection('twilioTokens').doc(newDocRef.id)
		await firebase.assertFails(testDoc.update({twilioToken: 'test', uid: 'alice', videoRoomId: 'aaa'}))
	})
})