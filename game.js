const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const overlay = document.getElementById('overlay');
const msgText = document.getElementById('message-text');
// Audio Variables
const bgm = new Audio('bgm.mp3'); 
bgm.loop = true; // Makes the music repeat
bgm.volume = 0.5; // Sets volume to 50%

const jumpSound = new Audio('jump.mp3');
jumpSound.volume = 0.4;

let currentStage = 1;
let isPaused = false;
let gameStarted = false; 
let itemsCollected = 0;
let cameraX = 0;
let zoom = 1; 

// Pity System Variables
let deathsInStage = 0;
const PITY_THRESHOLD = 15;

const player = {
    x: 50, y: 300, width: 35, height: 25,
    dx: 0, dy: 0, speed: 5, sprintSpeed: 8,
    jumpPower: -14,
    grounded: false, flip: false,
    jumpCount: 0,
    coyoteTimer: 0 
};

const gravity = 0.7;
const keys = {};
const levelWidth = 5000; 

const petals = Array.from({ length: 150 }, () => ({
    x: Math.random() * levelWidth,
    y: Math.random() * 400,
    s: Math.random() * 2 + 1,
    speedX: Math.random() * 2 - 1
}));
const clouds = Array.from({ length: 8 }, () => ({
    x: Math.random() * canvas.width,
    y: Math.random() * 150,
    size: Math.random() * 30 + 20,
    speed: Math.random() * 0.2 + 0.1,
    opacity: Math.random() * 0.4 + 0.2
}));

