interface Triangle{
    v1: vec4;
    v2: vec4;
    v3: vec4;
}

let pts:vec4[] = [];

let objX: number[] = [];
let objYScale: number[] = [];
let objZ: number[] = [];
export let objR: number[] = [];
export let objG: number[] = [];
export let objB: number[] = [];

import {vec4, flatten, mat4, translate, rotateY, scalem} from './helperfunctions.js';
import {patches, patchIndexPerVertex} from "./patches.js";
import {car} from './driving.js';

export function bodyPtsToModel(levels: number): number {
    let modelOG:mat4 = new mat4();
    let cube: vec4[];

    //Translation locations and scale factors for x, y, and z coords for each cube
    //0: body, 1: head, 2: left eye, 3: right eye 4: left headlight 5: right headlight
    let xLocs: number[] = [0, 0, -0.2, 0.2, -0.2, 0.2];
    let yLocs: number[] = [0, 0.5, 0.5, 0.5, 0.15, 0.15];
    let zLocs: number[] = [0, 0, -0.35, -0.35, -0.75, -0.75];
    let xScale: number[] = [0.45, 0.25, 0.1, 0.1, 0.08, 0.08];
    let yScale: number[] = [0.25, 0.25, 0.1, 0.1, 0.08, 0.08];
    let zScale: number[] = [0.75, 0.25, 0.1, 0.1, 0.08, 0.08];

    //Car
    let numCubes: number = 1;
    for (let i: number = 0; i < numCubes; i++){
        cube = makeCube(levels, 1);
        let model: mat4 = modelOG;

        model = model.mult(translate(car.xLoc, 0.2, car.zLoc));
        model = model.mult(rotateY(car.yaw));
        model = model.mult(translate(xLocs[i], yLocs[i], zLocs[i]));
        model = model.mult(scalem(xScale[i], yScale[i], zScale[i]));

        const numVerts: number = cube.length / 2
        const numTris: number = numVerts / 3

        pushPatches(numTris, cube, model);

        for (let pt of cube) {
            pts.push(model.mult(pt));
        }
    }

    return numCubes * cube.length / 2;

}

export function randPtsToModel(levels: number): number {
    let modelOG:mat4 = new mat4();
    let cube: vec4[];
    let numCubes: number = 2;

    //Random cubes
    for (let i: number = 0; i < numCubes; i++){
        cube = makeCube(levels, 1);
        let model: mat4 = modelOG;

        model = model.mult(translate(objX[i], 0, objZ[i]));
        model = model.mult(scalem(0.75, objYScale[i], 0.75));

        const numVerts: number = cube.length / 2
        const numTris: number = numVerts / 3

        pushPatches(numTris, cube, model);

        for (let pt of cube) {
            pts.push(model.mult(pt));
        }

    }

    return numCubes * cube.length / 2; //I understand that these negate themselfs right now
}

export function backPtsToModel(levels: number): number {
    let modelOG:mat4 = new mat4();
    let cube: vec4[];

    cube = makeCube(levels, -1);
    let model: mat4 = modelOG;

    model = model.mult(scalem(5, 5,5))
    model = model.mult(translate(0, 0.97,0))

    const numVerts: number = cube.length / 2
    const numTris: number = numVerts / 3

    pushPatches(numTris, cube, model);

    for (let pt of cube) {
        pts.push(model.mult(pt));
    }

    return cube.length / 2;
}

export function genRanCubeLocs(){
    for (let i: number = 0; i < 10; i++) {
        objX[i] = Math.floor(Math.random() * 20) - 10;
        objYScale[i] = Math.random() * 2;
        objZ[i] = Math.floor(Math.random() * 20) - 10;
        objR[i] = Math.random();
        objG[i] = Math.random();
        objB[i] = Math.random();
    }
}

