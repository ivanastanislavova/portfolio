/*
	Se ha empleado código de:
	Three.js "tutorials by example"
	Author: Lee Stemkoski
	Date: July 2013 (three.js v59dev)
*/

//////////	
// MAIN //
//////////
import * as THREE from "three";
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// standard global variables
var container, scene, camera, renderer, controls, stats;
var keyboard = new THREEx.KeyboardState();
var clock = new THREE.Clock();
var sphere;
var smallsphere;
var smallcube1, smallcube2;
var ivana2;

var angle = 0; // ángulo inicial
var radius = 400; // radio de la rotación, puedes ajustarlo a tus necesidades

// Almacenar la dirección de movimiento de la esfera
var sphereDirection = new THREE.Vector3();

var isCollisionball = false;
var isCollisioncube = false;

var targetPosition = new THREE.Vector3();
var lerpAmount = 0.03; // Este valor determina la velocidad de la transición

var cooldownTime = 9; // Tiempo de enfriamiento en segundos
var timeSinceCollision = 0; // Tiempo transcurrido desde la última colisión

var mixer, breathingAction, walkingAction;

const loader = new GLTFLoader();
// initialization
init();
loadGLTFModels();

// animation loop / game loop
animate();

///////////////
// FUNCTIONS //
///////////////

function init() {
	///////////
	// SCENE //
	///////////
	scene = new THREE.Scene();

	////////////
	// CAMERA //
	////////////

	var SCREEN_WIDTH = window.innerWidth, SCREEN_HEIGHT = window.innerHeight;
	// camera attributes
	var VIEW_ANGLE = 45, ASPECT = SCREEN_WIDTH / SCREEN_HEIGHT, NEAR = 0.1, FAR = 20000;
	// set up camera
	camera = new THREE.PerspectiveCamera(VIEW_ANGLE, ASPECT, NEAR, FAR);
	// add the camera to the scene
	scene.add(camera);

	camera.position.set(0, 150, 400);
	camera.lookAt(scene.position); // look at scene's origin

	//////////////
	// RENDERER //
	//////////////

	// create and start the renderer; choose antialias setting.
	if (Detector.webgl)
		renderer = new THREE.WebGLRenderer({ antialias: true });
	else
		renderer = new THREE.CanvasRenderer();

	renderer.setSize(SCREEN_WIDTH, SCREEN_HEIGHT);

	// attach div element to variable to contain the renderer
	container = document.getElementById('ThreeJS');
	// alternatively: to create the div at runtime, use:
	//   container = document.createElement( 'div' );
	//    document.body.appendChild( container );

	// attach renderer to the container div
	container.appendChild(renderer.domElement);

	////////////
	// EVENTS //
	////////////

	// automatically resize renderer
	THREEx.WindowResize(renderer, camera);
	// toggle full-screen on given key press
	THREEx.FullScreen.bindKey({ charCode: 'm'.charCodeAt(0) });

	//////////////
	// CONTROLS //
	//////////////

	// move mouse and: left   click to rotate, 
	//                 middle click to zoom, 
	//                 right  click to pan
	//controls = new THREE.OrbitControls(camera, renderer.domElement);

	///////////
	// STATS //
	///////////

	// displays current and past frames per second attained by scene
	stats = new Stats();
	stats.domElement.style.position = 'absolute';
	stats.domElement.style.bottom = '0px';
	stats.domElement.style.zIndex = 100;
	container.appendChild(stats.domElement);

	///////////
	// LIGHT //
	///////////

	// create a light
	var light = new THREE.PointLight(0xffffff);
	light.position.set(0, 250, 0);
	scene.add(light);
	var ambientLight = new THREE.AmbientLight(0x111111);
	scene.add(ambientLight);

	//////////////
	// GEOMETRY //
	//////////////

	// Sphere parameters: radius, segments along width, segments along height
	var sphereGeometry = new THREE.SphereGeometry(50, 32, 16);
	var sphereMaterial = new THREE.MeshLambertMaterial({ color: 0x8888ff });
	sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
	sphere.position.set(0, 50, 0);
	scene.add(sphere);

	// controls = new THREE.OrbitControls(camera, renderer.domElement);
	// controls.target = sphere.position;
	// controls.update();

	camera.lookAt(sphere.position);

	var smallsphereGeometry = new THREE.SphereGeometry(5, 32, 16);
	var smallsphereMaterial = new THREE.MeshLambertMaterial({ color: 0xff0000 });
	smallsphere = new THREE.Mesh(smallsphereGeometry, smallsphereMaterial);
	smallsphere.position.set(300, 50, -200);
	scene.add(smallsphere);

	var smallcubeGeometry = new THREE.BoxGeometry(10, 10, 10);
	var smallcubeMaterial = new THREE.MeshLambertMaterial({ color: 0x00ff00 }); // collor verde
	smallcube1 = new THREE.Mesh(smallcubeGeometry, smallcubeMaterial);
	smallcube1.position.set(-300, 50, -400);
	scene.add(smallcube1);

	smallcube2 = new THREE.Mesh(smallcubeGeometry, smallcubeMaterial);
	smallcube2.position.set(-300, 50, 400);
	scene.add(smallcube2);

	///////////
	// FLOOR //
	///////////

	// note: 4x4 checkboard pattern scaled so that each square is 25 by 25 pixels.

	var floorTexture = new THREE.TextureLoader().load("cesped2.png");
	floorTexture.wrapS = THREE.RepeatWrapping;
	floorTexture.wrapT = THREE.RepeatWrapping;
	floorTexture.repeat.set(16, 16);
	var floorMaterial = new THREE.MeshBasicMaterial({ map: floorTexture, side: THREE.DoubleSide });
	var floorGeometry = new THREE.PlaneGeometry(2000, 2000, 1, 1);
	var floor = new THREE.Mesh(floorGeometry, floorMaterial);
	floor.position.y = -0.5;
	floor.rotation.x = Math.PI / 2;
	scene.add(floor);

	/////////
	// SKY //
	/////////

	// Cargar la imagen del skybox
	var skyboxTexture = new THREE.TextureLoader().load('fondo.jpg');

	// Crear el material del skybox
	var skyBoxMaterial = new THREE.MeshBasicMaterial({
		map: skyboxTexture,
		side: THREE.BackSide
	});

	// Crear la geometría y el objeto del skybox
	var skyBoxGeometry = new THREE.BoxGeometry(10000, 10000, 10000);
	var skyBox = new THREE.Mesh(skyBoxGeometry, skyBoxMaterial);
	scene.add(skyBox);

	timeSinceCollision = cooldownTime;
}

