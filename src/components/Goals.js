import React, { useState, useEffect } from 'react';

function Goals() {
  const [goals, setGoals] = useState([]);
  const [newGoal, setNewGoal] = useState({
    title: '',
    deadline: '',
    priority: '',
    duration: ''
  });

  // Fetch goals from backend
  useEffect(() => {
    fetch('https://productivity-app-xyzfe-b5bed29e76a5.herokuapp.com/api/goals')
      .then(res => res.json())
      .then(data => setGoals(data))
      .catch(err => console.error(err));
  }, []);

  const addGoal = () => {
    const goalData = {
      ...newGoal,
      duration: newGoal.duration ? parseInt(newGoal.duration) : null
    };
    fetch('https://productivity-app-xyzfe-b5bed29e76a5.herokuapp.com/api/goals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(goalData)
    })
      .then(res => res.json())
      .then(data => {
        setGoals([...goals, { id: data.id, ...goalData, subtasks: [] }]);
        setNewGoal({ title: '', deadline: '', priority: '', duration: '' });
      })
      .catch(err => console.error(err));
  };

  return (
    <div className="section goals">
      <h2>Goals</h2>
      <div className="goal-form">
        <input
          type="text"
          placeholder="Goal Title"
          value={newGoal.title}
          onChange={e => setNewGoal({ ...newGoal, title: e.target.value })}
        />
        <input
          type="text"
          placeholder="Deadline (e.g., 2025-02-20)"
          value={newGoal.deadline}
          onChange={e => setNewGoal({ ...newGoal, deadline: e.target.value })}
        />
        <input
          type="text"
          placeholder="Priority (High, Medium, Low)"
          value={newGoal.priority}
          onChange={e => setNewGoal({ ...newGoal, priority: e.target.value })}
        />
        <input
          type="number"
          placeholder="Duration (minutes)"
          value={newGoal.duration}
          onChange={e => setNewGoal({ ...newGoal, duration: e.target.value })}
        />
        <button onClick={addGoal}>Add Goal</button>
      </div>
      <ul className="goal-list">
        {goals.map(goal => (
          <li key={goal.id}>
            <h3>{goal.title}</h3>
            <p>Deadline: {goal.deadline}</p>
            <p>Priority: {goal.priority}</p>
            {goal.duration && <p>Duration: {goal.duration} min</p>}
            {goal.subtasks && goal.subtasks.length > 0 && (
              <ul>
                {goal.subtasks.map(sub => (
                  <li key={sub.id}>{sub.description} {sub.completed ? "(Done)" : ""}</li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default Goals;