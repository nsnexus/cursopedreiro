import { FormEvent, useEffect, useMemo, useRef, useState } from 'react'
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  type User,
} from 'firebase/auth'
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore'
import { auth, db, firebaseConfigured } from './firebase'
import { lessons, modules, type Lesson } from './data/lessons'
import { bonuses } from './data/bonuses'
import { offers } from './data/offers'

type Tab = 'aulas' | 'bonus' | 'ofertas'

type AccessState = 'checking' | 'active' | 'blocked'

const moduleIcons: Record<string, string> = {
  'Fundamentos e ferramentas': '📏',
  'Fundação e estrutura': '🏗️',
  'Alvenaria, muros e vãos': '🧱',
  'Chapisco, reboco e acabamento': '🪣',
  'Pisos, cerâmica e rodapés': '◻️',
  'Projetos práticos': '🛠️',
  'Churrasqueira e fogão a lenha': '🔥',
}

function App() {
  const [user, setUser] = useState<User | null>(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [access, setAccess] = useState<AccessState>('checking')
  const [completed, setCompleted] = useState<Set<string>>(new Set())
  const [tab, setTab] = useState<Tab>(() => (location.hash === '#ofertas' ? 'ofertas' : 'aulas'))
  const [search, setSearch] = useState('')
  const [moduleFilter, setModuleFilter] = useState('Todos')
  const [selected, setSelected] = useState<Lesson | null>(null)
  const [videoId, setVideoId] = useState<string | null>(null)
  const [videoLoading, setVideoLoading] = useState(false)
  const [videoError, setVideoError] = useState('')
  const [progressError, setProgressError] = useState('')
  const authVersion = useRef(0)
  const requestVersion = useRef(0)
  const playerRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!firebaseConfigured) {
      setAuthLoading(false)
      return
    }
    const unsubscribe = onAuthStateChanged(auth, async (nextUser) => {
      const version = ++authVersion.current
      requestVersion.current++
      setCompleted(new Set())
      setUser(nextUser)
      setAuthLoading(false)
      setSelected(null)
      setVideoId(null)
      if (!nextUser) {
        setAccess('checking')
        setCompleted(new Set())
        return
      }

      setAccess('checking')
      try {
        const accessSnap = await getDoc(doc(db, 'access', nextUser.uid))
        if (version !== authVersion.current) return
        const active = accessSnap.exists() && accessSnap.data()?.active === true
        setAccess(active ? 'active' : 'blocked')
        if (active) {
          const progressSnap = await getDocs(collection(db, 'users', nextUser.uid, 'progress'))
          if (version !== authVersion.current) return
          setCompleted(new Set(progressSnap.docs.filter((item) => item.data()?.completed === true).map((item) => item.id)))
        }
      } catch {
        if (version === authVersion.current) setAccess('blocked')
      }
    })
    return () => { authVersion.current++; requestVersion.current++; unsubscribe() }
  }, [])

  useEffect(() => {
    const syncTab = () => {
      if (location.hash === '#ofertas') setTab('ofertas')
      if (location.hash === '#bonus') setTab('bonus')
    }
    window.addEventListener('hashchange', syncTab)
    return () => window.removeEventListener('hashchange', syncTab)
  }, [])

  const filteredLessons = useMemo(() => {
    const term = search.trim().toLocaleLowerCase('pt-BR')
    return lessons.filter((lesson) => {
      const moduleMatches = moduleFilter === 'Todos' || lesson.module === moduleFilter
      const textMatches = !term || `${lesson.title} ${lesson.description} ${lesson.module}`.toLocaleLowerCase('pt-BR').includes(term)
      return moduleMatches && textMatches
    })
  }, [search, moduleFilter])

  const progress = Math.round((completed.size / lessons.length) * 100)

  async function openLesson(lesson: Lesson) {
    if (!user) return
    const version = ++requestVersion.current
    setSelected(lesson)
    setVideoId(null)
    setVideoError('')
    setVideoLoading(true)
    requestAnimationFrame(() => playerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }))

    try {
      const token = await user.getIdToken()
      const response = await fetch(`/api/lesson/${lesson.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const payload = (await response.json()) as { youtubeId?: string; error?: string }
      if (!response.ok || !payload.youtubeId) throw new Error(payload.error || 'Não foi possível abrir esta aula.')
      if (version !== requestVersion.current) return
      setVideoId(payload.youtubeId)
      localStorage.setItem('pedreiro:lastLesson', lesson.id)
    } catch (error) {
      if (version !== requestVersion.current) return
      setVideoError(error instanceof Error ? error.message : 'Não foi possível abrir esta aula.')
    } finally {
      if (version === requestVersion.current) setVideoLoading(false)
    }
  }

  async function toggleComplete(lessonId: string) {
    if (!user) return
    setProgressError('')
    const version = authVersion.current
    const nextValue = !completed.has(lessonId)
    try {
    await setDoc(doc(db, 'users', user.uid, 'progress', lessonId), {
      completed: nextValue,
      updatedAt: serverTimestamp(),
    }, { merge: true })
    if (version !== authVersion.current) return
    setCompleted((current) => {
      const next = new Set(current)
      nextValue ? next.add(lessonId) : next.delete(lessonId)
      return next
    })
    } catch {
      if (version === authVersion.current) setProgressError('Não foi possível salvar seu progresso. Tente novamente.')
    }
  }

  function moveLesson(direction: -1 | 1) {
    if (!selected) return
    const index = lessons.findIndex((lesson) => lesson.id === selected.id)
    const target = lessons[index + direction]
    if (target) void openLesson(target)
  }

  function changeTab(nextTab: Tab) {
    setTab(nextTab)
    history.replaceState(null, '', nextTab === 'aulas' ? location.pathname : `#${nextTab}`)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  if (!firebaseConfigured) return <ConfigurationMissing />
  if (authLoading) return <LoadingScreen text="Abrindo sua área de membros…" />
  if (!user) return <AuthScreen />
  if (access === 'checking') return <LoadingScreen text="Conferindo seu acesso…" />
  if (access === 'blocked') return <PendingAccess user={user} />

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand" onClick={() => changeTab('aulas')} role="button" tabIndex={0}>
          <span className="brand-mark">P</span>
          <div>
            <strong>Pedreiro Residencial</strong>
            <small>Área de membros</small>
          </div>
        </div>
        <nav className="desktop-nav" aria-label="Navegação principal">
          <button className={tab === 'aulas' ? 'active' : ''} onClick={() => changeTab('aulas')}>Aulas</button>
          <button className={tab === 'bonus' ? 'active' : ''} onClick={() => changeTab('bonus')}>Bônus</button>
          <button className={tab === 'ofertas' ? 'active' : ''} onClick={() => changeTab('ofertas')}>Ofertas</button>
        </nav>
        <button className="ghost-button" onClick={() => void signOut(auth)}>Sair</button>
      </header>

      <main>
        {progressError && <p className="container form-error" role="alert">{progressError}</p>}
        {tab === 'aulas' && (
          <>
            <section className="hero container">
              <div className="hero-copy">
                <span className="eyebrow">🧱 CURSO COMPLETO • 71 AULAS</span>
                <h1>Bem-vindo à sua área de aluno</h1>
                <p>Da fundação ao acabamento, com aulas práticas para acompanhar pelo celular e aplicar na obra.</p>
                <div className="hero-actions">
                  <button className="primary-button" onClick={() => document.getElementById('conteudo')?.scrollIntoView({ behavior: 'smooth' })}>Continuar estudando</button>
                  <button className="secondary-button" onClick={() => changeTab('bonus')}>Ver 5 bônus</button>
                </div>
              </div>
              <div className="progress-card">
                <div className="progress-number">{progress}%</div>
                <strong>Seu progresso</strong>
                <span>{completed.size} de {lessons.length} aulas concluídas</span>
                <div className="progress-track"><div style={{ width: `${progress}%` }} /></div>
                <small>{progress === 100 ? 'Curso concluído. Parabéns!' : 'Marque as aulas conforme for avançando.'}</small>
              </div>
            </section>

            {selected && (
              <section className="player-section container" ref={playerRef}>
                <div className="player-header">
                  <div>
                    <span>AULA {String(selected.number).padStart(2, '0')}</span>
                    <h2>{selected.title}</h2>
                  </div>
                  <button className="close-button" aria-label="Fechar vídeo" onClick={() => { requestVersion.current++; setSelected(null); setVideoId(null) }}>×</button>
                </div>
                <div className="video-frame">
                  {videoLoading && <div className="video-state"><span className="spinner" />Carregando aula…</div>}
                  {videoError && <div className="video-state error-state">{videoError}</div>}
                  {videoId && (
                    <iframe
                      src={`https://www.youtube-nocookie.com/embed/${videoId}?rel=0&modestbranding=1&playsinline=1`}
                      title={selected.title}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      referrerPolicy="strict-origin-when-cross-origin"
                      allowFullScreen
                    />
                  )}
                </div>
                <div className="player-footer">
                  <button className="secondary-button" onClick={() => moveLesson(-1)} disabled={selected.number === 1}>← Anterior</button>
                  <button className={completed.has(selected.id) ? 'complete-button done' : 'complete-button'} onClick={() => void toggleComplete(selected.id)}>
                    {completed.has(selected.id) ? '✓ Aula concluída' : 'Marcar como concluída'}
                  </button>
                  <button className="secondary-button" onClick={() => moveLesson(1)} disabled={selected.number === lessons.length}>Próxima →</button>
                </div>
              </section>
            )}

            <section className="content-section container" id="conteudo">
              <div className="section-heading">
                <div><span className="eyebrow dark">CONTEÚDO DO CURSO</span><h2>Todas as 71 videoaulas</h2></div>
                <div className="lesson-count">{filteredLessons.length} exibidas</div>
              </div>

              <div className="filters">
                <label className="search-box">
                  <span>⌕</span>
                  <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar uma aula…" />
                </label>
                <select value={moduleFilter} onChange={(event) => setModuleFilter(event.target.value)} aria-label="Filtrar por módulo">
                  <option>Todos</option>
                  {modules.map((module) => <option key={module}>{module}</option>)}
                </select>
              </div>

              <div className="lesson-grid">
                {filteredLessons.map((lesson) => (
                  <article className={completed.has(lesson.id) ? 'lesson-card completed' : 'lesson-card'} key={lesson.id}>
                    <button className="lesson-main" onClick={() => void openLesson(lesson)}>
                      <div className="lesson-thumb">
                        <span className="module-icon">{moduleIcons[lesson.module] || '🧱'}</span>
                        <span className="play-badge">▶</span>
                        <small>AULA {String(lesson.number).padStart(2, '0')}</small>
                      </div>
                      <div className="lesson-copy">
                        <span className="module-name">{lesson.module}</span>
                        <h3>{lesson.title}</h3>
                        <p>{lesson.description}</p>
                      </div>
                    </button>
                    <button className="completion-toggle" onClick={() => void toggleComplete(lesson.id)}>
                      <span className="check-box">{completed.has(lesson.id) ? '✓' : ''}</span>
                      {completed.has(lesson.id) ? 'Concluída' : 'Marcar como concluída'}
                    </button>
                  </article>
                ))}
              </div>
              {filteredLessons.length === 0 && <div className="empty-state">Nenhuma aula encontrada com esse filtro.</div>}
            </section>

            <SuggestionForm user={user} />
          </>
        )}

        {tab === 'bonus' && <BonusSection />}
        {tab === 'ofertas' && <OffersSection />}
      </main>

      <nav className="mobile-nav" aria-label="Navegação móvel">
        <button className={tab === 'aulas' ? 'active' : ''} onClick={() => changeTab('aulas')}><span>▶</span>Aulas</button>
        <button className={tab === 'bonus' ? 'active' : ''} onClick={() => changeTab('bonus')}><span>🎁</span>Bônus</button>
        <button className={tab === 'ofertas' ? 'active' : ''} onClick={() => changeTab('ofertas')}><span>🏷</span>Ofertas</button>
      </nav>

      <footer>© 2026 Pedreiro Residencial</footer>
    </div>
  )
}

