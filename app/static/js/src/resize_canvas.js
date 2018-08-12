/*
* @Author: wmai
* @Date:   2017-08-03 15:48:18
* @Last Modified by:   wmai
* @Last Modified time: 2017-08-03 15:53:37
*/

var rtime
var timeout = false
var delta = 1000

window.onresize = function() {
    rtime = new Date()
    if (timeout === false) {
        timeout = true
        setTimeout(resizeend, delta)
    }
}

function resizeCanvas() {
    var ctx = document.getElementById('spermEnvironmentCanvas').getContext('2d')
    ctx.canvas.width  = window.innerWidth
    ctx.canvas.height = window.innerHeight
    console.log('Canvas resized : ' + window.innerWidth + ' x ' + window.innerHeight)
}

function resizeend() {
    if (new Date() - rtime < delta) {
        setTimeout(resizeend, delta)
    } else {
        timeout = false
        resizeCanvas()
    }
}

resizeCanvas()
