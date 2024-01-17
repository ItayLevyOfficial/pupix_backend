import {clearFirestoreData} from '../../tests/testingHelpers'
import {initialFirebaseAdminIfNeeded, userDocRef, userPIDocRef} from '../helpers/helpers'
import {stripeAccountUpdatedLogic} from './stripeAccountUpdatedLogic'

describe('The stripe account update webhook logic function', () => {
	beforeAll(initialFirebaseAdminIfNeeded)
	beforeEach(clearFirestoreData)
	afterAll(clearFirestoreData)
	
	it('should set the stripe account status to enabled if the account is good', async () => {
		await userPIDocRef('alice').set({stripeAccountStatus: 'onboarding'})
		await stripeAccountUpdatedLogic(
			{metadata: {firebaseUid: 'alice'}, charges_enabled: true, requirements: {currently_due: []}})
		const afterDoc = await userPIDocRef('alice').get()
		const {stripeAccountStatus} = afterDoc.data()
		expect(stripeAccountStatus).toBe('enabled')
	})
	
	it('should set the stripe account status to disabled if the account charges are disabled and there are no ' +
		'currently due requirements, and change the user isAvailable to false', async () => {
		await userPIDocRef('alice').set({stripeAccountStatus: 'enabled'})
		await userDocRef('alice').set({})
		await stripeAccountUpdatedLogic(
			{metadata: {firebaseUid: 'alice'}, charges_enabled: false, requirements: {currently_due: []}})
		const afterPIDoc = await userPIDocRef('alice').get()
		const {stripeAccountStatus} = afterPIDoc.data()
		const afterUserDoc = await userDocRef('alice').get()
		const {isAvailable} = afterUserDoc.data()
		
		expect(stripeAccountStatus).toBe('disabled')
		expect(isAvailable).toBe(false)
	})
	
	it('should set the stripe account status to need review if stripe need more details', async () => {
		await userPIDocRef('alice').set({stripeAccountStatus: 'enabled'})
		await stripeAccountUpdatedLogic(
			{
				metadata: {firebaseUid: 'alice'},
				charges_enabled: true,
				requirements: {currently_due: ['testingRequirement']}
			})
		const afterDoc = await userPIDocRef('alice').get()
		const {stripeAccountStatus} = afterDoc.data()
		expect(stripeAccountStatus).toBe('need-review')
	})
	
	it('should not change the stripe account status if it is onboarding and not enabled yet', async () => {
		await userPIDocRef('alice').set({stripeAccountStatus: 'onboarding'})
		await stripeAccountUpdatedLogic(
			{
				metadata: {firebaseUid: 'alice'},
				charges_enabled: false,
				requirements: {currently_due: ['testingRequirement']}
			})
		const afterDoc = await userPIDocRef('alice').get()
		const {stripeAccountStatus} = afterDoc.data()
		expect(stripeAccountStatus).toBe('onboarding')
	})
	
	it('should change the stripe account status to pending if charges are disabled and there are no more requirements',
		async () => {
			await userPIDocRef('alice').set({stripeAccountStatus: 'onboarding'})
			await stripeAccountUpdatedLogic(
				{
					metadata: {firebaseUid: 'alice'},
					charges_enabled: false,
					requirements: {currently_due: []}
				})
			const afterDoc = await userPIDocRef('alice').get()
			const {stripeAccountStatus} = afterDoc.data()
			expect(stripeAccountStatus).toBe('pending')
		})
	
	it('should change the stripe account status to enabled after the user was in pending status', async () => {
		await userPIDocRef('alice').set({stripeAccountStatus: 'pending'})
		await stripeAccountUpdatedLogic(
			{
				metadata: {firebaseUid: 'alice'},
				charges_enabled: true,
				requirements: {currently_due: []}
			})
		const afterDoc = await userPIDocRef('alice').get()
		const {stripeAccountStatus} = afterDoc.data()
		expect(stripeAccountStatus).toBe('enabled')
	})
	
	it('should make the creator available when it stripe account status changes to enabled from pending', async () => {
		await userPIDocRef('alice').set({stripeAccountStatus: 'pending'})
		await userDocRef('alice').set({isAvailable: false, twitterUsername: 'aliceTwitter'})
		await stripeAccountUpdatedLogic(
			{
				metadata: {firebaseUid: 'alice'},
				charges_enabled: true,
				requirements: {currently_due: []}
			})
		const afterDoc = await userDocRef('alice').get()
		const {isAvailable, twitterUsername} = afterDoc.data()
		
		expect(isAvailable).toBe(true)
		expect(twitterUsername).toBe('aliceTwitter')
	})
})