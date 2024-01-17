import {
	documentRef,
	initialFirebaseAdminIfNeeded,
	isFunctionCallAllowedCountLimit,
	userPIDocRef
} from '../helpers/helpers'
import {calculateStripeFee, stripeClient} from '../stripeConstants'
import * as functions from 'firebase-functions'

const isCreateTipAllowed = async (tipAmount: number, clientUid) => {
	return tipAmount > 5 && clientUid && await isFunctionCallAllowedCountLimit(clientUid, 'tipsCount', 1_000)
}

export const createTipPaymentIntentLogic = async (addresseeUid, clientUid, videoRoomId, tipAmount: number) => {
	initialFirebaseAdminIfNeeded()
	if (await isCreateTipAllowed(tipAmount, clientUid)) {
		const [addresseePIDoc, clientDoc] = await Promise.all(
			[userPIDocRef(addresseeUid).get(), documentRef(clientUid, 'clients').get()])
		const {stripeAccountId: creatorStripeAccountId} = addresseePIDoc.data()
		const {stripeCustomerId} = clientDoc.data()
		
		const customerPaymentMethod = (await stripeClient.paymentMethods.list(
			{customer: stripeCustomerId, type: 'card'})).data[0]
		const stripeFee = calculateStripeFee(tipAmount)
		const stripeTipAmount = Math.ceil((tipAmount + stripeFee) * 100)
		const creatorRevenue = Math.ceil(tipAmount * 0.9 * 100)
		
		functions.logger.log({tipAmount, stripeTipAmount, creatorRevenue, stripeFee})
		
		return await stripeClient.paymentIntents.create({
			amount: stripeTipAmount,
			currency: 'usd',
			metadata: {videoRoomId, type: 'tip', tipAmount},
			transfer_data: {
				destination: creatorStripeAccountId,
				amount: creatorRevenue
			},
			payment_method_options: {
				card: {
					request_three_d_secure: 'any'
				}
			},
			customer: stripeCustomerId,
			payment_method: customerPaymentMethod.id
		})
		
	} else {
		functions.logger.log(`Got a bad request to create tip payment intent from user: ${clientUid}`)
	}
}