import { useState } from 'react'
import { lessons, modules } from './data/lessons'
import { bonuses } from './data/bonuses'
import './SalesPage.css'

const moduleIcons = ['📐', '🏗️', '🧱', '🪣', '◻️', '🛠️', '🔥']
const moduleCounts = modules.map((name) => lessons.filter((lesson) => lesson.module === name).length)
const checkoutUrl = import.meta.env.VITE_COURSE_CHECKOUT_URL as string | undefined

const curriculum = [
  ['Comece pela base', 'Entenda ferramentas, níveis, prumo, esquadro e preparo das massas.'],
  ['Levante paredes com segurança', 'Aprenda assentamento, amarração, vãos e construção de muros.'],
  ['Do chapisco ao acabamento', 'Acompanhe chapisco, reboco, contrapiso, cerâmica e rodapés.'],
  ['Construa projetos na prática', 'Veja escadas, calçadas, churrasqueira e fogão a lenha tomando forma.'],
]

const questions = [
  ['Preciso já trabalhar como pedreiro?', 'Não. As aulas começam pelos fundamentos e avançam até projetos completos.'],
  ['Como acesso as aulas?', 'Depois da matrícula, entre na área do aluno com seu e-mail. O acesso é liberado individualmente.'],
  ['Posso assistir pelo celular?', 'Sim. A área de alunos funciona em celular, tablet e computador.'],
  ['O curso tem quantas aulas?', 'São 71 aulas em sete módulos, além de cinco materiais bônus.'],
]

