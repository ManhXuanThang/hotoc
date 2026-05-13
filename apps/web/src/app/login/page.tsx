'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { sendOtp, verifyOtp } from '@/lib/api'
import { useAuthStore } from '@/store/auth.store'

export default function LoginPage() {
  const router = useRouter()
  const setTokens = useAuthStore(s => s.setTokens)
  const [phone, setPhone] = useState('+84')
  const [otp, setOtp] = useState('')
  const [step, setStep] = useState<'phone' | 'otp'>('phone')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSendOtp() {
    if (!phone || phone.length < 10) return setError('Nhập số điện thoại hợp lệ')
    setLoading(true); setError('')
    try {
      await sendOtp(phone)
      setStep('otp')
    } catch (e: any) {
      setError(e.response?.data?.message || 'Gửi OTP thất bại')
    } finally { setLoading(false) }
  }

  async function handleVerifyOtp() {
    if (otp.length !== 6) return setError('Nhập đủ 6 số OTP')
    setLoading(true); setError('')
    try {
      const { data } = await verifyOtp(phone, otp)
      setTokens(data.accessToken, data.refreshToken)
      const pendingInviteCode = localStorage.getItem('pendingInviteCode')
      if (pendingInviteCode) {
        router.push(`/join/${pendingInviteCode}`)
      } else {
        router.push('/dashboard')
      }
    } catch (e: any) {
      setError(e.response?.data?.message || 'OTP không đúng')
    } finally { setLoading(false) }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, var(--ink) 0%, #2a2620 100%)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, position: 'relative', overflow: 'hidden' }}>
      {/* Background decoration */}
      <div style={{ position: 'absolute', top: '-40%', right: '-10%', width: '500px', height: '500px', background: 'radial-gradient(circle, rgba(15,110,86,.1) 0%, transparent 70%)', borderRadius: '50%', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: '-20%', left: '-5%', width: '300px', height: '300px', background: 'radial-gradient(circle, rgba(200,150,12,.08) 0%, transparent 70%)', borderRadius: '50%', pointerEvents: 'none' }} />

      <div style={{ marginBottom: 40, textAlign: 'center', position: 'relative', zIndex: 1, animation: 'slideInDown 0.6s ease' }}>
        <div style={{ fontSize: 56, marginBottom: 16, animation: 'scaleIn 0.6s ease' }}>🌳</div>
        <h1 style={{ color: '#fff', fontSize: 32, marginBottom: 8, fontWeight: 700, fontFamily: 'Lora, serif' }}>Họ Tộc</h1>
        <p style={{ color: 'rgba(255,255,255,.6)', fontSize: 15, fontWeight: 500 }}>Kết nối nguồn cội dòng tộc</p>
      </div>

      <div style={{ background: 'rgba(255, 255, 255, 0.95)', borderRadius: 24, padding: 32, width: '100%', maxWidth: 380, boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)', backdropFilter: 'blur(10px)', position: 'relative', zIndex: 1, animation: 'slideInUp 0.6s cubic-bezier(0.2, 0, 0.38, 0.9)' }}>
        {step === 'phone' ? (
          <>
            <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8, color: 'var(--ink)', fontFamily: 'Lora, serif' }}>Đăng nhập</h2>
            <p style={{ color: 'var(--ink3)', fontSize: 14, marginBottom: 24 }}>Nhập số điện thoại để nhận mã OTP</p>
            
            <label style={labelStyle}>Số điện thoại</label>
            <input 
              style={inputStyle} 
              value={phone} 
              onChange={e => setPhone(e.target.value)}
              placeholder="+84 091 234 5678" 
              type="tel" 
              autoFocus
            />
            
            {error && <p style={errorStyle}>❌ {error}</p>}
            
            <button 
              style={{ ...btnStyle, ...(loading ? { opacity: 0.6, cursor: 'not-allowed' } : {}) }} 
              onClick={handleSendOtp} 
              disabled={loading}
            >
              {loading ? '⏳ Đang gửi...' : '📤 Gửi mã OTP'}
            </button>

            <p style={{ fontSize: 12, color: 'var(--ink4)', marginTop: 16, textAlign: 'center', lineHeight: 1.5 }}>
              ✓ OTP sẽ được gửi qua SMS<br/>✓ Hoàn toàn miễn phí
            </p>
          </>
        ) : (
          <>
            <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8, color: 'var(--ink)', fontFamily: 'Lora, serif' }}>Nhập mã OTP</h2>
            <p style={{ color: 'var(--ink3)', fontSize: 14, marginBottom: 24 }}>Đã gửi đến <strong>{phone}</strong></p>
            
            <label style={labelStyle}>Mã 6 số</label>
            <input 
              style={{ ...inputStyle, fontSize: 28, letterSpacing: 12, textAlign: 'center', fontWeight: 700, fontFamily: 'monospace' }}
              value={otp} 
              onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="000000" 
              maxLength={6}
              autoFocus
            />
            
            {error && <p style={errorStyle}>❌ {error}</p>}
            
            <button 
              style={{ ...btnStyle, ...(loading ? { opacity: 0.6, cursor: 'not-allowed' } : {}) }} 
              onClick={handleVerifyOtp} 
              disabled={loading}
            >
              {loading ? '⏳ Đang xác minh...' : '✓ Xác nhận'}
            </button>

            <button 
              style={{ ...btnBackStyle }}
              onClick={() => { setStep('phone'); setOtp(''); setError('') }}
            >
              ← Quay lại
            </button>
          </>
        )}
      </div>

      <p style={{ color: 'rgba(255,255,255,.4)', fontSize: 12, marginTop: 24, textAlign: 'center', position: 'relative', zIndex: 1 }}>
        Phiên bản: 0.1.0
      </p>
    </div>
  )
}

