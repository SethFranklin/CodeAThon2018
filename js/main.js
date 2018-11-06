/// <reference path = "gl-matrix.d.ts" />
var canvas;
var gl;
var Int;
var MainShader;
window.onload = function () {
    canvas = document.getElementById("canvas");
    gl = canvas.getContext("webgl");
    if (!gl) {
        alert("Your browser doesn't support WebGL");
        return;
    }
    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE);
    gl.cullFace(gl.BACK);
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    gl.viewport(0, 0, canvas.width, canvas.height);
    Input.Start();
    Int = setInterval(Update, 16.666666667);
};
function Update() {
    // Update
    // End of Update, render
    Input.PushBackInputs();
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
}
window.onunload = function () {
};
window.onresize = function () {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    gl.viewport(0, 0, canvas.width, canvas.height);
};
window.onkeydown = function (Event) {
    Input.KeyDownEvent(Event.keyCode);
};
window.onkeyup = function (Event) {
    Input.KeyUpEvent(Event.keyCode);
};
window.onclick = function () {
};
window.onmousemove = function (Event) {
};
var Model // Doesn't do model matrix: Chunk.shader.UniformMat4("Model", this.ModelMatrix);
 = /** @class */ (function () {
    function Model() {
        this.VBO = gl.createBuffer();
    }
    Model.prototype.UpdateMesh = function (Verticies) {
        this.VertCount = Verticies.length / 8;
        gl.bindBuffer(gl.ARRAY_BUFFER, this.VBO);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(Verticies), gl.STATIC_DRAW);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
    };
    Model.prototype.Render = function () {
        gl.bindBuffer(gl.ARRAY_BUFFER, this.VBO);
        gl.enableVertexAttribArray(MainShader.PositionLocation);
        gl.vertexAttribPointer(MainShader.PositionLocation, 3, gl.FLOAT, false, 32, 0);
        gl.enableVertexAttribArray(MainShader.NormalLocation);
        gl.vertexAttribPointer(MainShader.NormalLocation, 3, gl.FLOAT, false, 32, 12);
        gl.enableVertexAttribArray(MainShader.UVLocation);
        gl.vertexAttribPointer(MainShader.UVLocation, 2, gl.FLOAT, false, 32, 24);
        gl.drawArrays(gl.TRIANGLES, 0, this.VertCount);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
    };
    Model.prototype.Delete = function () {
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
        gl.deleteBuffer(this.VBO);
    };
    return Model;
}());
var Input = /** @class */ (function () {
    function Input() {
    }
    Input.Start = function () {
        Input.DownNow.length = 256; // 256 different keycodes
        Input.DownBefore.length = 256;
        for (var i = 0; i < 256; i++) // Fils it with false statements
         {
            Input.DownNow[i] = false;
            Input.DownBefore[i] = false;
        }
    };
    Input.PushBackInputs = function () {
        Input.DownBefore = Input.DownNow.slice(0);
    };
    Input.IsKeyDown = function (Key) {
        return (Input.DownNow[Key]);
    };
    Input.IsKeyPressed = function (Key) {
        return (Input.DownNow[Key] && !Input.DownBefore[Key]);
    };
    Input.IsKeyReleased = function (Key) {
        return (!Input.DownNow[Key] && Input.DownBefore[Key]);
    };
    Input.KeyUpEvent = function (Key) {
        Input.DownNow[Key] = false;
    };
    Input.KeyDownEvent = function (Key) {
        Input.DownNow[Key] = true;
    };
    Input.DownNow = [];
    Input.DownBefore = [];
    return Input;
}());
var Shader = /** @class */ (function () {
    function Shader(Name, UniformList) {
        this.UniformMap = {};
        var context = this;
        HTTPRequest("GET", window.location.href + "/../glsl/" + Name + ".vert").then(function (VertexSource) {
            HTTPRequest("GET", window.location.href + "/../glsl/" + Name + ".frag").then(function (FragmentSource) {
                var VertexShader = gl.createShader(gl.VERTEX_SHADER);
                var FragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
                gl.shaderSource(VertexShader, VertexSource);
                gl.shaderSource(FragmentShader, FragmentSource);
                gl.compileShader(VertexShader);
                gl.compileShader(FragmentShader);
                var VertTest = gl.getShaderParameter(VertexShader, gl.COMPILE_STATUS);
                var FragTest = gl.getShaderParameter(FragmentShader, gl.COMPILE_STATUS);
                if (!VertTest) {
                    console.log("Vertex Shader (" + Name + ".vert) Compile Error:\n" + gl.getShaderInfoLog(VertexShader));
                }
                if (!FragTest) {
                    console.log("Fragment Shader (" + Name + ".frag) Compile Error:\n" + gl.getShaderInfoLog(FragmentShader));
                }
                var ShaderProgram = gl.createProgram();
                gl.attachShader(ShaderProgram, VertexShader);
                gl.attachShader(ShaderProgram, FragmentShader);
                gl.linkProgram(ShaderProgram);
                var ProgramTest = gl.getProgramParameter(ShaderProgram, gl.LINK_STATUS);
                if (!ProgramTest) {
                    console.log("Shader Program (" + Name + ") Compile Error:\n" + gl.getProgramInfoLog(ShaderProgram));
                }
                context.PositionLocation = gl.getAttribLocation(ShaderProgram, "Position");
                context.NormalLocation = gl.getAttribLocation(ShaderProgram, "Normal");
                context.UVLocation = gl.getAttribLocation(ShaderProgram, "UV");
                context.UniformMap = {};
                for (var Uniform = 0; Uniform < UniformList.length; Uniform++) {
                    context.UniformMap[UniformList[Uniform]] = gl.getUniformLocation(ShaderProgram, UniformList[Uniform]);
                }
                gl.deleteShader(VertexShader);
                gl.deleteShader(FragmentShader);
                context.ID = ShaderProgram;
            }, function (Reject) {
                console.log(Reject);
            });
        }, function (Reject) {
            console.log(Reject);
        });
    }
    Shader.prototype.Use = function () {
        gl.useProgram(this.ID);
    };
    Shader.prototype.Delete = function () {
        gl.deleteProgram(this.ID);
    };
    Shader.prototype.UniformFloat = function (Name, Value) {
        gl.uniform1f(this.UniformMap[Name], Value);
    };
    Shader.prototype.UniformInt = function (Name, Value) {
        gl.uniform1i(this.UniformMap[Name], Value);
    };
    Shader.prototype.UniformVec3 = function (Name, Value) {
        gl.uniform3f(this.UniformMap[Name], Value[0], Value[1], Value[2]);
    };
    Shader.prototype.UniformVec2 = function (Name, Value) {
        gl.uniform2f(this.UniformMap[Name], Value[0], Value[1]);
    };
    Shader.prototype.UniformMat4 = function (Name, Value) {
        gl.uniformMatrix4fv(this.UniformMap[Name], false, Value);
    };
    return Shader;
}());
var Texture = /** @class */ (function () {
    function Texture(Name, NewWrap, NewFilter) {
        var context = this;
        context.ID = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, this.ID);
        context.WrapMode = NewWrap;
        context.FilterMode = NewFilter;
        var pixel = new Uint8Array([0, 0, 0, 0]); // Set color to pink while it loads
        gl.bindTexture(gl.TEXTURE_2D, context.ID);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, pixel);
        var image = new Image();
        image.src = "/../3d-graphing/texture/" + Name + ".png";
        image.onload = function () {
            gl.bindTexture(gl.TEXTURE_2D, context.ID);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
            if (Texture.PowerOfTwo(image.width) && Texture.PowerOfTwo(image.height)) {
                gl.generateMipmap(gl.TEXTURE_2D);
            }
        };
    }
    Texture.prototype.Use = function (Location) {
        gl.activeTexture(gl.TEXTURE0 + Location);
        gl.bindTexture(gl.TEXTURE_2D, this.ID);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, this.WrapMode);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, this.WrapMode);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, this.FilterMode);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, this.FilterMode);
    };
    Texture.prototype.Delete = function () {
        gl.deleteTexture(this.ID);
    };
    Texture.PowerOfTwo = function (a) {
        return (a & (a - 1)) == 0;
    };
    return Texture;
}());
function HTTPRequest(RequestType, URL) {
    return new Promise(function (Resolve, Reject) {
        var XMLHTTP = new XMLHttpRequest();
        XMLHTTP.open(RequestType, URL);
        switch (RequestType) {
            case "GET":
                XMLHTTP.send();
                break;
        }
        XMLHTTP.onload = function () {
            if (XMLHTTP.status == 200)
                Resolve(XMLHTTP.response);
            else
                Reject(XMLHTTP.statusText);
        };
    });
}
