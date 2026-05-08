import axios from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

export const api = axios.create({
  baseURL: `${API_URL}/api/v1`,
  headers: { 'Content-Type': 'application/json' },
})

// Tự động gắn token vào mọi request
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('accessToken')
    if (token) config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Auto refresh token khi hết hạn
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    if (error.response?.status === 401) {
      const refresh = localStorage.getItem('refreshToken')
      if (refresh) {
        try {
          const { data } = await axios.post(`${API_URL}/api/v1/auth/refresh`, { refreshToken: refresh })
          localStorage.setItem('accessToken', data.accessToken)
          localStorage.setItem('refreshToken', data.refreshToken)
          error.config.headers.Authorization = `Bearer ${data.accessToken}`
          return api(error.config)
        } catch {
          localStorage.clear()
          window.location.href = '/login'
        }
      }
    }
    return Promise.reject(error)
  }
)

// Auth
export const sendOtp = (phone: string) => api.post('/auth/send-otp', { phone })
export const verifyOtp = (phone: string, code: string) => api.post('/auth/verify-otp', { phone, code })

// Family
export const getMyFamilies = () => api.get('/families/me')
export const getFamily = (id: string) => api.get(`/families/${id}`)
export const createFamily = (data: any) => api.post('/families', data)

// Tree
export const getFamilyTree = (familyId: string) => api.get(`/families/${familyId}/tree`)

// Person
export const getPerson = (id: string) => api.get(`/persons/${id}`)
export const createPerson = (data: any) => api.post('/persons', data)
export const updatePerson = (id: string, data: any) => api.patch(`/persons/${id}`, data)
