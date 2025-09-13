import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Todo App with WebMCP',
  description: 'A server-side rendered todo app demonstrating react-mcp-attributes',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning={true}>
      <body>{children}</body>
    </html>
  )
}