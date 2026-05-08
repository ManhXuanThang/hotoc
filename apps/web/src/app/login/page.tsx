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
      router.push('/dashboard')
    } catch (e: any) {
      setError(e.response?.data?.message || 'OTP không đúng')
    } finally { setLoading(false) }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--ink)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ marginBottom: 32, textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>🌳</div>
        <h1 style={{ color: '#fff', fontSize: 28, marginBottom: 4 }}>Họ Tộc</h1>
        <p style={{ color: 'rgba(255,255,255,.45)', fontSize: 14 }}>Kết nối nguồn cội dòng tộc</p>
      </div>

      <div style={{ background: 'var(--sand)', borderRadius: 20, padding: 28, width: '100%', maxWidth: 360 }}>
        {step === 'phone' ? (
          <>
            <h2 style={{ fontSize: 20, marginBottom: 4 }}>Đăng nhập</h2>
            <p style={{ color: 'var(--ink3)', fontSize: 13, marginBottom: 20 }}>Nhập số điện thoại để nhận mã OTP</p>
            <label style={labelStyle}>Số điện thoại</label>
            <input style={inputStyle} value={phone} onChange={e => setPhone(e.target.value)}
              placeholder="+84 091 234 5678" type="tel" />
            {error && <p style={errorStyle}>{error}</p>}
            <button style={btnStyle} onClick={handleSendOtp} disabled={loading}>
              {loading ? 'Đang gửi...' : 'Gửi mã OTP'}
            </button>
          </>
        ) : (
          <>
            <h2 style={{ fontSize: 20, marginBottom: 4 }}>Nhập mã OTP</h2>
            <p style={{ color: 'var(--ink3)', fontSize: 13, marginBottom: 20 }}>Đã gửi đến {phone}</p>
            <label style={labelStyle}>Mã 6 số</label>
            <input style={{ ...inputStyle, fontSize: 24, letterSpacing: 8, textAlign: 'center' }}
              value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="000000" maxLength={6} />
            {error && <p style={errorStyle}>{error}</p>}
            <button style={btnStyle} onClick={handleVerifyOtp} disabled={loading}>
              {loading ? 'Đang xác minh...' : 'Xác nhận'}
            </button>
            <button style={{ ...btnStyle, background: 'transparent', color: 'var(--ink3)', border: '1px solid var(--sand3)', marginTop: 8 }}
              onClick={() => { setStep('phone'); setOtp(''); setError('') }}>
              Quay lại
            </button>
          </>
        )}
      </div>
    </div>
  )
}

const labelStyle: React.CSSProperties = { fontSize: 11, fontWeight: 600, color: 'var(--ink3)', letterSpacing: '.05em', textTransform: 'uppercase', display: 'block', marginBottom: 6 }
const inputStyle: React.CSSProperties = { background: '#fff', border: '1px solid var(--sand3)', borderRadius: 10, padding: '12px 14px', fontSize: 15, color: 'var(--ink)', width: '100%', marginBottom: 14, fontFamily: 'inherit' }
const btnStyle: React.CSSProperties = { background: 'var(--ink)', color: '#fff', border: 'none', borderRadius: 10, padding: 14, width: '100%', fontSize: 15, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }
const errorStyle: React.CSSProperties = { color: 'var(--red)', fontSize: 12, marginBottom: 10 }
