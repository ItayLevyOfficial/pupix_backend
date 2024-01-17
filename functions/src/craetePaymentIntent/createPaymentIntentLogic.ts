import {
	documentRef,
	initialFirebaseAdminIfNeeded,
	isFunctionCallAllowedCountLimit,
	userDocRef,
	userPIDocRef
} from '../helpers/helpers'
import {calculateStripeFee, stripeClient} from '../stripeConstants'
import * as functions from 'firebase-functions'
import * as firebaseAdmin from 'firebase-admin'

/**
 * Return true if the payment intent creation shall be allowed, false otherwise.
 */
export const isPaymentIntentAllowed = async (
	clientUid: string, addresseeUid: string, callLength: number, creatorStripeAccountStatus: string) => {
	return [3, 8, 20].includes(callLength) && addresseeUid !== clientUid &&
		['enabled', 'need-review'].includes(creatorStripeAccountStatus) &&
		await isFunctionCallAllowedCountLimit(clientUid, 'paymentIntentsCount', 1_000)
}

/**
 * Retrieves the client stripe customer uid if it exist already, otherwise it creates the stripe customer, saves it and return it.
 *
 * @param clientUid: The client firebase uid.
 */
const getStripeCustomerId = async clientUid => {
	return await firebaseAdmin.firestore().runTransaction(async transaction => {
		const clientDoc = await transaction.get(documentRef(clientUid, 'clients'))
		let clientStripeCustomerId = clientDoc?.data()?.stripeCustomerId
		if (clientStripeCustomerId) {
			return clientStripeCustomerId
		} else {
			const customer = await stripeClient.customers.create()
			await transaction.set(documentRef(clientUid, 'clients'), {stripeCustomerId: customer.id})
			return customer.id
		}
	})
}

/**
 * Creates a stripe payment intent for the given amount, and returns the client secret.
 */
export const createPaymentIntentLogic = async (creatorUid: string, clientUid: string, callLength: number) => {
	initialFirebaseAdminIfNeeded()
	const [creatorUserPIDoc, creatorUserDoc] = await Promise.all(
		[userPIDocRef(creatorUid).get(), userDocRef(creatorUid).get()])
	const {
		stripeAccountStatus: creatorStripeAccountStatus,
		stripeAccountId: creatorStripeAccountId
	} = creatorUserPIDoc.data()
	if (await isPaymentIntentAllowed(clientUid, creatorUid, callLength, creatorStripeAccountStatus)) {
		const {minuteWage} = creatorUserDoc.data()
		const callPriceInUSD = callLength * minuteWage
		const paymentIntentAmount = Math.ceil((callPriceInUSD + calculateStripeFee(callPriceInUSD)) * 100)
		const creatorRevenue = Math.ceil(callPriceInUSD * 0.9 * 100)
		const customerId = await getStripeCustomerId(clientUid)
		
		return (await stripeClient.paymentIntents.create(
			{
				amount: paymentIntentAmount,
				currency: 'usd',
				payment_method_types: ['card'],
				capture_method: 'manual',
				metadata: {
					addresseeUid: creatorUid,
					clientUid: clientUid,
					callLength,
					callPrice: callPriceInUSD,
					type: 'video'
				},
				payment_method_options: {
					card: {
						request_three_d_secure: 'any'
					}
				},
				transfer_data: {
					destination: creatorStripeAccountId,
					amount: creatorRevenue
				},
				customer: customerId
			}))
	} else {
		functions.logger.log(
			`The creation of the payment intent with creatorUid of ${creatorUid}, clientUid of ${clientUid} & callLength of ${callLength} is not allowed`)
	}
}