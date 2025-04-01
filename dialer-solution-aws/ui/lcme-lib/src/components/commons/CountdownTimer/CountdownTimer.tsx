/* eslint-disable no-empty-pattern */
import React, { useEffect, useState } from 'react';

interface ICountdownTimer {
  seconds: number;
  label?: string;
}

export const CountdownTimer: React.FunctionComponent<ICountdownTimer> = ({
  seconds,
  label,
}) => {
  const [time, setTime] = useState(seconds);

  useEffect(() => {
    const interval = setInterval(() => {
      if (time > 0) {
        setTime(time - 1);
      } else {
        clearInterval(interval);
        // Timer has reached zero, do something (e.g., show a message)
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [time]);

  const displayMinutes = Math.floor(time / 60);
  const displaySeconds = time % 60;

  return (
    <span>
      {label ? <span>{label}</span> : null}
      <span>{displayMinutes.toString().padStart(2, '0')}:</span>
      <span>{displaySeconds.toString().padStart(2, '0')}</span>
    </span>
  );
};