function pushPatches(numTris: number, verts: vec4[], model: mat4) {
    for (let i: number = 0; i < numTris; i++) {
        const v0I: number = 3 * i;

        //the local normal (beofre model transform)
        const normal: vec4 = model.mult(verts[2 * v0I + 1]);
        normal[3] = 0;
        normal.normalize();

        const tri: Triangle = {
            v1: model.mult(verts[2 * v0I]),
            v2: model.mult(verts[2 * (v0I + 1)]),
            v3: model.mult(verts[2 * (v0I + 2)]),
        };

        const center: vec4 = getCenter(tri);
        const area: number   = getArea(tri);

        const patchI: number = patches.length;
        patches.push({ center, normal, area });

        patchIndexPerVertex.push(patchI, patchI, patchI);
    }
}

export function makeCube(levels: number, normals: number): vec4[] {
    let cubePts:vec4[] = [];
    // Face normals
    const nFront = new vec4( 0,  0,  normals, 0); // +Z
    const nBack  = new vec4( 0,  0, -normals, 0); // -Z
    const nLeft  = new vec4(normals,  0,  0, 0); // +X
    const nRight  = new vec4(-normals,  0,  0, 0); // -X
    const nTop  = new vec4( 0, normals,  0, 0); // +Y (top)
    const nBottom  = new vec4( 0, -normals,  0, 0); // -Y (bottom)

    //front face = 6 verts, position then normal
    let tri1: Triangle =  {v1: new vec4(1.0, -1.0, 1.0, 1.0),
                        v2: new vec4(1.0, 1.0, 1.0, 1.0),
                        v3: new vec4(-1.0, 1.0, 1.0, 1.0)
                        };

    let tri2: Triangle =  {v1: new vec4(-1.0, 1.0, 1.0, 1.0),
                        v2: new vec4(-1.0, -1.0, 1.0, 1.0),
                        v3: new vec4(1.0, -1.0, 1.0, 1.0)
                        };

    pushSubDivSquare(tri1, tri2, nFront, levels, cubePts);

    //back face
    tri1 =  {v1: new vec4(-1.0, -1.0, -1.0, 1.0),
        v2: new vec4(-1.0, 1.0, -1.0, 1.0),
        v3: new vec4(1.0, 1.0, -1.0, 1.0)
    };

    tri2 =  {v1: new vec4(1.0, 1.0, -1.0, 1.0),
        v2: new vec4(1.0, -1.0, -1.0, 1.0),
        v3: new vec4(-1.0, -1.0, -1.0, 1.0)
    };

    pushSubDivSquare(tri1, tri2, nBack, levels, cubePts);

    //left face
    tri1 =  {v1: new vec4(1.0, 1.0, 1.0, 1.0),
        v2: new vec4(1.0, -1.0, 1.0, 1.0),
        v3: new vec4(1.0, -1.0, -1.0, 1.0)
    };

    tri2 =  {v1: new vec4(1.0, -1.0, -1.0, 1.0),
        v2: new vec4(1.0, 1.0, -1.0, 1.0),
        v3: new vec4(1.0, 1.0, 1.0, 1.0)
    };

    pushSubDivSquare(tri1, tri2, nLeft, levels, cubePts);

    //right face
    tri1 =  {v1: new vec4(-1.0, 1.0, -1.0, 1.0),
        v2: new vec4(-1.0, -1.0, -1.0, 1.0),
        v3: new vec4(-1.0, -1.0, 1.0, 1.0)
    };

    tri2 =  {v1: new vec4(-1.0, -1.0, 1.0, 1.0),
        v2: new vec4(-1.0, 1.0, 1.0, 1.0),
        v3: new vec4(-1.0, 1.0, -1.0, 1.0)
    };

    pushSubDivSquare(tri1, tri2, nRight, levels, cubePts);

    //top
    tri1 =  {v1: new vec4(1.0, 1.0, 1.0, 1.0),
        v2: new vec4(1.0, 1.0, -1.0, 1.0),
        v3: new vec4(-1.0, 1.0, -1.0, 1.0)
    };

    tri2 =  {v1: new vec4(-1.0, 1.0, -1.0, 1.0),
        v2: new vec4(-1.0, 1.0, 1.0, 1.0),
        v3: new vec4(1.0, 1.0, 1.0, 1.0)
    };

    pushSubDivSquare(tri1, tri2, nTop, levels, cubePts);

    //bottom

    tri1 =  {v1: new vec4(1.0, -1.0, -1.0, 1.0),
        v2: new vec4(1.0, -1.0, 1.0, 1.0),
        v3: new vec4(-1.0, -1.0, 1.0, 1.0)
    };

    tri2 =  {v1: new vec4(-1.0, -1.0, 1.0, 1.0),
        v2: new vec4(-1.0, -1.0, -1.0, 1.0),
        v3: new vec4(1.0, -1.0, -1.0, 1.0)
    };

    pushSubDivSquare(tri1, tri2, nBottom, levels, cubePts);

    return cubePts;
}

