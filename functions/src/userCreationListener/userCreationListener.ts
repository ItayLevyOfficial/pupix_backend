import * as firebaseFunctions from 'firebase-functions'

export const userCreationListener = firebaseFunctions.auth.user().
	onCreate(async (user, context) => {
		if (user.providerData[0]) {
			const {initialFirebaseAdminIfNeeded} = await import('../helpers/helpers')
			initialFirebaseAdminIfNeeded()
			const {userCreationListenerLogic} = await import('./userCreationListenerLogic')
			await userCreationListenerLogic(user)
		}
	})