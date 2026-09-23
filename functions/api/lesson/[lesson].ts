interface Env {
  FIREBASE_API_KEY: string
  FIREBASE_PROJECT_ID: string
  VIDEO_CATALOG_JSON: string
}

type PagesContext = {
  request: Request
  env: Env
  params: { lesson?: string | string[] }
}

const json = (data: unknown, status = 200) => new Response(JSON.stringify(data), {
  status,
  headers: {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'private, no-store, max-age=0',
    'x-content-type-options': 'nosniff',
    'referrer-policy': 'same-origin',
  },
})

async function verifyFirebaseUser(idToken: string, env: Env) {
  const response = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${encodeURIComponent(env.FIREBASE_API_KEY)}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ idToken }),
  })
  if (!response.ok) return null
  const payload = await response.json() as { users?: Array<{ localId?: string }> }
  return payload.users?.[0]?.localId || null
}

async function hasActiveAccess(uid: string, idToken: string, env: Env) {
  const path = `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(env.FIREBASE_PROJECT_ID)}/databases/(default)/documents/access/${encodeURIComponent(uid)}`
  const response = await fetch(path, { headers: { authorization: `Bearer ${idToken}` } })
  if (!response.ok) return false
  const payload = await response.json() as { fields?: { active?: { booleanValue?: boolean } } }
  return payload.fields?.active?.booleanValue === true
}

export const onRequestGet = async (context: PagesContext) => {
  try {
    if (!context.env.FIREBASE_API_KEY || !context.env.FIREBASE_PROJECT_ID || !context.env.VIDEO_CATALOG_JSON) {
      return json({ error: 'Servidor ainda não configurado.' }, 500)
    }

    const authorization = context.request.headers.get('authorization') || ''
    if (!authorization.startsWith('Bearer ')) return json({ error: 'Faça login para acessar esta aula.' }, 401)
    const idToken = authorization.slice(7).trim()
    if (!idToken) return json({ error: 'Sessão inválida.' }, 401)

    const uid = await verifyFirebaseUser(idToken, context.env)
    if (!uid) return json({ error: 'Sessão expirada. Entre novamente.' }, 401)

    const active = await hasActiveAccess(uid, idToken, context.env)
    if (!active) return json({ error: 'Seu acesso ao curso ainda não está liberado.' }, 403)

    const lessonParam = context.params.lesson
    const lesson = Array.isArray(lessonParam) ? lessonParam[0] : lessonParam
    if (!lesson || !/^aula-\d{2}$/.test(lesson)) return json({ error: 'Aula inválida.' }, 400)

    let catalog: Record<string, string>
    try {
      catalog = JSON.parse(context.env.VIDEO_CATALOG_JSON) as Record<string, string>
    } catch {
      return json({ error: 'Catálogo de vídeos inválido no servidor.' }, 500)
    }

    const youtubeId = catalog[lesson]
    if (!youtubeId || !/^[\w-]{11}$/.test(youtubeId)) return json({ error: 'Vídeo não encontrado.' }, 404)

    return json({ youtubeId })
  } catch {
    return json({ error: 'Erro interno ao abrir a aula.' }, 500)
  }
}
