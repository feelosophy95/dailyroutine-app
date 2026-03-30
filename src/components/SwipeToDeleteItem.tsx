import React, { useRef, useState } from 'react';
import { Trash2 } from 'lucide-react';

interface SwipeToDeleteItemProps {
  children: React.ReactNode;
  onDelete: () => void;
  threshold?: number;
}

const SwipeToDeleteItem: React.FC<SwipeToDeleteItemProps> = ({ children, onDelete, threshold = -80 }) => {
  const [offsetX, setOffsetX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isDeleted, setIsDeleted] = useState(false);
  const startXRef = useRef(0);
  const startYRef = useRef(0);
  const currentXRef = useRef(0);
  const isHorizontalSwipeRef = useRef<boolean | null>(null);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!e.isPrimary) return;
    setIsDragging(true);
    startXRef.current = e.clientX;
    startYRef.current = e.clientY;
    currentXRef.current = offsetX;
    isHorizontalSwipeRef.current = null;
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging || !e.isPrimary) return;
    
    const deltaX = e.clientX - startXRef.current;
    const deltaY = e.clientY - startYRef.current;

    if (isHorizontalSwipeRef.current === null) {
      if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 5) {
        isHorizontalSwipeRef.current = true;
      } else if (Math.abs(deltaY) > 5) {
        isHorizontalSwipeRef.current = false;
        setIsDragging(false);
        setOffsetX(0);
        return;
      } else {
        return;
      }
    }

    if (!isHorizontalSwipeRef.current) return;

    let newOffsetX = currentXRef.current + deltaX;
    
    if (newOffsetX > 0) {
      newOffsetX = newOffsetX * 0.2;
    }
    
    if (newOffsetX < threshold * 1.5) {
      newOffsetX = threshold * 1.5 + (newOffsetX - threshold * 1.5) * 0.2;
    }
    
    setOffsetX(newOffsetX);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging || !e.isPrimary) return;
    setIsDragging(false);
    
    if (offsetX < threshold) {
      setOffsetX(-window.innerWidth); 
      setTimeout(() => {
        setIsDeleted(true);
        setTimeout(() => {
          onDelete();
        }, 300);
      }, 300);
    } else {
      setOffsetX(0);
    }
  };

  const handlePointerCancel = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!e.isPrimary) return;
    setIsDragging(false);
    setOffsetX(0);
  };

  if (isDeleted) {
    return (
      <div style={{ height: 0, opacity: 0, overflow: 'hidden', transition: 'all 0.3s ease', margin: 0, padding: 0 }} />
    );
  }

  return (
    <div style={{ position: 'relative', overflow: 'hidden', borderRadius: 'var(--radius-xl)' }}>
      <div 
        style={{
          position: 'absolute',
          top: 0, bottom: 0, right: 0, left: 0,
          backgroundColor: '#ff3b30',
          display: 'flex',
          justifyContent: 'flex-end',
          alignItems: 'center',
          paddingRight: '1.5rem',
          color: 'white',
          zIndex: 0,
          borderRadius: 'var(--radius-xl)'
        }}
      >
        <Trash2 size={24} color="#fff" />
      </div>
      
      <div 
        style={{
          transform: `translateX(${offsetX}px)`,
          transition: isDragging ? 'none' : 'transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
          zIndex: 1,
          position: 'relative',
          touchAction: 'pan-y',
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
      >
        {children}
      </div>
    </div>
  );
};

export default SwipeToDeleteItem;
