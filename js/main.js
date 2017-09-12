/*
 * Main entry point to the game. Initializes the game and shows
 * the initial splash screen.
 * 
 * Contains main loop that uses JavaScript's requestAnimationFrame
 * method. Also contains all draw* methods that paint buttons and game
 * entities to the screen.
 * 
 * @author Martin Hentschel, @hemasail
 */

var currentScreen = null;

function createGame() {
    // DOM elements
    var canvas = document.getElementById("c");
    var context = canvas.getContext("2d");
    resizeCanvas(canvas);

    // movable bodies
    var state = new State();
    state.init();

    // return object that contains all information
    return {
        canvas: canvas,
        context: context,
        state: state,
        camera: new Vector(-CANVAS_WIDTH, 0),
        isRunning: false,
        lastScore: 0,
        lastTotalScore: 0,
        totalScore: 0,
        multiplier: 1,
        clickCount: 0,
        lastClickCount: 0,
        lastClickTime: 0
    };
}

/*
 * Main loop. Initializes examples, advances physics, and updates graphics.
 */
window.onload = function () {
    // initialize game
    var game = createGame();
    currentScreen = new SplashScreen(game);

    // add listeners
    window.addEventListener("resize", function (e) {
        resizeCanvasInGame(game);
    });
    game.canvas.addEventListener("click", function (e) {
        game.clickCount++;
        currentScreen = currentScreen.onClick(toClickVector(game, e));
        if (!game.isRunning) {
            currentScreen.draw();
        }
    });
    game.canvas.addEventListener("mousedown", function (e) {
        currentScreen.onMouseDown(toClickVector(game, e));
        if (!game.isRunning) {
            currentScreen.draw();
        }
    });
    game.canvas.addEventListener("mouseup", function (e) {
        currentScreen.onMouseUp(toClickVector(game, e));
        if (!game.isRunning) {
            currentScreen.draw();
        }
    });

    // splash screen
    currentScreen.draw();
}

function runGame(game) {
    game.isRunning = true;

    // fixed timestep to advance physics
    var fixedTimestep = 10; // in ms
    
    // step function is called every time the browser refreshes the UI
    var start = 0;
    var previous = 0;
    var remainder = 0;
    var lastRepeat1 = 0;
    var lastRepeat2 = 0;
    function step(now) {
        if (start === 0) start = now;
        if (previous === 0) previous = now;
        var timestep = now - previous + remainder;

        // move physics forward in fixed intervals
        while (timestep > fixedTimestep) {
            // advance state of all examples
            game.state.advance(fixedTimestep / 1000);
            timestep -= fixedTimestep;
        }
        previous = now;
        remainder = timestep;

        // draw game
        drawGame(game, true, false);

        // end game if no click within 10 seconds
        if (game.lastClickTime == 0) {
            game.lastClickTime = now;
        }
        if (game.clickCount == game.lastClickCount) {
            if (now - game.lastClickTime > 10000) {
                endGame(game)
            }
        }
        else {
            game.lastClickCount = game.clickCount;
            game.lastClickTime = now;
        }

        // end game if fox ate chicken
        if (game.state.foxAteChicken) {
            endGame(game);
        }

        // request next animation frame from browser
        if (game.isRunning) {
            window.requestAnimationFrame(step);
        }
    }

    window.requestAnimationFrame(step);
}

function endGame(game) {
    game.isRunning = false;
    if (game.state.eatenGrains > game.lastScore) {
        game.lastTotalScore = game.totalScore;
        game.totalScore += game.multiplier * game.state.eatenGrains;
        currentScreen = new EndOfRoundScreen(game);
    }
    else {
        game.lastTotalScore = game.totalScore;
        game.totalScore += game.state.eatenGrains;
        currentScreen = new GameOverScreen(game);
    }
    currentScreen.draw();
}

