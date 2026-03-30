// @ts-check
import { k } from "./kaplay.js";
k.loadFont("jetbrains", "/fonts/jetbrains.ttf", {
    outline: {
        width: 6,
        color: k.rgb(8, 8, 8)
    },
});
k.loadSprite("bg4", "/sprites/bg4.png");
k.loadSprite("bg2", "/sprites/bg2.png");
k.loadSound("code_sound", "/sounds/code_sound.mp3");
k.loadSound("wrong_typing", "/sounds/wrong typing.mp3");
k.loadSprite("WPM", "/sprites/WPM.png");
k.loadSprite("icon_01", "/sprites/icon_01.png");
k.loadSprite("icon_02", "/sprites/icon_02.png");
k.loadSprite("icon_03", "/sprites/icon_03.png");
k.loadSprite("icon_04", "/sprites/icon_04.png");
k.loadSprite("icon_05", "/sprites/icon_05.png");
k.loadSprite("BG_WPM_IN_GAME", "/sprites/BG_WPM_IN_GAME.png");
k.loadSprite("BG_TIME_IN_GAME", "/sprites/BG_TIME_IN_GAME.png");
k.loadSprite("SilverDevs", "/sprites/SilverDev_logo.png");
k.loadSprite("arrow_yellow", "/sprites/arrow_yellow.png");
k.loadMusic("videogame", "/sounds/videogame.mp3");
k.loadMusic("endgame", "/sounds/endgame.mp3");