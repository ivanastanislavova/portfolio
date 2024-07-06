// Importamos las dependencias necesarias
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// Definimos la clase IvanaModel
class IvanaModel {
  constructor() {
    // Inicializamos las propiedades de la clase
    this.container = document.getElementById('ivana-container'); // Contenedor del modelo 3D
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true }); // Renderizador WebGL
    this.camera = new THREE.PerspectiveCamera(45, this.container.clientWidth / this.container.clientHeight); // Cámara
    this.controls = new OrbitControls(this.camera, this.renderer.domElement); // Controles de la cámara
    this.scene = new THREE.Scene(); // Escena
    this.mixer = null; // Mezclador de animaciones
    this.waveAction = null; // Acción de saludo
    this.stumbleAction = null; // Acción de tropezar
    this.isStumbling = false; // Indica si el modelo está tropezando
    this.clock = new THREE.Clock(); // Reloj para controlar el tiempo de las animaciones
  }

  // Método para inicializar el modelo
  init() {
    window.onload = () => this.loadModel(); // Cargamos el modelo cuando la página se ha cargado
  }

  // Método para cargar el modelo
  loadModel() {
    const loader = new GLTFLoader(); // Cargador de modelos GLTF
    loader.load('ivana.glb', // Ruta del modelo
      (gltf) => { // Callback cuando el modelo se ha cargado
        this.setupScene(gltf); // Configuramos la escena
        document.getElementById('ivana-cargando').style.display = 'none'; // Ocultamos el mensaje de carga
      }, 
      (xhr) => { // Callback durante la carga del modelo
        const percentCompletion = Math.round((xhr.loaded / xhr.total) * 100); // Porcentaje de carga
        document.getElementById('ivana-cargando').innerText = `Cargando... ${percentCompletion}%` // Actualizamos el mensaje de carga
        console.log(`Cargando modelo... ${percentCompletion}%`);
      }, 
      (error) => { // Callback en caso de error
        console.log(error);
      }
    );
  }

  // Método para configurar la escena
  setupScene(gltf) {
    this.setupRenderer(); // Configuramos el renderizador
    this.setupCamera(); // Configuramos la cámara
    this.setupControls(); // Configuramos los controles
    this.setupLighting(); // Configuramos la iluminación
    this.setupModel(gltf); // Configuramos el modelo
    this.setupGround(); // Configuramos el suelo
    this.setupAnimations(gltf); // Configuramos las animaciones
    this.setupEventListeners(); // Configuramos los listeners de eventos

    this.animate(); // Iniciamos la animación
    this.waveAction.play(); // Iniciamos la acción de saludo
  }

  // Método para configurar el renderizador
  setupRenderer() {
    this.renderer.outputColorSpace = THREE.SRGBColorSpace; // Espacio de color
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight); // Tamaño del renderizador
    this.renderer.setPixelRatio(window.devicePixelRatio); // Ratio de píxeles
    this.renderer.shadowMap.enabled = true; // Habilitamos el mapa de sombras
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap; // Tipo de mapa de sombras
    this.container.appendChild(this.renderer.domElement); // Añadimos el renderizador al contenedor
  }

  // Método para configurar la cámara
  setupCamera() {
    this.camera.position.set(0.2, 0.5, 1); // Posición de la cámara
  }

  // Método para configurar los controles
  setupControls() {
    this.controls.enableDamping = true; // Habilitamos el amortiguamiento
    this.controls.enablePan = false; // Deshabilitamos el paneo
    this.controls.enableZoom = false; // Deshabilitamos el zoom
    this.controls.minDistance = 3; // Distancia mínima
    this.controls.minPolarAngle = 1.4; // Ángulo polar mínimo
    this.controls.maxPolarAngle = 1.4; // Ángulo polar máximo
    this.controls.target = new THREE.Vector3(0, 0.75, 0); // Objetivo de los controles
    this.controls.update(); // Actualizamos los controles
  }

  // Método para configurar la iluminación
  setupLighting() {
    this.scene.add(new THREE.AmbientLight()); // Añadimos una luz ambiental

    const spotlight = new THREE.SpotLight(0xffffff, 20, 8, 1); // Creamos un foco
    spotlight.penumbra = 0.5; // Penumbra del foco
    spotlight.position.set(0, 4, 2); // Posición del foco
    spotlight.castShadow = true; // El foco proyecta sombras
    this.scene.add(spotlight); // Añadimos el foco a la escena

    const keyLight = new THREE.DirectionalLight(0xffffff, 2); // Creamos una luz direccional
    keyLight.position.set(1, 1, 2); // Posición de la luz
    keyLight.lookAt(new THREE.Vector3()); // Dirección de la luz
    this.scene.add(keyLight); // Añadimos la luz a la escena
  }

  // Método para configurar el modelo
  setupModel(gltf) {
    const ivana = gltf.scene; // Escena del modelo
    ivana.traverse((child) => { // Recorremos los hijos de la escena
      if (child.isMesh) { // Si el hijo es una malla
        child.castShadow = true; // La malla proyecta sombras
        child.receiveShadow = true; // La malla recibe sombras
      }
    });
    this.scene.add(ivana); // Añadimos la escena al modelo
  }

  // Método para configurar el suelo
  setupGround() {
    const groundGeometry = new THREE.CylinderGeometry(0.8, 0.8, 0.1, 6); // Geometría del suelo
    const groundMaterial = new THREE.MeshStandardMaterial({ color: 0x284585  }); // Material del suelo
    const groundMesh = new THREE.Mesh(groundGeometry, groundMaterial); // Malla del suelo
    groundMesh.castShadow = false; // La malla no proyecta sombras
    groundMesh.receiveShadow = true; // La malla recibe sombras
    groundMesh.position.y -= 0.05; // Posición de la malla
    this.scene.add(groundMesh); // Añadimos la malla a la escena
  }

  // Método para configurar las animaciones
  setupAnimations(gltf) {
    this.mixer = new THREE.AnimationMixer(gltf.scene); // Mezclador de animaciones
    const clips = gltf.animations; // Clips de animación
    const waveClip = THREE.AnimationClip.findByName(clips, 'waving'); // Clip de saludo
    const stumbleClip = THREE.AnimationClip.findByName(clips, 'stagger'); // Clip de tropezar
    this.waveAction = this.mixer.clipAction(waveClip); // Acción de saludo
    this.stumbleAction = this.mixer.clipAction(stumbleClip); // Acción de tropezar
  }

  // Método para configurar los listeners de eventos
  setupEventListeners() {
    const raycaster = new THREE.Raycaster(); // Raycaster para detectar interacciones
    this.container.addEventListener('mousedown', (ev) => { // Listener de evento de click
      const coords = { // Coordenadas del click
        x: (ev.offsetX / this.container.clientWidth) * 2 - 1,
        y: -(ev.offsetY / this.container.clientHeight) * 2 + 1
      };

      raycaster.setFromCamera(coords, this.camera); // Establecemos el raycaster desde la cámara
      const intersections = raycaster.intersectObject(this.scene); // Intersecciones con la escena

      if (intersections.length > 0) { // Si hay intersecciones
        if (this.isStumbling) return; // Si el modelo está tropezando, no hacemos nada
        this.isStumbling = true; // El modelo empieza a tropezar
        this.stumbleAction.reset(); // Reseteamos la acción de tropezar
        this.stumbleAction.play(); // Iniciamos la acción de tropezar
        this.waveAction.crossFadeTo(this.stumbleAction, 0.3); // Transición de la acción de saludo a la de tropezar

        setTimeout(() => { // Después de 4 segundos
          this.waveAction.reset(); // Reseteamos la acción de saludo
          this.waveAction.play(); // Iniciamos la acción de saludo
          this.stumbleAction.crossFadeTo(this.waveAction, 1); // Transición de la acción de tropezar a la de saludo
          setTimeout(() => this.isStumbling = false, 1000); // Después de 1 segundo, el modelo deja de tropezar
        }, 4000)
      }
    });

    window.addEventListener('resize', () => { // Listener de evento de redimensionado de la ventana
      this.camera.aspect = this.container.clientWidth / this.container.clientHeight; // Actualizamos el aspecto de la cámara
      this.camera.updateProjectionMatrix(); // Actualizamos la matriz de proyección de la cámara
      this.renderer.setSize(this.container.clientWidth, this.container.clientHeight); // Actualizamos el tamaño del renderizador
    });
  }

  // Método para animar el modelo
  animate() {
    requestAnimationFrame(() => this.animate()); // Solicitamos el siguiente frame de animación
    this.mixer.update(this.clock.getDelta()); // Actualizamos el mezclador con el delta de tiempo
    this.renderer.render(this.scene, this.camera); // Renderizamos la escena
  }
}

// Creamos una instancia de IvanaModel
const ivanaModel = new IvanaModel();
// Inicializamos el modelo
ivanaModel.init();