function animate() {
	requestAnimationFrame(animate);
	render();
	// var delta2 = clock.getDelta();
    
	update();
}

function update() {
	var delta = clock.getDelta();

	controles(delta);

	moveBetweenCubes(delta);

	if (mixer) { // Verifica si mixer está definido
        mixer.update(delta);
    }
	scaleSphere();

	TWEEN.update();

	//controls.update();
	stats.update();
}

function moveBetweenCubes(delta) {
	if (ivana2 !== undefined) {
		var box = new THREE.Box3().setFromObject(ivana2);
		var size = box.getSize(new THREE.Vector3());
		var ivana2Radius = Math.max(size.x, size.y, size.z) / 2;

		if (timeSinceCollision < cooldownTime) {
			timeSinceCollision += delta; // Incrementa el tiempo transcurrido desde la última colisión
			//console.log("Tiempo de enfriamiento: " + timeSinceCollision + " segundos");
		}
		if (timeSinceCollision >= cooldownTime) {
			console.log("Tiempo de enfriamiento finalizado");
			if (!isCollisioncube && smallcube1) {
				var distanceToCube1 = ivana2.position.distanceTo(smallcube1.position);

				if (distanceToCube1 < ivana2Radius + smallcube1.geometry.parameters.width) {
					isCollisioncube = true; // Marca que hay colisión
					timeSinceCollision = 0; // Reinicia el tiempo transcurrido desde la última colisión

					targetPosition = smallcube2.position.clone();

					console.log("Colisión cubo 1 detectada");
					//console.log("Tiempo de enfriamiento: " + timeSinceCollision + " segundos");
				}
			}

			if (!isCollisioncube && smallcube2) {
				var distanceToCube2 = ivana2.position.distanceTo(smallcube2.position);

				if (distanceToCube2 < ivana2Radius + smallcube2.geometry.parameters.width) {
					isCollisioncube = true; // Marca que hay colisión
					timeSinceCollision = 0; // Reinicia el tiempo transcurrido desde la última colisión

					targetPosition = smallcube1.position.clone();

					console.log("Colisión cubo 2 detectada");
					//console.log("Tiempo de enfriamiento: " + timeSinceCollision + " segundos");
				}
			}
		}


		if (isCollisioncube) {
			// Calcula el vector de la posición relativa de la cámara antes de la colisión
			var cameraRelativePosition = camera.position.clone().sub(ivana2.position);

			// Guarda la posición Y original
			var originalY = ivana2.position.y;

			// Mueve la esfera hacia el cubo
			ivana2.position.lerp(targetPosition, lerpAmount);

			// Restablece la posición Y a su valor original
			ivana2.position.y = originalY;

			// Calcula la nueva posición de la cámara con la misma posición relativa
			camera.position.copy(ivana2.position).add(cameraRelativePosition);

			// Actualiza la dirección de la cámara para que siga mirando hacia la esfera
			camera.lookAt(ivana2.position);

			//console.log("Moviendo hacia el cubo");
			console.log("Posicion de ivana2: ", ivana2.position.distanceTo(targetPosition));

			if (ivana2.position.distanceTo(targetPosition) < 50.5) {
				isCollisioncube = false; // Marca que la colisión ha terminado
				console.log("Colisión cubo finalizada");

				var tween = new TWEEN.Tween(smallcube1.material.color)
					.to({ r: 1, g: 0, b: 0 }, 200) // Cambia el color a rojo en 500 milisegundos
					.yoyo(true) // Hace que la animación se invierta y vuelva al color original
					.repeat(3) // Repite la animación 3 veces
					.start();

				var tween = new TWEEN.Tween(smallcube2.material.color)
					.to({ r: 1, g: 0, b: 0 }, 200) // Cambia el color a rojo en 500 milisegundos
					.yoyo(true) // Hace que la animación se invierta y vuelva al color original
					.repeat(3) // Repite la animación 3 veces
					.start();
			}
		}
	}
}

