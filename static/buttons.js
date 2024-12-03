// Canvas functionality
const canvasOverlay = document.getElementById('canvas-overlay');
//const buttonPaths = {};
let buttonID = 0;

canvasOverlay.ondragover = function(event) {
    event.preventDefault();
};

canvasOverlay.ondrop = function(event) {
    event.preventDefault();
    const name = event.dataTransfer.getData('text/plain');
    const path = event.dataTransfer.getData('custom/path');
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    addNodeToCanvas(name, x, y, path);
};

// Added more attributes to each button so that the JSON can be populated easier later.
// In the future, need to add way to change this attributes. Have a concept in mind, will be next feature I work on.
function addNodeToCanvas(name, x, y, path) {
    // Create a new button element
    const newButton = document.createElement('button');
    newButton.textContent = name;
    newButton.className = 'px-4 py-2 bg-green-500 text-white rounded absolute cursor-move';
    newButton.setAttribute('id', 'button-'+buttonID);
    buttonID++;
    newButton.setAttribute('data-parents', path);
    newButton.setAttribute('inputs', '')
    newButton.setAttribute('outputs', name+'.out')
    newButton.setAttribute('params', '')
    newButton.setAttribute('threads', '1')

    //buttonPaths['button-'+buttonID] = path;

    newButton.style.left = `${x}px`;
    newButton.style.top = `${y}px`;
    newButton.style.zIndex = '10';

    enableDragging(newButton);

    newButton.addEventListener('dblclick', function() {
        if (confirm('Are you sure you want to delete this button?')) {
            
            // Simplified fixing the random line issue.
            if (firstButton === newButton) {
                firstButton.style.border = '';
                firstButton = null;
            }

            canvasOverlay.removeChild(newButton);
            // Remove associated lines
            lines = lines.filter(({ line, button1, button2 }) => {
                if (button1 === newButton || button2 === newButton) {
                    // Remove the line from the SVG layer
                    line.remove();
                    return false; // Exclude this line from the lines array
                }
                return true; // Keep other lines
            });
        }
    });
    enableParameterEditing(newButton);
    canvasOverlay.appendChild(newButton);
}

function enableDragging(element) {
    let isDragging = false;
    let startX, startY, initialX, initialY;

    // Get the boundaries of the canvasOverlay
    const overlayRect = canvasOverlay.getBoundingClientRect();

    // When the user starts to drag
    element.addEventListener('mousedown', function(event) {
        isDragging = true;

        // Get initial cursor position
        startX = event.clientX;
        startY = event.clientY;

        // Get initial button position
        initialX = element.offsetLeft;
        initialY = element.offsetTop;

        // Add event listeners for moving and releasing
        document.addEventListener('mousemove', onDrag);
        document.addEventListener('mouseup', stopDrag);

        // Prevent default behavior
        event.preventDefault();
    });

    // Function to move the button as the mouse moves
    function onDrag(event) {
        //event.preventDefault();
        if (!isDragging) return;

        // Calculate the new position
        const deltaX = event.clientX - startX;
        const deltaY = event.clientY - startY;

        // Calculate new positions relative to the initial position
        let newX = initialX + deltaX;
        let newY = initialY + deltaY;

        // Bound the new position within the canvasOverlay
        newX = Math.max(0, Math.min(newX, overlayRect.width - element.offsetWidth));
        newY = Math.max(0, Math.min(newY, overlayRect.height - element.offsetHeight));

        // Update the position of the element
        element.style.left = `${newX}px`;
        element.style.top = `${newY}px`;

        updateLines(element, newX, newY);
    }

    // Stop dragging when mouse is released
    function stopDrag() {
        if (isDragging) {
            isDragging = false;

            document.removeEventListener('mousemove', onDrag);
            document.removeEventListener('mouseup', stopDrag);
        }
    }
}

let selectedButton = null; // Track the currently selected button

// Function to handle button selection
function showParameterEditor(button) {

    // Show the parameter editor
    const parameterEditor = document.getElementById('parameter-editor');
    parameterEditor.classList.remove('hidden');

    // Clear previous fields
    const parameterFields = document.getElementById('parameter-fields');
    parameterFields.innerHTML = '';

    // Attributes to include in the editor
    inputButton = button.getAttribute('data-parents').split('/')[0] === 'INPUTS'

    if(inputButton) {
        editableAttributes = ['outputs'];
    } else {
        editableAttributes = ['inputs', 'outputs', 'params', 'threads'];
    }

    editableAttributes.forEach(attr => {
        const value = button.getAttribute(attr) || '';
        const field = document.createElement('div');
        field.className = 'flex gap-2 items-center';

        const label = document.createElement('label');
        if (inputButton) {
            label.textContent = 'Filename'
        } else {
            label.textContent = attr === 'inputs' ? 'Additional Inputs' : `${attr.charAt(0).toUpperCase() + attr.slice(1)}:`;
        }
        label.className = 'w-1/3 font-medium';

        const input = document.createElement('input');
        input.type = attr === 'threads' ? 'number' : 'text';
        input.value = value;
        input.id = `param-${attr}`;
        input.className = 'flex-grow p-2 border rounded';

        // Attach real-time update listener
        input.addEventListener('input', () => updateButtonAttribute(button, attr, input.value));

        field.appendChild(label);
        field.appendChild(input);
        parameterFields.appendChild(field);
    });
}

// Function to update button parameters
function updateButtonAttribute(button, attribute, value) {
    if (!button) return;
    button.setAttribute(attribute, value);
}

function enableParameterEditing(button) {
    button.addEventListener('click', () => showParameterEditor(button));
}
