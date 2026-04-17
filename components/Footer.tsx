export default function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white px-6 py-4 dark:border-slate-800 dark:bg-slate-900">
      <div className="container mx-auto text-center text-sm text-slate-600 dark:text-slate-400">
        <p>
          Made by{' '}
          <a
            href="https://lorenzboss.com"
            className="transition-colors hover:text-indigo-600 dark:hover:text-indigo-400"
          >
            Lorenz Boss
          </a>{' '}
          | &copy; {new Date().getFullYear()}
        </p>
      </div>
    </footer>
  );
}
