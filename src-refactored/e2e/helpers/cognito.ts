/**
 * Cognito admin helpers for E2E tests.
 * Uses AWS CLI to manage test users — requires valid AWS credentials.
 */

import { execSync } from 'child_process';

const USER_POOL_ID = 'eu-north-1_99e6Bvwmy';
const REGION = 'eu-north-1';

export interface TestUser {
  email: string;
  password: string;
  name: string;
}

/** Generate a unique test user for each test run */
export function createTestUser(): TestUser {
  const id = Date.now();
  return {
    email: `e2e-test-${id}@test.woofapp.fi`,
    password: 'TestPass1!',
    name: `E2E Test ${id}`,
  };
}

/** Admin-confirm a Cognito user (bypasses email verification) */
export function adminConfirmUser(email: string): void {
  execSync(
    `aws cognito-idp admin-confirm-sign-up --user-pool-id ${USER_POOL_ID} --username "${email}" --region ${REGION}`,
    { stdio: 'pipe' }
  );
}

/** Admin-delete a Cognito user */
export function adminDeleteUser(email: string): void {
  try {
    execSync(
      `aws cognito-idp admin-delete-user --user-pool-id ${USER_POOL_ID} --username "${email}" --region ${REGION}`,
      { stdio: 'pipe' }
    );
  } catch {
    // User may already be deleted — ignore
  }
}

/** Check if a Cognito user exists and return their status */
export function adminGetUser(email: string): { status: string } | null {
  try {
    const output = execSync(
      `aws cognito-idp admin-get-user --user-pool-id ${USER_POOL_ID} --username "${email}" --region ${REGION} --query "UserStatus" --output text`,
      { stdio: 'pipe' }
    );
    return { status: output.toString().trim() };
  } catch {
    return null;
  }
}
