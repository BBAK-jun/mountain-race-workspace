import { useMemo } from "react";
import { Color, Float32BufferAttribute, PlaneGeometry } from "three";
import { estimateTerrainY } from "./terrain";

const GROUND_MESH = {
  width: 300,
  depth: 320,
  segmentsX: 60,
  segmentsZ: 80,
  centerZ: -68,
} as const;

export function Ground() {
  const geometry = useMemo(() => {
    const geo = new PlaneGeometry(
      GROUND_MESH.width,
      GROUND_MESH.depth,
      GROUND_MESH.segmentsX,
      GROUND_MESH.segmentsZ,
    );
    geo.rotateX(-Math.PI / 2);
    geo.translate(0, 0, GROUND_MESH.centerZ);

    const posAttr = geo.getAttribute("position");
    if (!posAttr) return geo;

    const vertexColors = new Float32Array(posAttr.count * 3);
    const lowColor = new Color("#4a7c52");
    const midColor = new Color("#7a9468");
    const highColor = new Color("#9aa898");
    const color = new Color();

    for (let i = 0; i < posAttr.count; i++) {
      const x = posAttr.getX(i);
      const z = posAttr.getZ(i);
      const baseY = estimateTerrainY(z, Math.abs(x));
      const microNoise = Math.sin(x * 0.8 + z * 0.6) * 0.15 + Math.sin(x * 1.3 - z * 0.9) * 0.1;
      const y = baseY + microNoise;
      posAttr.setY(i, y);

      const alt = Math.max(0, Math.min(1, y / 25));
      const colorNoise = (Math.sin(x * 0.25 + z * 0.15) * 0.5 + 0.5) * 0.1;
      const adjustedAlt = Math.max(0, Math.min(1, alt + colorNoise));

      if (adjustedAlt < 0.5) {
        color.copy(lowColor).lerp(midColor, adjustedAlt * 2);
      } else {
        color.copy(midColor).lerp(highColor, (adjustedAlt - 0.5) * 2);
      }

      vertexColors[i * 3] = color.r;
      vertexColors[i * 3 + 1] = color.g;
      vertexColors[i * 3 + 2] = color.b;
    }

    posAttr.needsUpdate = true;
    geo.setAttribute("color", new Float32BufferAttribute(vertexColors, 3));
    geo.computeVertexNormals();
    return geo;
  }, []);

  return (
    <mesh geometry={geometry}>
      <meshStandardMaterial vertexColors roughness={1} />
    </mesh>
  );
}
