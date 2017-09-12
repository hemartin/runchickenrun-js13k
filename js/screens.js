/*
 * Screens are separate state's in the game's state machine.
 * 
 * When the game first loads, a splash screen is shown. From there,
 * the play goes to the "get ready" screen and then on the to the
 * game screen where the actual game play happens. Finally, there is
 * a "end of round" screen.
 * 
 * @author Martin Hentschel, @hemasail
 */

 function SplashScreen(game) {
    this.game = game;
    this.startButton = new Button(this.game, "Start");
    this.startButton.origin.y = -0.07;
}

SplashScreen.prototype.draw = function() {
    drawGame(this.game, false, true);
    drawText(this.game, "Run Chicken Run", 0, 0.12, 2);
    drawText(this.game, "A chicken, lost in the woods, runs from the fox.", 0, 0.05, 0.7);
    drawButton(this.game, this.startButton);
};

SplashScreen.prototype.onClick = function(click) {
    if (this.startButton.clicked(click))
    {
        return new GetReadyScreen(this.game);
    }
    return this;
};

SplashScreen.prototype.onMouseDown = function(click) {
    this.startButton.down(click);
};

SplashScreen.prototype.onMouseUp = function(click) {
    this.startButton.up(click);
};


function GetReadyScreen(game) {
    this.game = game;
}

GetReadyScreen.prototype.draw = function() {
    drawGame(this.game, true, false);
    drawText(this.game, "Get Ready", 0, 0.2, 2);

    var context = this.game.context;

    // arrow base
    var baseWidth = 0.1;
    var baseHeight = 0.04;
    var ulx = this.game.camera.x;
    var uly = baseHeight / 2;
    context.fillStyle = CHICKEN_WHITE;
    context.beginPath();
    context.moveTo(tx(this.game, ulx), ty(this.game, uly));
    context.lineTo(tx(this.game, ulx + baseWidth + 0.01), ty(this.game, uly));
    context.lineTo(tx(this.game, ulx + baseWidth + 0.01), ty(this.game, uly - baseHeight));
    context.lineTo(tx(this.game, ulx), ty(this.game, uly - baseHeight));
    context.closePath();
    context.fill();

    // arrow tip
    context.beginPath();
    context.moveTo(tx(this.game, ulx + baseWidth), ty(this.game, 2.1 * uly));
    context.lineTo(tx(this.game, ulx + 1.6 * baseWidth), ty(this.game, 0));
    context.lineTo(tx(this.game, ulx + baseWidth), ty(this.game, 2.1 * (uly - baseHeight)));
    context.closePath();
    context.fill();

    for (var i = 0; i < 3; i++) {
        // small target
        context.fillStyle = CHICKEN_WHITE;
        var tarx = this.game.camera.x + 0.275 + i * 0.15;
        context.beginPath();
        var rx = this.game.canvas.width / 2 * 0.05;
        context.arc(tx(this.game, tarx), ty(this.game, 0), rx, 0, 2 * Math.PI, false);
        context.fill();

        // "click" text
        drawText(this.game, "click", 0.275 + i * 0.15, -0.12, 0.8);
    }
};

GetReadyScreen.prototype.onClick = function(click) {
    runGame(this.game);
    this.game.state.chicken.target.set(click);
    this.game.state.chicken.targetRadius = 0.08;
    return new GamePlayScreen(this.game);
};

GetReadyScreen.prototype.onMouseDown = function(click) {
    // no action
};

GetReadyScreen.prototype.onMouseUp = function(click) {
    // no action
};


function GamePlayScreen(game) {
    this.game = game;
}

GamePlayScreen.prototype.draw = function() {
    drawGame(this.game, true, false);
};

GamePlayScreen.prototype.onClick = function(click) {
    this.game.state.chicken.target.set(click);
    this.game.state.chicken.targetRadius = 0.08;
    return this;
};

GamePlayScreen.prototype.onMouseDown = function(click) {
    // no action
};

GamePlayScreen.prototype.onMouseUp = function(click) {
    // no action
};


function EndOfRoundScreen(game) {
    this.dy = 0.15;
    this.game = game;
    this.headline = "End of Round";
    this.playButton = new Button(this.game, "Play");
    this.playButton.origin.y = this.dy - 0.35;
}

EndOfRoundScreen.prototype.draw = function() {
    drawGame(this.game, true, true);
    drawText(this.game, this.headline, 0, 0.1 + this.dy, 2);
    drawSummary(this.game, this.dy, this.game.multiplier + "x", "New Total");
    drawButton(this.game, this.playButton);
    var newMulti = this.game.multiplier + 1;
    var pointS = (this.game.state.eatenGrains == 1) ? "" : "s";
    drawText(
        this.game,
        newMulti + "x multiplier next round if more ",
        0, this.dy - 0.455, 0.6);
    drawText(
        this.game,
        "than " + this.game.state.eatenGrains + " point" + pointS
            + ", or game over",
        0, this.dy - 0.5, 0.6);
};

