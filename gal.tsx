// created by saber2pr.
import React, { useState, useEffect, useRef, useImperativeHandle } from 'react'
import ReactDOM from 'react-dom'

interface Line {
  str: string
  speed?: number
  onNext?: Function
  skip?: boolean
  wait?: boolean
}

const GAL_BG = 'gal-bg'
const Line = ({ str, speed = 100, onNext = () => { }, skip, wait = true }: Line) => {
  if (skip) return <span>{str}<br /></span>
  if (wait) return <></>
  const [state, setState] = useState(0)
  const ref = useRef(0)
  const click = () => state < str.length ? setState(str.length) : onNext()
  useEffect(() => {
    if (state < str.length) {
      ref.current = setTimeout(() => setState(state + 1), speed)
    }
    // TODO: need to memorize...
    const container = document.getElementById(GAL_BG)
    container.onclick = click
    return () => {
      clearTimeout(ref.current)
      container.onclick = null
    }
  }, [state])

  return <>{str.slice(0, state)}</>
}

interface Lines {
  lines: string[]
  onNext: () => boolean
  init?: number
  speed?: number
}

interface LinesRef {
  getLine: () => number
}

const Lines = React.forwardRef<LinesRef, Lines>
  (({ lines, onNext, init = 0, speed }, ref) => {
    const [state, setState] = useState(init)
    const nextStep = () => {
      if (state < lines.length - 1) {
        setState(state + 1)
      } else {
        const hasNext = onNext()
        hasNext && setState(0) // reset
      }
    }
    useImperativeHandle(ref, () => ({
      getLine: () => state
    }))
    return <div style={{ padding: '0.5rem' }}>
      {lines.map((line, index) =>
        <Line
          key={line}
          skip={index < state}
          str={line}
          speed={speed}
          wait={state !== index}
          onNext={nextStep}
        />)}{<span className="cursor" />}
    </div>
  })

type Page = {
  lines: string[]
  bg: string
  music: string
}

interface Gal {
  pages: Page[]
  end?: Function
  initPage?: number
  initLine?: number
  speed?: number
}

interface GalRef extends LinesRef {
  getPage: () => number
}

const Picture = ({ src }: { src: string }) =>
  <picture style={{
    backgroundImage: `url(${src})`,
    opacity: 0.5,
    width: '100%',
    height: '100%',
    position: "absolute",
    zIndex: -1,
    backgroundSize: "cover",
    backgroundPosition: "center",
    backgroundRepeat: "no-repeat"
  }} />

const Music = React.memo(({ src }: { src: string }) => <audio autoPlay={true} src={src} />)

const Gal = React.forwardRef<GalRef, Gal>(({ pages, end, speed, initLine = 0, initPage = 0 }, thisRef) => {
  const [state, setState] = useState(initPage)
  const { lines, bg, music } = pages[state]
  const ref = useRef<LinesRef>()
  useImperativeHandle(thisRef, () => ({
    getLine: () => ref.current.getLine(),
    getPage: () => state
  }))
  return <div id={GAL_BG} style={{ userSelect: 'none', }}>
    {bg && <Picture src={bg} />}
    {music && <Music src={music} />}
    <Lines
      speed={speed}
      init={initLine}
      ref={ref}
      lines={lines}
      onNext={() => {
        const hasNext = state < pages.length - 1
        if (hasNext) {
          setState(state + 1)
        } else {
          end && end()
        }
        return hasNext
      }} />
  </div>
})

type Paras = {
  [page: string]: Page[]
}

type Selects = {
  [page: string]: {
    [title: string]: string
  }
}

interface Select {
  selects: { [title: string]: string }
  onSelect: (target: string) => void
}

const Select = ({ selects, onSelect }: Select) => <ul style={{ userSelect: 'none' }}>
  {Object.keys(selects).map(title =>
    <li key={title} onClick={() => onSelect(selects[title])}>{title}</li>)}
</ul>

interface Galgame {
  paras: Paras
  selects: Selects
  end?: Function
  initPara?: string
  initPage?: number
  initLine?: number
  speed?: number
}

interface GalgameRef extends GalRef {
  getPara: () => string
}

const Galgame = React.forwardRef<GalgameRef, Galgame>(
  ({ paras, selects, end, initLine, initPage, initPara, speed }, thisRef) => {
    const createSelect = (page: string) => <Select
      selects={selects[page]}
      onSelect={target => setDisplay(<IndexPage page={target} />)}
    />
    const IndexPage = ({ page }: { page: string }) => {
      const ref = useRef<GalRef>()
      useImperativeHandle(thisRef, () => ({
        getLine: () => ref.current.getLine(),
        getPage: () => ref.current.getPage(),
        getPara: () => page
      }))
      return <Gal
        speed={speed}
        initLine={initLine}
        initPage={initPage}
        ref={ref}
        pages={paras[page]}
        end={() => {
          if (page in selects) {
            setDisplay(createSelect(page))
          } else {
            end && end()
          }
        }} />
    }
    const currentPage = <IndexPage page={initPara || Object.keys(paras)[0]} />
    const [display, setDisplay] = useState(currentPage)
    return display
  })

// demo

const KEYS = {
  GAL_PARA: 'GAL_PARA',
  GAL_PAGE: 'GAL_PAGE',
  GAL_LINE: 'GAL_LINE',
  GAL_SPEED: 'GAL_SPEED'
}

interface App {
  data: {
    paras: Paras
    selects: Selects
  }
}

const App = ({ data: { paras, selects } }: App) => {
  const ref = useRef<GalgameRef>()
  const save = () => {
    const Para = ref.current.getPara()
    const Page = ref.current.getPage()
    const Line = ref.current.getLine()
    localStorage.setItem(KEYS.GAL_PARA, Para)
    localStorage.setItem(KEYS.GAL_PAGE, String(Page))
    localStorage.setItem(KEYS.GAL_LINE, String(Line))
  }
  const clear = () => {
    localStorage.removeItem(KEYS.GAL_PARA)
    localStorage.removeItem(KEYS.GAL_PAGE)
    localStorage.removeItem(KEYS.GAL_LINE)
  }
  return <>
    <nav style={{ position: 'absolute', bottom: '0.5rem', right: '0.5rem' }}>
      <button onClick={save}>save</button>
      <button onClick={clear}>clear</button>
    </nav>
    <Galgame
      initPara={localStorage.getItem(KEYS.GAL_PARA)}
      initPage={Number(localStorage.getItem(KEYS.GAL_PAGE))}
      initLine={Number(localStorage.getItem(KEYS.GAL_LINE))}
      ref={ref}
      paras={paras}
      selects={selects}
      end={() => {
        if (confirm('需要重新开始吗？')) {
          location.reload()
        }
      }}
    />
  </>
}

fetch('/galgame/data.json').then(res => res.json()).then(data =>
  ReactDOM.render(<App data={data} />, document.getElementById('root')))
