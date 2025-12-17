import {initFileShaders, mat4, vec4} from './helperfunctions.js';
import {drawWheels, drawBody, drawRand, drawBackground} from './drawers.js';
import {makeWheel, bodyPtsToModel, randPtsToModel, backPtsToModel, buildBuffer, genRanCubeLocs, makeLightPatch} from './shapes.js';
import {makeCameras, makeLights} from "./lightsAndCameras.js";
import {radToRGB} from "./radiosity.js";
import {patchIndexPerVertex} from "./patches.js";

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

//<editor-fold desc="Motion variables, constants, & struct">
let startIndex: number;
let numWheelPts: number;
let numBodyPts: number;
let numRandPts: number;
let numBackPts: number;

//Car variables and constants
type carState = {
    xLoc: number;
    zLoc: number;
    speed: number; //units per frame -forward, +backward
    steerAngle: number; //degrees -left, +right
    left: boolean; //are we turning left?
    right: boolean; //are we turning right?
    wheelSpin: number; //degrees
    yaw: number; //degrees
};

export let car: carState = {xLoc: 0, zLoc: 0, speed: 0, steerAngle: 0, left: false, right: false, wheelSpin: 0, yaw: 0};

let headRotateLeft: boolean = false;
let headRotateRight: boolean = false;
let headAngle: number = 0;

const driveSpeed: number = 2;
const maxSteer: number = 45 ; //60 degrees
const steerRate: number = 90; //90 deg per sec
//</editor-fold>

//<editor-fold desc="Camera variables">
let fov: number = 45; //or zoom
let dolly: number = 10;
let whichCam: number = 1; //default to camrea 1
let camFocus: boolean = true; //default to center of stage
//</editor-fold>

//<editor-fold desc="Light booleans">
let headLightBool: boolean = true;
let bigLightBool: boolean = true;
let emerLightBool: boolean = true;
//</editor-fold>

//<editor-fold desc="Radiosity Vars">
let levels: number = 1;
let radBool: boolean = true;
let useRad:WebGLUniformLocation;
let patchRad:WebGLUniformLocation;
let vPatchIndex: GLint;
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
    program = initFileShaders(gl, "./shaders/vshader.glsl", "./shaders/fshader.glsl");
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
    patchRad = gl.getUniformLocation(program, "patchRad");
    vPatchIndex = gl.getAttribLocation(program, "vPatchIndex");
    //</editor-fold>

    window.addEventListener("keydown", keyDownListener);

    window.addEventListener("keyup", keyUpListener);

    //only have to do this once
    genRanCubeLocs();

    makeLightPatch(new vec4(0, 5, 0, 1),
        new vec4(0, -1, 0, 0),
        2
    );


    // numWheelPts =  makeWheel(8);
    numWheelPts = 0

    numBodyPts = bodyPtsToModel(levels);
    console.log("body pts: ", numBodyPts);
    // numBodyPts = 0;

    numRandPts = randPtsToModel(levels);
    console.log("Rand pts: ", numRandPts);
    // numRandPts = 0;

    numBackPts = backPtsToModel(levels);
    console.log("back pts: ", numBackPts);
    //numBackPts = 0;

    buildBuffer(gl, bufferId, vPosition, vNormal);

    //<editor-fold desc="Radiosity">
    if (!radRGB) {
        radRGB = radToRGB();
    }
    console.log("radRGB:", radRGB);

    patchIndexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, patchIndexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(patchIndexPerVertex), gl.STATIC_DRAW);

    gl.enableVertexAttribArray(vPatchIndex);
    gl.vertexAttribPointer(vPatchIndex, 1, gl.FLOAT, false, 0,0);

    //</editor-fold>

    window.setInterval(update, 16); //target 60 frames per second
};

function keyDownListener(event:KeyboardEvent) {
    switch (event.key) {
        case "ArrowUp":
            if(!event.repeat) car.speed = driveSpeed;
            break;
        case "ArrowDown":
            if(!event.repeat) car.speed = -driveSpeed;
            break;
        case "ArrowLeft":
            car.left = true;
            break;
        case "ArrowRight":
            car.right = true;
            break;
        case " ":
            if (!event.repeat){
                car.speed = 0;
                car.left = false
                car.right = false;
            }
            break;
        case "z":
            headRotateLeft = true;
            break;
        case "x":
            headRotateRight = true;
            break;
        case "s":
            if (dolly <= 50){
                dolly += 1;
            } else {
                dolly = 50;
            }
            break;
        case "a":
            if (dolly >= -50){
                dolly -= 1;
            } else {
                dolly = -50;
            }
            break;
        case "w":
            if (fov <= 180){
                fov += 1;
            } else {
                fov = 180;
            }
            break;
        case "q":
            if (fov >= 0){
                fov -= 1;
            } else {
                fov = 0;
            }
            break;
        case "f":
            camFocus = !camFocus;
            break;
        case "r":
            dolly = 10;
            fov = 45
            camFocus = true;
            whichCam = 1;
            break;
        case "1":
            whichCam = 1;
            break;
        case "2":
            whichCam = 2;
            break;
        case "3":
            whichCam = 3;
            break;
        case "0":
            bigLightBool = !bigLightBool;
            break;
        case "9":
            headLightBool = !headLightBool;
            break;
        case "8":
            emerLightBool = !emerLightBool;
            break;
        case "t":
            radBool = !radBool;
            break;
    }
}

