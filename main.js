let canvas = document.getElementById('simulationCanvas');
let ctx = canvas.getContext('2d');

let env = new ParticleEnv(0.5);
let pid = new PID(5.0, 1.0, 20.0, 0.0, 10, 0.9, 0.5, 0.9);
let position = env.reset();
let setpoint = 10.0;

function updatePIDParameters() {
    setpoint = parseFloat(document.getElementById('setpointSlider').value);
    env.sensor_std = parseFloat(document.getElementById('sensorStdSlider').value);
    pid.Kp = parseFloat(document.getElementById('kpSlider').value);
    pid.Ki = parseFloat(document.getElementById('kiSlider').value);
    pid.Kd = parseFloat(document.getElementById('kdSlider').value);
    pid.kFF = parseFloat(document.getElementById('kffSlider').value);
    pid.integralLimit = parseFloat(document.getElementById('intLimitSlider').value);
    pid.derivativeEMASmooth = parseFloat(document.getElementById('derEMASlider').value);
    pid.measurementEMASmooth = parseFloat(document.getElementById('measEMASlider').value);
    pid.outputEMAsmooth = parseFloat(document.getElementById('outEMASlider').value);

    // Update displayed values
    document.getElementById('setpointValue').textContent = setpoint.toFixed(1);
    document.getElementById('sensorStdValue').textContent = env.sensor_std.toFixed(1);
    document.getElementById('kpValue').textContent = pid.Kp.toFixed(1);
    document.getElementById('kiValue').textContent = pid.Ki.toFixed(1);
    document.getElementById('kdValue').textContent = pid.Kd.toFixed(1);
    document.getElementById('kffValue').textContent = pid.kFF.toFixed(1);
    document.getElementById('intLimitValue').textContent = pid.integralLimit;
    document.getElementById('derEMAValue').textContent = pid.derivativeEMASmooth.toFixed(2);
    document.getElementById('measEMAValue').textContent = pid.measurementEMASmooth.toFixed(2);
    document.getElementById('outEMAValue').textContent = pid.outputEMAsmooth.toFixed(2);
}

// Initialize sliders
updatePIDParameters();
document.getElementById('resetButton').addEventListener('click', function() {
    // Reset the env and pid instances
    env.reset();
    pid.reset();
});
// Add event listeners to sliders
document.getElementById('setpointSlider').addEventListener('input', updatePIDParameters);
document.getElementById('sensorStdSlider').addEventListener('input', updatePIDParameters);
document.getElementById('kpSlider').addEventListener('input', updatePIDParameters);
document.getElementById('kiSlider').addEventListener('input', updatePIDParameters);
document.getElementById('kdSlider').addEventListener('input', updatePIDParameters);
document.getElementById('kffSlider').addEventListener('input', updatePIDParameters);
document.getElementById('intLimitSlider').addEventListener('input', updatePIDParameters);
document.getElementById('derEMASlider').addEventListener('input', updatePIDParameters);
document.getElementById('measEMASlider').addEventListener('input', updatePIDParameters);
document.getElementById('outEMASlider').addEventListener('input', updatePIDParameters);

function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    let action = [0, 0.1 * pid.update(position[1], setpoint)];
    env.setSetpoint(setpoint);
    let [obs, done] = env.step(action);
    position = obs;
    env.render(ctx);
    if (!done) {
        requestAnimationFrame(animate);
    }
}

pid.reset(position[1], setpoint);
requestAnimationFrame(animate);
