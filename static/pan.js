const CanvasOverlay = document.getElementById('canvas-overlay');
let isPanning = false;
let startX, startY;
let offsetX = 0, offsetY = 0;
let scale = 1;

// Pan functionality
CanvasOverlay.addEventListener('mousedown', (e) => {
    if (e.target.tagName !== 'BUTTON') {
        isPanning = true;
        startX = e.clientX - offsetX;
        startY = e.clientY - offsetY;
    }
});

document.addEventListener('mousemove', (e) => {
    if (!isPanning) return;
    offsetX = e.clientX - startX;
    offsetY = e.clientY - startY;
    applyTransform();
});

document.addEventListener('mouseup', () => {
    isPanning = false;
});

// // Zoom functionality
// CanvasOverlay.addEventListener('wheel', (e) => {
//     e.preventDefault();
//     const zoomSpeed = 0.1;
//     scale += e.deltaY > 0 ? -zoomSpeed : zoomSpeed;
//     scale = Math.min(Math.max(0.5, scale), 3);  // Limit scale between 0.5x and 3x
//     applyTransform();
// });

// Apply both scale and translate transformations
function applyTransform() {
    CanvasOverlay.style.transform = `translate(${offsetX}px, ${offsetY}px) scale(${scale})`;
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