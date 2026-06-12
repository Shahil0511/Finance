import { useState, useEffect } from 'react';

const PHASES = [
  { after: 0,     text: 'Fetching data' },
  { after: 1400,  text: 'Crunching the numbers' },
  { after: 3000,  text: 'Preparing your report' },
  { after: 5500,  text: 'Taking a little longer than usual' },
  { after: 9000,  text: 'Your network seems slow' },
  { after: 16000, text: 'Still on it — almost there' },
];

export default function useLoadingMessage() {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const start = Date.now();
    const id = setInterval(() => setElapsed(Date.now() - start), 450);
    return () => clearInterval(id);
  }, []);

  const phase = [...PHASES].reverse().find((p) => elapsed >= p.after) ?? PHASES[0];
  return { message: phase.text, elapsed };
}
