import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { safeCallbackFromUrl } from "@/lib/auth/safe-callback-path";
import { signinLimiter } from "@/lib/rate-limiting/rate-limiter";
import { WorkspaceRepository } from "@/modules/workspace/repository";

const googleClientId =
  process.env.AUTH_GOOGLE_ID?.trim() || process.env.GOOGLE_ID?.trim() || '';
const googleClientSecret =
  process.env.AUTH_GOOGLE_SECRET?.trim() || process.env.GOOGLE_SECRET?.trim() || '';
const googleConfigured = Boolean(googleClientId && googleClientSecret);
const AUTH_DEBUG = process.env.AUTH_DEBUG === "1";

export const { handlers, signIn, signOut, auth } = NextAuth({
  trustHost: true,
  secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET,
  providers: [
    ...(googleConfigured
      ? [
          Google({
            clientId: googleClientId,
            clientSecret: googleClientSecret,
            authorization: {
              params: {
                prompt: "select_account",
              },
            },
          }),
        ]
      : []),
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const limitResult = signinLimiter.check(credentials.email as string);
        if (!limitResult.allowed) {
          console.warn(`[Auth] Rate limit exceeded for email: ${credentials.email}`);
          return null;
        }

        try {
          const user = await prisma.user.findUnique({
            where: { email: credentials.email as string },
            select: {
              id: true,
              email: true,
              name: true,
              passwordHash: true,
            },
          });

          if (!user?.passwordHash) {
            return null;
          }

          const isValidPassword = await bcrypt.compare(
            credentials.password as string,
            user.passwordHash
          );

          if (!isValidPassword) {
            return null;
          }

          return {
            id: user.id,
            email: user.email,
            name: user.name,
          };
        } catch (error) {
          console.error("Authentication error:", error);
          const msg = error instanceof Error ? error.message : "";
          if (/P1001|P1017|ECONNREFUSED|Can't reach database|DatabaseNotReachable/i.test(msg)) {
            console.error(
              "[flowforge] Sign-in failed: PostgreSQL unreachable. Fix DATABASE_URL and ensure Postgres runs on this server. See DEPLOYMENT.md."
            );
          }
          return null;
        }
      },
    }),
  ],

  pages: {
    signIn: "/sign-in",
  },

  session: {
    strategy: "jwt",
  },

  callbacks: {
    /**
     * Same-origin only; path must pass safeCallbackPath (mitigate open redirects after OAuth).
     * Default fallback matches post-login routing used elsewhere.
     */
    async redirect({ url, baseUrl }) {
      const fallback = `${baseUrl}/workspace/redirects`;
      const safe = safeCallbackFromUrl(url, baseUrl);

      if (AUTH_DEBUG) {
        let parsedOrigin: string | null = null;
        let baseOrigin: string | null = null;
        let parsedPath: string | null = null;
        try {
          const base = new URL(baseUrl);
          const parsed = new URL(url, baseUrl);
          baseOrigin = base.origin;
          parsedOrigin = parsed.origin;
          parsedPath = `${parsed.pathname}${parsed.search}`;
        } catch {
          // ignore parse errors
        }
        console.log("[auth.redirect]", {
          url,
          baseUrl,
          baseOrigin,
          parsedOrigin,
          parsedPath,
          safe,
          decision: safe ? "allow" : "fallback",
        });
      }

      return safe ? `${baseUrl}${safe}` : fallback;
    },

    async jwt({ token, user, account, profile }) {
      if (account?.provider === "google" && profile && "email" in profile && profile.email) {
        const email = String(profile.email).toLowerCase();
        const name = typeof profile.name === "string" ? profile.name : null;

        const dbUser = await prisma.user.upsert({
          where: { email },
          create: {
            email,
            name: name ?? undefined,
            emailVerified: new Date(),
          },
          update: {
            name: name ?? undefined,
            emailVerified: new Date(),
          },
          select: { id: true },
        });

        const workspaceCount = await prisma.workspaceMember.count({
          where: { userId: dbUser.id, status: "ACTIVE" },
        });
        if (workspaceCount === 0) {
          const wsName = name ? `${name}'s Workspace` : "My Workspace";
          try {
            await WorkspaceRepository.create(wsName, `${dbUser.id}-personal`, dbUser.id);
          } catch (e) {
            console.error("[Auth] Google sign-in: bootstrap workspace failed", e);
            // Session still issued; /workspace/redirects sends users to /workspace/new if needed.
          }
        }

        token.id = dbUser.id;
        token.email = email;
        return token;
      }

      if (user) {
        token.id = user.id;
        if (user.email) token.email = user.email;
      }
      return token;
    },

    async session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id as string;
        if (token.email) {
          session.user.email = token.email as string;
        }
      }
      return session;
    },
  },
});
