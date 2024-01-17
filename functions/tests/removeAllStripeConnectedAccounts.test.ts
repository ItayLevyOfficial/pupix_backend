import {environment} from '../src/constants'
import {stripeClient} from '../src/stripeConstants'

// Here so the function wont run when I run all my tests
const removeAllStripeAccounts = false

describe('Delete all the stripe testing connected accounts', () => {
	it('should delete all the stripe testing connected accounts', async () => {
		jest.setTimeout(50_000)
		if (environment === 'testing' && removeAllStripeAccounts) {
			const accounts = (await stripeClient.accounts.list({limit: 100})).data
			for (const account of accounts) {
				await stripeClient.accounts.del(account.id)
			}
		}
	})
})