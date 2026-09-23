import { readFileSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { resolve, relative, isAbsolute } from 'node:path'
import { fileURLToPath } from 'node:url'
const [projectName, file] = process.argv.slice(2)
if (!projectName || !file || !/^[a-z0-9-]+$/.test(projectName)) {
  console.error('Uso: npm run cf:video-secret -- PROJETO_PAGES CAMINHO_JSON_FORA_DO_REPOSITORIO')
  process.exit(1)
}
const root = fileURLToPath(new URL('../', import.meta.url))
const path = resolve(file)
const rel = relative(root, path)
if (!rel.startsWith('..') && !isAbsolute(rel)) {
  console.error('Mantenha o catálogo fora do repositório.'); process.exit(1)
}
let catalog
try {
  catalog = JSON.parse(readFileSync(path, 'utf8').replace(/^\uFEFF/, ''))
  if (!catalog || Array.isArray(catalog) || Object.keys(catalog).length !== 71) throw new Error()
  for (let i = 1; i <= 71; i++) {
    if (!/^[\w-]{11}$/.test(catalog[`aula-${String(i).padStart(2, '0')}`] ?? '')) throw new Error()
  }
} catch {
  console.error('Arquivo inválido: informe um JSON com as 71 aulas e IDs válidos.'); process.exit(1)
}
const cli = fileURLToPath(new URL('../node_modules/wrangler/bin/wrangler.js', import.meta.url))
const result = spawnSync(process.execPath, [cli, 'pages', 'secret', 'put', 'VIDEO_CATALOG_JSON', '--project-name', projectName], {
  input: `${JSON.stringify(catalog)}\n`, stdio: ['pipe', 'inherit', 'inherit'], shell: false,
})
if (result.error) console.error('Não foi possível executar o Wrangler.')
process.exit(result.status ?? 1)