function drawGame(game, includeChickenFox, lightColors) {
    // clear canvas
    game.context.fillStyle = BACKGROUND;
    game.context.fillRect(0, 0, game.canvas.width, game.canvas.height);

    // update camera
    game.camera.x = Math.max(
        game.camera.x,
        game.state.chicken.origin.x + CANVAS_WIDTH * 0.1);

    // update invisible wall
    game.state.updateInvisibleWall(game.camera);

    // udpate trees if necessary
    game.state.updateTrees(game.camera);

    var colors = (lightColors) ? LIGHT_COLORS : COLORS;

    // draw bodies, sorted by y coordinate desc
    var t = 0;
    var g = 0;
    var c = !includeChickenFox;
    var f = !includeChickenFox;
    while (t < game.state.trees.length 
            && g < game.state.grains.length) {
        if (!c
            && game.state.chicken.origin.y > game.state.trees[t].origin.y
            && game.state.chicken.origin.y > game.state.grains[g].origin.y) {
            drawChicken(game, game.state.chicken, colors);
            c = true;
        }
        if (!f
            && game.state.fox.origin.y > game.state.trees[t].origin.y
            && game.state.fox.origin.y > game.state.grains[g].origin.y) {
            drawFox(game, game.state.fox, colors);
            f = true;
        }
        if (game.state.trees[t].origin.y >
                game.state.grains[g].origin.y) {
            drawTree(game, game.state.trees[t++], colors);
        }
        else {
            drawGrain(game, game.state.grains[g++], colors);
        }
    }
    while (t < game.state.trees.length) {
        if (!c
            && game.state.chicken.origin.y > game.state.trees[t].origin.y) {
            drawChicken(game, game.state.chicken, colors);
            c = true;
        }
        if (!f
            && game.state.fox.origin.y > game.state.trees[t].origin.y) {
            drawFox(game, game.state.fox, colors);
            f = true;
        }
        drawTree(game, game.state.trees[t++], colors);
    }
    while (g < game.state.grains.length) {
        if (!c
            && game.state.chicken.origin.y > game.state.grains[g].origin.y) {
            drawChicken(game, game.state.chicken, colors);
            c = true;
        }
        if (!f
            && game.state.fox.origin.y > game.state.grains[g].origin.y) {
            drawFox(game, game.state.fox, colors);
            f = true;
        }
        drawGrain(game, game.state.grains[g++], colors);
    }
    if (!c) {
        drawChicken(game, game.state.chicken, colors);
    }
    if (!f) {
        drawFox(game, game.state.fox, colors);
    }

    drawTarget(game, game.state.chicken);
    
    // draw text: number of grains
    if (includeChickenFox) {
        game.context.fillStyle = FONT_COLOR;
        game.context.font = game.canvas.height * TEXT_HEIGHT + FONT;
        game.context.textAlign = "right";
        var text = "" + game.state.eatenGrains; 
        if (game.multiplier > 1) {
            text += " (" + game.lastScore + ")";
        }
        game.context.fillText(
            text,
            tx(game, SCORE_X + game.camera.x),
            ty(game, SCORE_Y));
    }
}

