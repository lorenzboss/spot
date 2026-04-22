import { Link as HeroLink } from '@heroui/react';

export default function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white px-6 py-4">
      <div className="container mx-auto text-center text-sm text-slate-600">
        <p>
          Made by{' '}
          <HeroLink href="https://lorenzboss.com" target="_blank" rel="noopener noreferrer" className="text-blue-600">
            Lorenz Boss
          </HeroLink>{' '}
          | &copy; {new Date().getFullYear()}
        </p>
      </div>
    </footer>
  );
}
