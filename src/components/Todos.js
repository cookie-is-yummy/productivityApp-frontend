import React, { useState, useEffect } from 'react';

function Todos() {
  const [todos, setTodos] = useState([]);
  const [newTodoText, setNewTodoText] = useState("");
  const [tags, setTags] = useState("");
  const [duration, setDuration] = useState("");

  // Fetch todos from backend
  useEffect(() => {
    fetch('https://productivity-app-xyzfe-b5bed29e76a5.herokuapp.com/api/todos')
      .then(res => res.json())
      .then(data => setTodos(data))
      .catch(err => console.error(err));
  }, []);

  const addTodo = () => {
    const newTodo = {
      text: newTodoText,
      tags: tags, // expected as comma-separated values
      duration: duration ? parseInt(duration) : null
    };
    fetch('https://productivity-app-xyzfe-b5bed29e76a5.herokuapp.com/api/todos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newTodo)
    })
      .then(res => res.json())
      .then(data => {
        setTodos([...todos, { id: data.id, ...newTodo, completed: false }]);
        setNewTodoText("");
        setTags("");
        setDuration("");
      })
      .catch(err => console.error(err));
  };

  // Toggle the completion state of a todo with a PUT request
  const toggleTodoCompletion = (todoId, currentStatus) => {
    fetch(`https://productivity-app-xyzfe-b5bed29e76a5.herokuapp.com/api/todos/${todoId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ completed: !currentStatus })
    })
      .then(res => res.json())
      .then(data => {
        setTodos(todos.map(todo => todo.id === data.id ? { ...todo, completed: !currentStatus } : todo));
      })
      .catch(err => console.error(err));
  };

  return (
    <div className="section todos">
      <h2>Todos</h2>
      <div className="todo-form">
        <input
          type="text"
          placeholder="Todo text"
          value={newTodoText}
          onChange={e => setNewTodoText(e.target.value)}
        />
        <input
          type="text"
          placeholder="Tags (comma-separated, e.g., daily,work)"
          value={tags}
          onChange={e => setTags(e.target.value)}
        />
        <input
          type="number"
          placeholder="Duration (minutes)"
          value={duration}
          onChange={e => setDuration(e.target.value)}
        />
        <button onClick={addTodo}>Add Todo</button>
      </div>
      <ul className="todo-list">
        {todos.map(todo => (
          <li key={todo.id}>
            <input
              type="checkbox"
              checked={todo.completed}
              onChange={() => toggleTodoCompletion(todo.id, todo.completed)}
            />
            <span style={{ textDecoration: todo.completed ? 'line-through' : 'none', marginLeft: '0.5rem' }}>
              {todo.text}
            </span>
            {todo.tags && <span className="tag">{todo.tags}</span>}
            {todo.duration && <span className="duration">{todo.duration} min</span>}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default Todos;