export default function SalesPage() {
  const [openQuestion, setOpenQuestion] = useState<number | null>(0)
  const purchaseLink = checkoutUrl?.trim()
  return (
    <div className="sales-page">
      <div className="sales-strip"><span>CURSO DE PEDREIRO • 71 AULAS</span><span>Assista no celular ou computador</span></div>
      <header className="sales-nav">
        <a className="sales-logo" href="#inicio" aria-label="Pedreiro Residencial, início"><span className="sales-logo-mark">PR<span>↗</span></span><span>Pedreiro <b>Residencial</b></span></a>
        <nav aria-label="Navegação da página"><a href="#curso">O curso</a><a href="#conteudo">Conteúdo</a><a href="#bonus">Bônus</a><a href="#duvidas">Dúvidas</a></nav>
        <a className="sales-nav-cta" href="/alunos">Área do aluno <span>↗</span></a>
      </header>

      <main>
        <section className="sales-hero" id="inicio">
          <div className="sales-hero-grid">
            <div className="sales-hero-copy">
              <span className="sales-kicker"><i /> CURSO PEDREIRO RESIDENCIAL</span>
              <h1>Aprenda serviços de pedreiro <em>na prática.</em></h1>
              <p>São 71 aulas passo a passo: massa, paredes, reboco, pisos e outros serviços de uma obra.</p>
              <div className="sales-actions"><a className="sales-primary" href={purchaseLink || '#conteudo'}>{purchaseLink ? 'Quero me matricular' : 'Ver o que vou aprender'} <span>↓</span></a><a className="sales-secondary" href="#curso">Como funciona</a></div>
              <div className="sales-proof"><span><b>Do básico ao acabamento</b><br />7 módulos, na ordem da obra</span></div>
            </div>
            <div className="sales-visual" aria-label="Pedreiro assentando tijolos em uma obra">
              <img className="sales-hero-photo" src="/images/pedreiro-masonry-hero-v3.webp" alt="Pedreiro assentando tijolos em uma obra residencial" />
              <div className="visual-caption"><span>71 AULAS</span><b>DO BÁSICO AO<br />ACABAMENTO</b></div>
            </div>
          </div>
          <div className="sales-hero-bottom"><span>ALVENARIA EXPLICADA PASSO A PASSO</span><a href="#conteudo">Ver as aulas <b>↓</b></a><span>ESTUDE NO SEU TEMPO</span></div>
        </section>

        <section className="sales-stats" id="curso"><div><strong>71</strong><span>aulas passo a passo</span></div><div><strong>07</strong><span>módulos organizados</span></div><div><strong>05</strong><span>materiais bônus</span></div><div><strong>100%</strong><span>online e no seu ritmo</span></div></section>

        <section className="sales-intro sales-wrap"><div className="sales-section-label"><span>O CURSO</span><i /></div><div className="sales-intro-grid"><h2>Uma aula de cada vez.<br /><em>Sem complicação.</em></h2><div><p>Você acompanha cada serviço desde o começo e vê como fazer cada etapa, na prática.</p><p>Assista quando puder e volte à aula sempre que precisar consultar um passo.</p><a className="sales-text-link" href="#conteudo">Ver os módulos <b>↓</b></a></div></div></section>

        <section className="sales-modules" id="conteudo"><div className="sales-wrap"><div className="sales-section-label light"><span>O QUE VOCÊ VAI APRENDER</span><i /></div><div className="sales-modules-heading"><h2>Veja o conteúdo<br /><em>das 71 aulas.</em></h2><p>Sete módulos acompanham os serviços da obra, do preparo da base aos acabamentos.</p></div><div className="sales-module-grid">{modules.map((name, index) => { const examples = lessons.filter((lesson) => lesson.module === name).slice(0, 2); return <article className="sales-module-card" key={name}><div className="module-card-top"><span>{moduleIcons[index] || '🧱'}</span><small>{moduleCounts[index]} AULAS</small></div><h3>{name}</h3><p>{examples.map((lesson) => lesson.title).join(' · ')}</p><div className="module-card-footer">VER AULAS DO MÓDULO <b>↓</b></div></article> })}</div></div></section>

        <section className="sales-learn sales-wrap"><div className="sales-section-label"><span>NA PRÁTICA</span><i /></div><div className="sales-learn-grid"><div><h2>Aprenda cada etapa <em>da obra.</em></h2><p>Comece pelo básico e avance para paredes, revestimentos e projetos completos.</p><a className="sales-primary compact" href="#conteudo">Ver os módulos <span>↓</span></a></div><div className="sales-steps">{curriculum.map(([title, copy], index) => <article key={title}><span>0{index + 1}</span><div><h3>{title}</h3><p>{copy}</p></div><b>↗</b></article>)}</div></div></section>

        <section className="sales-bonus" id="bonus"><div className="sales-wrap sales-bonus-grid"><div className="bonus-mark">✳<span>EXTRA</span></div><div><div className="sales-section-label light"><span>04 — PARA IR ALÉM</span><i /></div><h2>Material de apoio<br /><em>para levar pra obra.</em></h2><p>Além das aulas, o curso inclui cinco bônus para consultar durante o planejamento e a execução.</p></div><div className="sales-bonus-list">{bonuses.map((bonus, index) => <div key={bonus.id}><span>0{index + 1}</span><p>{bonus.title}</p><b>↗</b></div>)}</div></div></section>

        <section className="sales-faq sales-wrap" id="duvidas"><div className="sales-section-label"><span>05 — DÚVIDAS FREQUENTES</span><i /></div><div className="sales-faq-grid"><h2>Quer saber<br /><em>mais alguma coisa?</em></h2><div className="sales-questions">{questions.map(([question, answer], index) => <article key={question} className={openQuestion === index ? 'open' : ''}><button onClick={() => setOpenQuestion(openQuestion === index ? null : index)} aria-expanded={openQuestion === index}><span>{question}</span><b>{openQuestion === index ? '−' : '+'}</b></button>{openQuestion === index && <p>{answer}</p>}</article>)}</div></div></section>

        <section className="sales-final"><div className="sales-final-inner"><span>CURSO PEDREIRO RESIDENCIAL</span><h2>Confira as aulas<br /><em>e os módulos.</em></h2><p>Veja o conteúdo completo e entenda o que vai aprender em cada etapa.</p><a className="sales-final-button" href={purchaseLink || '#conteudo'}>{purchaseLink ? 'Quero me matricular agora' : 'Ver conteúdo do curso'} <b>↓</b></a><small>Já é aluno? Acesse sua área de aluno pelo menu.</small></div><div className="final-graphic">PR<span>↗</span></div></section>
      </main>
      <footer className="sales-footer"><a className="sales-logo" href="#inicio"><span className="sales-logo-mark">PR<span>↗</span></span><span>Pedreiro <b>Residencial</b></span></a><span>© 2026 Curso Pedreiro Residencial</span><a href="/alunos">Área do aluno ↗</a></footer>
    </div>
  )
}
