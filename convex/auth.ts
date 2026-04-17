import { Password } from '@convex-dev/auth/providers/Password';
import { convexAuth } from '@convex-dev/auth/server';

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [
    Password({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      profile(params): any {
        const email = params.email as string;
        if (params.flow === 'signUp') {
          const username = (params.username as string | undefined)?.trim().toLowerCase();
          if (!username) throw new Error('Username is required');
          if (!/^[a-zA-Z0-9-]+$/.test(username)) throw new Error('Username contains invalid characters');
          return { email, username };
        }
        return { email };
      },
    }),
  ],
});
