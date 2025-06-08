import React from 'react';
import { Handle, Position } from 'reactflow';

const MarriageJunctionNode = ({ data }) => {
  return (
    <div
      style={{
        width: 10,
        height: 10,
        borderRadius: '50%',
        background: '#8b5cf6', // A small purple dot for visibility during development
        border: '1px solid #c4b5fd',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        // Optional: Make it visually very small or transparent for production
        // opacity: 0,
        // pointerEvents: 'none',
      }}
    >
      {/* Handles for connections */}
      <Handle type="target" position={Position.Top} id="junction-target-top" style={{ background: '#555' }} />
      <Handle type="source" position={Position.Bottom} id="junction-source-bottom" style={{ background: '#555' }} />
    </div>
  );
};

export default MarriageJunctionNode; 