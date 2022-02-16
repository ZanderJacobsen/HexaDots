let textMap = {
    'numDotsRows': 'NUMBER OF ROWS',
    'numDotsColumns': 'NUMBER OF COLUMNS',
    'numColors': 'NUMBER OF COLORS'
};

class Menu extends Phaser.Scene {
    constructor() {
        super("bootGame");
    }
    preload() {
        this.load.image('circle', 'assets/circle.png');
        this.load.image('button', 'assets/button.png')
    }
    create() {
        // Make Sliders for the 3 adjustable settings for gameSettings
        // Possibly add a score slider
        this.rowDot = this.makeSlider(config.width * 1 / 10, config.height / 2, "numDotsRows");
        this.ColumnDot = this.makeSlider(config.width * 1 / 10, config.height * 5 / 8, "numDotsColumns");
        this.colorDot = this.makeSlider(config.width * 1 / 10, config.height * 3 / 4, "numColors");

        // Decide what the Start button text should be depending on if they've recently played
        let startText = 'START';
        if (gameSettings['score'] > 0) {
            startText = "RETRY";
        }
        // Need to see if I can have this text object exist agnostic to scenes
        this.score = this.add.text(config.width / 20, 10, 'Score: ' + gameSettings['score'], {
            font: '48px shizuru',
            fill: '#ffffff'
        });
        // Split title up just so I can get all 8 colors shown
        this.title1 = this.add.text(config.width / 4, config.height / 10, 'Hexa', {
            font: "96px shizuru",
            fill: "#ffffff"
        });
        this.title1.setDisplayOrigin(0, 0);
        this.title1.setTintFill(gameSettings['colors'][0], gameSettings['colors'][1], gameSettings['colors'][2], gameSettings['colors'][3]);
        this.title2 = this.add.text(config.width / 4, config.height / 10, 'Dots', {
            font: "96px shizuru",
            fill: "#ffffff"
        });
        this.title2.setDisplayOrigin(-this.title1.width, 0);
        this.title2.setTintFill(gameSettings['colors'][4], gameSettings['colors'][5], gameSettings['colors'][6], gameSettings['colors'][7]);

        // Text and background image for start button
        this.startButton = this.makeButton(config.width * 3 / 8, config.height / 4, 0);
        this.start = this.add.text(config.width * 3 / 8, config.height / 4, startText, {
            font: "74px shizuru",
            fill: "#000000"
        });
        this.start.setInteractive();

        // Text and background image for exit button
        this.exitButton = this.makeButton(config.width * 3 / 8, config.height * 3 / 8, 1);
        this.exit = this.add.text(config.width * 3 / 8, config.height * 3 / 8, 'EXIT', {
            font: "74px shizuru",
            fill: "#000000"
        });
        this.exit.setInteractive();

        //  The text will dispatch events when they are clicked on
        this.start.on('pointerdown', ()=>{
            this.scene.start("playGame");
        }
        , this);
        this.exit.on('pointerdown', ()=>{
            this.sys.game.destroy(true);
        }
        , this);

        // Drag logic for the sliders. The sliders cannot move past the first and last dots
        // and do not move in the Y axis
        this.input.on('drag', function(pointer, gameObject, dragX, dragY) {
            if (dragX > config.width * 2 / 10 && dragX < config.width * 7 / 10)
                gameObject.x = dragX;
        });
        // Dragend logic that snaps the dot to the closest value
        this.input.on('dragend', function(pointer, gameObject) {
            let dx = (Math.round(10 * gameObject.x / config.width));
            gameSettings[gameObject.name] = dx + 1;
            gameObject.x = config.width * dx / 10;
        });
    }

    // Helper function to make sliders
    // Takes the starting location of the dot and
    // the string name for the gameSettings variable
    // Constructs the dot, line, thresholds and informational text
    makeSlider(x, y, n) {
        // Dot that slides around
        let dot = this.add.image(x * (gameSettings[n] - 1), y, 'circle');
        dot.setInteractive({
            draggable: true
        });
        this.input.setDraggable(dot, true);
        dot.name = n;

        // Dots that signify the thresholds
        for (let i = 2; i < 8; i++) {
            let im = this.add.image(x * i, y, 'circle');
            im.scale = 0.5;
            im.setTintFill(gameSettings['colors'][i]);
            let t = this.add.text(x * i + 10, y + 10, (i + 1).toString(), {
                font: "20px shizuru",
                fill: "#ffffff"
            })
        }
        // Line to go across the screen so things aren't floating about
        this.add.line(config.width / 2, y, 0, 0, config.width, 0, 0xffffff);

        // Some informational text for which slider applies to which variable
        this.add.text(config.width * 1 / 5, y + config.height / 32, textMap[n], {
            font: "24px shizuru",
            fill: "#ffffff"
        });

        // only object that needs additional logic
        return dot;
    }
    // Helper function to make a button
    // Takes the starting location of the text and color
    makeButton(x, y, n) {
        let b = this.add.image(x, y, 'button');
        // Need to shift origin so it lines up with the text smoother
        b.setDisplayOrigin(14, 4);
        b.scale = 4;
        b.setTintFill(gameSettings['colors'][n]);
        return b;
    }
}
