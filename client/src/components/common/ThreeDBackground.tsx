import React, { useEffect, useRef } from 'react';

interface ThreeDBackgroundProps {
  className?: string;
}

export const ThreeDBackground: React.FC<ThreeDBackgroundProps> = ({ className = '' }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    // Mouse tracking with smooth lerp
    let mouseX = 0;
    let mouseY = 0;
    let targetRotX = 0;
    let targetRotY = 0;
    let rotX = 0;
    let rotY = 0;

    const handleResize = () => {
      if (!canvas) return;
      const dpr = window.devicePixelRatio || 1;
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.scale(dpr, dpr);
    };

    const handleMouseMove = (e: MouseEvent) => {
      const halfW = width / 2;
      const halfH = height / 2;
      mouseX = (e.clientX - halfW) / halfW;
      mouseY = (e.clientY - halfH) / halfH;
      targetRotY = mouseX * 0.35;
      targetRotX = -mouseY * 0.35;
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('mousemove', handleMouseMove);
    handleResize();

    // ----------------------------------------------------
    // 3D Geometry 1: Left Icosahedron
    // ----------------------------------------------------
    const phi = (1 + Math.sqrt(5)) / 2;
    const baseIcosaVerts = [
      [-1, phi, 0], [1, phi, 0], [-1, -phi, 0], [1, -phi, 0],
      [0, -1, phi], [0, 1, phi], [0, -1, -phi], [0, 1, -phi],
      [phi, 0, -1], [phi, 0, 1], [-phi, 0, -1], [-phi, 0, 1],
    ].map(([x, y, z]) => {
      const scale = 110;
      return { x: x * scale, y: y * scale, z: z * scale };
    });

    const icosaEdges: Array<[number, number]> = [];
    for (let i = 0; i < baseIcosaVerts.length; i++) {
      for (let j = i + 1; j < baseIcosaVerts.length; j++) {
        const dx = baseIcosaVerts[i].x - baseIcosaVerts[j].x;
        const dy = baseIcosaVerts[i].y - baseIcosaVerts[j].y;
        const dz = baseIcosaVerts[i].z - baseIcosaVerts[j].z;
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
        if (Math.abs(dist - 220) < 30) {
          icosaEdges.push([i, j]);
        }
      }
    }

    // ----------------------------------------------------
    // 3D Geometry 2: Right Tesseract / Nested Cube
    // ----------------------------------------------------
    const outerCubeVerts = [
      [-1, -1, -1], [1, -1, -1], [1, 1, -1], [-1, 1, -1],
      [-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1],
    ].map(([x, y, z]) => {
      const scale = 85;
      return { x: x * scale, y: y * scale, z: z * scale };
    });

    const innerCubeVerts = [
      [-1, -1, -1], [1, -1, -1], [1, 1, -1], [-1, 1, -1],
      [-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1],
    ].map(([x, y, z]) => {
      const scale = 45;
      return { x: x * scale, y: y * scale, z: z * scale };
    });

    const cubeEdges: Array<[number, number]> = [
      [0, 1], [1, 2], [2, 3], [3, 0],
      [4, 5], [5, 6], [6, 7], [7, 4],
      [0, 4], [1, 5], [2, 6], [3, 7],
    ];

    // ----------------------------------------------------
    // 3D Geometry 3: Full-Screen Horizon Wave Grid
    // ----------------------------------------------------
    const GRID_COLS = 26;
    const GRID_ROWS = 16;
    const GRID_WIDTH = 1800;
    const GRID_DEPTH = 1200;

    // ----------------------------------------------------
    // 3D Geometry 4: Full-Screen 3D Particle Constellation (100+ particles)
    // ----------------------------------------------------
    const NUM_PARTICLES = 95;
    const particles = Array.from({ length: NUM_PARTICLES }, () => ({
      x: (Math.random() - 0.5) * 1600,
      y: (Math.random() - 0.5) * 1000,
      z: (Math.random() - 0.5) * 900,
      vx: (Math.random() - 0.5) * 0.45,
      vy: (Math.random() - 0.5) * 0.45,
      vz: (Math.random() - 0.5) * 0.45,
      size: Math.random() * 2.2 + 1.2,
      color: Math.random() > 0.45 ? '#f97316' : '#fbbf24',
    }));

    // ----------------------------------------------------
    // Math Utilities: 3D Rotation & Perspective Projection
    // ----------------------------------------------------
    const rotate3D = (
      p: { x: number; y: number; z: number },
      ax: number,
      ay: number,
      az: number
    ) => {
      // Rotate Y
      const cosY = Math.cos(ay);
      const sinY = Math.sin(ay);
      let x1 = p.x * cosY + p.z * sinY;
      let z1 = -p.x * sinY + p.z * cosY;

      // Rotate X
      const cosX = Math.cos(ax);
      const sinX = Math.sin(ax);
      let y2 = p.y * cosX - z1 * sinX;
      let z2 = p.y * sinX + z1 * cosX;

      // Rotate Z
      const cosZ = Math.cos(az);
      const sinZ = Math.sin(az);
      let x3 = x1 * cosZ - y2 * sinZ;
      let y3 = x1 * sinZ + y2 * cosZ;

      return { x: x3, y: y3, z: z2 };
    };

    const project3D = (
      p: { x: number; y: number; z: number },
      originX: number,
      originY: number,
      fov = 520,
      cameraDist = 650
    ) => {
      const z = p.z + cameraDist;
      if (z <= 10) return null;
      const scale = fov / z;
      return {
        x: p.x * scale + originX,
        y: p.y * scale + originY,
        scale,
        z: p.z,
      };
    };

    let angle = 0;

    // ----------------------------------------------------
    // Animation Loop
    // ----------------------------------------------------
    const render = () => {
      angle += 0.009;

      // Damped mouse rotation
      rotX += (targetRotX - rotX) * 0.05;
      rotY += (targetRotY - rotY) * 0.05;

      ctx.clearRect(0, 0, width, height);

      const centerX = width / 2;
      const centerY = height / 2;

      // Calculate responsive offsets for Left and Right 3D Polyhedrons
      // Desktop: placed gracefully on the left and right sides of the login card
      // Mobile: subtly moved back and scaled so they never crowd the screen
      const isMobile = width < 768;
      const sideDistance = isMobile ? width * 0.35 : Math.max(380, width * 0.32);
      const leftCenterX = centerX - sideDistance;
      const rightCenterX = centerX + sideDistance;
      const leftCenterY = isMobile ? centerY - 240 : centerY - 20;
      const rightCenterY = isMobile ? centerY + 240 : centerY + 30;

      // ====================================================
      // 1. FULL-SCREEN 3D PERSPECTIVE HORIZON WAVE GRID
      // ====================================================
      const gridFov = 420;
      const gridCameraDist = 550;
      const gridPoints: Array<Array<{ x: number; y: number; scale: number; z: number } | null>> = [];

      for (let r = 0; r < GRID_ROWS; r++) {
        gridPoints[r] = [];
        const zRatio = r / (GRID_ROWS - 1);
        const pz = -GRID_DEPTH / 2 + zRatio * GRID_DEPTH + 180;

        for (let c = 0; c < GRID_COLS; c++) {
          const xRatio = c / (GRID_COLS - 1);
          const px = -GRID_WIDTH / 2 + xRatio * GRID_WIDTH;

          // Sinusoidal mathematical ripple
          const py =
            Math.sin(px * 0.0045 + angle * 1.5) * 32 +
            Math.cos(pz * 0.0055 + angle * 1.2) * 26 +
            180 +
            (1 - zRatio) * 60;

          const rotatedPt = rotate3D({ x: px, y: py, z: pz }, rotX * 0.4 + 0.35, rotY * 0.4, 0);
          const prj = project3D(rotatedPt, centerX, centerY + (isMobile ? 180 : 130), gridFov, gridCameraDist);
          gridPoints[r][c] = prj;
        }
      }

      // Draw Grid Lines (Horizontal & Vertical)
      for (let r = 0; r < GRID_ROWS; r++) {
        for (let c = 0; c < GRID_COLS; c++) {
          const p = gridPoints[r][c];
          if (!p) continue;

          const depthAlpha = Math.max(0.04, Math.min(0.35, (p.z + 500) / 900));

          // Connect horizontally
          if (c < GRID_COLS - 1) {
            const nextP = gridPoints[r][c + 1];
            if (nextP) {
              ctx.beginPath();
              ctx.moveTo(p.x, p.y);
              ctx.lineTo(nextP.x, nextP.y);
              ctx.strokeStyle = `rgba(249, 115, 22, ${depthAlpha * 0.65})`;
              ctx.lineWidth = 0.7;
              ctx.stroke();
            }
          }

          // Connect vertically
          if (r < GRID_ROWS - 1) {
            const downP = gridPoints[r + 1][c];
            if (downP) {
              ctx.beginPath();
              ctx.moveTo(p.x, p.y);
              ctx.lineTo(downP.x, downP.y);
              ctx.strokeStyle = `rgba(251, 191, 36, ${depthAlpha * 0.55})`;
              ctx.lineWidth = 0.7;
              ctx.stroke();
            }
          }

          // Glowing node points at alternate intersections
          if ((r + c) % 2 === 0 && p.scale > 0.45) {
            ctx.beginPath();
            ctx.arc(p.x, p.y, Math.max(1, 1.8 * p.scale), 0, Math.PI * 2);
            ctx.fillStyle = `rgba(249, 115, 22, ${depthAlpha * 0.9})`;
            ctx.fill();
          }
        }
      }

      // ====================================================
      // 2. FULL-SCREEN 3D FLOATING PARTICLES & PROXIMITY LASERS
      // ====================================================
      for (let i = 0; i < particles.length; i++) {
        const pt = particles[i];
        pt.x += pt.vx;
        pt.y += pt.vy;
        pt.z += pt.vz;

        // Wrap around 3D box
        if (pt.x < -800) pt.x = 800;
        if (pt.x > 800) pt.x = -800;
        if (pt.y < -500) pt.y = 500;
        if (pt.y > 500) pt.y = -500;
        if (pt.z < -450) pt.z = 450;
        if (pt.z > 450) pt.z = -450;

        const rotated = rotate3D(pt, rotX + angle * 0.25, rotY + angle * 0.35, 0);
        const prj = project3D(rotated, centerX, centerY, 520, 650);
        if (!prj) continue;

        const alpha = Math.max(0.12, Math.min(0.85, (rotated.z + 450) / 900));

        // Draw particle dot
        ctx.beginPath();
        ctx.arc(prj.x, prj.y, Math.max(1.2, pt.size * prj.scale), 0, Math.PI * 2);
        ctx.fillStyle = pt.color === '#f97316' ? `rgba(249, 115, 22, ${alpha})` : `rgba(251, 191, 36, ${alpha})`;
        ctx.shadowBlur = 8;
        ctx.shadowColor = pt.color;
        ctx.fill();
        ctx.shadowBlur = 0;

        // Inter-particle proximity lines
        for (let j = i + 1; j < particles.length; j++) {
          const pt2 = particles[j];
          const distSq = (pt.x - pt2.x) ** 2 + (pt.y - pt2.y) ** 2 + (pt.z - pt2.z) ** 2;
          if (distSq < 135 * 135) {
            const rotated2 = rotate3D(pt2, rotX + angle * 0.25, rotY + angle * 0.35, 0);
            const prj2 = project3D(rotated2, centerX, centerY, 520, 650);
            if (prj2) {
              const lineAlpha = (1 - Math.sqrt(distSq) / 135) * 0.25 * alpha;
              ctx.beginPath();
              ctx.moveTo(prj.x, prj.y);
              ctx.lineTo(prj2.x, prj2.y);
              ctx.strokeStyle = `rgba(249, 115, 22, ${lineAlpha})`;
              ctx.lineWidth = 0.8;
              ctx.stroke();
            }
          }
        }
      }

      // ====================================================
      // 3. LEFT 3D ROTATING ICOSAHEDRON (GEODESIC SPHERE)
      // ====================================================
      const rotatedIcosa = baseIcosaVerts.map((v) =>
        rotate3D(v, rotX + angle * 0.65, rotY + angle * 0.85, angle * 0.25)
      );
      const projectedIcosa = rotatedIcosa.map((v) => project3D(v, leftCenterX, leftCenterY, 500, 600));

      // Draw Icosahedron Edges
      icosaEdges.forEach(([i, j]) => {
        const p1 = projectedIcosa[i];
        const p2 = projectedIcosa[j];
        if (!p1 || !p2) return;

        const avgZ = (rotatedIcosa[i].z + rotatedIcosa[j].z) / 2;
        const depthAlpha = Math.max(0.15, Math.min(0.85, (avgZ + 140) / 280));

        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.strokeStyle = `rgba(249, 115, 22, ${depthAlpha * 0.9})`;
        ctx.lineWidth = Math.max(0.8, (p1.scale + p2.scale) * 0.9);
        ctx.stroke();
      });

      // Draw Icosahedron Vertices
      projectedIcosa.forEach((p, idx) => {
        if (!p) return;
        const z = rotatedIcosa[idx].z;
        const alpha = Math.max(0.25, Math.min(1, (z + 140) / 280));

        ctx.beginPath();
        ctx.arc(p.x, p.y, Math.max(2.2, 4 * p.scale), 0, Math.PI * 2);
        ctx.fillStyle = `rgba(251, 146, 60, ${alpha})`;
        ctx.shadowBlur = 14;
        ctx.shadowColor = '#ea580c';
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      // Outer Orbital Ring around Left Icosahedron
      ctx.beginPath();
      for (let theta = 0; theta <= Math.PI * 2; theta += 0.15) {
        const ringPt = rotate3D(
          { x: Math.cos(theta) * 155, y: Math.sin(theta) * 155 * 0.35, z: Math.sin(theta) * 155 * 0.65 },
          rotX + angle * 0.4,
          rotY + angle * 0.5,
          0
        );
        const prj = project3D(ringPt, leftCenterX, leftCenterY, 500, 600);
        if (prj) {
          if (theta === 0) ctx.moveTo(prj.x, prj.y);
          else ctx.lineTo(prj.x, prj.y);
        }
      }
      ctx.closePath();
      ctx.strokeStyle = 'rgba(251, 191, 36, 0.4)';
      ctx.lineWidth = 1;
      ctx.stroke();

      // ====================================================
      // 4. RIGHT 3D ROTATING TESSERACT / NESTED HYPERCUBE
      // ====================================================
      const rotatedOuterCube = outerCubeVerts.map((v) =>
        rotate3D(v, -rotX - angle * 0.75, -rotY - angle * 0.65, -angle * 0.35)
      );
      const projectedOuterCube = rotatedOuterCube.map((v) => project3D(v, rightCenterX, rightCenterY, 500, 600));

      const rotatedInnerCube = innerCubeVerts.map((v) =>
        rotate3D(v, rotX + angle * 0.95, rotY + angle * 0.85, angle * 0.45)
      );
      const projectedInnerCube = rotatedInnerCube.map((v) => project3D(v, rightCenterX, rightCenterY, 500, 600));

      // Draw Outer Cube Edges
      cubeEdges.forEach(([i, j]) => {
        const p1 = projectedOuterCube[i];
        const p2 = projectedOuterCube[j];
        if (!p1 || !p2) return;

        const avgZ = (rotatedOuterCube[i].z + rotatedOuterCube[j].z) / 2;
        const depthAlpha = Math.max(0.18, Math.min(0.85, (avgZ + 100) / 200));

        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.strokeStyle = `rgba(251, 146, 60, ${depthAlpha * 0.9})`;
        ctx.lineWidth = Math.max(1, (p1.scale + p2.scale) * 1.1);
        ctx.stroke();
      });

      // Draw Inner Cube Edges
      cubeEdges.forEach(([i, j]) => {
        const p1 = projectedInnerCube[i];
        const p2 = projectedInnerCube[j];
        if (!p1 || !p2) return;

        const avgZ = (rotatedInnerCube[i].z + rotatedInnerCube[j].z) / 2;
        const depthAlpha = Math.max(0.2, Math.min(0.9, (avgZ + 60) / 120));

        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.strokeStyle = `rgba(254, 240, 138, ${depthAlpha * 0.85})`;
        ctx.lineWidth = Math.max(0.8, (p1.scale + p2.scale) * 0.9);
        ctx.stroke();
      });

      // Hypercube Connector Beams (connecting outer cube to inner cube)
      for (let i = 0; i < 8; i++) {
        const pOuter = projectedOuterCube[i];
        const pInner = projectedInnerCube[i];
        if (pOuter && pInner) {
          ctx.beginPath();
          ctx.moveTo(pOuter.x, pOuter.y);
          ctx.lineTo(pInner.x, pInner.y);
          ctx.strokeStyle = 'rgba(249, 115, 22, 0.35)';
          ctx.lineWidth = 0.8;
          ctx.stroke();
        }
      }

      // Draw Cube Vertices
      projectedOuterCube.forEach((p, idx) => {
        if (!p) return;
        const z = rotatedOuterCube[idx].z;
        const alpha = Math.max(0.3, Math.min(1, (z + 100) / 200));

        ctx.beginPath();
        ctx.arc(p.x, p.y, Math.max(2.5, 4.2 * p.scale), 0, Math.PI * 2);
        ctx.fillStyle = `rgba(251, 191, 36, ${alpha})`;
        ctx.shadowBlur = 12;
        ctx.shadowColor = '#f59e0b';
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      // Outer Orbital Ring around Right Cube
      ctx.beginPath();
      for (let theta = 0; theta <= Math.PI * 2; theta += 0.15) {
        const ringPt = rotate3D(
          { x: Math.cos(theta) * 140 * 0.4, y: Math.sin(theta) * 140, z: Math.sin(theta) * 140 * 0.7 },
          -rotX - angle * 0.35,
          -rotY - angle * 0.45,
          0
        );
        const prj = project3D(ringPt, rightCenterX, rightCenterY, 500, 600);
        if (prj) {
          if (theta === 0) ctx.moveTo(prj.x, prj.y);
          else ctx.lineTo(prj.x, prj.y);
        }
      }
      ctx.closePath();
      ctx.strokeStyle = 'rgba(249, 115, 22, 0.45)';
      ctx.lineWidth = 1;
      ctx.stroke();

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div className={`pointer-events-none fixed inset-0 overflow-hidden -z-10 bg-zinc-50 dark:bg-[#07090e] transition-colors ${className}`}>
      {/* Dynamic Ambient Nebular Glow Orbs across screen */}
      <div className="absolute top-1/6 left-1/5 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[650px] bg-orange-500/18 dark:bg-orange-500/22 blur-[140px] rounded-full pointer-events-none" />
      <div className="absolute bottom-1/5 right-1/6 w-[600px] h-[600px] bg-amber-500/15 dark:bg-amber-500/20 blur-[130px] rounded-full pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-orange-600/10 dark:bg-orange-600/15 blur-[120px] rounded-full pointer-events-none" />

      {/* 3D Wireframe, Wave & Particle Canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full block opacity-90 dark:opacity-100"
      />

      {/* Subtle Perspective Horizon Grid */}
      <div
        className="absolute inset-0 opacity-[0.04] dark:opacity-[0.08] pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(to right, #f97316 1px, transparent 1px),
                            linear-gradient(to bottom, #f97316 1px, transparent 1px)`,
          backgroundSize: '40px 40px',
          maskImage: 'radial-gradient(ellipse at center, rgba(0,0,0,1) 35%, rgba(0,0,0,0) 85%)',
          WebkitMaskImage: 'radial-gradient(ellipse at center, rgba(0,0,0,1) 35%, rgba(0,0,0,0) 85%)',
        }}
      />
    </div>
  );
};
