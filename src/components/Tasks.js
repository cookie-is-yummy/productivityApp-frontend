import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import axios from '../axiosinstance';
import '../styles/Tasks.css';

const Tasks = () => {
  const [tasks, setTasks] = useState([]);
  const [categories, setCategories] = useState({});
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    due_date: '',
    duration: 30,
    priority: 3,
    tags: '',
    category: 'General'
  });
  const [filter, setFilter] = useState('');
  const [expandedCategories, setExpandedCategories] = useState({});

  // Fetch tasks and organize by category
  useEffect(() => {
    const fetchTasks = async () => {
      const response = await axios.get('/api/tasks');
      const tasksData = response.data;
      const categorized = tasksData.reduce((acc, task) => {
        if (!task.parent_id) { // Only show parent tasks in categories
          acc[task.category] = acc[task.category] || [];
          acc[task.category].push(task);
        }
        return acc;
      }, {});
      setCategories(categorized);
      setExpandedCategories(Object.keys(categorized).reduce((acc, cat) => {
        acc[cat] = true;
        return acc;
      }, {}));
    };
    fetchTasks();
  }, []);

  const handleCreateTask = async (e) => {
    e.preventDefault();
    const response = await axios.post('/api/tasks', {
      ...newTask,
      tags: newTask.tags.split(','),
      completed: false,
      is_subtask: false
    });
    setCategories(prev => ({
      ...prev,
      [newTask.category]: [...(prev[newTask.category] || []), response.data]
    }));
    setNewTask({ ...newTask, title: '', description: '' });
  };

  const handleDragEnd = async (result) => {
    if (!result.destination) return;

    const taskId = result.draggableId;
    const sourceCat = result.source.droppableId;
    const destCat = result.destination.droppableId;
    const task = categories[sourceCat].find(t => t.id.toString() === taskId);

    // Update category if moved between categories
    if (sourceCat !== destCat) {
      await axios.put(`/api/tasks/${taskId}`, { category: destCat });
      setCategories(prev => ({
        ...prev,
        [sourceCat]: prev[sourceCat].filter(t => t.id.toString() !== taskId),
        [destCat]: [...(prev[destCat] || []), { ...task, category: destCat }]
      }));
    }
  };

  return (
    <div className="tasks-container">
      <div className="tasks-header">
        <input
          type="text"
          placeholder="Filter tasks..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />

        <form onSubmit={handleCreateTask} className="task-form">
          <input
            type="text"
            placeholder="Task title"
            value={newTask.title}
            onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
            required
          />
          <button type="submit">Create Task</button>
        </form>
      </div>

      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="categories-container">
          {Object.entries(categories).map(([category, tasks]) => (
            <div key={category} className="category-column">
              <div className="category-header">
                <h3>{category}</h3>
                <button
                  onClick={() => setExpandedCategories(prev => ({
                    ...prev,
                    [category]: !prev[category]
                  }))}
                >
                  {expandedCategories[category] ? '▼' : '▶'}
                </button>
              </div>

              {expandedCategories[category] && (
                <Droppable droppableId={category}>
                  {(provided) => (
                    <div
                      {...provided.droppableProps}
                      ref={provided.innerRef}
                      className="tasks-list"
                    >
                      {tasks.filter(task =>
                        task.title.toLowerCase().includes(filter.toLowerCase()) ||
                        task.description.toLowerCase().includes(filter.toLowerCase())
                      ).map((task, index) => (
                        <Draggable
                          key={task.id}
                          draggableId={task.id.toString()}
                          index={index}
                        >
                          {(provided) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className="task-card"
                            >
                              <div className="task-header">
                                <input
                                  type="checkbox"
                                  checked={task.completed}
                                  onChange={async () => {
                                    await axios.post(`/api/tasks/${task.id}/complete`);
                                    setCategories(prev => ({
                                      ...prev,
                                      [category]: prev[category].map(t =>
                                        t.id === task.id ? { ...t, completed: true } : t
                                      )
                                    }));
                                  }}
                                />
                                <span className="task-title">{task.title}</span>
                                <button
                                  onClick={async (e) => {
                                    e.stopPropagation();
                                    await axios.delete(`/api/tasks/${task.id}`);
                                    setCategories(prev => ({
                                      ...prev,
                                      [category]: prev[category].filter(t => t.id !== task.id)
                                    }));
                                  }}
                                >
                                  ✕
                                </button>
                              </div>
                              <p className="task-description">{task.description}</p>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              )}
            </div>
          ))}
        </div>
      </DragDropContext>
    </div>
  );
};

export default Tasks;