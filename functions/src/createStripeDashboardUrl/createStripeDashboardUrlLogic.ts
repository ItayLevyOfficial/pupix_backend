import {initialFirebaseAdminIfNeeded, isFunctionCallAllowedTimeLimit, userPIDocRef} from '../helpers/helpers'
import {stripeClient} from '../stripeConstants'

export const createStripeDashboardUrlLogic = async creatorUid => {
	initialFirebaseAdminIfNeeded()
	if (await isFunctionCallAllowedTimeLimit(creatorUid, 'stripeDashboardCreationTime')) {
		const creatorStripeAccountId = (await userPIDocRef(creatorUid).get())?.data()?.stripeAccountId
		if (creatorStripeAccountId) {
			return (await stripeClient.accounts.createLoginLink(creatorStripeAccountId))?.url
		}
	}
}