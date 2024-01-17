import * as axios from 'axios'
import * as firebaseAdmin from 'firebase-admin'
import {uploadPhoto} from './logicHelpers'

jest.mock('axios')

jest.mock('firebase-admin')

describe('The upload photo function', () => {
	it('should upload the user profile photo to firebase storage and return the photo url', async () => {
		const filePublicUrlFunction = jest.fn(() => 'testingPublicUrl')
		const fileMakePublicFunction = jest.fn()
		const fileSaveFunction = jest.fn()
		const bucketFileFunction = jest.fn(
			() => ({save: fileSaveFunction, makePublic: fileMakePublicFunction, publicUrl: filePublicUrlFunction}))
		const firebaseBucketFunction = jest.fn(() => ({file: bucketFileFunction}))
		const axiosGetFunction = jest.fn(() => ({data: 'testingPhotoData'}))
		// @ts-ignore
		firebaseAdmin.storage = () => ({bucket: firebaseBucketFunction})
		// @ts-ignore
		axios.default.get = axiosGetFunction
		
		const photoUrl = await uploadPhoto('alice', 'testingPhotoUrl', 'profilePhotos')
		
		expect(axiosGetFunction).toBeCalledWith('testingPhotoUrl', {responseType: 'arraybuffer'})
		expect(firebaseBucketFunction).toBeCalledWith('levy-c62af.appspot.com')
		expect(bucketFileFunction).toBeCalledWith('profilePhotos/alice')
		expect(fileSaveFunction).toBeCalledWith('testingPhotoData', {contentType: 'image/jpeg'})
		expect(fileMakePublicFunction).toBeCalled()
		expect(photoUrl).toBe('testingPublicUrl')
	})
	
	it('should return an empty string when the upload photo function fails at any step', async () => {
		const filePublicUrlFunction = jest.fn(() => 'testingPublicUrl')
		const fileMakePublicFunction = jest.fn()
		const fileSaveFunction = jest.fn(() => {
			throw new Error()
		})
		const bucketFileFunction = jest.fn(
			() => ({save: fileSaveFunction, makePublic: fileMakePublicFunction, publicUrl: filePublicUrlFunction}))
		const firebaseBucketFunction = jest.fn(() => ({file: bucketFileFunction}))
		const axiosGetFunction = jest.fn(() => ({data: 'testingPhotoData'}))
		// @ts-ignore
		firebaseAdmin.storage = () => ({bucket: firebaseBucketFunction})
		// @ts-ignore
		axios.default.get = axiosGetFunction
		
		const photoUrl = await uploadPhoto('alice', 'testingPhotoUrl', 'profilePhotos')
		
		expect(axiosGetFunction).toBeCalledWith('testingPhotoUrl', {responseType: 'arraybuffer'})
		expect(firebaseBucketFunction).toBeCalledWith('levy-c62af.appspot.com')
		expect(bucketFileFunction).toBeCalledWith('profilePhotos/alice')
		expect(fileSaveFunction).toBeCalledWith('testingPhotoData', {contentType: 'image/jpeg'})
		expect(photoUrl).toBe('')
	})
})