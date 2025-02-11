import React from 'react';
import { routineData } from '../data/routineData';

const Routine = () => {
  const todayName = new Date().toLocaleDateString("en-US", { weekday: "long" });
  const todayRoutine = routineData[todayName] || routineData["Monday"];

  return (
    <div>
      <h2>Routine for {todayName}</h2>
      <ul>
        {todayRoutine.map((slot, i) => (
          <li key={i}>
            <strong>{slot.time}:</strong> {slot.description}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Routine;