let canvas = document.getElementById('simulationCanvas');
let ctx = canvas.getContext('2d');

let env = new ParticleEnv(0.1);
let pid = new PID(5.0, 1.0, 20.0, 0.0, 10, 0.9, 0.5);
let position = env.reset();
let setpoint = 10.0;

function updatePIDParameters() {
    pid.Kp = parseFloat(document.getElementById('kpSlider').value);
    pid.Ki = parseFloat(document.getElementById('kiSlider').value);
    pid.Kd = parseFloat(document.getElementById('kdSlider').value);
    pid.kFF = parseFloat(document.getElementById('kffSlider').value);
    pid.integralLimit = parseFloat(document.getElementById('intLimitSlider').value);
    pid.derivativeEMASmooth = parseFloat(document.getElementById('derEMASlider').value);
    pid.measurementEMASmooth = parseFloat(document.getElementById('measEMASlider').value);

    // Update displayed values
    document.getElementById('kpValue').textContent = pid.Kp.toFixed(1);
    document.getElementById('kiValue').textContent = pid.Ki.toFixed(1);
    document.getElementById('kdValue').textContent = pid.Kd.toFixed(1);
    document.getElementById('kffValue').textContent = pid.kFF.toFixed(1);
    document.getElementById('intLimitValue').textContent = pid.integralLimit;
    document.getElementById('derEMAValue').textContent = pid.derivativeEMASmooth.toFixed(2);
    document.getElementById('measEMAValue').textContent = pid.measurementEMASmooth.toFixed(2);
}

// Initialize sliders
updatePIDParameters();
document.getElementById('resetButton').addEventListener('click', function() {
    // Reset the env and pid instances
    env.reset();
    pid.reset();
});
// Add event listeners to sliders
document.getElementById('kpSlider').addEventListener('input', updatePIDParameters);
document.getElementById('kiSlider').addEventListener('input', updatePIDParameters);
document.getElementById('kdSlider').addEventListener('input', updatePIDParameters);
document.getElementById('kffSlider').addEventListener('input', updatePIDParameters);
document.getElementById('intLimitSlider').addEventListener('input', updatePIDParameters);
document.getElementById('derEMASlider').addEventListener('input', updatePIDParameters);
document.getElementById('measEMASlider').addEventListener('input', updatePIDParameters);

function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    let action = [0, 0.1 * pid.update(position[1], setpoint)];
    let [obs, done] = env.step(action);
    position = obs;
    env.render(ctx);
    if (!done) {
        requestAnimationFrame(animate);
    }
}

pid.reset(position[1], setpoint);
requestAnimationFrame(animate);
