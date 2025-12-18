import {mat4} from './helperfunctions.js';

export function drawBackground(mvOG:mat4, gl: WebGLRenderingContext, umv: WebGLUniformLocation, bufferId: WebGLBuffer, startIndex: number, vAmbientDiffuseColor: GLint, vSpecularColor: GLint, vSpecularExponent: GLint, levels: number){
    let mv:mat4 = mvOG;
    //white highlights and kinda shiny
    gl.vertexAttrib4fv(vSpecularColor, [1.0, 1.0, 1.0, 1.0]);
    gl.vertexAttrib1f(vSpecularExponent, 15.0);
    const ambColors: number[][] = [[1,1,1,1], [1,1,1,1], [0,1,0,1], [1,0,0,1], [1,1,1,1], [1,1,1,1]];

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


