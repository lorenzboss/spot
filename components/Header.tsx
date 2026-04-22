'use client';

import { api } from '@/convex/_generated/api';
import { Button, Chip } from '@heroui/react';
import { useAuthActions } from '@convex-dev/auth/react';
import { useConvexAuth, useQuery } from 'convex/react';
import { LogOut, Settings, UsersRound } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

const TEN_MINUTES_MS = 10 * 60 * 1000;

const MORNING_GREETINGS = ['Good morning, %s', 'Morning, %s', 'Hey there, %s', 'Ready to play, %s?'];
const MIDDAY_GREETINGS = ['Hello, %s', 'Hi there, %s', 'Good day, %s', 'Hey, %s', 'How are you, %s?'];
const AFTERNOON_GREETINGS = ['Good afternoon, %s', 'Hi again, %s', 'Welcome back, %s', 'All good, %s?'];
const EVENING_GREETINGS = ['Good evening, %s', 'Evening, %s', 'How was your day, %s?', 'Nice to see you, %s'];
const NIGHT_GREETINGS = ['Good night, %s', 'Still up, %s?', 'Late hello, %s', 'One more game, %s?', 'Long day, %s?'];

function formatGreeting(template: string, username: string) {
  return template.replace('%s', username);
}

function getGreetingByLocalTime(date: Date) {
  const hour = date.getHours();
  let greetings = NIGHT_GREETINGS;

  if (hour >= 5 && hour < 11) greetings = MORNING_GREETINGS;
  else if (hour >= 11 && hour < 15) greetings = MIDDAY_GREETINGS;
  else if (hour >= 15 && hour < 19) greetings = AFTERNOON_GREETINGS;
  else if (hour >= 19 && hour < 23) greetings = EVENING_GREETINGS;

  const tenMinuteBucket = Math.floor(date.getTime() / TEN_MINUTES_MS);
  const index = tenMinuteBucket % greetings.length;
  return greetings[index];
}

export default function Header() {
  const { isAuthenticated } = useConvexAuth();
  const { signOut } = useAuthActions();
  const router = useRouter();
  const currentUser = useQuery(api.userFunctions.getCurrentUser);
  const [greetingTemplate] = useState(() => getGreetingByLocalTime(new Date()));

  async function handleSignOut() {
    await signOut();
    router.replace('/');
  }

  return (
    <header className="bg-background sticky top-0 z-10 border-b border-slate-200 px-3 py-2">
      <div className="container mx-auto flex h-8.5 flex-row items-center justify-between">
        <Link href="/" className="text-xl font-semibold transition-opacity hover:opacity-80">
          Spot
        </Link>
        {isAuthenticated && (
          <div className="flex items-center sm:gap-2">
            {currentUser?.username && (
              <Chip size="sm" variant="soft" className="max-w-50 truncate bg-slate-100 text-slate-600 sm:max-w-none">
                {formatGreeting(greetingTemplate, currentUser.username)}
              </Chip>
            )}
            {currentUser?.role === 'admin' && (
              <Button
                isIconOnly
                variant="ghost"
                title="Admin Panel"
                aria-label="Admin Panel"
                className="text-blue-600 hover:bg-blue-50 hover:text-blue-700"
                onPress={() => router.push('/admin')}
              >
                <UsersRound className="h-4.5 w-4.5" />
              </Button>
            )}
            <Button
              isIconOnly
              variant="ghost"
              title="Settings"
              aria-label="Settings"
              className="text-blue-600 hover:bg-blue-50 hover:text-blue-700"
              onPress={() => router.push('/settings')}
            >
              <Settings className="h-4.5 w-4.5" />
            </Button>
            <Button
              isIconOnly
              variant="ghost"
              onPress={() => void handleSignOut()}
              title="Sign out"
              aria-label="Sign out"
              className="text-blue-600 hover:bg-blue-50 hover:text-blue-700"
            >
              <LogOut className="h-4.5 w-4.5" />
            </Button>
          </div>
        )}
      </div>
    </header>
  );
}
