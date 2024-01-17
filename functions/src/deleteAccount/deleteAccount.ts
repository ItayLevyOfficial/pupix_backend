import * as functions from 'firebase-functions'

export const deleteAccount = functions.https.onCall(async (data, context) => {
	const {deleteAccountLogic} = await import('./deleteAccountLogic')
	if (context.auth?.token?.firebase.sign_in_provider === 'twitter.com') {
		const creatorUid = context.auth.uid
		await deleteAccountLogic(creatorUid)
	}
})