const stars = Array.from({ length: 100 }, () => ({
    x: Math.random() * 800,
    y: Math.random() * 300,
    size: Math.random() * 2,
    blinkSpeed: Math.random() * 0.05 + 0.01
}));
const levelData = {
    1: {
        sky: ['#fdf2f8', '#fbcfe8'], 
        platforms: [
            {x: 0, y: 370, w: 5000, h: 60}, // Continuous floor
            {x: 1700, y: 280, w: 300, h: 15}, 
            {x: 3600, y: 300, w: 300, h: 15}
        ],
        // Denser Barbed Bushes (Spikes)
        spikes: [
            {x: 400, y: 370, w: 100},   
            {x: 1000, y: 370, w: 250}, 
            {x: 1800, y: 370, w: 200},  
            {x: 2500, y: 370, w: 300}, 
            {x: 3500, y: 370, w: 800}   
        ],
        // New Swinging Rose Vines (Air Obstacles)
        vines: [
            { x: 1400, y: 0, len: 250 }, 
            { x: 2200, y: 0, len: 300 },
            { x: 4400, y: 0, len: 280 }
        ],
        items: [
            { x: 1000, y: 140, text: "THE TENDED SOIL\n\nHewwooooo, soooo this is where it all begins! I hope u enjoy the game!!" },
            { x: 2800, y: 320, text: "GARDENER'S LOG\n\nI watched her today. She doesn't wait for the rain; she carries the water herself. There is a rhythm in her effort, a steady pulse that turns even the most stubborn stone into a place where life can take hold." },
            { x: 4200, y: 250, text: "NOTE IN THE TALL GRASS\n\nTo run is easy, but to endure is art. She taught me that the longest path is shortened by a fixed gaze and a heart that refuses to wilt under the weight of the noon heat." }
        ],
        enemies: [
            {x: 600, y: 340, w: 40, h: 30, dx: 3, range: [400, 950]}, 
            {x: 1300, y: 340, w: 40, h: 30, dx: 4, range: [1150, 1500]}
        ],
        goal: {x: 4900, y: 290, w: 60, h: 80}
    },
    2: {
        sky: ['#fae8ff', '#d8b4fe'],
        platforms: [
            {x: 0, y: 370, w: 5000, h: 60},
            {x: 650, y: 300, w: 200, h: 15}, 
            {x: 1000, y: 220, w: 200, h: 15}, 
            {x: 1350, y: 150, w: 200, h: 15}, 
            {x: 3000, y: 250, w: 400, h: 15},
            {x: 3600, y: 200, w: 400, h: 15}
        ],
        spikes: [
            {x: 200, y: 370, w: 100},   
            {x: 800, y: 370, w: 400},   
            {x: 2000, y: 370, w: 300}, 
            {x: 2600, y: 370, w: 400}, 
            {x: 3400, y: 370, w: 600},  
            {x: 4500, y: 370, w: 200}   
        ],
        vines: [
            { x: 900, y: 0, len: 200 }, 
            { x: 1700, y: 0, len: 250 },
            { x: 2800, y: 0, len: 280 }, 
            { x: 4000, y: 0, len: 320 }
        ],
        items: [
            { x: 1400, y: 100, text: "A CRUMPLED LETTER\n\nHer silence is not an absence of sound, but a depth of purpose. Like the mountain, she does not speak of her height; she simply provides the peak for others to reach the stars." },
            { x: 2400, y: 320, text: "STRAY THOUGHTS\n\nI wonder if she knows that her shadow is where the weary rest. She burns like a candle, giving all her light away, yet somehow, she never seems to grow dim." },
            { x: 3200, y: 150, text: "POEM: THE UNBENDING REED\n\nAgainst the gale where others break,\nShe gives as much as she can take.\nA loom of light in threads of grey,\nShe weaves the dawn into the day." }
        ],
        enemies: [
            {x: 1800, y: 340, w: 40, h: 30, dx: 6, range: [1700, 2500]}, 
            {x: 2800, y: 340, w: 40, h: 30, dx: 7, range: [2600, 3400]}
        ],
        goal: {x: 4900, y: 290, w: 60, h: 80}
    },
    3: {
        sky: ['#0f172a', '#1e1b4b'], 
        platforms: [
            {x: 0, y: 370, w: 5000, h: 60},
            {x: 550, y: 300, w: 60, h: 70},   
            {x: 750, y: 240, w: 60, h: 130},  
            {x: 1400, y: 300, w: 200, h: 15, moving: true, range: [1400, 2200], dir: 4, danger: true}, 
            {x: 3200, y: 300, w: 100, h: 15, hidden: true}, 
            {x: 3500, y: 220, w: 100, h: 15, hidden: true},  
            {x: 3800, y: 300, w: 100, h: 15, hidden: true}
        ],
        spikes: [
            {x: 100, y: 370, w: 300},
            {x: 500, y: 370, w: 2500}, // Massive overgrown bramble floor
            {x: 3800, y: 370, w: 500}  
        ],
        vines: [
            { x: 1500, y: 0, len: 150 }, 
            { x: 1800, y: 0, len: 180 }, 
            { x: 2100, y: 0, len: 150 },
            { x: 4200, y: 0, len: 300 }
        ],
        items: [
            { x: 2100, y: 200,text: "MOON\n\n" +
        "A quiet strength beneath the velvet sky,\n" +
        "With starlight dancing in her brilliant eye.\n" +
        "She is the peace that settles on the soul,\n" +
        "The gentle touch that makes a spirit whole,\n" +
        "A beauty that the years cannot defy.\n\n" +
        
        "So smart and sharp, a beacon in the deep,\n" +
        "A sacred promise that she’ll always keep.\n" +
        "She moves with elegance and silent power,\n" +
        "Like petals opening at the midnight hour,\n" +
        "While all the weary world is fast asleep.\n\n" +
        
        "Her kindness is a river, wide and true,\n" +
        "Refreshing everything it passes through.\n" +
        "She is so cute in every laugh she shares,\n" +
        "Answering my heavy heart with silent prayers,\n" +
        "In everything she chooses now to do.\n\n" +
        
        "I look to her when searching for my way,\n" +
        "The moon that turns the night-time into day.\n" +
        "My inspiration and my constant friend,\n" +
        "A love on which I know I can depend,\n" +
        "More beautiful than any words can say." },

            { x: 3850, y: 250, text:"SUN\n\n" +
        "She rises with a steady, golden light,\n" +
        "A brilliant mind that puts the dark to flight.\n" +
        "With every word, she carves a path so clear,\n" +
        "Dispelling every shadow, every fear,\n" +
        "The strongest heart I’ve known in day or night.\n\n" +
        
        "A source of warmth that never starts to fade,\n" +
        "In every kindness that her hands have made.\n" +
        "She builds a world where flowers dare to bloom,\n" +
        "Providing light in every quiet room,\n" +
        "A master of the light and of the shade.\n\n" +
        
        "And oh, the way she makes me start to smile,\n" +
        "Her cute and clever grace, her gentle style.\n" +
        "She leads with wisdom, sharp and ever keen,\n" +
        "The bravest soul that I have ever seen,\n" +
        "Walking beside me through the longest mile.\n\n" +
        
        "Inspiration flows from where she stands,\n" +
        "With healing power in her steady hands.\n" +
        "She is the fire that keeps the winter cold,\n" +
        "A story of a spirit brave and bold,\n" +
        "The sun that shines across the furthest lands."
        }
        ],
        enemies: [
            {x: 2600, y: 340, w: 40, h: 30, dx: 10, range: [2500, 3100]}
        ],
        goal: {x: 4900, y: 290, w: 60, h: 80, endText: "Waaaaahhhh, You finished the game!!! Did you enjoy it? uhhh well did it make you angry?...uhh whahahhhahah do you love it?...I exerted a lot of effort creating this...I thought that maybe instead of just giving you something...what if I create something instead....to you know...show you how much I appreciate your presence...hehe But this is not just my gift for yah...Really." }
    }
};

