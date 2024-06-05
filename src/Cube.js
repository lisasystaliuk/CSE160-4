class Cube {
    constructor () {
        this.type = 'cube';
        this.color = [1.0, 1.0, 1.0, 1.0];
        this.matrix = new Matrix4();
        this.normalMatrix = new Matrix4();
        this.textureNum = -1;
        this.cubeVerts32 = new Float32Array([
            0,0,0,   1,1,0,  1,0,0,
            0,0,0,   0,1,0,  1,1,0,
            0,1,0,    0,1,1, 1,1,1,
            0,1,0,   1,1,1,  1,1,0,
            1,1,0,   1,1,1, 1,0,0,
            1,0,0,   1,1,1, 1,0,1,
            0,1,0,   0,1,1, 0,0,0,
            0,0,0,   0,1,1, 0,0,1,
            0,0,0,   0,0,1, 1,0,1,
            0,0,0,   1,0,1, 1,0,0,
            0,0,1,   1,1,1, 1,0,1,
            0,0,1,   0,1,1, 1,1,1
        ]);
        this.cubeVerts = [
            0,0,0, 1,1,0, 1,0,0,
            0,0,0, 0,1,0,  1,1,0,
            0,1,0, 0,1,1, 1,1,1,
            0,1,0, 1,1,1, 1,1,0,
            1,1,0, 1,1,1, 1,0,0,
            1,0,0, 1,1,1, 1,0,1,
            0,1,0, 0,1,1, 0,0,0,
            0,0,0, 0,1,1, 0,0,1,
            0,0,0, 0,0,1, 1,0,1,
            0,0,0, 1,0,1, 1,0,0,
            0,0,1, 1,1,1, 1,0,1,
            0,0,1, 0,1,1, 1,1,1

        ];
    }
    render() {
        // rendering the other faces using 3DUV done using Copilot
        var rgba = this.color;
        gl.uniform1i(u_whichTexture, this.textureNum);
        // var size = this.size;

        // Pass the color of a point to u_FragColor variable 
        gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);
        gl.uniformMatrix4fv(u_ModelMatrix, false, this.matrix.elements);  
        gl.uniformMatrix4fv(u_NormalMatrix, false, this.normalMatrix.elements);  



        // front of cube
    
        drawTriangle3DUVNormal(
            // position of vertices of triangle
            // UV of vertices of triangle
            // normal of vertices of triangle
            [0,0,0,  1,1,0, 1,0,0], 
            [0,0,1,  1,1,0], 
            [0,0,-1,  0,0,-1,  0,0,-1]

        );

        drawTriangle3DUVNormal(
            [0,0,0,  0,1,0,  1,1,0],
            [0,0,0,  1,1,1],
            [0,0,-1,  0,0,-1,  0,0,-1]    

        );

        //gl.uniform4f(u_FragColor, rgba[0]* 0.9, rgba[1]* 0.9, rgba[2]* 0.9, rgba[3]);

        // top of cube

        drawTriangle3DUVNormal(
            [0,1,0,   1,1,1,   1,1,0],
            [0,0,1,   1,1,0],
            [0,1,0,   0,1,0, 0,1,0]
        );

        drawTriangle3DUVNormal(
            [0,1,0,   0,1,1,   1,1,1],
            [0,0,0,   1,1,1],
            [0,1,0,   0,1,0, 0,1,0]
        );

        // right of cube
        //gl.uniform4f(u_FragColor, rgba[0]* 0.8, rgba[1]* 0.8, rgba[2]* 0.8, rgba[3]);
        drawTriangle3DUVNormal(
            [0,0,0,   0,1,1,   0,1,0],
            [0,0,1,   1,1,0],
            [-1,0,0,   -1,0,0, -1,0,0]
        );

        drawTriangle3DUVNormal(
            [0,0,0,   0,0,1,   0,1,1],
            [0,0,0,   1,1,1],
            [-1,0,0,   -1,0,0, -1,0,0]
        );

        // left of cube

        //gl.uniform4f(u_FragColor, rgba[0]* 0.7, rgba[1]* 0.7, rgba[2]* 0.7, rgba[3]);
        drawTriangle3DUVNormal(
            [1,0,0,   1,1,1,   1,1,0],
            [0,0,1,   1,1,0],
            [1,0,0,   1,0,0, 1,0,0]
        );

        drawTriangle3DUVNormal(
            [1,0,0,   1,0,1,   1,1,1],
            [0,0,0,   1,1,1],
            [1,0,0,   1,0,0, 1,0,0]
        );

        // bottom of cube

        //gl.uniform4f(u_FragColor, rgba[0]* 0.6, rgba[1]* 0.6, rgba[2]* 0.6, rgba[3]);
        drawTriangle3DUVNormal(
            [0,0,0,   1,0,1,   0,0,1],
            [0,0,1,   1,1,0],
            [0,-1,0,   0,-1,0, 0,-1,0]
        );

        drawTriangle3DUVNormal(
            [0,0,0,   1,0,1,   1,0,1],
            [0,0,0,   1,1,1],
            [0,-1,0,   0,-1,0, 0,-1,0]
        );

        //gl.uniform4f(u_FragColor, rgba[0]* 0.5, rgba[1]* 0.5, rgba[2]* 0.5, rgba[3]);

        // back 
        drawTriangle3DUVNormal(
            [0,0,1,   1,1,1,   0,1,1],
            [0,0,1,   1,1,0],
            [0,0,1,   0,0,1, 0,0,1]
        );

        drawTriangle3DUVNormal(
            [0,0,1,   1,0,1,   1,1,1],
            [0,0,0,   1,1,1],
            [0,0,1,   0,0,1, 0,0,1]
        );





    }

    // used ChatGPT to fix texturing of cubes and drawTriangle3DUV
    renderfast() {
        var rgba = this.color;
        gl.uniform1i(u_whichTexture, this.textureNum);
        gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);
        gl.uniformMatrix4fv(u_ModelMatrix, false, this.matrix.elements);
        
        var allverts = [];
        var uvCoords = [];
    
        // Front face
        allverts.push(0, 0, 0, 1, 0, 0, 1, 1, 0); // Triangle 1
        uvCoords.push(0, 0, 1, 0, 1, 1);
    
        allverts.push(0, 0, 0, 1, 1, 0, 0, 1, 0); // Triangle 2
        uvCoords.push(0, 0, 1, 1, 0, 1);
    
        // Back face
        allverts.push(1, 0, 1, 0, 0, 1, 0, 1, 1); // Triangle 1
        uvCoords.push(1, 0, 0, 0, 0, 1);
    
        allverts.push(1, 0, 1, 0, 1, 1, 1, 1, 1); // Triangle 2
        uvCoords.push(1, 0, 0, 1, 1, 1);
    
        // Top face
        allverts.push(0, 1, 0, 1, 1, 0, 1, 1, 1); // Triangle 1
        uvCoords.push(0, 1, 1, 1, 1, 0);
    
        allverts.push(0, 1, 0, 1, 1, 1, 0, 1, 1); // Triangle 2
        uvCoords.push(0, 1, 1, 0, 0, 1);
    
        // Bottom face
        allverts.push(0, 0, 0, 1, 0, 0, 1, 0, 1); // Triangle 1
        uvCoords.push(0, 0, 1, 0, 1, 1);
    
        allverts.push(0, 0, 0, 1, 0, 1, 0, 0, 1); // Triangle 2
        uvCoords.push(0, 0, 1, 1, 0, 0);
    
        // Right face
        allverts.push(1, 0, 0, 1, 1, 0, 1, 1, 1); // Triangle 1
        uvCoords.push(0.5, 0, 0.5, 1, 1, 1);
    
        allverts.push(1, 0, 0, 1, 1, 1, 1, 0, 1); // Triangle 2
        uvCoords.push(0.5, 0, 1, 1, 1, 0.5);
    
        // Left face
        allverts.push(0, 0, 0, 0, 1, 0, 0, 1, 1); // Triangle 1
        uvCoords.push(0, 0, 0, 1, 0.5, 1);
    
        allverts.push(0, 0, 0, 0, 1, 1, 0, 0, 1); // Triangle 2
        uvCoords.push(0, 0, 0.5, 1, 1, 0.5);
    
        // Draw the vertices and texture coordinates
        drawTriangle3DUV(allverts, uvCoords);
    }
    
      
    drawCube(M, color) {
        // Set the color uniform variable
        gl.uniform4fv(u_FragColor, color);

        // Set the model matrix uniform variable
        gl.uniformMatrix4fv(u_ModelMatrix, false, M.elements);

        // Draw the cube
        gl.uniformMatrix4fv(u_ModelMatrix, false, this.matrix.elements);    
        
        // Change lighting using uniform4f

         // Draw front face
        drawTriangle3D([0, 0, 0, 1, 1, 0, 1, 0, 0]);
        drawTriangle3D([0, 0, 0, 0, 1, 0, 1, 1, 0]);

        // Draw top face
        gl.uniform4f(u_FragColor, color[0]* 0.9, color[1]* 0.9, color[2]* 0.9, color[3]);
        drawTriangle3D([0, 1, 0, 1, 1, 0, 1, 1, 1]);
        drawTriangle3D([0, 1, 0, 0, 1, 1, 1, 1, 1]);

        // Draw left face
        gl.uniform4f(u_FragColor, color[0]* 0.8, color[1]* 0.8, color[2]* 0.8, color[3]);
        drawTriangle3D([0, 0, 0, 0, 1, 0, 0, 1, 1]);
        drawTriangle3D([0, 0, 0, 0, 0, 1, 0, 1, 1]);

        // Draw right face
        gl.uniform4f(u_FragColor, color[0]* 0.7, color[1]* 0.7, color[2]* 0.7, color[3]);

        drawTriangle3D([1, 0, 0, 1, 1, 0, 1, 1, 1]);
        drawTriangle3D([1, 0, 0, 1, 0, 1, 1, 1, 1]);

        // Draw bottom face
        gl.uniform4f(u_FragColor, color[0]* 0.6, color[1]* 0.6, color[2]* 0.6, color[3]);

        drawTriangle3D([0, 0, 0, 1, 0, 0, 1, 0, 1]);
        drawTriangle3D([0, 0, 0, 0, 0, 1, 1, 0, 1]);

        // Draw back face
        gl.uniform4f(u_FragColor, color[0]* 0.5, color[1]* 0.5, color[2]* 0.5, color[3]);

        drawTriangle3D([0, 0, 1, 1, 1, 1, 1, 0, 1]);
        drawTriangle3D([0, 0, 1, 0, 1, 1, 1, 1, 1]);
    }
}