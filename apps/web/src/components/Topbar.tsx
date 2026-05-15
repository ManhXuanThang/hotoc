'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function Topbar({ familyId }: { familyId?: string }) {
  const pathname = usePathname()
  const router = useRouter()
  const [initials, setInitials] = useState('U')

  useEffect(() => {
    const name = localStorage.getItem('displayName') ?? 'User'
    setInitials(name.split(' ').pop()?.[0]?.toUpperCase() ?? 'U')
  }, [])

  return (
    <div className="topbar">
      <Link href="/dashboard" className="topbar-logo">
        🌳 <span style={{ fontWeight: 700 }}>Họ Tộc</span>
      </Link>
      {familyId && (
        <nav className="topbar-nav">
          <Link href={`/family/${familyId}/tree`} className={pathname.includes('/tree') ? 'active' : ''}>
            🌳 Cây gia phả
          </Link>
          <Link href="/dashboard" className="">
            🏠 Trang chủ
          </Link>
          <Link href={`/family/${familyId}/admin`} className={pathname.includes('/admin') ? 'active' : ''}>
            ⚙️ Quản lý
          </Link>
        </nav>
      )}
      <div className="topbar-right">
        {familyId && (
          <button 
            className="btn btn-primary" 
            onClick={() => router.push(`/family/${familyId}/add`)}
            style={{ marginRight: 8 }}
          >
            ✨ Thêm thành viên
          </button>
        )}
        <Link href="/profile" className="topbar-avatar" title="Hồ sơ của tôi" style={{ textDecoration: 'none' }}>
          {initials}
        </Link>
      </div>
    </div>
  )
}
