export default function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white px-6 py-4">
      <div className="container mx-auto text-center text-sm text-slate-600">
        <p>
          Made by{' '}
          <a href="https://lorenzboss.com" className="transition-colors hover:text-indigo-600">
            Lorenz Boss
          </a>{' '}
          | &copy; {new Date().getFullYear()}
        </p>
      </div>
    </footer>
  );
}
