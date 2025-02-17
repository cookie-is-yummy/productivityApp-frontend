// Tasks.js
import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEllipsisVertical, faPlus, faCheck, faTags, faCalendarDays, faEdit, faTrash } from '@fortawesome/free-solid-svg-icons';
import '../styles/Tasks.css';
import axios from '../axiosinstance';

const Tasks = () => {
  const [selectedTask, setSelectedTask] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    due_date: '',
    category: 'inbox',
    tags: [],
    priority: 2,
    subtasks: [],
    parent_id: null
  });
  const [filter, setFilter] = useState({ category: 'inbox', status: 'all' });
  const [sortBy, setSortBy] = useState('due_date');

  // Fetch tasks from backend
  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const response = await axios.get('/api/tasks');
        setTasks(response.data);
      } catch (error) {
        console.error('Error fetching tasks:', error);
      }
    };
    fetchTasks();
  }, []);


  const handleDragEnd = async (result) => {
    if (!result.destination) return;

    const updatedTasks = Array.from(tasks);
    const [movedTask] = updatedTasks.splice(result.source.index, 1);
    updatedTasks.splice(result.destination.index, 0, movedTask);

    try {
      await axios.put(`/api/tasks/${movedTask.id}`, {
        task_order: result.destination.index
      });
      setTasks(updatedTasks);
    } catch (error) {
      console.error('Error updating task order:', error);
    }
  };

  const handleSubmitTask = async () => {
    try {
      const response = editingTask
        ? await axios.put(`/api/tasks/${editingTask.id}`, newTask)
        : await axios.post('/api/tasks', newTask);

      if (editingTask) {
        setTasks(tasks.map(task => task.id === editingTask.id ? response.data : task));
      } else {
        setTasks([...tasks, response.data]);
      }
      closeModal();
    } catch (error) {
      console.error('Error saving task:', error);
    }
  };

  const deleteTask = async (taskId) => {
    try {
      await axios.delete(`/api/tasks/${taskId}`);
      setTasks(tasks.filter(task => task.id !== taskId));
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  const openEditModal = (task) => {
    setEditingTask(task);
    setNewTask({
      title: task.title,
      description: task.description,
      due_date: task.due_date,
      category: task.category,
      tags: task.tags,
      priority: task.priority,
      subtasks: task.subtasks,
      parent_id: task.parent_id
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingTask(null);
    setNewTask({
      title: '',
      description: '',
      due_date: '',
      category: 'inbox',
      tags: [],
      priority: 2,
      subtasks: [],
      parent_id: null
    });
  };

  const filteredTasks = tasks
    .filter(task =>
      (filter.category === 'all' || task.category === filter.category) &&
      (filter.status === 'all' ||
       (filter.status === 'completed' ? task.completed : !task.completed))
    )
    .sort((a, b) => {
      if (sortBy === 'due_date') return new Date(a.due_date) - new Date(b.due_date);
      if (sortBy === 'priority') return a.priority - b.priority;
      return a.task_order - b.task_order;
    });

  return (
    <div className="tasks-container">
      <div className="tasks-header">
        <h1>{filter.category.charAt(0).toUpperCase() + filter.category.slice(1)}</h1>
        <div className="controls">
          <select onChange={(e) => setFilter({ ...filter, status: e.target.value })}>
            <option value="all">All</option>
            <option value="completed">Completed</option>
            <option value="active">Active</option>
          </select>
          <select onChange={(e) => setSortBy(e.target.value)}>
            <option value="due_date">Sort by Due Date</option>
            <option value="priority">Sort by Priority</option>
            <option value="order">Sort by Order</option>
          </select>
          <button onClick={() => setShowModal(true)}>
            <FontAwesomeIcon icon={faPlus} /> New Task
          </button>
        </div>
      </div>

      <div className="category-sidebar">
        {['inbox', 'personal', 'work', 'shopping'].map(category => (
          <button
            key={category}
            className={filter.category === category ? 'active' : ''}
            onClick={() => setFilter({ ...filter, category })}
          >
            {category.charAt(0).toUpperCase() + category.slice(1)}
          </button>
        ))}
      </div>

      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="tasks">
          {(provided) => (
            <div
              {...provided.droppableProps}
              ref={provided.innerRef}
              className="task-list"
            >
              {filteredTasks.map((task, index) => (
                <Draggable key={task.id} draggableId={String(task.id)} index={index}>
                  {(provided) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                      className={`task-item ${task.completed ? 'completed' : ''}`}
                    >
                      <div className="task-main">
                        <button
                          className="complete-btn"
                          onClick={() => toggleComplete(task.id)}
                        >
                          <FontAwesomeIcon icon={faCheck} />
                        </button>
                        <div className="task-info">
                          <h3>{task.title}</h3>
                          <p>{task.description}</p>
                          <div className="task-meta">
                            {task.due_date && (
                              <span className="due-date">
                                <FontAwesomeIcon icon={faCalendarDays} />
                                {new Date(task.due_date).toLocaleDateString()}
                              </span>
                            )}
                            {task.tags.length > 0 && (
                              <span className="tags">
                                <FontAwesomeIcon icon={faTags} />
                                {task.tags.join(', ')}
                              </span>
                            )}
                            <span className="category">{task.category}</span>
                          </div>
                        </div>
                        <div className="task-actions">
                          <div
                            className="more-btn"
                            onMouseEnter={() => setSelectedTask(task.id)}
                            onMouseLeave={() => setSelectedTask(null)}
                          >
                            <FontAwesomeIcon icon={faEllipsisVertical} />
                            {selectedTask === task.id && (
                              <div className="context-menu">
                                <button onClick={() => openEditModal(task)}>
                                  <FontAwesomeIcon icon={faEdit} /> Edit
                                </button>
                                <button onClick={() => deleteTask(task.id)}>
                                  <FontAwesomeIcon icon={faTrash} /> Delete
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      {task.subtasks.length > 0 && (
                        <div className="subtasks">
                          {task.subtasks.map(subtask => (
                            <div key={subtask.id} className="subtask">
                              <button
                                className="complete-btn small"
                                onClick={() => toggleComplete(subtask.id)}
                              >
                                <FontAwesomeIcon icon={faCheck} />
                              </button>
                              <span>{subtask.title}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>

      {showModal && (
        <div className="modal">
          <div className="modal-content">
            <h2>{editingTask ? 'Edit Task' : 'Create New Task'}</h2>
            <div className="form-group">
              <label>Task Title</label>
              <input
                type="text"
                placeholder="Enter task title"
                value={newTask.title}
                onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label>Description</label>
              <textarea
                placeholder="Add task description"
                value={newTask.description}
                onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Due Date</label>
                <input
                  type="date"
                  value={newTask.due_date}
                  onChange={(e) => setNewTask({ ...newTask, due_date: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Duration (minutes)</label>
                <input
                  type="number"
                  placeholder="60"
                  value={newTask.duration}
                  onChange={(e) => setNewTask({ ...newTask, duration: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Priority</label>
                <select
                  value={newTask.priority}
                  onChange={(e) => setNewTask({ ...newTask, priority: parseInt(e.target.value) })}
                >
                  <option value={1}>High Priority</option>
                  <option value={2}>Medium Priority</option>
                  <option value={3}>Low Priority</option>
                </select>
              </div>

              <div className="form-group">
                <label>Category</label>
                <select
                  value={newTask.category}
                  onChange={(e) => setNewTask({ ...newTask, category: e.target.value })}
                >
                  {['inbox', 'personal', 'work', 'shopping'].map(category => (
                    <option key={category} value={category}>
                      {category.charAt(0).toUpperCase() + category.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>Tags</label>
              <input
                type="text"
                placeholder="comma, separated, tags"
                value={newTask.tags.join(', ')}
                onChange={(e) => setNewTask({ ...newTask, tags: e.target.value.split(', ') })}
              />
            </div>

            <div className="modal-actions">
              <button className="btn-primary" onClick={handleSubmitTask}>
                {editingTask ? 'Save Changes' : 'Create Task'}
              </button>
              <button className="btn-secondary" onClick={closeModal}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Tasks;