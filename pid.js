class PID {
    constructor(Kp, Ki, Kd, kFF, integralLimit, derivativeEMASmooth, measurementEMASmooth) {
        this.Kp = Kp;
        this.Ki = Ki;
        this.Kd = Kd;
        this.kFF = kFF;
        this.integralLimit = integralLimit;
        this.derivativeEMASmooth = derivativeEMASmooth;
        this.measurementEMASmooth = measurementEMASmooth;
        this.integral = 0;
        this.previousMeasurement = 0;
        this.previousDerivative = 0;
        this.previousSetpoint = 0;
        this.t0 = null;
    }

    reset(previousMeasurement = 0, previousSetpoint = 0) {
        this.integral = 0;
        this.previousMeasurement = previousMeasurement;
        this.previousSetpoint = previousSetpoint;
        this.t0 = performance.now();
    }

    update(measuredValue, setpoint) {
        const t1 = performance.now();
        const dt = (t1 - this.t0) / 1000;  // Convert to seconds
        this.t0 = t1;

        measuredValue = measuredValue * (1 - this.measurementEMASmooth) +
                        this.previousMeasurement * this.measurementEMASmooth;
        const error = setpoint - measuredValue;

        this.integral += error * dt;
        this.integral = Math.max(Math.min(this.integral, this.integralLimit), -this.integralLimit);

        const derivative = (measuredValue - this.previousMeasurement) / dt;
        const smoothedDerivative = derivative * (1 - this.derivativeEMASmooth) +
                                   this.previousDerivative * this.derivativeEMASmooth;

        this.previousDerivative = smoothedDerivative;

        const ff = (setpoint - this.previousSetpoint) / dt;
        const output = this.Kp * error + this.Ki * this.integral * 0.1 - 
                       this.Kd * smoothedDerivative + this.kFF * ff;

        this.previousMeasurement = measuredValue;
        this.previousSetpoint = setpoint;

        return output;
    }
}
