import React, { useState, useEffect, useRef, useCallback } from 'react';
import { DragDropContext, Droppable } from "react-beautiful-dnd";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faPlus, faTimes, faFolder, faCalendarDays, faTags, faChevronDown
} from '@fortawesome/free-solid-svg-icons';
import axios from '../../axiosinstance';
import '../styles/Tasks.css';

// Import components
import CustomDropdown from './CustomDropdown';
import DatePickerModal from './DatePicker';
import CategoryManager from './CategoryManager';
import ColorPicker from './ColorPicker';
import TaskItem from './TaskItem';

// Import utility functions
import {
  getDeadlineType,
  wouldCreateCycle,
  getProgress,
  getCategoryOptions,
  getSubcategoriesForParent
} from './utils';

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
  const [draggedTask, setDraggedTask] = useState(null);
  // State for tracking tasks being animated (for smooth completed task movement)
  const [tasksInTransition, setTasksInTransition] = useState([]);
  // Animation frame request ID for cleanup
  const animationFrameRef = useRef(null);

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
        const tasksWithStringIds = response.data.map(task => ({
          ...task,
          id: task.id.toString(),
          parent_id: task.parent_id ? task.parent_id.toString() : null,
          subtasks: task.subtasks ? task.subtasks.map(id => id.toString()) : [] // Convert subtask IDs to strings
        }));
        setTasks(tasksWithStringIds);
      } catch (error) {
        console.error('Error fetching tasks:', error);
      }
    };
    fetchTasks();

    // Clean up any pending animation frames when component unmounts
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
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

  // Add handler for drag cursor fix
  useEffect(() => {
    const handleDragState = () => {
      if (isDragging) {
        document.body.classList.add('dragging');

        // Set a custom cursor on the body during dragging
        document.body.style.cursor = 'grabbing';
      } else {
        document.body.classList.remove('dragging');
        document.body.style.cursor = '';
      }
    };

    handleDragState();

    // Cleanup function
    return () => {
      document.body.classList.remove('dragging');
      document.body.style.cursor = '';
    };
  }, [isDragging]);

  /**
   * Function to handle completed tasks movement smoothly
   * This adds an animation delay allowing completed tasks to move gracefully
   */
  const handleTaskCompletion = useCallback((taskId, isCompleted) => {
    // Add the task to transition state to delay reordering
    setTasksInTransition(prev => [...prev, taskId]);

    // Schedule removal from transition state after animation completes
    const timeoutId = setTimeout(() => {
      setTasksInTransition(prev => prev.filter(id => id !== taskId));
    }, 500); // Match this with your CSS transition time

    return () => clearTimeout(timeoutId);
  }, []);

  /**
   * Handles the end of a drag operation
   */
  const handleDragEnd = async (result) => {
    const { source, destination, draggableId, combine } = result;

    // Reset UI states
    setDroppingOnTask(null);
    setDroppingInCategory(null);
    setIsDragging(false);
    setDraggedTask(null);

    // Exit if dropped outside a droppable area and not combining
    if (!destination && !combine) return;

    const taskId = draggableId;
    const sourceTask = tasks.find(t => t.id === taskId);
    if (!sourceTask) return; // Guard against undefined source task

    // Handle combining for subtasks (primary new feature)
    if (combine) {
      const parentId = combine.draggableId;

      // Prevent cycles in task hierarchy
      if (wouldCreateCycle(tasks, parentId, taskId)) {
        console.log("Cannot create cycle in task hierarchy");
        return;
      }

      try {
        // Create a local copy of tasks for smooth transition
        let updatedTasks = [...tasks];

        // First update the parent task so the expanded container is ready
        updatedTasks = updatedTasks.map(task => {
          if (task.id === parentId) {
            return {
              ...task,
              subtasks: Array.isArray(task.subtasks) && task.subtasks.includes(taskId)
                ? task.subtasks
                : [...(Array.isArray(task.subtasks) ? task.subtasks : []), taskId]
            };
          }
          return task;
        });

        // Update the UI first for a smoother transition
        setTasks(updatedTasks);

        // Ensure the parent task is expanded to show the new subtask
        if (!expandedTasks.includes(parentId)) {
          setExpandedTasks(prev => [...prev, parentId]);
        }

        // After visual update, update the dragged task's parent_id and handle previous parent
        setTimeout(() => {
          const finalUpdatedTasks = updatedTasks.map(task => {
            // Update the dragged task with new parent
            if (task.id === taskId) {
              return { ...task, parent_id: parentId };
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

          setTasks(finalUpdatedTasks);
        }, 50);

        // Update the backend - convert IDs to integers for backend
        await axios.put(`/api/tasks/${taskId}`, {
          parent_id: parentId ? parseInt(parentId, 10) : null
        });
      } catch (error) {
        console.error('Error updating task parent:', error);
      }
      return;
    }

    // Make sure destination exists from here on
    if (!destination) return;

    // Handle dropping into a subcategory
    if (destination.droppableId.startsWith('subcategory-')) {
      const categoryId = destination.droppableId.replace('subcategory-', '');

      try {
        // Update the UI first for responsiveness
        setTasks(tasks.map(task =>
          task.id === taskId ? {...task, category: categoryId} : task
        ));

        // Update the backend
        await axios.put(`/api/tasks/${taskId}`, {
          category: categoryId
        });

        // Ensure the subcategory is active/visible after dropping
        if (!activeSubcategories.includes(categoryId)) {
          setActiveSubcategories(prev => [...prev, categoryId]);
        }
      } catch (error) {
        console.error('Error updating task category:', error);
      }
      return;
    }

    // Handle case: Creating a subtask by dropping onto another task
    if (destination.droppableId.startsWith('task-')) {
      const parentId = destination.droppableId.replace('task-', '');

      // Prevent cycles in task hierarchy
      if (wouldCreateCycle(tasks, parentId, taskId)) {
        console.log("Cannot create cycle in task hierarchy");
        return;
      }

      try {
        // Create a local copy for smooth transition
        let updatedTasks = [...tasks];

        // First, update the parent's subtasks list
        updatedTasks = updatedTasks.map(task => {
          if (task.id === parentId) {
            const currentSubtasks = Array.isArray(task.subtasks) ? task.subtasks : [];
            return {
              ...task,
              subtasks: currentSubtasks.includes(taskId)
                ? currentSubtasks
                : [...currentSubtasks, taskId]
            };
          }
          return task;
        });

        // Apply initial UI update
        setTasks(updatedTasks);

        // Auto-expand the parent task to show the new subtask
        if (!expandedTasks.includes(parentId)) {
          setExpandedTasks(prev => [...prev, parentId]);
        }

        // Then update the task's parent_id and remove from previous parent after a delay
        setTimeout(() => {
          const finalUpdatedTasks = updatedTasks.map(task => {
            // Update the dragged task with new parent
            if (task.id === taskId) {
              return { ...task, parent_id: parentId };
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

          setTasks(finalUpdatedTasks);
        }, 50);

        // Update the backend - ensure parentId is sent as a number
        await axios.put(`/api/tasks/${taskId}`, {
          parent_id: parentId ? parseInt(parentId, 10) : null
        });
      } catch (error) {
        console.error('Error updating task parent:', error);
      }
      return;
    }

    // Handle case: Reordering within the same list
    if (source.droppableId === destination.droppableId) {
      const filteredTasks = getFilteredTasks();
      const taskIds = filteredTasks.map(task => task.id);
      const movedTaskId = taskIds[source.index];

      // Remove from old position and insert at new position
      taskIds.splice(source.index, 1);
      taskIds.splice(destination.index, 0, movedTaskId);

      // Update task_order based on new positions
      const updatedTasks = tasks.map(task => {
        const newOrder = taskIds.indexOf(task.id);
        return newOrder !== -1 ? { ...task, task_order: newOrder } : task;
      });

      setTasks(updatedTasks);

      try {
        // Make sure to convert task_order to a number for the backend
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

    // Track which task is being dragged for better styling
    const taskId = start.draggableId;
    setDraggedTask(taskId);

    // Expanded parent tasks of the dragged task and any potential drop targets
    const taskBeingDragged = tasks.find(t => t.id.toString() === taskId);

    // Auto-expand all tasks that could receive subtasks to make dropping easier
    if (taskBeingDragged) {
      // If the task is a subtask, expand its parent
      if (taskBeingDragged.parent_id) {
        setExpandedTasks(prev =>
          prev.includes(taskBeingDragged.parent_id)
            ? prev
            : [...prev, taskBeingDragged.parent_id]
        );
      }

      // If we're dragging a task with subtasks, make sure they remain visible
      if (taskBeingDragged.subtasks?.length > 0) {
        setExpandedTasks(prev =>
          prev.includes(taskBeingDragged.id) ? prev : [...prev, taskBeingDragged.id]
        );
      }
    }
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

    // Handle combine indicator for subtasks - enhanced visual feedback
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

        // Auto-expand the task being hovered over to make subtask dropping easier
        if (!expandedTasks.includes(taskId)) {
          setExpandedTasks(prev => [...prev, taskId]);
        }
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
      // First remove the task from its parent's subtasks list for visual smoothness
      const initialUpdatedTasks = tasks.map(task => {
        if (task.id === parentId) {
          return {
            ...task,
            subtasks: task.subtasks.filter(id => id !== taskId)
          };
        }
        return task;
      });

      // Apply initial update
      setTasks(initialUpdatedTasks);

      // Then update the task's parent_id
      setTimeout(() => {
        const finalUpdatedTasks = initialUpdatedTasks.map(task => {
          if (task.id === taskId) {
            return { ...task, parent_id: null };
          }
          return task;
        });
        setTasks(finalUpdatedTasks);

        // Check if parent now has no subtasks
        const parentTask = finalUpdatedTasks.find(t => t.id === parentId);
        if (parentTask && (!parentTask.subtasks || parentTask.subtasks.length === 0)) {
          // Remove this task from expanded tasks if it's now empty
          setExpandedTasks(prev => prev.filter(id => id !== parentId));
        }
      }, 50);

      // Update the backend - ensure we send null for parent_id
      await axios.put(`/api/tasks/${taskId}`, {
        parent_id: null
      });
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
  const handleSubmitTask = async (e) => {
    e?.preventDefault();

    if (!newTask.title.trim()) {
      return; // Don't submit empty tasks
    }

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

      // Make sure the response data IDs are strings
      const responseData = {
        ...response.data,
        id: String(response.data.id),
        parent_id: response.data.parent_id ? String(response.data.parent_id) : null,
        subtasks: response.data.subtasks ? response.data.subtasks.map(id => String(id)) : []
      };

      if (editingTask) {
        setTasks(tasks.map(task => task.id === editingTask.id ? responseData : task));
      } else {
        setTasks([...tasks, responseData]);
      }
      closeModal();
    } catch (error) {
      console.error('Error saving task:', error);
    }
  };

  const deleteTask = async (taskId) => {
    try {
      // Get the task before filtering
      const taskToDelete = tasks.find(t => t.id === taskId);

      // Use the original taskId from state for the API call
      await axios.delete(`/api/tasks/${taskId}`);

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

  /**
   * Check if all subtasks of a task are completed
   */
  const areAllSubtasksCompleted = useCallback((taskId) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task || !task.subtasks || task.subtasks.length === 0) return false;

    return task.subtasks.every(subtaskId => {
      const subtask = tasks.find(t => t.id === subtaskId);
      return subtask && subtask.completed;
    });
  }, [tasks]);

  /**
   * Function to update parent task completion based on subtask status
   */
  const updateParentTaskCompletion = useCallback(async (taskId) => {
    // Find the task that was changed
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    // If task has a parent, check if all siblings are completed
    if (task.parent_id) {
      const allCompleted = areAllSubtasksCompleted(task.parent_id);
      const parentTask = tasks.find(t => t.id === task.parent_id);

      // Only update if parent completion status needs to change
      if (parentTask && parentTask.completed !== allCompleted) {
        try {
          await axios.put(`/api/tasks/${parentTask.id}`, {
            ...parentTask,
            completed: allCompleted
          });

          // Update UI
          setTasks(prev => prev.map(t =>
            t.id === parentTask.id ? {...t, completed: allCompleted} : t
          ));

          // Recursively update higher-level parents
          updateParentTaskCompletion(parentTask.id);
        } catch (error) {
          console.error('Error updating parent task completion:', error);
        }
      }
    }
  }, [tasks, areAllSubtasksCompleted]);

  const toggleComplete = async (taskId) => {
    try {
      const task = tasks.find(t => t.id === taskId);
      if (!task) return;

      const hasSubtasks = task.subtasks && task.subtasks.length > 0;

      // If task has subtasks and we're marking it complete, check all subtasks
      if (hasSubtasks && !task.completed) {
        // Mark all subtasks as complete
        await Promise.all(
          task.subtasks.map(async subtaskId => {
            const subtask = tasks.find(t => t.id === subtaskId);
            if (subtask && !subtask.completed) {
              await axios.put(`/api/tasks/${subtaskId}`, { ...subtask, completed: true });
            }
            return subtaskId;
          })
        );
      }

      const updatedTask = {...task, completed: !task.completed};
      await axios.put(`/api/tasks/${taskId}`, updatedTask);

      // Start the completion animation
      const cleanupAnimation = handleTaskCompletion(taskId, !task.completed);

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

      // Update parent task completion status
      await updateParentTaskCompletion(taskId);

      // Clean up any animation
      return cleanupAnimation;

    } catch (error) {
      console.error('Error toggling completion:', error);
    }
  };

  const openEditModal = (task) => {
    setEditingTask(task);
    setNewTask({
      title: task.title,
      description: task.description || '',
      due_date: task.due_date || '',
      category: task.category || 'inbox',
      tags: Array.isArray(task.tags) ? task.tags : [],
      priority: task.priority || 2,
      subtasks: Array.isArray(task.subtasks) ? task.subtasks : [],
      parent_id: task.parent_id || null,
      duration: task.duration || 0
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
      parent_id: null,
      duration: 0
    });
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
   * With improved handling for completed tasks to move smoothly to the bottom
   */
  const getFilteredTasks = () => {
    // Get the base set of tasks including visible subtasks
    let result = getAllVisibleTasks();

    // First apply category filter - include subcategories if parent is selected
    if (filter.category !== 'all') {
      const categoryAndSubcategories = [filter.category];

      // Add active subcategories if we're viewing their parent
      const subcategories = getSubcategoriesForParent(categories, filter.category);
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
        Array.isArray(task.tags) && task.tags.some(tag => tag.toLowerCase().includes(tagFilter.toLowerCase()))
      );
    }

    // Special handling for completed tasks with smooth transitions
    // If tasks are in transition (being completed), we keep their original position
    // This creates a smooth animation effect
    if (tasksInTransition.length > 0) {
      result = result.sort((a, b) => {
        // Don't change order for tasks being animated
        if (tasksInTransition.includes(a.id) || tasksInTransition.includes(b.id)) {
          return a.task_order - b.task_order;
        }

        // Regular sorting logic for other tasks
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
    } else {
      // Standard sorting when no tasks are transitioning
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
    }

    return result;
  };

  const filteredTasks = getFilteredTasks();
  // Only show top-level tasks in the main list
  const topLevelTasks = filteredTasks.filter(task => !task.parent_id);

  // Get subcategories for current category to display as sections
  const currentSubcategories = getSubcategoriesForParent(categories, filter.category);
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
              options={getCategoryOptions(categories)}
              className="category-dropdown"
              onSubcategoryClick={handleSubcategoryClick}
              aria-label="Select category"
            />
            <button
              type="button"
              className="category-manage-btn"
              onClick={() => setShowCategoryManager(true)}
              aria-label="Manage categories"
            >
              <FontAwesomeIcon icon={faFolder} />
            </button>
          </div>

          <div className="filter-group">
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
                aria-label="Sort tasks by"
              />
            </div>

            <div className="tag-filter">
              <input
                type="text"
                placeholder="Filter by tags..."
                value={tagFilter}
                onChange={(e) => setTagFilter(e.target.value)}
                className="tag-filter-input"
                aria-label="Filter tasks by tag"
              />
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setShowModal(true)}
          className="new-task-button"
          aria-label="Create new task"
        >
          <FontAwesomeIcon icon={faPlus}/> New Task
        </button>
      </div>

      <DragDropContext
        onDragEnd={handleDragEnd}
        onDragStart={handleDragStart}
        onDragUpdate={handleDragUpdate}
      >
        <div className="task-main-container">
          {/* Subcategory buttons at the top */}
          {currentSubcategories.length > 0 && (
            <div className="subcategories-container" role="region" aria-label="Subcategories">
              {currentSubcategories.map(subcategory => (
                <Droppable
                  key={`subcategory-${subcategory.id}`}
                  droppableId={`subcategory-${subcategory.id}`}
                  type="TASK"
                >
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`subcategory-droppable ${
                        snapshot.isDraggingOver ? 'dragging-over' : ''
                      } ${droppingInCategory === subcategory.id ? 'dropping-target' : ''}`}
                    >
                      <button
                        type="button"
                        className={`subcategory-button ${
                          activeSubcategories.includes(subcategory.id) ? 'active' : ''
                        } ${snapshot.isDraggingOver ? 'dragging-over' : ''}`}
                        onClick={() => handleSubcategoryClick(subcategory.id)}
                        aria-pressed={activeSubcategories.includes(subcategory.id)}
                        aria-expanded={activeSubcategories.includes(subcategory.id)}
                      >
                        {subcategory.name}
                        <FontAwesomeIcon
                          icon={faChevronDown}
                          className={activeSubcategories.includes(subcategory.id) ? 'rotated' : ''}
                          aria-hidden="true"
                        />
                      </button>
                      {isDragging && (
                        <div className="subcategory-drop-indicator">
                          <span>Drop here to move to {subcategory.name}</span>
                        </div>
                      )}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              ))}
            </div>
          )}

          {/* Main task list area - we don't make this a droppable to fix cursor issues */}
          <div className="task-list-container" role="region" aria-label="Tasks list">
            {/* Group tasks by subcategory if actively viewing subcategories */}
            {activeSubcategoryIds.length > 0 ? (
              <>
                {/* First show tasks without subcategory */}
                <div className="primary-task-list">
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
                          const updatedTags = Array.isArray(task.tags) ? [...task.tags] : [];
                          updatedTags.splice(tagIndex, 1);
                          handleTagChange(task.id, updatedTags);
                        }}
                        handleCategoryClick={handleCategoryClick}
                        showContextMenu={showContextMenu}
                        setShowContextMenu={setShowContextMenu}
                        contextMenuRef={contextMenuRef}
                        openEditModal={openEditModal}
                        deleteTask={deleteTask}
                        getProgress={(subtaskIds) => getProgress(subtaskIds, tasks)}
                        getDeadlineType={getDeadlineType}
                        droppingOnTask={droppingOnTask}
                        handleTagChange={handleTagChange}
                        handleRenameTask={handleRenameTask}
                        handleRemoveSubtask={handleRemoveSubtask}
                        isDragging={isDragging}
                        draggedTaskId={draggedTask}
                      />
                    ))}
                </div>

                {/* Then show tasks grouped by active subcategories */}
                {activeSubcategoryIds.map(subcatId => {
                  const subcategory = categories.find(cat => cat.id === subcatId);
                  const subcategoryTasks = topLevelTasks.filter(task => task.category === subcatId);

                  return (
                    <div key={subcatId} className="subcategory-section">
                      <h3 className="subcategory-heading">{subcategory.name}</h3>
                      <Droppable droppableId={`subcategory-${subcatId}`} type="TASK">
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
                                    const updatedTags = Array.isArray(task.tags) ? [...task.tags] : [];
                                    updatedTags.splice(tagIndex, 1);
                                    handleTagChange(task.id, updatedTags);
                                  }}
                                  handleCategoryClick={handleCategoryClick}
                                  showContextMenu={showContextMenu}
                                  setShowContextMenu={setShowContextMenu}
                                  contextMenuRef={contextMenuRef}
                                  openEditModal={openEditModal}
                                  deleteTask={deleteTask}
                                  getProgress={(subtaskIds) => getProgress(subtaskIds, tasks)}
                                  getDeadlineType={getDeadlineType}
                                  droppingOnTask={droppingOnTask}
                                  handleTagChange={handleTagChange}
                                  handleRenameTask={handleRenameTask}
                                  handleRemoveSubtask={handleRemoveSubtask}
                                  isDragging={isDragging}
                                  draggedTaskId={draggedTask}
                                />
                              ))
                            ) : (
                              <div className="no-tasks-placeholder">
                                <p>No tasks in this subcategory</p>
                              </div>
                            )}
                            {provided.placeholder}

                            {/* Show drop indicator when dragging */}
                            {isDragging && (
                              <div className="subcategory-drop-indicator active">
                                <span>Drop here to move to {subcategory.name}</span>
                              </div>
                            )}
                          </div>
                        )}
                      </Droppable>
                    </div>
                  );
                })}
              </>
            ) : (
              // Regular flat list of tasks when not viewing subcategories
              <div className="primary-task-list">
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
                      const updatedTags = Array.isArray(task.tags) ? [...task.tags] : [];
                      updatedTags.splice(tagIndex, 1);
                      handleTagChange(task.id, updatedTags);
                    }}
                    handleCategoryClick={handleCategoryClick}
                    showContextMenu={showContextMenu}
                    setShowContextMenu={setShowContextMenu}
                    contextMenuRef={contextMenuRef}
                    openEditModal={openEditModal}
                    deleteTask={deleteTask}
                    getProgress={(subtaskIds) => getProgress(subtaskIds, tasks)}
                    getDeadlineType={getDeadlineType}
                    droppingOnTask={droppingOnTask}
                    handleTagChange={handleTagChange}
                    handleRenameTask={handleRenameTask}
                    handleRemoveSubtask={handleRemoveSubtask}
                    isDragging={isDragging}
                    draggedTaskId={draggedTask}
                  />
                ))}

                {/* Show empty state message when no tasks */}
                {topLevelTasks.length === 0 && !isDragging && (
                  <div className="no-tasks-placeholder">
                    <p>No tasks in this category</p>
                    <button
                      type="button"
                      className="btn-primary"
                      onClick={() => setShowModal(true)}
                    >
                      <FontAwesomeIcon icon={faPlus} /> Add Task
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </DragDropContext>

      {/* Task Modal */}
      {showModal && (
        <div className="modal" role="dialog" aria-modal="true" aria-labelledby="task-modal-title">
          <div className="modal-content">
            <h2 id="task-modal-title">{editingTask ? 'Edit Task' : 'Create New Task'}</h2>
            <form onSubmit={handleSubmitTask}>
              <div className="form-group">
                <label htmlFor="task-title">Task Title</label>
                <input
                  id="task-title"
                  type="text"
                  placeholder="Enter task title"
                  value={newTask.title}
                  onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="task-description">Description</label>
                <textarea
                  id="task-description"
                  placeholder="Add task description"
                  value={newTask.description}
                  onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="task-due-date">Due Date</label>
                  <div className="date-input-container">
                    <input
                      id="task-due-date"
                      type="text"
                      value={newTask.due_date ? new Date(newTask.due_date).toLocaleDateString() : ''}
                      placeholder="Select date..."
                      readOnly
                      onClick={() => setShowDatePicker('modal')}
                      className="date-input-field"
                    />
                    <button
                      type="button"
                      className="date-input-button"
                      onClick={() => setShowDatePicker('modal')}
                      aria-label="Select due date"
                    >
                      <FontAwesomeIcon icon={faCalendarDays} />
                    </button>
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="task-duration">Duration (minutes)</label>
                  <input
                    id="task-duration"
                    type="number"
                    placeholder="60"
                    min="0"
                    value={newTask.duration || ''}
                    onChange={(e) => setNewTask({ ...newTask, duration: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label id="task-priority-label">Priority</label>
                  <CustomDropdown
                    value={newTask.priority}
                    onChange={(value) => setNewTask({ ...newTask, priority: parseInt(value) })}
                    options={[
                      { value: 1, label: 'High Priority' },
                      { value: 2, label: 'Medium Priority' },
                      { value: 3, label: 'Low Priority' }
                    ]}
                    aria-labelledby="task-priority-label"
                  />
                </div>

                <div className="form-group">
                  <label id="task-category-label">Category</label>
                  <CustomDropdown
                    value={newTask.category}
                    onChange={(value) => setNewTask({ ...newTask, category: value })}
                    options={getCategoryOptions(categories)}
                    aria-labelledby="task-category-label"
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="task-tags">Tags</label>
                <div className="tags-input-container" id="task-tags">
                  {Array.isArray(newTask.tags) && newTask.tags.length > 0 && (
                    <div className="tags-list" role="list">
                      {newTask.tags.map((tag, index) => (
                        <div key={index} className="tag-input-item" role="listitem">
                          <span>{tag}</span>
                          <button
                            type="button"
                            onClick={() => {
                              const newTags = [...newTask.tags];
                              newTags.splice(index, 1);
                              setNewTask({ ...newTask, tags: newTags });
                            }}
                            aria-label={`Remove tag ${tag}`}
                          >
                            <FontAwesomeIcon icon={faTimes} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  <input
                    type="text"
                    placeholder="Add tags and press Enter..."
                    aria-label="Add tags"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && e.target.value) {
                        e.preventDefault(); // Prevent form submission
                        if (!Array.isArray(newTask.tags) || !newTask.tags.includes(e.target.value)) {
                          setNewTask({
                            ...newTask,
                            tags: [...(Array.isArray(newTask.tags) ? newTask.tags : []), e.target.value]
                          });
                        }
                        e.target.value = '';
                      }
                    }}
                  />
                </div>
              </div>

              <div className="modal-actions">
                <button type="submit" className="btn-primary">
                  {editingTask ? 'Save Changes' : 'Create Task'}
                </button>
                <button type="button" className="btn-secondary" onClick={closeModal}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Category Manager Modal */}
      {showCategoryManager && (
        <div className="modal" role="dialog" aria-modal="true">
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
        <div className="modal" role="dialog" aria-modal="true">
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