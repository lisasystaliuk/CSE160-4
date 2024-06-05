// Global Variables
let canvas;
let g_camera;
let u_whichTexture;
let gl;
let a_Position;
let a_UV;
let a_Normal;
let u_FragColor;
let u_Size;
let u_ModelMatrix;
let u_ViewMatrix;
let u_ProjectionMatrix;
let u_GlobalRotateMatrix;
let u_Sampler0;
let u_Sampler1;
let u_Sampler2;
let u_Sampler3;
let u_Sampler4;
let u_lightPos;
let u_lightColor;
let u_lightDirection;
let u_limit; 
let u_spotlightPos;

let g_globalAngle = 0; // Add this line
let g_normalOn = false;
let g_lightOn = false;
let g_lightColor = [1,0,0];

const worldSize = 32; // Size of the world

var BUILD_MODE = 1;
var DESTROY_MODE = 2;
let g_buildMode = null;
var none = 0;
var hill = 4;
var g_blockType = hill;

var g_buildHeight = 10;
let g_mapInitialized = false;
let g_lightPos = [0,1.5,1];

let g_spotlightPos = [0,3,0];

let u_cameraPos;
let u_lightOn;

// Vertex shader program
var VSHADER_SOURCE = `
    precision mediump float;
    attribute vec4 a_Position;
    attribute vec2 a_UV;
    attribute vec3 a_Normal;
    varying vec2 v_UV;
    varying vec3 v_Normal;
    varying vec4 v_VertPos;
    uniform mat4 u_NormalMatrix;
    uniform mat4 u_ModelMatrix;
    uniform mat4 u_GlobalRotateMatrix;
    uniform mat4 u_ViewMatrix;
    uniform mat4 u_ProjectionMatrix;
    uniform float u_Size;

    void main() {
        gl_Position = u_ProjectionMatrix * u_ViewMatrix * u_GlobalRotateMatrix * u_ModelMatrix * a_Position;
        v_UV = a_UV;
        v_Normal = normalize(vec3(u_NormalMatrix * vec4(a_Normal,1)));

        //v_Normal = normalize(mat3(u_ModelMatrix) * a_Normal); // Correct normal transformation
        v_VertPos = u_ModelMatrix * a_Position;
    }`

// Fragment shader program

