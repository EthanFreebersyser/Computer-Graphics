import {vec4} from './helperfunctions.js';

export interface Patch {
    center: vec4;
    normal: vec4;
    area: number;
}

export let patches: Patch[] = [];

export let patchIndexPerVertex: number [] = [];

export function makeF(): number[][] {
    const numOfPatchs: number = patches.length;
    const F: number[][] = Array.from({ length: numOfPatchs}, () => Array(numOfPatchs).fill(0));

    for (let i: number = 0; i < numOfPatchs; i++) {
        const Pi: vec4 = patches[i].center;
        const Ni: vec4 = patches[i].normal.normalize();

        for (let j: number = 0; j < numOfPatchs; j++) {
            if (i === j) continue;

            const Pj: vec4 = patches[j].center;
            const Nj: vec4 = patches[j].normal.normalize();

            const dx: number = Pj[0] - Pi[0];
            const dy: number = Pj[1] - Pi[1];
            const dz: number = Pj[2] - Pi[2];

            const r: number = Math.sqrt(dx*dx + dy*dy + dz*dz);
            if (r < 0.00001) continue;

            const d = new vec4 (dx / r, dy / r, dz / r, 1 );

            const cosThetaI: number = Math.max(0, Ni[0] * d[0] + Ni[1] * d[1] + Ni[2] * d[2]);
            const cosThetaJ: number = Math.max(0, Nj[0] * -d[0] + Nj[1] * -d[1] + Nj[2] * -d[2]);

            if (cosThetaI <= 0 || cosThetaJ <= 0) continue;

            const geomTerm: number = (cosThetaI * cosThetaJ) / (Math.PI * r * r);
            F[i][j] = geomTerm * patches[j].area;

            if (isNaN(F[i][j])) {
                console.error(`NaN in F[${i}][${j}]: r=${r}, area=${patches[j].area}, cosThetaI=${cosThetaI}, cosThetaJ=${cosThetaJ}`);
                F[i][j] = 0;
            }
        }
    }

    return F;
}

