import {initFileShaders, lookAt, mat4, vec4, perspective, vec3} from './helperfunctions.js';
import {drawBackground} from './drawers.js';
import {backPtsToModel, buildBuffer, makeLightPatch, resetGeometry} from './shapes.js';
import {radToRGB} from "./radiosity.js";
import {patches, patchIndexPerVertex, makeF, resetPatches} from "./patches.js";

"use strict";

//<editor-fold desc="Web GL variables">
    let gl:WebGLRenderingContext;
    let canvas:HTMLCanvasElement;
    let program:WebGLProgram;
    let bufferId:WebGLBuffer;
    let patchIndexBuffer: WebGLBuffer;

    //uniform locations
    let umv:WebGLUniformLocation; //index of model_view in shader program
    let uproj:WebGLUniformLocation; //index of projection in shader program
    let ambient_light:WebGLUniformLocation;
//</editor-fold>

//<editor-fold desc="per vertex variables">
    //shader variable indices for per vertex and material attributes
    let vPosition:GLint;
    let vNormal:GLint;
    let vAmbientDiffuseColor:GLint;
    let vSpecularColor:GLint;
    let vSpecularExponent:GLint;
//</editor-fold>

//<editor-fold desc="Camera variables">
    let fov: number = 120; //or zoom

    // Camera position
    let camX: number = 0;
    let camY: number = 5;
    let camZ: number = 0;

    // Camera rotation (in degrees)
    let yaw: number = -90;   // Left/right rotation (start facing -Z)
    let pitch: number = 0;   // Up/down rotation

    // Mouse control
    let isMouseDown: boolean = false;
    let lastMouseX: number = 0;
    let lastMouseY: number = 0;
    let mouseSensitivity: number = 0.1;

    // Movement
    let moveSpeed: number = 0.3;
    let keysPressed: { [key: string]: boolean } = {};
//</editor-fold>

//<editor-fold desc="Radiosity Vars">
    let levels: number = 2;
    let iterations: number = 100;
    let lightIntensity: number = 100;
    let radBool: boolean = true;
    let useRad:WebGLUniformLocation;
    let vRadColor: GLint;
    let radRGB: Float32Array;
//</editor-fold>

window.onload = function init() {
    //reference to canvas element in the html
    canvas = document.getElementById("gl-canvas") as HTMLCanvasElement;
    //WebGL 2 context for the canvas
    gl = canvas.getContext('webgl2') as WebGLRenderingContext;
    if (!gl) {
        alert("WebGL isn't available");
    }

    //background color
    gl.clearColor(0.55, 0.75, 0.95, 1.0); //light blue sky

    //avoids having objects that are behind other objects show up anyway
    gl.enable(gl.DEPTH_TEST);

    //Take vertex and fragment shaders and compile them into a shader program
    program = initFileShaders(gl, "../shaders/vshader.glsl", "../shaders/fshader.glsl");
    gl.useProgram(program);

    //<editor-fold desc="Getting uniform locations">
    umv = gl.getUniformLocation(program, "model_view");
    uproj = gl.getUniformLocation(program, "projection");
    ambient_light = gl.getUniformLocation(program, "ambient_light");
    vPosition = gl.getAttribLocation(program, "vPosition");
    vNormal = gl.getAttribLocation(program, "vNormal");
    vAmbientDiffuseColor = gl.getAttribLocation(program, "vAmbientDiffuseColor");
    vSpecularColor = gl.getAttribLocation(program, "vSpecularColor");
    vSpecularExponent = gl.getAttribLocation(program, "vSpecularExponent");

    useRad = gl.getUniformLocation(program, "useRad");
    vRadColor = gl.getAttribLocation(program, "vRadColor");
    //</editor-fold>

    // Keyboard controls
    window.addEventListener("keydown", keyDownListener);
    window.addEventListener("keyup", keyUpListener);

    // Mouse controls
    canvas.addEventListener("mousedown", mouseDownListener);
    canvas.addEventListener("mouseup", mouseUpListener);
    canvas.addEventListener("mousemove", mouseMoveListener);
    canvas.addEventListener("mouseleave", mouseUpListener);

    // Optional: Pointer lock for smoother mouse look
    canvas.addEventListener("click", () => {
        canvas.requestPointerLock();
    });
    document.addEventListener("pointerlockchange", pointerLockChange);
    document.addEventListener("mousemove", pointerLockMouseMove);

    setupHTML()

    buildScene();

    window.setInterval(update, 16); //target 60 frames per second
};

