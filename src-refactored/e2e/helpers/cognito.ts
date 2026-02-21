/**
 * Cognito admin helpers for E2E tests.
 * Uses AWS CLI to manage test users — requires valid AWS credentials.
 */

import { execSync } from 'child_process';

const USER_POOL_ID = 'eu-north-1_99e6Bvwmy';
const REGION = 'eu-north-1';
// Use full path on Windows since AWSCLIV2 may not be on cmd.exe PATH
const AWS = process.platform === 'win32'
  ? '"C:\\Program Files\\Amazon\\AWSCLIV2\\aws.exe"'
  : 'aws';

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
    `${AWS} cognito-idp admin-confirm-sign-up --user-pool-id ${USER_POOL_ID} --username "${email}" --region ${REGION}`,
    { stdio: 'pipe' }
  );
}

/** Admin-delete a Cognito user */
export function adminDeleteUser(email: string): void {
  try {
    execSync(
      `${AWS} cognito-idp admin-delete-user --user-pool-id ${USER_POOL_ID} --username "${email}" --region ${REGION}`,
      { stdio: 'pipe' }
    );
  } catch {
    // User may already be deleted — ignore
  }
}

/**
 * Admin-create a Cognito user with a permanent password (no email sent).
 * Uses --message-action SUPPRESS to skip the verification email.
 * Sets the password as permanent via admin-set-user-password.
 */
export function adminCreateUser(user: TestUser): void {
  // Create the user with SUPPRESS (no email triggered)
  execSync(
    `${AWS} cognito-idp admin-create-user ` +
    `--user-pool-id ${USER_POOL_ID} ` +
    `--username "${user.email}" ` +
    `--user-attributes Name=email,Value="${user.email}" Name=email_verified,Value=true Name=name,Value="${user.name}" ` +
    `--message-action SUPPRESS ` +
    `--region ${REGION}`,
    { stdio: 'pipe' }
  );

  // Set a permanent password (moves from FORCE_CHANGE_PASSWORD to CONFIRMED)
  execSync(
    `${AWS} cognito-idp admin-set-user-password ` +
    `--user-pool-id ${USER_POOL_ID} ` +
    `--username "${user.email}" ` +
    `--password "${user.password}" ` +
    `--permanent ` +
    `--region ${REGION}`,
    { stdio: 'pipe' }
  );
}

/** Check if a Cognito user exists and return their status */
export function adminGetUser(email: string): { status: string } | null {
  try {
    const output = execSync(
      `${AWS} cognito-idp admin-get-user --user-pool-id ${USER_POOL_ID} --username "${email}" --region ${REGION} --query "UserStatus" --output text`,
      { stdio: 'pipe' }
    );
    return { status: output.toString().trim() };
  } catch {
    return null;
  }
}
