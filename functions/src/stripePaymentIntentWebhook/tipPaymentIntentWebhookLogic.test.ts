import {documentRef, initialFirebaseAdminIfNeeded} from '../helpers/helpers'
import {clearFirestoreData} from '../../tests/testingHelpers'
import {tipPaymentIntentWebhookLogic} from './tipPaymentIntentWebhookLogic'
import * as firebaseAdmin from 'firebase-admin'

describe('The tip payment intent webhook logic', () => {
	beforeAll(initialFirebaseAdminIfNeeded)
	beforeEach(clearFirestoreData)
	afterAll(clearFirestoreData)
	
	it('should add the new tip to the tip collection and update the total tips', async () => {
		const videoCallDocRef = documentRef('testingVideoRoomId', 'videoCalls')
		await videoCallDocRef.set({})
		await tipPaymentIntentWebhookLogic('testingVideoRoomId', 20, 'testingTipId')
		const afterVideoDoc = await videoCallDocRef.get()
		const {totalTips} = afterVideoDoc.data()
		const afterTipDoc = await firebaseAdmin.firestore().doc(`videoCalls/testingVideoRoomId/tips/testingTipId`).get()
		const {amount, time} = afterTipDoc.data()
		
		expect(totalTips).toBe(20)
		expect(amount).toBe(20)
		expect(time).toBeCloseTo(Date.now(), -3)
	})
	
	it('should add the new tip to the tip collection and update the totalTips', async () => {
		const videoCallDocRef = documentRef('testingVideoRoomId', 'videoCalls')
		await videoCallDocRef.set({totalTips: 80})
		await tipPaymentIntentWebhookLogic('testingVideoRoomId', 20, 'testingTipId2')
		const afterTipDoc = await firebaseAdmin.firestore().doc(`videoCalls/testingVideoRoomId/tips/testingTipId2`).get()
		const {amount, time} = afterTipDoc.data()
		const afterVideoDoc = await videoCallDocRef.get()
		const {totalTips} = afterVideoDoc.data()
		
		expect(totalTips).toBe(100)
		expect(amount).toBe(20)
		expect(time).toBeCloseTo(Date.now(), -3)
	})
	
	it('should do nothing when tip with the same tip id as existing one webhook is being called', async () => {
		const videoCallDocRef = documentRef('testingVideoRoomId', 'videoCalls')
		await videoCallDocRef.set({totalTips: 80})
		await firebaseAdmin.firestore().doc(`videoCalls/testingVideoRoomId/tips/testingTipId`).set({})
		await tipPaymentIntentWebhookLogic('testingVideoRoomId', 30, 'testingTipId')
		const afterVideoDoc = await videoCallDocRef.get()
		const {totalTips} = afterVideoDoc.data()
		
		expect(totalTips).toBe(80)
	})
	
	it('should change the tip request to 0 if the client payed a tip with this amount', async () => {
		const videoCallDocRef = documentRef('testingVideoRoomId', 'videoCalls')
		await videoCallDocRef.set({tipRequest: 50})
		await tipPaymentIntentWebhookLogic('testingVideoRoomId', 50, 'testingTipId')
		const afterVideoDoc = await videoCallDocRef.get()
		const {tipRequest} = afterVideoDoc.data()
		
		expect(tipRequest).toBe(0)
	})

	it('should not change the tip request to 0 if the client payed a tip with different amount', async () => {
		const videoCallDocRef = documentRef('testingVideoRoomId', 'videoCalls')
		await videoCallDocRef.set({tipRequest: 50})
		await tipPaymentIntentWebhookLogic('testingVideoRoomId', 20, 'testingTipId')
		const afterVideoDoc = await videoCallDocRef.get()
		const {tipRequest} = afterVideoDoc.data()
		
		expect(tipRequest).toBe(50)
	})
})