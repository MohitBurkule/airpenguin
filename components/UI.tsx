
import React from 'react';
import { GameState } from '../types';

interface UIProps {
  gameState: GameState;
  score: number;
  bestScore: number;
  onStart: () => void;
  onRestart: () => void;
  sensitivity: number;
  setSensitivity: (val: number) => void;
}

export const UI: React.FC<UIProps> = ({ 
  gameState, 
  score, 
  bestScore, 
  onStart, 
  onRestart,
  sensitivity,
  setSensitivity
}) => {
  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-6 z-10">
      {/* HUD */}
      <div className="flex justify-between items-start w-full">
        <div className="bg-white/20 backdrop-blur-sm rounded-lg p-3 text-white font-bold shadow-md">
          <div className="text-xs uppercase opacity-80">Score</div>
          <div className="text-2xl">{Math.floor(score)}</div>
        </div>
        {gameState === GameState.PLAYING && (
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-2 text-white text-xs font-mono">
            <div className="opacity-70">TILT DEVICE or USE MOUSE</div>
          </div>
        )}
      </div>

      {/* Menus */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-auto">
        
        {gameState === GameState.MENU && (
          <div className="bg-white p-8 rounded-2xl shadow-2xl max-w-sm w-full text-center transform transition-all hover:scale-105">
            <h1 className="text-4xl font-black text-blue-600 mb-2 tracking-tighter">ICE HOP</h1>
            <p className="text-gray-500 mb-6">Master the ice. Avoid the sharks.</p>
            
            <div className="space-y-4">
              {/* Settings */}
              <div className="bg-gray-50 p-4 rounded-lg text-left">
                <label className="text-xs font-bold text-gray-500 uppercase flex justify-between mb-2">
                  <span>Sensitivity</span>
                  <span>{(sensitivity * 100).toFixed(0)}%</span>
                </label>
                <input 
                  type="range" 
                  min="0.5" 
                  max="3.0" 
                  step="0.1" 
                  value={sensitivity}
                  onChange={(e) => setSensitivity(parseFloat(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
              </div>

              <div className="bg-blue-50 p-4 rounded-lg text-sm text-gray-600 text-left">
                <p className="font-bold mb-2 text-blue-800">Controls:</p>
                <ul className="list-disc pl-4 space-y-1">
                    <li><b>Mobile:</b> Tilt device to steer.</li>
                    <li><b>PC:</b> Move Mouse from center to tilt.</li>
                    <li><b>Keyboard:</b> WASD / Arrows (Assist).</li>
                </ul>
              </div>
              <button
                onClick={onStart}
                className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-lg shadow-lg transition-colors"
              >
                START GAME
              </button>
            </div>
          </div>
        )}

        {gameState === GameState.GAME_OVER && (
          <div className="bg-white p-8 rounded-2xl shadow-2xl max-w-sm w-full text-center animate-fade-in">
            <div className="text-6xl mb-4">💦</div>
            <h2 className="text-3xl font-bold text-gray-800 mb-2">SPLASH!</h2>
            <p className="text-sm text-gray-400 mb-6">Watch out for slippery ice and sharks!</p>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-gray-100 p-3 rounded-lg">
                <div className="text-xs text-gray-500 uppercase">Score</div>
                <div className="text-xl font-bold text-gray-800">{Math.floor(score)}</div>
              </div>
              <div className="bg-yellow-50 p-3 rounded-lg">
                <div className="text-xs text-yellow-600 uppercase">Best</div>
                <div className="text-xl font-bold text-yellow-600">{Math.floor(bestScore)}</div>
              </div>
            </div>
            <button
              onClick={onRestart}
              className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-lg shadow-lg transition-colors"
            >
              TRY AGAIN
            </button>
          </div>
        )}
      </div>
      
      <div className="text-center text-white/30 text-xs pb-2">
        v1.3 | Camera Shake | Physics Update
      </div>
    </div>
  );
};
