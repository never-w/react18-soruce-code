import * as React from 'react'
import { createRoot } from 'react-dom/client'

function getAge(state, action) {
  switch (action.type) {
    case 'add':
      return state + action.value
    default:
      return state
  }
}

function MyFunctionComponent() {
  const [number, setAge] = React.useReducer(getAge, 0)

  return (
    <button
      onClick={() => {
        setAge({ type: 'add', value: 1 })
        setAge({ type: 'add', value: 1 })
      }}>
      +age:{number}
    </button>
  )
}

const root = createRoot(document.getElementById('root'))
root.render(<MyFunctionComponent />)
