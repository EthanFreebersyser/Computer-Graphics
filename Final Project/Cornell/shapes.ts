import {vec4, flatten, mat4, translate, rotateY, scalem, vec3} from './helperfunctions.js';
import {patches, patchIndexPerVertex} from "./patches.js";

interface Triangle{
    v1: vec4;
    v2: vec4;
    v3: vec4;
}

let pts:vec4[] = [];

// Cornell box face colors RGB reflectance values
const FACE_COLORS: vec3[] = [
    new vec3(0.7, 0.7, 0.7),  // front
    new vec3(0.7, 0.7, 0.7),  // back
    new vec3(0.1, 0.7, 0.1),  // left
    new vec3(0.7, 0.1, 0.1),  // right
    new vec3(0.7, 0.7, 0.7),  // top
    new vec3(0.7, 0.7, 0.7),  // bottom
];

// Track which face each triangle belongs to
let triFaceIndices: number[] = [];

export function resetGeometry() {
    pts = [];
    triFaceIndices = [];
}

export function backPtsToModel(levels: number) {
    let modelOG:mat4 = new mat4();
    let cube: vec4[];

    // Reset face indices for fresh build
    triFaceIndices = [];

    cube = makeCube(levels, -1);
    let model: mat4 = modelOG;

    model = model.mult(scalem(10, 10,10))
    model = model.mult(translate(0, 0.97,0))

    const numVerts: number = cube.length / 2
    const numTris: number = numVerts / 3

    pushPatches(numTris, cube, model);

    for (let pt of cube) {
        pts.push(model.mult(pt));
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

        const faceIndex: number = triFaceIndices[i];
        const rho: vec3 = FACE_COLORS[faceIndex];
        const emission: vec3 = new vec3(0.0,0.0,0.0);
        patches.push({ center, normal, area, rho, emission });

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
    let tri1: Triangle =  {
        v1: new vec4(1.0, -1.0, 1.0, 1.0),
        v2: new vec4(1.0, 1.0, 1.0, 1.0),
        v3: new vec4(-1.0, 1.0, 1.0, 1.0)
    };

    let tri2: Triangle =  {
        v1: new vec4(-1.0, 1.0, 1.0, 1.0),
        v2: new vec4(-1.0, -1.0, 1.0, 1.0),
        v3: new vec4(1.0, -1.0, 1.0, 1.0)
    };

    pushSubDivSquare(tri1, tri2, nFront, levels, cubePts,0);

    //back face
    tri1 =  {
        v1: new vec4(-1.0, -1.0, -1.0, 1.0),
        v2: new vec4(-1.0, 1.0, -1.0, 1.0),
        v3: new vec4(1.0, 1.0, -1.0, 1.0)
    };

    tri2 =  {
        v1: new vec4(1.0, 1.0, -1.0, 1.0),
        v2: new vec4(1.0, -1.0, -1.0, 1.0),
        v3: new vec4(-1.0, -1.0, -1.0, 1.0)
    };

    pushSubDivSquare(tri1, tri2, nBack, levels, cubePts,1);

    //left face
    tri1 =  {
        v1: new vec4(1.0, 1.0, 1.0, 1.0),
        v2: new vec4(1.0, -1.0, 1.0, 1.0),
        v3: new vec4(1.0, -1.0, -1.0, 1.0)
    };

    tri2 =  {
        v1: new vec4(1.0, -1.0, -1.0, 1.0),
        v2: new vec4(1.0, 1.0, -1.0, 1.0),
        v3: new vec4(1.0, 1.0, 1.0, 1.0)
    };

    pushSubDivSquare(tri1, tri2, nLeft, levels, cubePts,2);

    //right face
    tri1 =  {
        v1: new vec4(-1.0, 1.0, -1.0, 1.0),
        v2: new vec4(-1.0, -1.0, -1.0, 1.0),
        v3: new vec4(-1.0, -1.0, 1.0, 1.0)
    };

    tri2 =  {
        v1: new vec4(-1.0, -1.0, 1.0, 1.0),
        v2: new vec4(-1.0, 1.0, 1.0, 1.0),
        v3: new vec4(-1.0, 1.0, -1.0, 1.0)
    };

    pushSubDivSquare(tri1, tri2, nRight, levels, cubePts,3);

    //top
    tri1 =  {
        v1: new vec4(1.0, 1.0, 1.0, 1.0),
        v2: new vec4(1.0, 1.0, -1.0, 1.0),
        v3: new vec4(-1.0, 1.0, -1.0, 1.0)
    };

    tri2 =  {
        v1: new vec4(-1.0, 1.0, -1.0, 1.0),
        v2: new vec4(-1.0, 1.0, 1.0, 1.0),
        v3: new vec4(1.0, 1.0, 1.0, 1.0)
    };

    pushSubDivSquare(tri1, tri2, nTop, levels, cubePts,4);

    //bottom

    tri1 =  {
        v1: new vec4(1.0, -1.0, -1.0, 1.0),
        v2: new vec4(1.0, -1.0, 1.0, 1.0),
        v3: new vec4(-1.0, -1.0, 1.0, 1.0)
    };

    tri2 =  {
        v1: new vec4(-1.0, -1.0, 1.0, 1.0),
        v2: new vec4(-1.0, -1.0, -1.0, 1.0),
        v3: new vec4(1.0, -1.0, -1.0, 1.0)
    };

    pushSubDivSquare(tri1, tri2, nBottom, levels, cubePts,5);

    return cubePts;
}

function pushSubDivSquare(t1: Triangle, t2: Triangle, normal: vec4, levels: number, out: vec4[], faceIndex: number) {
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

        // Track which face this triangle belongs to
        triFaceIndices.push(faceIndex);
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

export function makeLightPatch(center: vec4, normal: vec4, area: number, rho: vec3, emission: vec3) {
    patches.push({center, normal, area, rho, emission});
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
