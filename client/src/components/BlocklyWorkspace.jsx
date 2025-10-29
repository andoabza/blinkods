import React, { useEffect, useRef } from 'react';
import * as Blockly from 'blockly';
import 'blockly/blocks';
import 'blockly/javascript';
import 'blockly/python';

const BlocklyWorkspace = ({ initialXml, onCodeChange, language }) => {
  const blocklyDiv = useRef();
  const workspaceRef = useRef();

  useEffect(() => {
    if (!workspaceRef.current) {
      workspaceRef.current = Blockly.inject(blocklyDiv.current, {
        toolbox: getToolbox(),
        scrollbars: true,
        trashcan: true,
        move: {
          scrollbars: true,
          drag: true,
          wheel: true
        }
      });

      workspaceRef.current.addChangeListener(() => {
        const code = language === 'python' 
          ? Blockly.Python.workspaceToCode(workspaceRef.current)
          : Blockly.JavaScript.workspaceToCode(workspaceRef.current);
        onCodeChange(code);
      });
    }

    if (initialXml) {
      Blockly.Xml.domToWorkspace(Blockly.Xml.textToDom(initialXml), workspaceRef.current);
    }
  }, []);

  const getToolbox = () => {
    return {
      kind: 'categoryToolbox',
      contents: [
        {
          kind: 'category',
          name: 'Logic',
          colour: '#5C81A6',
          contents: [
            { kind: 'block', type: 'controls_if' },
            { kind: 'block', type: 'logic_compare' },
            { kind: 'block', type: 'logic_operation' },
          ]
        },
        {
          kind: 'category',
          name: 'Loops',
          colour: '#5CA65C',
          contents: [
            { kind: 'block', type: 'controls_repeat_ext' },
            { kind: 'block', type: 'controls_whileUntil' },
          ]
        },
        {
          kind: 'category',
          name: 'Variables',
          colour: '#A65C81',
          custom: 'VARIABLE'
        }
      ]
    };
  };

  return (
    <div 
      ref={blocklyDiv} 
      style={{ 
        height: '500px', 
        width: '100%',
        border: '2px solid #e2e8f0',
        borderRadius: '8px'
      }} 
    />
  );
};

export default BlocklyWorkspace;