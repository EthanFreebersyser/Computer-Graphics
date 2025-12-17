//Note I put all my texture PNG's in a folder called 'textures'

let anisotropic_ext: EXT_texture_filter_anisotropic;

export function loadColor(gl: WebGLRenderingContext) {
    let colorT:WebGLTexture = gl.createTexture();
    let colorI:HTMLImageElement = new Image();
    colorI.onload = function() {
        gl.bindTexture(gl.TEXTURE_2D, colorT);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);  //disagreement over what direction Y axis goes
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, colorI);
        gl.generateMipmap(gl.TEXTURE_2D);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
        anisotropic_ext = gl.getExtension('EXT_texture_filter_anisotropic');
        gl.texParameterf(gl.TEXTURE_2D, anisotropic_ext.TEXTURE_MAX_ANISOTROPY_EXT, 4);
        gl.bindTexture(gl.TEXTURE_2D, null);
    };
    colorI.src = 'textures/Earth.png';

    return colorT;
}

export function loadClouds(gl: WebGLRenderingContext) {
    let cloudT:WebGLTexture = gl.createTexture();
    let cloudI:HTMLImageElement = new Image();
    cloudI.onload = function() {
        gl.bindTexture(gl.TEXTURE_2D, cloudT);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);  //disagreement over what direction Y axis goes
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, cloudI);
        gl.generateMipmap(gl.TEXTURE_2D);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
        anisotropic_ext = gl.getExtension('EXT_texture_filter_anisotropic');
        gl.texParameterf(gl.TEXTURE_2D, anisotropic_ext.TEXTURE_MAX_ANISOTROPY_EXT, 4);
        gl.bindTexture(gl.TEXTURE_2D, null);
    };
    cloudI.src = 'textures/earthcloudmap-visness.png';

    return cloudT;
}

export function loadNight(gl: WebGLRenderingContext) {
    let nightT:WebGLTexture = gl.createTexture();
    let nightI:HTMLImageElement = new Image();
    nightI.onload = function() {
        gl.bindTexture(gl.TEXTURE_2D, nightT);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);  //disagreement over what direction Y axis goes
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, nightI);
        gl.generateMipmap(gl.TEXTURE_2D);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
        anisotropic_ext = gl.getExtension('EXT_texture_filter_anisotropic');
        gl.texParameterf(gl.TEXTURE_2D, anisotropic_ext.TEXTURE_MAX_ANISOTROPY_EXT, 4);
        gl.bindTexture(gl.TEXTURE_2D, null);
    };
    nightI.src = 'textures/EarthNight.png';

    return nightT;
}

export function loadNormal(gl: WebGLRenderingContext) {
    let normalT:WebGLTexture = gl.createTexture();
    let normalI:HTMLImageElement = new Image();
    normalI.onload = function() {
        gl.bindTexture(gl.TEXTURE_2D, normalT);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);  //disagreement over what direction Y axis goes
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, normalI);
        gl.generateMipmap(gl.TEXTURE_2D);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
        anisotropic_ext = gl.getExtension('EXT_texture_filter_anisotropic');
        gl.texParameterf(gl.TEXTURE_2D, anisotropic_ext.TEXTURE_MAX_ANISOTROPY_EXT, 4);
        gl.bindTexture(gl.TEXTURE_2D, null);};
    normalI.src = 'textures/EarthNormal.png';

    return normalT;
}

export function loadSpec(gl: WebGLRenderingContext) {
    let specT:WebGLTexture = gl.createTexture();
    let specI:HTMLImageElement = new Image();
    specI.onload = function() {
        gl.bindTexture(gl.TEXTURE_2D, specT);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);  //disagreement over what direction Y axis goes
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, specI);
        gl.generateMipmap(gl.TEXTURE_2D);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
        anisotropic_ext = gl.getExtension('EXT_texture_filter_anisotropic');
        gl.texParameterf(gl.TEXTURE_2D, anisotropic_ext.TEXTURE_MAX_ANISOTROPY_EXT, 4);
        gl.bindTexture(gl.TEXTURE_2D, null);
    };
    specI.src = 'textures/EarthSpec.png';

    return specT;
}

