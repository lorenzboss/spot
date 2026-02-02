import { withAuth } from '@workos-inc/authkit-nextjs';
import Link from 'next/link';

export default async function ServerPage() {
  const { user } = await withAuth();

  return (
    <main className="p-8 flex flex-col gap-4 mx-auto max-w-2xl">
      <h1 className="text-4xl font-bold text-center">Convex + Next.js</h1>
      <div className="flex flex-col gap-4 items-center">
        <p className="text-center">{user?.email}</p>
        <Link href="/" className="underline hover:no-underline">
          Back to home
        </Link>
      </div>
    </main>
  );
}