var FSHADER_SOURCE =`
  precision mediump float;
  varying vec2 v_UV;
  varying vec3 v_Normal;
  uniform vec4 u_FragColor;

  uniform sampler2D u_Sampler0;
  uniform sampler2D u_Sampler1;
  uniform sampler2D u_Sampler2;
  uniform sampler2D u_Sampler3;
  uniform sampler2D u_Sampler4;

  uniform int u_whichTexture;
  uniform vec3 u_lightPos;
  uniform vec3 u_spotlightPos;
  uniform vec3 u_cameraPos;
  varying vec4 v_VertPos;
  uniform bool u_lightOn;
  uniform vec3 u_lightColor;

  // attempting to implement spotlight
  uniform vec3 u_lightDirection;
  uniform float u_limit; // in dot space

  void main() {

    if (u_whichTexture == -3) {
        gl_FragColor = vec4((v_Normal+1.0)/2.0, 1.0);  // use normal
    }
    else if (u_whichTexture == -2) {
        gl_FragColor = u_FragColor;  // use color
    }else if (u_whichTexture == -1) {
        gl_FragColor = vec4(v_UV, 1.0, 1.0); // use UV debug color
    }else if (u_whichTexture == 0) {
        gl_FragColor = texture2D(u_Sampler0, v_UV); // use texture0
    } else if (u_whichTexture == 1) {
        gl_FragColor = texture2D(u_Sampler1, v_UV); // use texture1
    } else if (u_whichTexture == 2) {
        gl_FragColor = texture2D(u_Sampler2, v_UV); // use texture2 for sky
    } else if (u_whichTexture == 3) {
      gl_FragColor = texture2D(u_Sampler3, v_UV); // use texture3 for wall
    } else if (u_whichTexture == 4) {
            gl_FragColor = texture2D(u_Sampler4, v_UV); // use texture4 for ground
    }
    else {
        gl_FragColor = vec4(1,0.2,0.2,1); // error, put reddish
    }

    vec3 lightVector = u_lightPos - vec3(v_VertPos);
    vec3 spotlightVector = u_spotlightPos - vec3(v_VertPos);

    float r = length(lightVector);

    // N dot L

    vec3 L = normalize(lightVector);
    vec3 N = normalize(v_Normal);
    float nDotL = max(dot(N,L), 0.0);

    // reflection
    vec3 R = reflect(-L,N);

    // eye
    vec3 E = normalize(u_cameraPos - vec3(v_VertPos)); // half vector is E

    // specular
    // u_shiniess is always 64.0
    float specular = pow(max(dot(E,R), 0.0), 64.0) * 0.8;
    //vec3 u_lightColor = vec3(1.0, 0.0, 0.0);
    
    // diffuse
    vec3 diffuse = vec3(1.0, 1.0, 0.9) * vec3(gl_FragColor) * nDotL * 0.7 * u_lightColor;
    
    // ambient
    vec3 ambient = vec3(gl_FragColor) * 0.2 * u_lightColor; // do the u_lightColor for diffuse, ambient, and specular
    //gl_FragColor = vec4(specular+diffuse+ambient, 1.0);
    // gl_FragColor = gl_FragColor * nDotL;
    // gl_FragColor.a = 1.0;

    // spotlight
    float dotFromDirection = dot(normalize(spotlightVector), -u_lightDirection);
    float spotlightEffect = 0.0;

    if (dotFromDirection >= u_limit) {
        //spotlightEffect = 1.0;
        if (nDotL > 0.0) {
            spotlightEffect = pow(dot(N, E), 64.0);
        }

    }

    if (u_lightOn) {
        if (u_whichTexture == 2) {
            // diffuse and specular care about normals, ambient doing most of work
            gl_FragColor = vec4(diffuse + ambient, 1.0);
        } else {
            //gl_FragColor = vec4(diffuse + specular + ambient, 1.0);
            vec3 spotlight = spotlightEffect * vec3(gl_FragColor);
            gl_FragColor = vec4((diffuse + specular + ambient + spotlight), 1.0);
            // can add a slider for the spotlight
        }

    }
    
  }`

  function setUpWebGL() {
    // Retrieve <canvas> element
    canvas = document.getElementById('webgl');
    gl = canvas.getContext("webgl", { preserveDrawingBuffer: true });
    if (!gl) {
      console.log('Failed to get the rendering context for WebGL');
      return;
    }
    gl.enable(gl.DEPTH_TEST);
    gl.clear(gl.DEPTH_BUFFER_BIT);
 }

