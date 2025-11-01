#version 300 es
void main() {
    vec4 lightDirection;
    vec4 flashlightloc;
    vec4 surfaceLoc;
    float cutoffAngleRad;

    //normalize(lightDirection) is the unit vector along the flashlights centerline
    //this is the lights aim direction
    vec3 D = normalize(lightDirection.xyz);

    //normalize(S - F) is the unit vector from the flashlights position F to the surface point S.
    //subtracting positions give the displacement from the light postion to the surface point, normalizing gives only the direction
    vec3 L = normalize(surfaceLoc.xyz - flashlightLoc.xyz);

    //For any two unit vectors dot(D, L) = cos(theta), where theta is the angle between between them
    //this can also be written as cos^-1(dot(D,L) = theta
    //since we want to compare the angle between D and L (theta) and the cutOff angle we can write theta >= cutOffangle
    //we use >= because if theta is greater than the cut off angle, then no light in the cone will get to that point
    //we can sub in cos^-1(dot(D,L) for theta and take the cos of each side
    //for a result of dot(D, L) >= cos(cutoffAngleRad)
    if(dot(D, L) >= cos(cutoffAngleRad)){
        //light it!
    }

}