function startGame() {
    gameStarted = true;
    document.getElementById('main-menu').style.display = 'none';
    
    // Start background music
    bgm.play().catch(error => {
        console.log("Audio play failed. User interaction might be required:", error);
    });
}

function drawSky(current) {
    // 1. Background Gradient
    let grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    grad.addColorStop(0, current.sky[0]); 
    grad.addColorStop(1, current.sky[1]);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 2. Stars (Only in Stage 3 - Night)
    if (currentStage === 3) {
        ctx.fillStyle = "white";
        stars.forEach(s => {
            let opacity = (Math.sin(Date.now() * s.blinkSpeed) + 1) / 2;
            ctx.globalAlpha = opacity;
            ctx.beginPath();
            ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
            ctx.fill();
        });
        ctx.globalAlpha = 1;
    }

    // 3. Celestial Body
    drawCelestialBody(currentStage === 3 ? '#fffef0' : '#FFD700');

    // 4. Moving Clouds
    clouds.forEach(c => {
        // Move clouds slowly
        c.x += c.speed;
        if (c.x > canvas.width + 100) c.x = -100; // Reset when off-screen

        drawCloud(c.x, c.y, c.size, c.opacity);
    });
}

function drawCloud(x, y, size, opacity) {
    ctx.save();
    ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
    
    // Draw a "cluster" of circles for one cloud
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);             // Center
    ctx.arc(x - size * 0.6, y + size * 0.2, size * 0.6, 0, Math.PI * 2); // Left
    ctx.arc(x + size * 0.6, y + size * 0.2, size * 0.6, 0, Math.PI * 2); // Right
    ctx.arc(x + size * 0.2, y - size * 0.4, size * 0.5, 0, Math.PI * 2); // Top
    ctx.fill();
    ctx.restore();
}

function drawCelestialBody(color) {
    ctx.save();
    // Position sun/moon relative to the screen, not the world
    let x = canvas.width * 0.85;
    let y = 60;
    
    // Outer glow
    let glow = ctx.createRadialGradient(x, y, 5, x, y, 60);
    glow.addColorStop(0, color);
    glow.addColorStop(1, 'transparent');
    
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(x, y, 60, 0, Math.PI * 2);
    ctx.fill();

    // Core
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, 25, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
}