function connectVariablesToGLSL() {
    // Initialize shaders
    debugger;
    if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
      console.log('Failed to intialize shaders.');
      return;
    }
    // // Get the storage location of a_Position
    a_Position = gl.getAttribLocation(gl.program, 'a_Position');
    if (a_Position < 0) {
      console.log('Failed to get the storage location of a_Position');
      return;
    }
  
    // Get the storage location of a_UV
    a_UV = gl.getAttribLocation(gl.program, 'a_UV');
    if (a_UV < 0) {
      console.log('Failed to get the storage location of a_UV');
      return;
    }

    // Get the storage location of a_Normal
    a_Normal = gl.getAttribLocation(gl.program, 'a_Normal');
    if (a_Normal < 0) {
      console.log('Failed to get the storage location of a_Normal');
      return;
    }

    u_whichTexture = gl.getUniformLocation(gl.program, 'u_whichTexture');
    if (!u_whichTexture) {  
        console.log('Failed to get the storage location of u_whichTexture');
        return;
    }
  
    // Get the storage location of u_FragColor
    u_FragColor = gl.getUniformLocation(gl.program, 'u_FragColor');
    if (!u_FragColor) {
      console.log('Failed to get the storage location of u_FragColor');
      return;
    }
  
    // Get the storage location of u_ModelMatrix
    u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
    if (!u_ModelMatrix) {
      console.log('Failed to get the storage location of u_ModelMatrix');
      return;
    }
  
    u_GlobalRotateMatrix = gl.getUniformLocation(gl.program, 'u_GlobalRotateMatrix');
    if (!u_GlobalRotateMatrix) {
      console.log('Failed to get the storage location of u_GlobalRotateMatrix');
      return;
    }
  
    u_ViewMatrix = gl.getUniformLocation(gl.program, 'u_ViewMatrix');
    if (!u_ViewMatrix) {
      console.log('Failed to get the storage location of u_ViewMatrix');
      return;
    }
  
    u_ProjectionMatrix = gl.getUniformLocation(gl.program, 'u_ProjectionMatrix');
    if (!u_ProjectionMatrix) {
      console.log('Failed to get the storage location of u_ProjectionMatrix');
      return;
    }
  
     // get the storage location of u_Sampler0
     u_Sampler0 = gl.getUniformLocation(gl.program, 'u_Sampler0');
     if (!u_Sampler0) {
       console.log('Failed to get the storage location of u_Sampler0');
       return;
     }
  
     // get the storage location of u_Sampler1
     u_Sampler1 = gl.getUniformLocation(gl.program, 'u_Sampler1');
     if (!u_Sampler1) {
       console.log('Failed to get the storage location of u_Sampler1');
       return;
     }
  
     u_Sampler2 = gl.getUniformLocation(gl.program, 'u_Sampler2');
     if (!u_Sampler2) {
       console.log('Failed to get the storage location of u_Sampler2');
       return;
     }
  
     u_Sampler3 = gl.getUniformLocation(gl.program, 'u_Sampler3');
     if (!u_Sampler3) {
       console.log('Failed to get the storage location of u_Sampler3');
       return;
     }

     // Get the storage location of u_FragColor
    u_lightPos = gl.getUniformLocation(gl.program, 'u_lightPos');
    if (!u_lightPos) {
      console.log('Failed to get the storage location of u_lightPos');
      return;
    }

    u_spotlightPos = gl.getUniformLocation(gl.program, 'u_spotlightPos');
    if (!u_spotlightPos) {
      console.log('Failed to get the storage location of u_spotlightPos');
      return;
    }

    //gl.uniform3fv(u_spotlightPos, [0.0, 3.0, 0.0]);
  
     // Get the storage location of 
     u_cameraPos = gl.getUniformLocation(gl.program, 'u_cameraPos');
     if (!u_lightPos) {
       console.log('Failed to get the storage location of u_cameraPos');
       return;
     }

     u_lightOn = gl.getUniformLocation(gl.program, 'u_lightOn');
    if (!u_lightOn) {
      console.log('Failed to get the storage location of u_lightOn');
      return;
    }

    u_lightColor = gl.getUniformLocation(gl.program, 'u_lightColor');
    if (!u_lightColor) {
      console.log('Failed to get the storage location of u_lightOn');
      return;
    }


    u_NormalMatrix = gl.getUniformLocation(gl.program, 'u_NormalMatrix');
    if (!u_NormalMatrix) {
        console.log('Failed to get the storage location of u_NormalMatrix');
        return;
    }


    // for spotlight attempt
    var lightDirection = [1.0, -1.0, 0.0];
    var limit = 20 * Math.PI / 180;

    u_lightDirection = gl.getUniformLocation(gl.program, 'u_lightDirection');
    if (!u_lightDirection) {
        console.log('Failed to get the storage location of u_lightDirection');
        return;
    }

    u_limit = gl.getUniformLocation(gl.program, 'u_limit'); // memory location of u_limit
    if (!u_limit) {
        console.log('Failed to get the storage location of u_limit');
        return;
    }
    gl.uniform3fv(u_lightDirection, lightDirection);
    gl.uniform1f(u_limit, Math.cos(limit));
    
     
    var identityM = new Matrix4();
    gl.uniformMatrix4fv(u_ModelMatrix, false, identityM.elements);
  }

