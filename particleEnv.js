class ParticleEnv {
    constructor(sensor_std) {
        this.gravity = 9.8;  // Gravity constant
        this.mass = 0.6;     // Mass of the particle
        this.radius = 1.0;   // Radius of the particle
        this.k = 100;        // Spring constant
        this.mu = 0.0;       // Friction coefficient
        this.dt = null;      // Time step
        this.sensor_std = sensor_std;  // Standard deviation of the sensor noise
        this.position = [0, 0];
        this.velocity = [0, 0];
        this.edge = 10.0;    // Edge of the box
        this.minThrust = 0.1 * 9.8;  // Minimum thrust in Newtons
        this.maxThrust = 1.5 * 9.8;  // Maximum thrust in Newtons
        this.t0 = null;
        this.action = null;
        this.force = null;
        this.actionArrow = null;
        this.forceArrow = null;
        this.actionHistory = [];  // Store the history of actions
        this.maxHistorySize = 100; // Maximum size of the history
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

        // clip action to min and max thrust
        this.action[1] = Math.max(Math.min(this.action[1], this.maxThrust), this.minThrust);
        this.actionHistory.push(this.action[1]); // Storing only the Y component
        if (this.actionHistory.length > this.maxHistorySize) {
            this.actionHistory.shift(); // Remove the oldest entry
        }
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

        // Draw the action arrow (scaled by g)
        if (this.action) {
            this._drawArrow(ctx, x, y, this.action, 'red');
        }

        // Draw the force arrow (scaled by g)
        if (this.force) {
            this._drawArrow(ctx, x, y, this.force, 'green');
        }
        this._drawGraph(ctx);
    }
    
    _drawGraph(ctx) {
        const graphWidth = ctx.canvas.width;
        const graphHeight = 100; // Fixed height for the graph
        const graphBottom = ctx.canvas.height; // Position graph at the bottom of the canvas
    
        // Background for the graph
        ctx.fillStyle = 'lightgray';
        ctx.fillRect(0, graphBottom - graphHeight, graphWidth, graphHeight);
    
        // Prepare to draw the graph line
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 2;
        ctx.beginPath();
    
        const stepSize = graphWidth / this.maxHistorySize;
    
        for (let i = 0; i < this.actionHistory.length; i++) {
            const x = stepSize * i;
            const y = graphBottom - (this.actionHistory[i] * graphHeight*0.5); // Scale action value to graph height
    
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
    
        ctx.stroke(); // Draw the graph line
    }    

    _drawArrow(ctx, fromX, fromY, vector, color) {
        const g = 9.8;  // Acceleration due to gravity
        const scaleFactor = 50;  // Adjust this for desired arrow size
    
        // Calculate the scaled vector
        const scaledVector = [vector[0] / g * scaleFactor, vector[1] / g * scaleFactor];
    
        // Calculate the end point of the arrow
        const toX = fromX + scaledVector[0];
        const toY = fromY - scaledVector[1]; // Subtract because canvas y-axis is inverted
    
        // Draw the line
        ctx.beginPath();
        ctx.moveTo(fromX, fromY);
        ctx.lineTo(toX, toY);
        ctx.strokeStyle = color;
        ctx.lineWidth = 3;  // Set the line width of the arrow
        ctx.stroke();
    
        // Draw the arrowhead
        const angle = Math.atan2(-scaledVector[1], scaledVector[0]);
        const arrowHeadLength = 10;  // Arrowhead length
        const arrowHeadWidth = 7;  // Arrowhead width
    
        ctx.beginPath();
        ctx.moveTo(toX, toY);
        ctx.lineTo(toX - arrowHeadLength * Math.cos(angle - Math.PI / 6), toY - arrowHeadLength * Math.sin(angle - Math.PI / 6));
        ctx.lineTo(toX - arrowHeadLength * Math.cos(angle + Math.PI / 6), toY - arrowHeadLength * Math.sin(angle + Math.PI / 6));
        ctx.lineTo(toX, toY);
        ctx.lineTo(toX - arrowHeadLength * Math.cos(angle - Math.PI / 6), toY - arrowHeadLength * Math.sin(angle - Math.PI / 6));
        ctx.fillStyle = color;
        ctx.fill();
    }
}
