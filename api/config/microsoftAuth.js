const axios = require('axios');
const jwt = require('jsonwebtoken');
const logger = require('./logger');

class MicrosoftAuthService {
  constructor() {
    this.clientId = process.env.MICROSOFT_CLIENT_ID;
    this.clientSecret = process.env.MICROSOFT_CLIENT_SECRET;
    this.tenantId = process.env.MICROSOFT_TENANT_ID || 'common';
    this.redirectUri = process.env.MICROSOFT_REDIRECT_URI;
    this.scope = 'openid profile email';
  }

  // Generate Microsoft OAuth2 login URL
  getAuthUrl() {
    const params = new URLSearchParams({
      client_id: this.clientId,
      response_type: 'code',
      redirect_uri: this.redirectUri,
      scope: this.scope,
      response_mode: 'query',
      state: this.generateState()
    });

    return `https://login.microsoftonline.com/${this.tenantId}/oauth2/v2.0/authorize?${params}`;
  }

  // Generate random state for CSRF protection
  generateState() {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }

  // Exchange authorization code for access token
  async getAccessToken(code) {
    try {
      const tokenUrl = `https://login.microsoftonline.com/${this.tenantId}/oauth2/v2.0/token`;
      
      const params = new URLSearchParams({
        client_id: this.clientId,
        client_secret: this.clientSecret,
        code: code,
        redirect_uri: this.redirectUri,
        grant_type: 'authorization_code'
      });

      const response = await axios.post(tokenUrl, params, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });

      return response.data;
    } catch (error) {
      logger.error('Failed to get access token:', error.response?.data || error.message);
      throw new Error('Failed to obtain access token');
    }
  }

  // Get user profile from Microsoft Graph API
  async getUserProfile(accessToken) {
    try {
      const response = await axios.get('https://graph.microsoft.com/v1.0/me', {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      return response.data;
    } catch (error) {
      logger.error('Failed to get user profile:', error.response?.data || error.message);
      throw new Error('Failed to get user profile');
    }
  }

  // Decode ID token to get user info
  decodeIdToken(idToken) {
    try {
      // Note: In production, you should verify the token signature
      const decoded = jwt.decode(idToken);
      return decoded;
    } catch (error) {
      logger.error('Failed to decode ID token:', error);
      throw new Error('Invalid ID token');
    }
  }

  // Validate and extract user information
  async validateAndGetUser(code) {
    try {
      // Get access token
      const tokenResponse = await this.getAccessToken(code);
      const { access_token, id_token } = tokenResponse;

      // Get user profile from Graph API
      const graphProfile = await this.getUserProfile(access_token);

      // Decode ID token for additional claims
      const idTokenClaims = this.decodeIdToken(id_token);

      // Combine information
      const userProfile = {
        id: graphProfile.id,
        mail: graphProfile.mail || graphProfile.userPrincipalName,
        userPrincipalName: graphProfile.userPrincipalName,
        displayName: graphProfile.displayName,
        givenName: graphProfile.givenName,
        surname: graphProfile.surname,
        tenantId: idTokenClaims.tid
      };

      logger.info('Microsoft user profile retrieved:', {
        id: userProfile.id,
        email: userProfile.mail,
        displayName: userProfile.displayName
      });

      return userProfile;
    } catch (error) {
      logger.error('Microsoft authentication validation failed:', error);
      throw error;
    }
  }
}

module.exports = new MicrosoftAuthService();
