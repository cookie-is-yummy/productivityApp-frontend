import React, { useState, useEffect } from "react";
import axios from '../axiosInstance';

const DailyTodo = () => {
  const [todos, setTodos] = useState([]);
  const [newTodo, setNewTodo] = useState("");

  useEffect(() => {
    axios.get("/api/todos")
      .then(response => setTodos(response.data))
      .catch(error => console.error("Error fetching todos:", error));
  }, []);

  const addTodo = () => {
    if(newTodo) {
      axios.post("/api/todos", { text: newTodo })
        .then(response => {
          setTodos([...todos, { id: response.data.id, text: newTodo, completed: false }]);
          setNewTodo("");
        });
    }
  };

  const toggleTodo = (id) => {
    const todo = todos.find(t => t.id === id);
    axios.put(`/api/todos/${id}`, { completed: !todo.completed })
      .then(() => {
        setTodos(todos.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
      });
  };

  const deleteTodo = (id) => {
    axios.delete(`/api/todos/${id}`)
      .then(() => {
        setTodos(todos.filter(t => t.id !== id));
      });
  };

  return (
    <div>
      <h2>Daily Todos</h2>
      <div className="todo-form">
        <input
          type="text"
          placeholder="Enter task..."
          value={newTodo}
          onChange={e => setNewTodo(e.target.value)}
        />
        <button onClick={addTodo}>Add Task</button>
      </div>
      <ul>
        {todos.map(todo => (
          <li key={todo.id} className="todo-item">
            <input
              type="checkbox"
              checked={todo.completed}
              onChange={() => toggleTodo(todo.id)}
            />
            <span style={{ textDecoration: todo.completed ? "line-through" : "none" }}>
              {todo.text}
            </span>
            <button onClick={() => deleteTodo(todo.id)}>Delete</button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default DailyTodo;