var g_startTime=performance.now() / 1000.0;
var g_seconds=performance.now() / 1000.0 - g_startTime;

  // called by browser repeatedly whenever it's time
function tick() {
  g_seconds = performance.now() / 1000.0 - g_startTime;
  updateAnimationAngles();
  // draw everything
  renderAllShapes();
  // tell the browser to update again
  requestAnimationFrame(tick);
}


var g_shapesList = [];

var g_eye = [0,0,3];
var g_at = [0,0,-100];
var g_up = [0,1,0];

// Set the text of a HTML element
function sendTextToHTML(text, htmlID) {
  var htmlElm = document.getElementById(htmlID);
  if (!htmlElm) {
    console.log("Failed to get " + htmlID + " from the HTML");
    return;
  }
  htmlElm.innerHTML = text;
}


function initTextures(gl,n) {
  // add textures loading
  var image1 = new Image();
  if (!image1) {
    console.log('Failed to create the image object');
    return false;
  }
  // Register the event handler to be called on loading an image
  image1.onload = function(){ sendImageToTEXTURE1(image1); };
  image1.src = "../lib/sand.jpg";


  var image2 = new Image();
  if (!image2) {
    console.log('Failed to create the image object');
    return false;
  }
  // Register the event handler to be called on loading an image
  image2.onload = function(){ sendImageToTEXTURE2(image2); };
  image2.src = "../lib/sky.jpg";

  return true;
}

function sendImageToTEXTURE1(image) {
  var texture = gl.createTexture();   // Create a texture object
  if (!texture) {
    console.log('Failed to create the texture object');
    return false;
  }

  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1); // Flip the image's y axis
  gl.activeTexture(gl.TEXTURE1);
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);
  gl.uniform1i(u_Sampler1, 1);
  console.log('finished loadTexture1');
}

function sendImageToTEXTURE2(image) {
  var texture = gl.createTexture();   // Create a texture object
  if (!texture) {
    console.log('Failed to create the texture object');
    return false;
  }

  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1); // Flip the image's y axis
  gl.activeTexture(gl.TEXTURE2);
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);
  gl.uniform1i(u_Sampler2, 2);
  console.log('finished loadTexture2');
}

// render map
var g_map = [];

// Function to create a map with specified size
function createMap(map, size) {
  for (i = 0; i < size; i++) {
    map.push([]);
    for (j = 0; j < size; j++) {
      map[i].push({});
    }
  }
}

function clearMap() {
    g_map = [];
    createMap(g_map, 64);  // 32 x 32 matrix filled with empty dictionaries {} used to store 3rd dimension
    var block = new Cube();
    
}

// Function to add hills to the map at specified coordinates
function addHills(x, z) {
  // Add hill blocks at various positions around the specified coordinates
  g_map[z][x][0] = hill;
  g_map[z][x][1] = hill;
  g_map[z][x][2] = hill;

  g_map[z + 1][x][0] = hill;
  g_map[z - 1][x + 1][0] = hill;
  g_map[z + 1][x][0] = hill;
  g_map[z - 1][x - 1][0] = hill;

  g_map[z + 1][x][1] = hill;
  g_map[z - 1][x + 1][1] = hill;
  g_map[z + 1][x][1] = hill;
  g_map[z - 1][x - 1][1] = hill;

  g_map[z][x + 1][0] = hill;
  g_map[z][x - 1][0] = hill;
}

var g_hills = true;

function initMap() {
    clearMap();

    // Add hills if enabled
    if (g_hills) {
      addHills(8, 15);
      addHills(19, 7);
      addHills(5, 10);
      addHills(22, 25);
    }
}

