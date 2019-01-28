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

const User = ({ user, update, remove }) => {
  lifeCycle({
    mounted() {
      console.log('mounted User')
      return () => console.log('unmounted User')
    }
  })
  return (
    <div>
      <p>Name: {user.name}</p>
      <p>Age: {user.age}</p>
      <button onClick={() => remove(user.id)}>Delete</button>
      <button onClick={() => update(user.id)}>Update</button>
    </div>
  )
}

const Test = ({ title }) => {
  const [count, dispatch] = withState(1);
  const [users, setUsers] = withState(list);

  function add() {
    const newUsers = [...users, { name: 'teng', age: 12, id: users.length }];
    setUsers(newUsers);
  }
  function update(id) {
    const newUsers = users.map(u => u.id === id ? {...u, name: 'aaaa', age: 15} : u);
    setUsers(newUsers);
  }
  function remove(id) {
    const newUsers = users.filter(u => u.id !== id);
    setUsers(newUsers);
  }
  return (
    <div>
      <button onClick={add}>Add</button>
      <p>{count}</p>
      {users.map(user =>
        <User
          user={user}
          update={update}
          remove={remove}
        />
      )}
    </div>
  )

}

render(<Test title='Hello'/>, document.getElementById('root'));
