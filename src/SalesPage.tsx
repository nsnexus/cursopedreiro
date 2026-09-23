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
      <div className="sales-strip"><span>CURSO COMPLETO • 71 AULAS • ACESSO ONLINE</span><span>Aprenda no seu ritmo, de onde estiver</span></div>
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
              <h1>Construa com confiança.<br /><em>Do primeiro traço</em><br />ao último acabamento.</h1>
              <p>Aprenda alvenaria na prática, com aulas passo a passo que mostram cada etapa da obra — da fundação aos projetos finais.</p>
              <div className="sales-actions"><a className="sales-primary" href={purchaseLink || '#conteudo'}>{purchaseLink ? 'Quero me matricular' : 'Conhecer o conteúdo'} <span>↗</span></a><a className="sales-secondary" href="#curso"><span className="sales-play">▶</span> Descubra como funciona</a></div>
              <div className="sales-proof"><div className="avatar-stack"><i>🧱</i><i>📐</i><i>🔨</i></div><span><b>71 aulas organizadas</b><br />para acompanhar etapa por etapa</span></div>
            </div>
            <div className="sales-visual" aria-label="Ilustração de uma parede sendo construída">
              <img className="sales-hero-photo" src="/images/pedreiro-masonry-hero.webp" alt="Pedreiro com capacete e luvas assentando tijolos em uma obra residencial" />
              <div className="visual-stamp"><span>APRENDA</span><b>FAZENDO</b><i>CURSO ONLINE · 2026</i></div>
              <div className="visual-caption"><span>01 / 07</span><b>DA FUNDAÇÃO<br />AO ACABAMENTO</b></div>
            </div>
          </div>
          <div className="sales-hero-bottom"><span>UM CAMINHO CLARO PARA EVOLUIR NA OBRA</span><a href="#curso">Role para conhecer <b>↓</b></a><span>FEITO PARA QUEM QUER APRENDER FAZENDO</span></div>
        </section>

        <section className="sales-stats" id="curso"><div><strong>71</strong><span>aulas passo a passo</span></div><div><strong>07</strong><span>módulos organizados</span></div><div><strong>05</strong><span>materiais bônus</span></div><div><strong>100%</strong><span>online e no seu ritmo</span></div></section>

        <section className="sales-intro sales-wrap"><div className="sales-section-label"><span>01 — UM BOM COMEÇO</span><i /></div><div className="sales-intro-grid"><h2>Aprenda a fazer.<br /><em>Entenda por que.</em></h2><div><p>Obra boa não começa no acabamento. Começa sabendo preparar a massa, marcar o nível e fazer cada etapa na ordem certa.</p><p>O Curso Pedreiro Residencial reúne as técnicas em uma sequência prática, para você rever as aulas durante o aprendizado e levar mais segurança para cada serviço.</p><a className="sales-text-link" href="#conteudo">Ver o que você vai aprender <b>↗</b></a></div></div></section>

        <section className="sales-modules" id="conteudo"><div className="sales-wrap"><div className="sales-section-label light"><span>02 — PROGRAMA DO CURSO</span><i /></div><div className="sales-modules-heading"><h2>Uma etapa de cada vez.<br /><em>Uma obra inteira no horizonte.</em></h2><p>Do básico aos projetos práticos, explore os sete módulos e encontre o próximo passo para a sua evolução.</p></div><div className="sales-module-grid">{modules.map((name, index) => { const examples = lessons.filter((lesson) => lesson.module === name).slice(0, 2); return <article className="sales-module-card" key={name}><div className="module-card-top"><span>{moduleIcons[index] || '🧱'}</span><small>MÓDULO {String(index + 1).padStart(2, '0')}</small></div><h3>{name}</h3><p>{moduleCounts[index]} aulas • {examples.map((lesson) => lesson.title).join(' · ')}</p><div className="module-card-footer">CONTEÚDO PASSO A PASSO <b>↗</b></div></article> })}</div></div></section>

        <section className="sales-learn sales-wrap"><div className="sales-section-label"><span>03 — APRENDER NA PRÁTICA</span><i /></div><div className="sales-learn-grid"><div><h2>Você acompanha<br /><em>cada passo da obra.</em></h2><p>As aulas mostram técnicas e etapas de um jeito direto, para você estudar no seu tempo e voltar ao conteúdo quando precisar.</p><a className="sales-primary compact" href={purchaseLink || '/alunos'}>{purchaseLink ? 'Começar minha matrícula' : 'Entrar ou criar conta'} <span>↗</span></a><small>{purchaseLink ? 'Acesso seguro pelo checkout oficial.' : 'A matrícula e o acesso são liberados pela equipe do curso.'}</small></div><div className="sales-steps">{curriculum.map(([title, copy], index) => <article key={title}><span>0{index + 1}</span><div><h3>{title}</h3><p>{copy}</p></div><b>↗</b></article>)}</div></div></section>

        <section className="sales-bonus" id="bonus"><div className="sales-wrap sales-bonus-grid"><div className="bonus-mark">✳<span>EXTRA</span></div><div><div className="sales-section-label light"><span>04 — PARA IR ALÉM</span><i /></div><h2>Material de apoio<br /><em>para levar pra obra.</em></h2><p>Além das aulas, o curso inclui cinco bônus para consultar durante o planejamento e a execução.</p></div><div className="sales-bonus-list">{bonuses.map((bonus, index) => <div key={bonus.id}><span>0{index + 1}</span><p>{bonus.title}</p><b>↗</b></div>)}</div></div></section>

        <section className="sales-faq sales-wrap" id="duvidas"><div className="sales-section-label"><span>05 — DÚVIDAS FREQUENTES</span><i /></div><div className="sales-faq-grid"><h2>Quer saber<br /><em>mais alguma coisa?</em></h2><div className="sales-questions">{questions.map(([question, answer], index) => <article key={question} className={openQuestion === index ? 'open' : ''}><button onClick={() => setOpenQuestion(openQuestion === index ? null : index)} aria-expanded={openQuestion === index}><span>{question}</span><b>{openQuestion === index ? '−' : '+'}</b></button>{openQuestion === index && <p>{answer}</p>}</article>)}</div></div></section>

        <section className="sales-final"><div className="sales-final-inner"><span>SEU PRÓXIMO PASSO COMEÇA AQUI</span><h2>Mais conhecimento.<br /><em>Mais confiança na obra.</em></h2><p>Entre no curso e avance com aulas práticas, materiais de apoio e um caminho claro para estudar.</p><a className="sales-final-button" href={purchaseLink || '/alunos'}>{purchaseLink ? 'Quero me matricular agora' : 'Acessar área do aluno'} <b>↗</b></a><small>{purchaseLink ? 'Pagamento pelo ambiente seguro do checkout.' : 'Já é aluno? Entre com seu e-mail ou solicite acesso à equipe.'}</small></div><div className="final-graphic">PR<span>↗</span></div></section>
      </main>
      <footer className="sales-footer"><a className="sales-logo" href="#inicio"><span className="sales-logo-mark">PR<span>↗</span></span><span>Pedreiro <b>Residencial</b></span></a><span>© 2026 Curso Pedreiro Residencial</span><a href="/alunos">Área do aluno ↗</a></footer>
    </div>
  )
}
