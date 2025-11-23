import React from 'react';
import { AgeRange } from '../types';

interface AgeSelectorProps {
  range: string;
  count: number;
  onIncrement: (range: string) => void;
  onDecrement: (range: string) => void;
}

export const AgeSelector: React.FC<AgeSelectorProps> = ({ range, count, onIncrement, onDecrement }) => {
  return (
    <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200 shadow-sm hover:border-blue-500 transition-colors">
      <div className="flex flex-col">
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Faixa Etária</span>
        <span className="text-lg font-bold text-gray-800">{range} <span className="text-sm font-normal text-gray-500">anos</span></span>
      </div>
      
      <div className="flex items-center space-x-3">
        <button
          onClick={() => onDecrement(range)}
          disabled={count === 0}
          className={`w-8 h-8 flex items-center justify-center rounded-full transition-colors ${
            count === 0 
              ? 'bg-gray-100 text-gray-300 cursor-not-allowed' 
              : 'bg-gray-100 text-blue-600 hover:bg-blue-100 hover:text-blue-700'
          }`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12h-15" />
          </svg>
        </button>
        
        <span className={`w-6 text-center font-bold text-lg ${count > 0 ? 'text-blue-800' : 'text-gray-400'}`}>
          {count}
        </span>

        <button
          onClick={() => onIncrement(range)}
          className="w-8 h-8 flex items-center justify-center rounded-full bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-sm"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
        </button>
      </div>
    </div>
  );
};