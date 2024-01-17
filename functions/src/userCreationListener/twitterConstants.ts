import {environment} from '../constants'
import * as functions from 'firebase-functions'
import * as Twitter from 'twitter'

const isStagingOrTesting = ['testing', 'staging'].includes(environment)

const consumerKey = isStagingOrTesting ? '5g2o3FWMKvVPhXHdUmDIr2gWp' :
	'JnPytcjPq9NSobr9fjFtvdIY4'

const consumerSecret = isStagingOrTesting ?
	functions.config()?.twitter?.testingconsumersecret : functions.config().twitter?.consumersecret

const bearerToken = isStagingOrTesting ?
	functions.config()?.twitter?.testingbearertoken :
	functions.config()?.twitter?.bearertoken

export const twitterClient = new Twitter({
	consumer_key: consumerKey, consumer_secret: consumerSecret, bearer_token: bearerToken
})