import { KeyboardEvent } from 'react';

interface Args {
  rowCount: number;
  colCount: number;
  onMove: (row: number, col: number) => void;
  onEdit: () => void;
}

export const useKeyboardNav = ({ rowCount, colCount, onMove, onEdit }: Args) => {
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>, row: number, col: number) => {
    if (e.key === 'F2') {
      onEdit();
      return;
    }
    if (e.key === 'ArrowDown' || e.key === 'Enter') {
      e.preventDefault();
      onMove(Math.min(rowCount - 1, row + 1), col);
      return;
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      onMove(Math.max(0, row - 1), col);
      return;
    }
    if (e.key === 'ArrowRight' || e.key === 'Tab') {
      e.preventDefault();
      onMove(row, Math.min(colCount - 1, col + 1));
      return;
    }
    if (e.key === 'ArrowLeft' || (e.shiftKey && e.key === 'Tab')) {
      e.preventDefault();
      onMove(row, Math.max(0, col - 1));
      return;
    }
  };

  return { handleKeyDown };
};
