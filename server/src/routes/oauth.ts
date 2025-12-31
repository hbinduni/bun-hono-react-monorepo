/**
 * OAuth Routes using Arctic
 *
 * Implements social login with Google, Facebook, and Twitter.
 * Uses OAuth 2.0 authorization code flow with state validation.
 */

import type {ApiResponse, AuthResponse, OAuthProvider, OAuthUrlResponse, User} from '@shared/types'
import {OAuthProvider as OAuthProviderConst} from '@shared/types'
import {Facebook, Google, generateCodeVerifier, generateState, Twitter} from 'arctic'
import type {Context} from 'hono'
import {Hono} from 'hono'
import {deleteCookie, getCookie, setCookie} from 'hono/cookie'
import {HTTPException} from 'hono/http-exception'
import {generateTokenPair, getConfig, getRefreshTokenExpiry, isOAuthConfigured} from '../lib'
import {oauthAccountRepository, sessionRepository, userRepository} from '../lib/db'

// ============================================================================
// OAuth Router
// ============================================================================

const oauth = new Hono()

// ============================================================================
// OAuth Provider Instances (lazily initialized)
// ============================================================================

let googleClient: Google | null = null
let facebookClient: Facebook | null = null
let twitterClient: Twitter | null = null

function getGoogleClient(): Google {
  if (!googleClient) {
    const config = getConfig()
    googleClient = new Google(config.GOOGLE_CLIENT_ID, config.GOOGLE_CLIENT_SECRET, config.GOOGLE_REDIRECT_URI)
  }
  return googleClient
}

function getFacebookClient(): Facebook {
  if (!facebookClient) {
    const config = getConfig()
    facebookClient = new Facebook(
      config.FACEBOOK_CLIENT_ID,
      config.FACEBOOK_CLIENT_SECRET,
      config.FACEBOOK_REDIRECT_URI
    )
  }
  return facebookClient
}

function getTwitterClient(): Twitter {
  if (!twitterClient) {
    const config = getConfig()
    twitterClient = new Twitter(config.TWITTER_CLIENT_ID, config.TWITTER_CLIENT_SECRET, config.TWITTER_REDIRECT_URI)
  }
  return twitterClient
}

// ============================================================================
// Cookie Configuration
// ============================================================================

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
  maxAge: 60 * 10, // 10 minutes
}

// ============================================================================
// Helper: Handle OAuth User
// ============================================================================

interface OAuthUserInfo {
  provider: OAuthProvider
  providerAccountId: string
  email: string
  name: string
  avatarUrl?: string
  accessToken?: string
  refreshToken?: string
  expiresAt?: Date
}

async function handleOAuthUser(userInfo: OAuthUserInfo, c: Context): Promise<AuthResponse> {
  // Check if OAuth account already exists
  const existingOAuth = await oauthAccountRepository.findByProvider(userInfo.provider, userInfo.providerAccountId)

  let user: User | null = null

  if (existingOAuth) {
    // User has logged in with this provider before
    user = await userRepository.findById(existingOAuth.userId)
    if (!user) {
      throw new HTTPException(500, {
        message: 'User account not found',
      })
    }

    // Update OAuth tokens
    await oauthAccountRepository.upsert({
      userId: user.id,
      provider: userInfo.provider,
      providerAccountId: userInfo.providerAccountId,
      accessToken: userInfo.accessToken,
      refreshToken: userInfo.refreshToken,
      expiresAt: userInfo.expiresAt,
    })
  } else {
    // Check if user exists with this email
    const existingUser = await userRepository.findByEmail(userInfo.email)

    if (existingUser) {
      // Link OAuth to existing account
      user = existingUser
      await oauthAccountRepository.upsert({
        userId: user.id,
        provider: userInfo.provider,
        providerAccountId: userInfo.providerAccountId,
        accessToken: userInfo.accessToken,
        refreshToken: userInfo.refreshToken,
        expiresAt: userInfo.expiresAt,
      })

      // Mark email as verified since it came from OAuth provider
      await userRepository.update(user.id, {emailVerified: true})
    } else {
      // Create new user with OAuth
      user = await userRepository.create({
        email: userInfo.email,
        name: userInfo.name,
        passwordHash: null, // OAuth-only user
        emailVerified: true, // Email verified by OAuth provider
        avatarUrl: userInfo.avatarUrl,
      })

      await oauthAccountRepository.upsert({
        userId: user.id,
        provider: userInfo.provider,
        providerAccountId: userInfo.providerAccountId,
        accessToken: userInfo.accessToken,
        refreshToken: userInfo.refreshToken,
        expiresAt: userInfo.expiresAt,
      })
    }
  }

  // Refresh user data in case it was updated
  user = (await userRepository.findById(user.id))!

  // Generate tokens
  const tokens = await generateTokenPair({
    userId: user.id,
    email: user.email,
    role: user.role,
  })

  // Create session
  await sessionRepository.create({
    userId: user.id,
    expiresAt: getRefreshTokenExpiry(),
    userAgent: c.req.header('User-Agent'),
    ipAddress: c.req.header('X-Forwarded-For') || c.req.header('X-Real-IP'),
  })

  return {
    user,
    ...tokens,
  }
}

