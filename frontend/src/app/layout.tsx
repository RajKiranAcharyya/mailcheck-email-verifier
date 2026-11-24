import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'MailCheck – Email Verification & Hygiene Platform',
  description:
    'Full-stack email verification tool: syntax, disposable-domain, role-based and MX-record checks with two-level caching and asynchronous bulk jobs.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased font-sans">{children}</body>
    </html>
  );
}