function AuthScreen() {
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function submit(event: FormEvent) {
    event.preventDefault()
    setLoading(true)
    setError('')
    try {
      if (mode === 'login') await signInWithEmailAndPassword(auth, email.trim(), password)
      else await createUserWithEmailAndPassword(auth, email.trim(), password)
    } catch (err) {
      const message = err instanceof Error ? err.message : ''
      if (message.includes('invalid-credential')) setError('E-mail ou senha incorretos.')
      else if (message.includes('email-already-in-use')) setError('Esse e-mail já possui uma conta.')
      else if (message.includes('weak-password')) setError('Use uma senha com pelo menos 6 caracteres.')
      else setError('Não foi possível entrar. Confira os dados e tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-panel brand-panel">
        <span className="eyebrow">🧱 CURSO PEDREIRO RESIDENCIAL</span>
        <h1>Aprenda no seu ritmo, direto da obra.</h1>
        <p>71 aulas práticas, materiais de apoio e progresso salvo na sua conta.</p>
        <div className="auth-features"><span>✓ Acesso individual</span><span>✓ Progresso sincronizado</span><span>✓ 5 bônus liberados</span></div>
      </div>
      <div className="auth-panel form-panel">
        <form className="auth-card" onSubmit={submit}>
          <span className="mini-brand">P</span>
          <h2>{mode === 'login' ? 'Entrar na área de alunos' : 'Criar minha conta'}</h2>
          <p>{mode === 'login' ? 'Use o e-mail cadastrado no curso.' : 'Depois do cadastro, seu acesso precisa estar liberado.'}</p>
          <label>E-mail<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required /></label>
          <label>Senha<input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} minLength={6} required /></label>
          {error && <div className="form-error">{error}</div>}
          <button className="primary-button full" disabled={loading}>{loading ? 'Aguarde…' : mode === 'login' ? 'Entrar' : 'Criar conta'}</button>
          <button type="button" className="text-button" onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError('') }}>
            {mode === 'login' ? 'Primeiro acesso? Criar conta' : 'Já tenho conta'}
          </button>
        </form>
      </div>
    </div>
  )
}

