/** @jsx h */
import { h } from './src/core/h';
import { withState } from './src/core/with-state';
import { lifeCycle } from './src/core/life-cycle';
import { render } from './src/dom';
//
// let list = []
//
// for (let i = 0; i < 10000; i++) {
//   list = [
//     ...list,
//     {
//       name: 'tung',
//       age: 10,
//     }
//   ]
// }
//
// const Test = ({ title }) => {
//   const [count, dispatch] = withState(1);
//
//
//   return list.map(l => (
//     <div>
//       <p>{l.name}</p>
//       <button onClick={() => dispatch(count + 1)}>Click</button>
//       <p>Hello {count}</p>
//
//     </div>
//   ))
//
// }

const Title = ({ }) => {
  console.log('render title')
  const [name, dispatch] = withState(1);
  lifeCycle({
    mounted: () => {},
    updated: () => console.log('hi'),
    destroyed: () => {}
  })
  return <div>
    {/* <p>Tung {number}</p> */}
    <p onClick={() => dispatch(Math.random())}>Name: {name}</p>
  </div>
}

const Button = ({ title }) => {
  const [count, dispatch] = withState(1);
  console.log('render button')
  lifeCycle({
    mounted: () => {},
    destroyed: () => {}
  })
  return (
    <div>
      <button onClick={() => {
          dispatch(count + 1)
        }}>Click</button>
      <p>Hello {count}</p>
      <Title/>
    </div>
  )

}

// g(<Button title='title'/>)
render(<Button title='Hello'/>, document.getElementById('root'));
// render(<Test/>, document.getElementById('root'));