// Function to draw the map
function drawMap() {
  // Initialize the map if not already done
    if (!g_mapInitialized) {
      initMap();
      g_mapInitialized = true;
    }

    // Create a new cube object for rendering
    var block = new Cube();
  
    // Loop through each block in the map and render it
    for (var z = 0; z < 32; z++) {
      for (var x = 0; x < 32; x++) {
        // Loop over keys in the y dictionary
        for (var y in g_map[z][x]) {
          if (g_map[z][x].hasOwnProperty(y)){

            block.textureNum = g_map[z][x][y];
  
            // Set the position and render the block
            block.matrix.setIdentity();
            block.matrix.translate(0, -0.75, 0);
            block.matrix.scale(0.5, 0.5, 0.5);
            block.matrix.translate(x - 16, y, z - 16);
            //block.render();
          }
        }
      }
    }
  }

function renderAllShapes() {
    var startTime = performance.now();
  
    // Update and set the view and projection matrices using the camera
    gl.uniformMatrix4fv(u_ProjectionMatrix, false, g_camera.projectionMatrix.elements);
    gl.uniformMatrix4fv(u_ViewMatrix, false, g_camera.viewMatrix.elements);
  
    // Pass the global rotation matrix
    var globalRotMat = new Matrix4().rotate(g_globalAngle, 0, 1, 0);
    gl.uniformMatrix4fv(u_GlobalRotateMatrix, false, globalRotMat.elements);
  
    // Clear <canvas>
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    
    // Pass the light position to GLSL
    gl.uniform3f(u_lightPos, g_lightPos[0], g_lightPos[1], g_lightPos[2]);

    gl.uniform3f(u_spotlightPos, g_spotlightPos[0], g_spotlightPos[1], g_spotlightPos[2]);

    // pass camera position to GLSL
    gl.uniform3f(u_cameraPos, g_camera.eye.elements[0], g_camera.eye.elements[1], g_camera.eye.elements[2]);

    // pass the light status
    gl.uniform1i(u_lightOn, g_lightOn);

    // pass color to GLSL 
    gl.uniform3fv(u_lightColor, g_lightColor);

    // draw the light
    var light = new Cube();
    light.color = [2,2,0,1];
    light.textureNum = -2;
    light.matrix.translate(g_lightPos[0], g_lightPos[1], g_lightPos[2]);
    light.matrix.scale(-0.1,-0.1,-0.1);
    light.matrix.translate(-0.5,-0.5,-0.5);
    light.render();

    // draw spotlight cube
    var spotlight = new Cube();
    spotlight.color = [1,0,0,1];
    spotlight.textureNum = -2;
    //spotlight.matrix.translate(0,3,0);
    spotlight.matrix.translate(g_spotlightPos[0], g_spotlightPos[1], g_spotlightPos[2]);

    spotlight.matrix.scale(-0.1,-0.1,-0.1);
    spotlight.matrix.translate(-0.5,-0.5,-0.5);
    spotlight.render();
    
    // draw the ground 
    var floor = new Cube();
    floor.color = [1.0, 0.0, 0.0, 1.0];
    floor.textureNum = 1;
    floor.matrix.translate(0,-0.75,0.0);
    floor.matrix.scale(12,0.001,12);
    floor.matrix.translate(-0.5,0,-0.5);
    floor.render();
  
    // draw the sky 
    var sky = new Cube();
    sky.color = [0.68, 0.85, 0.90, 1.0];
    sky.textureNum = -2;
    if (g_normalOn) sky.textureNum = -3;
    sky.matrix.scale(-25,-25,-25);
    sky.matrix.translate(-0.5,-0.5,-0.5);
    sky.render();
  
    // draw the sphere
    var sphere = new Sphere();
    sphere.color = [1.0, 1.0, 1.0, 1.0];
    if (g_normalOn) sphere.textureNum = -3;
    sphere.matrix.translate(1.5, 0.5 , -0.5);
    sphere.render();
  
    // check the time at the end of the function and show on web page
    var duration = performance.now() - startTime;
    sendTextToHTML("ms: " + Math.floor(duration) + " fps: " + Math.floor(1000/duration)/10, "performance");

    // draw rocks
    var rock = new Cube();
    rock.color = [1.0, 0.0, 0.0, 1.0];
    rock.textureNum = 1;
    if (g_normalOn) rock.textureNum = -3;
    rock.matrix.translate(0,-0.75,0.0);
    rock.matrix.scale(.5,.5,.5);
    rock.matrix.translate(-0.5,0,-0.5);
    rock.render();

    var rock1 = new Cube();
    rock1.color = [1.0, 0.0, 0.0, 1.0];
    rock1.textureNum = 1;
    if (g_normalOn) rock1.textureNum = -3;
    rock1.matrix.translate(0,-0.75,0.0);
    rock1.matrix.scale(.5,.5,.5);
    rock1.matrix.translate(-0.5,1,-0.5);
    rock1.render();

    var rock2 = new Cube();
    rock2.color = [1.0, 0.0, 0.0, 1.0];
    rock2.textureNum = 1;
    if (g_normalOn) rock2.textureNum = -3;
    rock2.matrix.translate(0,-0.75,0.0);
    rock2.matrix.scale(.5,.5,.5);
    rock2.matrix.translate(0.5,0,2.5);
    rock2.render();

    var rock3 = new Cube();
    rock3.color = [1.0, 0.0, 0.0, 1.0];
    rock3.textureNum = 1;
    if (g_normalOn) rock3.textureNum = -3;
    rock3.matrix.translate(0,-0.75,0.0);
    rock3.matrix.scale(.5,.5,.5);
    rock3.matrix.translate(0.5,1,2.5);
    rock3.render();

    var rock4 = new Cube();
    rock4.color = [1.0, 0.0, 0.0, 1.0];
    rock4.textureNum = 1;
    if (g_normalOn) rock4.textureNum = -3;
    rock4.matrix.translate(0,-0.75,0.0);
    rock4.matrix.scale(.5,.5,.5);
    rock4.matrix.translate(-2.5,0,2.5);
    rock4.render();

    var rock5 = new Cube();
    rock5.color = [1.0, 0.0, 0.0, 1.0];
    rock5.textureNum = 1;
    if (g_normalOn) rock5.textureNum = -3;
    rock5.matrix.translate(0,-0.75,0.0);
    rock5.matrix.scale(.5,.5,.5);
    rock5.matrix.translate(2.5,0,-2.5);
    rock5.render();


    drawMap();
  }

