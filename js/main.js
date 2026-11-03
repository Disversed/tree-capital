window.addEventListener('load', () => {
    const canvasContainer = document.querySelector('.canvas');

    const config = {
        type: Phaser.AUTO,
        parent: canvasContainer,
        width: canvasContainer.clientWidth || 360,
        height: canvasContainer.clientHeight || 640,
        transparent: true,
        scale: {
            mode: Phaser.Scale.FIT,
            autoCenter: Phaser.Scale.CENTER_BOTH
        },
        render: {
            roundPixels: true
        },
        scene: [MainScene]
    };

    window.game = new Phaser.Game(config);
});