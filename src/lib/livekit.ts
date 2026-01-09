import * as jose from 'jose';

export interface LiveKitConfig {
  url: string;
  token: string;
}

const STORAGE_KEY_URL = 'livekit_url';
const STORAGE_KEY_TOKEN = 'livekit_token';

export function getDefaultLiveKitUrl(): string {
  return import.meta.env.VITE_LIVEKIT_URL || '';
}

export function getDefaultLiveKitToken(): string {
  return import.meta.env.VITE_LIVEKIT_TOKEN || '';
}

export function getLiveKitApiKey(): string {
  return import.meta.env.VITE_LIVEKIT_API_KEY || '';
}

export function getLiveKitApiSecret(): string {
  return import.meta.env.VITE_LIVEKIT_API_SECRET || '';
}

export function getSavedLiveKitUrl(): string {
  return localStorage.getItem(STORAGE_KEY_URL) || getDefaultLiveKitUrl();
}

export function getSavedLiveKitToken(): string {
  return localStorage.getItem(STORAGE_KEY_TOKEN) || getDefaultLiveKitToken();
}

export function saveLiveKitUrl(url: string): void {
  localStorage.setItem(STORAGE_KEY_URL, url);
}

export function saveLiveKitToken(token: string): void {
  localStorage.setItem(STORAGE_KEY_TOKEN, token);
}

export function validateLiveKitConfig(config: LiveKitConfig): boolean {
  return Boolean(config.url && config.token);
}

export async function generateLiveKitToken(
  roomName: string,
  participantName: string,
  apiKey?: string,
  apiSecret?: string
): Promise<string> {
  const key = apiKey || getLiveKitApiKey();
  const secret = apiSecret || getLiveKitApiSecret();

  if (!key || !secret) {
    throw new Error('LiveKit API key and secret are required to generate tokens');
  }

  // Create JWT token for LiveKit
  const now = Math.floor(Date.now() / 1000);
  const exp = now + 86400; // 24 hours from now

  const payload = {
    exp: exp,
    iss: key,
    nbf: now,
    sub: participantName,
    name: participantName,
    video: {
      room: roomName,
      roomJoin: true,
      canPublish: true,
      canSubscribe: true,
      canPublishData: true,
    },
  };

  console.log('Generating token with:', {
    apiKey: key,
    roomName,
    participantName,
    payload,
  });

  try {
    const secretKey = new TextEncoder().encode(secret);
    const token = await new jose.SignJWT(payload)
      .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
      .setIssuer(key)
      .setSubject(participantName)
      .setIssuedAt(now)
      .setNotBefore(now)
      .setExpirationTime(exp)
      .sign(secretKey);

    console.log('✅ Token generated successfully:', {
      tokenLength: token.length,
      tokenPreview: token.substring(0, 50) + '...',
    });

    return token;
  } catch (error) {
    console.error('❌ Token generation failed:', error);
    throw error;
  }
}

export function canAutoGenerateTokens(): boolean {
  return Boolean(getLiveKitApiKey() && getLiveKitApiSecret());
}
