import * as firebase from '@firebase/testing'
import {aliceAuth, clearFirestoreData, getAdminApp, getTestingApp} from '../testingHelpers'

describe('The video room documents security rules', () => {
	beforeEach(clearFirestoreData)
	afterAll(clearFirestoreData)
	
	it('successfully access a video room document as the addressee',
        async () => {
            const adminDb = getAdminApp()
            const videoCallRef = await adminDb.firestore().collection('videoCalls').
                add({addresseeUid: 'alice'})
            const testDb = getTestingApp(aliceAuth)
            const testingDoc = testDb.firestore().collection('videoCalls').doc(videoCallRef.id)
            await firebase.assertSucceeds(testingDoc.get())
        }
    )
	
	it('successfully access a video room document as the client', async () => {
		const adminDb = getAdminApp()
		const videoCallRef = await adminDb.firestore().collection('videoCalls').
			add({clientUid: 'alice'})
		const testDb = getTestingApp(aliceAuth)
		const testingDoc = testDb.firestore().collection('videoCalls').doc(videoCallRef.id)
		await firebase.assertSucceeds(testingDoc.get())
	})
	
	it('fails to access a video room document as nobody', async () => {
		const adminDb = getAdminApp()
		const videoCallRef = await adminDb.firestore().collection('videoCalls').
			add({clientUid: 'itay'})
		const testDb = getTestingApp(aliceAuth)
		const testingDoc = testDb.firestore().collection('videoCalls').doc(videoCallRef.id)
		await firebase.assertFails(testingDoc.get())
	})
	
	it(
        'fails to update any other field in the video call document',
        async () => {
            const adminDb = getAdminApp()
            const videoCallRef = await adminDb.firestore().collection('videoCalls').
                add({addresseeUid: 'alice'})
            const testDb = getTestingApp(aliceAuth)
            const testingDoc = testDb.firestore().collection('videoCalls').doc(videoCallRef.id)
            await firebase.assertFails(testingDoc.update(
                {clientUid: 'itay'}))
            await firebase.assertFails(testingDoc.update(
                {addresseeConnectionTIme: 'itay'}))
            await firebase.assertFails(testingDoc.update(
                {addresseeDisconnectionTime: 'itay'}))
            await firebase.assertFails(testingDoc.update(
                {callLength: 'itay'}))
        }
    )
	
	it(
        'successfully change the video call status to denied from pending',
        async () => {
            const adminDb = getAdminApp()
            const videoCallRef = await adminDb.firestore().collection('videoCalls').
                add({addresseeUid: 'alice', status: 'pending'})
            const testDb = getTestingApp(aliceAuth)
            const testingDoc = testDb.firestore().collection('videoCalls').doc(videoCallRef.id)
            await firebase.assertSucceeds(testingDoc.update({status: 'denied'}))
        }
    )
	
	it(
        'fails to change the video call status to denied when its not the addressee',
        async () => {
            const adminDb = getAdminApp()
            const videoCallRef = await adminDb.firestore().collection('videoCalls').
                add({addresseeUid: 'itay', status: 'pending'})
            const testDb = getTestingApp(aliceAuth)
            const testingDoc = testDb.firestore().collection('videoCalls').doc(videoCallRef.id)
            await firebase.assertFails(testingDoc.update({status: 'denied'}))
        }
    )
	
	it(
        'fails to change the video call status to denied when the call status is not pending',
        async () => {
			const adminDb = getAdminApp()
			const videoCallRef = await adminDb.firestore().collection('videoCalls').
				add({addresseeUid: 'alice', status: 'in-progress'})
			const testDb = getTestingApp(aliceAuth)
			const testingDoc = testDb.firestore().collection('videoCalls').doc(videoCallRef.id)
			await firebase.assertFails(testingDoc.update({status: 'denied'}))
		}
    )
	
	it('successfully saves the client call rating as the client', async () => {
		const adminDb = getAdminApp()
		const videoCallRef = await adminDb.firestore().collection('videoCalls').
			add({clientUid: 'bob', status: 'completed'})
		const testDb = getTestingApp({uid: 'bob'})
		const testingDoc = testDb.firestore().collection('videoCalls').doc(videoCallRef.id)
		await firebase.assertSucceeds(testingDoc.update({clientRating: 3}))
	})
	
	it('fails to save the client call rating as the addressee', async () => {
		const adminDb = getAdminApp()
		const videoCallRef = await adminDb.firestore().collection('videoCalls').
			add({clientUid: 'bob', addresseeUid: 'alice', status: 'completed'})
		const testDb = getTestingApp({uid: 'alice'})
		const testingDoc = testDb.firestore().collection('videoCalls').doc(videoCallRef.id)
		await firebase.assertFails(testingDoc.update({clientRating: 3}))
	})
	
	it('fails to save not valid values as the call rating', async () => {
		const adminDb = getAdminApp()
		const videoCallRef = await adminDb.firestore().collection('videoCalls').
			add({clientUid: 'bob', addresseeUid: 'alice', status: 'completed'})
		const testDb = getTestingApp({uid: 'bob'})
		const testingDoc = testDb.firestore().collection('videoCalls').doc(videoCallRef.id)
		await firebase.assertFails(testingDoc.update({clientRating: 6}))
		await firebase.assertFails(testingDoc.update({clientRating: 'd'}))
		await firebase.assertFails(testingDoc.update({clientRating: -3}))
	})
	it('successfully update the tip request amount as the creator', async () => {
		const adminDb = getAdminApp()
		const videoCallRef = await adminDb.firestore().collection('videoCalls').
			add({clientUid: 'bob', addresseeUid: 'alice', status: 'completed'})
		const testDb = getTestingApp(aliceAuth)
		const testingDoc = testDb.firestore().collection('videoCalls').doc(videoCallRef.id)
		await firebase.assertSucceeds(testingDoc.update({tipRequest: 20}))
	})

	it('fails to update the tip request amount not as the creator', async () => {
		const adminDb = getAdminApp()
		const videoCallRef = await adminDb.firestore().collection('videoCalls').
			add({clientUid: 'bob', addresseeUid: 'alice', status: 'completed'})
		const testDb = getTestingApp({uid: 'bob'})
		const testingDoc = testDb.firestore().collection('videoCalls').doc(videoCallRef.id)
		await firebase.assertFails(testingDoc.update({tipRequest: 20}))	})
})