function setupHTML(){
    // Levels slider
    const levelsSlider = document.getElementById("levels-slider") as HTMLInputElement;
    const levelsValue = document.getElementById("levels-value") as HTMLSpanElement;
    const warning = document.getElementById("warning") as HTMLDivElement;

    if (levelsSlider) {
        levelsSlider.value = levels.toString();
        levelsSlider.addEventListener("input", () => {
            const newLevel: number = parseInt(levelsSlider.value);
            levelsValue.textContent = newLevel.toString();

            // Show warning for high levels
            if (newLevel >= 4) {
                warning.style.display = "block";
            } else {
                warning.style.display = "none";
            }
        });
    }

    // Iterations slider
    const iterSlider = document.getElementById("iterations-slider") as HTMLInputElement;
    const iterValue = document.getElementById("iterations-value") as HTMLSpanElement;

    if (iterSlider) {
        iterSlider.value = iterations.toString();
        iterSlider.addEventListener("input", () => {
            iterValue.textContent = iterSlider.value;
        });
    }

    // Light intensity slider
    const lightSlider = document.getElementById("light-slider") as HTMLInputElement;
    const lightValue = document.getElementById("light-value") as HTMLSpanElement;

    if (lightSlider) {
        lightSlider.value = lightIntensity.toString();
        lightSlider.addEventListener("input", () => {
            lightValue.textContent = lightSlider.value;
        });
    }

    // Rebuild button
    const rebuildBtn = document.getElementById("rebuild-btn") as HTMLButtonElement;
    if (rebuildBtn) {
        rebuildBtn.addEventListener("click", () => {
            const newLevels: number = parseInt(levelsSlider?.value || "2");
            const newIters: number = parseInt(iterSlider?.value || "100");

            levels = newLevels;
            iterations = newIters;

            rebuildBtn.disabled = true;
            rebuildBtn.textContent = "Building...";

            // Use setTimeout to allow UI to update before heavy computation
            setTimeout(() => {
                buildScene();
                rebuildBtn.disabled = false;
                rebuildBtn.textContent = "Rebuild Radiosity";
            }, 50);
        });
    }
}

function buildScene() {
    // Reset patch data
    resetPatches();
    resetGeometry();

    // Rebuild
    makeLightPatch(
        new vec4(0, 10, 0, 1),
        new vec4(0, -1, 0, 0),
        1,
        new vec3(0, 0, 0),
        new vec3(lightIntensity, lightIntensity, lightIntensity),
    );

    backPtsToModel(levels);

    buildBuffer(gl, bufferId, vPosition, vNormal);

    let F: Float32Array = makeF();

    buildRadiosityBuffer(F);

    updateStatus();
}

function buildRadiosityBuffer(F: Float32Array) {
    radRGB = radToRGB(F, iterations);

    const radPerVertex = new Float32Array(patchIndexPerVertex.length * 3);

    for (let v: number = 0; v < patchIndexPerVertex.length; v++) {
        const p: number = patchIndexPerVertex[v];
        radPerVertex[3*v+0] = radRGB[3*p+0];
        radPerVertex[3*v+1] = radRGB[3*p+1];
        radPerVertex[3*v+2] = radRGB[3*p+2];
    }

    const radBuf: WebGLBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, radBuf);
    gl.bufferData(gl.ARRAY_BUFFER, radPerVertex, gl.STATIC_DRAW);

    gl.enableVertexAttribArray(vRadColor);
    gl.vertexAttribPointer(vRadColor, 3, gl.FLOAT, false, 0, 0);

    patchIndexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, patchIndexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(patchIndexPerVertex), gl.STATIC_DRAW);
}

function updateStatus() {
    const statusMode = document.getElementById("status-mode");
    const statusLevel = document.getElementById("status-level");
    const statusPatches = document.getElementById("status-patches");

    if (statusMode) {
        if (radBool) {
            statusMode.textContent = "Radiosity";
        } else {
            statusMode.textContent = "Phong";
        }
    }
    if (statusLevel) {
        statusLevel.textContent = levels.toString();
    }
    if (statusPatches) {
        statusPatches.textContent = patches.length.toString();
    }
}

function updateCameraStatus() {
    const statusPos = document.getElementById("status-pos");
    if (statusPos) {
        statusPos.textContent = `${camX.toFixed(1)}, ${camY.toFixed(1)}, ${camZ.toFixed(1)}`;
    }
}

//<editor-fold desc="Mouse Listeners">
function mouseDownListener(event: MouseEvent) {
    isMouseDown = true;
    lastMouseX = event.clientX;
    lastMouseY = event.clientY;
}

function mouseUpListener() {
    isMouseDown = false;
}

