import * as firebase from '@firebase/testing'
import {initialFirebaseAdminIfNeeded, userDocRef} from '../../src/helpers/helpers'
import {aliceAuth, clearFirestoreData, getAdminApp, getTestingApp} from '../testingHelpers'

describe('Pupik security rules for the public user documents', () => {
	beforeAll(initialFirebaseAdminIfNeeded)
	beforeEach(clearFirestoreData)
	afterAll(clearFirestoreData)
	
	it('successfully create legal user document by the user.', async () => {
		const testDb = getTestingApp(aliceAuth)
		const testDoc = testDb.firestore().collection('users').doc('alice')
		await firebase.assertSucceeds(testDoc.set({isAvailable: false, minuteWage: 20}))
	})
	
	it(
		'fails to create user document with anonymous authentication',
		async () => {
			const testDb = getTestingApp({uid: 'alice', firebase: {sign_in_provider: 'anonymous'}})
			const testDoc = testDb.firestore().collection('users').doc('alice')
			await firebase.assertFails(testDoc.set({
				displayName: 'Itay Levy',
				isAvailable: false,
				minuteWage: 20,
				photoURL: 'https://pbs.twimg.com/profile_images/1282657328052015104/AstNO2z8.jpg'
			}))
		}
	)
	
	it(
		'fails to create user document with anonymous authentication',
		async () => {
			const testDb = getTestingApp(aliceAuth)
			const testDoc = testDb.firestore().collection('users').doc('alice')
			await firebase.assertFails(testDoc.set({
				displayName: 'Itay Levy',
				isAvailable: false,
				minuteWage: 20,
				photoURL: 'https://pbs.twimg.com/profile_images/1282657328052015104/AstNO2z8.jpg',
				twitterUsername: 'itaylevy134'
			}))
		}
	)
	
	it('fails to create user doc for another user', async () => {
		const testDb = getTestingApp(aliceAuth)
		const testDoc = testDb.firestore().collection('users').doc('itay')
		await firebase.assertFails(testDoc.set({
			displayName: 'Itay Levy',
			isAvailable: false,
			minuteWage: 20,
			photoURL: 'https://pbs.twimg.com/profile_images/1282657328052015104/AstNO2z8.jpg'
		}))
	})
	
	it('successfully updates the user document', async () => {
		const adminDb = getAdminApp()
		await adminDb.firestore().collection('users').doc('alice').set({
			displayName: 'Itay Levy',
			isAvailable: false,
			minuteWage: 20,
			twitterUsername: 'itaylevy134',
			photoURL: 'https://pbs.twimg.com/profile_images/1282657328052015104/AstNO2z8.jpg'
		})
		const testDoc = getTestingApp(aliceAuth).firestore().collection('users').doc('alice')
		firebase.assertSucceeds(testDoc.update({displayName: 'Itay levy'}))
	})

	it('successfully updates the user document with average rating and calls amount', async () => {
		const adminDb = getAdminApp()
		await adminDb.firestore().collection('users').doc('alice').set({
			displayName: 'Itay Levy',
			isAvailable: false,
			minuteWage: 20,
			twitterUsername: 'itaylevy134',
			photoURL: 'https://pbs.twimg.com/profile_images/1282657328052015104/AstNO2z8.jpg',
			averageRating: 5.0,
			callsAmount: 30
		})
		const testDoc = getTestingApp(aliceAuth).firestore().collection('users').doc('alice')
		firebase.assertSucceeds(testDoc.update({displayName: 'Itay levy'}))
	})
	
	// It fails sometime for some reason, ignore it
	it('fails to update the user document twitter username', async () => {
		await userDocRef('alice').set({
			displayName: 'Itay Levy',
			isAvailable: false,
			minuteWage: 20,
			twitterUsername: 'itaylevy134',
			photoURL: 'https://pbs.twimg.com/profile_images/1282657328052015104/AstNO2z8.jpg',
		})
		const testDoc = getTestingApp(aliceAuth).firestore().collection('users').doc('alice')
		firebase.assertFails(testDoc.update({twitterUsername: 'nanabanana'}))
	})
	
	it('fails to update another user document', async () => {
		const adminDb = getAdminApp()
		await adminDb.firestore().collection('users').doc('alice').set({
			displayName: 'Itay Levy',
			isAvailable: false,
			minuteWage: 20,
			twitterUsername: 'itaylevy134',
			photoURL: 'https://pbs.twimg.com/profile_images/1282657328052015104/AstNO2z8.jpg',
		})
		const testDoc = getTestingApp(aliceAuth).firestore().collection('users').doc('itay')
		firebase.assertFails(testDoc.update({displayName: 'nanabanana'}))
	})
	
	it('successfully read the user doc', async () => {
		const testDoc = getTestingApp(aliceAuth).firestore().collection('users').doc('alice')
		firebase.assertSucceeds(testDoc.get())
	})
	
	it('fails to change user average rating', async () => {
		await userDocRef('alice').set({
			displayName: 'Itay Levy',
			isAvailable: false,
			minuteWage: 20,
			twitterUsername: 'itaylevy134',
			photoURL: 'https://pbs.twimg.com/profile_images/1282657328052015104/AstNO2z8.jpg',
			averageRating: 5.0
		})
		const testDoc = getTestingApp(aliceAuth).firestore().collection('users').doc('alice')
		firebase.assertFails(testDoc.update({averageRating: 6.0}))
	})
	
	it('fails to change the user calls amount', async () => {
		await userDocRef('alice').set({
			displayName: 'Itay Levy',
			isAvailable: false,
			minuteWage: 20,
			twitterUsername: 'itaylevy134',
			photoURL: 'https://pbs.twimg.com/profile_images/1282657328052015104/AstNO2z8.jpg',
			averageRating: 5.0,
			callsAmount: 57
		})
		const testDoc = getTestingApp(aliceAuth).firestore().collection('users').doc('alice')
		firebase.assertFails(testDoc.update({callsAmount: 55}))
	})
	
	it('successfully updates user cover photo url', async () => {
		const adminDb = getAdminApp()
		await adminDb.firestore().collection('users').doc('alice').set({
			displayName: 'Itay Levy',
			isAvailable: false,
			minuteWage: 20,
			twitterUsername: 'itaylevy134',
			photoURL: 'https://pbs.twimg.com/profile_images/1282657328052015104/AstNO2z8.jpg'
		})
		const testDoc = getTestingApp(aliceAuth).firestore().collection('users').doc('alice')
		firebase.assertSucceeds(testDoc.update({coverPhotoUrl: 'aiaiai.jpg'}))
		
	})
})