import * as THREE from "three";
import { OrbitControls } from 'jsm/controls/OrbitControls.js';
import spline from "./spline.js";
import { EffectComposer } from "jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "jsm/postprocessing/UnrealBloomPass.js";

const h=window.innerHeight;
const w=window.innerWidth;
const scene=new THREE.Scene();
scene.fog=new THREE.FogExp2(0x000000, 0.3);
const camera=new THREE.PerspectiveCamera(75, w/h, 0.1, 1000);
camera.position.set(0, 0, 5);
const renderer=new THREE.WebGLRenderer();
renderer.setSize(w, h);
renderer.toneMapping=THREE.ACESFilmicToneMapping;
renderer.outputColorSpace=THREE.SRGBColorSpace;
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.03;

// create a tube geometry from the spline
const tubeGeometry = new THREE.TubeGeometry(spline, 222, 0.65, 16, true);

// postprocessing
const composer = new EffectComposer(renderer);
const renderScene = new RenderPass(scene, camera);
composer.addPass(renderScene);
const bloomPass = new UnrealBloomPass(new THREE.Vector2(w, h), 1.5, 0.4, 100);
composer.addPass(bloomPass);
bloomPass.threshold=0.002;
bloomPass.strength=3.5;
bloomPass.radius=0;

// create a line geometry from the spline
const points = spline.getPoints(100);
const geometry = new THREE.BufferGeometry().setFromPoints(points);
const material = new THREE.LineBasicMaterial({ color: 0xff0000 });
const line = new THREE.Line(geometry, material);

// create edges geometry from the spline
const edges = new THREE.EdgesGeometry(tubeGeometry, 0.2);
const lineMat = new THREE.LineBasicMaterial({ color: 0x5f5f5f });
const tubeLines = new THREE.LineSegments(edges, lineMat);
scene.add(tubeLines);

const numBoxes = 55;
const size=0.075;
const boxGeometry = new THREE.BoxGeometry(size, size, size);
for(let i=0; i<numBoxes; i++){
    const boxMaterial = new THREE.MeshStandardMaterial({
        color: 0xff0000,
        emissive: 0xff0000,
        emissiveIntensity: 2.5
    });
    const box = new THREE.Mesh(boxGeometry, boxMaterial);
    const p = (i / numBoxes + Math.random() * 0.1) % 1;
    const pos = tubeGeometry.parameters.path.getPointAt(p);
    pos.set(pos.x+Math.random()-0.4, pos.y+Math.random()-0.4);
    box.position.copy(pos);
    const rote=new THREE.Vector3(Math.random()*Math.PI, Math.random()*Math.PI, Math.random()*Math.PI);
    box.rotation.set(rote.x, rote.y, rote.z);
    const boxEdge=new THREE.EdgesGeometry(boxGeometry, 0.2);
    const color=new THREE.Color().setHSL(0.7-p, 1, 0.5);
    const lineMat=new THREE.LineBasicMaterial({ color });
    const boxLines=new THREE.LineSegments(boxEdge, lineMat);
    boxLines.position.copy(pos);
    boxLines.rotation.set(rote.x, rote.y, rote.z);
    scene.add(boxLines);
}

function updateCamera(t){
    const time = t * 0.1;
    const looptime = 10 * 1000;
    const p = (time%looptime)/looptime;
    const pos = tubeGeometry.parameters.path.getPointAt(p);
    const lookAt = tubeGeometry.parameters.path.getPointAt((p+0.03)%1);
    camera.position.copy(pos);
    camera.lookAt(lookAt);
}

function animate(t=0){
    requestAnimationFrame(animate);
    controls.update();
    updateCamera(t);
    composer.render(scene, camera);
}

animate();

function handleWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}
window.addEventListener('resize', handleWindowResize, false);