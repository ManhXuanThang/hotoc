'use client'
import { usePathname } from 'next/navigation'
import Link from 'next/link'

export default function Sidebar({ familyId, familyName, memberCount }: {
  familyId: string; familyName: string; memberCount: number
}) {
  const pathname = usePathname()
  const is = (path: string) => pathname.includes(path) ? 'sidebar-item active' : 'sidebar-item'

  return (
    <div className="sidebar">
      <div className="sidebar-section">📍 Dòng họ</div>
      <Link href={`/family/${familyId}/tree`} className={is('/tree')}>
        <i className="ti ti-hierarchy" aria-hidden="true" /> 
        <span>Cây gia phả</span>
      </Link>
      <Link href={`/family/${familyId}/members`} className={is('/members')}>
        <i className="ti ti-users" aria-hidden="true" />
        <span>Danh sách</span>
      </Link>
      <Link href={`/family/${familyId}/reminders`} className={is('/reminders')}>
        <i className="ti ti-candle" aria-hidden="true" />
        <span>Ngày giỗ</span>
        <span className="sidebar-badge">2</span>
      </Link>
      <Link href={`/family/${familyId}/photos`} className={is('/photos')}>
        <i className="ti ti-photo" aria-hidden="true" />
        <span>Ảnh kỷ niệm</span>
      </Link>
      
      <div className="sidebar-section">⚙️ Quản lý</div>
      <Link href={`/family/${familyId}/admin`} className={is('/admin')}>
        <i className="ti ti-shield" aria-hidden="true" />
        <span>Duyệt thay đổi</span>
        <span className="sidebar-badge">1</span>
      </Link>
      <Link href={`/family/${familyId}/invite`} className={is('/invite')}>
        <i className="ti ti-link" aria-hidden="true" />
        <span>Link mời</span>
      </Link>
      <Link href={`/family/${familyId}/settings`} className={is('/settings')}>
        <i className="ti ti-settings" aria-hidden="true" />
        <span>Cài đặt họ</span>
      </Link>
      
      <div className="sidebar-footer">
        <div className="sidebar-family-card">
          <div className="sidebar-family-name">👨‍👩‍👧‍👦 {familyName}</div>
          <div className="sidebar-family-sub">👥 {memberCount} thành viên</div>
          <div className="sidebar-family-role">👑 Vai trò: Trưởng họ</div>
        </div>
      </div>
    </div>
  )
}
