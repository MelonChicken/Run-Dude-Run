import { supabase } from "./supabaseClient.js";

/**
 * Create a new anonymous player.
 * @param {string} playerId - UUID stored on client.
 * @param {string} nickname - Chosen by the user.
 */
export async function registerPlayer(playerId, nickname) {

    // 1) check if there is an existing name on this session (playerId)
    const { data: existing, error: selectError } = await supabase
        .from("players")
        .select("nickname")
        .eq("id", playerId)
        .single();

    // error catching
    if (selectError && selectError.code !== "PGRST116") {
        console.error("Failed to check existing player:", selectError);
        return { data: null, error: selectError };
    }

    // 2) if there is no player info, register this player
    if (!existing) {
        const { data, error } = await supabase
            .from("players")
            .insert([{ id: playerId, nickname }])
            .select();

        if (error) console.error("Failed to register player:", error);
        return { data, error };
    }

    // 3) if there is already the same name for this player, pass
    if (existing.nickname === nickname) {
        return { data: existing, error: null };
    }

    // 4) if there is already a name for this player, but it is different, update the name as the latest name.
    const { data, error } = await supabase
        .from("players")
        .update({ nickname })
        .eq("id", playerId)
        .select();

    if (error) console.error("Failed to update nickname:", error);
    return { data, error };
}

/**
 * Store a game session result.
 * @param {Object} sessionData - Gameplay result payload.
 */
export async function submitGameSession(sessionData) {
    const playerId = sessionData.player_id;
    const newScore = sessionData.score;

    // 1) Check if existing session exists
    const { data: existing, error: selectError } = await supabase
        .from("game_sessions")
        .select("*")
        .eq("player_id", playerId)
        .single();

    if (selectError && selectError.code !== "PGRST116") {
        console.error("Failed to check existing session:", selectError);
        return { data: null, error: selectError };
    }

    // 2) First session → INSERT
    if (!existing) {
        const { data, error } = await supabase
            .from("game_sessions")
            .insert([sessionData])
            .select();

        if (error) console.error("Failed to insert game session:", error);
        return { data, error };
    }

    // 3) Existing → UPDATE (highest score)
    const updatePayload = {
        play_time: sessionData.play_time,
        hits: sessionData.hits,
        pickups: sessionData.pickups,
        max_speed: sessionData.max_speed,
        max_jump_power: sessionData.max_jump_power,
        health_left: sessionData.health_left,
        score: Math.max(existing.score, newScore)
    };

    const { data, error } = await supabase
        .from("game_sessions")
        .update(updatePayload)
        .eq("player_id", playerId)
        .select();

    if (error) console.error("Failed to update game session:", error);
    return { data, error };
}


/**
 * Fetch top scores from the leaderboard.
 * @param {number} limit - Number of entries to return.
 */
export async function fetchLeaderboard(limit = 20) {
    const { data, error } = await supabase
        .from("game_sessions")
        .select(
            `
      score,
      created_at,
      players (nickname)
      `
        )
        .order("score", { ascending: false })
        .limit(limit);

    if (error) console.error("Failed to fetch leaderboard:", error);
    return { data, error };
}