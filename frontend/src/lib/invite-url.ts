/** URL publique pour accepter une invitation par token */
export function buildInviteUrl(token: string): string {
  if (typeof window !== "undefined") {
    return `${window.location.origin}/invite/${token}`
  }
  return `/invite/${token}`
}
