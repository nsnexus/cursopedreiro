import { test } from 'node:test'
import assert from 'node:assert/strict'
import { onRequestGet } from '../functions/api/lesson/[lesson].ts'

test('API protege vídeos e não retorna o catálogo', async (t) => {
  const original = globalThis.fetch
  t.after(() => { globalThis.fetch = original })
  const fakeId = 'x'.repeat(11)
  const env = { FIREBASE_API_KEY: 'test', FIREBASE_PROJECT_ID: 'test', VIDEO_CATALOG_JSON: JSON.stringify({ 'aula-01': fakeId, 'aula-02': 'y'.repeat(11) }) }
  let calls = 0
  let valid = true
  let active = true
  globalThis.fetch = async (url) => {
    calls++
    return String(url).includes('accounts:lookup')
      ? new Response(JSON.stringify(valid ? { users: [{localId:'student'}] } : {}), {status:valid ? 200 : 400})
      : Response.json({fields:{active:{booleanValue:active}}})
  }
  const request = (token = 'test', lesson = 'aula-01', bindings = env) => onRequestGet({request:new Request('https://example.test/api/lesson/'+lesson,{headers:token ? {authorization:'Bearer '+token} : {}}),env:bindings,params:{lesson}})
  assert.equal((await request('', 'aula-01')).status, 401)
  assert.equal(calls, 0)
  valid = false
  assert.equal((await request()).status, 401)
  valid = true; active = false
  assert.equal((await request()).status, 403)
  active = true
  const ok = await request()
  assert.equal(ok.status, 200)
  assert.match(ok.headers.get('cache-control'), /no-store/)
  assert.deepEqual(await ok.json(), {youtubeId:fakeId})
  assert.equal((await request('test','invalid')).status,400)
  assert.equal((await request('test','aula-99')).status,404)
  assert.equal((await request('test','aula-01',{...env,VIDEO_CATALOG_JSON:'{'})).status,500)
  assert.equal((await request('test','aula-01',{...env,FIREBASE_API_KEY:''})).status,500)
  globalThis.fetch = async () => {throw new Error('network')}
  assert.equal((await request()).status,500)
})
