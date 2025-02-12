import React, { useState, useEffect } from 'react';

function Routine() {
  const [routineSlots, setRoutineSlots] = useState([]);
  const [day, setDay] = useState('Monday');
  const [todos, setTodos] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [selectedTodo, setSelectedTodo] = useState('');

  // Fetch routine for selected day
  useEffect(() => {
    fetch(`https://productivity-app-xyzfe-b5bed29e76a5.herokuapp.com/api/routine/${day}`)
      .then(res => res.json())
      .then(data => setRoutineSlots(data))
      .catch(err => console.error(err));
  }, [day]);

  // Fetch todos for optionally assigning to a routine slot
  useEffect(() => {
    fetch('https://productivity-app-xyzfe-b5bed29e76a5.herokuapp.com/api/todos')
      .then(res => res.json())
      .then(data => setTodos(data))
      .catch(err => console.error(err));
  }, []);

  const openAssignmentModal = (slot) => {
    if (slot.locked_in) {
      setSelectedSlot(slot);
    }
  };

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
      <div className="routine-container">
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