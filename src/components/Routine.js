import React, { useState, useEffect } from 'react';

function Routine() {
  // Get current day (e.g., "Monday")
  const getToday = () => {
    const today = new Date();
    return today.toLocaleString('en-US', { weekday: 'long' });
  };

  const [routineSlots, setRoutineSlots] = useState([]);
  // Default to the current day
  const [day, setDay] = useState(getToday());
  const [todos, setTodos] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [selectedTodo, setSelectedTodo] = useState('');

  // Fetch routine for the current day
  useEffect(() => {
    fetch(`https://productivity-app-xyzfe-b5bed29e76a5.herokuapp.com/api/routine/${day}`)
      .then(res => res.json())
      .then(data => setRoutineSlots(data))
      .catch(err => console.error(err));
  }, [day]);

  // Fetch todos (for assigning to routine slots)
  useEffect(() => {
    fetch('https://productivity-app-xyzfe-b5bed29e76a5.herokuapp.com/api/todos')
      .then(res => res.json())
      .then(data => setTodos(data))
      .catch(err => console.error(err));
  }, []);

  // Only allow assignment if the routine slot is marked as "locked_in"
  const openAssignmentModal = (slot) => {
    if (slot.locked_in) {
      setSelectedSlot(slot);
    }
  };

  // Make PUT request to assign a todo to a routine slot
  const assignTodo = () => {
    if (!selectedSlot || !selectedTodo) return;
    fetch(`https://productivity-app-xyzfe-b5bed29e76a5.herokuapp.com/api/routine/${day}/${selectedSlot.id}`, {
      method: 'PUT',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({ assigned_todo_id: parseInt(selectedTodo) })
    })
      .then(res => res.json())
      .then(updatedSlot => {
        setRoutineSlots(routineSlots.map(slot => slot.id === updatedSlot.id ? updatedSlot : slot));
        setSelectedSlot(null);
        setSelectedTodo('');
      })
      .catch(err => console.error(err));
  };

  return (
    <div className="section routine">
      <h2>Routine for {day}</h2>
      <div className="routine-container vertical">
        {routineSlots.map(slot => (
          <div
            key={slot.id}
            className={`routine-slot ${slot.locked_in ? 'locked' : ''}`}
            onClick={() => openAssignmentModal(slot)}
          >
            <p className="time">{slot.time}</p>
            <p className="description">{slot.description}</p>
            {slot.assigned_todo_id && <p className="assigned">Todo ID: {slot.assigned_todo_id}</p>}
          </div>
        ))}
      </div>
      {selectedSlot && (
        <div className="assignment-modal">
          <h3>Assign Todo for {selectedSlot.time}</h3>
          <select value={selectedTodo} onChange={e => setSelectedTodo(e.target.value)}>
            <option value="">-- Select Todo --</option>
            {todos.map(todo => (
              <option key={todo.id} value={todo.id}>
                {todo.text} {todo.duration ? `(${todo.duration} min)` : ''}
              </option>
            ))}
          </select>
          <button onClick={assignTodo}>Assign</button>
          <button onClick={() => setSelectedSlot(null)}>Cancel</button>
        </div>
      )}
    </div>
  );
}

export default Routine;