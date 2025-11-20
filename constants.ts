
// Physics
export const GRAVITY = -25;
export const JUMP_FORCE = 13; // Slightly increased for consistency
export const WHALE_JUMP_FORCE = 22;
export const MOVE_SPEED = 10; // Base speed increased to allow sensitivity to scale down/up
export const AIR_CONTROL_FACTOR = 5.0; // High for snappy control on standard ground
export const SLIPPERY_CONTROL_FACTOR = 0.5; // Very low for drifting/sliding
export const SLIPPERY_FRICTION = 0.98; // Preservation of momentum on ice

// World
export const PLATFORM_SIZE = 2;
export const PLATFORM_GAP = 3.5; // Distance between grid centers
export const PLATFORM_RADIUS = 1.2; // Hitbox radius

// Enemies
export const SHARK_RADIUS = 1.0;
export const SHARK_PATROL_RANGE = 3;

// Camera
export const CAMERA_OFFSET_Z = 10;
export const CAMERA_OFFSET_Y = 12;
export const CAMERA_LOOK_Z_OFFSET = 2;

// Generation
export const CHUNK_SIZE = 10; // Rows per chunk
export const WORLD_WIDTH = 5; // Platforms wide (odd number keeps 0 centered)

// Visuals
export const WATER_LEVEL = -1.0;