function pushSubDivSquare(t1: Triangle, t2: Triangle, normal: vec4, levels: number, out: vec4[]) {
    const tris1: Triangle[] = subDivTri(t1, levels);
    const tris2: Triangle[] = subDivTri(t2, levels);
    const tris: Triangle[] = [...tris1, ...tris2];

    for (const tri of tris) {
        out.push(tri.v1);
        out.push(normal);
        out.push(tri.v2);
        out.push(normal);
        out.push(tri.v3);
        out.push(normal);
    }
}

export function buildBuffer(gl: WebGLRenderingContext, bufferId: WebGLBuffer, vPosition: GLint, vNormal: GLint){
    gl.disableVertexAttribArray(vPosition); //incase the indices change
    gl.disableVertexAttribArray(vNormal);

    bufferId = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, bufferId);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(pts), gl.STATIC_DRAW);

    gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 32, 0);
    gl.enableVertexAttribArray(vPosition);

    gl.vertexAttribPointer(vNormal, 4, gl.FLOAT, false, 32, 16);
    gl.enableVertexAttribArray(vNormal);
}

export function makeLightPatch(center: vec4, normal: vec4, area: number) {
    patches.push({ center, normal, area });
}

//<editor-fold desc="Triangle Helpers">
/**
 * Tessellate a triangle levels number of times
 *
 *  v1---v2      v1------m1----v2
 *   \   /  ->     \ 1 / 2 \ 3 /
 *    v3            m2------m3
 *                   \  4  /
 *                     v3
 *
 */
function subDivTri(t: Triangle, levels: number): Triangle[] {
    if (levels == 0){
        return [t];
    }

    const m1: vec4 = getMidpoint(t.v1,t.v2);
    const m2: vec4 = getMidpoint(t.v1,t.v3);
    const m3: vec4 = getMidpoint(t.v2,t.v3);

    const t1: Triangle = {v1: t.v1,v2: m1,v3: m2};
    const t2: Triangle = {v1: m1,v2: m2,v3: m3};
    const t3: Triangle = {v1: m1,v2: t.v2,v3: m3};
    const t4: Triangle = {v1: m2,v2: m3,v3: t.v3}

    const subDivTri1: Triangle[] = subDivTri(t1, levels - 1);
    const subDivTri2: Triangle[] = subDivTri(t2, levels - 1);
    const subDivTri3: Triangle[] = subDivTri(t3, levels - 1);
    const subDivTri4: Triangle[] = subDivTri(t4, levels - 1);

    return [...subDivTri1,...subDivTri2,...subDivTri3,...subDivTri4];
}

function getMidpoint(v1:vec4, v2:vec4): vec4{
    return new vec4(
        (v1[0] + v2[0]) / 2,
        (v1[1] + v2[1]) / 2,
        (v1[2] + v2[2]) / 2,
        1
    );
}

