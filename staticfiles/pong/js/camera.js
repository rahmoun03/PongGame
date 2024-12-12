    // // Easing functions for smoother transitions
    // const Easing = {
    //     // Exponential easing out - decelerating to zero velocity
    //     easeOutExpo: function(t) {
    //         return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
    //     },
    //     // Elastic easing out - overshooting slightly, then returning
    //     easeOutElastic: function(t) {
    //         const c4 = (2 * Math.PI) / 3;
    //         return t === 0 ? 0 : t === 1 ? 1
    //             : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
    //     }
    // };


    // function shakeCamera(params = {}) {
    //     // Default parameters with destructuring
    //     const {
    //         duration = 500,         // Duration in milliseconds
    //         intensity = 0.3,        // Shake intensity
    //         decay = true,          // Whether the shake should decay over time
    //         easing = 'easeOutExpo', // Easing function to use
    //         frequency = 20,         // How frequently the camera position updates
    //         axes = ['x', 'y']      // Which axes to shake - can be 'x', 'y', 'z'
    //     } = params;
    
    //     // Store original camera position
    //     const originalPosition = camera.position.clone();
    //     const startTime = Date.now();
    
    //     // Create noise offsets for more natural movement
    //     const noiseOffsets = axes.reduce((acc, axis) => {
    //         acc[axis] = Math.random() * 1000;
    //         return acc;
    //     }, {});
    
    //     function updateShake() {
    //         const elapsed = Date.now() - startTime;
    //         const progress = Math.min(elapsed / duration, 1);
    
    //         // If the shake duration is complete, reset camera position
    //         if (progress === 1) {
    //             camera.position.copy(originalPosition);
    //             return;
    //         }
    
    //         // Calculate shake intensity with decay
    //         const currentIntensity = decay 
    //             ? intensity * (1 - Easing[easing](progress))
    //             : intensity;
    
    //         // Apply perlin-like noise to each axis
    //         axes.forEach(axis => {
    //             noiseOffsets[axis] += 0.1;
    //             const noise = Math.sin(noiseOffsets[axis] * 10) * 
    //                          Math.cos(noiseOffsets[axis] * 7.5) * 
    //                          Math.sin(noiseOffsets[axis] * 5);
                
    //             camera.position[axis] = originalPosition[axis] + 
    //                 noise * currentIntensity;
    //         });
    
    //         // Request next frame
    //         requestAnimationFrame(updateShake);
    //     }
    
    //     // Start the shake animation
    //     updateShake();
    // }
    
    // // Example usage with different presets
    // const shakePresets = {
    //     goal: {
    //         duration: 500,
    //         intensity: 0.3,
    //         decay: true,
    //         easing: 'easeOutExpo',
    //         axes: ['x', 'y']
    //     },
    //     hit: {
    //         duration: 200,
    //         intensity: 0.1,
    //         decay: true,
    //         easing: 'easeOutElastic',
    //         axes: ['x', 'y']
    //     },
    //     gameOver: {
    //         duration: 1000,
    //         intensity: 0.5,
    //         decay: true,
    //         easing: 'easeOutElastic',
    //         axes: ['x', 'y', 'z']
    //     }
    // };


    // // Function to trigger different types of shakes
    // function triggerShake(type = 'goal') {
    //     const preset = shakePresets[type] || shakePresets.goal;
    //     shakeCamera(preset);
    // }
