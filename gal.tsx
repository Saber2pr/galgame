import React, { useState, useEffect, useRef, useImperativeHandle } from 'react'
import ReactDOM from 'react-dom'

interface Line {
  str: string
  speed?: number
  onNext?: Function
  skip?: boolean
  wait?: boolean
}

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
    document.onclick = click
    return () => {
      clearTimeout(ref.current)
      document.onclick = null
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
    return <div>
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

interface Gal {
  Para: string[][]
  end?: Function
  initPage?: number
  initLine?: number
  speed?: number
}

interface GalRef {
  getPage: () => number
  getLine: () => number
}

const Gal = React.forwardRef<GalRef, Gal>(({ Para, end, speed, initLine = 0, initPage = 0 }, thisRef) => {
  const [state, setState] = useState(initPage)
  const ref = useRef<LinesRef>()
  useImperativeHandle(thisRef, () => ({
    getLine: () => ref.current.getLine(),
    getPage: () => state
  }))
  return <div style={{ userSelect: 'none' }}>
    <Lines
      speed={speed}
      init={initLine}
      ref={ref}
      lines={Para[state]}
      onNext={() => {
        const hasNext = state < Para.length - 1
        if (hasNext) {
          setState(state + 1)
        } else {
          end && end()
        }
        return hasNext
      }} />
  </div>
})

// demo
const Para = [
  [
    '永恒是不存在的，因为没有可以容纳它的地方。',
    '一昧地追寻意义是无用的。',
    '因为人类与机器不同，人类可以做没有意义的事情。'
  ], [
    '作为资质统合思念体的其他终端机，',
    '与现在世界交叉共存...在圣芙蕾雅学园作为master，',
    '在格里芬担任指挥官，在迦勒底是御主，在成子坂製作所当隊長...'
  ]
]

const App = () => {
  return <Gal Para={Para} end={() => alert('end.')} />
}

ReactDOM.render(<App />, document.getElementById('test'))
