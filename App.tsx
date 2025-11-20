import React, { useState, useEffect } from 'react';
import { GameScene } from './components/GameScene';
import { UI } from './components/UI';
import { GameState } from './types';
import { InputService } from './services/inputService';

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(GameState.MENU);
  const [score, setScore] = useState(0);
  const [bestScore, setBestScore] = useState(0);

  useEffect(() => {
    // Initialize Input Listener
    InputService.getInstance();
    
    const savedBest = localStorage.getItem('airPenguinBest');
    if (savedBest) setBestScore(parseFloat(savedBest));
  }, []);

  const handleStart = () => {
    InputService.getInstance().calibrate();
    setScore(0);
    setGameState(GameState.PLAYING);
  };

  const handleRestart = () => {
    setScore(0);
    setGameState(GameState.MENU); 
    // Small timeout to let React unmount the GameScene/Player and reset state
    setTimeout(() => {
        setGameState(GameState.PLAYING);
        InputService.getInstance().calibrate();
    }, 100);
  };

  const handleDie = () => {
    setGameState(GameState.GAME_OVER);
    if (score > bestScore) {
      setBestScore(score);
      localStorage.setItem('airPenguinBest', score.toString());
    }
  };

  return (
    <div className="relative w-full h-screen bg-slate-900 overflow-hidden select-none">
      <GameScene 
        gameState={gameState} 
        onDie={handleDie} 
        setScore={setScore} 
      />
      <UI 
        gameState={gameState} 
        score={score} 
        bestScore={bestScore} 
        onStart={handleStart} 
        onRestart={handleRestart} 
      />
    </div>
  );
};

export default App;