// ============================================================================
// GET /api/auth/oauth/google - Initiate Google OAuth
// ============================================================================

oauth.get('/google', async (c) => {
  if (!isOAuthConfigured('google')) {
    throw new HTTPException(501, {
      message: 'Google OAuth is not configured',
    })
  }

  const state = generateState()
  const codeVerifier = generateCodeVerifier()

  // Store state and verifier in cookies for validation
  setCookie(c, 'oauth_state', state, COOKIE_OPTIONS)
  setCookie(c, 'oauth_code_verifier', codeVerifier, COOKIE_OPTIONS)

  const google = getGoogleClient()
  const url = google.createAuthorizationURL(state, codeVerifier, ['openid', 'email', 'profile'])

  return c.json<ApiResponse<OAuthUrlResponse>>({
    success: true,
    data: {
      url: url.toString(),
      state,
    },
  })
})

// ============================================================================
// GET /api/auth/callback/google - Handle Google OAuth callback
// ============================================================================

oauth.get('/callback/google', async (c) => {
  const code = c.req.query('code')
  const state = c.req.query('state')
  const storedState = getCookie(c, 'oauth_state')
  const codeVerifier = getCookie(c, 'oauth_code_verifier')

  // Clear cookies
  deleteCookie(c, 'oauth_state')
  deleteCookie(c, 'oauth_code_verifier')

  // Validate state
  if (!state || !storedState || state !== storedState) {
    throw new HTTPException(400, {
      message: 'Invalid OAuth state',
    })
  }

  if (!code || !codeVerifier) {
    throw new HTTPException(400, {
      message: 'Missing authorization code or verifier',
    })
  }

  try {
    const google = getGoogleClient()
    const tokens = await google.validateAuthorizationCode(code, codeVerifier)

    const accessToken = tokens.accessToken()

    // Fetch user info from Google
    const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })

    if (!response.ok) {
      throw new Error('Failed to fetch user info from Google')
    }

    const googleUser = (await response.json()) as {
      id: string
      email: string
      name: string
      picture?: string
    }

    const authResponse = await handleOAuthUser(
      {
        provider: OAuthProviderConst.GOOGLE,
        providerAccountId: googleUser.id,
        email: googleUser.email,
        name: googleUser.name,
        avatarUrl: googleUser.picture,
        accessToken,
      },
      c
    )

    // Redirect to frontend with tokens (or return JSON based on your flow)
    const config = getConfig()
    const redirectUrl = new URL('/auth/callback', config.FRONTEND_URL)
    redirectUrl.searchParams.set('accessToken', authResponse.accessToken)
    redirectUrl.searchParams.set('refreshToken', authResponse.refreshToken)

    return c.redirect(redirectUrl.toString())
  } catch (error) {
    console.error('Google OAuth error:', error)
    const config = getConfig()
    return c.redirect(`${config.FRONTEND_URL}/auth/error?provider=google`)
  }
})

// ============================================================================
// GET /api/auth/oauth/facebook - Initiate Facebook OAuth
// ============================================================================

oauth.get('/facebook', async (c) => {
  if (!isOAuthConfigured('facebook')) {
    throw new HTTPException(501, {
      message: 'Facebook OAuth is not configured',
    })
  }

  const state = generateState()

  // Store state in cookie for validation
  setCookie(c, 'oauth_state', state, COOKIE_OPTIONS)

  const facebook = getFacebookClient()
  const url = facebook.createAuthorizationURL(state, ['email', 'public_profile'])

  return c.json<ApiResponse<OAuthUrlResponse>>({
    success: true,
    data: {
      url: url.toString(),
      state,
    },
  })
})

// ============================================================================
// GET /api/auth/callback/facebook - Handle Facebook OAuth callback
// ============================================================================

