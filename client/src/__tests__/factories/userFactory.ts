/**
 * Test data factory for generating user-related test data
 * Provides dynamic test data generation for varied testing scenarios
 */

import { build, fake, sequence } from 'test-data-bot';

export interface TestUser {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  createdOn: string;
  lastLogin?: string;
  preferences?: {
    language: string;
    timezone: string;
    notifications: boolean;
  };
}

export interface TestOAuthToken {
  access_token: string;
  refresh_token: string;
  token_type: 'Bearer';
  expires_in: number;
  scope: string;
  user_id: string;
}

/**
 * Factory for generating test users
 */
export const userFactory = build<TestUser>('User', {
  _id: sequence((x: number) => `user_${x.toString().padStart(5, '0')}`),
  email: fake((f) => f.internet.email()),
  firstName: fake((f) => f.person.firstName()),
  lastName: fake((f) => f.person.lastName()),
  avatar: fake((f) => f.image.avatar()),
  createdOn: fake((f) => f.date.past().toISOString()),
  lastLogin: fake((f) => f.date.recent().toISOString()),
  preferences: {
    language: fake((f) => f.helpers.arrayElement(['en', 'fr', 'de', 'es', 'it'])),
    timezone: fake((f) => f.location.timeZone()),
    notifications: fake((f) => f.datatype.boolean()),
  },
});

/**
 * Factory for generating OAuth tokens
 */
export const oauthTokenFactory = build<TestOAuthToken>('OAuthToken', {
  access_token: sequence((x: number) => `wf_access_token_${x.toString().padStart(8, '0')}`),
  refresh_token: sequence((x: number) => `wf_refresh_token_${x.toString().padStart(8, '0')}`),
  token_type: 'Bearer',
  expires_in: fake((f) => f.number.int({ min: 3600, max: 7200 })),
  scope: 'sites:read sites:write cms:read cms:write pages:read pages:write',
  user_id: sequence((x: number) => `user_${x.toString().padStart(5, '0')}`),
});

/**
 * Factory for generating test admin users
 */
export const adminUserFactory = userFactory.extend({
  email: fake((f) => `admin+${f.string.alphanumeric(5)}@example.com`),
  preferences: {
    language: 'en',
    timezone: 'America/New_York',
    notifications: true,
  },
});

/**
 * Factory for generating test basic users
 */
export const basicUserFactory = userFactory.extend({
  preferences: {
    language: fake((f) => f.helpers.arrayElement(['en', 'fr', 'de'])),
    timezone: fake((f) => f.helpers.arrayElement(['America/New_York', 'Europe/London', 'Europe/Paris'])),
    notifications: false,
  },
});

/**
 * Utility functions for common user scenarios
 */
export const userFactoryUtils = {
  /**
   * Create a user with expired OAuth token
   */
  createUserWithExpiredToken: () => {
    const user = userFactory();
    const token = oauthTokenFactory({
      expires_in: -3600, // Expired 1 hour ago
      user_id: user._id,
    });
    return { user, token };
  },

  /**
   * Create a user with limited permissions
   */
  createUserWithLimitedPermissions: () => {
    const user = userFactory();
    const token = oauthTokenFactory({
      scope: 'sites:read pages:read', // Read-only permissions
      user_id: user._id,
    });
    return { user, token };
  },

  /**
   * Create a user with full permissions
   */
  createUserWithFullPermissions: () => {
    const user = adminUserFactory();
    const token = oauthTokenFactory({
      scope: 'sites:read sites:write cms:read cms:write pages:read pages:write',
      user_id: user._id,
    });
    return { user, token };
  },

  /**
   * Create multiple users for bulk testing
   */
  createMultipleUsers: (count: number) => {
    return Array.from({ length: count }, () => userFactory());
  },

  /**
   * Create a user for specific language testing
   */
  createUserForLanguage: (language: string) => {
    return userFactory({
      preferences: {
        language,
        timezone: 'UTC',
        notifications: true,
      },
    });
  },
};