/** Only allows same-origin relative paths as post-login redirects (prevents open redirects). */
export function safeCallbackUrl(value: string | null | undefined, fallback: string): string {
  if (!value?.startsWith('/') || value.startsWith('//') || value.startsWith('/\\')) {
    return fallback;
  }
  return value;
}