function mouseMoveListener(event: MouseEvent) {
    if (!isMouseDown) return;

    // Skip if pointer is locked
    if (document.pointerLockElement === canvas) return;

    const deltaX: number = event.clientX - lastMouseX;
    const deltaY: number = event.clientY - lastMouseY;

    yaw += deltaX * mouseSensitivity;
    pitch -= deltaY * mouseSensitivity;

    // Clamp pitch to prevent flipping
    pitch = Math.max(-89, Math.min(89, pitch));

    lastMouseX = event.clientX;
    lastMouseY = event.clientY;
}

function pointerLockChange() {
    if (document.pointerLockElement === canvas) {
        console.log("Pointer locked - move mouse to look around");
    }
}

function pointerLockMouseMove(event: MouseEvent) {
    if (document.pointerLockElement !== canvas) return;

    const deltaX: number = event.movementX;
    const deltaY: number = event.movementY;

    yaw += deltaX * mouseSensitivity;
    pitch -= deltaY * mouseSensitivity;

    // Clamp pitch to prevent flipping
    pitch = Math.max(-89, Math.min(89, pitch));
}
//</editor-fold>

//<editor-fold desc="Keyboard Listeners">
function keyDownListener(event: KeyboardEvent) {
    keysPressed[event.key.toLowerCase()] = true;

    switch (event.key.toLowerCase()) {
        case "t":
            radBool = !radBool;
            break;
        case "r":
            // Reset camera
            camX = 0;
            camY = 5;
            camZ = 15;
            yaw = -90;
            pitch = 0;
            fov = 120;
            break;
        case "q":
            if (fov > 10) fov -= 5;
            break;
        case "e":
            if (fov < 170) fov += 5;
            break;
    }
}

function keyUpListener(event: KeyboardEvent) {
    keysPressed[event.key.toLowerCase()] = false;
}
//</editor-fold>

function updateMovement() {
    // Calculate forward direction from yaw
    const forwardX: number = Math.cos(yaw * Math.PI / 180);
    const forwardZ: number = Math.sin(yaw * Math.PI / 180);

    // Calculate right direction
    const rightX: number = Math.cos((yaw + 90) * Math.PI / 180);
    const rightZ: number = Math.sin((yaw + 90) * Math.PI / 180);

    let moved: boolean = false;

    // Arrow keys for movement
    if (keysPressed["arrowup"] || keysPressed["w"]) {
        camX += forwardX * moveSpeed;
        camZ += forwardZ * moveSpeed;
        moved = true;
    }
    if (keysPressed["arrowdown"] || keysPressed["s"]) {
        camX -= forwardX * moveSpeed;
        camZ -= forwardZ * moveSpeed;
        moved = true;
    }
    if (keysPressed["arrowleft"] || keysPressed["a"]) {
        camX -= rightX * moveSpeed;
        camZ -= rightZ * moveSpeed;
        moved = true;
    }
    if (keysPressed["arrowright"] || keysPressed["d"]) {
        camX += rightX * moveSpeed;
        camZ += rightZ * moveSpeed;
        moved = true;
    }

    // Up/down movement (space and shift)
    if (keysPressed[" "]) {
        camY += moveSpeed;
        moved = true;
    }
    if (keysPressed["shift"]) {
        camY -= moveSpeed;
        moved = true;
    }

    if (moved) {
        updateCameraStatus();
    }
}

function update() {
    updateMovement();
    render();
}

function render() {
    //start by clearing any previous data for both color and depth
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);

    gl.uniform4fv(ambient_light, [0.2, 0.2, 0.2, 1.0]);

    // Calculate look direction from yaw and pitch
    const lookDirX: number = Math.cos(pitch * Math.PI / 180) * Math.cos(yaw * Math.PI / 180);
    const lookDirY: number = Math.sin(pitch * Math.PI / 180);
    const lookDirZ: number = Math.cos(pitch * Math.PI / 180) * Math.sin(yaw * Math.PI / 180);

    // Camera position
    const eye = new vec4(camX, camY, camZ, 1);

    // Target
    const targetDir = new vec4(
        camX + lookDirX,
        camY + lookDirY,
        camZ + lookDirZ,
        1
    );

    let p: mat4 = perspective(fov, canvas.clientWidth / canvas.clientHeight, 1.0, 50.0);
    gl.uniformMatrix4fv(uproj, false, p.flatten());

    let view: mat4 = lookAt(eye, targetDir, new vec4(0,1,0,0));

    if (!radBool) {
        //Phong
        gl.uniform1i(useRad, 0.0)
    } else {
        //Rad
        gl.uniform1i(useRad, 1.0)
        gl.uniform4fv(ambient_light, [0.1, 0.1, 0.1, 1.0]);
    }

    drawBackground(view, gl, umv, bufferId, 0, vAmbientDiffuseColor, vSpecularColor, vSpecularExponent, levels);
}


