function handleGenerateClick() {
    const generateButton = document.getElementById('generate-button');
    // Ensure the browser registers the class addition
    generateButton.classList.add('pressed');

    // Use a setTimeout to create a delay before removing the pressed class
    setTimeout(() => {
        generateButton.classList.remove('pressed');

        // Continue with the logic after the animation
        if (lines.length === 0) {
            setTimeout(() => {
                alert('No connections to generate output from.');
            }, 50); // Slight delay to prevent blocking CSS animation
            return;
        }

        // Build array of all nodes(buttons) on the canvas with all necessary JSON information.
        const nodes = [...canvasOverlay.querySelectorAll('button')].map(button => ({
            id: button.getAttribute('id'),
            name: button.textContent,
            path: button.getAttribute('data-parents'),
            inputs: button.getAttribute('inputs'),   // Placeholder for inputs
            outputs: button.getAttribute('outputs'),  // Placeholder for outputs
            params: button.getAttribute('params'),   // Placeholder for params
            threads: button.getAttribute('threads'),  // Placeholder for threads
            depends_on: [] // List of dependent node IDs
        }));

        // const lineData = lines.map(({ line, button1, button2 }) => {
        //     const button1Parents = button1.getAttribute('data-parents');
        //     const button2Parents = button2.getAttribute('data-parents');

        //     return {
        //         button1: button1Parents,
        //         button2: button2Parents,
        //         lineId: line.getAttribute('id'),
        //     };
        // });

        // Creating a connection from each source button to target button.
        const connections = lines.map(({ button1, button2 }) => ({
            source: button1.getAttribute('id'),
            target: button2.getAttribute('id')
        }));

        // Update dependencies for each node based on their connections.
        connections.forEach(({ source, target }) => {
            const targetNode = nodes.find(node => node.id === target);
            if (targetNode) {
                targetNode.depends_on.push(source);
            }
        });

        // Log line data to console after a delay
        setTimeout(() => {
            console.log('DagNodes:', nodes);
            sendDataToServer(nodes);
            alert('Generation complete! Check console for line data.');
        }, 50);
    }, 100); // Keep this delay in sync with the CSS transition duration
}

function sendDataToServer(data) {
    fetch('/your-endpoint', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
    })
    .then(response => response.json())
    .then(result => {
        console.log('Server response:', result);
    })
    .catch(error => {
        console.error('Error:', error);
    });
}