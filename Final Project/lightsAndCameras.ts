import {vec4, mat4, perspective, lookAt, translate, rotateY} from './helperfunctions.js';
import {carState} from "./finalproject";

//Camera Vars
let mvOG: mat4;
let p: mat4
let targetDir: vec4;
let yawRad: number;
let eyeLocalY: number;
let eyeForward: number;
let camPos: vec4;
let forward: vec4;
//Light Vars
let spin: number = 0;

export function makeCameras(gl: WebGLRenderingContext, uproj:WebGLUniformLocation, canvas, car: carState, headAngle: number, fov: number, dolly: number, whichCam: number, camFocus: boolean){
    switch (whichCam){
       case 1:
           freeCam(gl,uproj,canvas, car, fov, dolly, camFocus);
           break;
       case 2: //viewpoint camera (between the eyes)
           eyeCam(gl, uproj, canvas, car, headAngle);
           break;
       case 3: //chase camera
           chaseCam(gl, uproj, canvas, car);
           break;
    }
    return mvOG
}

function freeCam (gl: WebGLRenderingContext, uproj:WebGLUniformLocation, canvas, car: carState, fov: number, dolly: number, camFocus: boolean){
    //projection matrices
    p = perspective(fov, canvas.clientWidth / canvas.clientHeight, 1.0, 50.0);
    gl.uniformMatrix4fv(uproj, false, p.flatten());

    //set the target direction of the camera
    if (camFocus){
        targetDir = new vec4(0,0,0,1); //center of world
    } else {
        targetDir = new vec4(car.xLoc, 0.2, car.zLoc, 1); //center of car at any given time
    }
    //OG model View Matrix
    mvOG = lookAt(new vec4(0,5,dolly,1), targetDir, new vec4(0,1,0,0));

}

function eyeCam(gl: WebGLRenderingContext, uproj:WebGLUniformLocation, canvas, car: carState, headAngle: number){
    //projection matrices
    p = perspective(45, canvas.clientWidth / canvas.clientHeight, 1, 50.0);
    gl.uniformMatrix4fv(uproj, false, p.flatten());

    //Finding the Cameras position
    yawRad = (car.yaw + headAngle) * Math.PI / 180;

    eyeLocalY = 0.2 + 0.5 //car base at 0.2 + head center 0.5
    eyeForward = 0.35; //distance of the eyes from the head center

    //Rotate the local offset (0, 0.5, 0.35) by head yaw and add the cars world position
    //for a rotation newX = oldX*cos + oldZ*sin, newZ = -oldX*sin + z*cos
    //here the oldX = 0 and oldZ = -eyeforward
    camPos = new vec4(car.xLoc - eyeForward * Math.sin(yawRad), eyeForward, car.zLoc - eyeForward * Math.cos(yawRad),1)

    //Finding the target direction
    //rotate the starting direction (0,0,0) by the head yaw using the same formulas as before
    forward = new vec4(-Math.sin(yawRad), 0, -Math.cos(yawRad), 0);
    targetDir = new vec4(camPos[0] + forward[0], camPos[1] + forward[1], camPos[2]+ forward[2], 1)

    //OG model View Matrix
    mvOG = lookAt(camPos, targetDir, new vec4(0,1,0,0));

}

function chaseCam(gl: WebGLRenderingContext, uproj:WebGLUniformLocation, canvas, car: carState){
    //projection matrices
    p = perspective(45, canvas.clientWidth / canvas.clientHeight, 1, 50.0);
    gl.uniformMatrix4fv(uproj, false, p.flatten());

    //Finding the Cameras position
    yawRad = car.yaw * Math.PI / 180;

    const backOffset: number = 4;       //how far behind we are looking
    const yOffset: number = 0.2 + 2; //how far above the ground are we looking. 0.2 is car base
    const lookAhead: number = 4.0;      //how far to look forward
    const pitchDownDeg: number = 20;    //slight downward tilt to see roof
    const pitchDownRad: number = pitchDownDeg * Math.PI / 180;

    //Rotate the local offset (0, 1.30, 4) by car yaw and add the cars world position
    //for a rotation newX = oldX*cos + oldZ*sin, newZ = -oldX*sin + z*cos
    //here the oldX = 0 and oldZ = -backOffset
    const fwdX: number = -Math.sin(yawRad); //negative so we look at back of car
    const fwdZ: number = -Math.cos(yawRad); //negative so we look at back of car
    camPos = new vec4(car.xLoc - backOffset * fwdX, yOffset, car.zLoc - backOffset * fwdZ,1)

    //finding forward direction
    //Want to keep the horizontal heading mostly the same, but tilt the camera down
    const horiz: number = Math.cos(pitchDownRad);
    forward = new vec4(
        fwdX * horiz,            // preserve yawed x direction, reduced by cos(pitch)
        -Math.sin(pitchDownRad), // add a small negative Y to look down at the car
        fwdZ * horiz,            // preserve yawed z direction, reduced by cos(pitch)
        0
    );

    //Finding the target direction with a slight pitch
    //rotate the starting direction (0,0,0) by the head yaw using the same formulas as before
    //Look at a point, some distance lookAhead along the direction vector
    targetDir = new vec4(camPos[0] + forward[0] * lookAhead, camPos[1] + forward[1] * lookAhead, camPos[2] + forward[2] * lookAhead, 1)

    //OG model View Matrix
    mvOG = lookAt(camPos, targetDir, new vec4(0,1,0,0));
}

