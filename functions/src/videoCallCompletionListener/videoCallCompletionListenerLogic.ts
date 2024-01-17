import {stripeClient} from '../stripeConstants'
import {documentRef} from '../helpers/helpers'

export const videoCallCompletionListenerLogic = async (clientUid, previousCallStatus, newCallStatus) => {
	if (newCallStatus !== previousCallStatus &&
		['missed', 'denied', 'client-left', 'addressee-left', 'completed'].includes(newCallStatus)) {
		const clientDoc = await documentRef(clientUid, 'clients').get()
		const {stripeCustomerId} = clientDoc.data()
		const customerPaymentMethod = (await stripeClient.paymentMethods.list(
			{customer: stripeCustomerId, type: 'card'})).data[0]
		await stripeClient.paymentMethods.detach(customerPaymentMethod.id)
	}
}