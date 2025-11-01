import {mat4, translate, rotateY, rotateZ, scalem} from './helperfunctions.js';

import {carState} from './project4.js';

let objX: number[] = [];
let objYScale: number[] = [];
let objZ: number[] = [];
let objR: number[] = [];
let objG: number[] = [];
let objB: number[] = [];

export function drawBackground(mvOG:mat4, gl: WebGLRenderingContext, umv: WebGLUniformLocation, bufferId: WebGLBuffer, startIndex: number, countLength: number, vAmbientDiffuseColor: GLint, vSpecularColor: GLint, vSpecularExponent: GLint){
    let mv:mat4 = mvOG;

    //green and not very shiny
    gl.vertexAttrib4fv(vAmbientDiffuseColor, [0.1, .39, 0.1, 1]);
    gl.vertexAttrib4fv(vSpecularColor, [1.0, 1.0, 1.0, 1.0]);
    gl.vertexAttrib1f(vSpecularExponent, 15.0);

    //multiply matrix to the right of lookAt matrix
    mv = mv.mult(scalem(10, 1,10))

    //send over model view matrix as a uniform
    gl.uniformMatrix4fv(umv,false, mv.flatten());

    gl.bindBuffer(gl.ARRAY_BUFFER, bufferId);

    gl.drawArrays(gl.TRIANGLES, startIndex, countLength);
}

export function drawWheels(mvOG:mat4, car: carState, gl: WebGLRenderingContext, umv: WebGLUniformLocation, bufferId: WebGLBuffer, startIndex: number, countLength: number, vAmbientDiffuseColor: GLint, vSpecularColor: GLint, vSpecularExponent: GLint) {
    let mv:mat4 = mvOG;

    //black and not very shiny
    gl.vertexAttrib4fv(vAmbientDiffuseColor, [0.1, 0.1, 0.1, 1]);
    gl.vertexAttrib4fv(vSpecularColor, [1.0, 1.0, 1.0, 1.0]);
    gl.vertexAttrib1f(vSpecularExponent, 5.0);

    //Translation locations for x and z coords for each tire
    //0: front left, 1: front right, 2: back left, 3: back right
    let xLocs: number[] = [-0.5, 0.5, -0.5, 0.5];
    let zLocs: number[] = [-0.75, -0.75, 0.75, 0.75];

    for (let i: number = 0; i < 4; i++){
        mv = mvOG
        //multiply matrix to the right of lookAt matrix
        mv = mv.mult(translate(car.xLoc, 0.0, car.zLoc));      // place wheel in world
        mv = mv.mult(rotateY(car.yaw));                           // orient wheel
        mv = mv.mult(translate(xLocs[i], 0, zLocs[i]));        // move to this wheel hub
        if (i < 2){ //only steer on the front two tires
            mv = mv.mult(rotateY(car.steerAngle));                // steer about car's up axis
        }
        mv = mv.mult(rotateZ(90));                          // align cylinder's +Y to axle +X
        mv = mv.mult(rotateY(car.wheelSpin));                     // spin the wheel

        //send over model view matrix as a uniform
        gl.uniformMatrix4fv(umv,false, mv.flatten());

        gl.bindBuffer(gl.ARRAY_BUFFER, bufferId);

        gl.drawArrays(gl.TRIANGLES, startIndex, countLength);
    }
}

export function drawCubes(mvOG:mat4, car: carState, gl: WebGLRenderingContext, umv: WebGLUniformLocation, bufferId: WebGLBuffer, headAngle: number, startIndex: number, countLength: number,  vAmbientDiffuseColor: GLint, vSpecularColor: GLint, vSpecularExponent: GLint){
    let mv:mat4 = mvOG;
    //white highlights and kinda shiny
    gl.vertexAttrib4fv(vSpecularColor, [1.0, 1.0, 1.0, 1.0]);
    gl.vertexAttrib1f(vSpecularExponent, 15.0);
    //different ambinent colors of the car body, head, eyes, and headlights
    const ambColors: number[][] = [[1,0,0,1], [1,1,0,1], [0,1,1,1], [1,0,1,1], [0,1,0,1], [0,0,1,1]];


    //Translation locations and scale factors for x, y, and z coords for each cube
    //0: body, 1: head, 2: left eye, 3: right eye 4: left headlight 5: right headlight
    let xLocs: number[] = [0, 0, -0.2, 0.2, -0.2, 0.2];
    let yLocs: number[] = [0, 0.5, 0.5, 0.5, 0.15, 0.15];
    let zLocs: number[] = [0, 0, -0.35, -0.35, -0.75, -0.75];
    let xScale: number[] = [0.45, 0.25, 0.1, 0.1, 0.08, 0.08];
    let yScale: number[] = [0.25, 0.25, 0.1, 0.1, 0.08, 0.08];
    let zScale: number[] = [0.75, 0.25, 0.1, 0.1, 0.08, 0.08];

    for (let i: number = 0; i < 6; i++){
        //model view matrix
        mv = mvOG
        //
        gl.vertexAttrib4fv(vAmbientDiffuseColor, ambColors[i]);

        //multiply matrix to the right of lookAt matrix
        mv = mv.mult(translate(car.xLoc, 0.2, car.zLoc));       //place cube in world
        mv = mv.mult(rotateY(car.yaw));                            //orient cube in the correct direction

        if (i > 0 && i < 4){ //only rotate the head and eyes
            mv = mv.mult(rotateY(headAngle));                      // rotate head
        }

        mv = mv.mult(translate(xLocs[i], yLocs[i], zLocs[i]));     //move cube to correct location in the car
        mv = mv.mult(scalem(xScale[i], yScale[i], zScale[i]));      //scale into correct sizes


        //send over model view matrix as a uniform
        gl.uniformMatrix4fv(umv,false, mv.flatten());

        gl.bindBuffer(gl.ARRAY_BUFFER, bufferId);

        gl.drawArrays(gl.TRIANGLES, startIndex, countLength);
    }
}

export function genRanSphereLocs() {
    for (let i: number = 0; i < 10; i++) {
        objX[i] = Math.floor(Math.random() * 20) - 10;
        objYScale[i] = Math.random() * 2;
        objZ[i] = Math.floor(Math.random() * 20) - 10;
        objR[i] = Math.random();
        objG[i] = Math.random();
        objB[i] = Math.random();
    }
}

export function drawSpheres(mvOG:mat4, gl: WebGLRenderingContext, umv: WebGLUniformLocation, bufferId: WebGLBuffer, startIndex: number, countLength: number,  vAmbientDiffuseColor: GLint, vSpecularColor: GLint, vSpecularExponent: GLint) {
    let mv:mat4 = mvOG;
    for (let i: number = 0; i < 10; i++){
        //model view matrix
        mv = mvOG;

        //random colors
        gl.vertexAttrib4fv(vAmbientDiffuseColor, [objR[i], objG[i], objB[i], 1]);
        gl.vertexAttrib4fv(vSpecularColor, [1.0, 1.0, 1.0, 1.0]);
        gl.vertexAttrib1f(vSpecularExponent, 15.0);

        mv = mv.mult(translate(objX[i], 0, objZ[i]));
        mv = mv.mult(scalem(0.75, objYScale[i], 0.75));

        //send over model view matrix as a uniform
        gl.uniformMatrix4fv(umv,false, mv.flatten());

        gl.bindBuffer(gl.ARRAY_BUFFER, bufferId);

        gl.drawArrays(gl.TRIANGLES, startIndex, countLength);
    }
}
