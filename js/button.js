/*
 * A button.
 * 
 * @author Martin Hentschel, @hemasail
 */
 
function Button(game, text) {
    this.game = game;
    this.text = text;
    this.origin = new Vector(0, 0);
    this.dimension = new Vector(0.45, 0.11);
    this.isDown = false;
}

Button.prototype.clicked = function(click) {
    var cx = click.x - this.game.camera.x;
    return cx >= this.origin.x - this.dimension.x / 2
           && cx <= this.origin.x + this.dimension.x / 2
           && click.y >= this.origin.y - this.dimension.y / 2
           && click.y <= this.origin.y + this.dimension.y / 2;
};

Button.prototype.down = function(click) {
    var cx = click.x - this.game.camera.x;
    this.isDown = cx >= this.origin.x - this.dimension.x / 2
           && cx <= this.origin.x + this.dimension.x / 2
           && click.y >= this.origin.y - this.dimension.y / 2
           && click.y <= this.origin.y + this.dimension.y / 2;
};

Button.prototype.up = function(click) {
    this.isDown = false;
};