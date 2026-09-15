import { followUser as followUserApi, unfollowUser as unfollowUserApi } from '@/apis/followApi'

export async function followUser(userId) {
  await followUserApi(userId)
}

export async function unfollowUser(userId) {
  await unfollowUserApi(userId)
}
