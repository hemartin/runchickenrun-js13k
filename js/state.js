/*
 * The state contains all entities and advances them, including resolving
 * collisions.
 * 
 * @author Martin Hentschel, @hemasail
 */

function State() {
    this.chicken = null;
    this.fox = null;
    this.walls = [];
    this.trees = [];
    this.grains = [];
    this.invisibleWall = null; // prevents chicken from going past left edge

    // remember max x coordinate of trees
    this.treeCenter = -CANVAS_WIDTH;

    // state after checking collisions
    this.eatenGrains = 0;
    this.foxAteChicken = false;

    // gives each body a unique id
    this.nextBodyId = 0;
}

State.prototype.init = function() {
    // init chicken
    this.chicken = new Body(this)
        .setOrigin(0, 0)
        .setDimension(0.1, 0.1)
        .finalize();
    
    // init fox, position is set again in spawnFox()
    this.fox = new Body(this)
        .setOrigin(-0.4 * CANVAS_WIDTH, 0)
        .setDimension(0.07, 0.07)
        .finalize();
    this.fox.thrust = 0.9;
    this.fox.targetRadius = 0.2;

    // init upper and lower wall
    var wallWidth = 1000000;
    this.walls.push(new FixedBody(this)
        .setOrigin(wallWidth / 2 - CANVAS_WIDTH, CANVAS_HEIGHT / 2 + 0.05)
        .setDimension(wallWidth, 0.1)
        .finalize());
    this.walls.push(new FixedBody(this)
        .setOrigin(wallWidth / 2 - CANVAS_WIDTH, -CANVAS_HEIGHT / 2 - 0.05)
        .setDimension(wallWidth, 0.1)
        .finalize());

    // init invisible wall
    this.invisibleWall = new FixedBody(this)
        .setOrigin(-CANVAS_WIDTH / 2 - 0.05, 0)
        .setDimension(0.1, CANVAS_HEIGHT + 0.1)
        .finalize();
};

State.prototype.updateInvisibleWall = function(camera) {
    this.invisibleWall.origin.x = camera.x - CANVAS_WIDTH / 2
        - this.invisibleWall.dimension.x / 2;
};

State.prototype.updateTrees = function(camera) {
    while (this.treeCenter < camera.x) {
        this.treeCenter += CANVAS_WIDTH;

        // remove trees and grains outside of left boundary,
        // they will never become visible again
        this.trees = this.removeInvisible(this.trees);
        this.grains = this.removeInvisible(this.grains);
            
        // add trees
        var N = 7 + this.treeCenter;
        for (var i = 0; i < N; i++) {
            var tree = null;
            var dist = 0;
            do {
                var rand_x = Math.random() * CANVAS_WIDTH - (CANVAS_WIDTH / 2)
                    + this.treeCenter;
                var rand_y = Math.random() * CANVAS_HEIGHT - (CANVAS_HEIGHT / 2);
                tree = new FixedBody(this).setOrigin(rand_x, rand_y)
                    .setDimension(0.08, 0.08).finalize();
                dist = Math.min(
                    tree.origin.distanceFrom(this.fox.origin),
                    tree.origin.distanceFrom(this.chicken.origin));
            } while (dist < 0.15)
            this.trees.push(tree);
        }
        this.trees.sort(function (t1, t2) {
            return t2.origin.y - t1.origin.y; // sort by y desc
        });

        // add grains
        var N = 7 + this.treeCenter;
        var trees = [];
        for (var i = 0; i < N; i++) {
            var rand_x = Math.random() * CANVAS_WIDTH - (CANVAS_WIDTH / 2)
                + this.treeCenter;
            var rand_y = Math.random() * CANVAS_HEIGHT - (CANVAS_HEIGHT / 2);
            var grain = new FixedBody(this).setOrigin(rand_x, rand_y)
                .setDimension(0.04, 0.04).finalize();
            this.grains.push(grain);
        }
        this.grains.sort(function (t1, t2) {
            return t2.origin.y - t1.origin.y; // sort by y desc
        });
    }
};

State.prototype.removeInvisible = function(bodies) {
    var newBodies = [];
    for (var i = 0; i < bodies.length; i++) {
        if (bodies[i].origin.x + bodies[i].dimension.x / 2
                > this.invisibleWall.origin.x + this.invisibleWall.dimension.x) {
            newBodies.push(bodies[i]);
        }
    }
    return newBodies;
};

State.prototype.advance = function (timestep) {
    // fox always targets chicken
    this.fox.target.set(this.chicken.origin);

    // check for collisions
    var collisions = this.collide(timestep);

    // apply forces
    this.chicken.applyForces(timestep);
    this.fox.applyForces(timestep);

    // apply impulses
    collisions.forEach(function (collision) {
        collision.apply();
    });

    // advance chicken and fox
    this.chicken.advance(timestep);
    this.fox.advance(timestep);

    // check target
    this.chicken.checkTarget();
    
    // eyes always look into direction of target
    this.fox.eyesDir.set(this.fox.target).subtract(this.fox.origin);
    if (this.chicken.targetRadius > 0) {
        this.chicken.eyesDir.set(this.chicken.target)
            .subtract(this.chicken.origin);
    }
};

State.prototype.collide = function (timestep) {
    var collisions = [];

    // collide fox with chicken
    var newCollision = Body_collide(this, this.fox, this.chicken, timestep);
    if (newCollision !== null) {
        collisions.push(newCollision);
        this.foxAteChicken = true;
    }

    // collide chicken trees
    for (var i = 0; i < this.trees.length; i++) {
        newCollision = Body_collide(this, this.chicken, this.trees[i], timestep);
        if (newCollision !== null) {
            collisions.push(newCollision);
        }
    }

    // collide fox with trees, but only for trees left of invisible wall
    for (var i = 0; i < this.trees.length; i++) {
        if (this.trees[i].origin.x > this.invisibleWall.origin.x) {
            newCollision = Body_collide(this, this.fox, this.trees[i], timestep);
            if (newCollision !== null) {
                collisions.push(newCollision);
            }
        }
    }

    // collide chicken and fox with walls
    var wallsLength = this.walls.length;
    for (var i = 0; i < wallsLength; i++) {
        newCollision = Body_collide(this, this.chicken, this.walls[i], timestep);
        if (newCollision !== null) {
            collisions.push(newCollision);
        }
        newCollision = Body_collide(this, this.fox, this.walls[i], timestep);
        if (newCollision !== null) {
            collisions.push(newCollision);
        }
    }

    // collide chicken with invisible wall to the left
    newCollision = Body_collide(this, this.chicken, this.invisibleWall, timestep);
    if (newCollision !== null) {
        collisions.push(newCollision);
    }

    // collide chicken with grains
    var eatenGrainsIdxs = [];
    for (var i = 0; i < this.grains.length; i++) {
        var newCollision = Body_collide(this, this.chicken, this.grains[i], timestep);
        if (newCollision !== null) {
            eatenGrainsIdxs.push(i);
        }
    }

    // remove grains and increment counter
    if (eatenGrainsIdxs.length > 0) {
        var newGrains = [];
        var j = 0;
        for (var idx = 0; idx < this.grains.length; idx++) {
            if (idx == eatenGrainsIdxs[j]) {
                // ignore grain, increment pointer for next ignorance
                j++;
            }
            else {
                // keep grain
                newGrains.push(this.grains[idx]);
            }
        }
        // replace original grains with new grains
        this.grains = newGrains;
        // update counter
        this.eatenGrains += eatenGrainsIdxs.length;
    }

    return Collision_mergeCollisions(collisions);
};
