/**
 * Utility functions for Tasks component
 */

/**
 * Determines the type of deadline based on due date
 * @param {string} dueDate - The date string in YYYY-MM-DD format
 * @returns {string} - Classification of the deadline
 */
export const getDeadlineType = (dueDate) => {
  if (!dueDate) return '';

  const diff = Math.floor((new Date(dueDate) - new Date()) / (1000 * 60 * 60 * 24));
  if (diff < 0) return 'overdue';
  if (diff <= 1) return '1-day';
  if (diff <= 7) return '1-week';
  if (diff <= 14) return '2-weeks';
  return '';
};

/**
 * Checks if making taskId a child of parentId would create a cycle in the task hierarchy
 * @param {Array} tasks - Array of all tasks
 * @param {string} parentId - The potential parent task ID
 * @param {string} taskId - The task ID being moved
 * @returns {boolean} - True if it would create a cycle
 */
export const wouldCreateCycle = (tasks, parentId, taskId) => {
  // Don't allow making a task a subtask of itself
  if (taskId === parentId) return true;

  const childTask = tasks.find(t => t.id === parentId);
  if (!childTask) return false;

  // Check if childTask is already a subtask of taskId
  if (childTask.parent_id === taskId) return true;

  // Recursively check parents
  if (childTask.parent_id) {
    return wouldCreateCycle(tasks, childTask.parent_id, taskId);
  }

  return false;
};

/**
 * Calculates the progress percentage of subtasks
 * @param {Array} subtaskIds - Array of subtask IDs
 * @param {Array} tasks - Array of all tasks
 * @returns {number} - Progress percentage (0-100)
 */
export const getProgress = (subtaskIds, tasks) => {
  const subtasks = subtaskIds.map(id => tasks.find(t => t.id === id)).filter(Boolean);
  if (subtasks.length === 0) return 0;

  const completed = subtasks.filter(st => st.completed).length;
  return (completed / subtasks.length) * 100;
};

/**
 * Prepares category options with proper nesting for dropdowns
 * @param {Array} categories - Array of category objects
 * @returns {Array} - Options formatted for CustomDropdown
 */
export const getCategoryOptions = (categories) => {
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
 * @param {Array} categories - Array of category objects
 * @param {string} parentId - Parent category ID
 * @returns {Array} - Subcategories of the specified parent
 */
export const getSubcategoriesForParent = (categories, parentId) => {
  return categories.filter(cat => cat.parent_id === parentId);
};