function PendingAccess({ user }: { user: User }) {
  return (
    <div className="center-page">
      <div className="status-card">
        <div className="status-icon">🔒</div>
        <span className="eyebrow dark">ACESSO PROTEGIDO</span>
        <h1>Conta criada. Falta liberar o curso.</h1>
        <p>Seu login está funcionando, mas a liberação do curso ainda está pendente.</p>
        <div className="uid-box"><small>ID da conta</small><code>{user.uid}</code></div>
        <p className="small-note">Envie o ID da conta ao suporte para solicitar a liberação.</p><button className="primary-button" onClick={() => location.reload()}>Verificar acesso novamente</button>
        <button className="secondary-button" onClick={() => void signOut(auth)}>Sair desta conta</button>
      </div>
    </div>
  )
}

function BonusSection() {
  return (
    <section className="tab-page container">
      <div className="tab-hero"><span className="eyebrow">EXCLUSIVO PARA ALUNOS</span><h1>5 bônus liberados</h1><p>Materiais práticos para consultar durante a obra.</p></div>
      <div className="bonus-grid">
        {bonuses.map((bonus, index) => (
          <article className="bonus-card" key={bonus.id}>
            <div className="bonus-icon">{bonus.icon}</div>
            <div className="bonus-copy"><span>BÔNUS {String(index + 1).padStart(2, '0')}</span><h2>{bonus.title}</h2><p>{bonus.description}</p></div>
            <div className="bonus-meta"><span>VALOR <s>{bonus.value}</s></span><strong>GRÁTIS</strong></div>
            <a href={bonus.url} target="_blank" rel="noreferrer" className="primary-button">Baixar bônus</a>
            <small>{bonus.meta}</small>
          </article>
        ))}
      </div>
    </section>
  )
}

