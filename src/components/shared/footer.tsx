// src/components/shared/footer.tsx
import Link from 'next/link';

export function Footer() {
  return (
    <footer className="border-t">
      <div className="container py-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} AI Lounge After Dark. All rights
            reserved.
          </p>
          <div className="flex items-center gap-4">
            <Link href="/pricing" className="hover:text-primary transition">
              Pricing
            </Link>
            <Link href="/login" className="hover:text-primary transition">
              Login
            </Link>
            <Link href="/signup" className="hover:text-primary transition">
              Sign up
            </Link>
            <Link href="#" className="hover:text-primary transition">
              Terms
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}