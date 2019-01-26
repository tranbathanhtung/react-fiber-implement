/** @jsx h */
import { h } from './src/core/h';
import { withState } from './src/core/with-state';
import { lifeCycle } from './src/core/life-cycle';
import { render } from './src/dom';

let list = []

for (let i = 0; i < 5; i++) {
  list = [
    ...list,
    {
      name: 'tung',
      age: 10,
      id: i,
    }
  ]
}

const Test = ({ title }) => {
  const [count, dispatch] = withState(1);
  const [users, setUsers] = withState(list);

  lifeCycle({
    mounted() {
      console.log('mounted Test')
      return () => console.log('unmounted Test')
    }
  })

  function add() {
    const newUsers = [...users, { name: 'teng', age: 12, id: users.length }];
    setUsers(newUsers);
  }
  function update() {
    const i = Math.floor((Math.random() * (users.length - 1)) + 0);
    const newUsers = users.map(u => u.id === i ? {...u, name: 'aaaa', age: 15} : u);
    setUsers(newUsers);
  }
  function remove() {
    const i = Math.floor((Math.random() * (users.length - 1)) + 0);
    const newUsers = users.filter(u => u.id !== i);
    setUsers(newUsers);
  }
  return (
    <div>
      <button onClick={add}>Add</button>
      <button onClick={update}>Update</button>
      <button onClick={remove}>Delete</button>
      <p>Hello {count}</p>
      {
        users.map(u => (
          <div>
            <p>{u.name}</p>
            <p>{u.age}</p>
            <button onClick={() => dispatch(count + 1)}>Click</button>
          </div>
        ))
      }
    </div>
  )

}

render(<Test title='Hello'/>, document.getElementById('root'));
