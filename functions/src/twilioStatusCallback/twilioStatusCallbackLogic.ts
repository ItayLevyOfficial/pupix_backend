import {isCallCompleted, isTwilioParticipantConnected} from './twilioCallbackHelpers'
import {videoCallDocRef} from '../helpers/helpers'
import * as firebaseAdmin from 'firebase-admin'
import {stripeClient} from '../stripeConstants'
import {notifyAddressee} from './notifyAddressee'
import {pendingCallLength} from '../constants'

interface EventData {
	eventTime,
	eventIdentity,
	eventName,
	videoRoomId
}

const handleAddresseeConnected = async (currentCallDoc, eventData: EventData, transaction) => {
	const currentCallData = currentCallDoc.data()
	if ('addresseeConnectionTime' in currentCallData) {
		return
	} else {
		const {clientConnectionTime} = currentCallData
		const addresseeConnectionTime = eventData.eventTime
		if (currentCallData.status === 'pending') {
			if ((addresseeConnectionTime - clientConnectionTime) < (pendingCallLength - 5000)) {
				await transaction.update(currentCallDoc.ref,
					{addresseeConnectionTime, status: 'in-progress'})
				return ['in-progress', currentCallData]
			} else {
				await transaction.update(currentCallDoc.ref,
					{addresseeConnectionTime, status: 'missed'})
				return ['missed', currentCallData]
			}
		} else {
			await transaction.update(currentCallDoc.ref, {addresseeConnectionTime: eventData.eventTime})
		}
	}
}

const handleClientConnected = async (currentCallDoc, eventData: EventData, transaction) => {
	const currentCallData = currentCallDoc.data()
	if ('clientConnectionTime' in currentCallData) {
		return
	} else {
		const clientConnectionTime = eventData.eventTime
		if (currentCallData.status === 'ready') {
			await transaction.update(currentCallDoc.ref, {clientConnectionTime, status: 'pending'})
			return ['pending', currentCallData]
		}
	}
}

const handleParticipantConnected = async (currentCallDoc, eventData, transaction) => {
	const currentCallData = currentCallDoc.data()
	if (eventData.eventIdentity === currentCallData.addresseeUid) {
		return await handleAddresseeConnected(currentCallDoc, eventData, transaction)
	} else if (eventData.eventIdentity === currentCallData.clientUid) {
		return await handleClientConnected(currentCallDoc, eventData, transaction)
	}
}

const handleAddresseeDisconnected = async (eventData: EventData, currentCallDoc: FirebaseFirestore.DocumentSnapshot,
                                           transaction: FirebaseFirestore.Transaction) => {
	const currentCallData = currentCallDoc.data()
	if ('addresseeDisconnectionTime' in currentCallData) {
		return
	} else if (currentCallData.status === 'in-progress') {
		if (isCallCompleted({
			addresseeConnectionTime: currentCallData.addresseeConnectionTime,
			callLength: currentCallData.callLength,
			disconnectionTime: eventData.eventTime
		})) {
			await transaction.update(currentCallDoc.ref,
				{status: 'completed', addresseeDisconnectionTime: eventData.eventTime})
			return ['completed', currentCallData]
		} else {
			await transaction.update(currentCallDoc.ref,
				{status: 'addressee-left', addresseeDisconnectionTime: eventData.eventTime})
			return ['addressee-left', currentCallData]
		}
	} else {
		await transaction.update(currentCallDoc.ref,
			{addresseeDisconnectionTime: eventData.eventTime})
	}
}

const handleClientDisconnected = async (eventData: EventData, currentCallDoc: FirebaseFirestore.DocumentSnapshot,
                                        transaction: FirebaseFirestore.Transaction) => {
	const currentCallData = currentCallDoc.data()
	if ('clientDisconnectionTime' in currentCallData) {
		return
	} else {
		if (currentCallData.status === 'in-progress') {
			if (isCallCompleted(
				{
					addresseeConnectionTime: currentCallData.addresseeConnectionTime,
					callLength: currentCallData.callLength,
					disconnectionTime: eventData.eventTime
				})) {
				await transaction.update(currentCallDoc.ref,
					{status: 'completed', clientDisconnectionTime: eventData.eventTime})
				return ['completed', currentCallData]
			} else {
				await transaction.update(currentCallDoc.ref,
					{status: 'client-left', clientDisconnectionTime: eventData.eventTime})
				return ['client-left', currentCallData]
			}
		} else if (currentCallData.status === 'pending') {
			if (eventData.eventTime - currentCallData.clientConnectionTime > pendingCallLength) {
				await transaction.update(currentCallDoc.ref,
					{status: 'missed', clientDisconnectionTime: eventData.eventTime})
				return ['missed', currentCallData]
			} else {
				await transaction.update(currentCallDoc.ref,
					{status: 'client-left', clientDisconnectionTime: eventData.eventTime})
				return ['client-left', currentCallData]
			}
		} else {
			await transaction.update(currentCallDoc.ref, {clientDisconnectionTime: eventData.eventTime})
		}
	}
}

const handleParticipantDisconnected = async (eventData: EventData, currentCallDoc, transaction) => {
	const currentCallData = currentCallDoc.data()
	if (!(await isTwilioParticipantConnected(
		{participantIdentity: eventData.eventIdentity, videoRoomId: eventData.videoRoomId}))) {
		if (eventData.eventIdentity === currentCallData.addresseeUid) {
			return await handleAddresseeDisconnected(eventData, currentCallDoc, transaction)
		} else if (eventData.eventIdentity === currentCallData.clientUid) {
			return await handleClientDisconnected(eventData, currentCallDoc, transaction)
		}
	}
}

export const twilioStatusCallbackLogic = async (eventData: EventData) => {
	const result = await firebaseAdmin.firestore().runTransaction(async transaction => {
		if (['participant-connected', 'participant-disconnected'].includes(eventData.eventName)) {
			const currentCallDoc = await transaction.get(videoCallDocRef(eventData.videoRoomId))
			if (eventData.eventName === 'participant-connected') {
				return await handleParticipantConnected(currentCallDoc, eventData, transaction)
			} else if (eventData.eventName === 'participant-disconnected') {
				return await handleParticipantDisconnected(eventData, currentCallDoc, transaction)
			}
		}
	})
	
	// If the result length is 2, the call status just got changed. Else, the current call status is the last as the previous call.
	// @ts-ignore
	if (result?.length === 2) {
		// @ts-ignore
		const [newCallStatus, currentCallData] = result
		if (['client-left', 'completed'].includes(newCallStatus)) {
			const {paymentIntentId} = currentCallData
			await stripeClient.paymentIntents.capture(paymentIntentId)
		} else if (newCallStatus === 'pending') {
			await notifyAddressee(currentCallData.addresseeUid, currentCallData.callLength, eventData.videoRoomId)
		}
	}
}