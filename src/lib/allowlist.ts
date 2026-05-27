// Approved emails that can sign up and access the app
// Add or remove emails here to control access
export const APPROVED_EMAILS = [
  'thetopridge@gmail.com',
]

export function isApprovedEmail(email: string): boolean {
  return APPROVED_EMAILS.includes(email.toLowerCase().trim())
}
