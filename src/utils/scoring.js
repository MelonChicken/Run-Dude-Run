// src/utils/scoring.js

export function calculateScore(
    play_time,
    hits,
    pickups,
    max_speed,
    max_jump_power,
    health_left) {
    const score =
        (play_time * 2) +
        (pickups * 15) -
        (hits * 10) +
        Math.floor(max_speed * 2) +
        Math.floor(max_jump_power * 1.5) +
        (health_left * 3);

    return Math.max(0, score);  // ensure non-negative score
}
