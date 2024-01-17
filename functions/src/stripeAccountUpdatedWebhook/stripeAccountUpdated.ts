import * as functions from 'firebase-functions'

export const stripeAccountUpdatedWebhook = functions.https.onRequest(async (request, response) => {
	const {verifyStripeRequest} = await import('../stripePaymentIntentWebhook/verifyStripeEvent')
	const {stripeAccountUpdatedWebhookSecret} = await import('../stripeConstants')
	const {stripeAccountUpdatedLogic} = await import('./stripeAccountUpdatedLogic')
	const event = verifyStripeRequest(request, stripeAccountUpdatedWebhookSecret)
	if (event) {
		const account = event.data.object
		try {
			await stripeAccountUpdatedLogic(account)
		} catch (error) {
			functions.logger.error(
				// @ts-ignore
				`Error thrown while running the stripe account updated for ${account?.id}. Error: ${error?.message}`)
		}
		response.status(200).send()
	} else {
		functions.logger.error('got not authorized request to the stripe account updated webhook')
		response.status(400).send()
	}
})