import React, { useState, useEffect } from 'react';
import { Dialog } from '@headlessui/react';
import './Todos.css';

function Todos() {
  const [todos, setTodos] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTodo, setNewTodo] = useState({
    text: '',
    tags: [],
    tagInput: '',
    duration: '',
    importance: 'medium',
    dueDate: ''
  });

  useEffect(() => {
    const fetchTodos = async () => {
      try {
        const res = await fetch('https://productivity-app-xyzfe-b5bed29e76a5.herokuapp.com/api/todos');
        const data = await res.json();
        setTodos(data);
      } catch (error) {
        console.error(error);
      }
    };
    fetchTodos();
  }, []);

  const handleAddTodo = async () => {
    const todoPayload = {
      ...newTodo,
      tags: newTodo.tags.join(','),
      duration: newTodo.duration || null
    };

    try {
      const res = await fetch('https://productivity-app-xyzfe-b5bed29e76a5.herokuapp.com/api/todos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(todoPayload)
      });
      const data = await res.json();
      setTodos([...todos, data]);
      setIsModalOpen(false);
      setNewTodo({
        text: '',
        tags: [],
        tagInput: '',
        duration: '',
        importance: 'medium',
        dueDate: ''
      });
    } catch (error) {
      console.error(error);
    }
  };

  const toggleTodoCompletion = async (todoId, currentStatus) => {
    try {
      const res = await fetch(
        `https://productivity-app-xyzfe-b5bed29e76a5.herokuapp.com/api/todos/${todoId}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ completed: !currentStatus })
        }
      );
      const data = await res.json();
      setTodos(todos.map(todo => (todo.id === data.id ? data : todo)));
    } catch (error) {
      console.error(error);
    }
  };

  const handleTagInput = (e) => {
    const value = e.target.value;
    if (value.endsWith(',')) {
      const newTag = value.slice(0, -1).trim();
      if (newTag && !newTodo.tags.includes(newTag)) {
        setNewTodo(prev => ({
          ...prev,
          tags: [...prev.tags, newTag],
          tagInput: ''
        }));
      } else {
        setNewTodo(prev => ({ ...prev, tagInput: '' }));
      }
    } else {
      setNewTodo(prev => ({ ...prev, tagInput: value }));
    }
  };

  return (
    <div className="todos-container">
      <header className="todos-header">
        <h2 className="todos-title">Tasks</h2>
        <button
          onClick={() => setIsModalOpen(true)}
          className="btn btn-primary"
        >
          <svg className="icon plus-icon" viewBox="0 0 20 20" fill="currentColor">
            <path
              fillRule="evenodd"
              d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
              clipRule="evenodd"
            />
          </svg>
          New Task
        </button>
      </header>

      <ul className="todos-list">
        {todos.map(todo => (
          <li key={todo.id} className="todo-item">
            <button
              onClick={() => toggleTodoCompletion(todo.id, todo.completed)}
              className={`todo-checkbox ${todo.completed ? 'completed' : ''}`}
            >
              {todo.completed && (
                <svg className="icon check-icon" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M5 13l4 4L19 7"
                  />
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
                    <svg className="icon duration-icon" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
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
                  onChange={(e) =>
                    setNewTodo((prev) => ({ ...prev, text: e.target.value }))
                  }
                  className="form-input"
                  placeholder="What needs to be done?"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="form-group">
                  <label className="form-label">Duration (minutes)</label>
                  <input
                    type="number"
                    value={newTodo.duration}
                    onChange={(e) =>
                      setNewTodo((prev) => ({ ...prev, duration: e.target.value }))
                    }
                    className="form-input"
                    min="1"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Importance</label>
                  <select
                    value={newTodo.importance}
                    onChange={(e) =>
                      setNewTodo((prev) => ({ ...prev, importance: e.target.value }))
                    }
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
                        onClick={() =>
                          setNewTodo((prev) => ({
                            ...prev,
                            tags: prev.tags.filter((_, i) => i !== index)
                          }))
                        }
                        className="tag-remove"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                  <input
                    type="text"
                    value={newTodo.tagInput}
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
                  onChange={(e) =>
                    setNewTodo((prev) => ({ ...prev, dueDate: e.target.value }))
                  }
                  className="form-input"
                />
              </div>

              <div className="modal-actions">
                <button onClick={() => setIsModalOpen(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button onClick={handleAddTodo} className="btn btn-primary">
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