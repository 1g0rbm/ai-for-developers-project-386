const API_BASE = import.meta.env.VITE_API_BASE_URL ?? ''

export class ApiHttpError extends Error {
  status: number
  code?: number

  constructor(status: number, message: string, code?: number) {
    super(message)
    this.name = 'ApiHttpError'
    this.status = status
    this.code = code
  }
}

async function parseErrorBody(res: Response): Promise<{ message: string; code?: number }> {
  try {
    const j: unknown = await res.json()
    if (j && typeof j === 'object' && 'message' in j && typeof (j as { message: unknown }).message === 'string') {
      const o = j as { message: string; code?: unknown }
      return {
        message: o.message,
        code: typeof o.code === 'number' ? o.code : undefined,
      }
    }
  } catch {
    /* empty */
  }
  return { message: res.statusText || String(res.status) }
}

export async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  const url = path.startsWith('http') ? path : `${API_BASE}${path}`
  const headers = new Headers(init?.headers)
  if (init?.body != null && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }
  const res = await fetch(url, { ...init, headers })
  if (res.status === 204) {
    return undefined as T
  }
  if (!res.ok) {
    const { message, code } = await parseErrorBody(res)
    throw new ApiHttpError(res.status, message, code)
  }
  const text = await res.text()
  if (!text) {
    return undefined as T
  }
  return JSON.parse(text) as T
}
