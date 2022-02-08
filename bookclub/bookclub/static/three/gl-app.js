//import * as THREE from "/static/three/three.module.js";
const DEBUG_LIGHTS = false;
let camera, scene, renderer;
let book_model = null;
let has_animated = false;

init();

function init() {
  addScene();
  addCamera();
  addLights();
  addModels();
  addRenderer();
  console.log("Finished init GL");
}

function animation(time) {
  if (book_model === null || book_model === undefined) {
    return;
  }
  if (has_animated) {
    book_model.rotation.y += 0.001;
  }
  renderer.render(scene, camera);
}

/**
   HELPERS
   */

function gsapAnimate() {
  const tl = gsap.timeline({
    delay: 0.75,
    onComplete: () => {
      has_animated = true;
    },
  });
  tl.to(
    book_model.position,
    {
      y: 0,
      ease: "power4.inOut",
      duration: 3,
    },
    0
  );
  tl.to(
    book_model.rotation,
    {
      y: 0.75,
      z: 0.5,
      ease: "power4.inOut",
      duration: 2,
    },
    1
  );
  tl.to(
    book_model.position,
    {
      x: -2,
      y: 4,
      z: -7,
      duration: 2,
      ease: "power4.inOut",
    },
    "end"
  );
  tl.to(book_model.scale, {
    x: 0.5,
    y: 0.5,
    z: 0.5,
    duration: 2,
    ease: "power4.inOut",
  });
  tl.to(
    book_model.rotation,
    {
      y: 1.5,
      duration: 1.5,
      ease: "power4.inOut",
    },
    "end"
  );
}

function addScene() {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0xd2e7d5);
}

function addLights() {
  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.75);
  scene.add(directionalLight);
  directionalLight.position.set(-5, 5, 0);

  const directionalLight1 = new THREE.DirectionalLight(0xffffff, 0.75);
  scene.add(directionalLight1);
  directionalLight.position.set(-5, 10, 0);

  const directionalLight2 = new THREE.DirectionalLight(0xffffff, 0.75);
  scene.add(directionalLight2);
  directionalLight.position.set(5, 10, 0);

  if (DEBUG_LIGHTS) {
    const helper = new THREE.DirectionalLightHelper(directionalLight, 10);
    scene.add(helper);
    const helper1 = new THREE.DirectionalLightHelper(directionalLight1, 10);
    scene.add(helper1);
  }

  const ambientLight = new THREE.AmbientLight(0x404040);
  scene.add(ambientLight);
}

function bookOnLoad(loaded) {
  book_model = loaded.scenes[0];
  scene.add(book_model);
  book_model.position.set(0, -8, -1);
  gsapAnimate();
}

function addModels() {
  const loader = new THREE.GLTFLoader();
  loader.load(
    "/static/three/book.glb",
    bookOnLoad, // called while loading is progressing
    function (xhr) {
      console.log((xhr.loaded / xhr.total) * 100 + "% loaded");
    },
    // called when loading has errors
    function (error) {
      console.log("An error happened");
    }
  );
}

function addCamera() {
  camera = new THREE.PerspectiveCamera(
    70,
    window.innerWidth / window.innerHeight,
    0.01,
    100
  );
  camera.position.set(-2, 0, 5);
}

function addRenderer() {
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setAnimationLoop(animation);
  document.body.appendChild(renderer.domElement);
}
