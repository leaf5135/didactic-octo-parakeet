// src/app/layout.tsx (no "use client")
import './globals.css';
import { ReactNode } from 'react';
import ConvexClientProvider from './ConvexClientProvider';

export const metadata = {
  title: 'Minimal Todo',
  description: 'Built with Next.js, Convex, Tailwind',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ConvexClientProvider>{children}</ConvexClientProvider>
      </body>
    </html>
  );
}
