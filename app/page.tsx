'use client';

import Leaderboard from '@/components/Leaderboard';
import { Button, Card, Chip, Link as HeroLink } from '@heroui/react';
import { Authenticated, AuthLoading, Unauthenticated } from 'convex/react';
import { Gamepad2, Globe, Lock } from 'lucide-react';
import Link from 'next/link';

export default function Home() {
  return (
    <>
      <AuthLoading>{null}</AuthLoading>
      <Authenticated>
        <Content />
      </Authenticated>
      <Unauthenticated>
        <SignInForm />
      </Unauthenticated>
    </>
  );
}

function SignInForm() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-8 p-8">
      <Card className="w-full max-w-sm border border-slate-200 shadow-sm">
        <Card.Content className="p-10 text-center">
          <h1 className="mb-2 text-4xl font-bold tracking-tight">Spot</h1>
          <p className="mb-8 text-slate-500">Sign in to start playing</p>
          <div className="flex flex-col gap-3">
            <Button as={HeroLink} href="/sign-in" variant="primary">
              Sign in
            </Button>
            <Button as={HeroLink} href="/sign-up" variant="outline" className="text-slate-700">
              Create account
            </Button>
          </div>
        </Card.Content>
      </Card>
    </main>
  );
}

function Content() {
  return (
    <main className="container mx-auto flex flex-1 flex-col items-center justify-start gap-4 p-3 py-4 sm:gap-6 sm:p-8">
      {/* Game Modes Section */}
      <div className="grid w-full max-w-xl gap-3 sm:grid-cols-2">
        {/* Offline Mode */}
        <Link href="/play/offline" className="group">
          <Card className="border border-slate-200 transition-all group-hover:border-blue-400 group-hover:shadow-sm">
            <Card.Content className="flex items-center gap-3 p-3 sm:p-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-600 sm:h-12 sm:w-12">
                <Gamepad2 className="h-5 w-5 sm:h-6 sm:w-6" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-slate-800 sm:text-base">Offline Mode</h3>
                <p className="text-[11px] text-slate-500 sm:text-xs">Play solo</p>
              </div>
              <span className="text-slate-400 transition-transform group-hover:translate-x-1">→</span>
            </Card.Content>
          </Card>
        </Link>

        {/* Online Mode - Coming Soon */}
        <Card className="border border-slate-200 bg-slate-50 opacity-60">
          <Card.Content className="flex items-center gap-3 p-3 sm:p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-200 text-slate-400 sm:h-12 sm:w-12">
              <Globe className="h-5 w-5 sm:h-6 sm:w-6" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-slate-600 sm:text-base">Online Mode</h3>
              <p className="text-[11px] text-slate-500 sm:text-xs">Coming soon</p>
            </div>
            <Chip size="sm" variant="soft" className="bg-slate-200 text-slate-500">
              <Lock className="h-3.5 w-3.5" />
            </Chip>
          </Card.Content>
        </Card>
      </div>

      {/* Leaderboard Section */}
      <div className="w-full max-w-xl">
        <Leaderboard />
      </div>
    </main>
  );
}
