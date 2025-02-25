// Tasks.js
import React, { useState, useEffect, useRef } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faEllipsisVertical, faPlus, faCheck, faTags, faCalendarDays,
  faEdit, faTrash, faCaretDown, faPalette, faFolder
} from '@fortawesome/free-solid-svg-icons';
import '../styles/Tasks.css';
import axios from '../axiosinstance';

// Custom Dropdown Component
const CustomDropdown = ({ value, onChange, options, placeholder, className }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={`custom-dropdown ${className || ''}`} ref={dropdownRef}>
      <div
        className="dropdown-selected"
        onClick={() => setIsOpen(!isOpen)}
      >
        {options.find(opt => opt.value === value)?.label || placeholder || 'Select...'}
        <FontAwesomeIcon icon={faCaretDown} className={`dropdown-caret ${isOpen ? 'open' : ''}`} />
      </div>

      {isOpen && (
        <div className="dropdown-menu">
          {options.map(option => (
            <div
              key={option.value}
              className={`dropdown-item ${option.value === value ? 'selected' : ''} ${option.isSubcategory ? 'subcategory' : ''}`}
              onClick={() => {
                if (!option.isSubcategory) { // Only allow selection of non-subcategories
                  onChange(option.value);
                  setIsOpen(false);
                }
              }}
            >
              {option.isSubcategory && <span className="subcategory-indent">└ </span>}
              {option.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Date Picker Modal
const DatePickerModal = ({ selectedDate, onSelect, onClose }) => {
  const [date, setDate] = useState(selectedDate || '');

  return (
    <div className="date-picker-modal">
      <div className="date-picker-header">
        <h4>Select Due Date</h4>
        <button className="close-btn" onClick={onClose}>×</button>
      </div>
      <div className="date-picker-content">
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="date-input"
        />
        <div className="date-picker-actions">
          <button
            className="btn-primary"
            onClick={() => {
              onSelect(date);
              onClose();
            }}
          >
            Apply Date
          </button>
          <button
            className="btn-secondary"
            onClick={() => {
              setDate('');
              onSelect('');
              onClose();
            }}
          >
            Clear Date
          </button>
        </div>
      </div>
    </div>
  );
};

// Tag Component with Click Handling
const Tag = ({ tag, onClick }) => {
  return (
    <span
      className="tag"
      data-tag={tag.toLowerCase()}
      onClick={onClick}
    >
      {tag}
    </span>
  );
};

// Color Picker Component for Tags
const ColorPicker = ({ onSelect, onClose }) => {
  const colors = [
    { name: 'red', hex: '#fee2e2' },
    { name: 'orange', hex: '#fed7aa' },
    { name: 'yellow', hex: '#fef9c3' },
    { name: 'green', hex: '#dcfce7' },
    { name: 'blue', hex: '#e0f2fe' },
    { name: 'purple', hex: '#f3e8ff' },
    { name: 'pink', hex: '#fce7f3' },
  ];

  return (
    <div className="color-picker">
      <div className="color-picker-header">
        <h4>Choose a color</h4>
        <button className="close-btn" onClick={onClose}>×</button>
      </div>
      <div className="color-options">
        {colors.map(color => (
          <div
            key={color.name}
            className="color-option"
            style={{ backgroundColor: color.hex }}
            onClick={() => {
              onSelect(color.name);
              onClose();
            }}
          />
        ))}
      </div>
    </div>
  );
};

// Category Management Component
const CategoryManager = ({ categories, onAddCategory, onClose }) => {
  const [newCategory, setNewCategory] = useState('');
  const [parentCategory, setParentCategory] = useState('');

  const handleSubmit = () => {
    if (!newCategory.trim()) return;

    onAddCategory(
      newCategory.trim(),
      parentCategory ? parentCategory : null
    );
    setNewCategory('');
  };

  // Filter out subcategories for parent dropdown
  const topLevelCategories = categories.filter(cat => !cat.parent_id);

  return (
    <div className="category-manager">
      <div className="category-manager-header">
        <h4>Manage Categories</h4>
        <button className="close-btn" onClick={onClose}>×</button>
      </div>

      <div className="category-form">
        <div className="form-group">
          <label>New Category</label>
          <input
            type="text"
            value={newCategory}
            onChange={e => setNewCategory(e.target.value)}
            placeholder="Category name"
          />
        </div>

        {topLevelCategories.length > 0 && (
          <div className="form-group">
            <label>Parent Category (optional)</label>
            <CustomDropdown
              value={parentCategory}
              onChange={setParentCategory}
              options={[
                { value: '', label: 'None (Top Level)' },
                ...topLevelCategories.map(cat => ({ value: cat.id, label: cat.name }))
              ]}
              placeholder="None (Top Level)"
            />
          </div>
        )}

        <button className="btn-primary" onClick={handleSubmit}>
          Add Category
        </button>
      </div>

      {categories.length > 0 && (
        <div className="existing-categories">
          <h5>Existing Categories</h5>
          <div className="category-list">
            {categories.map(category => (
              <div key={category.id} className="category-item">
                {category.parent_id && <span className="category-indent">└ </span>}
                {category.name}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const Tasks = () => {
  const [selectedTask, setSelectedTask] = useState(null);
  const [tagFilter, setTagFilter] = useState('');
  const [tasks, setTasks] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [showContextMenu, setShowContextMenu] = useState(null);
  const [expandedTasks, setExpandedTasks] = useState([]);
  const [editingField, setEditingField] = useState(null);
  const [showDatePicker, setShowDatePicker] = useState(null);
  const [categories, setCategories] = useState([
    { id: 'inbox', name: 'Inbox', parent_id: null },
    { id: 'personal', name: 'Personal', parent_id: null },
    { id: 'work', name: 'Work', parent_id: null },
    { id: 'work-projects', name: 'Projects', parent_id: 'work' },
    { id: 'work-meetings', name: 'Meetings', parent_id: 'work' },
    { id: 'personal-home', name: 'Home', parent_id: 'personal' },
    { id: 'shopping', name: 'Shopping', parent_id: null }
  ]);
  const [showCategoryManager, setShowCategoryManager] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(null);
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
  const [sortOption, setSortOption] = useState('due_date');

  // Ref for context menu positioning
  const contextMenuRef = useRef(null);

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

  // Close context menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showContextMenu && contextMenuRef.current && !contextMenuRef.current.contains(event.target)) {
        setShowContextMenu(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showContextMenu]);

  const handleDragEnd = async (result) => {
    if (!result.destination) return;

    const { source, destination, draggableId } = result;
    const taskId = draggableId;

    // Creating a subtask by dropping onto another task
    if (destination.droppableId.startsWith('task-')) {
      const parentId = destination.droppableId.replace('task-', '');

      // Don't allow making a task a subtask of itself or its descendants
      if (taskId === parentId) return;

      // Check if target would become a descendant of itself
      const wouldCreateCycle = (parentTaskId, childTaskId) => {
        const childTask = tasks.find(t => t.id === childTaskId);
        if (!childTask) return false;

        if (childTask.subtasks.includes(parentTaskId)) return true;

        return childTask.subtasks.some(subId =>
          wouldCreateCycle(parentTaskId, subId)
        );
      };

      if (wouldCreateCycle(taskId, parentId)) return;

      try {
        // Update the backend
        await axios.put(`/api/tasks/${taskId}`, {
          parent_id: parentId
        });

        // Update the UI
        const updatedTasks = tasks.map(task => {
          if (task.id === taskId) {
            return { ...task, parent_id: parentId };
          }
          if (task.id === parentId && !task.subtasks.includes(taskId)) {
            return { ...task, subtasks: [...task.subtasks, taskId] };
          }
          return task;
        });

        setTasks(updatedTasks);
      } catch (error) {
        console.error('Error updating task parent:', error);
      }
      return;
    }

    // Reordering within the same list
    if (source.droppableId === destination.droppableId) {
      const reorderedTasks = Array.from(tasks);
      const filteredTasks = reorderedTasks.filter(t =>
        (filter.category === 'all' || t.category === filter.category) &&
        (filter.status === 'all' || (filter.status === 'completed' ? t.completed : !t.completed)) &&
        (tagFilter === '' || t.tags.some(tag => tag.toLowerCase().includes(tagFilter.toLowerCase())))
      );

      const [movedTask] = filteredTasks.splice(source.index, 1);
      filteredTasks.splice(destination.index, 0, movedTask);

      // Update the order of tasks
      const updatedTasks = reorderedTasks.map(task => {
        const index = filteredTasks.findIndex(t => t.id === task.id);
        if (index !== -1) {
          return { ...task, task_order: index };
        }
        return task;
      });

      setTasks(updatedTasks);

      try {
        await axios.put(`/api/tasks/${taskId}`, {
          task_order: destination.index
        });
      } catch (error) {
        console.error('Error updating task order:', error);
      }
    }
  };

  const handleTagClick = (task, tagIndex) => {
    setShowColorPicker({ taskId: task.id, tagIndex });
  };

  const handleTagColorChange = async (color, taskId, tagIndex) => {
    try {
      const task = tasks.find(t => t.id === taskId);
      if (!task) return;

      // Update the tag with color information
      const updatedTags = [...task.tags];
      const tagName = updatedTags[tagIndex].replace(/\s\[.*\]$/, '');
      updatedTags[tagIndex] = `${tagName} [${color}]`;

      await axios.put(`/api/tasks/${taskId}`, {
        tags: updatedTags
      });

      setTasks(tasks.map(t =>
        t.id === taskId ? {...t, tags: updatedTags} : t
      ));
    } catch (error) {
      console.error('Error updating tag color:', error);
    }

    setShowColorPicker(null);
  };

  const handleDateClick = (task) => {
    // Show date picker modal instead of inline editing
    setShowDatePicker(task.id);
  };

  const handleDateSelection = async (taskId, newDate) => {
    try {
      await axios.put(`/api/tasks/${taskId}`, {
        due_date: newDate
      });

      setTasks(tasks.map(t =>
        t.id === taskId ? {...t, due_date: newDate} : t
      ));
    } catch (error) {
      console.error('Error updating due date:', error);
    }

    // Close the date picker
    setShowDatePicker(null);
  };

  const handleCategoryClick = (categoryName) => {
    // Find the category by name
    const category = categories.find(cat => cat.name.toLowerCase() === categoryName.toLowerCase());
    if (category) {
      setFilter({...filter, category: category.id});
    }
  };

  const handleAddCategory = async (name, parentId = null) => {
    // Generate a unique ID (in a real app, this would come from the backend)
    const id = `category_${Date.now()}`;

    const newCategory = { id, name, parent_id: parentId };
    setCategories([...categories, newCategory]);

    // In a real app, you'd send this to the backend
    try {
      // await axios.post('/api/categories', newCategory);
      console.log('Added new category:', newCategory);
    } catch (error) {
      console.error('Error adding category:', error);
    }
  };

  const handleTagChange = async (taskId, newTags) => {
    try {
      // First update the backend
      await axios.put(`/api/tasks/${taskId}`, {
        tags: newTags
      });

      // Then update the UI
      setTasks(tasks.map(task =>
        task.id === taskId ? {...task, tags: newTags} : task
      ));
    } catch (error) {
      console.error('Error updating tags:', error);
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

  const getProgress = (subtaskIds) => {
    const subtasks = subtaskIds.map(id => tasks.find(t => t.id === id));
    const completed = subtasks.filter(st => st?.completed).length;
    return (completed / subtasks.length) * 100 || 0;
  };

  // Prepare the category options with proper nesting
  const getCategoryOptions = () => {
    // Start with top-level categories
    const options = categories
      .filter(cat => !cat.parent_id)
      .map(cat => ({ value: cat.id, label: cat.name }));

    // Find and add subcategories directly after their parents
    categories.forEach(cat => {
      if (cat.parent_id) {
        const parentIndex = options.findIndex(opt => opt.value === cat.parent_id);
        if (parentIndex !== -1) {
          // Insert after the parent
          options.splice(parentIndex + 1, 0, {
            value: cat.id,
            label: cat.name,
            isSubcategory: true // Mark as subcategory to prevent selection
          });
        }
      }
    });

    return options;
  };

  // Filter and sort tasks - updated to move completed to the bottom of each section
  const filteredTasks = tasks
    .filter(task =>
      (filter.category === 'all' || task.category === filter.category) &&
      (filter.status === 'all' || (filter.status === 'completed' ? task.completed : !task.completed)) &&
      (tagFilter === '' || task.tags.some(tag => tag.toLowerCase().includes(tagFilter.toLowerCase())))
    )
    .sort((a, b) => {
      // First sort by completion status
      if (a.completed !== b.completed) return a.completed ? 1 : -1;

      // Then sort by the selected option
      switch (sortOption) {
        case 'due_date':
          return (a.due_date || '9999-99-99').localeCompare(b.due_date || '9999-99-99');
        case 'priority':
          return a.priority - b.priority;
        case 'title':
          return a.title.localeCompare(b.title);
        default:
          return a.task_order - b.task_order;
      }
    });

  // Only show top-level tasks in the main list
  const topLevelTasks = filteredTasks.filter(task => !task.parent_id);

  return (
    <div className="tasks-container">
      <div className="tasks-header">
        <div className="header-left">
          <div className="category-selector">
            <CustomDropdown
              value={filter.category}
              onChange={(value) => setFilter({...filter, category: value})}
              options={getCategoryOptions()}
              className="category-dropdown"
            />
            <button
              className="category-manage-btn"
              onClick={() => setShowCategoryManager(true)}
            >
              <FontAwesomeIcon icon={faFolder} />
            </button>
          </div>

          <div className="filter-group">
            <CustomDropdown
              value={filter.status}
              onChange={(value) => setFilter({...filter, status: value})}
              options={[
                { value: 'all', label: 'All Tasks' },
                { value: 'active', label: 'Active Tasks' },
                { value: 'completed', label: 'Completed Tasks' }
              ]}
              className="status-dropdown"
            />

            <div className="sort-container">
              <span className="sort-label">Sort by:</span>
              <CustomDropdown
                value={sortOption}
                onChange={setSortOption}
                options={[
                  { value: 'due_date', label: 'Due Date' },
                  { value: 'priority', label: 'Priority' },
                  { value: 'title', label: 'Name' }
                ]}
                className="sort-dropdown"
              />
            </div>

            <div className="tag-filter">
              <input
                type="text"
                placeholder="Filter by tags..."
                value={tagFilter}
                onChange={(e) => setTagFilter(e.target.value)}
                className="tag-filter-input"
              />
            </div>
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
              {topLevelTasks.map((task, index) => (
                <Draggable key={task.id} draggableId={String(task.id)} index={index}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                      className={`task-item ${task.completed ? 'completed' : ''} ${snapshot.isDragging ? 'dragging' : ''}`}
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
                                id={`date-${task.id}`}
                                className="due-date"
                                data-deadline={getDeadlineType(task.due_date)}
                                onClick={() => handleDateClick(task)}
                              >
                                <FontAwesomeIcon icon={faCalendarDays}/>
                                {new Date(task.due_date).toLocaleDateString()}
                              </span>
                            )}

                            <div className="tags-container">
                              {task.tags.map((tag, idx) => (
                                <Tag
                                  key={idx}
                                  tag={tag}
                                  onClick={() => handleTagClick(task, idx)}
                                />
                              ))}
                            </div>

                            <span
                              className="category"
                              onClick={() => handleCategoryClick(task.category)}
                            >
                              {task.category}
                            </span>
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
                            <div className="context-menu" ref={contextMenuRef}>
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

                      {/* Subtask section with droppable area */}
                      {task.subtasks.length > 0 && expandedTasks.includes(task.id) && (
                        <Droppable droppableId={`task-${task.id}`}>
                          {(provided) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.droppableProps}
                              className="subtasks"
                            >
                              {task.subtasks
                                .map(subtaskId => tasks.find(t => t.id === subtaskId))
                                .filter(Boolean)
                                .map((subtask, idx) => (
                                  <Draggable
                                    key={subtask.id}
                                    draggableId={String(subtask.id)}
                                    index={idx}
                                  >
                                    {(provided, snapshot) => (
                                      <div
                                        ref={provided.innerRef}
                                        {...provided.draggableProps}
                                        {...provided.dragHandleProps}
                                        className={`subtask ${subtask.completed ? 'completed' : ''} ${snapshot.isDragging ? 'dragging' : ''}`}
                                      >
                                        <button
                                          className="complete-btn small"
                                          onClick={() => toggleComplete(subtask.id)}
                                        >
                                          <FontAwesomeIcon icon={faCheck}/>
                                        </button>
                                        <span className="subtask-title">{subtask.title}</span>

                                        {/* Show subtask meta if it has due date or tags */}
                                        {(subtask.due_date || subtask.tags.length > 0) && (
                                          <div className="subtask-meta">
                                            {subtask.due_date && (
                                              <span
                                                className="due-date small"
                                                onClick={() => handleDateClick(subtask)}
                                              >
                                                {new Date(subtask.due_date).toLocaleDateString()}
                                              </span>
                                            )}

                                            {subtask.tags.map((tag, idx) => (
                                              <span
                                                key={idx}
                                                className="tag small"
                                                onClick={() => handleTagClick(subtask, idx)}
                                              >
                                                {tag}
                                              </span>
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

      {/* Task Modal */}
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
                <div className="date-input-container">
                  <input
                    type="text"
                    value={newTask.due_date ? new Date(newTask.due_date).toLocaleDateString() : ''}
                    placeholder="Select date..."
                    readOnly
                    onClick={() => setShowDatePicker('modal')}
                    className="date-input-field"
                  />
                  <button
                    className="date-input-button"
                    onClick={() => setShowDatePicker('modal')}
                  >
                    <FontAwesomeIcon icon={faCalendarDays} />
                  </button>
                </div>
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
                <CustomDropdown
                  value={newTask.priority}
                  onChange={(value) => setNewTask({ ...newTask, priority: parseInt(value) })}
                  options={[
                    { value: 1, label: 'High Priority' },
                    { value: 2, label: 'Medium Priority' },
                    { value: 3, label: 'Low Priority' }
                  ]}
                />
              </div>

              <div className="form-group">
                <label>Category</label>
                <CustomDropdown
                  value={newTask.category}
                  onChange={(value) => setNewTask({ ...newTask, category: value })}
                  options={categories
                    .filter(cat => !cat.parent_id) // Only show top-level categories
                    .map(cat => ({ value: cat.id, label: cat.name }))}
                />
              </div>
            </div>

            <div className="form-group">
              <label>Tags</label>
              <div className="tags-input-container">
                {newTask.tags.map((tag, index) => (
                  <div key={index} className="tag-input-item">
                    <span>{tag}</span>
                    <button
                      type="button"
                      onClick={() => {
                        const newTags = [...newTask.tags];
                        newTags.splice(index, 1);
                        setNewTask({ ...newTask, tags: newTags });
                      }}
                    >
                      ×
                    </button>
                  </div>
                ))}
                <input
                  type="text"
                  placeholder="Add tags..."
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && e.target.value) {
                      if (!newTask.tags.includes(e.target.value)) {
                        setNewTask({
                          ...newTask,
                          tags: [...newTask.tags, e.target.value]
                        });
                      }
                      e.target.value = '';
                    }
                  }}
                />
              </div>
            </div>

            <div className="modal-actions">
              <button className="btn-primary" onClick={handleSubmitTask}>
                {editingTask ? 'Save Changes' : 'Create Task'} </button>
              <button className="btn-secondary" onClick={closeModal}> Cancel </button>
            </div>
          </div>
        </div>
      )}

      {/* Category Manager Modal */}
      {showCategoryManager && (
        <div className="modal">
          <CategoryManager
            categories={categories}
            onAddCategory={handleAddCategory}
            onClose={() => setShowCategoryManager(false)}
          />
        </div>
      )}

      {/* Color Picker for Tags */}
      {showColorPicker && (
        <div className="color-picker-container">
          <ColorPicker
            onSelect={(color) => handleTagColorChange(
              color,
              showColorPicker.taskId,
              showColorPicker.tagIndex
            )}
            onClose={() => setShowColorPicker(null)}
          />
        </div>
      )}

      {/* Date Picker Modal */}
      {showDatePicker && (
        <div className="modal">
          <DatePickerModal
            selectedDate={showDatePicker === 'modal'
              ? newTask.due_date
              : tasks.find(t => t.id === showDatePicker)?.due_date}
            onSelect={(date) => {
              if (showDatePicker === 'modal') {
                setNewTask({...newTask, due_date: date});
                setShowDatePicker(null);
              } else {
                handleDateSelection(showDatePicker, date);
              }
            }}
            onClose={() => setShowDatePicker(null)}
          />
        </div>
      )}
    </div>
  );
};

export default Tasks;