function drawChicken(game, body, colors) {
    var context = game.context;

    // light full body
    context.fillStyle = colors[6];
    context.beginPath();
    context.moveTo(tx(game, body.cx[0]), ty(game, body.cy[0]));
    context.lineTo(tx(game, body.cx[1]), ty(game, body.cy[1]));
    context.lineTo(tx(game, body.cx[2]), ty(game, body.cy[2]));
    context.lineTo(tx(game, body.cx[3]), ty(game, body.cy[3]));
    context.closePath();
    context.fill();

    // p1 is half way between upper right and lower right
    var p1x = body.cx[0] + (body.cx[3] - body.cx[0]) * 0.5;
    var p1y = body.cy[0] + (body.cy[3] - body.cy[0]) * 0.5;
    // p2 is half way between upper left and lower left
    var p2x = body.cx[1] + (body.cx[2] - body.cx[1]) * 0.5;
    var p2y = body.cy[1] + (body.cy[2] - body.cy[1]) * 0.5;
    // p3 is half way between lower left and lower right
    var p3x = body.cx[2] + (body.cx[3] - body.cx[2]) * 0.5;
    var p3y = body.cy[2] + (body.cy[3] - body.cy[2]) * 0.5;

    // pecker
    context.fillStyle = colors[5];
    context.beginPath();
    context.moveTo(tx(game, p1x), ty(game, p1y));
    context.lineTo(tx(game, p2x), ty(game, p2y));
    context.lineTo(tx(game, p3x), ty(game, p3y));
    context.closePath();
    context.fill();

    context.fillStyle = colors[8];
    context.beginPath();
    context.moveTo(tx(game, p1x), ty(game, p1y));
    context.lineTo(tx(game, body.origin.x), ty(game, body.origin.y));
    context.lineTo(tx(game, p3x), ty(game, p3y));
    context.closePath();
    context.fill();

    // p4 is half way between upper left and upper right
    var p4x = body.cx[0] + (body.cx[1] - body.cx[0]) * 0.5;
    var p4y = body.cy[0] + (body.cy[1] - body.cy[0]) * 0.5;
    // p5 is top of the tip, outside of body
    var p5x = body.origin.x + (p4x - body.origin.x) * 1.4;
    var p5y = body.origin.y + (p4y - body.origin.y) * 1.4;
    
    // "hat"
    context.fillStyle = colors[1];
    context.beginPath();
    context.moveTo(tx(game, body.cx[0]), ty(game, body.cy[0]));
    context.lineTo(tx(game, body.cx[1]), ty(game, body.cy[1]));
    context.lineTo(tx(game, p5x), ty(game, p5y));
    context.closePath();
    context.fill();

    // eyes
    var elx = body.origin.x + (body.cx[1] - body.origin.x) * 0.5;
    var ely = body.origin.y + (body.cy[1] - body.origin.y) * 0.5;
    var erx = body.origin.x + (body.cx[0] - body.origin.x) * 0.5;
    var ery = body.origin.y + (body.cy[0] - body.origin.y) * 0.5;
    var elx2 = elx + (erx - elx) * 0.14;
    var ely2 = ely + (ery - ely) * 0.14;
    var erx2 = erx + (elx - erx) * 0.14;
    var ery2 = ery + (ely - ery) * 0.14;
    drawEye(game, body, elx2, ely2, body.dimension.x * 0.2);
    drawEye(game, body, erx2, ery2, body.dimension.x * 0.2);
}

function drawFox(game, body, colors) {
    var context = game.context;
    
    // full body
    context.fillStyle = colors[2];
    context.beginPath();
    context.moveTo(tx(game, body.cx[0]), ty(game, body.cy[0]));
    context.lineTo(tx(game, body.cx[1]), ty(game, body.cy[1]));
    context.lineTo(tx(game, body.cx[2]), ty(game, body.cy[2]));
    context.lineTo(tx(game, body.cx[3]), ty(game, body.cy[3]));
    context.closePath();
    context.fill();
    
    // p1 is double distance between origin and upper right
    var p1x = body.origin.x + (body.cx[0] - body.origin.x) * 2;
    var p1y = body.origin.y + (body.cy[0] - body.origin.y) * 2;
    // p2 is double distance between origin and upper left
    var p2x = body.origin.x + (body.cx[1] - body.origin.x) * 2;
    var p2y = body.origin.y + (body.cy[1] - body.origin.y) * 2;
    // p3 is half way between upper left and upper right
    var p3x = body.cx[0] + (body.cx[1] - body.cx[0]) * 0.5;
    var p3y = body.cy[0] + (body.cy[1] - body.cy[0]) * 0.5;
    // p4 is half way between lower left and lower right
    var p4x = body.cx[2] + (body.cx[3] - body.cx[2]) * 0.5;
    var p4y = body.cy[2] + (body.cy[3] - body.cy[2]) * 0.5;

    // ears and muzzle
    context.fillStyle = colors[1];
    context.beginPath();
    context.moveTo(tx(game, p4x), ty(game, p4y));
    context.lineTo(tx(game, p1x), ty(game, p1y));
    context.lineTo(tx(game, p3x), ty(game, p3y));
    context.lineTo(tx(game, p2x), ty(game, p2y));
    context.closePath();
    context.fill();

    // eyes
    var elx = body.origin.x + (body.cx[1] - body.origin.x) * 0.5;
    var ely = body.origin.y + (body.cy[1] - body.origin.y) * 0.5;
    var erx = body.origin.x + (body.cx[0] - body.origin.x) * 0.5;
    var ery = body.origin.y + (body.cy[0] - body.origin.y) * 0.5;
    var elx2 = elx + (erx - elx) * 0.14;
    var ely2 = ely + (ery - ely) * 0.14;
    var erx2 = erx + (elx - erx) * 0.14;
    var ery2 = ery + (ely - ery) * 0.14;
    drawEye(game, body, elx2, ely2, body.dimension.x * 0.22);
    drawEye(game, body, erx2, ery2, body.dimension.x * 0.22);
}

