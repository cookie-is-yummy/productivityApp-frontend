import React, { useState, useEffect } from 'react';
import { Dialog } from '@headlessui/react';

function Todos() {
  const [todos, setTodos] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTodo, setNewTodo] = useState({
    text: '',
    tags: [],
    duration: '',
    importance: 'medium',
    dueDate: ''
  });

  // Fetch todos from backend
  useEffect(() => {
    fetchTodos();
  }, []);

  const fetchTodos = () => {
    fetch('https://productivity-app-xyzfe-b5bed29e76a5.herokuapp.com/api/todos')
      .then(res => res.json())
      .then(data => setTodos(data))
      .catch(console.error);
  };

  const handleAddTodo = () => {
    const todoPayload = {
      ...newTodo,
      tags: newTodo.tags.join(','),
      duration: newTodo.duration || null
    };

    fetch('https://productivity-app-xyzfe-b5bed29e76a5.herokuapp.com/api/todos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(todoPayload)
    })
      .then(res => res.json())
      .then(data => {
        setTodos([...todos, { ...data, completed: false }]);
        setIsModalOpen(false);
        setNewTodo({ text: '', tags: [], duration: '', importance: 'medium', dueDate: '' });
      })
      .catch(console.error);
  };

  const toggleTodoCompletion = (todoId, currentStatus) => {
    fetch(`https://productivity-app-xyzfe-b5bed29e76a5.herokuapp.com/api/todos/${todoId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ completed: !currentStatus })
    })
      .then(res => res.json())
      .then(data => {
        setTodos(todos.map(todo => todo.id === data.id ? data : todo));
      })
      .catch(console.error);
  };

  const handleTagInput = (e) => {
    const value = e.target.value;
    if ([' ', ','].includes(value.slice(-1))) {
      setNewTodo(prev => ({
        ...prev,
        tags: [...prev.tags, value.slice(0, -1).trim()],
        tagInput: ''
      }));
    } else {
      setNewTodo(prev => ({ ...prev, tagInput: value }));
    }
  };

  return (
    <div className="todos-container">
      <div className="todos-header">
        <h2 className="todos-title">Tasks</h2>
        <button
          onClick={() => setIsModalOpen(true)}
          className="btn-primary"
        >
          <svg className="plus-icon" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
          </svg>
          New Task
        </button>
      </div>

      <ul className="todos-list">
        {todos.map(todo => (
          <li
            key={todo.id}
            className="todo-item"
          >
            <button
              onClick={() => toggleTodoCompletion(todo.id, todo.completed)}
              className={`todo-checkbox ${todo.completed ? 'completed' : ''}`}
            >
              {todo.completed && (
                <svg className="check-icon" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
              )}
            </button>

            <div className="todo-content">
              <p className={`todo-text ${todo.completed ? 'completed' : ''}`}>
                {todo.text}
              </p>

              <div className="todo-meta">
                {todo.tags && todo.tags.split(',').map((tag, index) => (
                  <span key={index} className="todo-tag">
                    {tag}
                  </span>
                ))}
                {todo.duration && (
                  <span className="todo-duration">
                    <svg className="duration-icon" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {todo.duration}m
                  </span>
                )}
              </div>
            </div>
          </li>
        ))}
      </ul>

      <Dialog open={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <div className="modal-overlay" aria-hidden="true" />
        <div className="modal-container">
          <Dialog.Panel className="modal-panel">
            <Dialog.Title className="modal-title">Create New Task</Dialog.Title>

            <div className="modal-content">
              <div className="form-group">
                <label className="form-label">Task Description</label>
                <input
                  type="text"
                  value={newTodo.text}
                  onChange={(e) => setNewTodo(prev => ({ ...prev, text: e.target.value }))}
                  className="form-input"
                  placeholder="What needs to be done?"
                />
              </div>

              <div className="grid-cols-2">
                <div className="form-group">
                  <label className="form-label">Duration (minutes)</label>
                  <input
                    type="number"
                    value={newTodo.duration}
                    onChange={(e) => setNewTodo(prev => ({ ...prev, duration: e.target.value }))}
                    className="form-input"
                    min="1"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Importance</label>
                  <select
                    value={newTodo.importance}
                    onChange={(e) => setNewTodo(prev => ({ ...prev, importance: e.target.value }))}
                    className="form-input"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Tags</label>
                <div className="tags-container">
                  {newTodo.tags.map((tag, index) => (
                    <span key={index} className="tag-item">
                      {tag}
                      <button
                        onClick={() => setNewTodo(prev => ({
                          ...prev,
                          tags: prev.tags.filter((_, i) => i !== index)
                        }))}
                        className="tag-remove"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                  <input
                    type="text"
                    value={newTodo.tagInput || ''}
                    onChange={handleTagInput}
                    className="tag-input"
                    placeholder="Add tags..."
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Due Date</label>
                <input
                  type="date"
                  value={newTodo.dueDate}
                  onChange={(e) => setNewTodo(prev => ({ ...prev, dueDate: e.target.value }))}
                  className="form-input"
                />
              </div>

              <div className="modal-actions">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddTodo}
                  className="btn-primary"
                >
                  Create Task
                </button>
              </div>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>
    </div>
  );
}

export default Todos;