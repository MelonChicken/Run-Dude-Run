import Phaser from "phaser";
import { registerPlayer, fetchLeaderboard } from "../api/leaderboard.js";
import { getPlayerId, setPlayerInfo } from "../utils/storage.js";
import { NICKNAME_INPUT_STYLE } from "../config";

export default class MenuScene extends Phaser.Scene {
    constructor() {
        super("MenuScene");
    }

    async create() {

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

            const result = await registerPlayer(playerId, nickname);
            console.log("REGISTER_PLAYER:", result);

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

        // ENTER KEY SUPPORT
        nicknameInput.addEventListener("keydown", async (event) => {
            if (event.key === "Enter") {
                event.preventDefault();
                await startGame();
            }
        });

        document.body.appendChild(nicknameInput);

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

    async refreshLeaderboard() {
        if (this.leaderboardTexts) {
            this.leaderboardTexts.forEach(t => t.destroy());
        }
        this.leaderboardTexts = [];

        const { data, error } = await fetchLeaderboard(10);

        if (error) {
            console.error("Failed to load leaderboard:", error);
            return;
        }

        data.forEach((row, i) => {
            const nickname = row.players?.nickname || "Unknown";
            const score = row.score;

            const text = this.add.text(
                350,
                160 + i * 24,
                `${i + 1}. ${nickname} — ${score}`,
                { fontSize: "20px", fill: "#ffffff" }
            );

            this.leaderboardTexts.push(text);
        });
    }

}