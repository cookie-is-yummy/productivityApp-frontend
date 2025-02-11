import React from "react";
import { routineData } from "../data/routineData";

// Helper function to convert HH:MM to minutes after midnight
const parseTime = (timeStr) => {
  const [hours, minutes] = timeStr.split(":").map(Number);
  return hours * 60 + minutes;
};

const NextAction = () => {
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const todayName = now.toLocaleDateString("en-US", { weekday: "long" });
  const todayRoutine = routineData[todayName] || routineData["Monday"];

  const nextSlot = todayRoutine.find(slot => {
    const [start] = slot.time.split("-");
    return parseTime(start) >= currentMinutes;
  });

  return (
    <div>
      <h2>What To Do Next</h2>
      {nextSlot ? (
        <div>
          <p><strong>{nextSlot.time}</strong>: {nextSlot.description}</p>
        </div>
      ) : (
        <p>You have completed your routine for today.</p>
      )}
    </div>
  );
};

export default NextAction;