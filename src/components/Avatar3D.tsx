import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { EmotionType } from '../types';
import { audioEngine } from '../utils/audioEngine';

interface Avatar3DProps {
  emotion: EmotionType;
  isSpeaking: boolean;
  isListening: boolean;
  isThinking: boolean;
  onPet?: (zone: 'head' | 'chin') => void;
  className?: string;
}

export const Avatar3D: React.FC<Avatar3DProps> = ({
  emotion,
  isSpeaking,
  isListening,
  isThinking,
  onPet,
  className = '',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);

  // References to animated 3D parts
  const avatarGroupRef = useRef<THREE.Group | null>(null);
  const headGroupRef = useRef<THREE.Group | null>(null);
  const jawRef = useRef<THREE.Group | null>(null);
  const leftEarRef = useRef<THREE.Group | null>(null);
  const rightEarRef = useRef<THREE.Group | null>(null);
  const leftEyeRef = useRef<THREE.Group | null>(null);
  const rightEyeRef = useRef<THREE.Group | null>(null);
  const leftPupilRef = useRef<THREE.Mesh | null>(null);
  const rightPupilRef = useRef<THREE.Mesh | null>(null);
  const leftUpperLidRef = useRef<THREE.Mesh | null>(null);
  const rightUpperLidRef = useRef<THREE.Mesh | null>(null);
  const leftBrowRef = useRef<THREE.Group | null>(null);
  const rightBrowRef = useRef<THREE.Group | null>(null);
  const leftPawRef = useRef<THREE.Group | null>(null);
  const rightPawRef = useRef<THREE.Group | null>(null);
  const tailRef = useRef<THREE.Group | null>(null);
  const bodyRef = useRef<THREE.Group | null>(null);
  const whiskersRef = useRef<THREE.Group[]>([]);
  const particlesRef = useRef<THREE.Points | null>(null);

  // Interaction & animation tracking
  const pointerPos = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const targetHeadRot = useRef<{ x: number; y: number; z: number }>({ x: 0, y: 0, z: 0 });
  const isPetting = useRef<boolean>(false);
  const petTimeoutRef = useRef<any>(null);
  const blinkTimer = useRef<number>(0);
  const nextBlink = useRef<number>(2.5);
  const blinkState = useRef<number>(0); // 0 = open, 1 = closed
  const mouthOpenAmount = useRef<number>(0);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // 1. Scene setup
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const width = container.clientWidth || 600;
    const height = container.clientHeight || 600;

    const camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 100);
    camera.position.set(0, 0.4, 4.2);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    rendererRef.current = renderer;

    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // 2. Sophisticated 3-Point Lighting Setup (Pixar-like warm friendly glow)
    const ambientLight = new THREE.AmbientLight(0xfff5ea, 0.95);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffecd2, 1.3);
    keyLight.position.set(2.5, 4, 3);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0xd9e8ff, 0.85);
    fillLight.position.set(-3, 2, 2.5);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0xffeedd, 1.2);
    rimLight.position.set(0, 3, -3.5);
    scene.add(rimLight);

    // 3. Materials
    // Soft velvety cat fur (warm golden-cream / apricot tabby highlights)
    const furMaterial = new THREE.MeshStandardMaterial({
      color: 0xdeb887, // Burlywood / Warm sand golden
      roughness: 0.72,
      metalness: 0.05,
    });

    const creamFurMaterial = new THREE.MeshStandardMaterial({
      color: 0xfff8ee, // Cream white for muzzle, chest bib
      roughness: 0.65,
      metalness: 0.02,
    });

    const innerEarMaterial = new THREE.MeshStandardMaterial({
      color: 0xffb7b2, // Soft gentle rose pink
      roughness: 0.6,
    });

    const noseMaterial = new THREE.MeshStandardMaterial({
      color: 0xf49ac2, // Cute kitten pink
      roughness: 0.35,
    });

    const eyeWhiteMat = new THREE.MeshStandardMaterial({
      color: 0xfcfdfd,
      roughness: 0.1,
    });

    const irisMat = new THREE.MeshStandardMaterial({
      color: 0x10b981, // Emerald green / vibrant caring eyes
      roughness: 0.15,
      metalness: 0.1,
    });

    const pupilMat = new THREE.MeshBasicMaterial({
      color: 0x0f172a,
    });

    const corneaHighlightMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
    });

    const mouthInsideMat = new THREE.MeshStandardMaterial({
      color: 0x991b1b,
      roughness: 0.4,
    });

    const tongueMat = new THREE.MeshStandardMaterial({
      color: 0xf87171,
      roughness: 0.3,
    });

    const whiskerMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.85,
    });

    // 4. Character Construction
    const avatarGroup = new THREE.Group();
    avatarGroupRef.current = avatarGroup;
    scene.add(avatarGroup);

    // HEAD GROUP (holds all facial elements and rotates naturally)
    const headGroup = new THREE.Group();
    headGroup.position.set(0, 0.45, 0);
    headGroupRef.current = headGroup;
    avatarGroup.add(headGroup);

    // Head Cranium Geometry
    const headGeom = new THREE.SphereGeometry(0.85, 36, 36);
    headGeom.scale(1.05, 0.96, 0.98);
    const headMesh = new THREE.Mesh(headGeom, furMaterial);
    headMesh.castShadow = true;
    headMesh.receiveShadow = true;
    headGroup.add(headMesh);

    // Cheek Puffs (makes Tom look adorable and friendly)
    const cheekGeom = new THREE.SphereGeometry(0.38, 24, 24);
    cheekGeom.scale(1.1, 0.8, 0.7);

    const leftCheek = new THREE.Mesh(cheekGeom, furMaterial);
    leftCheek.position.set(-0.52, -0.22, 0.38);
    headGroup.add(leftCheek);

    const rightCheek = new THREE.Mesh(cheekGeom, furMaterial);
    rightCheek.position.set(0.52, -0.22, 0.38);
    headGroup.add(rightCheek);

    // Muzzle / Snout (Cream White)
    const muzzleGeom = new THREE.SphereGeometry(0.36, 28, 28);
    muzzleGeom.scale(1.2, 0.78, 0.85);
    const muzzle = new THREE.Mesh(muzzleGeom, creamFurMaterial);
    muzzle.position.set(0, -0.16, 0.62);
    headGroup.add(muzzle);

    // Cute Kitten Nose
    const noseGeom = new THREE.ConeGeometry(0.09, 0.08, 16);
    noseGeom.rotateX(Math.PI);
    noseGeom.scale(1.4, 1.0, 0.7);
    const nose = new THREE.Mesh(noseGeom, noseMaterial);
    nose.position.set(0, -0.06, 0.92);
    headGroup.add(nose);

    // EARS with pivot groups for expressive rotation
    const makeEar = (isLeft: boolean) => {
      const earGroup = new THREE.Group();
      earGroup.position.set(isLeft ? -0.56 : 0.56, 0.72, 0.08);

      // Outer ear shell (triangular curved cone)
      const earGeom = new THREE.ConeGeometry(0.36, 0.75, 4);
      earGeom.scale(0.9, 1.0, 0.45);
      const outerEar = new THREE.Mesh(earGeom, furMaterial);
      outerEar.rotation.y = isLeft ? 0.3 : -0.3;
      outerEar.rotation.z = isLeft ? 0.38 : -0.38;
      outerEar.position.set(0, 0.3, 0);
      earGroup.add(outerEar);

      // Inner pink ear cavity
      const innerGeom = new THREE.ConeGeometry(0.24, 0.58, 4);
      innerGeom.scale(0.8, 1.0, 0.3);
      const innerEar = new THREE.Mesh(innerGeom, innerEarMaterial);
      innerEar.position.set(isLeft ? 0.04 : -0.04, 0.28, 0.08);
      innerEar.rotation.y = isLeft ? 0.3 : -0.3;
      innerEar.rotation.z = isLeft ? 0.38 : -0.38;
      earGroup.add(innerEar);

      return earGroup;
    };

    const leftEar = makeEar(true);
    leftEarRef.current = leftEar;
    headGroup.add(leftEar);

    const rightEar = makeEar(false);
    rightEarRef.current = rightEar;
    headGroup.add(rightEar);

    // EYES with Eyelids for natural Blinking and Emotion Squinting
    const makeEye = (isLeft: boolean) => {
      const eyeGroup = new THREE.Group();
      eyeGroup.position.set(isLeft ? -0.32 : 0.32, 0.12, 0.72);

      // Sclera (White ball)
      const scleraGeom = new THREE.SphereGeometry(0.22, 28, 28);
      scleraGeom.scale(1.0, 1.08, 0.85);
      const sclera = new THREE.Mesh(scleraGeom, eyeWhiteMat);
      eyeGroup.add(sclera);

      // Iris (Emerald green)
      const irisGeom = new THREE.CylinderGeometry(0.14, 0.14, 0.04, 24);
      irisGeom.rotateX(Math.PI / 2);
      const iris = new THREE.Mesh(irisGeom, irisMat);
      iris.position.set(0, 0, 0.18);
      eyeGroup.add(iris);

      // Pupil (Dilates and tracks)
      const pupilGeom = new THREE.CylinderGeometry(0.075, 0.075, 0.05, 20);
      pupilGeom.rotateX(Math.PI / 2);
      const pupil = new THREE.Mesh(pupilGeom, pupilMat);
      pupil.position.set(0, 0, 0.19);
      eyeGroup.add(pupil);

      // Cornea reflection catchlights (gives life to the eyes!)
      const highlight1 = new THREE.Mesh(new THREE.SphereGeometry(0.032, 12, 12), corneaHighlightMat);
      highlight1.position.set(0.04, 0.05, 0.22);
      eyeGroup.add(highlight1);

      const highlight2 = new THREE.Mesh(new THREE.SphereGeometry(0.016, 10, 10), corneaHighlightMat);
      highlight2.position.set(-0.04, -0.04, 0.22);
      eyeGroup.add(highlight2);

      // Upper Eyelid (for blinking and smiling squint)
      const lidGeom = new THREE.SphereGeometry(0.24, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2);
      lidGeom.scale(1.04, 1.1, 0.9);
      const upperLid = new THREE.Mesh(lidGeom, furMaterial);
      upperLid.position.set(0, 0.02, 0);
      upperLid.rotation.x = -Math.PI / 2; // fully open by default
      eyeGroup.add(upperLid);

      return { eyeGroup, pupil, upperLid };
    };

    const leftEyeData = makeEye(true);
    leftEyeRef.current = leftEyeData.eyeGroup;
    leftPupilRef.current = leftEyeData.pupil;
    leftUpperLidRef.current = leftEyeData.upperLid;
    headGroup.add(leftEyeData.eyeGroup);

    const rightEyeData = makeEye(false);
    rightEyeRef.current = rightEyeData.eyeGroup;
    rightPupilRef.current = rightEyeData.pupil;
    rightUpperLidRef.current = rightEyeData.upperLid;
    headGroup.add(rightEyeData.eyeGroup);

    // EYEBROWS (crucial for emotional empathy, curiosity, and warmth!)
    const makeBrow = (isLeft: boolean) => {
      const browGroup = new THREE.Group();
      browGroup.position.set(isLeft ? -0.32 : 0.32, 0.42, 0.74);

      const browGeom = new THREE.CapsuleGeometry(0.04, 0.26, 8, 12);
      browGeom.rotateZ(Math.PI / 2);
      const browMesh = new THREE.Mesh(browGeom, furMaterial);
      browGroup.add(browMesh);

      return browGroup;
    };

    const leftBrow = makeBrow(true);
    leftBrowRef.current = leftBrow;
    headGroup.add(leftBrow);

    const rightBrow = makeBrow(false);
    rightBrowRef.current = rightBrow;
    headGroup.add(rightBrow);

    // MOUTH & LOWER JAW (Articulates when speaking!)
    const jawGroup = new THREE.Group();
    jawGroup.position.set(0, -0.28, 0.58);
    jawRef.current = jawGroup;
    headGroup.add(jawGroup);

    // Lower chin/jaw mesh
    const jawGeom = new THREE.SphereGeometry(0.24, 20, 20);
    jawGeom.scale(0.85, 0.65, 0.85);
    const jawMesh = new THREE.Mesh(jawGeom, creamFurMaterial);
    jawMesh.position.set(0, -0.06, 0.06);
    jawGroup.add(jawMesh);

    // Inside mouth cavity (visible when mouth opens)
    const mouthCavityGeom = new THREE.SphereGeometry(0.16, 16, 16);
    mouthCavityGeom.scale(0.9, 0.6, 0.8);
    const mouthCavity = new THREE.Mesh(mouthCavityGeom, mouthInsideMat);
    mouthCavity.position.set(0, 0.02, 0.05);
    jawGroup.add(mouthCavity);

    // Tongue
    const tongueGeom = new THREE.SphereGeometry(0.1, 12, 12);
    tongueGeom.scale(0.9, 0.35, 1.2);
    const tongue = new THREE.Mesh(tongueGeom, tongueMat);
    tongue.position.set(0, -0.02, 0.12);
    jawGroup.add(tongue);

    // WHISKERS
    const whiskers: THREE.Group[] = [];
    const whiskerCurve = (length: number, angleZ: number, angleY: number) => {
      const g = new THREE.Group();
      const geom = new THREE.CylinderGeometry(0.007, 0.002, length, 6);
      geom.rotateZ(Math.PI / 2);
      const mesh = new THREE.Mesh(geom, whiskerMat);
      mesh.position.x = length / 2;
      g.add(mesh);
      g.rotation.z = angleZ;
      g.rotation.y = angleY;
      return g;
    };

    // Left Whiskers
    [-0.15, 0, 0.15].forEach((angle) => {
      const w = whiskerCurve(0.48, angle, 0.25);
      w.position.set(-0.35, -0.16, 0.72);
      headGroup.add(w);
      whiskers.push(w);
    });

    // Right Whiskers
    [-0.15, 0, 0.15].forEach((angle) => {
      const w = whiskerCurve(0.48, -angle, -0.25);
      w.position.set(0.35, -0.16, 0.72);
      w.scale.x = -1;
      headGroup.add(w);
      whiskers.push(w);
    });
    whiskersRef.current = whiskers;

    // BODY & CHEST
    const bodyGroup = new THREE.Group();
    bodyGroup.position.set(0, -0.9, -0.15);
    bodyRef.current = bodyGroup;
    avatarGroup.add(bodyGroup);

    // Main torso
    const torsoGeom = new THREE.SphereGeometry(0.88, 32, 32);
    torsoGeom.scale(0.92, 1.25, 0.85);
    const torso = new THREE.Mesh(torsoGeom, furMaterial);
    torso.castShadow = true;
    torso.receiveShadow = true;
    bodyGroup.add(torso);

    // Chest bib / fluffy tummy (Cream)
    const tummyGeom = new THREE.SphereGeometry(0.68, 24, 24);
    tummyGeom.scale(0.8, 1.1, 0.5);
    const tummy = new THREE.Mesh(tummyGeom, creamFurMaterial);
    tummy.position.set(0, 0.12, 0.48);
    bodyGroup.add(tummy);

    // PAWS (can rest at bottom or wave)
    const makePaw = (isLeft: boolean) => {
      const pawGroup = new THREE.Group();
      pawGroup.position.set(isLeft ? -0.58 : 0.58, -0.65, 0.55);

      const pawArmGeom = new THREE.CylinderGeometry(0.18, 0.22, 0.55, 16);
      const pawArm = new THREE.Mesh(pawArmGeom, furMaterial);
      pawArm.position.set(0, 0.1, 0);
      pawGroup.add(pawArm);

      const pawFootGeom = new THREE.SphereGeometry(0.24, 18, 18);
      pawFootGeom.scale(1.0, 0.65, 1.25);
      const pawFoot = new THREE.Mesh(pawFootGeom, creamFurMaterial);
      pawFoot.position.set(0, -0.14, 0.12);
      pawGroup.add(pawFoot);

      // Cute toe pads (gentle pink)
      [-0.08, 0, 0.08].forEach((x) => {
        const toe = new THREE.Mesh(new THREE.SphereGeometry(0.045, 10, 10), innerEarMaterial);
        toe.scale.set(1, 0.4, 1);
        toe.position.set(x, -0.12, 0.24);
        pawGroup.add(toe);
      });

      return pawGroup;
    };

    const leftPaw = makePaw(true);
    leftPawRef.current = leftPaw;
    avatarGroup.add(leftPaw);

    const rightPaw = makePaw(false);
    rightPawRef.current = rightPaw;
    avatarGroup.add(rightPaw);

    // TAIL (curled behind with gentle harmonic swaying)
    const tailGroup = new THREE.Group();
    tailGroup.position.set(0, -0.7, -0.7);
    tailRef.current = tailGroup;
    avatarGroup.add(tailGroup);

    const tailCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0.25, 0.2, -0.2),
      new THREE.Vector3(0.5, 0.6, -0.1),
      new THREE.Vector3(0.35, 1.0, 0.15),
    ]);
    const tailGeom = new THREE.TubeGeometry(tailCurve, 20, 0.12, 10, false);
    const tailMesh = new THREE.Mesh(tailGeom, furMaterial);
    tailGroup.add(tailMesh);

    // Floating heart / delight particles for petting
    const particleCount = 25;
    const particleGeom = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount * 3; i += 3) {
      particlePositions[i] = (Math.random() - 0.5) * 1.5;
      particlePositions[i + 1] = Math.random() * 2;
      particlePositions[i + 2] = (Math.random() - 0.5) * 1.5 + 0.5;
    }
    particleGeom.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));

    const particleMat = new THREE.PointsMaterial({
      color: 0xf43f5e,
      size: 0.14,
      transparent: true,
      opacity: 0,
    });
    const particles = new THREE.Points(particleGeom, particleMat);
    particlesRef.current = particles;
    scene.add(particles);

    // 5. Pointer tracking & Petting listeners
    const handlePointerMove = (e: MouseEvent | TouchEvent) => {
      const rect = container.getBoundingClientRect();
      let clientX = 0;
      let clientY = 0;

      if ('touches' in e && e.touches.length > 0) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
      } else if ('clientX' in e) {
        clientX = (e as MouseEvent).clientX;
        clientY = (e as MouseEvent).clientY;
      }

      const x = ((clientX - rect.left) / rect.width) * 2 - 1;
      const y = -(((clientY - rect.top) / rect.height) * 2 - 1);

      pointerPos.current = { x, y };

      // Check if petting head or chin
      if (Math.abs(x) < 0.45 && y > -0.2 && y < 0.6) {
        triggerPet(y > 0.2 ? 'head' : 'chin');
      }
    };

    const triggerPet = (zone: 'head' | 'chin') => {
      if (isPetting.current) return;
      isPetting.current = true;
      audioEngine.startPurring();
      onPet?.(zone);

      if (particlesRef.current) {
        (particlesRef.current.material as THREE.PointsMaterial).opacity = 0.85;
      }

      clearTimeout(petTimeoutRef.current);
      petTimeoutRef.current = setTimeout(() => {
        isPetting.current = false;
        audioEngine.stopPurring();
        if (particlesRef.current) {
          (particlesRef.current.material as THREE.PointsMaterial).opacity = 0;
        }
      }, 1800);
    };

    const handlePointerDown = (e: MouseEvent | TouchEvent) => {
      audioEngine.initAudioContext();
      handlePointerMove(e);
      triggerPet('chin');
    };

    container.addEventListener('mousemove', handlePointerMove);
    container.addEventListener('mousedown', handlePointerDown);
    container.addEventListener('touchmove', handlePointerMove, { passive: true });
    container.addEventListener('touchstart', handlePointerDown, { passive: true });

    // 6. Resize Observer
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width: w, height: h } = entry.contentRect;
        if (w > 0 && h > 0 && cameraRef.current && rendererRef.current) {
          cameraRef.current.aspect = w / h;
          cameraRef.current.updateProjectionMatrix();
          rendererRef.current.setSize(w, h);
        }
      }
    });
    resizeObserver.observe(container);

    // 7. Main Animation Loop
    let animationFrameId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      const elapsed = clock.getElapsedTime();

      // Breathing idle motion
      const breath = Math.sin(elapsed * 2.2) * 0.02;
      if (avatarGroupRef.current) {
        avatarGroupRef.current.position.y = breath;
      }

      // Tail swish
      if (tailRef.current) {
        tailRef.current.rotation.y = Math.sin(elapsed * 1.8) * 0.28;
        tailRef.current.rotation.z = Math.cos(elapsed * 1.8) * 0.12;
      }

      // Whisker dynamic spring
      whiskersRef.current.forEach((w, idx) => {
        const offset = idx % 3;
        w.rotation.z += Math.sin(elapsed * 4 + offset) * 0.008;
      });

      // BLINKING LOGIC
      blinkTimer.current += delta;
      if (blinkTimer.current > nextBlink.current) {
        blinkState.current = 1;
        if (blinkTimer.current > nextBlink.current + 0.16) {
          blinkState.current = 0;
          blinkTimer.current = 0;
          nextBlink.current = 2.5 + Math.random() * 3.5;
        }
      }

      // Target head rotation from pointer position (subtle, natural range)
      let desiredHeadX = -pointerPos.current.y * 0.28;
      let desiredHeadY = pointerPos.current.x * 0.38;
      let desiredHeadZ = -pointerPos.current.x * 0.08;

      // Emotion modifications
      let targetBrowTilt = 0;
      let targetBrowY = 0.42;
      let targetEarL = 0;
      let targetEarR = 0;
      let targetSquint = 0;

      if (isPetting.current) {
        desiredHeadZ += 0.18; // lean pleasantly into the pet
        desiredHeadX -= 0.12;
        targetSquint = 0.85;  // blissfully half-closed eyes
        targetBrowTilt = 0.15;
      } else if (emotion === 'empathetic' || emotion === 'comforting') {
        desiredHeadZ = 0.12;  // compassionate tilt
        desiredHeadX = 0.05;
        targetBrowTilt = 0.22; // sympathetic caring brow tilt
        targetSquint = 0.25;  // warm soft gaze
        targetEarL = -0.12;
      } else if (emotion === 'curious' || isListening) {
        desiredHeadZ = -0.16; // curious perked tilt
        desiredHeadX = -0.08;
        targetBrowY = 0.48;   // raised curious eyebrows
        targetEarR = 0.22;    // perked listening ear
        targetSquint = -0.1;  // wide open curious eyes
      } else if (emotion === 'happy' || emotion === 'excited') {
        desiredHeadX = Math.sin(elapsed * 5) * 0.04;
        targetSquint = 0.55;  // joyful smiling crescent eyes
        targetBrowY = 0.46;
        targetEarL = 0.15;
        targetEarR = 0.15;
      } else if (emotion === 'thinking' || isThinking) {
        desiredHeadX = -0.18; // looks slightly up and to the side
        desiredHeadY = -0.24;
        targetBrowTilt = -0.18; // thoughtful furrow
        targetSquint = 0.2;
      }

      // Smooth dampening towards target rotations
      targetHeadRot.current.x = THREE.MathUtils.lerp(targetHeadRot.current.x, desiredHeadX, 0.08);
      targetHeadRot.current.y = THREE.MathUtils.lerp(targetHeadRot.current.y, desiredHeadY, 0.08);
      targetHeadRot.current.z = THREE.MathUtils.lerp(targetHeadRot.current.z, desiredHeadZ, 0.08);

      if (headGroupRef.current) {
        headGroupRef.current.rotation.x = targetHeadRot.current.x;
        headGroupRef.current.rotation.y = targetHeadRot.current.y;
        headGroupRef.current.rotation.z = targetHeadRot.current.z;
      }

      // EYES & BLINKING / SQUINTING
      const effectiveSquint = Math.max(blinkState.current, targetSquint);
      // Eyelid rotation: -Math.PI/2 is wide open, 0 is closed
      const lidAngle = THREE.MathUtils.lerp(-Math.PI / 2, 0, effectiveSquint);

      if (leftUpperLidRef.current && rightUpperLidRef.current) {
        leftUpperLidRef.current.rotation.x = lidAngle;
        rightUpperLidRef.current.rotation.x = lidAngle;
      }

      // Pupils track pointer slightly within eye sockets
      const pupilX = THREE.MathUtils.clamp(pointerPos.current.x * 0.04, -0.04, 0.04);
      const pupilY = THREE.MathUtils.clamp(pointerPos.current.y * 0.04, -0.03, 0.03);
      if (leftPupilRef.current && rightPupilRef.current) {
        leftPupilRef.current.position.x = pupilX;
        leftPupilRef.current.position.y = pupilY;
        rightPupilRef.current.position.x = pupilX;
        rightPupilRef.current.position.y = pupilY;
      }

      // Eyebrows
      if (leftBrowRef.current && rightBrowRef.current) {
        leftBrowRef.current.rotation.z = targetBrowTilt;
        rightBrowRef.current.rotation.z = -targetBrowTilt;
        leftBrowRef.current.position.y = targetBrowY;
        rightBrowRef.current.position.y = targetBrowY;
      }

      // Ears expressive rotation
      if (leftEarRef.current && rightEarRef.current) {
        leftEarRef.current.rotation.z = 0.38 + targetEarL;
        rightEarRef.current.rotation.z = -0.38 - targetEarR;
      }

      // MOUTH LIP-SYNC ANIMATION
      if (isSpeaking) {
        // Natural varied speech cadence
        const speechWave = Math.sin(elapsed * 16) * 0.5 + Math.sin(elapsed * 23) * 0.3 + 0.5;
        mouthOpenAmount.current = THREE.MathUtils.lerp(mouthOpenAmount.current, Math.max(0, speechWave) * 0.28, 0.25);
      } else {
        mouthOpenAmount.current = THREE.MathUtils.lerp(mouthOpenAmount.current, 0, 0.15);
      }

      if (jawRef.current) {
        jawRef.current.position.y = -0.28 - mouthOpenAmount.current;
        jawRef.current.rotation.x = mouthOpenAmount.current * 0.45;
      }

      // Floating pet particles upward drift
      if (particlesRef.current && (particlesRef.current.material as THREE.PointsMaterial).opacity > 0.01) {
        const pos = particlesRef.current.geometry.attributes.position.array as Float32Array;
        for (let i = 1; i < pos.length; i += 3) {
          pos[i] += 0.015;
          if (pos[i] > 2.2) pos[i] = 0;
        }
        particlesRef.current.geometry.attributes.position.needsUpdate = true;
      }

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
      clearTimeout(petTimeoutRef.current);
      container.removeEventListener('mousemove', handlePointerMove);
      container.removeEventListener('mousedown', handlePointerDown);
      container.removeEventListener('touchmove', handlePointerMove);
      container.removeEventListener('touchstart', handlePointerDown);
      renderer.dispose();
    };
  }, [emotion, isSpeaking, isListening, isThinking, onPet]);

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full cursor-grab active:cursor-grabbing select-none ${className}`}
      id="avatar-3d-canvas-container"
      title="Interact with Tom! Pet his chin or head, or speak to him"
    />
  );
};
