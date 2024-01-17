import {Stripe} from 'stripe'
import {userPIDocRef, initialFirebaseAdminIfNeeded, userDocRef} from '../helpers/helpers'

const getCurrentStripeStatus = async uid => (await userPIDocRef(uid).get())?.data()?.stripeAccountStatus

// Situations when the stripe account is disabled, and the isAvailable field is false.
const disabledAccountStatuses = ['disabled', 'need-review', 'onboarding', 'pending']

const updateAccountStatus = async (uid, newStatus) => userPIDocRef(uid).update({stripeAccountStatus: newStatus})

const updateUserAvailability = async (uid, newAvailability) => userDocRef(uid).
	set({isAvailable: newAvailability}, {merge: true})

export const stripeAccountUpdatedLogic = async (account: Stripe.Account | any) => {
	initialFirebaseAdminIfNeeded()
	const uid = account.metadata.firebaseUid
	const currentStatus = await getCurrentStripeStatus(uid)
	if (account.requirements.currently_due.length > 0) {
		if (account.charges_enabled) {
			await updateAccountStatus(uid, 'need-review')
		} else {
			if (currentStatus !== 'onboarding') {
				await Promise.all([updateAccountStatus(uid, 'disabled'),
					updateUserAvailability(uid, false)])
			}
		}
	} else {
		if (account.charges_enabled) {
			if (disabledAccountStatuses.includes(currentStatus)) {
				await Promise.all(
					[updateAccountStatus(uid, 'enabled'), updateUserAvailability(uid, true)])
			} else {
				await updateAccountStatus(uid, 'enabled')
			}
		} else {
			if (currentStatus === 'onboarding') {
				await userPIDocRef(uid).update({stripeAccountStatus: 'pending'})
			} else {
				await Promise.all([
					updateAccountStatus(uid, 'disabled'),
					updateUserAvailability(uid, false)
				])
			}
		}
	}
}