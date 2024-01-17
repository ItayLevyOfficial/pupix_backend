import {documentRef, initialFirebaseAdminIfNeeded} from '../helpers/helpers'
import {clearFirestoreData} from '../../tests/testingHelpers'
import {rateCallLogic} from './rateCallLogic'

describe('The rate call function', () => {
	beforeAll(initialFirebaseAdminIfNeeded)
	beforeEach(clearFirestoreData)
	afterAll(clearFirestoreData)
	
	it('should update the video call rating, the user calls amount and the user average rating if the call has ' +
		'not been rated yet and the creator already made calls in the past', async () => {
		await documentRef('alice', 'users').set({callsAmount: 3, averageRating: 5.0})
		await documentRef('callId', 'videoCalls').set({clientUid: 'bob', addresseeUid: 'alice'})
		await rateCallLogic('bob', 1, 'callId')
		const afterVideoDoc = await documentRef('callId', 'videoCalls').get()
		const afterAliceUserDoc = await documentRef('alice', 'users').get()
		const {clientRating} = afterVideoDoc.data()
		const {averageRating, callsAmount} = afterAliceUserDoc.data()
		
		expect(clientRating).toBe(1)
		expect(averageRating).toBe(4.0)
		expect(callsAmount).toBe(4)
	})
	
	it('should update the video call rating, the user calls amount and the user average rating if the call has ' +
		'not been rated yet and the creator never made any calls', async () => {
		await documentRef('alice', 'users').set({})
		await documentRef('callId', 'videoCalls').set({clientUid: 'bob', addresseeUid: 'alice'})
		await rateCallLogic('bob', 1, 'callId')
		const afterVideoDoc = await documentRef('callId', 'videoCalls').get()
		const afterAliceUserDoc = await documentRef('alice', 'users').get()
		const {clientRating} = afterVideoDoc.data()
		const {averageRating, callsAmount} = afterAliceUserDoc.data()
		
		expect(clientRating).toBe(1)
		expect(averageRating).toBe(1.0)
		expect(callsAmount).toBe(1)
	})
	
	it('Do nothing if the call been rated already', async () => {
		await documentRef('alice', 'users').set({callsAmount: 3, averageRating: 5.0})
		await documentRef('callId', 'videoCalls').set({clientUid: 'bob', addresseeUid: 'alice', clientRating: 5.0})
		await rateCallLogic('bob', 1, 'callId')
		const afterVideoDoc = await documentRef('callId', 'videoCalls').get()
		const afterAliceUserDoc = await documentRef('alice', 'users').get()
		const {clientRating} = afterVideoDoc.data()
		const {averageRating, callsAmount} = afterAliceUserDoc.data()
		
		expect(clientRating).toBe(5)
		expect(averageRating).toBe(5)
		expect(callsAmount).toBe(3)
	})
})