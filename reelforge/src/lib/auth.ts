import type { NextAuthOptions } from "next-auth";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import CredentialsProvider from "next-auth/providers/credentials";
import EmailProvider from "next-auth/providers/email";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";
import { provisionNewUser } from "./workspace";

// NextAuth config.
// - Sessions use the JWT strategy (required to mix in the Credentials provider).
// - The Prisma adapter still backs the Email (magic-link) provider and stores
//   users/accounts.
// - In dev, if no SMTP server is configured, magic links are printed to the
//   server console so you can log in without email infrastructure.

const hasSmtp = Boolean(process.env.EMAIL_SERVER_HOST);

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
    verifyRequest: "/login?verify=1",
  },
  providers: [
    CredentialsProvider({
      name: "Email & password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials.password) return null;
        const user = await prisma.user.findUnique({
          where: { email: credentials.email.toLowerCase() },
        });
        if (!user || !user.passwordHash) return null;
        const ok = await bcrypt.compare(credentials.password, user.passwordHash);
        if (!ok) return null;
        return { id: user.id, email: user.email, name: user.name };
      },
    }),
    EmailProvider({
      from: process.env.EMAIL_FROM || "ReelForge <no-reply@reelforge.app>",
      server: hasSmtp
        ? {
            host: process.env.EMAIL_SERVER_HOST,
            port: Number(process.env.EMAIL_SERVER_PORT || 587),
            auth: {
              user: process.env.EMAIL_SERVER_USER,
              pass: process.env.EMAIL_SERVER_PASSWORD,
            },
          }
        : undefined,
      // Dev fallback: log the magic link instead of sending an email.
      async sendVerificationRequest({ identifier, url }) {
        if (!hasSmtp) {
          console.log(`\n🔗 Magic link for ${identifier}:\n${url}\n`);
          return;
        }
        // With SMTP configured, NextAuth's default nodemailer path is used by
        // omitting this override in production; kept here for clarity.
        const nodemailer = await import("nodemailer");
        const transport = nodemailer.createTransport({
          host: process.env.EMAIL_SERVER_HOST,
          port: Number(process.env.EMAIL_SERVER_PORT || 587),
          auth: {
            user: process.env.EMAIL_SERVER_USER,
            pass: process.env.EMAIL_SERVER_PASSWORD,
          },
        });
        await transport.sendMail({
          to: identifier,
          from: process.env.EMAIL_FROM,
          subject: "Your ReelForge sign-in link",
          text: `Sign in to ReelForge:\n${url}\n`,
          html: `<p>Sign in to ReelForge:</p><p><a href="${url}">${url}</a></p>`,
        });
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.uid = user.id;
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.uid) {
        (session.user as { id?: string }).id = token.uid as string;
      }
      return session;
    },
  },
  events: {
    // Fires when the adapter creates a user (magic-link first sign-in).
    async createUser({ user }) {
      await provisionNewUser(user.id, user.name ?? user.email);
    },
  },
};

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}
