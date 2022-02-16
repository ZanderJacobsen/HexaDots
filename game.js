let gameSettings = {
    'score': 0,
    'timer': 0,
    'numColors': 3,
    'colors': [0xfabed4, 0x42d4f4, 0xffe119, 0xf032e6, 0xe6194B, 0x44ffc3, 0x911eb4, 0xdcbeff],
    'numDotsRows': 3,
    'numDotsColumns': 3,
    'maxTime': 20000
};

let config = {
    type: Phaser.AUTO,
    // parent: 'index',
    width: 750,
    height: 1334,
    backgroundColor: 0x000000,
    scene: [Menu, Dots],
    physics: {
        default: 'arcade',
        arcade: {
            gravity: {
                y: 0
            },
            debug: false
        }
    }
};

let game = new Phaser.Game(config);
