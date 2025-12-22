// src/app/layout.tsx
import '@/app/globals.css';
import { Toaster } from 'sonner';
import { Inter } from 'next/font/google';
import { siteMetadata } from '@/lib/config/metadata';
import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from "@vercel/speed-insights/next"
import { cn } from '@/lib/utils';

const inter = Inter({ subsets: ['latin'] });

// Use the comprehensive metadata configuration
export const metadata = siteMetadata;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/logo.png" />
      </head>
      <body className={cn(inter.className)}>
        {children}
        <Analytics />
        <SpeedInsights/>
        <Toaster position="bottom-right" />
      </body>
    </html>
  );
}