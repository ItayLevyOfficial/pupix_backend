import {aliceAuth, clearFirestoreData, getAdminApp, getTestingApp} from '../testingHelpers'
import * as firebase from '@firebase/testing'

describe('The tips collection security rules', () => {
	beforeEach(clearFirestoreData)
	afterAll(clearFirestoreData)
	
	it('successfully access a tip collection element as the creator', async () => {
		const adminDb = getAdminApp()
		const videoCallRef = await adminDb.firestore().collection('videoCalls').
			add({addresseeUid: 'alice'})
		await videoCallRef.collection('tips').doc('tip1').set({})
		const testDb = getTestingApp(aliceAuth)
		const testingTipDoc = testDb.firestore().collection('videoCalls').doc(videoCallRef.id)
			.collection('tips').doc('tip1')
		await firebase.assertSucceeds(testingTipDoc.get())
	})
	
	it('fails to access a tip collection element not as the creator', async () => {
		const adminDb = getAdminApp()
		const videoCallRef = await adminDb.firestore().collection('videoCalls').
			add({addresseeUid: 'bob'})
		await videoCallRef.collection('tips').doc('tip1').set({})
		const testDb = getTestingApp(aliceAuth)
		const testingTipDoc = testDb.firestore().collection('videoCalls').doc(videoCallRef.id)
		.collection('tips').doc('tip1')
		await firebase.assertFails(testingTipDoc.get())
	})
})