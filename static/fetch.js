fetch('/wrappers')
    .then(response => response.json())
    .then(data => {
        const treeContainer = document.getElementById('tree');

        // Skip the "Wrappers" root and process its children
        if (data.name.toLowerCase() === 'wrappers' && data.children) {
            data.children.forEach(child => {
                const li = createList(child);
                treeContainer.appendChild(li);
            });
        } else {
            // If "Wrappers" is not the root, process normally
            const ul = document.createElement('ul');
            ul.appendChild(createList(data));
            treeContainer.appendChild(ul);
        }

        function createList(node) {
            //console.log('Creating list for node:', node.name); //debugging
            const li = document.createElement('li');
            li.classList.add(node.type, 'my-1', 'relative');

            // Toggle button for collapsing if node has children
            if (node.children && node.children.length > 0) {
                const toggleButton = document.createElement('button');
                toggleButton.textContent = node.name;
                toggleButton.className = 'node-label toggle-button mr-2 text-lg text-gray-600 focus:outline-none';
                toggleButton.onclick = function() {
                    const childList = li.querySelector('ul');
                    if (childList) {
                        childList.classList.toggle('hidden');
                        toggleButton.classList.toggle('expanded');
                    }
                };
                li.appendChild(toggleButton);

            } else {
                // Add button only for leaf nodes
                const button = document.createElement('button');
                button.textContent = node.name;
                button.className = 'draggable-button px-4 py-2 bg-blue-500 text-white rounded cursor-move';
                button.setAttribute('draggable', true);

                // Set drag behavior
                button.ondragstart = function(event) {
                    const parentsPath = getAllParents(button.parentElement);
                    event.dataTransfer.setData('text/plain', node.name);
                    event.dataTransfer.setData('custom/path', parentsPath);
                };

                li.appendChild(button);
            }

            // Add children if present
            if (node.children && node.children.length > 0) {
                const ul = document.createElement('ul');
                ul.classList.add('pl-4', 'list-none', 'hidden'); // Initially hidden
                node.children.forEach(child => {
                    ul.appendChild(createList(child));
                });
                li.appendChild(ul);
            }

            return li;
        }

    })
    .catch(error => console.error(error));

function getAllParents(element) {
    let parents = [];
    let currentElement = element;

    // Traverse up the DOM tree
    while (currentElement) {
        if (currentElement.tagName === 'LI') {
            const label = currentElement.querySelector('.node-label') || currentElement.querySelector('.draggable-button');
            const labelText = label.textContent.trim();

            if (label) {
                parents.unshift(labelText); // Add to the beginning
            }
        }
        currentElement = currentElement.parentElement;

        // Stop when reaching the <ul> element with id 'tree'
        if (currentElement && currentElement.id === 'tree') {
            break;
        }
    }

    // Join the parent names to form a path
    return parents.join('/');
}