import {stripeClient, stripeCaptureAmountUpdatedWebhookSecret,} from '../stripeConstants'
import {userDocRef} from '../helpers/helpers'
import * as functions from 'firebase-functions'

export const verifyStripeRequest = (request, webhookSecret) => {
	try {
		const stripeSignature = request.headers['stripe-signature']
		return stripeClient.webhooks.constructEvent(request.rawBody, stripeSignature, webhookSecret)
	} catch (error) {
		functions.logger.error(error.message)
		return false
	}
}
