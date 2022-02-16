class Dots extends Phaser.Scene {
    constructor() {
        super("playGame");
    }

    preload() {
        this.load.image('hexagon', 'assets/hexagon.png');
        this.load.image('fill', 'assets/dotFill.png');
    }

    create() {
        gameSettings['score'] = 0;
        this.selectedDots = [];
        this.dotMap = [];

        //  Create a bunch of dots to start out with
        for (let i = 0; i < gameSettings['numDotsColumns']; i++) {
            let shortList = this.physics.add.group();
            // Magic numbers 12 and 48 should be more generic to the canvas size
            let offset = 12;
            let x = i * 48 + config.width / 4;

            for (let j = 0; j < gameSettings['numDotsRows']; j++) {
                // Same for magic number 37
                let y = j * 37 + config.height / 4;
                let hex = this.add.image(offset + x, y, 'hexagon');
                let dot = this.createDot(offset + x, y);
                // Each row needs to shift ever so slightly
                offset *= -1;
                shortList.add(dot);
            }
            // Structure to hold all the dots for reference
            this.dotMap.push(shortList);
        }

        //  If a Game Object is clicked or hovered, this event is fired.
        //  Drawbacks are that this does not work on mobile. Need to switch
        //  to pointerdown and find object under pointer
        this.input.on('gameobjectdown', function(pointer, gameObject) {
            gameObject.emit('clicked', gameObject);
        }, this);
        // Use pointerup to be agnostic to where the pointer is and whether it
        // is over an object or not
        this.input.on('pointerup', function(pointer) {
            this.deleteSelected();
        }, this);
        this.input.on('gameobjectover', function(pointer, gameObject) {
            gameObject.emit('hover', gameObject);
        }, this);

        //  Display the game stats
        this.score = this.add.text(config.width / 20, 10, '', {
            font: '48px shizuru',
            fill: '#ffffff'
        });
        this.timer = this.add.text(config.width * 3 / 5, 10, '', {
            font: '48px shizuru',
            fill: '#ffffff'
        });

        gameSettings['timer'] = this.time.addEvent({
            delay: gameSettings['maxTime'],
            callback: this.gameOver,
            callbackScope: this
        });

        // Need to see if the exit button from menu can be repurposed for this scene as well
        // rather than rebuilding it here.
        this.exitButton = this.add.image(config.width * 3 / 8, config.height * 6 / 8, 'button');
        this.exit = this.add.text(config.width * 3 / 8, config.height * 6 / 8, 'EXIT', {
            font: "74px shizuru",
            fill: "#000000"
        });
        this.exit.setInteractive();
        this.exitButton.setDisplayOrigin(14, 4);
        this.exitButton.scale = 4;
        this.exitButton.setTintFill(gameSettings['colors'][2]);

        this.exit.on('pointerdown', ()=>{
            this.gameOver();
        }
        , this);
    }

    update() {
        // Update game info
        this.score.setText('Score: ' + gameSettings['score']);
        this.timer.setText('Time: ' + (Math.floor(gameSettings['maxTime'] - gameSettings['timer'].getElapsed()) / 1000).toFixed(2));
    }

    // Helper function to make a dot
    // Take the object starting positions only
    // Generate the dot and randomize the color
    createDot(x, y) {
        let dot = this.physics.add.image(x, y, 'circle');
        dot.setTintFill(gameSettings['colors'][Math.floor(Math.random() * gameSettings['numColors'])]);
        //  Make them all input enabled
        dot.setInteractive();

        //  The images will dispatch events when they are interacted with
        dot.on('clicked', this.clickHandler, this);
        dot.on('hover', this.addDot, this);
        this.physics.world.enable(dot);
        return dot;
    }

    // Helper function to fill any dots after disabling the clicked ones
    // Take the group that has any missing Dots
    // Create a new dot and place it on top then have each child take the
    // next child's positions for its moveTo
    fillDotMap(group) {
        // Get information on the dot that is disabled
        let dot = group.getLast(false);
        let children = group.getChildren();
        let index = children.indexOf(dot);
        // Shift a new dot to the top
        children.unshift(this.createDot(children[0].x, children[0].y - 37));
        // Iterate over dots and disable them as they move to the next dot
        // up to the position of the disabled dot
        for (let i = 0; i < index + 1; i++) {
            let dx = children[i + 1].x;
            let dy = children[i + 1].y;
            children[i].disableInteractive();
            // Move to next dot's position
            this.physics.moveTo(children[i], dx, dy, 0, 250);
            // MoveTo does not stop the movement once reached
            // Explicitly stop the velocity and ensure the dot has
            // reached it's destination
            this.time.delayedCall(250, (ddx,ddy)=>{
                children[i].setVelocity(0, 0);
                children[i].setPosition(ddx, ddy);
                children[i].setInteractive();
            }
            , [dx, dy]);
        }
        group.remove(dot, true, true);
        // Recursively call this function until there are no more
        // inactive dots left
        if (group.countActive(false) > 0) {
            this.time.delayedCall(250, ()=>{
                this.fillDotMap(group);
            }
            );
        }
    }

    // Helper function to determine if a hovered over dot is valid for selection
    isValidDot(dot) {
        // If the selected dots is empty we can't add to it. Make sure they didn't
        // click off game and drag around after. And ensure the first dot has the
        // same color as this dot
        if (this.selectedDots.length < 1 || this.selectedDots[0].tintTopLeft !== dot.tintTopLeft) {
            return false;
        }
        // Now make sure the dot is at least within range of one of the dots
        // not just the last one. Makes for easier play
        for (let i = 0; i < this.selectedDots.length; i++) {
            let dist = Phaser.Math.Distance.Between(dot.x, dot.y, this.selectedDots[i].x, this.selectedDots[i].y);
            let max = dot.displayHeight * 2;
            if (dist <= max)
                return true;
        }
        return false;
    }

    // Function for when a dot is clicked
    // Start the selectedDots array with a new dot
    clickHandler(dot) {
        this.selectedDots.push(dot);
        dot.setTexture('fill');
        dot.disableInteractive();
    }

    gameOver() {
        this.scene.start("bootGame");
    }

    // Helper function to finally start emptying the selected dots
    deleteSelected() {
        // Don't do anything if they only have a single dot selected
        if (this.selectedDots.length === 1) {
            let dot = this.selectedDots[0];
            this.selectedDots.length = 0;
            dot.setTexture('circle');
            dot.setInteractive();
            return;
        }
        // Iterate over the selectedDots and deactive and remove them from view
        for (let i = 0; i < this.selectedDots.length; i++) {
            this.selectedDots[i].active = false;
            this.selectedDots[i].setVisible(false);
        }
        // Update user score accordingly and empty the selected for more play
        gameSettings['score'] += this.selectedDots.length;
        this.selectedDots.length = 0;
        // Check all the groups for any deactived dots and start the fill process
        for (let i = 0; i < this.dotMap.length; i++) {
            if (this.dotMap[i].countActive(false) > 0) {
                this.fillDotMap(this.dotMap[i]);
            }
        }
    }

    // Function fired when a dot is hovered over
    // Only actually do any logic if the pointer is down first
    addDot(dot) {
        // Check if pointer is down, and if the dot is good, and if we already have the dot
        // to stop any quick clicking tomfoolery
        if (this.input.activePointer.isDown && this.isValidDot(dot) && !this.selectedDots.includes(dot)) {
            dot.setTexture('fill');
            dot.disableInteractive();
            this.selectedDots.push(dot);
        }
    }
}