oauth.get('/callback/facebook', async (c) => {
  const code = c.req.query('code')
  const state = c.req.query('state')
  const storedState = getCookie(c, 'oauth_state')

  // Clear cookies
  deleteCookie(c, 'oauth_state')

  // Validate state
  if (!state || !storedState || state !== storedState) {
    throw new HTTPException(400, {
      message: 'Invalid OAuth state',
    })
  }

  if (!code) {
    throw new HTTPException(400, {
      message: 'Missing authorization code',
    })
  }

  try {
    const facebook = getFacebookClient()
    const tokens = await facebook.validateAuthorizationCode(code)

    const accessToken = tokens.accessToken()

    // Fetch user info from Facebook
    const searchParams = new URLSearchParams()
    searchParams.set('access_token', accessToken)
    searchParams.set('fields', ['id', 'name', 'email', 'picture.width(200)'].join(','))

    const response = await fetch(`https://graph.facebook.com/me?${searchParams}`)

    if (!response.ok) {
      throw new Error('Failed to fetch user info from Facebook')
    }

    const fbUser = (await response.json()) as {
      id: string
      email?: string
      name: string
      picture?: {data?: {url?: string}}
    }

    if (!fbUser.email) {
      throw new HTTPException(400, {
        message: 'Email not provided by Facebook. Please grant email permission.',
      })
    }

    const authResponse = await handleOAuthUser(
      {
        provider: OAuthProviderConst.FACEBOOK,
        providerAccountId: fbUser.id,
        email: fbUser.email,
        name: fbUser.name,
        avatarUrl: fbUser.picture?.data?.url,
        accessToken,
      },
      c
    )

    // Redirect to frontend with tokens
    const config = getConfig()
    const redirectUrl = new URL('/auth/callback', config.FRONTEND_URL)
    redirectUrl.searchParams.set('accessToken', authResponse.accessToken)
    redirectUrl.searchParams.set('refreshToken', authResponse.refreshToken)

    return c.redirect(redirectUrl.toString())
  } catch (error) {
    console.error('Facebook OAuth error:', error)
    const config = getConfig()
    return c.redirect(`${config.FRONTEND_URL}/auth/error?provider=facebook`)
  }
})

// ============================================================================
// GET /api/auth/oauth/twitter - Initiate Twitter OAuth
// ============================================================================

oauth.get('/twitter', async (c) => {
  if (!isOAuthConfigured('twitter')) {
    throw new HTTPException(501, {
      message: 'Twitter OAuth is not configured',
    })
  }

  const state = generateState()
  const codeVerifier = generateCodeVerifier()

  // Store state and verifier in cookies for validation
  setCookie(c, 'oauth_state', state, COOKIE_OPTIONS)
  setCookie(c, 'oauth_code_verifier', codeVerifier, COOKIE_OPTIONS)

  const twitter = getTwitterClient()
  const url = twitter.createAuthorizationURL(state, codeVerifier, ['users.read', 'tweet.read'])

  return c.json<ApiResponse<OAuthUrlResponse>>({
    success: true,
    data: {
      url: url.toString(),
      state,
    },
  })
})

// ============================================================================
// GET /api/auth/callback/twitter - Handle Twitter OAuth callback
// ============================================================================

oauth.get('/callback/twitter', async (c) => {
  const code = c.req.query('code')
  const state = c.req.query('state')
  const storedState = getCookie(c, 'oauth_state')
  const codeVerifier = getCookie(c, 'oauth_code_verifier')

  // Clear cookies
  deleteCookie(c, 'oauth_state')
  deleteCookie(c, 'oauth_code_verifier')

  // Validate state
  if (!state || !storedState || state !== storedState) {
    throw new HTTPException(400, {
      message: 'Invalid OAuth state',
    })
  }

  if (!code || !codeVerifier) {
    throw new HTTPException(400, {
      message: 'Missing authorization code or verifier',
    })
  }

  try {
    const twitter = getTwitterClient()
    const tokens = await twitter.validateAuthorizationCode(code, codeVerifier)

    const accessToken = tokens.accessToken()

    // Fetch user info from Twitter
    // Note: Twitter API v2 doesn't return email by default
    const response = await fetch('https://api.twitter.com/2/users/me?user.fields=profile_image_url', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })

    if (!response.ok) {
      throw new Error('Failed to fetch user info from Twitter')
    }

    const twitterResponse = (await response.json()) as {
      data: {
        id: string
        name: string
        username: string
        profile_image_url?: string
      }
    }

    const twitterUser = twitterResponse.data

    // Twitter doesn't provide email through API v2 by default
    // You'll need to request elevated access or use a workaround
    // For now, we'll create a placeholder email
    const placeholderEmail = `${twitterUser.username}@twitter.placeholder`

    const authResponse = await handleOAuthUser(
      {
        provider: OAuthProviderConst.TWITTER,
        providerAccountId: twitterUser.id,
        email: placeholderEmail,
        name: twitterUser.name,
        avatarUrl: twitterUser.profile_image_url?.replace('_normal', '_400x400'),
        accessToken,
      },
      c
    )

    // Redirect to frontend with tokens
    const config = getConfig()
    const redirectUrl = new URL('/auth/callback', config.FRONTEND_URL)
    redirectUrl.searchParams.set('accessToken', authResponse.accessToken)
    redirectUrl.searchParams.set('refreshToken', authResponse.refreshToken)

    return c.redirect(redirectUrl.toString())
  } catch (error) {
    console.error('Twitter OAuth error:', error)
    const config = getConfig()
    return c.redirect(`${config.FRONTEND_URL}/auth/error?provider=twitter`)
  }
})

// ============================================================================
// GET /api/auth/oauth/providers - List available OAuth providers
// ============================================================================

oauth.get('/providers', async (c) => {
  const providers = {
    google: isOAuthConfigured('google'),
    facebook: isOAuthConfigured('facebook'),
    twitter: isOAuthConfigured('twitter'),
  }

  return c.json<ApiResponse<typeof providers>>({
    success: true,
    data: providers,
  })
})

export default oauth