function drawCubes() {
    const block = new Cube();
    for (let x = 0; x < worldSize; x++) {
        for (let y = 0; y < worldSize; y++) {
            for (let z = 0; z < g_buildHeight; z++) {
                if (g_map[x][y][z] !== 0) {
                    block.textureNum = getTextureForBlockType(g_map[x][y][z]);
                    block.matrix.setTranslate(x - 16, z * 0.1, y - 16);
                    block.matrix.scale(0.1, 0.1, 0.1);
                    block.render();
                }
            }
        }
    }
}

  function getTextureForBlockType(blockType) {
    switch (blockType) {
      case 0: 
        return 0; 
      case 1: 
        return 1;
      case 2: 
        return 2; 
      case 3: 
        return 3; 
      case 4:
        return
        default:
        console.warn("Unknown block type:", blockType);
        return 0; 
    }
  }


  ////////// input

function handleMouseClick(event) {
      if (g_buildMode === BUILD_MODE) {
          console.log("attempting to build block");
          g_blockType = hill;
          addBlock(); // Assuming z-axis is worldY
      } else if (g_buildMode === DESTROY_MODE) {
          console.log("attempting to destroy block");
          removeBlock();
      }
  // }
}

function handleKeyDown(event) {
  const speed = 0.1;
  const alpha = 45 * Math.PI / 180; // convert to radians
  switch (event.key) {
      case 'w':
          g_camera.moveForward(speed);
          break;
      case 's':
          g_camera.moveBackwards(speed);
          break;
      case 'a':
          g_camera.moveLeft(speed);
          break;
      case 'd':
          g_camera.moveRight(speed);
          break;
      case 'q':
          g_camera.panLeft(alpha);
          break;
      case 'e':
          g_camera.panRight(alpha);
          break;
      case 't':
          g_buildMode = none;
          selectBlocks();
          break;
      case 'b':
          g_buildMode = BUILD_MODE;
          g_blockType = hill;
          console.log("build mode activated through b");
          selectBlocks(); 
          console.log("attempting to select blocks");
          break;
      case 'v':
          g_buildMode = DESTROY_MODE;
          console.log("destroy mode activated through v");
          selectBlocks(); 
          break;
  }
}