function scaleSphere() {
	if (ivana2 !== undefined && !isCollisionball && smallsphere) {
		var distance = ivana2.position.distanceTo(smallsphere.position);
		// Si la distancia es menor que la suma de los radios, hay una colisión
		var box = new THREE.Box3().setFromObject(ivana2);
		var size = box.getSize(new THREE.Vector3());
		var ivana2Radius = Math.max(size.x, size.y, size.z) / 2;

		// Si la distancia es menor que la suma de los "radios", hay una colisión
		if (distance < ivana2Radius + smallsphere.geometry.parameters.radius) {
			isCollisionball = true; // Marca que hay colisión

			// Remueve la esfera pequeña de la escena
			scene.remove(smallsphere);

			smallsphere = null; // Elimina la referencia a la esfera pequeña
			console.log("Colisión detectada");

			// Crea una nueva instancia de TWEEN.Tween para animar el tamaño de la esfera principal
			var tween = new TWEEN.Tween(ivana2.scale)
				.to({ x: 80, y: 80, z: 80 }, 1000) // Escala la esfera al doble de su tamaño en 500 milisegundos
				.easing(TWEEN.Easing.Elastic.Out) // Efecto suavizado
				.start();
		}
	}
}

async function loadGLTFModels() {
	var gltfAsset = await loader.loadAsync("./tv.glb");
	var gltfModel = gltfAsset.scene;
	gltfModel.position.y = 10;
	gltfModel.position.x = 0;
	gltfModel.position.z = -500;
	gltfModel.scale.set(20, 20, 20);
	scene.add(gltfModel);

	scene.remove(sphere);

	// Ahora cargamos y añadimos el modelo como antes
	var gltfAsset = await loader.loadAsync("./ivana2.glb");
	ivana2 = gltfAsset.scene; // Guardamos la referencia al modelo ivana2
	ivana2.scale.set(50, 50, 50);
	ivana2.rotation.y = Math.PI; // Rota el modelo 180 grados
	ivana2.name = "modelo";
	scene.add(ivana2);

	mixer = new THREE.AnimationMixer(ivana2);
    breathingAction = mixer.clipAction(gltfAsset.animations.find(clip => clip.name === 'breathing'));
    walkingAction = mixer.clipAction(gltfAsset.animations.find(clip => clip.name === 'walking'));

    // Comienza con la animación "breathing"
    breathingAction.play();

	animate();


}


