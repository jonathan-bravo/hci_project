let firstButton = null;
let lines = [];
let lineID = 0;

// function drawLine(x1, y1, x2, y2, button1, button1Path, button2, button2Path) {
function drawLine(x1, y1, x2, y2, button1, button2) {
    // Get the SVG element
    if (button1 !== button2) {
        const svg = document.getElementById('svg-layer');

        // Calculate button dimensions to adjust endpoint
        const buttonRect = button2.getBoundingClientRect();
        const buttonRadius = buttonRect.width / 2; // Assuming square buttons

        // Calculate the distance between the two button centers
        const dx = x2 - x1;
        const dy = y2 - y1;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // Define the offset to adjust the endpoint
        const offset = buttonRadius * 0.7; // Adjust this value to fine-tune

        // Calculate the adjusted endpoint position
        const newX2 = x2 - (dx / distance) * offset;
        const newY2 = y2 - (dy / distance) * offset;

        // Create a new line element
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('id', 'line-'+lineID);
        lineID++;

        line.setAttribute('x1', x1);
        line.setAttribute('y1', y1);
        line.setAttribute('x2', newX2);
        line.setAttribute('y2', newY2);
        line.setAttribute('stroke', 'black');
        line.setAttribute('stroke-width', '2');
        line.setAttribute('marker-end', 'url(#arrowhead)');
        line.classList.add('flow-line'); // Add a class for easy selection

        // Add the line to the SVG
        svg.appendChild(line);

        // Store the line with associated buttons
        // lines.push({ line: line, button1: button1, button1Path: button1Path, button2: button2, button2Path: button2Path});
        lines.push({ line: line, button1: button1, button2: button2 });
    }
}

function addLineIfNotExists(button1, button2) {
    // Check if a line already exists between the two buttons
    const lineExists = lines.some(lineObj => 
        (lineObj.button1 === button1 && lineObj.button2 === button2) ||
        (lineObj.button1 === button2 && lineObj.button2 === button1)
    );

    // Only add a line if it doesn't already exist
    if (!lineExists) {
        const rect1 = button1.getBoundingClientRect();
        const rect2 = button2.getBoundingClientRect();
        const overlayRect = canvasOverlay.getBoundingClientRect();

        const x1 = rect1.left + rect1.width / 2 - overlayRect.left;
        const y1 = rect1.top + rect1.height / 2 - overlayRect.top;
        const x2 = rect2.left + rect2.width / 2 - overlayRect.left;
        const y2 = rect2.top + rect2.height / 2 - overlayRect.top;

        // const button1Path = button1.getAttribute('data-path');
        // const button2Path = button2.getAttribute('data-path');

        // drawLine(x1, y1, x2, y2, button1, button1Path, button2, button2Path);
        drawLine(x1, y1, x2, y2, button1, button2);
    }
}

canvasOverlay.addEventListener('click', function(event) {
    if (event.target.tagName === 'BUTTON') {
        if (!firstButton) {
            // Select the first button
            firstButton = event.target;
            firstButton.style.border = '2px solid blue'; // Highlight selection
        } else {
            // Select the second button and draw a line
            const secondButton = event.target;
            if (firstButton !== secondButton) {
                addLineIfNotExists(firstButton, secondButton);
            }

            // Reset selection
            firstButton.style.border = '';
            firstButton = null;
        }
    }
});

function updateLines(movedButton, newX, newY) {
    const overlayRect = canvasOverlay.getBoundingClientRect();

    lines.forEach(({ line, button1, button2 }) => {
        // Debugging: Check if button1 and button2 are defined
        if (!button1 || !button2) {
            console.error('Undefined button in line connection:', { button1, button2 });
            return; // Skip this iteration if undefined
        }

        // Get the bounding rectangles of the buttons
        const rect1 = button1.getBoundingClientRect();
        const rect2 = button2.getBoundingClientRect();

        // Calculate line positions based on which button is moved
        if (button1 === movedButton) {
            const x1 = newX + movedButton.offsetWidth / 2;
            const y1 = newY + movedButton.offsetHeight / 2;
            const x2 = rect2.left + rect2.width / 2 - overlayRect.left;
            const y2 = rect2.top + rect2.height / 2 - overlayRect.top;

            adjustLineEndpoint(line, x1, y1, x2, y2);
        } else if (button2 === movedButton) {
            const x1 = rect1.left + rect1.width / 2 - overlayRect.left;
            const y1 = rect1.top + rect1.height / 2 - overlayRect.top;
            const x2 = newX + movedButton.offsetWidth / 2;
            const y2 = newY + movedButton.offsetHeight / 2;

            adjustLineEndpoint(line, x1, y1, x2, y2);
        }

        bringLineToFront(line);
    });
}

function adjustLineEndpoint(line, x1, y1, x2, y2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // Calculate button radius as offset
    const buttonRadius = 20; // Adjust as needed, or get dynamically from button2 size
    const offset = buttonRadius * 0.7;

    // Calculate the adjusted endpoint
    const newX2 = x2 - (dx / distance) * offset;
    const newY2 = y2 - (dy / distance) * offset;

    line.setAttribute('x1', x1);
    line.setAttribute('y1', y1);
    line.setAttribute('x2', newX2);
    line.setAttribute('y2', newY2);
}

function bringLineToFront(line) {
    const svg = document.getElementById('svg-layer');
    svg.appendChild(line); // Re-append the line to bring it to the front
}

//Handles deleted button event to clear the button from selection to ensure no random lines are generated.
document.addEventListener('buttonDeleted', function(event) {
    const deletedButton = event.detail.button;
    if (firstButton === deletedButton) {
        firstButton.style.border = '';
        firstButton = null;
    }    
} );