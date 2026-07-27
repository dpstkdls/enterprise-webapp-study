export const isAccountExpired = (
	expiresAt: Date | null | undefined,
	now: Date,
): boolean => expiresAt != null && expiresAt <= now;
