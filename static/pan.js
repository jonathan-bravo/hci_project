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