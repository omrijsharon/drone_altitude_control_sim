class ParticleEnv {
    constructor(sensor_std) {
        this.gravity = 9.8;  // Gravity constant
        this.mass = 1.0;     // Mass of the particle
        this.radius = 1.0;   // Radius of the particle
        this.k = 100;        // Spring constant
        this.mu = 0.1;       // Friction coefficient
        this.dt = null;      // Time step
        this.sensor_std = sensor_std;  // Standard deviation of the sensor noise
        this.position = [0, 0];
        this.velocity = [0, 0];
        this.edge = 10.0;    // Edge of the box
        this.t0 = null;
        this.action = null;
        this.force = null;
        this.actionArrow = null;
        this.forceArrow = null;
    }

    reset(initPosition = null) {
        this.position = [0, this.radius * 2];
        if (initPosition !== null) {
            this.position = initPosition;
        }
        this.velocity = [0, 0];
        this.t0 = performance.now();
        return this._getObs();
    }

    step(action) {
        const t1 = performance.now();
        this.dt = (t1 - this.t0) / 1000;  // Convert to seconds
        this.t0 = t1;
        this.action = action;

        // Gravity force
        this.force = [0, -this.gravity * this.mass];
        // Spring force
        if (this.position[1] < this.radius) {
            this.force[1] -= this.k * (this.position[1] - this.radius);
        }
        // Friction
        this.force[0] -= this.mu * this.velocity[0];
        this.force[1] -= this.mu * this.velocity[1];
        // Action
        this.force[0] += this.action[0];
        this.force[1] += this.action[1];

        // Update velocity and position
        const acceleration = [this.force[0] / this.mass, this.force[1] / this.mass];
        this.velocity[0] += acceleration[0] * this.dt;
        this.velocity[1] += acceleration[1] * this.dt;
        this.position[0] += this.velocity[0] * this.dt;
        this.position[1] += this.velocity[1] * this.dt;

        // Prepare observation
        const obs = this._getObs();
        // Check bounds
        const done = !(this.position[0] > -this.edge && this.position[0] < this.edge &&
                       this.position[1] > 0 && this.position[1] < 2 * this.edge);

        return [obs, done];
    }

    _getObs() {
        // Add Gaussian noise to the position
        const noisyPosition = [
            this.position[0] + this._randomGaussian(0, this.sensor_std),
            this.position[1] + this._randomGaussian(0, this.sensor_std)
        ];
        return noisyPosition.map(p => Math.round(p * 10) / 10);  // 10 cm quantization
    }

    _randomGaussian(mean, stdDev) {
        let u = 0, v = 0;
        while (u === 0) u = Math.random();  // Converting [0,1) to (0,1)
        while (v === 0) v = Math.random();
        return mean + stdDev * Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
    }

    render(ctx) {
        // Canvas dimensions
        const canvasWidth = ctx.canvas.width;
        const canvasHeight = ctx.canvas.height;
    
        // Scaling factors for position
        const scaleX = canvasWidth / (2 * this.edge);
        const scaleY = canvasHeight / (2 * this.edge);
    
        // Position the setpoint ball at a fixed, visible location
        // For example, near the center of the canvas
        const setpointX = canvasWidth / 2 + 50; // 50 pixels to the right of the center
        const setpointY = canvasHeight / 2; // Vertically centered
    
        // Draw the setpoint ball (green, less transparent and slightly larger)
        const setpointRadius = this.radius * Math.min(scaleX, scaleY) * 1.2; // 20% larger than the particle
        ctx.beginPath();
        ctx.arc(setpointX, setpointY, setpointRadius, 0, 2 * Math.PI);
        ctx.fillStyle = 'rgba(0, 128, 0, 0.7)'; // Less transparent green
        ctx.fill();
    
        // Translate and scale the position of the moving ball
        const x = (this.position[0] + this.edge) * scaleX;
        const y = (2 * this.edge - this.position[1]) * scaleY;
    
        // Draw the moving particle (blue)
        ctx.beginPath();
        ctx.arc(x, y, this.radius * Math.min(scaleX, scaleY), 0, 2 * Math.PI);
        ctx.fillStyle = 'blue';
        ctx.fill();
    
        // Define a fixed length for the arrows for better visibility
        const arrowLength = 50;  // Adjust this value as needed
    
        // Draw the action arrow
        if (this.action) {
            const actionAngle = Math.atan2(-this.action[1], this.action[0]);
            this._drawArrow(ctx, x, y, x + arrowLength * Math.cos(actionAngle), y + arrowLength * Math.sin(actionAngle), 'red');
        }
    
        // Draw the force arrow
        if (this.force) {
            const forceAngle = Math.atan2(-this.force[1], this.force[0]);
            this._drawArrow(ctx, x, y, x + arrowLength * Math.cos(forceAngle), y + arrowLength * Math.sin(forceAngle), 'green');
        }
    }
    
    
    

    _drawArrow(ctx, fromX, fromY, toX, toY, color) {
        ctx.beginPath();
        ctx.moveTo(fromX, fromY);
        ctx.lineTo(toX, toY);
        ctx.strokeStyle = color;
        ctx.stroke();
    }
}