const labelStyle: React.CSSProperties = { 
  fontSize: 11, 
  fontWeight: 700, 
  color: 'var(--ink3)', 
  letterSpacing: '.05em', 
  textTransform: 'uppercase', 
  display: 'block', 
  marginBottom: 8 
}

const inputStyle: React.CSSProperties = { 
  background: '#fff', 
  border: '1.5px solid var(--border)', 
  borderRadius: 12, 
  padding: '14px 16px', 
  fontSize: 16, 
  color: 'var(--ink)', 
  width: '100%', 
  marginBottom: 16, 
  fontFamily: 'inherit',
  transition: 'all 0.25s cubic-bezier(0.2, 0, 0.38, 0.9)',
  boxSizing: 'border-box'
}

const btnStyle: React.CSSProperties = { 
  background: 'linear-gradient(135deg, var(--primary) 0%, #0e5d48 100%)', 
  color: '#fff', 
  border: 'none', 
  borderRadius: 12, 
  padding: 16, 
  width: '100%', 
  fontSize: 15, 
  fontWeight: 700, 
  cursor: 'pointer', 
  fontFamily: 'inherit',
  transition: 'all 0.25s cubic-bezier(0.2, 0, 0.38, 0.9)',
  boxShadow: '0 4px 12px rgba(15, 110, 86, 0.3)',
  marginTop: 8,
  marginBottom: 12
}

const btnBackStyle: React.CSSProperties = { 
  background: 'transparent', 
  color: 'var(--ink3)', 
  border: '1.5px solid var(--border)', 
  borderRadius: 12, 
  padding: 14, 
  width: '100%', 
  fontSize: 15, 
  fontWeight: 600, 
  cursor: 'pointer',
  fontFamily: 'inherit',
  transition: 'all 0.2s ease'
}

const errorStyle: React.CSSProperties = { 
  color: 'var(--red)', 
  fontSize: 13, 
  marginBottom: 12,
  padding: '10px 12px',
  background: 'var(--red2)',
  borderRadius: 10,
  fontWeight: 500
}
