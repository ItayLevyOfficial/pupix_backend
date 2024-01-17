import Stripe from 'stripe'
import {environment, websiteUrl} from './constants'
import * as functions from 'firebase-functions'

const stripeAmountCapturableUpdatedWebhookSecrets = {
	testing: functions.config()?.stripe?.testingpaymetintentsecret,
	staging: functions.config()?.stripe?.stagingpaymentintentsecret,
	live: functions.config()?.stripe?.webhooksecret
}

const stripeAccountUpdatedWebhookSecrets = {
	testing: functions.config()?.stripe?.testingaccountupdatedsecret,
	staging: functions.config()?.stripe?.stagingaccountupdatedsecret,
	live: functions.config()?.stripe?.accountupdatedwebhooksecret
}

const stripeClientSecrets = {
	testing: functions.config()?.stripe?.testingsecretkey,
	staging: functions.config()?.stripe?.testingsecretkey,
	live: functions.config()?.stripe?.secretkey
}

export const stripeAccountUpdatedWebhookSecret = stripeAccountUpdatedWebhookSecrets[environment]
export const stripeCaptureAmountUpdatedWebhookSecret = stripeAmountCapturableUpdatedWebhookSecrets[environment]
export const stripeSecretKey = stripeClientSecrets[environment]
export const stripeClient = new Stripe(stripeSecretKey, {apiVersion: '2020-08-27'})
export const onboardingRefreshUrl = `${websiteUrl}/stripe-refresh-url`
export const onboardingReturnUrl = `${websiteUrl}/user-profile`
export const calculateStripeFee = realPrice => Math.ceil((((realPrice + 0.30) / (1 - 0.029)) - realPrice) * 100) / 100