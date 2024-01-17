import * as functions from 'firebase-functions'

export const createStripeOnboardingUrl = functions.https.onCall((async (countryCode, context) => {
	if (context.auth?.token?.firebase?.sign_in_provider === 'twitter.com') {
		const creatorUid = context.auth.uid
		const {createStripeOnboardingUrlLogic} = await import('./createStripeOnboardingUrlLogic')
		return await createStripeOnboardingUrlLogic(creatorUid, countryCode)
	}
}))
