'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Topbar from '@/components/Topbar'
import Sidebar from '@/components/Sidebar'
import { getFamily, getFamilyTree } from '@/lib/api'

export default function PhotosPage() {
  const router = useRouter()
  const params = useParams<{ id: string }>()
  const familyId = params.id
  const [family, setFamily] = useState<any>(null)
  const [memberCount, setMemberCount] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!localStorage.getItem('accessToken')) {
      router.push('/login')
      return
    }
    Promise.all([getFamily(familyId), getFamilyTree(familyId)])
      .then(([familyRes, treeRes]) => {
        setFamily(familyRes.data)
        setMemberCount(treeRes.data.totalPersons ?? treeRes.data.persons?.length ?? 0)
      })
      .finally(() => setLoading(false))
  }, [familyId, router])

  if (loading) return <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}>Đang tải...</main>

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <Topbar familyId={familyId} />
      <div className="app-layout">
        <Sidebar familyId={familyId} familyName={family?.name ?? 'Dòng họ'} memberCount={memberCount} />
        <main className="main-content" style={{ overflow: 'auto' }}>
          <div style={{ maxWidth: 840, width: '100%', padding: 20, margin: '0 auto 80px' }}>
            <div className="empty-state">
              <div className="empty-state-icon">+</div>
              <h1 style={{ fontSize: 28, marginBottom: 8 }}>Ảnh kỷ niệm đang phát triển</h1>
              <p style={{ color: 'var(--ink3)', maxWidth: 560, margin: '0 auto' }}>
                Khu vực này sẽ dùng để lưu ảnh nhà thờ họ, ảnh các cụ và album theo từng nhánh. Hiện tại dữ liệu gia phả vẫn được giữ trong cây và hồ sơ thành viên.
              </p>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
