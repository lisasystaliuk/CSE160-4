class Camera {
    constructor(canvas) {
        if (!canvas) {
            throw new Error("Canvas element must be provided to Camera constructor");
        }
        this.canvas = canvas;
        this.eye = new Vector3([0, 0, 5]);
        this.at = new Vector3([0, 0, -100]);
        this.up = new Vector3([0, 1, 0]);
        this.projectionMatrix = new Matrix4();
        this.viewMatrix = new Matrix4();
        this.projectionMatrix.setPerspective(50, this.canvas.width / this.canvas.height, 1, 100);
        this.updateViewMatrix();
    }

    updateViewMatrix() {
        this.viewMatrix.setLookAt(this.eye.elements[0], this.eye.elements[1], this.eye.elements[2], 
                                  this.at.elements[0], this.at.elements[1], this.at.elements[2], 
                                  this.up.elements[0], this.up.elements[1], this.up.elements[2]);
    }
    moveForward(distance) {
        let forward = new Vector3();
        forward.set(this.at).sub(this.eye).normalize().mul(distance);
        this.eye.add(forward);
        this.at.add(forward);
        this.updateViewMatrix();
    }

    moveBackwards(distance) {
        this.moveForward(-distance);
    }

    moveLeft(distance) {
        let forward = new Vector3();
        forward.set(this.at).sub(this.eye).normalize();
        let left = Vector3.cross(this.up, forward); // Use the static cross function
        left.normalize();
        left.mul(distance);
        this.eye.add(left);
        this.at.add(left);
        this.updateViewMatrix();
    }

    // moveRight(distance) {
    //     let forward = new Vector3();
    //     forward.set(this.at).sub(this.eye).normalize();
    //     let right = Vector3.cross(this.up, forward); // Use the static cross function
    //     right.normalize();
    //     right.mul(distance);
    //     this.eye.add(right);
    //     this.at.add(right);
    //     this.updateViewMatrix();
    // }
    moveRight(distance) {
        let forward = new Vector3();
        forward.set(this.at).sub(this.eye).normalize();
        let right = Vector3.cross(forward, this.up); // Reverse the order of the cross product
        right.normalize();
        right.mul(distance);
        this.eye.add(right);
        this.at.add(right);
        this.updateViewMatrix();
    }

    panLeft(angle) {
        let forward = new Vector3();
        forward.set(this.at).sub(this.eye).normalize();
        let rotation = new Matrix4().setRotate(angle, this.up.elements[0], this.up.elements[1], this.up.elements[2]);
        let newForward = rotation.multiplyVector3(forward);
        this.at.set(this.eye).add(newForward);
        this.updateViewMatrix();
    }
    
    panRight(angle) {
        this.panLeft(-angle);
    }

    rotateAroundUpVector(rad) {
        let forward = new Vector3();
        forward.set(this.at).sub(this.eye).normalize();
        let right = new Vector3();
        right.set(forward).cross(this.up).normalize().mul(Math.sin(rad));
        let newForward = new Vector3();
        newForward.set(forward).mul(Math.cos(rad)).add(right).normalize();
        this.at.set(this.eye).add(newForward);
        this.updateViewMatrix();
    }
}