function controles(delta) {

	var cameraDirection = new THREE.Vector3();
	camera.getWorldDirection(cameraDirection);
	cameraDirection.y = 0; // Elimina la componente vertical
	cameraDirection.normalize();

	var moveDistance = 200 * delta; // 200 pixels per second
	var moveVector = cameraDirection.clone().multiplyScalar(moveDistance); // Vector de movimiento de la cámara en la dirección de la esfera

	var angleRadians = angle * Math.PI / 180;

	if (keyboard.pressed("A")) {
		angle += moveDistance; // Incrementa el ángulo
		// Calcula la nueva posición de la cámara alrededor de la esfera
		camera.position.x = ivana2.position.x + radius * Math.sin(angleRadians); // Calcula la nueva posición de la cámara alrededor de la esfera
		camera.position.z = ivana2.position.z + radius * Math.cos(angleRadians);
		camera.lookAt(ivana2.position); // Mira hacia la esfera
		ivana2.lookAt(camera.position); // Hace que la esfera mire hacia la cámara
		ivana2.rotateOnAxis(new THREE.Vector3(0, 1, 0), Math.PI); // Rota el modelo 180 grados
		// ivana2.rotation.x = 0;
		// ivana2.rotation.z = 0;
	}

	if (keyboard.pressed("D")) {
		angle -= moveDistance; // Decrementa el ángulo
		// Calcula la nueva posición de la cámara alrededor de la esfera
		camera.position.x = ivana2.position.x + radius * Math.sin(angleRadians);
		camera.position.z = ivana2.position.z + radius * Math.cos(angleRadians);
		camera.lookAt(ivana2.position); // Mira hacia la esfera
		ivana2.lookAt(camera.position); // Hace que la esfera mire hacia la cámara
		ivana2.rotateOnAxis(new THREE.Vector3(0, 1, 0), Math.PI); // Rota el modelo 180 grados
		// ivana2.rotation.x = 0;
		// ivana2.rotation.z = 0;
	}

	if (keyboard.pressed("shift"))
		moveVector.multiplyScalar(2); // Mueve la cámara 2 veces más rápido

	if (keyboard.pressed("W")) {
        ivana2.position.add(moveVector);
        camera.position.add(moveVector); // Mueve la cámara en la dirección de la esfera

        if (breathingAction) breathingAction.stop(); // Detiene la animación "breathing"
        if (walkingAction) walkingAction.play(); // Comienza la animación "walking"
    }
    if (keyboard.pressed("S")) {
        ivana2.position.sub(moveVector);
        camera.position.sub(moveVector); // Mueve la cámara en la dirección opuesta a la esfera

        if (breathingAction) breathingAction.stop(); // Detiene la animación "breathing"
        if (walkingAction) walkingAction.play(); // Comienza la animación "walking"
    }

    if (!keyboard.pressed("W") && !keyboard.pressed("S")) {
        // Si no se están presionando las teclas "w" o "s", cambia a la animación "breathing"
        if (walkingAction) walkingAction.stop();
        if (breathingAction) breathingAction.play();
    }
	
}


function render() {
	renderer.render(scene, camera);
}