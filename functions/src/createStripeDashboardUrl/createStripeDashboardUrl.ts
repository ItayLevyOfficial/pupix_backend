import * as functions from 'firebase-functions'

export const createStripeDashboardUrl = functions.https.onCall(async (data, context) => {
	if (context.auth?.token?.firebase?.sign_in_provider === 'twitter.com') {
		const creatorUid = context.auth.uid
		const {createStripeDashboardUrlLogic} = await import('./createStripeDashboardUrlLogic')
		return await createStripeDashboardUrlLogic(creatorUid)
	}
})