// Set up actions for the HTML UI elements
function addActionsForHTMLUI() {

  // Set initial values for color sliders
  document.getElementById('redColorSlide').value = 100;
  document.getElementById('greenColorSlide').value = 100;
  document.getElementById('blueColorSlide').value = 100;

  //document.getElementById('normalOn').onclick = function() { g_normalOn = true; };
  document.getElementById('normalOn').onclick = function() {
      g_normalOn = true;
      console.log('Normals On:', g_normalOn);
  };
  //document.getElementById('normalOff').onclick = function() { g_normalOn = false; };

  document.getElementById('normalOff').onclick = function() {
      g_normalOn = false;
      console.log('Normals Off:', g_normalOn);
  };

  document.getElementById('lightOn').onclick = function() {
      g_lightOn = true;
      console.log('Lights On:', g_lightOn);
  };
  //document.getElementById('normalOff').onclick = function() { g_normalOn = false; };

  document.getElementById('lightOff').onclick = function() {
      g_lightOn = false;
      console.log('Normals Off:', g_lightOn);
  };
  
  document.getElementById('angleSlide').addEventListener('mousemove',  function() { g_globalAngle = this.value; renderAllShapes(); selectBlocks(); });

  // color slider events
 
  document.getElementById('lightSlideX').addEventListener('mousemove', function(ev) { if(ev.buttons == 1) { g_lightPos[0] = this.value / 100 ; renderAllShapes(); } });
  document.getElementById('lightSlideY').addEventListener('mousemove', function(ev) { if(ev.buttons == 1) { g_lightPos[1] = this.value / 100; renderAllShapes(); } });
  document.getElementById('lightSlideZ').addEventListener('mousemove', function(ev) { if(ev.buttons == 1) { g_lightPos[2] = this.value / 100; renderAllShapes(); } });

  document.getElementById('spotlightSlideX').addEventListener('mousemove', function(ev) { if(ev.buttons == 1) { g_spotlightPos[0] = this.value / 100 ; renderAllShapes(); } });
  document.getElementById('spotlightSlideY').addEventListener('mousemove', function(ev) { if(ev.buttons == 1) { g_spotlightPos[1] = this.value / 100; renderAllShapes(); } });
  document.getElementById('spotlightSlideZ').addEventListener('mousemove', function(ev) { if(ev.buttons == 1) { g_spotlightPos[2] = this.value / 100; renderAllShapes(); } });

  document.getElementById('redColorSlide').addEventListener('input', updateLightColor);
  document.getElementById('greenColorSlide').addEventListener('input', updateLightColor);
  document.getElementById('blueColorSlide').addEventListener('input', updateLightColor);

  canvas.onmousemove = function(ev) { if (ev.buttons == 1 ) {click(ev)}}
}

function updateLightColor() {
  const red = document.getElementById('redColorSlide').value / 100;
  const green = document.getElementById('greenColorSlide').value / 100;
  const blue = document.getElementById('blueColorSlide').value / 100;
  g_lightColor = [red, green, blue];
}

function convertCoordinatesEventToGL(ev) {
  var x = ev.clientX;
  var y = ev.clientY;
  var rect = ev.target.getBoundingClientRect();

  x = ((x - rect.left) - canvas.width/2)/(canvas.width/2);
  y = (canvas.height/2 - (y - rect.top))/(canvas.height/2);

  return([x,y]);
}

