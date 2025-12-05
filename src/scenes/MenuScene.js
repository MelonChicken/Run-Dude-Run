import Phaser from "phaser";
import { registerPlayer } from "../api/leaderboard.js";
import { getPlayerId, setPlayerInfo } from "../utils/storage.js";
import { NICKNAME_INPUT_STYLE } from "../config";
import { supabase } from "../api/supabaseClient";

export default class MenuScene extends Phaser.Scene {
    constructor() {
        super("MenuScene");
    }

    async create() {

        // -------------------------------------------------
        // 1) Block the canvas from stealing input focus
        // -------------------------------------------------
        this.game.canvas.setAttribute("tabindex", "-1");
        this.game.canvas.blur();


        // ============================
        // Start game unified function
        // ============================
        const startGame = async () => {
            const nickname = nicknameInput.value.trim();
            if (!nickname) {
                alert("Please enter a nickname!");
                return;
            }

            const playerId = getPlayerId();
            setPlayerInfo(playerId, nickname);
            await registerPlayer(playerId, nickname);
            try {
                nicknameInput.remove();
            } catch (_) {}

            this.scene.start("GameScene");
        };


        // --------------------------
        // Title
        // --------------------------
        this.add.text(50, 40, "Run Dude Run!", {
            fontSize: "40px",
            fill: "#ffffff"
        });


        // --------------------------
        // Nickname input DOM
        // --------------------------
        const nicknameInput = document.createElement("input");
        nicknameInput.type = "text";
        nicknameInput.placeholder = "Enter nickname";
        nicknameInput.style.position = "absolute";
        nicknameInput.style.top = NICKNAME_INPUT_STYLE.top;
        nicknameInput.style.left = NICKNAME_INPUT_STYLE.left;
        nicknameInput.style.fontSize = NICKNAME_INPUT_STYLE.fontSize;
        nicknameInput.style.zIndex = NICKNAME_INPUT_STYLE.zIndex;

        document.body.appendChild(nicknameInput);
        nicknameInput.focus();

        // -------------------------------------------------
        // 2) Since the canvas steals focus right after the scene transition,
        //       force refocusing on the input after a short delay
        // -------------------------------------------------
        setTimeout(() => {
            nicknameInput.focus();
            nicknameInput.select();
        }, 150);


        // Enter key starts the game
        nicknameInput.addEventListener("keydown", async (event) => {
            if (event.key === "Enter") {
                event.preventDefault();
                await startGame();
            }
        });


        // -------------------------------------------------
        // 3) Completely block Phaser key input while the input is focused
        // -------------------------------------------------
        window.addEventListener(
            "keydown",
            (e) => {
                if (document.activeElement === nicknameInput) {
                    // Prevent only the WASD keys from being passed to Phaser (if more key are used to operate game, we should put keys into it)
                    if (["w", "a", "s", "d", "W", "A", "S", "D"].includes(e.key)) {
                        e.stopImmediatePropagation();
                    }
                }
            },
            true
        );


        // --------------------------
        // Start button
        // --------------------------
        const startButton = this.add.text(50, 220, "[ Start Game ]", {
            fontSize: "26px",
            fill: "#00ff00"
        }).setInteractive();

        startButton.on("pointerdown", async () => {
            await startGame();
        });


        // --------------------------
        // Leaderboard Section
        // --------------------------
        this.add.text(350, 120, "Leaderboard (Top 10)", {
            fontSize: "24px",
            fill: "#ffffff"
        });

        await this.refreshLeaderboard();

        this.events.on("wake", async () => {
            await this.refreshLeaderboard();
        });
    }



    // ==================================================================
    // Leaderboard
    // ==================================================================

    async refreshLeaderboard(limit = 10) {
        if (this.leaderboardTexts) {
            this.leaderboardTexts.forEach(t => t.destroy());
        }
        this.leaderboardTexts = [];

        const playerId = getPlayerId();

        const { data, error } = await supabase
            .from("game_sessions")
            .select(`
            player_id,
            score,
            players (nickname)
        `)
            .order("score", { ascending: false });

        if (error) {
            console.error("Failed to fetch leaderboard:", error);
            return;
        }

        // Unique players only
        const unique = [];
        const seen = new Set();

        for (const row of data) {
            if (!seen.has(row.player_id)) {
                seen.add(row.player_id);
                unique.push(row);
            }
        }

        // ================================================
        // PERSONAL INFO
        // ================================================
        let myRank = null;
        let myBestScore = null;

        for (let i = 0; i < unique.length; i++) {
            const row = unique[i];
            if (row.player_id === playerId) {
                myRank = i + 1;
                myBestScore = row.score;
                break;
            }
        }
        if (this.personalInfoTexts) {
            this.personalInfoTexts.forEach(t => t.destroy());
        }
        this.personalInfoTexts = [];

        const baseY = 170;

        const bestScoreText = this.add.text(
            350,
            baseY - 80,
            `Your Best: ${myBestScore ?? "-"} points & Your Rank: ${myRank ? "#" + myRank : "-"}/${unique.length}`,
            { fontSize: "20px", fill: "#ffffff" }
        );

        this.personalInfoTexts.push(bestScoreText);


        const top = unique.slice(0, limit);

        const medals = ["🥇", "🥈", "🥉"];

        top.forEach((row, i) => {
            const nickname = row.players?.nickname || "Unknown";
            const score = row.score;

            const rankLabel = i < 3 ? medals[i] : `${i + 1}.`;

            const style = {
                fontSize: "20px",
                fill: "#ffffff"
            };

            const isMe = row.player_id === playerId;
            if (isMe) {
                style.fill = "#ffff00";
            }

            const text = this.add.text(
                350,
                160 + i * 28,
                `${rankLabel} ${nickname} — ${score}`,
                style
            );

            if (isMe) {
                const bg = this.add.rectangle(
                    350 - 10,
                    160 + i * 28 + 10,
                    330,
                    26,
                    0xffff00,
                    0.25
                ).setOrigin(0, 0.5);
                text.setDepth(1);
                this.leaderboardTexts.push(bg);
            }

            this.leaderboardTexts.push(text);
        });
    }
}
