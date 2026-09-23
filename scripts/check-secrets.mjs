import { execFileSync } from 'node:child_process'
import { readFileSync, readdirSync, existsSync } from 'node:fs'
import { join } from 'node:path'
// Never print matched values. Inspect the actual index before a commit.
const staged = process.argv.includes('--staged')
const files = execFileSync('git', staged ? ['diff', '--cached', '--name-only', '--diff-filter=ACMR', '-z'] : ['ls-files', '-z'], { encoding: 'utf8' }).split('\0').filter(Boolean)
const violations = []
function inspect(path, text) {
  const example = /\.example(?:\.|$)/.test(path)
  if (!example && /(^|\/)(?:\.env(?:\.|$)|\.dev\.vars(?:\.|$)|[^/]*secret[^/]*\.json$|[^/]*service.?account[^/]*\.json$)|\.(?:pem|key|zip)$|^(?:dist|node_modules|\.wrangler)\//i.test(path)) violations.push(`${path}: arquivo privado/gerado`)
  const patterns = [
    /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
    /(?:gh[pousr]_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{20,}|AIza[\w-]{30,})/,
    /["']private_key["']\s*:/,
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube(?:-nocookie)?\.com\/embed\/|img\.youtube\.com\/vi\/)[\w-]{11}/,
    /["']aula-\d{2}["']\s*:\s*["'][\w-]{11}["']/,
  ]
  if (patterns.some(pattern => pattern.test(text))) violations.push(`${path}: possível segredo ou ID de vídeo`)
}
for (const path of files) {
  const text = staged ? execFileSync('git', ['show', `:${path}`], {encoding:'utf8',maxBuffer:20*1024*1024}) : readFileSync(path,'utf8')
  inspect(path, text)
}
function scanBuild(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name)
    if (entry.isDirectory()) scanBuild(path)
    else if (/\.(js|html|json|css)$/.test(path)) inspect(`build-output/${path.replaceAll('\\','/')}`, readFileSync(path,'utf8'))
  }
}
if (existsSync('dist')) scanBuild('dist')
if (violations.length) { console.error(violations.join('\n')); process.exit(1) }
console.log(`Verificação concluída: ${files.length} arquivos e build, sem padrões de segredo ou catálogo privado.`)
