import * as firebase from '@firebase/testing'

export const MY_PROJECT_ID = 'levy-c62af'

export async function clearFirestoreData() {
	return await firebase.clearFirestoreData({projectId: MY_PROJECT_ID})
}

export const aliceAuth = {uid: 'alice', firebase: {sign_in_provider: 'twitter.com'}}
export const getTestingApp = (auth) => firebase.initializeTestApp({projectId: MY_PROJECT_ID, auth})
export const getAdminApp = () => firebase.initializeAdminApp({projectId: MY_PROJECT_ID})