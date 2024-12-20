export interface LoginResponse {
  session_id: string;
  access_token: string;
  access_token_expires_at: string;
  RefreshToken: string;
  RefreshTokenExpiresAt: string;
}

export interface LoadUserResponse {
  uid: string;
  name: string;
  role: string;
  walletAddress: string;
  walletPrivateKey?: string;
}

export interface LoadMinerResponse {
  miner: any;
  rewardRate: string;
}

export interface GenerateMinerChallengeResponse {
  challenge: string;
  rewardRate: number;
}

export interface UserDetailResponse {
  storage_used: number;
  referral_storage: number;
  UserID: string;
}

export enum AccountType {
  Github = "github",
  Google = "google",
  Provider = "provider",
  Mail = "mail",
}