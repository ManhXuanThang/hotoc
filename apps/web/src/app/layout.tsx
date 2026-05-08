import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Họ Tộc — Kết nối nguồn cội dòng tộc',
  description: 'Số hóa gia phả dòng họ, kết nối các thế hệ',
  manifest: '/manifest.json',
  themeColor: '#1C1A17',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <body>{children}</body>
    </html>
  )
}
