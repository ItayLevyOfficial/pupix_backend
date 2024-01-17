import * as axios from 'axios'
import * as firebaseAdmin from 'firebase-admin'
import {environment} from '../constants'
import {twitterClient} from './twitterConstants'
import * as functions from 'firebase-functions'

const axiosClient = axios.default

/**
 * Returns the available username in pupik for the given twitter username. The username will be the same as the twitter username
 * if the username is available, and with additional '1' at the end it it's not.
 */
export let getAvailableUsername = async (twitterUsername, currentUser) => {
	let docWithThatTwitterUsername = (await firebaseAdmin.firestore().collection('users').
		where('twitterUsername', '==', twitterUsername).get()).docs[0]
	if (docWithThatTwitterUsername && docWithThatTwitterUsername?.ref?.id !== currentUser.uid) {
		while (docWithThatTwitterUsername) {
			twitterUsername = twitterUsername + '1'
			docWithThatTwitterUsername = (await firebaseAdmin.firestore().collection('users').
				where('twitterUsername', '==', twitterUsername).get()).docs[0]
		}
		return twitterUsername
	} else {
		return twitterUsername
	}
}

/**
 * Return the twitter user data for the given user.
 */
export let getTwitterUserData = async user => {
	let twitterUserData
	if (environment === 'testing') {
		twitterUserData = {
			screen_name: 'testingTwitterUsername'
		}
	} else {
		const twitterUid = user.providerData[0].uid
		twitterUserData = await twitterClient.get('users/show', {user_id: twitterUid})
	}
	return twitterUserData
}

/**
 * Fetches the image blob from the given photoUrl and uploads the photo to firebase storage. Return the public url of the
 * uploaded photo.
 *
 * @param uid: The current user firebase uid.
 * @param photoURL: The given photo current url.
 * @param storageCollectionName: The name of the collection name where to store the image in firebase storage
 */
export let uploadPhoto = async (uid: string, photoURL: string, storageCollectionName: string) => {
	try {
		const photoBlob = (await axiosClient.get(photoURL, {responseType: 'arraybuffer'})).data
		const bucketName = environment === 'live' ? 'pupik-897d8.appspot.com' : 'levy-c62af.appspot.com'
		const bucket = firebaseAdmin.storage().bucket(bucketName)
		const file = bucket.file(`${storageCollectionName}/${uid}`)
		await file.save(photoBlob, {contentType: 'image/jpeg'})
		await file.makePublic()
		return file.publicUrl()
	} catch (error) {
		functions.logger.error(error.message)
		return ''
	}
}
