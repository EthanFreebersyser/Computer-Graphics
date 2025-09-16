import {initShaders, vec4, flatten} from "./helperfunctions.js";

"use strict"
let gl:WebGLRenderingContext;
let canvas:HTMLCanvasElement;
let program:WebGLProgram;
let bufferId:WebGLBuffer;
let crosshairBuffer:WebGLBuffer;

type Target = {
    x: number; y: number;
    vx: number; vy: number;
    size: number;
    alive: boolean;
    color: vec4;
};

let targets: Target[] = [];
let motionEnabled: boolean = false;
let lastTime = performance.now();
let shotsFired: number = 0;
let aimX: number = 0, aimY: number = 0;


//do this when the page first loads
window.onload = function(){
    canvas = document.getElementById("gl-canvas") as HTMLCanvasElement;
    //and the canvas has a webgl rendering context associated already
    gl = canvas.getContext("webgl2") as WebGLRenderingContext;
    if(!gl){
        alert("WebGL not Supported!");
    }
    // use the helperfunctions function to turn vertex and fragment shader into program
    program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);

    bufferId = gl.createBuffer()!;
    crosshairBuffer = gl.createBuffer()!;

    window.addEventListener("keydown", keyDownListener);

    canvas.addEventListener("mousedown", mouseDownListener);

    canvas.addEventListener("mousemove", mouseMoveListener);

    (document.getElementById("resetBtn") as HTMLButtonElement).addEventListener("click", () => {resetGame();});


    //what part of the canvas should we use (all of it here)
    gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);

    gl.clearColor(0.0, 0.0, 0.0, 1.0); //start out opaque black

    //request a frame to be drawn
    resetGame()
    lastTime = performance.now();
    window.setInterval(gameLoop, 16);
}

function keyDownListener(event:KeyboardEvent){
    switch (event.key) {
        case "m":
            motionEnabled = !motionEnabled;
            break;
    }
    updateFeedback();
}

function mouseMoveListener(event: MouseEvent){
    const rect = canvas.getBoundingClientRect();
    const cx = (event.clientX - rect.left) / rect.width;  // 0..1
    const cy = (event.clientY - rect.top) / rect.height;  // 0..1
    aimX = cx*2 - 1;
    aimY = 1 - cy*2;
    rebuildCrosshairBuffer();
}

function mouseDownListener(event:MouseEvent){
    shotsFired++;
    let anyHit:boolean = false;
    for (const target of targets){
        if (!target.alive) continue;
        const hit:boolean = Math.abs(aimX - target.x) <= target.size && Math.abs(aimY - target.y) <= target.size;
        if (hit) {
            target.alive = false;
            anyHit = true;
        }
    }
    if (anyHit) {
        rebuildBuffer();
    }
    updateFeedback();
}

function resetGame() {
    let numOfTargets: number = getRandomInt(5, 10);
    targets = [];
    for (let i = 0; i < numOfTargets; i++) {
        const size = 0.05;

        const x = (Math.random() * 2 - 1) * (1 - size);
        const y = (Math.random() * 2 - 1) * (1 - size);

        const angle = (Math.random() * Math.PI) * 2;
        const speed = 0.25 + (Math.random() * 0.35);
        const vx = Math.cos(angle) * speed;
        const vy = Math.sin(angle) * speed;

        targets.push({
            x, y, vx, vy, size,
            alive: true,
            color: new vec4(Math.random(), Math.random(), Math.random(), 1),
        })
    }
    shotsFired = 0;
    motionEnabled = false;
    rebuildBuffer();
    updateFeedback();
    rebuildCrosshairBuffer();
}


function pushTriangle(pts: vec4[], ptx: number, pty: number, ptSize: number, color: vec4){
    const x0: number = ptx - ptSize, x1: number = ptx + ptSize;
    const y0: number = pty - ptSize, y1: number = pty + ptSize;
    //this is fancy
    const xAndy = (x: number, y: number) => new vec4(x,y,0,1);

    //triangle 1
    pts.push(xAndy(x0,y0), color, xAndy(x1,y0), color, xAndy(x1,y1), color);
    //triangle 2
    pts.push(xAndy(x0,y0), color, xAndy(x1,y1), color, xAndy(x0,y1), color);
}

function rebuildBuffer(){
    const trianglePoints: any[] = [];
    for (const target of targets){
        if (!target.alive) continue;
        pushTriangle(trianglePoints, target.x, target.y, target.size, target.color);
    }

    gl.bindBuffer(gl.ARRAY_BUFFER, bufferId);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(trianglePoints), gl.STATIC_DRAW);

}

function rebuildCrosshairBuffer(){
    const s = 0.03;
    const color = new vec4(1,1,1,1);
    const xAndy = (x:number, y:number) => new vec4(x,y,0,1);

    const verts:any[] = [
        xAndy(aimX - s, aimY), color, xAndy(aimX + s, aimY), color,
        xAndy(aimX, aimY - s), color, xAndy(aimX, aimY + s), color,
    ];

    gl.bindBuffer(gl.ARRAY_BUFFER, crosshairBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(verts), gl.STATIC_DRAW);

}

//update the feedback text field
function updateFeedback(){
    //filter is an awesome function
    const alive: number = targets.filter(t => t.alive).length;
    const txt = document.getElementById("feedback");
    if (alive > 0) {
        txt.textContent = `Targets left ${alive} - Press 'm' to ${motionEnabled ? 'stop' : 'start'} motion - Shots: ${shotsFired}`;
    } else {
        txt.textContent = `All targets down! Shots: ${shotsFired}. Click Reset to play again.`;
    }
}

function update(dt: number){
    if (!motionEnabled) return;

    for (const target of targets){
        if (!target.alive) continue;
        target.x += target.vx * dt;
        target.y += target.vy * dt;

        //bounce
        if(target.x + target.size > 1) {target.x = 1 - target.size; target.vx *= -1;}
        if(target.x - target.size < -1) {target.x = -1 + target.size; target.vx *= -1;}
        if(target.y + target.size > 1) {target.y = 1 - target.size; target.vy *= -1;}
        if(target.y - target.size < -1) {target.y = -1 + target.size; target.vy *= -1;}
    }
    rebuildBuffer();
}

function gameLoop(){
    const now = performance.now();
    const dt = (now - lastTime) / 1000;
    lastTime = now;

    update(dt);
    render();
}



function render(){
    //start by clearing all buffers
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.bindBuffer(gl.ARRAY_BUFFER, bufferId);

    const vPosition = gl.getAttribLocation(program, 'vPosition');
    const vColor = gl.getAttribLocation(program, 'vColor');

    //draw targets
    gl.bindBuffer(gl.ARRAY_BUFFER, bufferId);
    gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 32, 0);
    gl.enableVertexAttribArray(vPosition);
    gl.vertexAttribPointer(vColor, 4, gl.FLOAT, false, 32, 16);
    gl.enableVertexAttribArray(vColor);

    let liveVerts: number = 0;
    for (const target of targets){
        if (target.alive) {
            liveVerts += 6;
        }
    }
    gl.drawArrays(gl.TRIANGLES, 0, liveVerts);

    //draw crosshair
    gl.bindBuffer(gl.ARRAY_BUFFER, crosshairBuffer);
    gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 32, 0);
    gl.enableVertexAttribArray(vPosition);
    gl.vertexAttribPointer(vColor, 4, gl.FLOAT, false, 32, 16);
    gl.enableVertexAttribArray(vColor);


    gl.drawArrays(gl.LINES, 0,4);
}

function getRandomInt(min: number, max: number): number {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