function keyUpListener(event:KeyboardEvent) {
    switch (event.key) {
        case "ArrowLeft":
            car.left = false;
            break;
        case "ArrowRight":
            car.right = false;
            break;
        case "z":
            headRotateLeft = false;
            break;
        case "x":
            headRotateRight = false;
            break;
    }
}

function update(){
    const dt: number = 1/60;

    //rotate head
    if (headRotateLeft && !headRotateRight) {
        headAngle += steerRate * dt; //deg
    }
    else if (headRotateRight && !headRotateLeft) {
        headAngle -= steerRate * dt; //deg
    }

    //wheel spin
    if (car.speed != 0 ){
        const angVelDeg = (car.speed / 0.25) * 180 / Math.PI; //0.25 is wheel Radius
        car.wheelSpin = (car.wheelSpin + angVelDeg * dt) % 360;
    }

    //turn the wheels
    let steerInput = 0;
    if (car.left && !car.right) {
        steerInput = 1;
    }
    else if (car.right && !car.left) {
        steerInput = -1;
    }

    //Steering angle degrees
    if (steerInput != 0){
        car.steerAngle += steerInput * steerRate * dt; //deg

        if (car.steerAngle > maxSteer) car.steerAngle = maxSteer;
        if (car.steerAngle < -maxSteer) car.steerAngle = -maxSteer;
    }

    //yaw
    const wheelBase = 1.5;
    if (car.speed != 0) {
        const distance = car.speed * dt;
        const steerRad = car.steerAngle * Math.PI / 180;
        const yawRad   = car.yaw * Math.PI / 180;

        // Forward unit vector
        const fwdX = -Math.sin(yawRad);
        const fwdZ = -Math.cos(yawRad);

        // Get front axle world position from current center point
        let xr = car.xLoc - (wheelBase * 0.5) * fwdX;
        let zr = car.zLoc - (wheelBase * 0.5) * fwdZ;

        //Heading change
        const dYaw = (distance / wheelBase) * Math.tan(steerRad); // radians

        // midpoint heading for translation
        const yawMid = yawRad + 0.5 * dYaw;
        const fwdMidX = -Math.sin(yawMid);
        const fwdMidZ = -Math.cos(yawMid);

        // Move the REAR axle along the body axis
        xr += distance * fwdMidX;
        zr += distance * fwdMidZ;

        // Commit new heading
        const yawNew = yawRad + dYaw;
        car.yaw = yawNew * 180 / Math.PI;

        // Recompute center point from the updated front axle
        const fwdNewX = -Math.sin(yawNew);
        const fwdNewZ = -Math.cos(yawNew);
        let nextX: number = xr + (wheelBase * 0.5) * fwdNewX;
        let nextZ: number = zr + (wheelBase * 0.5) * fwdNewZ;

        if (Math.abs(nextX) > 9 || Math.abs(nextZ) > 9) {
            car.speed = 0;

            nextX = Math.max(-10, Math.min(10,nextX))
            nextZ = Math.max(-10, Math.min(10,nextZ))
        }

        car.xLoc = nextX;
        car.zLoc = nextZ;
    }

    requestAnimationFrame(render);
}

function render() {
    //start by clearing any previous data for both color and depth
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);

    gl.uniform4fv(ambient_light, [0.2, 0.2, 0.2, 1.0]);

    let view: mat4 = makeCameras(gl, uproj, canvas, car, headAngle, fov, dolly, whichCam, camFocus);

    if (!radBool) {
        //Phong
        gl.uniform1i(useRad, 0.0)
        makeLights(gl, program, view, car, headLightBool, bigLightBool, emerLightBool);
    } else {
        //Rad
        gl.uniform1i(useRad, 1.0)
        gl.uniform3fv(patchRad, radRGB)
        gl.uniform4fv(ambient_light, [0.1, 0.1, 0.1, 1.0]);
    }

    startIndex = 0;
    //drawWheels(view, car, gl, umv, bufferId, startIndex, numWheelPts, vAmbientDiffuseColor, vSpecularColor, vSpecularExponent);
    startIndex += numWheelPts;

    drawBody(view, gl, umv, bufferId, headAngle, startIndex, numBodyPts, vAmbientDiffuseColor, vSpecularColor, vSpecularExponent);
    startIndex += numBodyPts;

    drawRand(view, gl, umv, bufferId, headAngle, startIndex, numRandPts, vAmbientDiffuseColor, vSpecularColor, vSpecularExponent);
    startIndex += numRandPts

    drawBackground(view, gl, umv, bufferId, startIndex, vAmbientDiffuseColor, vSpecularColor, vSpecularExponent, levels);

}


