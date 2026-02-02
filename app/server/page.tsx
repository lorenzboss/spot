import { withAuth } from '@workos-inc/authkit-nextjs';
import Link from 'next/link';

export default async function ServerPage() {
  const { user } = await withAuth();

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-4 p-8">
      <h1 className="text-center text-4xl font-bold">Convex + Next.js</h1>
      <div className="flex flex-col items-center gap-4">
        <p className="text-center">{user?.email}</p>
        <Link href="/" className="underline hover:no-underline">
          Back to home
        </Link>
      </div>
    </main>
  );
}
