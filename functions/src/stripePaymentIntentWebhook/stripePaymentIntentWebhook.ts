import * as functions from 'firebase-functions'

export const stripePaymentIntentWebhook = functions.https.onRequest((async (request, response) => {
	const {initialFirebaseAdminIfNeeded} = await import('../helpers/helpers')
	initialFirebaseAdminIfNeeded()
	const {verifyStripeRequest} = await import('./verifyStripeEvent')
	const {stripeCaptureAmountUpdatedWebhookSecret} = await import('../stripeConstants')
	if (verifyStripeRequest(request, stripeCaptureAmountUpdatedWebhookSecret)) {
		functions.logger.log('Received verified stripe event')
		const {type} = request.body.data.object.metadata
		if (type === 'tip') {
			let {videoRoomId, tipAmount} = request.body.data.object.metadata
			tipAmount = parseInt(tipAmount)
			const {id: paymentIntentId} = request.body.data.object
			const {tipPaymentIntentWebhookLogic} = await import('./tipPaymentIntentWebhookLogic')
			await tipPaymentIntentWebhookLogic(videoRoomId, tipAmount, paymentIntentId)
		} else if (type === 'video') {
			let {addresseeUid, clientUid, callLength, callPrice} = request.body.data.object.metadata
			callPrice = parseInt(callPrice)
			const {id: paymentIntentId} = request.body.data.object
			const {stripeVideoPaymentIntentWebhookLogic} = await import('./stripeVideoPaymentIntentWebhookLogic')
			await stripeVideoPaymentIntentWebhookLogic(addresseeUid, clientUid, callLength, paymentIntentId, callPrice)
		}
	} else {
		functions.logger.error(`Payment intent ${request?.body?.data?.object?.id} webhook failed.`)
	}
	
	response.status(200).send()
}))