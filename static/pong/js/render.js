
export function render(component, container) {
    container.innerHTML = ''; // Clear the container
    container.appendChild(component);
}
