import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as Blockly from 'blockly/core'; // Changed from 'blockly'
import 'blockly/blocks';
import { pythonGenerator } from 'blockly/python';
import { javascriptGenerator } from 'blockly/javascript';
import * as en from 'blockly/msg/en';
Blockly.setLocale(en);

// Define missing block types AND their generators
// Define missing block types
const defineMissingBlocks = () => {
  // --- colour_picker ---
  Blockly.Blocks['colour_picker'] = {
    init: function() {
      this.appendDummyInput()
          .appendField(new Blockly.FieldColour('#ff0000'), 'COLOUR');
      this.setOutput(true, 'Colour');
      this.setColour(20);
      this.setTooltip('Colour picker');
      this.setHelpUrl('');
    }
  };
  javascriptGenerator['colour_picker'] = function(block) {
    const code = `'${block.getFieldValue('COLOUR')}'`;
    return [code, javascriptGenerator.ORDER_ATOMIC];
  };
  pythonGenerator['colour_picker'] = function(block) {
    const code = `'${block.getFieldValue('COLOUR')}'`;
    return [code, pythonGenerator.ORDER_ATOMIC];
  };

  // --- colour_random ---
  Blockly.Blocks['colour_random'] = {
    init: function() {
      this.appendDummyInput()
          .appendField('random colour');
      this.setOutput(true, 'Colour');
      this.setColour(20);
      this.setTooltip('Returns a random colour');
      this.setHelpUrl('');
    }
  };
  javascriptGenerator['colour_random'] = function(block) {
    // Generates a random hex color
    const code = `(() => {
      let r = Math.floor(Math.random() * 256).toString(16).padStart(2, '0');
      let g = Math.floor(Math.random() * 256).toString(16).padStart(2, '0');
      let b = Math.floor(Math.random() * 256).toString(16).padStart(2, '0');
      return \`#\${r}\${g}\${b}\`;
    })()`;
    return [code, javascriptGenerator.ORDER_FUNCTION_CALL];
  };
  pythonGenerator['colour_random'] = function(block) {
    pythonGenerator.definitions_['import_random'] = 'import random';
    const code = `f'#{random.randint(0, 0xFFFFFF):06x}'`;
    return [code, pythonGenerator.ORDER_FUNCTION_CALL];
  };

  // --- colour_rgb ---
  Blockly.Blocks['colour_rgb'] = {
    init: function() {
      this.appendValueInput('RED').setCheck('Number').appendField('colour with red');
      this.appendValueInput('GREEN').setCheck('Number').appendField('green');
      this.appendValueInput('BLUE').setCheck('Number').appendField('blue');
      this.setOutput(true, 'Colour');
      this.setColour(20);
      this.setTooltip('Create a colour from RGB values');
      this.setHelpUrl('');
    }
  };
  javascriptGenerator['colour_rgb'] = function(block) {
    const r = javascriptGenerator.valueToCode(block, 'RED', 0) || 0;
    const g = javascriptGenerator.valueToCode(block, 'GREEN', 0) || 0;
    const b = javascriptGenerator.valueToCode(block, 'BLUE', 0) || 0;
    // Helper function to format hex
    const rgbToHex = (r, g, b) => {
      const toHex = c => ('0' + parseInt(c).toString(16)).slice(-2);
      return `"#\${toHex(r)}\${toHex(g)}\${toHex(b)}"`;
    };
    // We define the helper function once and use it
    javascriptGenerator.definitions_['rgbToHex'] = `
      const rgbToHex = (r, g, b) => {
        const toHex = c => ('0' + (Number(c) || 0).toString(16)).slice(-2);
        return \`#\${toHex(r)}\${toHex(g)}\${toHex(b)}\`;
      };
    `;
    const code = `rgbToHex(${r}, ${g}, ${b})`;
    return [code, javascriptGenerator.ORDER_FUNCTION_CALL];
  };
  pythonGenerator['colour_rgb'] = function(block) {
    const r = pythonGenerator.valueToCode(block, 'RED', 0) || 0;
    const g = pythonGenerator.valueToCode(block, 'GREEN', 0) || 0;
    const b = pythonGenerator.valueToCode(block, 'BLUE', 0) || 0;
    const code = `f'#{int(${r}):02x}{int(${g}):02x}{int(${b}):02x}'`;
    return [code, pythonGenerator.ORDER_FUNCTION_CALL];
  };

  // --- colour_blend ---
  Blockly.Blocks['colour_blend'] = {
    init: function() {
      this.appendValueInput('COLOUR1').setCheck('Colour').appendField('blend');
      this.appendValueInput('COLOUR2').setCheck('Colour').appendField('with');
      this.appendValueInput('RATIO').setCheck('Number').appendField('ratio');
      this.setOutput(true, 'Colour');
      this.setColour(20);
      this.setTooltip('Blend two colours together');
      this.setHelpUrl('');
    }
  };
  javascriptGenerator['colour_blend'] = function(block) {
    // This is a complex function, so we just return a placeholder
    const c1 = javascriptGenerator.valueToCode(block, 'COLOUR1', 0) || "'#ffffff'";
    const c2 = javascriptGenerator.valueToCode(block, 'COLOUR2', 0) || "'#000000'";
    const ratio = javascriptGenerator.valueToCode(block, 'RATIO', 0) || 0.5;
    // A simple placeholder. A real implementation would be much more complex.
    const code = `(${ratio} < 0.5 ? ${c1} : ${c2})`; 
    return [code, javascriptGenerator.ORDER_CONDITIONAL];
  };
  pythonGenerator['colour_blend'] = function(block) {
    const c1 = pythonGenerator.valueToCode(block, 'COLOUR1', 0) || "'#ffffff'";
    const c2 = pythonGenerator.valueToCode(block, 'COLOUR2', 0) || "'#000000'";
    const ratio = pythonGenerator.valueToCode(block, 'RATIO', 0) || 0.5;
    const code = `${c1} if ${ratio} < 0.5 else ${c2}`;
    return [code, pythonGenerator.ORDER_CONDITIONAL];
  };
};
const BlocklyWorkspace = ({ 
  initialXml = '', 
  onCodeChange, 
  language = 'javascript',
  onLanguageChange, // Added this prop for the dropdown
  readOnly = false,
  theme = 'default',
  onWorkspaceChange,
  toolboxConfig = null
}) => {
  const blocklyDiv = useRef();
  const workspaceRef = useRef();
  const [workspaceReady, setWorkspaceReady] = useState(false);
  const [codeOutput, setCodeOutput] = useState('');
  const [error, setError] = useState('');

  // Safe XML loading function
  const loadXml = useCallback((xmlString) => {
    const workspace = workspaceRef.current;
    if (!workspace) return;
    
    try {
      workspace.clear();
      if (xmlString && xmlString.trim()) {
        const xmlDom = Blockly.utils.xml.textToDom(xmlString);
        Blockly.Xml.domToWorkspace(xmlDom, workspace);
      }
      console.log('✅ XML loaded successfully');
      setError('');
    } catch (err) {
      console.error('❌ Error loading XML:', err);
      setError(`Failed to load XML: ${err.message}`);
      // Don't clean XML, it was causing issues.
    }
  }, []);

  // Initialize Blockly workspace
  useEffect(() => {
    if (!blocklyDiv.current || workspaceRef.current) return;

    try {
      // Define missing blocks first
      defineMissingBlocks();

      // Configure Blockly theme
      const theme = Blockly.Theme.defineTheme('modern', {
        'base': Blockly.Themes.Classic,
        'componentStyles': {
          'workspaceBackgroundColour': '#f8fafc',
          'toolboxBackgroundColour': '#334155',
          'toolboxForegroundColour': '#ffffff',
          'flyoutBackgroundColour': '#1e293b',
          'flyoutForegroundColour': '#ccc',
          'flyoutOpacity': 1,
          'scrollbarColour': '#797979',
          'insertionMarkerColour': '#fff',
          'insertionMarkerOpacity': 0.3,
        }
      });

      // Create workspace
      workspaceRef.current = Blockly.inject(blocklyDiv.current, {
        toolbox: toolboxConfig || getDefaultToolbox(),
        scrollbars: true,
        trashcan: true,
        horizontalLayout: false,
        toolboxPosition: 'start',
        collapse: true,
        comments: true,
        disable: false,
        maxBlocks: Infinity,
        readOnly: readOnly,
        move: {
          scrollbars: {
            horizontal: true,
            vertical: true
          },
          drag: true,
          wheel: true
        },
        zoom: {
          controls: true,
          wheel: true,
          startScale: 1.0,
          maxScale: 3,
          minScale: 0.3,
          scaleSpeed: 1.2
        },
        renderer: 'zelos',
        theme: theme,
        grid: {
          spacing: 20,
          length: 3,
          colour: '#ccc',
          snap: true
        }
      });

      // Add workspace change listener
      workspaceRef.current.addChangeListener((event) => {
        if (event.type === Blockly.Events.BLOCK_MOVE || 
            event.type === Blockly.Events.BLOCK_CHANGE ||
            event.type === Blockly.Events.BLOCK_CREATE ||
            event.type === Blockly.Events.BLOCK_DELETE) {
          generateCode();
          onWorkspaceChange?.(event);
        }
      });

      // Load initial XML
      loadXml(initialXml);

      setWorkspaceReady(true);
      generateCode();

      // Handle window resize
      const handleResize = () => {
        if (workspaceRef.current) {
          Blockly.svgResize(workspaceRef.current);
        }
      };

      window.addEventListener('resize', handleResize);

      // Force a resize right after injection
      setTimeout(() => handleResize(), 50);

      return () => {
        window.removeEventListener('resize', handleResize);
        if (workspaceRef.current) {
          workspaceRef.current.dispose();
          workspaceRef.current = null;
        }
      };
    } catch (error) {
      console.error('Error initializing Blockly workspace:', error);
      setError(`Failed to initialize workspace: ${error.message}`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Keep dependencies empty to run only once

  // Generate code from workspace
  const generateCode = useCallback(() => {
    if (!workspaceRef.current) return;

    try {
      let code = '';
      switch (language) {
        case 'python':
          code = pythonGenerator.workspaceToCode(workspaceRef.current);
          break;
        case 'javascript':
        default:
          code = javascriptGenerator.workspaceToCode(workspaceRef.current);
          break;
      }
      
      setCodeOutput(code);
      onCodeChange?.(code);
      setError('');
    } catch (error) {
      console.error('Error generating code:', error);
      const errorCode = `// Error generating code: ${error.message}`;
      setCodeOutput(errorCode);
      onCodeChange?.(errorCode);
      setError(`Code generation error: ${error.message}`);
    }
  }, [language, onCodeChange]);

  // Update code when language changes
  useEffect(() => {
    if (workspaceReady) {
      generateCode();
    }
  }, [language, workspaceReady, generateCode]);

  // Handle initial XML updates
  useEffect(() => {
    if (workspaceRef.current && initialXml) {
      loadXml(initialXml);
    }
  }, [initialXml, loadXml]);

  // Get default toolbox configuration
  const getDefaultToolbox = () => {
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
            { kind: 'block', type: 'logic_negate' },
            { kind: 'block', type: 'logic_boolean' },
          ]
        },
        {
          kind: 'category',
          name: 'Loops',
          colour: '#5CA65C',
          contents: [
            { kind: 'block', type: 'controls_repeat_ext' },
            { kind: 'block', type: 'controls_whileUntil' },
            { kind: 'block', type: 'controls_for' },
          ]
        },
        {
          kind: 'category',
          name: 'Math',
          colour: '#5C68A6',
          contents: [
            { kind: 'block', type: 'math_number' },
            { kind: 'block', type: 'math_arithmetic' },
            { kind: 'block', type: 'math_random_int' },
          ]
        },
        {
          kind: 'category',
          name: 'Text',
          colour: '#5CA68C',
          contents: [
            { kind: 'block', type: 'text' },
            { kind: 'block', type: 'text_print' },
            { kind: 'block', type: 'text_join' },
          ]
        },
        {
          kind: 'category',
          name: 'Lists',
          colour: '#745CA6',
          contents: [
            { kind: 'block', type: 'lists_create_with' },
            { kind: 'block', type: 'lists_repeat' },
            { kind: 'block', type: 'lists_length' },
          ]
        },
        { // Added the Colour category
          kind: 'category',
          name: 'Colour',
          colour: '#A65C68',
          contents: [
            { kind: 'block', type: 'colour_picker' },
            { kind: 'block', type: 'colour_random' },
            { kind: 'block', type: 'colour_rgb' },
          ]
        },
        {
          kind: 'sep'
        },
        {
          kind: 'category',
          name: 'Variables',
          colour: '#A65C81',
          custom: 'VARIABLE'
        },
        {
          kind: 'category',
          name: 'Functions',
          colour: '#9A5CA6',
          custom: 'PROCEDURE'
        }
      ]
    };
  };

  // Export workspace as XML
  const exportWorkspace = () => {
    if (!workspaceRef.current) return '';
    const xml = Blockly.Xml.workspaceToDom(workspaceRef.current);
    return Blockly.Xml.domToPrettyText(xml);
  };

  // Clear workspace
  const clearWorkspace = () => {
    if (workspaceRef.current && window.confirm('Are you sure you want to clear the workspace?')) {
      workspaceRef.current.clear();
      generateCode();
    }
  };

  return (
    // FIX 1: Changed h-full to h-[90vh] to give the component a defined, responsive height
    // You can change this to 'h-[700px]' or any other fixed height if you prefer
    <div className="flex flex-col h-[90vh] bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between p-3 bg-slate-800 text-white border-b border-slate-600 gap-2">
        <h3 className="font-semibold text-lg">Blockly Editor</h3>
        
        <div className="flex items-center space-x-2 flex-wrap gap-2 justify-center">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-slate-300">Language:</span>
            <select 
              className="bg-slate-700 border border-slate-600 rounded px-2 py-1 text-sm"
              value={language}
              // This now calls the new prop to notify the parent of a change
              onChange={(e) => onLanguageChange?.(e.target.value)}
            >
              <option value="javascript">JavaScript</option>
              <option value="python">Python</option>
            </select>
          </div>
          <button
            onClick={clearWorkspace}
            className="px-3 py-1 bg-red-600 hover:bg-red-700 rounded text-sm transition-colors"
            title="Clear Workspace"
          >
            Clear
          </button>
          <button
            onClick={() => {
              const xml = exportWorkspace();
              navigator.clipboard.writeText(xml);
            }}
            className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-sm transition-colors"
            title="Export XML"
          >
            Export XML
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              {/* Icon */}
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex flex-col md:flex-row flex-1 min-h-0">
        {/* Blockly Workspace */}
        {/* FIX 2: Changed flex classes to create a 2/3 vs 1/3 split on mobile */}
        <div className="flex-[2] min-h-[300px] md:flex-1 md:min-h-0 relative">
          <div 
            ref={blocklyDiv} 
            className="absolute inset-0 w-full h-full"
          />
        </div>

        {/* Code Preview */}
        {/* FIX 2: Changed flex classes for the 1/3 split */}
        <div className="flex-[1] w-full md:w-96 border-t md:border-t-0 md:border-l border-slate-200 bg-slate-50 flex flex-col">
          <div className="p-4 border-b border-slate-200 bg-white">
            <h4 className="font-medium text-slate-800">
              Generated Code ({language === 'python' ? 'Python' : 'JavaScript'})
            </h4>
          </div>
          {/* FIX 3: Changed h-64 md:h-full to just h-full to fill its parent */}
          <pre className="p-4 h-full overflow-auto text-sm font-mono bg-slate-900 text-slate-100">
            <code>{codeOutput || '// Code will appear here...'}</code>
          </pre>
        </div>
      </div>

      {/* Status Bar */}
      <div className="px-4 py-2 bg-slate-100 border-t border-slate-200 text-sm text-slate-600 flex justify-between items-center">
        <div>
          Blocks: {workspaceRef.current ? workspaceRef.current.getAllBlocks(false).length : 0}
        </div>
        <div className="flex items-center space-x-4">
          <span>Read-only: {readOnly ? 'Yes' : 'No'}</span>
          <span>Zoom: {workspaceRef.current ? Math.round(workspaceRef.current.getScale() * 100) : 100}%</span>
        </div>
      </div>
    </div>
  );
};

export default BlocklyWorkspace;