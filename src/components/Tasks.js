// Tasks.js
import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEllipsisVertical, faPlus, faCheck, faTags, faCalendarDays, faEdit, faTrash } from '@fortawesome/free-solid-svg-icons';
import '../styles/Tasks.css';
import axios from '../axiosinstance';

const Tasks = () => {
  const [selectedTask, setSelectedTask] = useState(null);
  const [tagFilter, setTagFilter] = useState('');
  const [tasks, setTasks] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [showContextMenu, setShowContextMenu] = useState(null);
  const [expandedTasks, setExpandedTasks] = useState([]);
  const [editingField, setEditingField] = useState(null);
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
    if (result.source.droppableId !== result.destination.droppableId) {
      const task = tasks.find(t => t.id === result.draggableId);
      const parentTask = tasks.find(t => t.id === result.destination.droppableId);

      if (task && parentTask) {
        try {
          await axios.put(`/api/tasks/${task.id}`, {
            parent_id: parentTask.id
          });
          setTasks(tasks.map(t =>
            t.id === task.id ? {...t, parent_id: parentTask.id} :
            t.id === parentTask.id ? {...t, subtasks: [...t.subtasks, task]} : t
          ));
        } catch (error) {
          console.error('Error moving subtask:', error);
        }
      }
      return;
    }
    const newTasks = Array.from(tasks);
    const [movedTask] = newTasks.splice(result.source.index, 1);
    newTasks.splice(result.destination.index, 0, movedTask);
    setTasks(newTasks);

    try {
      await axios.put(`/api/tasks/${movedTask.id}`, {
        task_order: result.destination.index,
        parent_id: result.destination.droppableId !== 'tasks' ?
          result.destination.droppableId : null
      });
    } catch (error) {
      setTasks(tasks); // Revert on error
    }
  };


  const handleTagChange = (taskId, newTags) => {
    setTasks(tasks.map(task =>
      task.id === taskId ? {...task, tags: newTags} : task
    ));
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

  const toggleComplete = async (taskId) => {
    try {
      const task = tasks.find(t => t.id === taskId);
      const updatedTask = {...task, completed: !task.completed};
      await axios.put(`/api/tasks/${taskId}`, updatedTask);
      setTasks(tasks.map(t => t.id === taskId ? updatedTask : t));
    } catch (error) {
      console.error('Error toggling completion:', error);
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

  const getDeadlineType = (dueDate) => {
    const diff = Math.floor((new Date(dueDate) - new Date()) / (1000 * 60 * 60 * 24));
    if (diff <= 1) return '1-day';
    if (diff <= 7) return '1-week';
    if (diff <= 14) return '2-weeks';
    return '';
  };


  const filteredTasks = tasks
  .filter(task =>
    (filter.category === 'all' || task.category === filter.category) &&
    (filter.status === 'all' || (filter.status === 'completed' ? task.completed : !task.completed)) &&
    (tagFilter === '' || task.tags.some(tag => tag.toLowerCase().includes(tagFilter.toLowerCase())))
  )
    .sort((a, b) => {
      if (a.task_order !== b.task_order) return a.task_order - b.task_order;
      if (a.due_date !== b.due_date) return new Date(a.due_date) - new Date(b.due_date);
      return a.priority - b.priority;
    });

  return (
    <div className="tasks-container">
      <div className="tasks-header">
        <div className="header-left">
          <select
              value={filter.category}
              onChange={(e) => setFilter({...filter, category: e.target.value})}
              className="category-select"
          >
            {['inbox', 'personal', 'work', 'shopping'].map(category => (
                <option key={category} value={category}>
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </option>
            ))}
          </select>
          <div className="filter-group">
            <select
                onChange={(e) => setFilter({...filter, status: e.target.value})}
                className="status-filter"
            >
              <option value="all">All Tasks</option>
              <option value="completed">Completed</option>
              <option value="active">Active</option>
            </select>
            <select
                onChange={(e) => setSortBy(e.target.value)}
                className="sort-select"
            >
              <option value="due_date">Sort by Due Date</option>
              <option value="priority">Sort by Priority</option>
              <option value="order">Sort by Order</option>
            </select>
            <input
                type="text"
                placeholder="Filter by tags..."
                value={tagFilter}
                onChange={(e) => setTagFilter(e.target.value)}
                className="tag-filter-input"
            />
          </div>
        </div>
        <button
            onClick={() => setShowModal(true)}
            className="new-task-button"
        >
          <FontAwesomeIcon icon={faPlus}/> New Task
        </button>
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
                            {task.subtasks.length > 0 && (
                              <div className="progress-bar">
                                <div
                                  className="progress-fill"
                                  style={{ width: `${getProgress(task.subtasks)}%` }}
                                />
                              </div>
                            )}
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
                                <span
                                    className="due-date"
                                    data-deadline={getDeadlineType(task.due_date)}
                                >
                                  <FontAwesomeIcon icon={faCalendarDays}/>
                                                                  {new Date(task.due_date).toLocaleDateString()}
                                </span>

                            )}
                            {task.tags.length > 0 && (
                              <span className="tags" data-tag={task.tags[0].toLowerCase()}>
                                <FontAwesomeIcon icon={faTags} />
                                {task.tags.join(', ')}
                              </span>
                            )}
                            <span className="category">{task.category}</span>
                          </div>
                        </div>

                              <div className="task-actions">
                                {task.subtasks.length > 0 && (
      <button
        className={`subtask-indicator ${
          !expandedTasks.includes(task.id) ? 'collapsed' : ''
        }`}
        onClick={() => setExpandedTasks(prev =>
          prev.includes(task.id)
            ? prev.filter(id => id !== task.id)
            : [...prev, task.id]
        )}
      >
        ▼
      </button>
    )}
                                <button
                                    className="more-btn"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setShowContextMenu(showContextMenu === task.id ? null : task.id);
                                    }}
                                >
                                  <FontAwesomeIcon icon={faEllipsisVertical}/>
                                </button>
                                {showContextMenu === task.id && (
                                    <div className="context-menu">
                                      <button
                                          onClick={() => {
                                            openEditModal(task);
                                            setShowContextMenu(null);
                                          }}
                                      >
                                        <FontAwesomeIcon icon={faEdit}/> Edit
                                      </button>
                                      <button
                                          onClick={() => {
                                            deleteTask(task.id);
                                            setShowContextMenu(null);
                                          }}
                                      >
                                        <FontAwesomeIcon icon={faTrash}/> Delete
                                      </button>
                                    </div>
                                )}
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
                        <FontAwesomeIcon icon={faCheck}/>
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

  {
    showModal && (
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