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
  onEmotionBusy?: (busy: boolean) => void;
  className?: string;
}

// Procedural texture generators for photorealistic & cute feline details
function generateEyeTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const cx = 256;
    const cy = 256;
    const r = 240;

    // Outer limbal ring (deep emerald black)
    const grad = ctx.createRadialGradient(cx, cy, 60, cx, cy, r);
    grad.addColorStop(0, '#34d399');   // Vibrant mint green
    grad.addColorStop(0.45, '#10b981'); // Emerald green
    grad.addColorStop(0.75, '#059669'); // Rich deep jade
    grad.addColorStop(0.92, '#065f46'); // Dark pine
    grad.addColorStop(1.0, '#022c22');  // Limbal border ring
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();

    // Golden halo around pupil
    const innerHalo = ctx.createRadialGradient(cx, cy, 40, cx, cy, 140);
    innerHalo.addColorStop(0, 'rgba(251, 191, 36, 0.7)'); // Amber gold
    innerHalo.addColorStop(0.6, 'rgba(245, 158, 11, 0.3)');
    innerHalo.addColorStop(1, 'rgba(16, 185, 129, 0)');
    ctx.fillStyle = innerHalo;
    ctx.beginPath();
    ctx.arc(cx, cy, 140, 0, Math.PI * 2);
    ctx.fill();

    // Radial iris fiber striations
    ctx.save();
    ctx.translate(cx, cy);
    for (let i = 0; i < 90; i++) {
      const angle = (i / 90) * Math.PI * 2;
      const len = 70 + Math.random() * 140;
      ctx.strokeStyle = i % 2 === 0 ? 'rgba(255, 255, 255, 0.18)' : 'rgba(2, 44, 34, 0.25)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(Math.cos(angle) * 50, Math.sin(angle) * 50);
      ctx.lineTo(Math.cos(angle) * len, Math.sin(angle) * len);
      ctx.stroke();
    }
    ctx.restore();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

function generateTongueTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    // Base healthy kitten pink gradient
    const grad = ctx.createLinearGradient(0, 0, 0, 256);
    grad.addColorStop(0, '#f87171');   // Coral pink base
    grad.addColorStop(0.7, '#fb7185'); // Rose pink
    grad.addColorStop(1, '#f43f5e');   // Deep pink tip
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 256, 256);

    // Subtle median lingual groove (center line)
    const groove = ctx.createLinearGradient(120, 0, 136, 0);
    groove.addColorStop(0, 'rgba(225, 29, 72, 0)');
    groove.addColorStop(0.5, 'rgba(190, 18, 60, 0.35)');
    groove.addColorStop(1, 'rgba(225, 29, 72, 0)');
    ctx.fillStyle = groove;
    ctx.fillRect(115, 0, 26, 256);

    // Micro papillae stippling for realistic kitten tongue texture
    ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
    for (let i = 0; i < 400; i++) {
      const rx = Math.random() * 256;
      const ry = Math.random() * 256;
      ctx.beginPath();
      ctx.arc(rx, ry, 1 + Math.random() * 1.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

function generateNoseTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const grad = ctx.createRadialGradient(128, 128, 20, 128, 128, 128);
    grad.addColorStop(0, '#fb7185');
    grad.addColorStop(0.8, '#f43f5e');
    grad.addColorStop(1, '#e11d48');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 256, 256);

    // Leather cobblestone pore stippling
    ctx.fillStyle = 'rgba(0, 0, 0, 0.08)';
    for (let i = 0; i < 600; i++) {
      ctx.fillRect(Math.random() * 256, Math.random() * 256, 2, 2);
    }
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

function generateBlushTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const grad = ctx.createRadialGradient(64, 64, 4, 64, 64, 60);
    grad.addColorStop(0, 'rgba(255, 95, 135, 0.92)');
    grad.addColorStop(0.35, 'rgba(255, 115, 150, 0.68)');
    grad.addColorStop(0.7, 'rgba(255, 140, 170, 0.22)');
    grad.addColorStop(1, 'rgba(255, 160, 185, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 128, 128);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

function generateSteamTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.clearRect(0, 0, 128, 128);
    const drawPuff = (x: number, y: number, r: number) => {
      const grad = ctx.createRadialGradient(x, y, 2, x, y, r);
      grad.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
      grad.addColorStop(0.45, 'rgba(240, 246, 255, 0.72)');
      grad.addColorStop(0.8, 'rgba(220, 232, 250, 0.28)');
      grad.addColorStop(1, 'rgba(215, 228, 248, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    };
    drawPuff(64, 76, 36);
    drawPuff(44, 52, 26);
    drawPuff(84, 52, 26);
    drawPuff(64, 38, 30);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

function generateAngerMarkTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.clearRect(0, 0, 128, 128);
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 11;
    ctx.lineCap = 'round';

    // 4 curved brackets facing outward forming classic cartoon anger tick 💢
    ctx.beginPath();
    ctx.arc(36, 64, 22, -Math.PI / 3, Math.PI / 3, true);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(92, 64, 22, (2 * Math.PI) / 3, (4 * Math.PI) / 3, true);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(64, 36, 22, Math.PI / 6, (5 * Math.PI) / 6, false);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(64, 92, 22, (7 * Math.PI) / 6, (11 * Math.PI) / 6, false);
    ctx.stroke();

    // Inner highlight
    ctx.strokeStyle = '#fca5a5';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.arc(36, 64, 22, -Math.PI / 3, Math.PI / 3, true);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(92, 64, 22, (2 * Math.PI) / 3, (4 * Math.PI) / 3, true);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(64, 36, 22, Math.PI / 6, (5 * Math.PI) / 6, false);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(64, 92, 22, (7 * Math.PI) / 6, (11 * Math.PI) / 6, false);
    ctx.stroke();
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

export const Avatar3D: React.FC<Avatar3DProps> = ({
  emotion,
  isSpeaking,
  isListening,
  isThinking,
  onPet,
  onEmotionBusy,
  className = '',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);

  // Stable tracking of dynamic props so Three.js scene does not restart
  const emotionRef = useRef(emotion);
  emotionRef.current = emotion;
  const isSpeakingRef = useRef(isSpeaking);
  isSpeakingRef.current = isSpeaking;
  const isListeningRef = useRef(isListening);
  isListeningRef.current = isListening;
  const isThinkingRef = useRef(isThinking);
  isThinkingRef.current = isThinking;
  const onPetRef = useRef(onPet);
  onPetRef.current = onPet;
  const onEmotionBusyRef = useRef(onEmotionBusy);
  onEmotionBusyRef.current = onEmotionBusy;

  // References to animated 3D parts
  const avatarGroupRef = useRef<THREE.Group | null>(null);
  const headGroupRef = useRef<THREE.Group | null>(null);
  const jawRef = useRef<THREE.Group | null>(null);
  const tongueRef = useRef<THREE.Mesh | null>(null);
  const leftEarRef = useRef<THREE.Group | null>(null);
  const rightEarRef = useRef<THREE.Group | null>(null);
  const leftEyeRef = useRef<THREE.Group | null>(null);
  const rightEyeRef = useRef<THREE.Group | null>(null);
  const leftPupilRef = useRef<THREE.Mesh | null>(null);
  const rightPupilRef = useRef<THREE.Mesh | null>(null);
  const leftUpperLidRef = useRef<THREE.Mesh | null>(null);
  const rightUpperLidRef = useRef<THREE.Mesh | null>(null);
  const leftLowerLidRef = useRef<THREE.Mesh | null>(null);
  const rightLowerLidRef = useRef<THREE.Mesh | null>(null);
  const leftBrowRef = useRef<THREE.Group | null>(null);
  const rightBrowRef = useRef<THREE.Group | null>(null);
  const leftPawRef = useRef<THREE.Group | null>(null);
  const rightPawRef = useRef<THREE.Group | null>(null);
  const leftBlushRef = useRef<THREE.Mesh | null>(null);
  const rightBlushRef = useRef<THREE.Mesh | null>(null);
  const leftSteamRef = useRef<THREE.Mesh | null>(null);
  const rightSteamRef = useRef<THREE.Mesh | null>(null);
  const angerMarkRef = useRef<THREE.Mesh | null>(null);
  const tailRef = useRef<THREE.Group | null>(null);
  const bodyRef = useRef<THREE.Group | null>(null);
  const tummyMeshRef = useRef<THREE.Mesh | null>(null);
  const whiskersRef = useRef<THREE.Group[]>([]);
  const particlesRef = useRef<THREE.Points | null>(null);

  // Interaction & animation tracking
  const pointerPos = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const targetHeadRot = useRef<{ x: number; y: number; z: number }>({ x: 0, y: 0, z: 0 });
  const isPetting = useRef<boolean>(false);
  const petTimeoutRef = useRef<any>(null);
  const isBlushing = useRef<boolean>(false);
  const isAngry = useRef<boolean>(false);
  const smoothBlush = useRef<number>(0);
  const smoothAngry = useRef<number>(0);
  const emotionTimeoutRef = useRef<any>(null);
  const lastTapTimeRef = useRef<number>(0);
  const lastTapZoneRef = useRef<'stomach' | 'face' | null>(null);
  const lastTapPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const blinkTimer = useRef<number>(0);
  const nextBlink = useRef<number>(2.4);
  const blinkState = useRef<number>(0);
  const blinkDuration = useRef<number>(0.18);
  const blinkProgress = useRef<number>(0);
  const isBlinking = useRef<boolean>(false);
  const isDoubleBlink = useRef<boolean>(false);
  const blinkPeak = useRef<number>(1.0);
  const mouthOpenAmount = useRef<number>(0);
  const pawBounce = useRef<number>(0);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // 1. Scene setup
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const initialWidth = container.clientWidth || 600;
    const initialHeight = container.clientHeight || 600;

    const camera = new THREE.PerspectiveCamera(38, initialWidth / initialHeight, 0.1, 100);
    camera.position.set(0, 0.35, 4.3);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(initialWidth, initialHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.08;
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    renderer.domElement.style.display = 'block';
    renderer.domElement.style.touchAction = 'none';
    rendererRef.current = renderer;

    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // Responsive camera framing function across all devices
    const updateDimensions = (w: number, h: number) => {
      if (!cameraRef.current || !rendererRef.current) return;
      const aspect = w / h;
      cameraRef.current.aspect = aspect;

      if (aspect < 1) {
        // Portrait phones - step back proportionally so Tom's entire cute body fits
        const portraitScale = Math.min(1.85, Math.max(1, 0.95 / aspect));
        cameraRef.current.position.z = 4.3 * portraitScale;
        cameraRef.current.position.y = 0.32 + (portraitScale - 1) * 0.15;
      } else if (h < 520) {
        cameraRef.current.position.z = 3.9;
        cameraRef.current.position.y = 0.22;
      } else {
        cameraRef.current.position.z = 4.3;
        cameraRef.current.position.y = 0.35;
      }

      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h, false);
      rendererRef.current.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    };

    updateDimensions(initialWidth, initialHeight);

    // 2. Cinematic 4-Point Warm Studio Lighting
    const ambientLight = new THREE.AmbientLight(0xfff7ed, 0.9);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffedd5, 1.4);
    keyLight.position.set(2.8, 4.2, 3.2);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    keyLight.shadow.bias = -0.0005;
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0xe0f2fe, 0.75);
    fillLight.position.set(-3.2, 2.2, 2.5);
    scene.add(fillLight);

    // Warm Rim light for realistic fur edge silhouette
    const rimLight = new THREE.DirectionalLight(0xfef3c7, 1.35);
    rimLight.position.set(0, 3.2, -3.8);
    scene.add(rimLight);

    const groundBounceLight = new THREE.DirectionalLight(0xfde68a, 0.3);
    groundBounceLight.position.set(0, -3, 1);
    scene.add(groundBounceLight);

    // 3. Materials with Realistic Shading
    const eyeTexture = generateEyeTexture();
    const tongueTexture = generateTongueTexture();
    const noseTexture = generateNoseTexture();
    const blushTexture = generateBlushTexture();
    const steamTexture = generateSteamTexture();
    const angerMarkTexture = generateAngerMarkTexture();

    // Main warm golden tabby fur
    const furMaterial = new THREE.MeshStandardMaterial({
      color: 0xdeb887, // Warm golden burlywood
      roughness: 0.68,
      metalness: 0.04,
    });

    // Darker tabby accent for ear backs and brow stripes
    const tabbyAccentMaterial = new THREE.MeshStandardMaterial({
      color: 0xb47942, // Rich caramel tabby
      roughness: 0.72,
      metalness: 0.02,
    });

    // Soft fluffy cream fur for muzzle, bib, inner cheek fluff
    const creamFurMaterial = new THREE.MeshStandardMaterial({
      color: 0xfffaf0, // Floral white / cream
      roughness: 0.65,
      metalness: 0.02,
    });

    // Inner ear velvety pink
    const innerEarMaterial = new THREE.MeshStandardMaterial({
      color: 0xffb7b2,
      roughness: 0.55,
      metalness: 0.02,
    });

    // Realistic stippled kitten nose
    const noseMaterial = new THREE.MeshStandardMaterial({
      map: noseTexture,
      color: 0xfda4af,
      roughness: 0.28,
      metalness: 0.05,
    });

    // Cornea / Sclera
    const eyeWhiteMat = new THREE.MeshStandardMaterial({
      color: 0xfcfdfd,
      roughness: 0.08,
    });

    // High detail luminous Iris
    const irisMat = new THREE.MeshStandardMaterial({
      map: eyeTexture,
      roughness: 0.12,
      metalness: 0.08,
      emissive: 0x059669,
      emissiveIntensity: 0.12,
    });

    // Deep cat pupil
    const pupilMat = new THREE.MeshBasicMaterial({
      color: 0x090d16,
    });

    // Cornea specular highlights (life in the eyes!)
    const corneaHighlightMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.95,
    });

    // Oral cavity (deep dark wine red)
    const mouthInsideMat = new THREE.MeshStandardMaterial({
      color: 0x7f1d1d,
      roughness: 0.35,
    });

    // Realistic glistening kitten tongue
    const tongueMat = new THREE.MeshStandardMaterial({
      map: tongueTexture,
      color: 0xff7b90,
      roughness: 0.22,
      metalness: 0.05,
    });

    // Tiny white teeth / subtle canines
    const toothMaterial = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.18,
      metalness: 0.02,
    });

    // Whisker material
    const whiskerMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.9,
    });

    // Toe bean pads
    const toePadMat = new THREE.MeshStandardMaterial({
      color: 0xf472b6,
      roughness: 0.35,
      metalness: 0.02,
    });

    // 4. Character Construction
    const avatarGroup = new THREE.Group();
    avatarGroupRef.current = avatarGroup;
    scene.add(avatarGroup);

    // HEAD GROUP (Holds skull, face, eyes, ears, jaw, and moves organically)
    const headGroup = new THREE.Group();
    headGroup.position.set(0, 0.42, 0);
    headGroupRef.current = headGroup;
    avatarGroup.add(headGroup);

    // --- A. SKULL & CRANIUM ---
    // Smooth feline cranium, slightly wider at cheeks and tapered to forehead
    const headGeom = new THREE.SphereGeometry(0.85, 36, 36);
    headGeom.scale(1.06, 0.94, 0.97);
    const headMesh = new THREE.Mesh(headGeom, furMaterial);
    headMesh.castShadow = true;
    headMesh.receiveShadow = true;
    headGroup.add(headMesh);



    // --- B. CHEEKS & JOWLS (Seamlessly blended, fluffy & cute) ---
    // Upper cheekbones (smooth transition from eye sockets to cheeks)
    const cheekGeom = new THREE.SphereGeometry(0.34, 28, 28);
    cheekGeom.scale(1.1, 0.82, 0.78);

    const leftCheek = new THREE.Mesh(cheekGeom, furMaterial);
    leftCheek.position.set(-0.46, -0.16, 0.40);
    leftCheek.rotation.y = 0.25;
    headGroup.add(leftCheek);

    const rightCheek = new THREE.Mesh(cheekGeom, furMaterial);
    rightCheek.position.set(0.46, -0.16, 0.40);
    rightCheek.rotation.y = -0.25;
    headGroup.add(rightCheek);

    // Soft Rosy Cheeks Blush Mesh Disks
    const blushGeom = new THREE.CircleGeometry(0.16, 24);
    const leftBlushMat = new THREE.MeshBasicMaterial({
      map: blushTexture,
      transparent: true,
      opacity: 0,
      depthWrite: false,
    });
    const leftBlush = new THREE.Mesh(blushGeom, leftBlushMat);
    leftBlush.position.set(-0.43, -0.16, 0.58);
    leftBlush.rotation.y = 0.28;
    leftBlush.rotation.x = -0.04;
    headGroup.add(leftBlush);
    leftBlushRef.current = leftBlush;

    const rightBlushMat = new THREE.MeshBasicMaterial({
      map: blushTexture,
      transparent: true,
      opacity: 0,
      depthWrite: false,
    });
    const rightBlush = new THREE.Mesh(blushGeom, rightBlushMat);
    rightBlush.position.set(0.43, -0.16, 0.58);
    rightBlush.rotation.y = -0.28;
    rightBlush.rotation.x = -0.04;
    headGroup.add(rightBlush);
    rightBlushRef.current = rightBlush;

    // --- C. MUZZLE & WHISKER PADS (Dual-lobed feline 'W' shape) ---
    const muzzleGroup = new THREE.Group();
    muzzleGroup.position.set(0, -0.14, 0.65);
    headGroup.add(muzzleGroup);

    // Left whisker pad pillow
    const padGeom = new THREE.SphereGeometry(0.25, 24, 24);
    padGeom.scale(1.1, 0.85, 0.95);

    const leftPad = new THREE.Mesh(padGeom, creamFurMaterial);
    leftPad.position.set(-0.18, 0, 0.08);
    leftPad.rotation.y = 0.2;
    muzzleGroup.add(leftPad);

    // Right whisker pad pillow
    const rightPad = new THREE.Mesh(padGeom, creamFurMaterial);
    rightPad.position.set(0.18, 0, 0.08);
    rightPad.rotation.y = -0.2;
    muzzleGroup.add(rightPad);

    // Kitten Nose with sculpted nostril recesses & philtrum
    const noseGeom = new THREE.ConeGeometry(0.095, 0.09, 20);
    noseGeom.rotateX(Math.PI);
    noseGeom.scale(1.45, 1.05, 0.75);
    const nose = new THREE.Mesh(noseGeom, noseMaterial);
    nose.position.set(0, 0.09, 0.31);
    muzzleGroup.add(nose);

    // Philtrum vertical seam line
    const philtrumGeom = new THREE.CylinderGeometry(0.012, 0.012, 0.12, 8);
    const philtrum = new THREE.Mesh(philtrumGeom, mouthInsideMat);
    philtrum.position.set(0, 0.02, 0.32);
    muzzleGroup.add(philtrum);

    // --- D. EARS (Seamlessly rooted into skull with ear base & inner fur) ---
    const makeOrganicEar = (isLeft: boolean) => {
      const earPivot = new THREE.Group();
      // Pivot rooted deep within skull
      earPivot.position.set(isLeft ? -0.52 : 0.52, 0.58, 0.04);

      // 1. Organic Root Mound (touches & blends perfectly with skull curvature)
      const earBaseGeom = new THREE.SphereGeometry(0.35, 20, 20);
      earBaseGeom.scale(1.0, 0.6, 0.8);
      const earBase = new THREE.Mesh(earBaseGeom, furMaterial);
      earBase.position.set(0, 0, 0);
      earPivot.add(earBase);

      // 2. Sculpted curved outer ear shell (curved cone with soft rounded tip)
      const outerEarGeom = new THREE.ConeGeometry(0.38, 0.82, 16);
      outerEarGeom.scale(0.9, 1.0, 0.45);
      const outerEar = new THREE.Mesh(outerEarGeom, furMaterial);
      outerEar.position.set(isLeft ? -0.05 : 0.05, 0.38, 0.02);
      outerEar.rotation.y = isLeft ? 0.28 : -0.28;
      outerEar.rotation.z = isLeft ? 0.32 : -0.32;
      earPivot.add(outerEar);

      // Darker tabby back-ear patch
      const earBackPatchGeom = new THREE.ConeGeometry(0.32, 0.72, 12);
      earBackPatchGeom.scale(0.85, 0.95, 0.25);
      const earBackPatch = new THREE.Mesh(earBackPatchGeom, tabbyAccentMaterial);
      earBackPatch.position.set(isLeft ? -0.05 : 0.05, 0.36, -0.06);
      earBackPatch.rotation.y = isLeft ? 0.28 : -0.28;
      earBackPatch.rotation.z = isLeft ? 0.32 : -0.32;
      earPivot.add(earBackPatch);

      // 3. Deep inner pink ear cup
      const innerEarGeom = new THREE.ConeGeometry(0.26, 0.65, 16);
      innerEarGeom.scale(0.82, 0.95, 0.28);
      const innerEar = new THREE.Mesh(innerEarGeom, innerEarMaterial);
      innerEar.position.set(isLeft ? 0.01 : -0.01, 0.34, 0.1);
      innerEar.rotation.y = isLeft ? 0.28 : -0.28;
      innerEar.rotation.z = isLeft ? 0.32 : -0.32;
      earPivot.add(innerEar);

      return earPivot;
    };

    const leftEar = makeOrganicEar(true);
    leftEarRef.current = leftEar;
    headGroup.add(leftEar);

    const rightEar = makeOrganicEar(false);
    rightEarRef.current = rightEar;
    headGroup.add(rightEar);

    // Cute Cartoon Steam Puffs above ears for Angry Animation
    const steamGeom = new THREE.PlaneGeometry(0.42, 0.42);
    const leftSteamMat = new THREE.MeshBasicMaterial({
      map: steamTexture,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    const leftSteam = new THREE.Mesh(steamGeom, leftSteamMat);
    leftSteam.position.set(-0.52, 0.98, 0.15);
    headGroup.add(leftSteam);
    leftSteamRef.current = leftSteam;

    const rightSteamMat = new THREE.MeshBasicMaterial({
      map: steamTexture,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    const rightSteam = new THREE.Mesh(steamGeom, rightSteamMat);
    rightSteam.position.set(0.52, 0.98, 0.15);
    headGroup.add(rightSteam);
    rightSteamRef.current = rightSteam;

    // Anime Anger Vein Mark (💢) above forehead
    const angerGeom = new THREE.PlaneGeometry(0.24, 0.24);
    const angerMat = new THREE.MeshBasicMaterial({
      map: angerMarkTexture,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    const angerMark = new THREE.Mesh(angerGeom, angerMat);
    angerMark.position.set(0.36, 0.48, 0.74);
    angerMark.rotation.z = 0.16;
    headGroup.add(angerMark);
    angerMarkRef.current = angerMark;

    // --- E. REALISTIC EYES (Embedded in sockets with dual eyelids) ---
    const makeOrganicEye = (isLeft: boolean) => {
      const eyeGroup = new THREE.Group();
      eyeGroup.position.set(isLeft ? -0.32 : 0.32, 0.15, 0.72);

      // Fleshy eye socket ring
      const socketGeom = new THREE.TorusGeometry(0.24, 0.035, 12, 24);
      socketGeom.scale(1.0, 1.08, 0.6);
      const socketMesh = new THREE.Mesh(socketGeom, furMaterial);
      socketMesh.position.set(0, 0, 0.02);
      eyeGroup.add(socketMesh);

      // Sclera
      const scleraGeom = new THREE.SphereGeometry(0.23, 28, 28);
      scleraGeom.scale(1.0, 1.1, 0.85);
      const sclera = new THREE.Mesh(scleraGeom, eyeWhiteMat);
      eyeGroup.add(sclera);

      // Iris with procedural texture & limbal ring
      const irisGeom = new THREE.CylinderGeometry(0.155, 0.155, 0.04, 28);
      irisGeom.rotateX(Math.PI / 2);
      const iris = new THREE.Mesh(irisGeom, irisMat);
      iris.position.set(0, 0, 0.185);
      eyeGroup.add(iris);

      // Pupil (responsive)
      const pupilGeom = new THREE.CylinderGeometry(0.078, 0.078, 0.05, 24);
      pupilGeom.rotateX(Math.PI / 2);
      const pupil = new THREE.Mesh(pupilGeom, pupilMat);
      pupil.position.set(0, 0, 0.195);
      eyeGroup.add(pupil);

      // Glistening Cornea Reflections
      const highlight1 = new THREE.Mesh(new THREE.SphereGeometry(0.035, 12, 12), corneaHighlightMat);
      highlight1.position.set(0.045, 0.055, 0.23);
      eyeGroup.add(highlight1);

      const highlight2 = new THREE.Mesh(new THREE.SphereGeometry(0.018, 10, 10), corneaHighlightMat);
      highlight2.position.set(-0.045, -0.045, 0.23);
      eyeGroup.add(highlight2);

      // Upper Eyelid
      const upperLidGeom = new THREE.SphereGeometry(0.25, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2);
      upperLidGeom.scale(1.05, 1.12, 0.92);
      const upperLid = new THREE.Mesh(upperLidGeom, furMaterial);
      upperLid.position.set(0, 0.015, 0);
      upperLid.rotation.x = -Math.PI / 2;
      eyeGroup.add(upperLid);

      // Lower Eyelid (for cute squints & smiles)
      const lowerLidGeom = new THREE.SphereGeometry(0.25, 24, 16, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2);
      lowerLidGeom.scale(1.05, 1.12, 0.92);
      const lowerLid = new THREE.Mesh(lowerLidGeom, furMaterial);
      lowerLid.position.set(0, -0.015, 0);
      lowerLid.rotation.x = Math.PI / 2;
      eyeGroup.add(lowerLid);

      return { eyeGroup, pupil, upperLid, lowerLid };
    };

    const leftEyeData = makeOrganicEye(true);
    leftEyeRef.current = leftEyeData.eyeGroup;
    leftPupilRef.current = leftEyeData.pupil;
    leftUpperLidRef.current = leftEyeData.upperLid;
    leftLowerLidRef.current = leftEyeData.lowerLid;
    headGroup.add(leftEyeData.eyeGroup);

    const rightEyeData = makeOrganicEye(false);
    rightEyeRef.current = rightEyeData.eyeGroup;
    rightPupilRef.current = rightEyeData.pupil;
    rightUpperLidRef.current = rightEyeData.upperLid;
    rightLowerLidRef.current = rightEyeData.lowerLid;
    headGroup.add(rightEyeData.eyeGroup);

    // --- F. EYEBROWS ---
    const makeBrow = (isLeft: boolean) => {
      const browGroup = new THREE.Group();
      browGroup.position.set(isLeft ? -0.32 : 0.32, 0.44, 0.74);

      const browGeom = new THREE.CapsuleGeometry(0.045, 0.28, 8, 14);
      browGeom.rotateZ(Math.PI / 2);
      const browMesh = new THREE.Mesh(browGeom, tabbyAccentMaterial);
      browGroup.add(browMesh);

      return browGroup;
    };

    const leftBrow = makeBrow(true);
    leftBrowRef.current = leftBrow;
    headGroup.add(leftBrow);

    const rightBrow = makeBrow(false);
    rightBrowRef.current = rightBrow;
    headGroup.add(rightBrow);

    // --- G. JAW, MOUTH CAVITY & TONGUE (Organic Articulation when Talking) ---
    // The jaw pivot is placed at the anatomical TMJ joint
    const jawPivot = new THREE.Group();
    jawPivot.position.set(0, -0.22, 0.48);
    jawRef.current = jawPivot;
    headGroup.add(jawPivot);

    // Seamless Lower Chin & Mandible
    const jawGeom = new THREE.SphereGeometry(0.28, 24, 24);
    jawGeom.scale(0.85, 0.65, 0.9);
    const jawMesh = new THREE.Mesh(jawGeom, creamFurMaterial);
    jawMesh.position.set(0, -0.09, 0.12);
    jawPivot.add(jawMesh);

    // Oral interior cavity (dark crimson depth)
    const mouthCavityGeom = new THREE.SphereGeometry(0.19, 18, 18);
    mouthCavityGeom.scale(0.9, 0.55, 0.85);
    const mouthCavity = new THREE.Mesh(mouthCavityGeom, mouthInsideMat);
    mouthCavity.position.set(0, 0.02, 0.08);
    jawPivot.add(mouthCavity);

    // REALISTIC CAT TONGUE (Barely peeking, beautifully sculpted with midline & curl)
    const tongueCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, -0.04, -0.05), // Root deep in throat
      new THREE.Vector3(0, 0.01, 0.1),    // Arch over mandible
      new THREE.Vector3(0, -0.01, 0.22),  // Soft rounded tip resting behind teeth
    ]);
    const tongueGeom = new THREE.TubeGeometry(tongueCurve, 16, 0.075, 12, false);
    tongueGeom.scale(1.15, 0.38, 1.0);
    const tongueMesh = new THREE.Mesh(tongueGeom, tongueMat);
    tongueMesh.position.set(0, 0, 0);
    tongueRef.current = tongueMesh;
    jawPivot.add(tongueMesh);

    // --- H. WHISKERS (Multi-row graceful cat vibrissae) ---
    const whiskers: THREE.Group[] = [];
    const whiskerCurve = (length: number, angleZ: number, angleY: number) => {
      const g = new THREE.Group();
      const geom = new THREE.CylinderGeometry(0.007, 0.0015, length, 6);
      geom.rotateZ(Math.PI / 2);
      const mesh = new THREE.Mesh(geom, whiskerMat);
      mesh.position.x = length / 2;
      g.add(mesh);
      g.rotation.z = angleZ;
      g.rotation.y = angleY;
      return g;
    };

    // 3 Left whisker tiers
    [-0.18, -0.02, 0.16].forEach((angle, idx) => {
      const w = whiskerCurve(0.55 + idx * 0.04, angle, 0.22);
      w.position.set(-0.28, -0.14 - idx * 0.03, 0.74);
      headGroup.add(w);
      whiskers.push(w);
    });

    // 3 Right whisker tiers
    [-0.18, -0.02, 0.16].forEach((angle, idx) => {
      const w = whiskerCurve(0.55 + idx * 0.04, -angle, -0.22);
      w.position.set(0.28, -0.14 - idx * 0.03, 0.74);
      w.scale.x = -1;
      headGroup.add(w);
      whiskers.push(w);
    });
    whiskersRef.current = whiskers;

    // --- I. NECK & THROAT RUFF (Connects head to torso seamlessly) ---
    const neckGroup = new THREE.Group();
    neckGroup.position.set(0, -0.32, 0);
    avatarGroup.add(neckGroup);

    const neckGeom = new THREE.CylinderGeometry(0.58, 0.78, 0.45, 24);
    neckGeom.scale(1.0, 1.0, 0.9);
    const neckMesh = new THREE.Mesh(neckGeom, furMaterial);
    neckGroup.add(neckMesh);

    // Fluffy white throat collar ruff
    const ruffGeom = new THREE.SphereGeometry(0.48, 20, 20);
    ruffGeom.scale(1.1, 0.6, 0.85);
    const ruffMesh = new THREE.Mesh(ruffGeom, creamFurMaterial);
    ruffMesh.position.set(0, -0.1, 0.32);
    neckGroup.add(ruffMesh);

    // --- J. BODY, CHEST BIB & HIND LEGS ---
    const bodyGroup = new THREE.Group();
    bodyGroup.position.set(0, -0.92, -0.12);
    bodyRef.current = bodyGroup;
    avatarGroup.add(bodyGroup);

    // Main torso with natural feline arched posture
    const torsoGeom = new THREE.SphereGeometry(0.92, 32, 32);
    torsoGeom.scale(0.92, 1.28, 0.88);
    const torso = new THREE.Mesh(torsoGeom, furMaterial);
    torso.castShadow = true;
    torso.receiveShadow = true;
    bodyGroup.add(torso);

    // Creamy white chest bib & tummy
    const tummyGeom = new THREE.SphereGeometry(0.72, 24, 24);
    tummyGeom.scale(0.82, 1.15, 0.52);
    const tummy = new THREE.Mesh(tummyGeom, creamFurMaterial);
    tummy.position.set(0, 0.12, 0.48);
    tummy.name = 'tummyMesh';
    tummyMeshRef.current = tummy;
    bodyGroup.add(tummy);

    // Seated Hindquarter Thigh Pads (left and right)
    const makeThigh = (isLeft: boolean) => {
      const thighGeom = new THREE.SphereGeometry(0.48, 20, 20);
      thighGeom.scale(0.7, 1.0, 1.15);
      const thigh = new THREE.Mesh(thighGeom, furMaterial);
      thigh.position.set(isLeft ? -0.72 : 0.72, -0.35, 0.15);
      thigh.rotation.z = isLeft ? -0.25 : 0.25;
      return thigh;
    };
    bodyGroup.add(makeThigh(true));
    bodyGroup.add(makeThigh(false));

    // --- K. SHOULDERS, STRAIGHT ARMS & REAL CAT PAWS (HANDS) ---
    const makeShoulderArm = (isLeft: boolean) => {
      const armGroup = new THREE.Group();
      // Positioned at the anatomical shoulder of the cat, clearly visible in front-side of the torso
      armGroup.position.set(isLeft ? -0.62 : 0.62, -0.42, 0.38);

      // Smooth shoulder transition capping the arm
      const shoulderCap = new THREE.SphereGeometry(0.165, 18, 18);
      shoulderCap.scale(1.0, 1.1, 0.95);
      const shoulder = new THREE.Mesh(shoulderCap, furMaterial);
      shoulder.position.set(0, 0, 0);
      armGroup.add(shoulder);

      // Full straight arm extending down from shoulder
      const armLength = 0.68;
      const armGeom = new THREE.CylinderGeometry(0.16, 0.13, armLength, 20);
      const arm = new THREE.Mesh(armGeom, furMaterial);
      arm.position.set(0, -armLength / 2, 0.04);
      arm.rotation.x = 0.12; // Gentle forward slope matching cat posture
      armGroup.add(arm);

      // Fluffy cream fur wrist cuff
      const wristGeom = new THREE.SphereGeometry(0.155, 18, 18);
      wristGeom.scale(1.0, 0.7, 1.0);
      const wrist = new THREE.Mesh(wristGeom, creamFurMaterial);
      wrist.position.set(0, -armLength, 0.08);
      armGroup.add(wrist);

      // Real cat hand (paw) with cream fur, resting straight and flat
      const pawMainGeom = new THREE.SphereGeometry(0.21, 22, 22);
      pawMainGeom.scale(1.0, 0.58, 1.25);
      const pawMain = new THREE.Mesh(pawMainGeom, creamFurMaterial);
      pawMain.position.set(0, -armLength - 0.04, 0.18);
      armGroup.add(pawMain);

      // 4 Articulated soft rounded fingers/toes pointing straight forward
      const toeOffsets = [-0.105, -0.035, 0.035, 0.105];
      toeOffsets.forEach((tx, idx) => {
        const toeGeom = new THREE.SphereGeometry(0.072, 16, 16);
        toeGeom.scale(1.0, 0.72, 1.2);
        const toe = new THREE.Mesh(toeGeom, creamFurMaterial);
        toe.position.set(tx, -armLength - 0.05, 0.31 + (idx === 1 || idx === 2 ? 0.03 : 0));
        armGroup.add(toe);

        // Pink toe bean pad underneath
        const bean = new THREE.Mesh(new THREE.SphereGeometry(0.036, 12, 12), toePadMat);
        bean.scale.set(1, 0.4, 1);
        bean.position.set(tx, -armLength - 0.085, 0.30);
        armGroup.add(bean);
      });

      // Central palm heart bean pad
      const palmBean = new THREE.Mesh(new THREE.SphereGeometry(0.068, 14, 14), toePadMat);
      palmBean.scale.set(1.15, 0.35, 1.0);
      palmBean.position.set(0, -armLength - 0.085, 0.18);
      armGroup.add(palmBean);

      return armGroup;
    };

    const leftPaw = makeShoulderArm(true);
    leftPawRef.current = leftPaw;
    avatarGroup.add(leftPaw);

    const rightPaw = makeShoulderArm(false);
    rightPawRef.current = rightPaw;
    avatarGroup.add(rightPaw);

    // --- L. CURLED PLUSH TAIL ---
    const tailGroup = new THREE.Group();
    tailGroup.position.set(0, -0.72, -0.7);
    tailRef.current = tailGroup;
    avatarGroup.add(tailGroup);

    const tailCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0.25, 0.18, -0.2),
      new THREE.Vector3(0.55, 0.58, -0.1),
      new THREE.Vector3(0.42, 0.95, 0.18),
      new THREE.Vector3(0.3, 1.15, 0.1),
    ]);
    const tailGeom = new THREE.TubeGeometry(tailCurve, 24, 0.12, 12, false);
    const tailMesh = new THREE.Mesh(tailGeom, furMaterial);
    tailGroup.add(tailMesh);

    // White fluffy tail tip
    const tailTipGeom = new THREE.SphereGeometry(0.13, 16, 16);
    const tailTip = new THREE.Mesh(tailTipGeom, creamFurMaterial);
    tailTip.position.set(0.3, 1.15, 0.1);
    tailGroup.add(tailTip);

    // Floating delight sparkle particles for petting
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

    // 5. Pointer tracking, Petting & Double-Tap listeners
    const raycaster = new THREE.Raycaster();
    let tapResetTimeout: any = null;

    const triggerBlush = () => {
      isAngry.current = false;
      isBlushing.current = true;
      isPetting.current = false;
      clearTimeout(petTimeoutRef.current);
      clearTimeout(emotionTimeoutRef.current);

      // Stop any speech and voice recognition immediately: MUST NOT speak while blushing!
      audioEngine.stopSpeaking();
      audioEngine.stopSpeechRecognition();
      onEmotionBusyRef.current?.(true);

      audioEngine.initAudioContext();
      audioEngine.startPurring();
      audioEngine.playChime('sparkle');

      emotionTimeoutRef.current = setTimeout(() => {
        isBlushing.current = false;
        audioEngine.stopPurring();
        onEmotionBusyRef.current?.(false);
      }, 4200);
    };

    const triggerAngry = () => {
      isBlushing.current = false;
      isAngry.current = true;
      isPetting.current = false;
      clearTimeout(petTimeoutRef.current);
      clearTimeout(emotionTimeoutRef.current);

      // Stop any speech and voice recognition immediately: MUST NOT speak while angry!
      audioEngine.stopSpeaking();
      audioEngine.stopSpeechRecognition();
      onEmotionBusyRef.current?.(true);

      audioEngine.initAudioContext();
      audioEngine.stopPurring();
      audioEngine.playHiss();

      emotionTimeoutRef.current = setTimeout(() => {
        isAngry.current = false;
        onEmotionBusyRef.current?.(false);
      }, 4000);
    };

    const detectZone = (x: number, y: number): 'face' | 'stomach' | null => {
      if (cameraRef.current && avatarGroupRef.current) {
        const mouseVec = new THREE.Vector2(x, y);
        raycaster.setFromCamera(mouseVec, cameraRef.current);
        const intersects = raycaster.intersectObjects(avatarGroupRef.current.children, true);

        for (const hit of intersects) {
          let curr: THREE.Object3D | null = hit.object;
          while (curr && curr !== avatarGroupRef.current) {
            if (curr === headGroupRef.current) {
              return 'face';
            }
            if (curr === bodyRef.current || curr === tummyMeshRef.current || curr.name === 'tummyMesh') {
              return 'stomach';
            }
            curr = curr.parent;
          }
        }
      }

      // Fallback screen-coordinate zoning
      if (Math.abs(x) < 0.65) {
        if (y >= 0.05 && y < 0.85) return 'face';
        if (y < 0.05 && y > -0.85) return 'stomach';
      }
      return null;
    };

    const handlePointerMove = (e: PointerEvent) => {
      const rect = container.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
      pointerPos.current = { x, y };
      // Move events only track head/gaze - NEVER trigger emotion or speech from movement!
    };

    const handlePointerDown = (e: PointerEvent) => {
      // Ignore secondary pointers / right clicks
      if (!e.isPrimary) return;
      if (e.button !== undefined && e.button !== 0) return;

      audioEngine.initAudioContext();

      const rect = container.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
      pointerPos.current = { x, y };

      const hitZone = detectZone(x, y);
      if (!hitZone) return;

      const now = performance.now();
      const timeSinceLast = now - lastTapTimeRef.current;
      const dist = Math.hypot(x - lastTapPosRef.current.x, y - lastTapPosRef.current.y);

      if (tapResetTimeout) {
        clearTimeout(tapResetTimeout);
        tapResetTimeout = null;
      }

      // STRICT DOUBLE-TAP REQUIREMENT:
      // Must be second tap on the exact same zone, between 90ms and 420ms, within small radius
      if (lastTapZoneRef.current === hitZone && timeSinceLast >= 90 && timeSinceLast <= 420 && dist < 0.38) {
        // Genuine confirmed double tap!
        lastTapTimeRef.current = 0;
        lastTapZoneRef.current = null;

        if (hitZone === 'stomach') {
          triggerBlush();
        } else if (hitZone === 'face') {
          triggerAngry();
        }
      } else {
        // Single tap: Register candidate first tap and start reset timer.
        // NEVER triggers blush or angry on single tap!
        lastTapTimeRef.current = now;
        lastTapZoneRef.current = hitZone;
        lastTapPosRef.current = { x, y };

        tapResetTimeout = setTimeout(() => {
          lastTapTimeRef.current = 0;
          lastTapZoneRef.current = null;
        }, 420);

        // Gentle purr feedback only if not in an emotional state, without speaking!
        if (!isBlushing.current && !isAngry.current) {
          isPetting.current = true;
          audioEngine.startPurring();
          clearTimeout(petTimeoutRef.current);
          petTimeoutRef.current = setTimeout(() => {
            isPetting.current = false;
            audioEngine.stopPurring();
          }, 1200);
        }
      }
    };

    const handleDoubleClick = (e: MouseEvent) => {
      if (e.button !== 0) return;
      audioEngine.initAudioContext();
      const rect = container.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
      const hitZone = detectZone(x, y);
      if (hitZone === 'stomach') {
        triggerBlush();
      } else if (hitZone === 'face') {
        triggerAngry();
      }
    };

    container.addEventListener('pointermove', handlePointerMove);
    container.addEventListener('pointerdown', handlePointerDown);
    container.addEventListener('dblclick', handleDoubleClick);

    // 6. Resize Observer
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width: w, height: h } = entry.contentRect;
        if (w > 0 && h > 0) {
          updateDimensions(w, h);
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

      // Current active state from stable refs
      const currentEmotion = emotionRef.current;
      const currentIsListening = isListeningRef.current;
      const currentIsThinking = isThinkingRef.current;

      // Smooth framerate-independent dampening for blush and angry animations
      const targetBlushVal = isBlushing.current ? 1.0 : 0.0;
      smoothBlush.current = THREE.MathUtils.damp(smoothBlush.current, targetBlushVal, 3.2, delta);

      const targetAngryVal = isAngry.current ? 1.0 : 0.0;
      smoothAngry.current = THREE.MathUtils.damp(smoothAngry.current, targetAngryVal, 3.5, delta);

      // Absolutely DO NOT speak or mouth words when blushing or angry!
      const isEmotionSuppressed = smoothBlush.current > 0.05 || smoothAngry.current > 0.05;
      const currentIsSpeaking = !isEmotionSuppressed && isSpeakingRef.current;

      // Gentle organic breathing idle
      const breath = Math.sin(elapsed * 2.2) * 0.02;
      if (avatarGroupRef.current) {
        avatarGroupRef.current.position.y = breath;
      }

      // Tail swish (smoothly speeds up and whips agitatedly if angry)
      if (tailRef.current) {
        const tailSpeed = THREE.MathUtils.lerp(1.8, 8.2, smoothAngry.current);
        const tailAmp = THREE.MathUtils.lerp(0.28, 0.62, smoothAngry.current);
        tailRef.current.rotation.y = Math.sin(elapsed * tailSpeed) * tailAmp;
        tailRef.current.rotation.z = Math.cos(elapsed * tailSpeed) * (0.12 + 0.18 * smoothAngry.current);
      }

      // Whisker spring physics (faster twitching if angry)
      const whiskerFreq = THREE.MathUtils.lerp(4, 12.0, smoothAngry.current);
      whiskersRef.current.forEach((w, idx) => {
        const offset = idx % 3;
        w.rotation.z += Math.sin(elapsed * whiskerFreq + offset) * (0.006 + 0.01 * smoothAngry.current);
      });

      // ORGANIC SMOOTH RANDOMIZED BLINKING
      if (!isBlinking.current) {
        blinkTimer.current += delta;
        if (blinkTimer.current >= nextBlink.current) {
          isBlinking.current = true;
          blinkProgress.current = 0;
          blinkTimer.current = 0;

          // 22% chance of a gentle feline "slow blink" when content / calm
          const isSlowBlink = Math.random() < 0.22 && !isAngry.current;
          if (isSlowBlink) {
            blinkDuration.current = 0.38 + Math.random() * 0.12; // 380ms - 500ms soft slow blink
            blinkPeak.current = 0.85; // subtle relaxed half-closure
            isDoubleBlink.current = false;
          } else {
            blinkDuration.current = 0.15 + Math.random() * 0.07; // 150ms - 220ms natural brisk blink
            blinkPeak.current = 1.0;
            // 18% chance of an endearing quick double-blink
            isDoubleBlink.current = Math.random() < 0.18;
          }
        }
      } else {
        // Step blink progress smoothly with delta
        blinkProgress.current += delta / Math.max(0.08, blinkDuration.current);

        if (blinkProgress.current >= 1.0) {
          if (isDoubleBlink.current) {
            // Initiate second swift flutter blink
            isDoubleBlink.current = false;
            blinkProgress.current = 0;
            blinkDuration.current = 0.13 + Math.random() * 0.04;
            blinkPeak.current = 0.92;
          } else {
            // Blink cycle complete
            isBlinking.current = false;
            blinkProgress.current = 0;
            blinkState.current = 0;
            blinkTimer.current = 0;

            // Randomized interval before the next natural blink (2.6s - 5.8s)
            nextBlink.current = 2.6 + Math.random() * 3.2;
            if (currentIsListening || currentIsThinking) {
              nextBlink.current += 1.6; // Attentive focus causes slightly fewer blinks
            }
          }
        } else {
          // Smooth non-linear curve: fast organic close (~38% of duration), gentle ease-out reopening (~62%)
          const p = THREE.MathUtils.clamp(blinkProgress.current, 0, 1);
          let rawBlink: number;
          if (p < 0.38) {
            const closeRatio = p / 0.38;
            rawBlink = Math.sin((closeRatio * Math.PI) / 2);
          } else {
            const openRatio = (p - 0.38) / 0.62;
            rawBlink = Math.cos((openRatio * Math.PI) / 2);
          }
          blinkState.current = THREE.MathUtils.clamp(rawBlink * blinkPeak.current, 0, 1);
        }
      }

      // Target head rotation from pointer position
      let desiredHeadX = -pointerPos.current.y * 0.26;
      let desiredHeadY = pointerPos.current.x * 0.36;
      let desiredHeadZ = -pointerPos.current.x * 0.08;

      // Emotion modifications
      let targetBrowTilt = 0;
      let targetBrowY = 0.44;
      let targetEarL = 0;
      let targetEarR = 0;
      let targetSquint = 0;

      if (isPetting.current && !isEmotionSuppressed) {
        desiredHeadZ += 0.2;  // blissful lean into the pet
        desiredHeadX -= 0.12;
        targetSquint = 0.85;  // contented squint
        targetBrowTilt = 0.18;
      } else if (currentEmotion === 'empathetic' || currentEmotion === 'comforting') {
        desiredHeadZ = 0.12;
        desiredHeadX = 0.04;
        targetBrowTilt = 0.22;
        targetSquint = 0.22;
        targetEarL = -0.12;
      } else if (currentEmotion === 'curious' || currentIsListening) {
        desiredHeadZ = -0.16;
        desiredHeadX = -0.08;
        targetBrowY = 0.49;
        targetEarR = 0.22;
        targetSquint = -0.12;
      } else if (currentEmotion === 'happy' || currentEmotion === 'excited') {
        desiredHeadX = Math.sin(elapsed * 5) * 0.03;
        targetSquint = 0.55;
        targetBrowY = 0.47;
        targetEarL = 0.16;
        targetEarR = 0.16;
      } else if (currentEmotion === 'thinking' || currentIsThinking) {
        desiredHeadX = -0.16;
        desiredHeadY = -0.22;
        targetBrowTilt = -0.18;
        targetSquint = 0.2;
      }

      // BLUSH SMOOTH EXPRESSION (Sweet bashful tilt, crescent smile squint, soft perked ears)
      if (smoothBlush.current > 0.001) {
        const b = smoothBlush.current;
        desiredHeadZ = THREE.MathUtils.lerp(desiredHeadZ, 0.18 + Math.sin(elapsed * 2.2) * 0.015, b);
        desiredHeadX = THREE.MathUtils.lerp(desiredHeadX, -0.08, b);
        targetSquint = THREE.MathUtils.lerp(targetSquint, 0.68, b);
        targetBrowY = THREE.MathUtils.lerp(targetBrowY, 0.48, b);
        targetBrowTilt = THREE.MathUtils.lerp(targetBrowTilt, 0.14, b);
        targetEarL = THREE.MathUtils.lerp(targetEarL, 0.18, b);
        targetEarR = THREE.MathUtils.lerp(targetEarR, 0.18, b);
      }

      // ANGRY SMOOTH EXPRESSION (Airplane ears back, deep furrowed brow, slit eyes, grumpy tremor)
      if (smoothAngry.current > 0.001) {
        const a = smoothAngry.current;
        targetEarL = THREE.MathUtils.lerp(targetEarL, -0.78, a);
        targetEarR = THREE.MathUtils.lerp(targetEarR, -0.78, a);
        targetBrowTilt = THREE.MathUtils.lerp(targetBrowTilt, -0.55, a);
        targetBrowY = THREE.MathUtils.lerp(targetBrowY, 0.33, a);
        targetSquint = THREE.MathUtils.lerp(targetSquint, 0.82, a);
        const tremble = Math.sin(elapsed * 22) * 0.015;
        desiredHeadX = THREE.MathUtils.lerp(desiredHeadX, 0.14 + tremble, a);
        desiredHeadZ = THREE.MathUtils.lerp(desiredHeadZ, tremble * 0.5, a);
      }

      // Smooth dampening towards target head rotation
      targetHeadRot.current.x = THREE.MathUtils.lerp(targetHeadRot.current.x, desiredHeadX, 0.08);
      targetHeadRot.current.y = THREE.MathUtils.lerp(targetHeadRot.current.y, desiredHeadY, 0.08);
      targetHeadRot.current.z = THREE.MathUtils.lerp(targetHeadRot.current.z, desiredHeadZ, 0.08);

      if (headGroupRef.current) {
        headGroupRef.current.rotation.x = targetHeadRot.current.x;
        headGroupRef.current.rotation.y = targetHeadRot.current.y;
        headGroupRef.current.rotation.z = targetHeadRot.current.z;
      }

      // EYES & SQUINTING / BLINKING
      const effectiveSquint = Math.min(1.0, Math.max(blinkState.current, targetSquint));
      const lidAngle = THREE.MathUtils.lerp(-Math.PI / 2, 0, effectiveSquint);
      const lowerLidAngle = THREE.MathUtils.lerp(Math.PI / 2, 0, effectiveSquint * 0.45);

      if (leftUpperLidRef.current && rightUpperLidRef.current) {
        leftUpperLidRef.current.rotation.x = lidAngle;
        rightUpperLidRef.current.rotation.x = lidAngle;
      }
      if (leftLowerLidRef.current && rightLowerLidRef.current) {
        leftLowerLidRef.current.rotation.x = lowerLidAngle;
        rightLowerLidRef.current.rotation.x = lowerLidAngle;
      }

      // Pupils track pointer slightly, and constrict into predatory narrow slits when angry!
      const pupilX = THREE.MathUtils.clamp(pointerPos.current.x * 0.035, -0.035, 0.035);
      const pupilY = THREE.MathUtils.clamp(pointerPos.current.y * 0.035, -0.03, 0.03);
      if (leftPupilRef.current && rightPupilRef.current) {
        leftPupilRef.current.position.x = pupilX;
        leftPupilRef.current.position.y = pupilY;
        rightPupilRef.current.position.x = pupilX;
        rightPupilRef.current.position.y = pupilY;
        const pupilScaleX = THREE.MathUtils.lerp(1.0, 0.42, smoothAngry.current);
        leftPupilRef.current.scale.x = pupilScaleX;
        rightPupilRef.current.scale.x = pupilScaleX;
      }

      // Eyebrows with subtle anatomical micro-dip during blink
      if (leftBrowRef.current && rightBrowRef.current) {
        const browBlinkDip = blinkState.current * 0.014;
        leftBrowRef.current.rotation.z = targetBrowTilt;
        rightBrowRef.current.rotation.z = -targetBrowTilt;
        leftBrowRef.current.position.y = targetBrowY - browBlinkDip;
        rightBrowRef.current.position.y = targetBrowY - browBlinkDip;
      }

      // Expressive Ears with airplane folding when angry
      if (leftEarRef.current && rightEarRef.current) {
        leftEarRef.current.rotation.z = targetEarL;
        rightEarRef.current.rotation.z = -targetEarR;
        const earFoldBack = smoothAngry.current * 0.48;
        leftEarRef.current.rotation.x = earFoldBack;
        rightEarRef.current.rotation.x = earFoldBack;
      }

      // Cheek blush glow (smooth opacity and subtle scale)
      if (leftBlushRef.current && rightBlushRef.current) {
        const blushOpacity = smoothBlush.current * 0.88;
        (leftBlushRef.current.material as THREE.MeshBasicMaterial).opacity = blushOpacity;
        (rightBlushRef.current.material as THREE.MeshBasicMaterial).opacity = blushOpacity;
        const scale = 0.92 + smoothBlush.current * 0.14;
        leftBlushRef.current.scale.set(scale, scale, 1);
        rightBlushRef.current.scale.set(scale, scale, 1);
      }

      // Angry Cartoon Steam Puffs and Anger Vein Mark
      if (leftSteamRef.current && rightSteamRef.current && angerMarkRef.current) {
        const steamOpacity = smoothAngry.current * 0.92;
        (leftSteamRef.current.material as THREE.MeshBasicMaterial).opacity = steamOpacity;
        (rightSteamRef.current.material as THREE.MeshBasicMaterial).opacity = steamOpacity;
        (angerMarkRef.current.material as THREE.MeshBasicMaterial).opacity = smoothAngry.current * 0.96;

        const steamPulse = 0.85 + 0.25 * smoothAngry.current + Math.sin(elapsed * 10) * 0.08;
        leftSteamRef.current.scale.set(steamPulse, steamPulse, 1);
        rightSteamRef.current.scale.set(steamPulse, steamPulse, 1);
        leftSteamRef.current.position.y = 0.98 + smoothAngry.current * 0.08 + Math.sin(elapsed * 8) * 0.025;
        rightSteamRef.current.position.y = 0.98 + smoothAngry.current * 0.08 + Math.sin(elapsed * 8 + 1) * 0.025;

        const markPulse = 0.92 + 0.22 * smoothAngry.current + Math.sin(elapsed * 14) * 0.12;
        angerMarkRef.current.scale.set(markPulse, markPulse, 1);
      }

      // MOUTH & TONGUE ANIMATION
      if (currentIsSpeaking) {
        const speechWave = Math.sin(elapsed * 15) * 0.5 + Math.sin(elapsed * 22) * 0.3 + 0.5;
        mouthOpenAmount.current = THREE.MathUtils.lerp(mouthOpenAmount.current, Math.max(0, speechWave) * 0.28, 0.25);
      } else if (smoothAngry.current > 0.05) {
        // Grumpy tight snarl / pout
        mouthOpenAmount.current = THREE.MathUtils.lerp(mouthOpenAmount.current, 0.04 * smoothAngry.current, 0.2);
      } else {
        mouthOpenAmount.current = THREE.MathUtils.lerp(mouthOpenAmount.current, 0, 0.15);
      }

      if (jawRef.current) {
        jawRef.current.rotation.x = mouthOpenAmount.current * 0.52 + (smoothAngry.current * 0.05);
        jawRef.current.position.y = -0.22 - mouthOpenAmount.current * 0.25 - (smoothAngry.current * 0.02);
      }

      // Tongue subtle flex inside mouth when speaking
      if (tongueRef.current) {
        const tongueFlex = Math.sin(elapsed * 12) * 0.015 * mouthOpenAmount.current;
        tongueRef.current.position.y = tongueFlex;
        tongueRef.current.rotation.x = mouthOpenAmount.current * 0.2;
      }

      // Floating pet & blush particles upward drift
      const targetParticleOpacity = Math.max(
        isPetting.current ? 0.85 : 0,
        smoothBlush.current * 0.82
      );
      if (particlesRef.current) {
        (particlesRef.current.material as THREE.PointsMaterial).opacity = targetParticleOpacity;
        if (targetParticleOpacity > 0.01) {
          const pos = particlesRef.current.geometry.attributes.position.array as Float32Array;
          for (let i = 1; i < pos.length; i += 3) {
            pos[i] += 0.015;
            if (pos[i] > 2.2) pos[i] = 0;
          }
          particlesRef.current.geometry.attributes.position.needsUpdate = true;
        }
      }

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
      clearTimeout(petTimeoutRef.current);
      clearTimeout(emotionTimeoutRef.current);
      if (tapResetTimeout) clearTimeout(tapResetTimeout);
      container.removeEventListener('pointermove', handlePointerMove);
      container.removeEventListener('pointerdown', handlePointerDown);
      container.removeEventListener('dblclick', handleDoubleClick);
      eyeTexture.dispose();
      tongueTexture.dispose();
      noseTexture.dispose();
      blushTexture.dispose();
      steamTexture.dispose();
      angerMarkTexture.dispose();
      renderer.dispose();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full cursor-grab active:cursor-grabbing select-none touch-none ${className}`}
      id="avatar-3d-canvas-container"
      title="Interact with Tom! Double-tap stomach to blush, double-tap face for angry, or pet him"
    />
  );
};
