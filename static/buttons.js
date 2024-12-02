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
    newButton.setAttribute('inputs', name+'.input')
    newButton.setAttribute('outputs', name+'.output')
    newButton.setAttribute('params', '-f -z -g')
    newButton.setAttribute('threads', '32')

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

function showTab(tabName) {
    
    document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.style.display = 'none');

    if (tabName === 'canvas') {
        document.getElementById('tab-canvas').classList.add('active');
        document.getElementById('canvas-tab').style.display = 'block';
    } else if (tabName === 'snakemake') {
        document.getElementById('tab-snakemake').classList.add('active');
        document.getElementById('snakemake-tab').style.display = 'block';
    }
}

function downloadSnakemake() {
    fetch('/download-snakefile')
        .then(response => {
            if (!response.ok) {
                throw new Error('Snakefile not found. Please generate it first.');
            }
            return response.blob();
        })
        .then(blob => {
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = 'Snakefile';
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
        })
        .catch(error => {
            console.error('Error downloading Snakefile:', error);
            alert(error.message);
        });
}