function drawEye(game, body, x, y, radius) {
    var context = game.context;
    var whiteRadius = tx(game, radius) - tx(game, 0);

    context.fillStyle = CHICKEN_WHITE;
    context.beginPath();
    context.arc(tx(game, x), ty(game, y), whiteRadius, 0, 2 * Math.PI, false);
    context.fill();

    // p4 is half way between lower left and lower right
    var p4x = body.cx[2] + (body.cx[3] - body.cx[2]) * 0.5;
    var p4y = body.cy[2] + (body.cy[3] - body.cy[2]) * 0.5;

    context.fillStyle = FONT_COLOR;
    var darkRadius = 0.6 * whiteRadius;

    // dir is direction in which eyes are looking
    // - if target defined: look to target
    // - if target not define: default
    var dir = new Vector(body.eyesDir.x, body.eyesDir.y);
    dir.normalize().scale(radius * 0.2);
    x += dir.x;
    y += dir.y;
    context.beginPath();
    context.arc(tx(game, x), ty(game, y), darkRadius, 0, 2 * Math.PI, false);
    context.fill();
    
    context.fillStyle = CHICKEN_WHITE;
    var glowRadius = 0.2 * whiteRadius;
    x += radius * 0.2;
    y += radius * 0.2;
    context.beginPath();
    context.arc(tx(game, x), ty(game, y), glowRadius, 0, 2 * Math.PI, false);
    context.fill();
}

function drawTree(game, body, colors) {
    var context = game.context;
    var ulx = body.cx[1];
    var uly = body.cy[1];

    // trunk
    context.fillStyle = colors[8];
    context.beginPath();
    context.moveTo(tx(game, ulx), ty(game, uly));
    context.lineTo(tx(game, ulx + body.dimension.x), ty(game, uly));
    context.lineTo(tx(game, ulx + body.dimension.x), ty(game, uly - body.dimension.y));
    context.lineTo(tx(game, ulx), ty(game, uly - body.dimension.y));
    context.closePath();
    context.fill();

    // trunk, lighter color
    context.fillStyle = colors[5];
    context.beginPath();
    context.moveTo(tx(game, ulx), ty(game, uly));
    context.lineTo(tx(game, ulx + body.dimension.x * 0.7), ty(game, uly));
    context.lineTo(tx(game, ulx + body.dimension.x * 0.7), ty(game, uly - body.dimension.y));
    context.lineTo(tx(game, ulx), ty(game, uly - body.dimension.y));
    context.closePath();
    context.fill();

    // treetop
    ulx = body.origin.x - body.dimension.x * 1.2;
    context.fillStyle = colors[13];
    context.beginPath();
    context.moveTo(tx(game, ulx), ty(game, uly));
    context.lineTo(tx(game, ulx + 2.4 * body.dimension.x), ty(game, uly));
    context.lineTo(tx(game, body.origin.x), ty(game, uly + 2.7 * body.dimension.y));
    context.closePath();
    context.fill();

    // treetop, lighter color
    context.fillStyle = colors[10];
    context.beginPath();
    context.moveTo(tx(game, ulx), ty(game, uly));
    context.lineTo(tx(game, body.origin.x), ty(game, uly));
    context.lineTo(tx(game, body.origin.x), ty(game, uly + 2.7 * body.dimension.y));
    context.closePath();
    context.fill();
}

function drawGrain(game, body, colors) {
    var context = game.context;
    var ulx = body.cx[1];
    var uly = body.cy[1];

    // grain
    context.fillStyle = colors[18];
    context.beginPath();
    context.moveTo(tx(game, ulx), ty(game, uly));
    context.lineTo(tx(game, ulx + body.dimension.x), ty(game, uly));
    context.lineTo(tx(game, ulx + body.dimension.x), ty(game, uly - body.dimension.y));
    context.lineTo(tx(game, ulx), ty(game, uly - body.dimension.y));
    context.closePath();
    context.fill();

    // grain, lighter color
    context.fillStyle = colors[15];
    context.beginPath();
    context.moveTo(tx(game, ulx), ty(game, uly));
    context.lineTo(tx(game, ulx + body.dimension.x), ty(game, uly));
    context.lineTo(tx(game, ulx), ty(game, uly - body.dimension.y));
    context.closePath();
    context.fill();
}   

