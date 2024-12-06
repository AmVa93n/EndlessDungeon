let $game, $player, $entrance, $exit, $chest = null // shorthand for current instances of important classes

window.onload = function() {
    Scene.main = document.getElementById('main')
    Scene.hud = document.getElementById('hud')
    Scene.title = document.getElementById('titleScene')
    Scene.howToPlay = document.getElementById('instructions')
    Scene.highScores = document.getElementById('highscores')
    Scene.gameOver = document.getElementById('gameoverScene')
    Input.setupClickListeners()
    Input.setupKeyboardListeners()
    Scene.change('title')
}