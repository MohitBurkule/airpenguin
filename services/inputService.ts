import { InputState } from '../types';

export class InputService {
  private static instance: InputService;
  private keys: Set<string> = new Set();
  private orientation: { beta: number; gamma: number } | null = null;
  private calibration: { beta: number; gamma: number } = { beta: 0, gamma: 0 };
  private isMobile: boolean = false;
  
  // Mouse State for PC Tilt
  private mouse: { x: number; y: number } = { x: 0, y: 0 };
  private useMouse: boolean = false;

  private constructor() {
    // Initialize mouse to center to avoid jump on start
    if (typeof window !== 'undefined') {
        this.mouse = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    }
    this.initListeners();
  }

  public static getInstance(): InputService {
    if (!InputService.instance) {
      InputService.instance = new InputService();
    }
    return InputService.instance;
  }

  private initListeners() {
    window.addEventListener('keydown', (e) => this.keys.add(e.code));
    window.addEventListener('keyup', (e) => this.keys.delete(e.code));
    
    // Mouse Listeners for PC "Tilt"
    window.addEventListener('mousemove', (e) => {
      this.mouse = { x: e.clientX, y: e.clientY };
      // If we detect significant mouse movement, enable mouse mode
      if (!this.isMobile) {
          this.useMouse = true;
      }
    });

    // Reset mouse to center if it leaves the window to stop unwanted movement
    window.addEventListener('mouseout', () => {
      this.mouse = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    });
    
    if (window.DeviceOrientationEvent) {
      window.addEventListener('deviceorientation', (e) => {
        // Verify we actually have sensor data (some laptops fire empty events)
        if (e.beta !== null && e.gamma !== null) {
          this.isMobile = true;
          this.useMouse = false;
          this.orientation = {
            beta: e.beta || 0,   // Front/Back tilt (-180 to 180)
            gamma: e.gamma || 0, // Left/Right tilt (-90 to 90)
          };
        }
      });
    }
  }

  public calibrate() {
    if (this.orientation) {
      this.calibration = { ...this.orientation };
    }
    // Mouse assumes screen center is neutral
    if (typeof window !== 'undefined') {
        this.mouse = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    }
  }

  public getInput(): InputState {
    const input: InputState = { x: 0, z: 0 };

    if (this.isMobile && this.orientation) {
      // Mobile Tilt Logic
      const maxTilt = 25; // Degrees
      
      let rawX = this.orientation.gamma - this.calibration.gamma;
      let rawZ = this.orientation.beta - this.calibration.beta;

      // Clamp
      rawX = Math.max(-maxTilt, Math.min(maxTilt, rawX));
      rawZ = Math.max(-maxTilt, Math.min(maxTilt, rawZ));

      // Normalize -1 to 1
      input.x = rawX / maxTilt;
      input.z = rawZ / maxTilt; 
    } else if (this.useMouse) {
      // Mouse "Virtual Joystick" Logic
      const centerX = window.innerWidth / 2;
      const centerY = window.innerHeight / 2;
      
      // Sensitivity: Full tilt at 25% of screen height
      const sensitivityRadius = window.innerHeight * 0.25;
      
      const deltaX = this.mouse.x - centerX;
      const deltaY = this.mouse.y - centerY;
      
      // Map to -1 to 1
      input.x = Math.max(-1, Math.min(1, deltaX / sensitivityRadius));
      // Invert Y because moving mouse UP (negative Y) means go FORWARD (positive Z)
      input.z = Math.max(-1, Math.min(1, -deltaY / sensitivityRadius)); 
    }

    // Keyboard Fallback / Additive
    if (this.keys.has('ArrowUp') || this.keys.has('KeyW')) input.z += 1;
    if (this.keys.has('ArrowDown') || this.keys.has('KeyS')) input.z -= 1;
    
    // Flipped A/D keys as requested
    if (this.keys.has('ArrowLeft') || this.keys.has('KeyA')) input.x += 1; // Right
    if (this.keys.has('ArrowRight') || this.keys.has('KeyD')) input.x -= 1; // Left

    // Normalize vector if magnitude > 1
    const len = Math.sqrt(input.x * input.x + input.z * input.z);
    if (len > 1) {
      input.x /= len;
      input.z /= len;
    }

    return input;
  }
}