'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Topbar from '@/components/Topbar'
import Sidebar from '@/components/Sidebar'
import { getFamily, getFamilyTree, getPerson } from '@/lib/api'

export default function PersonProfilePage() {
  const router = useRouter()
  const params = useParams<{ id: string; personId: string }>()
  const familyId = params.id
  const personId = params.personId
  const [family, setFamily] = useState<any>(null)
  const [person, setPerson] = useState<any>(null)
  const [memberCount, setMemberCount] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!localStorage.getItem('accessToken')) {
      router.push('/login')
      return
    }
    Promise.all([getFamily(familyId), getFamilyTree(familyId), getPerson(personId)])
      .then(([familyRes, treeRes, personRes]) => {
        setFamily(familyRes.data)
        setMemberCount(treeRes.data.totalPersons ?? treeRes.data.persons?.length ?? 0)
        setPerson(personRes.data)
      })
      .catch((e) => {
        if (e.response?.status === 401) router.push('/login')
      })
      .finally(() => setLoading(false))
  }, [familyId, personId, router])

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
        <Topbar familyId={familyId} />
        <div style={{ maxWidth: 920, margin: '0 auto', padding: 20, display: 'grid', gap: 10 }}>
          <div className="loading-skeleton" style={{ height: 180 }} />
          <div className="loading-skeleton" style={{ height: 120 }} />
        </div>
      </div>
    )
  }

  if (!person) {
    return (
      <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: 'var(--bg)', padding: 20 }}>
        <div className="empty-state">
          <div className="empty-state-icon">?</div>
          <h1 style={{ marginBottom: 8 }}>Không tìm thấy thành viên</h1>
          <Link href={`/family/${familyId}/members`} className="btn btn-primary" style={{ textDecoration: 'none' }}>Về danh sách</Link>
        </div>
      </main>
    )
  }

  const relations = [...(person.relationsAsSource ?? []), ...(person.relationsAsTarget ?? [])]

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <Topbar familyId={familyId} />
      <div className="app-layout">
        <Sidebar familyId={familyId} familyName={family?.name ?? 'Dòng họ'} memberCount={memberCount} />
        <main className="main-content" style={{ overflow: 'auto' }}>
          <div style={{ maxWidth: 920, width: '100%', padding: 20, margin: '0 auto 80px' }}>
            <section style={heroStyle}>
              <div style={{ width: 72, height: 72, borderRadius: '50%', background: person.gender === 'FEMALE' ? 'var(--female-bg)' : 'var(--male-bg)', color: person.gender === 'FEMALE' ? 'var(--female-text)' : 'var(--male-text)', display: 'grid', placeItems: 'center', fontSize: 30, fontWeight: 800, marginBottom: 14 }}>
                {person.fullName.split(' ').pop()?.[0]?.toUpperCase() ?? '?'}
              </div>
              <h1 style={{ color: '#fff', fontSize: 34, marginBottom: 6 }}>{person.fullName}</h1>
              <p style={{ color: 'rgba(255,255,255,.72)' }}>
                Đời {person.generationNum ?? '?'} · {person.isAlive ? 'Còn sống' : 'Đã mất'}{person.isRootAncestor ? ' · Thủy tổ' : ''}
              </p>
            </section>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 14, marginTop: 14 }}>
              <section style={cardStyle}>
                <h2 style={titleStyle}>Thông tin</h2>
                <Info label="Giới tính" value={genderName(person.gender)} />
                <Info label="Ngày sinh" value={dateText(person.birthDate)} />
                <Info label="Ngày mất" value={dateText(person.deathDate)} />
                <Info label="Quê quán" value={person.hometown || 'Chưa cập nhật'} />
                <Info label="Nơi ở hiện tại" value={person.currentLocation || 'Chưa cập nhật'} />
                <Info label="Nghề nghiệp" value={person.occupation || 'Chưa cập nhật'} />
              </section>

              <section style={cardStyle}>
                <h2 style={titleStyle}>Quan hệ</h2>
                {relations.length === 0 ? (
                  <p style={{ color: 'var(--ink3)' }}>Chưa có quan hệ trong cây.</p>
                ) : relations.slice(0, 12).map((relation: any, index: number) => {
                  const related = relation.relatedPerson ?? relation.person
                  return (
                    <Link key={`${relation.id ?? related?.id}-${index}`} href={`/family/${familyId}/person/${related?.id}`} style={{ display: 'block', padding: '10px 0', borderBottom: '1px solid var(--border)', textDecoration: 'none' }}>
                      <div style={{ color: 'var(--ink)', fontWeight: 700 }}>{related?.fullName}</div>
                      <div style={{ color: 'var(--ink3)', fontSize: 12 }}>{relationName(relation.relationType)}</div>
                    </Link>
                  )
                })}
              </section>
            </div>

            <section style={{ ...cardStyle, marginTop: 14 }}>
              <h2 style={titleStyle}>Câu chuyện cuộc đời</h2>
              {person.bio ? (
                <div style={{ whiteSpace: 'pre-wrap', fontSize: 15, lineHeight: 1.8, color: 'var(--ink2)' }}>{person.bio}</div>
              ) : (
                <div className="empty-state" style={{ padding: 18 }}>
                  <div className="empty-state-icon">+</div>
                  <p style={{ color: 'var(--ink3)' }}>Thêm câu chuyện cuộc đời từ trang hồ sơ của bạn hoặc đề xuất cập nhật cho admin.</p>
                </div>
              )}
            </section>
          </div>
        </main>
      </div>
    </div>
  )
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
      <span style={{ color: 'var(--ink3)' }}>{label}</span>
      <strong style={{ color: 'var(--ink)', textAlign: 'right' }}>{value}</strong>
    </div>
  )
}

function dateText(value?: string | null) {
  return value ? new Date(value).toLocaleDateString('vi-VN') : 'Chưa cập nhật'
}

function genderName(value?: string) {
  if (value === 'MALE') return 'Nam'
  if (value === 'FEMALE') return 'Nữ'
  return 'Chưa rõ'
}

function relationName(value?: string) {
  const labels: Record<string, string> = {
    PARENT: 'Cha/mẹ - con',
    ADOPTED_PARENT: 'Cha/mẹ nuôi',
    SPOUSE: 'Vợ/chồng',
    EX_SPOUSE: 'Vợ/chồng cũ',
    SIBLING: 'Anh/chị/em',
    HALF_SIBLING: 'Anh/chị/em cùng cha hoặc mẹ',
  }
  return labels[value ?? ''] ?? 'Quan hệ'
}

const heroStyle: React.CSSProperties = {
  background: 'var(--topbar)',
  borderRadius: 14,
  padding: 24,
}

const cardStyle: React.CSSProperties = {
  background: 'var(--card)',
  border: '1px solid var(--border)',
  borderRadius: 14,
  padding: 18,
}

const titleStyle: React.CSSProperties = {
  fontSize: 20,
  marginBottom: 12,
}