export function makeLights(gl: WebGLRenderingContext, program: WebGLProgram, view: mat4, car: carState, headLightBool: boolean, bigLightBool: boolean, emerLightBool: boolean){
    const eyePositions: number[] = [];
    const colors: number[] = [];
    const eyeDirections: number[] = [];
    const cutoffs: number[] = [];

    //<editor-fold desc="headlights">
    //make the car's model matrix, then place lights using local positions:
    const model: mat4 = translate(car.xLoc, 0.2, car.zLoc).mult(rotateY(car.yaw));

    const headLightPositions: vec4[] = [
        new vec4(-0.20, 0.15, 0, 1),
        new vec4(0.20, 0.15, 0, 1)
    ];
    const headLightDirections: vec4[] = [
        new vec4(0,0,-1,0),
        new vec4(0,0,-1,0)
    ]; // w=0 for directions

    for (let i: number = 0; i < 2; i++){
        const worldPosition: vec4 = model.mult(headLightPositions[i]);      // car-local -> world
        const worldDirection: vec4 = model.mult(headLightDirections[i]);    // car-local dir -> world (w=0)
        pushPosEye(view, worldPosition, eyePositions);                      // world -> eye
        pushDirEye(view, worldDirection, eyeDirections);                    // world -> eye
        pushCutoffCos(cutoffs, 10);
        if (headLightBool) {
            pushColor(colors,0.25,0.25,0.25,1);
        } else {
            pushColor(colors,0,0,0,1);
        }
    }
    //</editor-fold>

    //<editor-fold desc="big light">
    const worldPosition = new vec4(0,10,0,1);
    const worldDirection = new vec4(0,-1,0,0);
    pushPosEye(view, worldPosition, eyePositions);              // world -> eye
    pushDirEye(view, worldDirection, eyeDirections);            // world -> eye
    pushCutoffCos(cutoffs, 90);
    if (bigLightBool) {
        pushColor(colors,0.5,0.5,0.5,1);
    } else {
        pushColor(colors, 0,0,0,1);
    }
    //</editor-fold>

    //<editor-fold desc="emer lights">
    const emerLightPositions: vec4[] = [
        new vec4(0.0, 0.5, 0, 1),
        new vec4(0.0, 0.5, 0, 1)
    ];
    const emerLightDirections: vec4[] = [
        new vec4(0,0,-1,0),
        new vec4(0,0, 1,0)
    ];

    spin += 1;
    const spinM:mat4 = rotateY(spin);
    for (let i: number = 0; i < 2;i++){
        const worldPosition: vec4 = model.mult(emerLightPositions[i]);      // car-local -> world
        const localDirection: vec4 = spinM.mult(emerLightDirections[i]);
        const worldDirection: vec4 = model.mult(localDirection);    // car-local dir -> world (w=0)
        pushPosEye(view, worldPosition, eyePositions);                      // world -> eye
        pushDirEye(view, worldDirection, eyeDirections);                    // world -> eye
        pushCutoffCos(cutoffs, 30);
    }
    if (emerLightBool){
        pushColor(colors,0.5,0.0,0.0,1);   // red
        pushColor(colors, 0.0,0.0,0.5,1);   // blue
    } else {
        pushColor(colors,0,0,0,1);
        pushColor(colors, 0,0,0,1);
    }
    //</editor-fold>

    // Upload arrays beginning
    gl.uniform4fv(gl.getUniformLocation(program, "light_position[0]"), new Float32Array(eyePositions));
    gl.uniform4fv(gl.getUniformLocation(program, "light_color[0]"),    new Float32Array(colors));
    gl.uniform3fv(gl.getUniformLocation(program, "light_direction[0]"),new Float32Array(eyeDirections));
    gl.uniform1fv(gl.getUniformLocation(program, "light_cutoff[0]"),   new Float32Array(cutoffs));
}

//Helpers for makeLights
/**
 * Pushes a world-space light position into the packed eye-space array.
 * Uses w=1 so camera translation & rotation are applied.
 */
export function pushPosEye(view: mat4, pWorld: vec4, outPositions: number[]): void {
    const pEye = view.mult(pWorld); // w=1 kept from pWorld
    outPositions.push(pEye[0], pEye[1], pEye[2], 1);
}

/**
 * Pushes a world-space light direction into the packed eye-space array.
 * Treats the input as a direction so only rotation is applied.
 * Normalizes before pushing.
 */
export function pushDirEye(view: mat4, dWorld: vec4, outDirections: number[]): void {
    // ensure w=0 for direction
    const dWorldDir = new vec4(dWorld[0], dWorld[1], dWorld[2], 0);
    const dEye4 = view.mult(dWorldDir);
    const len = Math.hypot(dEye4[0], dEye4[1], dEye4[2]) || 1;
    outDirections.push(dEye4[0] / len, dEye4[1] / len, dEye4[2]/ len);
}

//Pushes an RGBA color into the packed color array
export function pushColor(outColors: number[], r: number, g: number, b: number, a = 1): void {
    outColors.push(r, g, b, a);
}

//Pushes cos(cutoffDegrees) into the packed cutoff array
export function pushCutoffCos(outCutoffs: number[], deg: number): void {
    outCutoffs.push(Math.cos((deg * Math.PI) / 180));
}
