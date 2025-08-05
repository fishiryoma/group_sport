// 用戶資料介面
export interface UserData {
  lineUserId: string
  displayName?: string
  pictureUrl?: string
  statusMessage?: string
  joinedAt: string
  lastActiveAt: string
  isActive: boolean
}
