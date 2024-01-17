import {environment, functionsUrl} from './constants'
import * as Twilio from 'twilio'
import * as functions from 'firebase-functions'

const testingSid = 'AC64c737f1042763daa2d8105f33feac76'
const liveSid = 'AC22592c7b485d49d93b78fd5710447c8b'
const liveApiKey = 'SK63ae419ed0331ba997c674073c7a4599'
const testingApiKey = 'SK99eb771ad33cdfaa915c106699d89e81'

const accountSids = {testing: testingSid, staging: testingSid, live: liveSid}
const apiKeys = {testing: testingApiKey, staging: testingApiKey, live: liveApiKey}

export const twilioAccountSid = accountSids[environment]
export const twilioAuthToken = functions.config().twilio?.authtoken
export const twilioApiKey = apiKeys[environment]
export const twilioApiSecret = functions.config().twilio?.apisecret

export const twilioPhoneNumber = '+14014008165'
export const twilioStatusCallbackUrl = `${functionsUrl}/twilioStatusCallback`
export let twilioClient = Twilio(twilioAccountSid, twilioAuthToken)
