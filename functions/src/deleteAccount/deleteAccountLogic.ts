import * as firebaseAdmin from 'firebase-admin'
import {initialFirebaseAdminIfNeeded, userDocRef, userPIDocRef} from '../helpers/helpers'
import * as functions from 'firebase-functions'
import {stripeClient} from '../stripeConstants'

const deleteStripeAccount = async creatorUid => {
	try {
		const creatorStripeAccountId = (await userPIDocRef(creatorUid).get())?.data()?.stripeAccountId
		if (creatorStripeAccountId) {
			await stripeClient.accounts.del(creatorStripeAccountId)
		}
	} catch (error) {
		functions.logger.error(error.message)
	}
}

export const deleteAccountLogic = async (uid) => {
	initialFirebaseAdminIfNeeded()
	await Promise.all([
		firebaseAdmin.auth().deleteUser(uid),
		userDocRef(uid).delete(),
		userPIDocRef(uid).delete(),
		deleteStripeAccount(uid)
	])
}