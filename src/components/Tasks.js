import React, { useState, useEffect, useRef } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faEllipsisVertical, faPlus, faCheck, faTags, faCalendarDays,
  faEdit, faTrash, faCaretDown, faPalette, faFolder, faChevronDown, 
  faTimes, faPen, faArrowUp
} from '@fortawesome/free-solid-svg-icons';
import '../styles/Tasks.css';
import axios from '../axiosinstance';

/**
 * Custom dropdown component with support for subcategories
 */
const CustomDropdown = ({ value, onChange, options, placeholder, className, onSubcategoryClick }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Handle clicks outside dropdown to close it
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
                if (option.isSubcategory) {
                  // Call the subcategory click handler instead of setting value
                  if (onSubcategoryClick) {
                    onSubcategoryClick(option.value);
                  }
                } else {
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

/**
 * Date picker modal component
 */
const DatePickerModal = ({ selectedDate, onSelect, onClose }) => {
  const [date, setDate] = useState(selectedDate || '');
  const [showCalendar, setShowCalendar] = useState(true);

  // Get current date info for the calendar
  const today = new Date();
  const currentMonth = date ? new Date(date).getMonth() : today.getMonth();
  const currentYear = date ? new Date(date).getFullYear() : today.getFullYear();

  // Set up calendar navigation state
  const [displayMonth, setDisplayMonth] = useState(currentMonth);
  const [displayYear, setDisplayYear] = useState(currentYear);

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  /**
   * Calendar navigation functions
   */
  const goToPreviousMonth = () => {
    if (displayMonth === 0) {
      setDisplayMonth(11);
      setDisplayYear(displayYear - 1);
    } else {
      setDisplayMonth(displayMonth - 1);
    }
  };

  const goToNextMonth = () => {
    if (displayMonth === 11) {
      setDisplayMonth(0);
      setDisplayYear(displayYear + 1);
    } else {
      setDisplayMonth(displayMonth + 1);
    }
  };

  /**
   * Calendar helper functions
   */
  const getDaysInMonth = (month, year) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (month, year) => {
    return new Date(year, month, 1).getDay();
  };

  /**
   * Renders calendar days for the current month and year
   */
  const renderCalendarDays = () => {
    const daysInMonth = getDaysInMonth(displayMonth, displayYear);
    const firstDay = getFirstDayOfMonth(displayMonth, displayYear);
    const days = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="calendar-day empty"></div>);
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const dateString = `${displayYear}-${String(displayMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const isSelected = date === dateString;
      const isToday =
        day === today.getDate() &&
        displayMonth === today.getMonth() &&
        displayYear === today.getFullYear();

      days.push(
        <div
          key={day}
          className={`calendar-day ${isSelected ? 'selected' : ''} ${isToday ? 'today' : ''}`}
          onClick={() => setDate(dateString)}
        >
          {day}
        </div>
      );
    }

    return days;
  };

  return (
    <div className="date-picker-modal">
      <div className="date-picker-header">
        <h4>Select Due Date</h4>
        <button className="close-btn" onClick={onClose}>×</button>
      </div>
      <div className="date-picker-content">
        {showCalendar ? (
          <div className="custom-calendar">
            <div className="calendar-header">
              <button className="calendar-nav-btn" onClick={goToPreviousMonth}>&lt;</button>
              <div className="calendar-title">{monthNames[displayMonth]} {displayYear}</div>
              <button className="calendar-nav-btn" onClick={goToNextMonth}>&gt;</button>
            </div>
            <div className="calendar-weekdays">
              <div>Sun</div>
              <div>Mon</div>
              <div>Tue</div>
              <div>Wed</div>
              <div>Thu</div>
              <div>Fri</div>
              <div>Sat</div>
            </div>
            <div className="calendar-days">
              {renderCalendarDays()}
            </div>
            <button
              className="calendar-toggle-btn"
              onClick={() => setShowCalendar(false)}
            >
              Switch to Date Input
            </button>
          </div>
        ) : (
          <>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="date-input"
            />
            <button
              className="calendar-toggle-btn"
              onClick={() => setShowCalendar(true)}
            >
              Switch to Calendar View
            </button>
          </>
        )}
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

/**
 * Tag component with color support
 */
const Tag = ({ tag, onClick, onDelete }) => {
  // Extract color information from tag if present (format: "tagname [color]")
  const [isHovering, setIsHovering] = useState(false);
  let tagName = tag;
  let tagColor = '';

  const colorMatch = tag.match(/^(.*?)\s*\[(.*?)\]$/);
  if (colorMatch) {
    tagName = colorMatch[1].trim();
    tagColor = colorMatch[2].trim();
  }

  // Map color names to their CSS variables or hex values
  const colorMap = {
    'red': '#fee2e2',
    'orange': '#fed7aa',
    'yellow': '#fef9c3',
    'green': '#dcfce7',
    'blue': '#e0f2fe',
    'purple': '#f3e8ff',
    'pink': '#fce7f3',
  };

  const style = tagColor ? {
    backgroundColor: colorMap[tagColor] || tagColor,
    color: tagColor === 'yellow' || tagColor === 'green' ? '#333' : ''
  } : {};

  return (
    <span
      className="tag"
      data-tag={tagName.toLowerCase()}
      onClick={onClick}
      style={style}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      {tagName}
      {isHovering && (
        <span className="tag-delete" onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}>
          <FontAwesomeIcon icon={faTimes} />
        </span>
      )}
    </span>
  );
};

/**
 * Color picker component for tag colors
 */
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

/**
 * Category management component
 */
const CategoryManager = ({ categories, onAddCategory, onDeleteCategory, onClose }) => {
  const [newCategory, setNewCategory] = useState('');
  const [parentCategory, setParentCategory] = useState('');
  const [editingCategory, setEditingCategory] = useState(null);
  const [editingName, setEditingName] = useState('');

  // Organize categories by parent-child relationship for display
  const categoriesByParent = {};
  categories.forEach(cat => {
    const parentId = cat.parent_id || 'root';
    if (!categoriesByParent[parentId]) {
      categoriesByParent[parentId] = [];
    }
    categoriesByParent[parentId].push(cat);
  });

  // Filter out subcategories for parent dropdown
  const topLevelCategories = categories.filter(cat => !cat.parent_id);

  const handleSubmit = () => {
    if (!newCategory.trim()) return;

    onAddCategory(
      newCategory.trim(),
      parentCategory ? parentCategory : null
    );
    setNewCategory('');
  };

  const handleRenameCategory = (categoryId) => {
    if (!editingName.trim()) {
      setEditingCategory(null);
      return;
    }

    const updatedCategories = categories.map(cat =>
      cat.id === categoryId ? {...cat, name: editingName} : cat
    );

    // In a real app, we'd call an API here
    console.log('Renamed category:', categoryId, 'to', editingName);

    setEditingCategory(null);
    onAddCategory(editingName, categories.find(cat => cat.id === categoryId).parent_id, categoryId);
  };

  const renderCategoryTree = (parentId = 'root') => {
    const children = categoriesByParent[parentId] || [];
    return children.map(category => (
      <div key={category.id} className="category-item">
        {parentId !== 'root' && <span className="category-indent">└ </span>}

        {editingCategory === category.id ? (
          <div className="category-edit-form">
            <input
              type="text"
              value={editingName}
              onChange={(e) => setEditingName(e.target.value)}
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleRenameCategory(category.id);
                } else if (e.key === 'Escape') {
                  setEditingCategory(null);
                }
              }}
              onBlur={() => handleRenameCategory(category.id)}
            />
          </div>
        ) : (
          <>
            <span className="category-name">{category.name}</span>
            {category.id !== 'inbox' && (
              <div className="category-actions">
                <button
                  className="category-edit-btn"
                  onClick={() => {
                    setEditingCategory(category.id);
                    setEditingName(category.name);
                  }}
                  title="Rename category"
                >
                  <FontAwesomeIcon icon={faPen} />
                </button>
                <button
                  className="category-delete-btn"
                  onClick={() => onDeleteCategory(category.id)}
                  title="Delete category (tasks will be moved to Inbox)"
                >
                  <FontAwesomeIcon icon={faTrash} />
                </button>
              </div>
            )}
          </>
        )}

        {categoriesByParent[category.id] && (
          <div className="nested-categories">
            {renderCategoryTree(category.id)}
          </div>
        )}
      </div>
    ));
  };

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
            {renderCategoryTree()}
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * TaskItem component renders a single task with subtasks
 */
const TaskItem = ({
  task,
  index,
  tasks,
  expandedTasks,
  setExpandedTasks,
  toggleComplete,
  handleDateClick,
  handleTagClick,
  handleTagDelete,
  handleCategoryClick,
  showContextMenu,
  setShowContextMenu,
  contextMenuRef,
  openEditModal,
  deleteTask,
  getProgress,
  getDeadlineType,
  droppingOnTask,
  handleTagChange,
  handleRenameTask,
  handleRemoveSubtask,
  isDragMode // Ensure this is consistently named
}) => {
  const hasSubtasks = task.subtasks && task.subtasks.length > 0;
  const progress = hasSubtasks ? getProgress(task.subtasks) : 0;
  const isExpanded = expandedTasks.includes(task.id);
  const [isTagEditing, setIsTagEditing] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState(task.title);

  // Auto-expand tasks when they receive new subtasks
  useEffect(() => {
    if (hasSubtasks && !isExpanded) {
      setExpandedTasks(prev => [...prev, task.id]);
    }
  }, [task.subtasks, task.id, hasSubtasks, isExpanded, setExpandedTasks]);

  const handleTagEditStart = () => {
    setIsTagEditing(true);
  };

  const handleTagInputKeyDown = (e) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      const updatedTags = [...task.tags, tagInput.trim()];
      handleTagChange(task.id, updatedTags);
      setTagInput('');
      setIsTagEditing(false);
    } else if (e.key === 'Escape') {
      setIsTagEditing(false);
      setTagInput('');
    }
  };

  const handleTitleEditStart = () => {
    setIsEditingTitle(true);
    setTitleInput(task.title);
  };

  const handleTitleSave = () => {
    if (titleInput.trim() && titleInput !== task.title) {
      handleRenameTask(task.id, titleInput);
    }
    setIsEditingTitle(false);
  };

  const handleDeleteTag = (tagIndex) => {
    const updatedTags = [...task.tags];
    updatedTags.splice(tagIndex, 1);
    handleTagChange(task.id, updatedTags);
  };

  // Handle making this subtask a top-level task
  const handleMakeTopLevel = async () => {
    if (task.parent_id) {
      handleRemoveSubtask(task.id, task.parent_id);
    }
  };

  return (
    <Draggable key={task.id} draggableId={String(task.id)} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={`task-item ${task.completed ? 'completed' : ''} ${snapshot.isDragging ? 'dragging' : ''} ${droppingOnTask === task.id ? 'dropping-target' : ''} ${task.parent_id ? 'subtask-item' : ''}`}
        >
          {hasSubtasks && (
            <div className="progress-container">
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <span className="progress-text">
                {task.subtasks.filter(subtaskId =>
                  tasks.find(t => t.id === subtaskId)?.completed
                ).length} / {task.subtasks.length}
              </span>
            </div>
          )}
          <div className="task-main">
            {!hasSubtasks && (
              <button
                className="complete-btn"
                onClick={() => toggleComplete(task.id)}
              >
                <FontAwesomeIcon icon={faCheck} />
              </button>
            )}
            {hasSubtasks && (
              <button
                className={`subtask-toggle ${isExpanded ? 'expanded' : ''}`}
                onClick={() => setExpandedTasks(prev =>
                  prev.includes(task.id)
                    ? prev.filter(id => id !== task.id)
                    : [...prev, task.id]
                )}
              >
                <FontAwesomeIcon icon={faChevronDown} />
              </button>
            )}
            <div className="task-info">
              {isEditingTitle ? (
                <div className="task-title-edit">
                  <input
                    type="text"
                    value={titleInput}
                    onChange={(e) => setTitleInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleTitleSave();
                      if (e.key === 'Escape') setIsEditingTitle(false);
                    }}
                    onBlur={handleTitleSave}
                    autoFocus
                  />
                </div>
              ) : (
                <h3
                  className="task-title"
                  onDoubleClick={handleTitleEditStart}
                >
                  {task.title}
                  <button
                    className="rename-btn"
                    onClick={handleTitleEditStart}
                    title="Rename task"
                  >
                    <FontAwesomeIcon icon={faPen} />
                  </button>

                  {/* Add button to make subtask a top-level task */}
                  {task.parent_id && (
                    <button
                      className="make-toplevel-btn"
                      onClick={handleMakeTopLevel}
                      title="Make this a top-level task"
                    >
                      <FontAwesomeIcon icon={faArrowUp} />
                    </button>
                  )}
                </h3>
              )}
              <p>{task.description}</p>
              <div className="task-meta">
                {task.due_date && (
                  <span
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
                      onDelete={() => handleDeleteTag(idx)}
                    />
                  ))}
                  {isTagEditing ? (
                    <input
                      type="text"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={handleTagInputKeyDown}
                      onBlur={() => setIsTagEditing(false)}
                      className="tag-input"
                      placeholder="Add tag..."
                      autoFocus
                    />
                  ) : (
                    <button
                      className="add-tag-btn"
                      onClick={handleTagEditStart}
                      title="Add tag"
                    >
                      <FontAwesomeIcon icon={faTags} />
                    </button>
                  )}
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
              <button
                className="delete-task-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  deleteTask(task.id);
                }}
                title="Delete task"
              >
                <FontAwesomeIcon icon={faTrash} />
              </button>
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
                  {task.parent_id && (
                    <button
                      onClick={() => {
                        handleRemoveSubtask(task.id, task.parent_id);
                        setShowContextMenu(null);
                      }}
                    >
                      <FontAwesomeIcon icon={faArrowUp}/> Make top-level
                    </button>
                  )}
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
          <Droppable
            droppableId={`task-${task.id}`}
            type="TASK"
            isCombineEnabled={true} // Enable combining for subtasks
          >
            {(provided, snapshot) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className={`subtasks ${isExpanded ? 'expanded' : ''} ${snapshot.isDraggingOver ? 'dragging-over' : ''}`}
                style={{ display: isExpanded || isDragMode ? 'flex' : 'none' }}
              >
                {task.subtasks
                  .map(subtaskId => tasks.find(t => t.id === subtaskId))
                  .filter(Boolean)
                  .map((subtask, idx) => (
                    <TaskItem
                      key={subtask.id}
                      task={subtask}
                      index={idx}
                      tasks={tasks}
                      expandedTasks={expandedTasks}
                      setExpandedTasks={setExpandedTasks}
                      toggleComplete={toggleComplete}
                      handleDateClick={handleDateClick}
                      handleTagClick={handleTagClick}
                      handleTagDelete={handleTagDelete}
                      handleCategoryClick={handleCategoryClick}
                      showContextMenu={showContextMenu}
                      setShowContextMenu={setShowContextMenu}
                      contextMenuRef={contextMenuRef}
                      openEditModal={openEditModal}
                      deleteTask={deleteTask}
                      getProgress={getProgress}
                      getDeadlineType={getDeadlineType}
                      droppingOnTask={droppingOnTask}
                      handleTagChange={handleTagChange}
                      handleRenameTask={handleRenameTask}
                      handleRemoveSubtask={handleRemoveSubtask}
                      isDragMode={isDragMode}
                    />
                  ))}
                {provided.placeholder}
                <div className="subtask-drop-indicator">
                  {isDragMode ? (
                    <span>Drop here to make this a subtask</span>
                  ) : (
                    <span>Drag a task here to add as a subtask</span>
                  )}
                </div>
              </div>
            )}
          </Droppable>
        </div>
      )}
    </Draggable>
  );
};

/**
 * Main Tasks component
 */
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
  const [activeSubcategories, setActiveSubcategories] = useState([]);
  const [droppingOnTask, setDroppingOnTask] = useState(null);
  const [droppingInCategory, setDroppingInCategory] = useState(null);
  const [isDragging, setIsDragging] = useState(false);

  // Ref for context menu positioning
  const contextMenuRef = useRef(null);

  // Update document title with active category
  useEffect(() => {
    const categoryName = categories.find(cat => cat.id === filter.category)?.name || 'Tasks';
    document.title = `${categoryName} | Task Manager`;
  }, [filter.category, categories]);

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

  /**
   * Checks if making taskId a child of parentId would create a cycle in the tree structure
   */
  const wouldCreateCycle = (parentId, taskId) => {
    // Don't allow making a task a subtask of itself
    if (taskId === parentId) return true;

    const childTask = tasks.find(t => t.id === parentId);
    if (!childTask) return false;

    // Check if childTask is already a subtask of taskId
    if (childTask.parent_id === taskId) return true;

    // Recursively check parents
    if (childTask.parent_id) {
      return wouldCreateCycle(childTask.parent_id, taskId);
    }

    return false;
  };

  /**
   * Handles the end of a drag operation
   */
  const handleDragEnd = async (result) => {
    const { source, destination, draggableId, combine } = result;

    // Reset UI states
    setDroppingOnTask(null);
    setDroppingInCategory(null);
    setIsDragging(false);

    // Exit if dropped outside a droppable area and not combining
    if (!destination && !combine) return;

    const taskId = parseInt(draggableId) || draggableId;
    const sourceTask = tasks.find(t => t.id === taskId);
    if (!sourceTask) return; // Guard against undefined source task

    // Handle combining for subtasks (primary new feature)
    if (combine) {
      const parentId = parseInt(combine.draggableId) || combine.draggableId;

      // Prevent cycles in task hierarchy
      if (wouldCreateCycle(parentId, taskId)) {
        console.log("Cannot create cycle in task hierarchy");
        return;
      }

      try {
        // Update the backend
        await axios.put(`/api/tasks/${taskId}`, {
          parent_id: parentId
        });

        // Update the UI - properly handle parent_id changes
        const updatedTasks = tasks.map(task => {
          // Update the dragged task with new parent
          if (task.id === taskId) {
            return { ...task, parent_id: parentId };
          }

          // Add task to new parent's subtasks
          if (task.id === parentId) {
            return {
              ...task,
              subtasks: Array.isArray(task.subtasks) && task.subtasks.includes(taskId)
                ? task.subtasks
                : [...(Array.isArray(task.subtasks) ? task.subtasks : []), taskId]
            };
          }

          // Remove task from previous parent's subtasks if it had one
          if (sourceTask.parent_id && task.id === sourceTask.parent_id) {
            return {
              ...task,
              subtasks: Array.isArray(task.subtasks)
                ? task.subtasks.filter(id => id !== taskId)
                : []
            };
          }

          return task;
        });

        setTasks(updatedTasks);

        // Auto-expand the parent task to show the new subtask
        if (!expandedTasks.includes(parentId)) {
          setExpandedTasks([...expandedTasks, parentId]);
        }
      } catch (error) {
        console.error('Error updating task parent:', error);
      }
      return;
    }

    // Make sure destination exists from here on
    if (!destination) return;

    // Handle case: Dropping a task onto the main task list - convert from subtask to top-level task
    if (destination.droppableId === 'tasks' && sourceTask.parent_id) {
      try {
        // Update the backend to remove parent_id
        await axios.put(`/api/tasks/${taskId}`, {
          parent_id: null
        });

        // Update the UI
        const updatedTasks = tasks.map(task => {
          // Remove parent_id from the dragged task
          if (task.id === taskId) {
            return { ...task, parent_id: null };
          }

          // Remove task from previous parent's subtasks
          if (task.id === sourceTask.parent_id) {
            return {
              ...task,
              subtasks: Array.isArray(task.subtasks)
                ? task.subtasks.filter(id => id !== taskId)
                : []
            };
          }

          return task;
        });

        setTasks(updatedTasks);
      } catch (error) {
        console.error('Error removing task parent:', error);
      }
      return;
    }

    // Handle case: Creating a subtask by dropping onto another task
    if (destination.droppableId.startsWith('task-')) {
      const parentId = parseInt(destination.droppableId.replace('task-', '')) ||
                       destination.droppableId.replace('task-', '');

      // Prevent cycles in task hierarchy
      if (wouldCreateCycle(parentId, taskId)) {
        console.log("Cannot create cycle in task hierarchy");
        return;
      }

      try {
        // Update the backend
        await axios.put(`/api/tasks/${taskId}`, {
          parent_id: parentId
        });

        // Update the UI - properly handle parent_id changes and ensure subtasks arrays exist
        const updatedTasks = tasks.map(task => {
          // Update the dragged task with new parent
          if (task.id === taskId) {
            return { ...task, parent_id: parentId };
          }

          // Add task to new parent's subtasks
          if (task.id === parentId) {
            const currentSubtasks = Array.isArray(task.subtasks) ? task.subtasks : [];
            return {
              ...task,
              subtasks: currentSubtasks.includes(taskId)
                ? currentSubtasks
                : [...currentSubtasks, taskId]
            };
          }

          // Remove task from previous parent's subtasks if it had one
          if (sourceTask.parent_id && task.id === sourceTask.parent_id) {
            const currentSubtasks = Array.isArray(task.subtasks) ? task.subtasks : [];
            return {
              ...task,
              subtasks: currentSubtasks.filter(id => id !== taskId)
            };
          }

          return task;
        });

        setTasks(updatedTasks);

        // Auto-expand the parent task to show the new subtask
        if (!expandedTasks.includes(parentId)) {
          setExpandedTasks([...expandedTasks, parentId]);
        }
      } catch (error) {
        console.error('Error updating task parent:', error);
      }
      return;
    }

    // Handle case: Dropping into a subcategory - fix the subcategory handling
    if (destination.droppableId.startsWith('subcategory-')) {
      const categoryId = destination.droppableId.replace('subcategory-', '');

      try {
        // Update the backend to change the task's category
        await axios.put(`/api/tasks/${taskId}`, {
          category: categoryId
        });

        // Update the UI
        setTasks(tasks.map(task =>
          task.id === taskId ? {...task, category: categoryId} : task
        ));
      } catch (error) {
        console.error('Error updating task category:', error);
      }
      return;
    }

    // Handle case: Reordering within the same list
    if (source.droppableId === destination.droppableId) {
      const reorderedTasks = Array.from(tasks);
      const filteredTasks = getFilteredTasks();

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

  /**
   * Handles the start of a drag operation
   */
  const handleDragStart = (start) => {
    // Reset dropping indicators and set dragging state
    setDroppingOnTask(null);
    setDroppingInCategory(null);
    setIsDragging(true);

    // Auto-expand all tasks when dragging to make it easier to drop into subtasks
    const allTasksWithSubtasks = tasks
      .filter(task => task.subtasks && task.subtasks.length > 0)
      .map(task => task.id);

    setExpandedTasks([...new Set([...expandedTasks, ...allTasksWithSubtasks])]);
  };

  /**
   * Handles real-time updates during drag operation to provide visual feedback
   */
  const handleDragUpdate = (update) => {
    if (!update.destination && !update.combine) {
      setDroppingOnTask(null);
      setDroppingInCategory(null);
      return;
    }

    // Handle combine indicator for subtasks
    if (update.combine) {
      setDroppingOnTask(update.combine.draggableId);
      setDroppingInCategory(null);
      return;
    }

    if (update.destination) {
      const droppableId = update.destination.droppableId;

      // Reset all indicators first
      setDroppingOnTask(null);
      setDroppingInCategory(null);

      // Set appropriate indicator based on drop target
      if (droppableId.startsWith('task-')) {
        const taskId = droppableId.replace('task-', '');
        setDroppingOnTask(taskId);
      } else if (droppableId.startsWith('subcategory-')) {
        const categoryId = droppableId.replace('subcategory-', '');
        setDroppingInCategory(categoryId);
      }
    }
  };

  /**
   * Function to remove a task from being a subtask
   */
  const handleRemoveSubtask = async (taskId, parentId) => {
    try {
      // Update the backend to remove parent_id
      await axios.put(`/api/tasks/${taskId}`, {
        parent_id: null
      });

      // Update the UI - remove parent_id and update the parent's subtasks array
      const updatedTasks = tasks.map(task => {
        if (task.id === taskId) {
          return { ...task, parent_id: null };
        }

        if (task.id === parentId) {
          return {
            ...task,
            subtasks: task.subtasks.filter(id => id !== taskId)
          };
        }

        return task;
      });

      // Check if parent now has no subtasks, and update the display accordingly
      const parentTask = updatedTasks.find(t => t.id === parentId);
      if (parentTask && (!parentTask.subtasks || parentTask.subtasks.length === 0)) {
        // Remove this task from expanded tasks if it's now empty
        setExpandedTasks(prev => prev.filter(id => id !== parentId));
      }

      setTasks(updatedTasks);
    } catch (error) {
      console.error('Error removing subtask:', error);
    }
  };

  /**
   * Task renaming function
   */
  const handleRenameTask = async (taskId, newTitle) => {
    try {
      await axios.put(`/api/tasks/${taskId}`, {
        title: newTitle
      });

      setTasks(tasks.map(task =>
        task.id === taskId ? {...task, title: newTitle} : task
      ));
    } catch (error) {
      console.error('Error renaming task:', error);
    }
  };

  /**
   * Tag handling functions
   */
  const handleTagClick = (task, tagIndex) => {
    setShowColorPicker({ taskId: task.id, tagIndex });
  };

  const handleTagColorChange = async (color, taskId, tagIndex) => {
    try {
      const task = tasks.find(t => t.id === taskId);
      if (!task) return;

      // Ensure tags is an array
      const currentTags = Array.isArray(task.tags) ? [...task.tags] : [];

      // Extract the tag name without any existing color info
      const tagName = currentTags[tagIndex] ? currentTags[tagIndex].replace(/\s*\[.*?\]$/, '').trim() : '';

      if (tagName) {
        currentTags[tagIndex] = `${tagName} [${color}]`;

        await axios.put(`/api/tasks/${taskId}`, {
          tags: currentTags
        });

        setTasks(tasks.map(t =>
          t.id === taskId ? {...t, tags: currentTags} : t
        ));
      }
    } catch (error) {
      console.error('Error updating tag color:', error);
    }

    setShowColorPicker(null);
  };

  const handleTagChange = async (taskId, newTags) => {
    try {
      // First check if newTags is an array
      const tagsToSend = Array.isArray(newTags) ? newTags : [];

      // Update the backend
      await axios.put(`/api/tasks/${taskId}`, {
        tags: tagsToSend
      });

      // Then update the UI
      setTasks(tasks.map(task =>
        task.id === taskId ? {...task, tags: tagsToSend} : task
      ));
    } catch (error) {
      console.error('Error updating tags:', error);
    }
  };

  /**
   * Date handling functions
   */
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

  /**
   * Category management functions
   */
  const handleCategoryClick = (categoryName) => {
    // Find the category by name
    const category = categories.find(cat => cat.name.toLowerCase() === categoryName.toLowerCase());
    if (category) {
      setFilter({...filter, category: category.id});
    }
  };

  const handleSubcategoryClick = (subcategoryId) => {
    // When a subcategory is clicked in the dropdown, add it to active subcategories
    // rather than navigating to it
    const isActive = activeSubcategories.includes(subcategoryId);

    if (isActive) {
      // If already active, remove it
      setActiveSubcategories(activeSubcategories.filter(id => id !== subcategoryId));
    } else {
      // Otherwise add it
      setActiveSubcategories([...activeSubcategories, subcategoryId]);
    }
  };

  const handleAddCategory = async (name, parentId = null, categoryId = null) => {
    if (categoryId) {
      // This is a rename operation
      const updatedCategories = categories.map(cat =>
        cat.id === categoryId ? {...cat, name} : cat
      );
      setCategories(updatedCategories);

      // In a real app, you'd send this to the backend
      try {
        // await axios.put(`/api/categories/${categoryId}`, { name });
        console.log('Renamed category:', categoryId, 'to', name);
      } catch (error) {
        console.error('Error renaming category:', error);
      }
      return;
    }

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

  const handleDeleteCategory = async (categoryId) => {
    // Cannot delete inbox
    if (categoryId === 'inbox') return;

    try {
      // In a real app, you'd call an API endpoint here
      // Move all tasks to inbox
      const updatedTasks = tasks.map(task =>
        task.category === categoryId ? {...task, category: 'inbox'} : task
      );

      // Remove the category
      const updatedCategories = categories.filter(cat => cat.id !== categoryId);

      // Also remove any subcategories of this category
      const filteredCategories = updatedCategories.filter(cat => cat.parent_id !== categoryId);

      setTasks(updatedTasks);
      setCategories(filteredCategories);

      // If we're currently viewing the deleted category, switch to inbox
      if (filter.category === categoryId) {
        setFilter({...filter, category: 'inbox'});
      }

      // await axios.delete(`/api/categories/${categoryId}`);
      console.log('Deleted category:', categoryId);
    } catch (error) {
      console.error('Error deleting category:', error);
    }
  };

  /**
   * Task management functions
   */
  const handleSubmitTask = async () => {
    try {
      // Fix empty tags array issue
      const processedTags = Array.isArray(newTask.tags) ? newTask.tags : [];

      const taskToSubmit = {
        ...newTask,
        tags: processedTags
      };

      const response = editingTask
        ? await axios.put(`/api/tasks/${editingTask.id}`, taskToSubmit)
        : await axios.post('/api/tasks', taskToSubmit);

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

      // Get the task before filtering
      const taskToDelete = tasks.find(t => t.id === taskId);

      // If this is a subtask, remove it from its parent's subtasks list
      if (taskToDelete && taskToDelete.parent_id) {
        const parentTask = tasks.find(t => t.id === taskToDelete.parent_id);
        if (parentTask) {
          await axios.put(`/api/tasks/${parentTask.id}`, {
            subtasks: parentTask.subtasks.filter(id => id !== taskId)
          });
        }
      }

      // Delete from UI and also remove from any parent tasks
      setTasks(tasks.filter(task => {
        if (task.id === taskId) return false;

        // If this task has the deleted task as a subtask, update it
        if (task.subtasks && task.subtasks.includes(taskId)) {
          task.subtasks = task.subtasks.filter(id => id !== taskId);
        }

        return true;
      }));
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  const toggleComplete = async (taskId) => {
    try {
      const task = tasks.find(t => t.id === taskId);
      if (!task) return;

      const hasSubtasks = task.subtasks && task.subtasks.length > 0;

      // If task has subtasks and we're marking it complete, check all subtasks
      if (hasSubtasks && !task.completed) {
        await Promise.all(
          task.subtasks.map(subtaskId => {
            const subtask = tasks.find(t => t.id === subtaskId);
            if (subtask && !subtask.completed) {
              return axios.put(`/api/tasks/${subtaskId}`, { ...subtask, completed: true });
            }
            return Promise.resolve();
          })
        );
      }

      const updatedTask = {...task, completed: !task.completed};
      await axios.put(`/api/tasks/${taskId}`, updatedTask);

      // Update the UI - mark all subtasks as completed too if parent is completed
      setTasks(tasks.map(t => {
        if (t.id === taskId) {
          return updatedTask;
        }

        // Mark subtasks as completed if parent is getting completed
        if (!task.completed && task.subtasks && task.subtasks.includes(t.id)) {
          return { ...t, completed: true };
        }

        return t;
      }));

      // Update parent task completion status if needed
      await updateParentTaskCompletion(task);

    } catch (error) {
      console.error('Error toggling completion:', error);
    }
  };

  /**
   * Helper function to recursively update parent task completion status
   */
  const updateParentTaskCompletion = async (task) => {
    if (!task.parent_id) return;

    try {
      const parentTask = tasks.find(t => t.id === task.parent_id);
      if (!parentTask) return;

      // Check if all subtasks are completed
      const allSubtasksCompleted = parentTask.subtasks.every(subtaskId => {
        const subtask = tasks.find(t => t.id === subtaskId);
        return subtask && subtask.completed;
      });

      // If parent task completion state needs to change
      if (parentTask.completed !== allSubtasksCompleted) {
        await axios.put(`/api/tasks/${parentTask.id}`, {
          ...parentTask,
          completed: allSubtasksCompleted
        });

        // Update UI
        setTasks(tasks.map(t =>
          t.id === parentTask.id ? {...t, completed: allSubtasksCompleted} : t
        ));

        // Recursively update parent's parent if needed
        await updateParentTaskCompletion(parentTask);
      }
    } catch (error) {
      console.error('Error updating parent task completion:', error);
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

  /**
   * Utility helper functions
   */
  const getDeadlineType = (dueDate) => {
    if (!dueDate) return '';

    const diff = Math.floor((new Date(dueDate) - new Date()) / (1000 * 60 * 60 * 24));
    if (diff < 0) return 'overdue';
    if (diff <= 1) return '1-day';
    if (diff <= 7) return '1-week';
    if (diff <= 14) return '2-weeks';
    return '';
  };

  const getProgress = (subtaskIds) => {
    const subtasks = subtaskIds.map(id => tasks.find(t => t.id === id)).filter(Boolean);
    if (subtasks.length === 0) return 0;

    const completed = subtasks.filter(st => st.completed).length;
    return (completed / subtasks.length) * 100;
  };

  /**
   * Prepares category options with proper nesting for dropdowns
   */
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
            isSubcategory: true // Mark as subcategory for special handling
          });
        }
      }
    });

    return options;
  };

  /**
   * Returns subcategories for a given parent category
   */
  const getSubcategoriesForParent = (parentId) => {
    return categories.filter(cat => cat.parent_id === parentId);
  };

  /**
   * Get all tasks, including subtasks, to include in the list for the current view
   */
  const getAllVisibleTasks = () => {
    let result = [...tasks];

    // Include subtasks in the list if the view shows all tasks
    result = result.filter(task => {
      // Always show tasks that don't have a parent
      if (!task.parent_id) return true;

      // For subtasks, show if their parent is expanded OR we're dragging
      const parent = tasks.find(t => t.id === task.parent_id);
      if (!parent) return true; // Safety check

      return expandedTasks.includes(task.parent_id) || isDragging;
    });

    return result;
  };

  /**
   * Filters and sorts tasks based on current filters and sort options
   */
  const getFilteredTasks = () => {
    // Get the base set of tasks including visible subtasks
    let result = getAllVisibleTasks();

    // First apply category filter - include subcategories if parent is selected
    if (filter.category !== 'all') {
      const categoryAndSubcategories = [filter.category];

      // Add active subcategories if we're viewing their parent
      const subcategories = getSubcategoriesForParent(filter.category);
      subcategories.forEach(subcat => {
        if (activeSubcategories.includes(subcat.id)) {
          categoryAndSubcategories.push(subcat.id);
        }
      });

      result = result.filter(task => categoryAndSubcategories.includes(task.category));
    }

    // Apply status filter
    if (filter.status !== 'all') {
      result = result.filter(task =>
        filter.status === 'completed' ? task.completed : !task.completed
      );
    }

    // Apply tag filter
    if (tagFilter) {
      result = result.filter(task =>
        task.tags.some(tag => tag.toLowerCase().includes(tagFilter.toLowerCase()))
      );
    }

    // Sort the tasks
    result = result.sort((a, b) => {
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

    return result;
  };

  const filteredTasks = getFilteredTasks();
  // Only show top-level tasks in the main list
  const topLevelTasks = filteredTasks.filter(task => !task.parent_id);

  // Get subtasks that should be visible at the top level (drag mode)
  const visibleSubtasks = isDragging
    ? filteredTasks.filter(task => task.parent_id)
    : [];

  // Get subcategories for current category to display as sections
  const currentSubcategories = getSubcategoriesForParent(filter.category);
  const activeSubcategoryIds = currentSubcategories
    .filter(subcat => activeSubcategories.includes(subcat.id))
    .map(subcat => subcat.id);

  return (
    <div className={`tasks-container ${isDragging ? 'drag-mode' : ''}`}>
      <div className="tasks-header">
        <div className="header-left">
          <div className="category-selector">
            <CustomDropdown
              value={filter.category}
              onChange={(value) => setFilter({...filter, category: value})}
              options={getCategoryOptions()}
              className="category-dropdown"
              onSubcategoryClick={handleSubcategoryClick}
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

      {isDragging && (
        <div className="drag-instruction-overlay">
          <div className="drag-instruction">
            <p>Drag over a task and drop to create a subtask</p>
            <p className="drag-instruction-secondary">Drop on the main task list to remove from being a subtask</p>
          </div>
        </div>
      )}

      <DragDropContext
        onDragEnd={handleDragEnd}
        onDragStart={handleDragStart}
        onDragUpdate={handleDragUpdate}
      >
        <div className="task-main-container">
          {currentSubcategories.length > 0 && (
            <div className="subcategories-container">
              {currentSubcategories.map(subcategory => (
                <button
                  key={subcategory.id}
                  className={`subcategory-button ${activeSubcategories.includes(subcategory.id) ? 'active' : ''}`}
                  onClick={() => handleSubcategoryClick(subcategory.id)}
                >
                  {subcategory.name}
                  <FontAwesomeIcon icon={faChevronDown} className={activeSubcategories.includes(subcategory.id) ? 'rotated' : ''} />
                </button>
              ))}
            </div>
          )}

          <Droppable droppableId="tasks" type="TASK" isCombineEnabled={true}>
            {(provided, snapshot) => (
              <div
                {...provided.droppableProps}
                ref={provided.innerRef}
                className={`task-list ${snapshot.isDraggingOver ? 'main-dragging-over' : ''}`}
              >
                {/* Group tasks by subcategory if actively viewing subcategories */}
                {activeSubcategoryIds.length > 0 ? (
                  <>
                    {/* First show tasks without subcategory */}
                    {topLevelTasks
                      .filter(task => task.category === filter.category)
                      .map((task, index) => (
                        <TaskItem
                          key={task.id}
                          task={task}
                          index={index}
                          tasks={tasks}
                          expandedTasks={expandedTasks}
                          setExpandedTasks={setExpandedTasks}
                          toggleComplete={toggleComplete}
                          handleDateClick={handleDateClick}
                          handleTagClick={handleTagClick}
                          handleTagDelete={(tagIndex) => {
                            const updatedTags = [...task.tags];
                            updatedTags.splice(tagIndex, 1);
                            handleTagChange(task.id, updatedTags);
                          }}
                          handleCategoryClick={handleCategoryClick}
                          showContextMenu={showContextMenu}
                          setShowContextMenu={setShowContextMenu}
                          contextMenuRef={contextMenuRef}
                          openEditModal={openEditModal}
                          deleteTask={deleteTask}
                          getProgress={getProgress}
                          getDeadlineType={getDeadlineType}
                          droppingOnTask={droppingOnTask}
                          handleTagChange={handleTagChange}
                          handleRenameTask={handleRenameTask}
                          handleRemoveSubtask={handleRemoveSubtask}
                          isDragMode={isDragging}
                        />
                      ))}

                    {/* Then show tasks grouped by active subcategories */}
                    {activeSubcategoryIds.map(subcatId => {
                      const subcategory = categories.find(cat => cat.id === subcatId);
                      const subcategoryTasks = topLevelTasks.filter(task => task.category === subcatId);

                      return (
                        <div key={subcatId} className="subcategory-section">
                          <h3 className="subcategory-heading">{subcategory.name}</h3>
                          <Droppable droppableId={`subcategory-${subcatId}`} type="TASK" isCombineEnabled={true}>
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.droppableProps}
                                className={`subcategory-droppable ${
                                  snapshot.isDraggingOver ? 'dragging-over' : ''
                                } ${droppingInCategory === subcatId ? 'dropping-target' : ''}`}
                              >
                                {subcategoryTasks.length > 0 ? (
                                  subcategoryTasks.map((task, index) => (
                                    <TaskItem
                                      key={task.id}
                                      task={task}
                                      index={index}
                                      tasks={tasks}
                                      expandedTasks={expandedTasks}
                                      setExpandedTasks={setExpandedTasks}
                                      toggleComplete={toggleComplete}
                                      handleDateClick={handleDateClick}
                                      handleTagClick={handleTagClick}
                                      handleTagDelete={(tagIndex) => {
                                        const updatedTags = [...task.tags];
                                        updatedTags.splice(tagIndex, 1);
                                        handleTagChange(task.id, updatedTags);
                                      }}
                                      handleCategoryClick={handleCategoryClick}
                                      showContextMenu={showContextMenu}
                                      setShowContextMenu={setShowContextMenu}
                                      contextMenuRef={contextMenuRef}
                                      openEditModal={openEditModal}
                                      deleteTask={deleteTask}
                                      getProgress={getProgress}
                                      getDeadlineType={getDeadlineType}
                                      droppingOnTask={droppingOnTask}
                                      handleTagChange={handleTagChange}
                                      handleRenameTask={handleRenameTask}
                                      handleRemoveSubtask={handleRemoveSubtask}
                                      isDragMode={isDragging}
                                    />
                                  ))
                                ) : (
                                  <div className="no-tasks-placeholder">
                                    <p>No tasks in this subcategory</p>
                                  </div>
                                )}
                                {provided.placeholder}
                              </div>
                            )}
                          </Droppable>
                        </div>
                      );
                    })}
                  </>
                ) : (
                  // Regular flat list of tasks when not viewing subcategories
                  <>
                    {topLevelTasks.map((task, index) => (
                      <TaskItem
                        key={task.id}
                        task={task}
                        index={index}
                        tasks={tasks}
                        expandedTasks={expandedTasks}
                        setExpandedTasks={setExpandedTasks}
                        toggleComplete={toggleComplete}
                        handleDateClick={handleDateClick}
                        handleTagClick={handleTagClick}
                        handleTagDelete={(tagIndex) => {
                          const updatedTags = [...task.tags];
                          updatedTags.splice(tagIndex, 1);
                          handleTagChange(task.id, updatedTags);
                        }}
                        handleCategoryClick={handleCategoryClick}
                        showContextMenu={showContextMenu}
                        setShowContextMenu={setShowContextMenu}
                        contextMenuRef={contextMenuRef}
                        openEditModal={openEditModal}
                        deleteTask={deleteTask}
                        getProgress={getProgress}
                        getDeadlineType={getDeadlineType}
                        droppingOnTask={droppingOnTask}
                        handleTagChange={handleTagChange}
                        handleRenameTask={handleRenameTask}
                        handleRemoveSubtask={handleRemoveSubtask}
                        isDragMode={isDragging}
                      />
                    ))}

                    {/* Show this message when in drag mode to indicate the user can drop subtasks here */}
                    {isDragging && (
                      <div className="subtask-drop-indicator main-drop-area">
                        <span>Drop here to make it a top-level task</span>
                      </div>
                    )}
                  </>
                )}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </div>
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
                  options={getCategoryOptions()}
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
            onDeleteCategory={handleDeleteCategory}
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