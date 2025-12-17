import {mat4, translate, rotateY, rotateZ, scalem} from './helperfunctions.js';

import {car} from './finalproject.js';
import {objR, objB, objG} from './shapes.js'

export function drawWheels(mvOG:mat4,gl: WebGLRenderingContext, umv: WebGLUniformLocation, bufferId: WebGLBuffer, startIndex: number, countLength: number, vAmbientDiffuseColor: GLint, vSpecularColor: GLint, vSpecularExponent: GLint) {
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

export function drawBody(mvOG:mat4,gl: WebGLRenderingContext, umv: WebGLUniformLocation, bufferId: WebGLBuffer, headAngle: number, startIndex: number, countLength: number,  vAmbientDiffuseColor: GLint, vSpecularColor: GLint, vSpecularExponent: GLint){
    let mv:mat4 = mvOG;
    //white highlights and kinda shiny
    gl.vertexAttrib4fv(vSpecularColor, [1.0, 1.0, 1.0, 1.0]);
    gl.vertexAttrib1f(vSpecularExponent, 15.0);
    //different ambinent colors of the car body, head, eyes, and headlights
    const ambColors: number[][] = [[1,0,0,1], [1,1,0,1], [0,1,1,1], [1,0,1,1], [0,1,0,1], [0,0,1,1]];

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

        //send over model view matrix as a uniform
        gl.uniformMatrix4fv(umv,false, mv.flatten());

        gl.bindBuffer(gl.ARRAY_BUFFER, bufferId);

        gl.drawArrays(gl.TRIANGLES, startIndex + countLength / 6 * i, countLength / 6);
    }
}

export function drawRand(mvOG:mat4,gl: WebGLRenderingContext, umv: WebGLUniformLocation, bufferId: WebGLBuffer, headAngle: number, startIndex: number, countLength: number,  vAmbientDiffuseColor: GLint, vSpecularColor: GLint, vSpecularExponent: GLint){
    let mv:mat4 = mvOG;
    //white highlights and kinda shiny
    gl.vertexAttrib4fv(vSpecularColor, [1.0, 1.0, 1.0, 1.0]);
    gl.vertexAttrib1f(vSpecularExponent, 15.0);

    //Random cubes around
    for (let i: number = 0; i < 2; i++){
        //model view matrix
        mv = mvOG;

        //random colors
        gl.vertexAttrib4fv(vAmbientDiffuseColor, [objR[i], objG[i], objB[i], 1]);
        gl.vertexAttrib4fv(vSpecularColor, [1.0, 1.0, 1.0, 1.0]);
        gl.vertexAttrib1f(vSpecularExponent, 15.0);

        //send over model view matrix as a uniform
        gl.uniformMatrix4fv(umv,false, mv.flatten());

        gl.bindBuffer(gl.ARRAY_BUFFER, bufferId);

        gl.drawArrays(gl.TRIANGLES, startIndex, countLength);
    }
}

export function drawBackground(mvOG:mat4, gl: WebGLRenderingContext, umv: WebGLUniformLocation, bufferId: WebGLBuffer, startIndex: number, vAmbientDiffuseColor: GLint, vSpecularColor: GLint, vSpecularExponent: GLint, levels: number){
    let mv:mat4 = mvOG;
    //white highlights and kinda shiny
    gl.vertexAttrib4fv(vSpecularColor, [1.0, 1.0, 1.0, 1.0]);
    gl.vertexAttrib1f(vSpecularExponent, 15.0);
    //different ambinent colors of the car body, head, eyes, and headlights
    const ambColors: number[][] = [[1,0,0,1], [1,1,0,1], [0,1,1,1], [1,0,1,1], [0,1,0,1], [0,0,1,1]];

    for (let i: number = 0; i < 6; i++){
        mv = mvOG;
        //background
        gl.vertexAttrib4fv(vAmbientDiffuseColor, ambColors[i]);
        gl.vertexAttrib4fv(vSpecularColor, [1.0, 1.0, 1.0, 1.0]);
        gl.vertexAttrib1f(vSpecularExponent, 15.0);

        //send over model view matrix as a uniform
        gl.uniformMatrix4fv(umv,false, mv.flatten());

        gl.bindBuffer(gl.ARRAY_BUFFER, bufferId);

        let vertsPerSquare: number = 6 * Math.pow(4, levels);

        gl.drawArrays(gl.TRIANGLES, startIndex + vertsPerSquare * i, vertsPerSquare);
    }
}


