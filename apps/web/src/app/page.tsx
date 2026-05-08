'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function HomePage() {
  const router = useRouter()
  useEffect(() => {
    const token = localStorage.getItem('accessToken')
    router.push(token ? '/dashboard' : '/login')
  }, [])
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--ink)' }}>
      <div style={{ fontSize: 48 }}>🌳</div>
    </div>
  )
}
