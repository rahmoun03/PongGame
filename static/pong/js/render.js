
export function render(component, container) {
    // console.log('clear: ', container);
    container.innerHTML = ''; // Clear the container
    container.appendChild(component);
}