function OffersSection() {
  return (
    <section className="tab-page container" id="ofertas">
      <div className="tab-hero offers-hero"><span className="eyebrow">OFERTAS PARA ALUNOS</span><h1>Expanda seus conhecimentos</h1><p>Cursos rápidos para cuidar de outras partes da casa.</p></div>
      <div className="offer-grid">
        {offers.map((offer) => (
          <article className="offer-card" key={offer.title}>
            <div className="offer-art"><span>{offer.icon}</span></div>
            <div className="offer-copy"><h2>{offer.title}</h2><p>{offer.description}</p><small>Por apenas</small><strong>{offer.price}</strong></div>
            <a href={offer.url} target="_blank" rel="noreferrer" className="offer-button">Quero esse curso →</a>
          </article>
        ))}
      </div>
    </section>
  )
}

function SuggestionForm({ user }: { user: User }) {
  const [name, setName] = useState('')
  const [contact, setContact] = useState(user.email || '')
  const [text, setText] = useState('')
  const [status, setStatus] = useState('')

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (text.trim().length < 3) return
    setStatus('Enviando…')
    try {
      await addDoc(collection(db, 'suggestions'), { uid: user.uid, name: name.trim(), contact: contact.trim(), text: text.trim(), createdAt: serverTimestamp() })
      setText('')
      setStatus('Sugestão enviada. Obrigado!')
    } catch {
      setStatus('Não foi possível enviar agora.')
    }
  }

  return (
    <section className="suggestion-section">
      <div className="container suggestion-inner">
        <div><span className="eyebrow">SUA OPINIÃO IMPORTA</span><h2>Recomendar uma aula</h2><p>Tem algum tema que você quer ver? Envie sua ideia por aqui.</p></div>
        <form onSubmit={submit}>
          <div className="two-fields"><input placeholder="Seu nome" value={name} onChange={(e) => setName(e.target.value)} /><input placeholder="E-mail ou WhatsApp" value={contact} onChange={(e) => setContact(e.target.value)} /></div>
          <textarea placeholder="Qual aula você gostaria de ver?" value={text} onChange={(e) => setText(e.target.value)} maxLength={1000} required />
          <div className="form-row"><span>{status}</span><button className="primary-button">Enviar sugestão</button></div>
        </form>
      </div>
    </section>
  )
}

function ConfigurationMissing() {
  return (
    <div className="center-page"><div className="status-card"><div className="status-icon">⚙️</div><h1>Área de alunos em preparação</h1><p>Estamos preparando seu acesso. Tente novamente mais tarde.</p></div></div>
  )
}

function LoadingScreen({ text }: { text: string }) {
  return <div className="loading-page"><span className="spinner big" /><p>{text}</p></div>
}

export default App