function drawMountains() {
    ctx.fillStyle = currentStage === 3 ? 'rgba(15, 23, 42, 0.4)' : 'rgba(251, 113, 133, 0.2)';
    for(let i = 0; i < 6; i++) {
        let x = (i * 1000) - (cameraX * 0.3) % 1000;
        ctx.beginPath(); ctx.moveTo(x, 400); ctx.lineTo(x + 500, 100); ctx.lineTo(x + 1000, 400); ctx.fill();
    }
}
function drawVine(x, y, length) {
    const time = Date.now() * 0.002;
    const angle = Math.sin(time + x * 0.01) * 1.1; 
    
    const endX = x + Math.sin(angle) * length;
    const endY = y + Math.cos(angle) * length;
    const ctrlX = x + Math.sin(angle * 0.5) * (length * 0.5);
    const ctrlY = y + Math.cos(angle * 0.5) * (length * 0.5);

    // 1. Draw Vine Stem
    ctx.shadowBlur = 10;
    ctx.shadowColor = '#022c22';
    ctx.strokeStyle = '#065f46';
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.quadraticCurveTo(ctrlX, ctrlY, endX, endY);
    ctx.stroke();
    ctx.shadowBlur = 0;

    const collisionPoints = [];
    const steps = 12; // Number of segments

    for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        // Get point on curve
        const tx = (1 - t) * (1 - t) * x + 2 * (1 - t) * t * ctrlX + t * t * endX;
        const ty = (1 - t) * (1 - t) * y + 2 * (1 - t) * t * ctrlY + t * t * endY;
        
        collisionPoints.push({x: tx, y: ty});

        // 2. Draw Spikes (Thorns)
        if (i > 0 && i < steps) {
            // Calculate the angle of the vine at this specific point to point the spike out
            const prevT = (i - 0.1) / steps;
            const px = (1 - prevT) * (1 - prevT) * x + 2 * (1 - prevT) * prevT * ctrlX + prevT * prevT * endX;
            const py = (1 - prevT) * (1 - prevT) * y + 2 * (1 - prevT) * prevT * ctrlY + prevT * prevT * endY;
            
            const vineAngle = Math.atan2(ty - py, tx - px);
            const spikeSide = (i % 2 === 0) ? 1 : -1; // Alternate sides
            const spikeLen = 12;

            ctx.fillStyle = '#022c22';
            ctx.beginPath();
            ctx.moveTo(tx, ty);
            // Point the spike perpendicular to the vine's direction
            ctx.lineTo(
                tx + Math.cos(vineAngle + Math.PI/2 * spikeSide) * spikeLen,
                ty + Math.sin(vineAngle + Math.PI/2 * spikeSide) * spikeLen
            );
            ctx.lineTo(tx + Math.cos(vineAngle) * 5, ty + Math.sin(vineAngle) * 5);
            ctx.fill();
        }
    }

    // 3. Pulsing Rose Bud
    const pulse = Math.sin(Date.now() * 0.01) * 3;
    ctx.fillStyle = '#9f1239'; 
    ctx.beginPath();
    ctx.arc(endX, endY, 15 + pulse, 0, Math.PI * 2);
    ctx.fill();
    
    return collisionPoints;
}
function drawBarbedBush(x, y, width) {
    // Add a dark patch under the bush
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.beginPath();
    ctx.ellipse(x + width/2, y, width/2, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#2d3748';
    ctx.lineWidth = 2;

    for (let i = 0; i < width; i += 12) {
        const seed = x + i;
        const time = Date.now() * 0.002;
        const bushHeight = 20 + Math.abs(Math.sin(seed)) * 20;
        const sway = Math.sin(time + seed) * 5;

        ctx.beginPath();
        ctx.moveTo(x + i, y);
        ctx.quadraticCurveTo(x + i + sway, y - bushHeight / 2, x + i + (sway * 1.5), y - bushHeight);
        ctx.stroke();

        // Adding "thorny" detail
        for (let j = 1; j <= 3; j++) {
            const bY = y - (bushHeight * (j / 4));
            const bX = x + i + (sway * (j / 4));
            ctx.beginPath();
            ctx.moveTo(bX, bY);
            ctx.lineTo(bX + (j % 2 === 0 ? 5 : -5), bY - 3);
            ctx.stroke();
        }
    }
}

function drawSakuraTree(x, y) {
    // Use the x position as a seed so trees don't "randomize" every frame
    const seed = x;
    const time = Date.now() * 0.001;
    const sway = Math.sin(time + seed * 0.5) * 5; // Gentle wind sway

    // 1. Draw Trunk with slight taper
    ctx.fillStyle = '#4b2c20'; // Dark brown
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + 15, y);
    ctx.lineTo(x + 10 + (sway * 0.2), y - 70); // Trunk moves slightly with wind
    ctx.lineTo(x + 2 + (sway * 0.2), y - 70);
    ctx.closePath();
    ctx.fill();

    // 2. Draw Blossom Clusters
    // We define relative positions for "puffs" of petals
    const clusters = [
        { rx: 5, ry: -75, size: 45 },
        { rx: -25, ry: -55, size: 35 },
        { rx: 35, ry: -50, size: 38 },
        { rx: 5, ry: -40, size: 30 }
    ];

    clusters.forEach((c, index) => {
        const clusterSwayX = Math.sin(time + seed + index) * 3;
        const clusterSwayY = Math.cos(time + seed + index) * 2;
        
        const cx = x + c.rx + clusterSwayX;
        const cy = y + c.ry + clusterSwayY;

        // Create a radial gradient for each cluster to give it depth
        let grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, c.size);
        grad.addColorStop(0, '#fbcfe8'); // Lighter center
        grad.addColorStop(0.6, '#f9a8d4'); // Classic Pink
        grad.addColorStop(1, '#f472b6'); // Darker edges

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(cx, cy, c.size, 0, Math.PI * 2);
        ctx.fill();

        // Optional: Add a few tiny "highlight" petals inside the cluster
        ctx.fillStyle = '#ffffff';
        ctx.globalAlpha = 0.3;
        ctx.beginPath();
        ctx.arc(cx - c.size/3, cy - c.size/3, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1.0;
    });
}

