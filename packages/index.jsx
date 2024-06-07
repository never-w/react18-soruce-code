import * as React from 'react'
import { createRoot } from 'react-dom/client'

// function getAge(state, action) {
//   switch (action.type) {
//     case 'add':
//       return state + action.value
//     default:
//       return state
//   }
// }

function MyFunctionComponent() {
  // const [number, setAge] = React.useReducer(getAge, 0)
  const [number, setAge] = React.useState(0)

  React.useEffect(() => {
    console.log(number)
    return () => {
      console.log('456')
    }
  }, [number])

  return (
    <button
      onClick={() => {
        // setAge({ type: 'add', value: 1 })
        setAge(number + 1)
        // setAge((preV) => preV + 1)
      }}>
      {number}
    </button>
  )
}

const root = createRoot(document.getElementById('root'))
root.render(<MyFunctionComponent />)
