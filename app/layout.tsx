import { ConvexClientProvider } from '@/components/ConvexClientProvider';
import Footer from '@/components/Footer';
import Header from '@/components/Header';
import { ConvexAuthNextjsServerProvider } from '@convex-dev/auth/nextjs/server';
import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Spot',
  description: 'A memory game where you Select Pairs Online Together',
  icons: {
    icon: '/icon.svg',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <ConvexAuthNextjsServerProvider>
          <ConvexClientProvider>
            <div className="flex min-h-screen flex-col">
              <Header />
              <div className="flex flex-1 flex-col">{children}</div>
              <Footer />
            </div>
          </ConvexClientProvider>
        </ConvexAuthNextjsServerProvider>
      </body>
    </html>
  );
}