function getCenter(tri: Triangle): vec4 {
    return new vec4(
        (tri.v1[0] + tri.v2[0] + tri.v3[0]) / 3.0,
        (tri.v1[1] + tri.v2[1] + tri.v3[1]) / 3.0,
        (tri.v1[2] + tri.v2[2] + tri.v3[2]) / 3.0,
        1.0
    );
}

function getArea(tri: Triangle): number {
    const x21: number = tri.v2[0] - tri.v1[0];
    const y21: number = tri.v2[1] - tri.v1[1];
    const z21: number = tri.v2[2] - tri.v1[2];

    const x31: number = tri.v3[0] - tri.v1[0];
    const y31: number = tri.v3[1] - tri.v1[1];
    const z31: number = tri.v3[2] - tri.v1[2];

    const cx: number = y21 * z31 - z21 * y31;
    const cy: number = z21 * x31 - x21 * z31;
    const cz: number = x21 * y31 - y21 * x31;

    const len: number = Math.sqrt(cx * cx + cy * cy + cz * cz);
    return 0.5 * len;
}
//</editor-fold>

export function makeWheel(slices: number){
    let wheelPts:vec4[] = [];

    const radius: number = 0.25;
    const width: number = 0.125;
    const centerTop = new vec4(0, width/2, 0, 1.0);
    const centerBottom = new vec4(0, -width/2, 0, 1.0);

    // cap normals
    const nTop = new vec4(0,1,0,1.0);
    const nBottom = new vec4(0,-1,0,1.0);

    for (let i: number = 0; i < slices; i++){
        //angles
        const angleStart: number = (2 * Math.PI * i) / slices;
        const angleEnd: number = (2 * Math.PI * (i+1)) / slices;

        //rim x,z locations
        const rimXStart: number = radius * Math.cos(angleStart);
        const rimZStart: number = radius * Math.sin(angleStart);
        const rimXEnd: number = radius * Math.cos(angleEnd);
        const rimZEnd: number  = radius * Math.sin(angleEnd);

        //rim start and ends
        const bottomRimStart = new vec4(rimXStart, -width/2, rimZStart,1.0);
        const bottomRimEnd = new vec4(rimXEnd, -width/2, rimZEnd,1.0);
        const topRimEnd = new vec4(rimXEnd, width/2, rimZEnd,1.0);
        const topRimStart = new vec4(rimXStart, width/2, rimZStart,1.0);

        //side normals
        const nStart = new vec4(rimXStart / radius, 0.0, rimZStart / radius, 0.0);
        const nEnd = new vec4(rimXEnd / radius, 0.0 , rimZEnd / radius,0.0);

        //Side: 2 Triangles
        //triangle 1
        wheelPts.push(bottomRimStart);
        wheelPts.push(nStart);
        wheelPts.push(bottomRimEnd);
        wheelPts.push(nEnd);
        wheelPts.push(topRimEnd);
        wheelPts.push(nEnd);

        //triangle 2
        wheelPts.push(bottomRimStart);
        wheelPts.push(nStart);
        wheelPts.push(topRimEnd);
        wheelPts.push(nEnd);
        wheelPts.push(topRimStart);
        wheelPts.push(nStart);

        //Top Cap
        //triangle 3
        wheelPts.push(centerTop);
        wheelPts.push(nTop);
        wheelPts.push(topRimStart);
        wheelPts.push(nTop);
        wheelPts.push(topRimEnd);
        wheelPts.push(nTop);

        //Bottom Cap
        //triangle 4
        wheelPts.push(centerBottom);
        wheelPts.push(nBottom);
        wheelPts.push(bottomRimEnd);
        wheelPts.push(nBottom);
        wheelPts.push(bottomRimStart);
        wheelPts.push(nBottom);

    }

    for (let pt of wheelPts) {
        pts.push(pt);
    }

    return wheelPts.length / 2; //number of vertices in the wheel
}