EndOfRoundScreen.prototype.onClick = function(click) {
    if (this.playButton.clicked(click)) {
        this.game.lastScore = this.game.state.eatenGrains;
        var state = new State();
        state.init();
        this.game.state = state;
        this.game.camera.x = -CANVAS_WIDTH;
        this.game.multiplier++;
        this.game.clickCount = 0;
        this.game.lastClickCount = 0;
        this.game.lastClickTime = 0;
        return new GetReadyScreen(this.game);
    }
    return this;
};

EndOfRoundScreen.prototype.onMouseDown = function(click) {
    this.playButton.down(click);
};

EndOfRoundScreen.prototype.onMouseUp = function(click) {
    this.playButton.up(click);
};


function GameOverScreen(game) {
    this.dy = 0.15;
    this.game = game;
    this.startButton = new Button(this.game, "Start");
    this.startButton.origin.y = this.dy - 0.4;
}

GameOverScreen.prototype.draw = function() {
    drawGame(this.game, true, true);
    drawText(this.game, "Game Over", 0, 0.1 + this.dy, 2);
    drawSummary(this.game, this.dy, "--", "Final Total");
    drawButton(this.game, this.startButton);
};

GameOverScreen.prototype.onClick = function(click) {
    if (this.startButton.clicked(click)) {
        var state = new State();
        state.init();
        this.game.state = state;
        this.game.camera.x = -CANVAS_WIDTH;
        this.game.lastScore = 0;
        this.game.totalScore = 0;
        this.game.multiplier = 1;
        this.game.clickCount = 0;
        this.game.lastClickCount = 0;
        this.game.lastClickTime = 0;
        return new GetReadyScreen(this.game);
    }
    return this;
};

GameOverScreen.prototype.onMouseDown = function(click) {
    this.startButton.down(click);
};

GameOverScreen.prototype.onMouseUp = function(click) {
    this.startButton.up(click);
};

function drawSummary(game, dy, multiplierStr, newTotalLabel) {
    var fontSize = 0.8;
    var textHeight = TEXT_HEIGHT * fontSize;

    var lineY = dy;
    drawTextAlign(game, "Last Total", 0.12, lineY, fontSize, FONT_ALIGN_RIGHT);
    drawTextAlign(game, game.lastTotalScore.toLocaleString(), 0.17, lineY, fontSize, FONT_ALIGN_LEFT);
    
    lineY -= 1.2 * textHeight;
    drawTextAlign(game, "+", -0.23, lineY, fontSize, FONT_ALIGN_CENTER);
    drawTextAlign(game, "Last Round", 0.12, lineY, fontSize, FONT_ALIGN_RIGHT);
    drawTextAlign(game, game.state.eatenGrains.toLocaleString(), 0.17, lineY, fontSize, FONT_ALIGN_LEFT);

    lineY -= 1.2 * textHeight;
    drawTextAlign(game, "x", -0.23, lineY, fontSize, FONT_ALIGN_CENTER);
    drawTextAlign(game, "Multiplier", 0.12, lineY, fontSize, FONT_ALIGN_RIGHT);
    drawTextAlign(game, multiplierStr, 0.17, lineY, fontSize, FONT_ALIGN_LEFT);
    
    var context = game.context;
    context.strokeStyle = FONT_COLOR;
    context.beginPath();
    context.moveTo(tx(game, -0.4 + game.camera.x), ty(game, lineY - 0.025));
    context.lineTo(tx(game, 0.4 + game.camera.x), ty(game, lineY - 0.025));
    context.stroke();

    lineY -= 1.6 * textHeight;
    drawTextAlign(game, "=", -0.23, lineY, fontSize, FONT_ALIGN_CENTER);
    drawTextAlign(game, newTotalLabel, 0.12, lineY, fontSize, FONT_ALIGN_RIGHT);
    drawTextAlign(game, game.totalScore.toLocaleString(), 0.17, lineY, fontSize, FONT_ALIGN_LEFT);
}

function drawText(game, text, x, y, size) {
    drawTextAlign(game, text, x, y, size, FONT_ALIGN_CENTER);
}

function drawTextAlign(game, text, x, y, size, align) {
    var textHeight = size * game.canvas.height * TEXT_HEIGHT;
    game.context.fillStyle = FONT_COLOR;
    game.context.font = textHeight + FONT;
    game.context.textAlign = align;
    game.context.fillText(text, tx(game, x + game.camera.x), ty(game, y));
}