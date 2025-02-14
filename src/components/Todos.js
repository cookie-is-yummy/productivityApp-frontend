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
    <div className="section todos">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold">Tasks</h2>
        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
          </svg>
          New Task
        </button>
      </div>

      {/* Todo List */}
      <ul className="space-y-2">
        {todos.map(todo => (
          <li
            key={todo.id}
            className="group flex items-center p-4 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow"
          >
            <button
              onClick={() => toggleTodoCompletion(todo.id, todo.completed)}
              className={`w-5 h-5 rounded-full border-2 mr-3 flex items-center justify-center 
                ${todo.completed ? 'border-green-500 bg-green-500' : 'border-gray-300'}`}
            >
              {todo.completed && (
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
              )}
            </button>

            <div className="flex-1">
              <p className={`text-gray-800 ${todo.completed ? 'line-through opacity-75' : ''}`}>
                {todo.text}
              </p>

              <div className="flex items-center gap-2 mt-1">
                {todo.tags && todo.tags.split(',').map((tag, index) => (
                  <span key={index} className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                    {tag}
                  </span>
                ))}
                {todo.duration && (
                  <span className="flex items-center gap-1 text-sm text-gray-500">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

      {/* Add Todo Modal */}
      <Dialog open={isModalOpen} onClose={() => setIsModalOpen(false)} className="relative z-50">
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" aria-hidden="true" />

        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="w-full max-w-md bg-white rounded-2xl p-6">
            <Dialog.Title className="text-xl font-semibold mb-4">Create New Task</Dialog.Title>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Task Description</label>
                <input
                  type="text"
                  value={newTodo.text}
                  onChange={(e) => setNewTodo(prev => ({ ...prev, text: e.target.value }))}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="What needs to be done?"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Duration (minutes)</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={newTodo.duration}
                      onChange={(e) => setNewTodo(prev => ({ ...prev, duration: e.target.value }))}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      min="1"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Importance</label>
                  <select
                    value={newTodo.importance}
                    onChange={(e) => setNewTodo(prev => ({ ...prev, importance: e.target.value }))}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Tags</label>
                <div className="flex flex-wrap gap-2 p-2 border rounded-lg">
                  {newTodo.tags.map((tag, index) => (
                    <span key={index} className="px-2 py-1 text-sm bg-blue-100 text-blue-800 rounded-full flex items-center gap-1">
                      {tag}
                      <button
                        onClick={() => setNewTodo(prev => ({
                          ...prev,
                          tags: prev.tags.filter((_, i) => i !== index)
                        }))}
                        className="ml-1 hover:text-blue-600"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                  <input
                    type="text"
                    value={newTodo.tagInput || ''}
                    onChange={handleTagInput}
                    className="flex-1 p-1 min-w-[120px] outline-none"
                    placeholder="Add tags..."
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Due Date</label>
                <input
                  type="date"
                  value={newTodo.dueDate}
                  onChange={(e) => setNewTodo(prev => ({ ...prev, dueDate: e.target.value }))}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex justify-end gap-2 mt-6">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-gray-500 hover:bg-gray-50 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddTodo}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
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