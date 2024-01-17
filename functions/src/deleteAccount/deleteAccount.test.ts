import {initialFirebaseAdminIfNeeded, userDocRef, userPIDocRef} from '../helpers/helpers'
import {clearFirestoreData} from '../../tests/testingHelpers'
import {deleteAccountLogic} from './deleteAccountLogic'
import * as stripeConstants from '../stripeConstants'
import * as firebaseAdmin from 'firebase-admin'

jest.mock('../stripeConstants', () => ({
	...jest.requireActual('../stripeConstants')
}))

describe('The delete account function', () => {
	beforeAll(initialFirebaseAdminIfNeeded)
	beforeEach(clearFirestoreData)
	afterAll(clearFirestoreData)
	
	it('should successfully delete an account', async () => {
		await firebaseAdmin.auth().createUser({uid: 'alice'})
		await userPIDocRef('alice').set({stripeAccountId: 'aliceStripeId'})
		await userDocRef('alice').set({stripeAccountId: 'aliceStripeId'})
		const stripeDeleteFunction = jest.fn()
		stripeConstants.stripeClient.accounts.del = stripeDeleteFunction
		
		await deleteAccountLogic('alice')
		
		const afterUserDoc = await userDocRef('alice').get()
		const afterPIUserDoc = await userPIDocRef('alice').get()
		
		expect(stripeDeleteFunction).toBeCalledWith('aliceStripeId')
		expect(afterPIUserDoc.exists).toBeFalsy()
		expect(afterUserDoc.exists).toBeFalsy()
		expect(firebaseAdmin.auth().getUser('alice')).rejects.toBeTruthy()
	})
	
	it('should successfully delete an account when the stripe delete account function fails', async () => {
		await firebaseAdmin.auth().createUser({uid: 'alice'})
		await userPIDocRef('alice').set({stripeAccountId: 'aliceStripeId'})
		await userDocRef('alice').set({stripeAccountId: 'aliceStripeId'})
		const stripeDeleteFunction = jest.fn(() => {
			throw new Error()
		})
		// @ts-ignore
		stripeConstants.stripeClient.accounts.del = stripeDeleteFunction
		
		await deleteAccountLogic('alice')
		
		const afterUserDoc = await userDocRef('alice').get()
		const afterPIUserDoc = await userPIDocRef('alice').get()
		
		expect(stripeDeleteFunction).toBeCalledWith('aliceStripeId')
		expect(afterPIUserDoc.exists).toBeFalsy()
		expect(afterUserDoc.exists).toBeFalsy()
		expect(firebaseAdmin.auth().getUser('alice')).rejects.toBeTruthy()
	})
})