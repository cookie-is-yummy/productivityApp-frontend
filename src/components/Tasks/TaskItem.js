import React, { useState, useRef, useEffect } from 'react';
import { Draggable, Droppable } from "react-beautiful-dnd";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faEllipsisVertical, faCheck, faTags, faCalendarDays, faEdit,
  faTrash, faFolder, faChevronDown, faPen, faArrowUp, faGripLines
} from '@fortawesome/free-solid-svg-icons';
import Tag from './Tag';

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
  isDragging,
  draggedTaskId
}) => {
  const hasSubtasks = task.subtasks && task.subtasks.length > 0;
  const progress = hasSubtasks ? getProgress(task.subtasks, tasks) : 0;
  const isExpanded = expandedTasks.includes(task.id);
  const [isTagEditing, setIsTagEditing] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState(task.title);
  const subtasksRef = useRef(null);
  const collapseButtonRef = useRef(null);

  // Only auto-expand tasks when they receive new subtasks
  useEffect(() => {
    if (hasSubtasks && !isExpanded && task.subtasks.length === 1) {
      // Only auto-expand when a subtask is first added (subtasks.length === 1)
      setExpandedTasks(prev => [...prev, task.id]);
    }
  }, [task.subtasks?.length, task.id, hasSubtasks, isExpanded, setExpandedTasks]);

  const handleTagEditStart = () => {
    setIsTagEditing(true);
  };

  const handleTagInputKeyDown = (e) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      const updatedTags = Array.isArray(task.tags) ? [...task.tags, tagInput.trim()] : [tagInput.trim()];
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
    const updatedTags = Array.isArray(task.tags) ? [...task.tags] : [];
    updatedTags.splice(tagIndex, 1);
    handleTagChange(task.id, updatedTags);
  };

  // Handle making this subtask a top-level task
  const handleMakeTopLevel = async () => {
    if (task.parent_id) {
      handleRemoveSubtask(task.id, task.parent_id);
    }
  };

  const toggleExpand = (e) => {
    e.stopPropagation();
    setExpandedTasks(prev =>
      prev.includes(task.id)
        ? prev.filter(id => id !== task.id)
        : [...prev, task.id]
    );
  };

  const deadlineType = getDeadlineType(task.due_date);

  return (
    <Draggable key={task.id} draggableId={String(task.id)} index={index}>
      {(provided, snapshot) => {
        // Fix for cursor position during dragging
        const isDraggingThis = snapshot.isDragging;
        // Clone the provided styles and adjust for cursor
        const customDragStyle = {
          ...provided.draggableProps.style,
        };

        if (isDraggingThis) {
          // Remove problematic transform styles during dragging to keep the item at cursor
          customDragStyle.transform = 'none';
          customDragStyle.transition = 'none';
        }

        return (
          <div
            ref={provided.innerRef}
            {...provided.draggableProps}
            className={`task-item ${task.completed ? 'completed' : ''} 
                      ${isDraggingThis ? 'dragging' : ''} 
                      ${droppingOnTask === task.id ? 'dropping-target' : ''} 
                      ${task.parent_id ? 'subtask-item' : ''}`}
            style={isDraggingThis ? customDragStyle : provided.draggableProps.style}
          >
            <div
              {...provided.dragHandleProps}
              className="task-drag-handle"
              aria-label="Drag task"
            >
              <FontAwesomeIcon icon={faGripLines} />
            </div>

            {hasSubtasks && (
              <div className="progress-container" role="progressbar" aria-valuenow={progress} aria-valuemin="0" aria-valuemax="100">
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
                  type="button"
                  className={`complete-btn ${task.completed ? 'is-completed' : ''}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleComplete(task.id);
                  }}
                  aria-label={`Mark ${task.title} as ${task.completed ? 'incomplete' : 'complete'}`}
                >
                  <FontAwesomeIcon icon={faCheck} />
                </button>
              )}

              {hasSubtasks && (
                <button
                  type="button"
                  ref={collapseButtonRef}
                  className={`subtask-toggle ${isExpanded ? 'expanded' : ''}`}
                  onClick={toggleExpand}
                  aria-label={isExpanded ? 'Collapse subtasks' : 'Expand subtasks'}
                  aria-expanded={isExpanded}
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
                      aria-label="Task title"
                    />
                  </div>
                ) : (
                  <h3
                    className="task-title"
                    onDoubleClick={handleTitleEditStart}
                  >
                    {task.title}
                    <button
                      type="button"
                      className="rename-btn"
                      onClick={handleTitleEditStart}
                      title="Rename task"
                      aria-label="Rename task"
                    >
                      <FontAwesomeIcon icon={faPen} />
                    </button>

                    {/* Add button to make subtask a top-level task */}
                    {task.parent_id && (
                      <button
                        type="button"
                        className="make-toplevel-btn"
                        onClick={handleMakeTopLevel}
                        title="Make this a top-level task"
                        aria-label="Make this a top-level task"
                      >
                        <FontAwesomeIcon icon={faArrowUp} />
                      </button>
                    )}
                  </h3>
                )}
                {task.description && <p className="task-description">{task.description}</p>}
                <div className="task-meta">
                  {task.due_date && (
                    <button
                      type="button"
                      className={`due-date ${deadlineType ? `deadline-${deadlineType}` : ''}`}
                      onClick={() => handleDateClick(task)}
                      aria-label={`Due date: ${new Date(task.due_date).toLocaleDateString()}`}
                    >
                      <FontAwesomeIcon icon={faCalendarDays}/>
                      {new Date(task.due_date).toLocaleDateString()}
                    </button>
                  )}

                  <div className="tags-container">
                    {Array.isArray(task.tags) && task.tags.length > 0 && (
                      <div className="tags-list" role="list">
                        {task.tags.map((tag, idx) => (
                          <Tag
                            key={idx}
                            tag={tag}
                            onClick={() => handleTagClick(task, idx)}
                            onDelete={() => handleDeleteTag(idx)}
                          />
                        ))}
                      </div>
                    )}
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
                        aria-label="Add tag"
                      />
                    ) : (
                      <button
                        type="button"
                        className="add-tag-btn"
                        onClick={handleTagEditStart}
                        title="Add tag"
                        aria-label="Add tag"
                      >
                        <FontAwesomeIcon icon={faTags} />
                      </button>
                    )}
                  </div>

                  {task.category && (
                    <button
                      type="button"
                      className="category-badge"
                      onClick={() => handleCategoryClick(task.category)}
                      aria-label={`Category: ${task.category}`}
                    >
                      <FontAwesomeIcon icon={faFolder} className="category-icon" />
                      {task.category}
                    </button>
                  )}
                </div>
              </div>

              <div className="task-actions">
                <button
                  type="button"
                  className="delete-task-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteTask(task.id);
                  }}
                  title="Delete task"
                  aria-label="Delete task"
                >
                  <FontAwesomeIcon icon={faTrash} />
                </button>
                <button
                  type="button"
                  className="more-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowContextMenu(showContextMenu === task.id ? null : task.id);
                  }}
                  aria-label="More options"
                  aria-expanded={showContextMenu === task.id}
                  aria-haspopup="menu"
                >
                  <FontAwesomeIcon icon={faEllipsisVertical}/>
                </button>
                {showContextMenu === task.id && (
                  <div className="context-menu" ref={contextMenuRef} role="menu">
                    <button
                      type="button"
                      onClick={() => {
                        openEditModal(task);
                        setShowContextMenu(null);
                      }}
                      role="menuitem"
                    >
                      <FontAwesomeIcon icon={faEdit}/> Edit
                    </button>
                    {task.parent_id && (
                      <button
                        type="button"
                        onClick={() => {
                          handleRemoveSubtask(task.id, task.parent_id);
                          setShowContextMenu(null);
                        }}
                        role="menuitem"
                      >
                        <FontAwesomeIcon icon={faArrowUp}/> Make top-level
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        deleteTask(task.id);
                        setShowContextMenu(null);
                      }}
                      role="menuitem"
                    >
                      <FontAwesomeIcon icon={faTrash}/> Delete
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Subtask section with droppable area - improved for smooth collapsing/expanding */}
            {hasSubtasks && (
              <Droppable
                droppableId={`task-${task.id}`}
                type="TASK"
                isDropDisabled={task.id === draggedTaskId} // Prevent dropping on self
              >
                {(provided, snapshot) => (
                  <div
                    ref={(el) => {
                      // Assign both the Droppable ref and our subtasksRef
                      provided.innerRef(el);
                      subtasksRef.current = el;
                    }}
                    {...provided.droppableProps}
                    className={`subtasks ${isExpanded ? 'expanded' : 'collapsed'} ${snapshot.isDraggingOver ? 'dragging-over' : ''}`}
                    style={{
                      height: isExpanded ? 'auto' : '0px',
                      overflow: 'hidden',
                      transition: isDragging ? 'none' : 'height 0.3s ease-in-out, opacity 0.3s ease',
                      opacity: isExpanded ? 1 : 0,
                      pointerEvents: isExpanded || isDragging ? 'all' : 'none'
                    }}
                  >
                    <div className="subtasks-wrapper">
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
                            isDragging={isDragging}
                            draggedTaskId={draggedTaskId}
                          />
                        ))}

                      {provided.placeholder}

                      {/* Only show the drop indicator when actively dragging */}
                      {isDragging && (
                        <div className="subtask-drop-indicator">
                          <span>Drop here to make this a subtask</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </Droppable>
            )}
          </div>
        );
      }}
    </Draggable>
  );
};

export default TaskItem;