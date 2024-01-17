import * as stripeConstants from '../stripeConstants'
import {onboardingRefreshUrl, onboardingReturnUrl} from '../stripeConstants'
import {initialFirebaseAdminIfNeeded, userDocRef, userPIDocRef} from '../helpers/helpers'
import {clearFirestoreData} from '../../tests/testingHelpers'
import {createStripeOnboardingUrlLogic} from './createStripeOnboardingUrlLogic'

jest.mock('../stripeConstants', () => ({
	...jest.requireActual('../stripeConstants')
}))

describe('The create stripe onboarding url logic function', () => {
	beforeAll(initialFirebaseAdminIfNeeded)
	beforeEach(clearFirestoreData)
	afterAll(clearFirestoreData)
	
	it('Should create a new stripe account and new stripe onboarding url', async () => {
		await userDocRef('alice').set({twitterUsername: 'alice'})
		const createStripeAccountFunction = jest.fn(async () => ({id: 'aliceStripeId'}))
		// @ts-ignore
		stripeConstants.stripeClient.accounts.create = createStripeAccountFunction
		const createStripeAccountLinkFunction = jest.fn(async () => ({url: 'testingLink'}))
		// @ts-ignore
		stripeConstants.stripeClient.accountLinks.create = createStripeAccountLinkFunction
		
		const accountLink = await createStripeOnboardingUrlLogic('alice')
		const afterDoc = await userPIDocRef('alice').get()
		
		expect(afterDoc.data().stripeAccountId).toBe('aliceStripeId')
		expect(afterDoc.data().stripeAccountStatus).toBe('onboarding')
		expect(accountLink).toBe('testingLink')
		expect(createStripeAccountFunction).toBeCalledWith({
			type: 'express',
			metadata: {firebaseUid: 'alice'},
			capabilities: {transfers: {requested: true}},
			business_profile: {url: `pupix.com/alice`},
			business_type: 'individual',
			country: 'US'
		})
		expect(createStripeAccountLinkFunction).toBeCalledWith({
			account: 'aliceStripeId',
			type: 'account_onboarding',
			return_url: onboardingReturnUrl,
			refresh_url: onboardingRefreshUrl,
		})
	})
	
	it('Should create a new stripe account for account from the UK', async () => {
		await userDocRef('alice').set({twitterUsername: 'alice'})
		const createStripeAccountFunction = jest.fn(async () => ({id: 'aliceStripeId'}))
		// @ts-ignore
		stripeConstants.stripeClient.accounts.create = createStripeAccountFunction
		const createStripeAccountLinkFunction = jest.fn(async () => ({url: 'testingLink'}))
		// @ts-ignore
		stripeConstants.stripeClient.accountLinks.create = createStripeAccountLinkFunction
		
		const accountLink = await createStripeOnboardingUrlLogic('alice', 'GB')
		const afterDoc = await userPIDocRef('alice').get()
		
		expect(afterDoc.data().stripeAccountId).toBe('aliceStripeId')
		expect(afterDoc.data().stripeAccountStatus).toBe('onboarding')
		expect(accountLink).toBe('testingLink')
		expect(createStripeAccountFunction).toBeCalledWith({
			type: 'express',
			metadata: {firebaseUid: 'alice'},
			capabilities: {transfers: {requested: true}},
			business_profile: {url: `pupix.com/alice`},
			business_type: 'individual',
			country: 'GB',
			tos_acceptance: {
				service_agreement: 'recipient'
			}
		})
		expect(createStripeAccountLinkFunction).toBeCalledWith({
			account: 'aliceStripeId',
			type: 'account_onboarding',
			return_url: onboardingReturnUrl,
			refresh_url: onboardingRefreshUrl,
		})
	})
	
	it('Should create a new stripe account for account from israel with US country code after the first ' +
		'create account request fails', async () => {
		await userDocRef('alice').set({twitterUsername: 'alice'})
		const createStripeAccountFunction = jest.fn(async (data) => {
			if (data.country === 'IL') {
				throw new Error()
			} else {
				return {id: 'aliceStripeId'}
			}
		})
		// @ts-ignore
		stripeConstants.stripeClient.accounts.create = createStripeAccountFunction
		const createStripeAccountLinkFunction = jest.fn(async () => ({url: 'testingLink'}))
		// @ts-ignore
		stripeConstants.stripeClient.accountLinks.create = createStripeAccountLinkFunction
		
		const accountLink = await createStripeOnboardingUrlLogic('alice', 'IL')
		const afterDoc = await userPIDocRef('alice').get()
		
		expect(afterDoc.data().stripeAccountId).toBe('aliceStripeId')
		expect(afterDoc.data().stripeAccountStatus).toBe('onboarding')
		expect(accountLink).toBe('testingLink')
		expect(createStripeAccountFunction).toBeCalledWith({
			type: 'express',
			metadata: {firebaseUid: 'alice'},
			capabilities: {transfers: {requested: true}},
			business_profile: {url: `pupix.com/alice`},
			business_type: 'individual'
		})
		expect(createStripeAccountLinkFunction).toBeCalledWith({
			account: 'aliceStripeId',
			type: 'account_onboarding',
			return_url: onboardingReturnUrl,
			refresh_url: onboardingRefreshUrl,
		})
	})
	
	it('should create another stripe onboarding url for the existing stripe account if one ' +
		'is already exist', async () => {
		await userPIDocRef('alice').set({stripeAccountId: 'aliceStripeId'})
		const createStripeAccountLinkFunction = jest.fn(async () => ({url: 'testingLink'}))
		// @ts-ignore
		stripeConstants.stripeClient.accountLinks.create = createStripeAccountLinkFunction
		const createStripeAccountFunction = jest.fn(async () => ({id: 'aliceStripeId'}))
		// @ts-ignore
		stripeConstants.stripeClient.accounts.create = createStripeAccountFunction
		const accountLink = await createStripeOnboardingUrlLogic('alice')
		
		expect(accountLink).toBe('testingLink')
		expect(createStripeAccountLinkFunction).toBeCalledWith({
			account: 'aliceStripeId',
			type: 'account_onboarding',
			return_url: onboardingReturnUrl,
			refresh_url: onboardingRefreshUrl,
		})
		expect(createStripeAccountFunction).not.toBeCalled()
	})
	
	it('should create new stripe account with the correct country code' +
		' when the phone number is saved in the database but no country code is given', async () => {
		await userDocRef('alice').set({twitterUsername: 'alice'})
		await userPIDocRef('alice').set({phoneNumber: '420702555481'})
		const createStripeAccountFunction = jest.fn(async () => ({id: 'aliceStripeId'}))
		// @ts-ignore
		stripeConstants.stripeClient.accounts.create = createStripeAccountFunction
		// @ts-ignore
		stripeConstants.stripeClient.accountLinks.create = jest.fn(async () => ({url: 'testingLink'}))
		
		const accountLink = await createStripeOnboardingUrlLogic('alice')
		const afterDoc = await userPIDocRef('alice').get()
		
		expect(afterDoc.data().stripeAccountId).toBe('aliceStripeId')
		expect(afterDoc.data().stripeAccountStatus).toBe('onboarding')
		expect(accountLink).toBe('testingLink')
		expect(createStripeAccountFunction).toBeCalledWith({
			type: 'express',
			metadata: {firebaseUid: 'alice'},
			capabilities: {transfers: {requested: true}},
			business_profile: {url: `pupix.com/alice`},
			business_type: 'individual',
			country: 'CZ',
			tos_acceptance: {
				service_agreement: 'recipient',
			},
		})
	})
	
	it('should create new stripe account with US country code' +
		' when the phone number is saved in the database but it is not parseable', async () => {
		await userDocRef('alice').set({twitterUsername: 'alice'})
		await userPIDocRef('alice').set({phoneNumber: ''})
		const createStripeAccountFunction = jest.fn(async () => ({id: 'aliceStripeId'}))
		// @ts-ignore
		stripeConstants.stripeClient.accounts.create = createStripeAccountFunction
		// @ts-ignore
		stripeConstants.stripeClient.accountLinks.create = jest.fn(async () => ({url: 'testingLink'}))
		
		const accountLink = await createStripeOnboardingUrlLogic('alice')
		const afterDoc = await userPIDocRef('alice').get()
		
		expect(afterDoc.data().stripeAccountId).toBe('aliceStripeId')
		expect(afterDoc.data().stripeAccountStatus).toBe('onboarding')
		expect(accountLink).toBe('testingLink')
		expect(createStripeAccountFunction).toBeCalledWith({
			type: 'express',
			metadata: {firebaseUid: 'alice'},
			capabilities: {transfers: {requested: true}},
			business_profile: {url: `pupix.com/alice`},
			business_type: 'individual',
			country: 'US'
		})
	})

	it('should create new stripe account with US country code' +
		' when the parse phone number function throws an error', async () => {
		await userDocRef('alice').set({twitterUsername: 'alice'})
		await userPIDocRef('alice').set({phoneNumber: false})
		const createStripeAccountFunction = jest.fn(async () => ({id: 'aliceStripeId'}))
		// @ts-ignore
		stripeConstants.stripeClient.accounts.create = createStripeAccountFunction
		// @ts-ignore
		stripeConstants.stripeClient.accountLinks.create = jest.fn(async () => ({url: 'testingLink'}))
		
		const accountLink = await createStripeOnboardingUrlLogic('alice')
		const afterDoc = await userPIDocRef('alice').get()
		
		expect(afterDoc.data().stripeAccountId).toBe('aliceStripeId')
		expect(afterDoc.data().stripeAccountStatus).toBe('onboarding')
		expect(accountLink).toBe('testingLink')
		expect(createStripeAccountFunction).toBeCalledWith({
			type: 'express',
			metadata: {firebaseUid: 'alice'},
			capabilities: {transfers: {requested: true}},
			business_profile: {url: `pupix.com/alice`},
			business_type: 'individual',
			country: 'US'
		})
	})
})