function drawCat(x, y, flip) {
    ctx.save();
    ctx.translate(x + 17, y + 12);
    if (flip) ctx.scale(-1, 1);
    
    // Jump Aura
    if (player.jumpCount > 0) {
        ctx.shadowBlur = 20;
        ctx.shadowColor = player.jumpCount === 1 ? '#ffffff' : '#fdf2f8';
    }

    // Body (Softer, rounder white/pinkish cat)
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.roundRect(-17, -10, 34, 22, 15);
    ctx.fill();

    // Ears (Rounded triangles with pink centers)
    ctx.fillStyle = '#ffffff';
    // Left Ear
    ctx.beginPath();
    ctx.moveTo(-14, -10);
    ctx.quadraticCurveTo(-12, -22, -6, -10);
    ctx.fill();
    // Right Ear
    ctx.beginPath();
    ctx.moveTo(6, -10);
    ctx.quadraticCurveTo(12, -22, 14, -10);
    ctx.fill();
    
    // Pink inner ears
    ctx.fillStyle = '#fce7f3';
    ctx.beginPath();
    ctx.moveTo(-12, -10); ctx.lineTo(-10, -17); ctx.lineTo(-8, -10);
    ctx.moveTo(8, -10); ctx.lineTo(10, -17); ctx.lineTo(12, -10);
    ctx.fill();

    // Fluffy Tail (Animated wave)
    ctx.lineWidth = 6;
    ctx.strokeStyle = '#ffffff';
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-15, 5);
    ctx.quadraticCurveTo(-30, Math.sin(Date.now()/200)*10, -35, -5);
    ctx.stroke();

    // Eyes (Big, low-set, with a "shine" dot)
    let isBlinking = Math.sin(Date.now() / 500) > 0.95;
    ctx.fillStyle = '#4b2c20'; // Dark chocolate eyes
    if (!isBlinking) {
        // Left Eye
        ctx.beginPath(); ctx.arc(6, -2, 3.5, 0, Math.PI * 2); ctx.fill();
        // Right Eye
        ctx.beginPath(); ctx.arc(14, -2, 3.5, 0, Math.PI * 2); ctx.fill();
        // Shine
        ctx.fillStyle = 'white';
        ctx.beginPath(); ctx.arc(5, -3, 1.2, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(13, -3, 1.2, 0, Math.PI * 2); ctx.fill();
    } else {
        // Blink lines
        ctx.strokeStyle = '#4b2c20';
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(4, -2); ctx.lineTo(8, -2);
        ctx.moveTo(12, -2); ctx.lineTo(16, -2);
        ctx.stroke();
    }

    // Blush (Pink cheeks)
    ctx.fillStyle = 'rgba(251, 113, 133, 0.4)';
    ctx.beginPath(); ctx.arc(4, 3, 3, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(16, 3, 3, 0, Math.PI * 2); ctx.fill();

    ctx.restore();
}
/**
 * Draws a dog that faces the direction of travel.
 * @param {number} x - Horizontal position
 * @param {number} y - Vertical position
 * @param {number} direction - 1 for Right, -1 for Left
 */
function drawDog(x, y, direction = 1) {
    ctx.save();

    // Move to position and flip based on direction
    ctx.translate(x, y);
    ctx.scale(direction, 1);

    // Center the dog so it flips around its middle
    // (Moving drawing 20px left and 10px up)
    const offsetX = -20;
    const offsetY = -10;
    const bounce = Math.sin(Date.now() / 200) * 2;
    
    // Body
    ctx.fillStyle = '#d97706';
    ctx.beginPath();
    ctx.roundRect(offsetX, offsetY + bounce, 40, 25, 10);
    ctx.fill();

    // Head
    ctx.beginPath();
    ctx.roundRect(offsetX + 25, offsetY - 8 + bounce, 22, 22, 8);
    ctx.fill();

    // Floppy Ear
    ctx.fillStyle = '#92400e'; 
    ctx.beginPath();
    ctx.roundRect(offsetX + 22, offsetY - 8 + (bounce * 1.5), 10, 18, 5);
    ctx.fill();

    // Big Puppy Eyes
    ctx.fillStyle = '#27272a';
    ctx.beginPath(); ctx.arc(offsetX + 35, offsetY + 2 + bounce, 2.5, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(offsetX + 43, offsetY + 2 + bounce, 2.5, 0, Math.PI * 2); ctx.fill();

    // Tiny Nose
    ctx.fillStyle = 'black';
    ctx.beginPath(); ctx.arc(offsetX + 47, offsetY + 6 + bounce, 2, 0, Math.PI * 2); ctx.fill();

    // Wagging Tail
    ctx.strokeStyle = '#d97706';
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(offsetX, offsetY + 15 + bounce);
    ctx.lineTo(offsetX - 10, offsetY + 10 + (Math.sin(Date.now() / 100) * 10));
    ctx.stroke();

    ctx.restore();
}

function drawTorii(x, y) {
    ctx.shadowBlur = 20; ctx.shadowColor = 'red'; ctx.fillStyle = '#b91c1c';
    ctx.fillRect(x, y, 12, 85); ctx.fillRect(x + 50, y, 12, 85); 
    ctx.fillRect(x - 15, y, 90, 18); ctx.fillRect(x - 5, y + 25, 72, 10); ctx.shadowBlur = 0;
}

window.addEventListener('keydown', e => { 
    if (e.code === 'ArrowUp' || e.code === 'Space') {
        const canTripleJump = deathsInStage >= PITY_THRESHOLD;
        
        // --- JUMP LOGIC WITH SOUNDS ---
        if (player.grounded || player.coyoteTimer > 0) {
            // First Jump
            player.dy = player.jumpPower; 
            player.grounded = false; 
            player.jumpCount = 1; 
            player.coyoteTimer = 0;
            
            playJumpSound(); // Trigger sound
            
        } else if (player.jumpCount === 1) {
            // Double Jump
            player.dy = player.jumpPower * 0.85; 
            player.jumpCount = 2;
            
            playJumpSound(); // Trigger sound
            
        } else if (player.jumpCount === 2 && canTripleJump) {
            // Triple Jump (Pity System)
            player.dy = player.jumpPower * 0.75; 
            player.jumpCount = 3; 
            
            playJumpSound(); // Trigger sound
        }
    }
    
    keys[e.code] = true; 
    if(e.code === 'ArrowRight') player.flip = false;
    if(e.code === 'ArrowLeft') player.flip = true;
});

// Helper function to handle jump sound overlapping
function playJumpSound() {
    if (typeof jumpSound !== 'undefined') {
        jumpSound.currentTime = 0; // Reset to start so rapid jumps overlap correctly
        jumpSound.play().catch(() => {}); // Catch prevents errors if browser blocks audio
    }
}
window.addEventListener('keyup', e => keys[e.code] = false);

function showText(text) { 
    isPaused = true; 
    msgText.innerText = text; 
    msgText.scrollTop = 0; 
    overlay.style.display = 'block'; 
}

window.resumeGame = () => {
    isPaused = false;
    overlay.style.display = 'none';

    // Check if we are at the end of Stage 3
    const current = levelData[currentStage];
    if (currentStage === 3 && player.x > current.goal.x - 100) {
        // This is what "redirects" her to the final two gifts
        document.getElementById('gift-overlay').style.display = 'block';
        isPaused = true; 
    }
};

function resetLevel() { 
    player.x = 50; player.y = 300; player.dx = 0; player.dy = 0; player.jumpCount = 0; 
    deathsInStage++;
}

function update() {
    if (!gameStarted || isPaused) return;
    let moveSpeed = keys['ShiftLeft'] || keys['ShiftRight'] ? player.sprintSpeed : player.speed;
    if (currentStage === 3) moveSpeed -= 0.8;
    if (keys['ArrowRight']) player.dx = moveSpeed;
    else if (keys['ArrowLeft']) player.dx = -moveSpeed;
    else player.dx = 0;
    player.dy += gravity; player.x += player.dx; player.y += player.dy;
    if (player.y > canvas.height) resetLevel();
    cameraX = Math.max(0, Math.min(player.x - (canvas.width / 2) / zoom, levelWidth - canvas.width / zoom));
    const current = levelData[currentStage];
     // Put this inside update(), near your enemy/spike collision checks
   if (current.vines) {
    current.vines.forEach(v => {
        if (v.hitbox) {
            // v.hitbox is now an array of points
            v.hitbox.forEach(point => {
                let dx = (player.x + player.width / 2) - point.x;
                let dy = (player.y + player.height / 2) - point.y;
                let distance = Math.sqrt(dx * dx + dy * dy);

                // If cat is near ANY part of the vine
                if (distance < 22) { 
                    resetLevel();
                }
            });
        }
    });
}
    let wasGrounded = player.grounded;
    player.grounded = false;
    if (wasGrounded) player.coyoteTimer = 6; 
    if (player.coyoteTimer > 0) player.coyoteTimer--;
    current.platforms.forEach(p => {
        if (p.moving) { p.x += p.dir; if (p.x > p.range[1] || p.x < p.range[0]) p.dir *= -1; }
        if (p.hidden) { let dist = Math.abs((p.x + p.w/2) - player.x); p.alpha = dist < 220 ? 1 : 0; }
        if (player.x < p.x + p.w && player.x + player.width > p.x &&
            player.y + player.height > p.y && player.y + player.height < p.y + p.h + 10 && player.dy >= 0) {
            if (p.hidden && p.alpha === 0) return;
            player.y = p.y - player.height; player.dy = 0; player.grounded = true; player.jumpCount = 0;
            if (p.moving) player.x += p.dir;
        }
    });
    current.spikes.forEach(s => { if (player.x < s.x + s.w && player.x + player.width > s.x && player.y + player.height > s.y - 15 && player.y < s.y) resetLevel(); });
    current.enemies.forEach(en => {
        en.x += en.dx; if (en.x > en.range[1] || en.x < en.range[0]) en.dx *= -1;
        if (player.x < en.x + en.w && player.x + player.width > en.x && player.y < en.y + en.h && player.y + player.height > en.y) resetLevel();
    });
    current.items.forEach((item, i) => {
        if (player.x < item.x + 30 && player.x + player.width > item.x && player.y < item.y + 30 && player.y + player.height > item.y) {
            showText(item.text); current.items.splice(i, 1); itemsCollected++;
        }
    });
    if (player.x < current.goal.x + current.goal.w && player.x + player.width > current.goal.x && player.y < current.goal.y + current.goal.h) {
        if (currentStage < 3) { currentStage++; deathsInStage = 0; resetLevel(); } else showText(current.goal.endText);
    }
    petals.forEach(p => { p.y += p.s; p.x += Math.sin(p.y/50) * 2; if (p.y > 400) p.y = -20; });
}

function draw() {
    const current = levelData[currentStage];
    drawSky(current); drawMountains();
    ctx.save(); ctx.scale(zoom, zoom); ctx.translate(-cameraX, 0);

    if (current.vines) {
        current.vines.forEach(v => {
            // We store the returned hitbox from drawVine for the update function to use
            v.hitbox = drawVine(v.x, v.y, v.len);
        });
    }

    for(let i = 0; i < levelWidth; i += 700) {
        ctx.globalAlpha = currentStage === 3 ? 0.4 : 1;
        drawSakuraTree(i + 300, 370);
        ctx.globalAlpha = 1;
    }
    current.platforms.forEach(p => { 
        ctx.globalAlpha = p.hidden ? (p.alpha || 0) : 1;
        ctx.fillStyle = p.danger ? '#e11d48' : '#fda4af'; 
        ctx.fillRect(p.x, p.y, p.w, p.h); 
        ctx.fillStyle = p.danger ? '#9f1239' : '#fb7185'; 
        ctx.fillRect(p.x, p.y, p.w, 8); 
        ctx.globalAlpha = 1;
    });
    // We change drawSpikes to drawBarbedBush to match your new function
    if (current.spikes) current.spikes.forEach(s => drawBarbedBush(s.x, s.y, s.w));
    current.items.forEach(item => { ctx.fillStyle = '#fffbeb'; ctx.fillRect(item.x, item.y, 25, 30); ctx.strokeStyle = '#d97706'; ctx.strokeRect(item.x, item.y, 25, 30); });
    drawTorii(current.goal.x, current.goal.y); 
    current.enemies.forEach(en => {
    // Determine enemy direction based on their dx
    const enDir = en.dx >= 0 ? 1 : -1;
    drawDog(en.x, en.y, enDir);
}); 
    drawCat(player.x, player.y, player.flip);
    ctx.restore();
    if (currentStage === 3) {
        let grad = ctx.createRadialGradient(canvas.width/2, canvas.height/2, 100, canvas.width/2, canvas.height/2, 500);
        grad.addColorStop(0, 'rgba(0,0,0,0)'); grad.addColorStop(1, 'rgba(15, 23, 42, 0.7)');
        ctx.fillStyle = grad; ctx.fillRect(0,0, canvas.width, canvas.height);
    }
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)'; petals.forEach(p => ctx.fillRect((p.x - cameraX * zoom) % canvas.width, p.y, 4, 4));
    ctx.fillStyle = '#be123c'; ctx.font = "bold 22px 'Georgia'"; 
    ctx.fillText(`Stage: ${currentStage} 🌸 Petals: ${itemsCollected}`, 20, 40);
    if (deathsInStage >= PITY_THRESHOLD) {
        ctx.fillStyle = '#e11d48'; ctx.font = "italic 16px 'Georgia'";
        ctx.fillText("The wind carries you... (Triple Jump Unlocked!)", 20, 70);
    }
    update(); requestAnimationFrame(draw);
}

window.openGift = (type) => {
    const giftContent = document.getElementById('gift-content');
    const giftText = document.getElementById('gift-text');
    const giftTitle = document.getElementById('gift-title-header');
    
    // Clear old animation petals
    const oldPetals = document.querySelectorAll('.gift-petal');
    oldPetals.forEach(p => p.remove());

    // Create 20 falling petals for the background effect
    for(let i = 0; i < 20; i++) {
        const p = document.createElement('div');
        p.className = 'gift-petal';
        p.style.left = Math.random() * 100 + 'vw';
        p.style.width = (Math.random() * 10 + 5) + 'px';
        p.style.height = p.style.width;
        p.style.animationDuration = (Math.random() * 3 + 4) + 's';
        p.style.animationDelay = (Math.random() * 5) + 's';
        p.style.opacity = Math.random();
        giftContent.appendChild(p);
    }

   window.openGift = (type) => {
    const giftContent = document.getElementById('gift-content');
    const giftText = document.getElementById('gift-text');
    const giftTitle = document.getElementById('gift-title-header');
    
    // 1. Show the content layer
    giftContent.style.display = 'block';

    if (type === 'wisdom') {
        giftTitle.innerText = "THE GAME";
        giftText.innerText = "The game was actually created based on you, or how I view u atleast. \n\n" + 
            "A hardworking woman, who always does her best, a woman who never gives up no matter how hard life gets, even if you are tired, you just keep on standing, u just continue as if you are not tired at all...you are always radianting, you are always smiling, Remember that time when u asked me a question? (what keeps you going?) and I said you....I wasnt kidding...you see you inspires me to keep on moving...even if i am tired...I was like 'how can i just chill..and do nothing...knowing that you are doing your best...with you constantly juggling between work and school...It made me want to become a better person..to help you...to make your life a bit easier.\n\n" +
            "You are My Sun...you always makes me smile...and makes me forget the problems of my life...Let me be Your Moon...the one that guides and helps you when life gets dark and difficult.";
   
    } else {
        giftTitle.innerText = "THE ONE GIFT";
        // Use innerHTML so the link is clickable!
        giftText.innerHTML = `I want to give you more... not just this game.
        
        I want to give you time, comfort and of course a significant amount of rest... thats why... I give you dis...
        
        <a href="https://drive.google.com/drive/folders/1DLlxYAOe9cc8TzXsz_zEzglQyk9WyHWO?usp=sharing" target="_blank" style="color: #fb7185; text-decoration: underline; font-weight: bold;">[ Click Here to Open Your Gift Folder ]</a>`;
    }
    document.getElementById('gift-scroll-area').scrollTop = 0;
};

window.closeGift = () => {
    // 2. Hide the content but KEEP the gift-overlay visible
    document.getElementById('gift-content').style.display = 'none';
};
}
draw()