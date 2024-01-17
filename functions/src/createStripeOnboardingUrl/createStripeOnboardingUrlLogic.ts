import {onboardingRefreshUrl, onboardingReturnUrl, stripeClient} from '../stripeConstants'
import {
	initialFirebaseAdminIfNeeded,
	isFunctionCallAllowedTimeLimit,
	userDocRef,
	userPIDocRef
} from '../helpers/helpers'
import parsePhoneNumber from 'libphonenumber-js'

const createStripeAccount = async (creatorUid: string, countryCode?: string, phoneNumber?: string) => {
	if (!countryCode) {
		try {
			countryCode = parsePhoneNumber('+' + phoneNumber)?.country ?? 'US'
		} catch (error) {
			countryCode = 'US'
		}
	}
	const requestData = {
		type: 'express',
		metadata: {firebaseUid: creatorUid},
		capabilities: {transfers: {requested: true}},
		business_profile: {url: 'pupix.com'},
		business_type: 'individual'
	}
	try {
		// @ts-ignore
		return await stripeClient.accounts.create(
			{
				...requestData,
				country: countryCode,
				...(countryCode === 'US' ? {} : {
					tos_acceptance: {
						service_agreement: 'recipient'
					}
				})
			})
	} catch (error) {
		// @ts-ignore
		return await stripeClient.accounts.create(requestData)
	}
	
}

export const createStripeOnboardingUrlLogic = async (creatorUid: string, countryCode?: string) => {
	initialFirebaseAdminIfNeeded()
	if (await isFunctionCallAllowedTimeLimit(creatorUid, 'createStripeOnboardingUrl')) {
		const creatorPrivateInfoDoc = await userPIDocRef(creatorUid).get()
		let {
			stripeAccountId: creatorStripeAccountId,
			phoneNumber: creatorPhoneNumber,
			stripeAccountStatus
		} = creatorPrivateInfoDoc?.data() ?? {}
		if (!creatorStripeAccountId || stripeAccountStatus == 'repair') {
			let stripeAccount = await createStripeAccount(creatorUid, countryCode, creatorPhoneNumber)
			creatorStripeAccountId = stripeAccount.id
			await userPIDocRef(creatorUid).
				set({stripeAccountId: creatorStripeAccountId, stripeAccountStatus: 'onboarding'}, {merge: true})
		}
		const accountLink = await stripeClient.accountLinks.create(
			{
				account: creatorStripeAccountId,
				type: 'account_onboarding',
				return_url: onboardingReturnUrl,
				refresh_url: onboardingRefreshUrl,
			})
		return accountLink.url
	}
}