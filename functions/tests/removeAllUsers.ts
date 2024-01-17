import * as firebaseAdmin from 'firebase-admin'
import {initialFirebaseAdminIfNeeded} from '../src/helpers/helpers'
import {environment} from '../src/constants'

function deleteUser(uid) {
	firebaseAdmin.auth().deleteUser(uid)
		.then(function () {
			console.log('Successfully deleted user', uid)
		})
		.catch(function (error) {
			console.log('Error deleting user:', error)
		})
}

function getAllUsers(nextPageToken) {
	firebaseAdmin.auth().listUsers(100, nextPageToken)
		.then(function (listUsersResult) {
			listUsersResult.users.forEach(function (userRecord) {
				// @ts-ignore
				const uid = userRecord.toJSON().uid
				deleteUser(uid)
			})
			if (listUsersResult.pageToken) {
				getAllUsers(listUsersResult.pageToken)
			}
		})
		.catch(function (error) {
			console.log('Error listing users:', error)
		})
}

// Here for the function won't run with all the tests.
const removeAllFirebaseUsers = false

describe('Delete all the users in the database', () => {
	beforeAll(async () => {
		await initialFirebaseAdminIfNeeded()
	})
	it('should delete all the users in firebase', async () => {
		if (environment === 'testing' && removeAllFirebaseUsers) {
			// @ts-ignore
			getAllUsers()
		}
	})
})