import {userDocRef} from '../helpers/helpers'
import {environment} from '../constants'
import {getAvailableUsername, getTwitterUserData, uploadPhoto} from './logicHelpers'

export const userCreationListenerLogic = async user => {
	let twitterPhotoUrl
	
	// Need it because of a bug in the twitter authentication emulator.
	if (environment === 'testing') {
		twitterPhotoUrl = user.providerData[0].photoUrl
	} else {
		twitterPhotoUrl = user.providerData[0].photoURL.replace('_normal', '')
	}
	const userTwitterData = await getTwitterUserData(user)
	const [twitterUsername, photoURL, coverPhotoUrl] = await Promise.all(
		[getAvailableUsername(userTwitterData.screen_name, user),
			uploadPhoto(user.uid, twitterPhotoUrl, 'profilePhotos'),
			uploadPhoto(user.uid, userTwitterData.profile_banner_url, 'coverPhotos')])
	const displayName = user?.displayName ?? ''
	
	await userDocRef(user.uid).set({displayName, photoURL, twitterUsername, coverPhotoUrl}, {merge: true})
}