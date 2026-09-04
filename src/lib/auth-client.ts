import { useSession } from 'next-auth/react';

export { useSession };

export function useRequireAuth() {
  const session = useSession();
  if (session.status === 'unauthenticated') {
    throw new Error('Not authenticated');
  }
  return session;
}