function drawButton(game, button) {
    var ulx = button.origin.x - button.dimension.x / 2 + game.camera.x;
    var uly = button.origin.y + button.dimension.y / 2;
    var offset = 0.02;
    var diff = (button.isDown) ? offset : 0;

    // fill, lighter color
    game.context.fillStyle = COLORS[8];
    game.context.beginPath();
    game.context.moveTo(tx(game, ulx), ty(game, uly));
    game.context.lineTo(tx(game, ulx + button.dimension.x), ty(game, uly));
    game.context.lineTo(tx(game, ulx + button.dimension.x), ty(game, uly - button.dimension.y));
    game.context.lineTo(tx(game, ulx), ty(game, uly - button.dimension.y));
    game.context.closePath();
    game.context.fill();

    // fill, darker color
    ulx += diff;
    uly -= diff;
    game.context.fillStyle = COLORS[9];
    game.context.beginPath();
    game.context.moveTo(tx(game, ulx), ty(game, uly));
    game.context.lineTo(tx(game, ulx + button.dimension.x - offset), ty(game, uly));
    game.context.lineTo(tx(game, ulx + button.dimension.x - offset), ty(game, uly - button.dimension.y));
    game.context.lineTo(tx(game, ulx), ty(game, uly - button.dimension.y));
    game.context.closePath();
    game.context.fill();

    // text
    game.context.fillStyle = CHICKEN_WHITE;
    game.context.font = (game.canvas.height * TEXT_HEIGHT) + FONT;
    game.context.textAlign = "center";
    game.context.fillText(
        button.text,
        tx(game, button.origin.x + game.camera.x + diff),
        ty(game, button.origin.y - diff - 0.48 * button.dimension.y / 2));
}

function drawTarget(game, body) {
    // draw target
    if (body.targetRadius > 0) {
        game.context.fillStyle = CHICKEN_WHITE;
        game.context.beginPath();
        var rx = game.canvas.width / 2 * body.targetRadius;
        game.context.arc(tx(game, body.target.x), ty(game, body.target.y), rx, 0, 2 * Math.PI, false);
        game.context.fill();
    }
}

/*
 * Translates a body's x coordinate to the canvas's scale:
 * - if body is at x = -1, the body is at the canvas's left edge
 * - if body is at x = 1, the body is at the canvas's right edge
 */
function tx(game, x) {
    return game.canvas.width / 2 * (x - game.camera.x + 1);
}
function x(game, tx) {
    return tx / game.canvas.width * 2 - 1 + game.camera.x;
}

/*
 * Translates a body's y coordinate to the canvas's scale. This depends on the
 * size of the canvas.
 * 
 * If the size of the canvas is 400px wide and 200px high, and:
 * - if body is at y = 0.5, the body is at the canvas's top edge
 * - if body is at y = -0.5, the body is at the canvas's bottom edge
 */
function ty(game, y) {
    return -game.canvas.width / 2 * (y - game.camera.y)
        + game.canvas.height / 2;
}
function y(game, ty) {
    return -ty / game.canvas.width * 2
        + game.canvas.height / game.canvas.width + game.camera.y;
}

function toClickVector(game, e) {
    var clientRect = game.canvas.getBoundingClientRect();
    var clickX = x(game, e.clientX - clientRect.left);
    var clickY = y(game, e.clientY - clientRect.top);
    return new Vector(clickX, clickY);
}

/*
 * Resizes all canvases to fit screen width in case browser window is thinner than canvasWidth.
 */
function resizeCanvas(canvas) {
    var w = window.innerWidth;
    var h = CANVAS_HEIGHT * w / CANVAS_WIDTH;
    if (canvas.width !== w) {
        canvas.width = w;
        canvas.height = h;
    }
}

function resizeCanvasInGame(game) {
    resizeCanvas(game.canvas);
    if (!game.isRunning) {
        currentScreen.draw();
    }
}