function toGridCoordinates(value) {
  return Math.floor(value);
}

function addBlock() {

  let atX = toGridCoordinates(g_camera.eye.elements[0] + 15);
  let atY = toGridCoordinates(g_camera.eye.elements[1]);
  let atZ = toGridCoordinates(g_camera.eye.elements[2] + 15);
  console.log(`attempting to add block at (${atZ}, ${atX}, ${atY})`);
  g_blockType = hill;
  g_map[atZ][atX][atY] = g_blockType;

  console.log(`Added block at (${atZ}, ${atX}, ${atY})`);
}

// Function to remove a block
function removeBlock() {
  let atX = toGridCoordinates(g_camera.eye.elements[0] + 15);
  let atY = toGridCoordinates(g_camera.eye.elements[1]); // so we can get to the center of Y
  let atZ = toGridCoordinates(g_camera.eye.elements[2] + 15);
  console.log(`attempting to remove block at (${atZ}, ${atX}, ${atY})`);
  g_map[atZ][atX][atY] = 0;
  if (g_map[atZ][atX][atY] !== undefined) {
      delete g_map[atZ][atX][atY];
  }
}

function findClosestY(mapPlane, targetY) {
  const mapVals = Object.keys(mapPlane);
  // if there are no keys return -1
  if (mapVals.length === 0) {
      return -1;
  }
  // convert the vals to numbers
  const numericKeys = mapVals.map(key => parseInt(key));
  let closestBlock = -1;

  // Iterate over the keys to find the nearest one
  numericKeys.forEach(key => {
      if (key <= targetY && key > closestBlock) {
          closestBlock = key;
      }
  });

// If no nearest key is found, return -1
  return closestBlock === undefined ? -1 : closestBlock;

}

function selectBlocks() {
  if (g_buildMode == BUILD_MODE || g_buildMode == DESTROY_MODE) {
  }
}

// Function to determine which side of a block is being looked at based on camera direction
function sideChosen() {
  // Calculate the differences in coordinates between camera's position and its look-at point
  sideX = camera.at.elements[0] - camera.eye.elements[0];
  sideY = camera.at.elements[1] - camera.eye.elements[1];
  sideZ = camera.at.elements[2] - camera.eye.elements[2];

  // Adjustment for top side detection
  let tendTop = sideY < 0 ? 0.2 : 0;

  // Calculate absolute differences and store them in an array
  d = [Math.abs(sideX), Math.abs(sideY) + tendTop, Math.abs(sideZ)];

  // Determine the index of the maximum difference
  let maxIndex = d.indexOf(Math.max(...d));

  // Return the corresponding side based on the maximum difference
  if (maxIndex === 0) {
    return sideX > 0 ? west : east; // Side is either west or east
  } else if (maxIndex === 1) {
    return sideY > 0 ? B : T; // Side is either bottom (B) or top (T)
  } else if (maxIndex === 2) {
    return sideZ > 0 ? north : south; // Side is either north or south
  }
}

function updateAnimationAngles() {
  g_seconds = (performance.now() - g_startTime) / 1000.0;
    g_lightPos[0] = 2.3 * Math.cos(g_seconds/1.5);
}

function main() {
  // Set up canvas and get gl variables
  setUpWebGL();
  g_camera = new Camera(canvas); // recommended from ChatGPT
  connectVariablesToGLSL();
  if (canvas) {
    canvas.addEventListener('click', handleMouseClick);
    canvas.addEventListener('mousedown', function(event) {
    });
  } else {
    console.error('Cannot find canvas element');
  }

  document.addEventListener('keydown', handleKeyDown);

  // Set up actions for the HTML UI Elements
  addActionsForHTMLUI();

  // Initialize Textures
  initTextures();

  // Specify the color for clearing <canvas>
  gl.clearColor(0.0, 0.0, 0.0, 1.0);

  // Clear <canvas>
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  tick();
}

window.onload = main;