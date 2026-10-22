/**
 * qrcode.js - Generador nativo de Códigos QR (ISO/IEC 18004) en Canvas 2D sin dependencias externas.
 * Soporta modo Byte (UTF-8) con corrección de errores Reed-Solomon (Nivel L) para versiones 1 a 6 (hasta 134 bytes),
 * evaluación de las 8 máscaras estándar ISO/IEC 18004 y zona silenciosa de 4 módulos para lectura inmediata en móviles.
 */
(function (global) {
  "use strict";

  // Tabla de capacidades (Modo Byte, Nivel ECC L): [totalCodewords, ecCodewordsPerBlock, numBlocks, dataCodewords]
  const VERSION_TABLE = [
    null,
    { size: 21, total: 26, ecPerBlock: 7, blocks: 1, data: 19, align: [] },
    { size: 25, total: 44, ecPerBlock: 10, blocks: 1, data: 34, align: [6, 18] },
    { size: 29, total: 70, ecPerBlock: 15, blocks: 1, data: 55, align: [6, 22] },
    { size: 33, total: 100, ecPerBlock: 20, blocks: 1, data: 80, align: [6, 26] },
    { size: 37, total: 134, ecPerBlock: 26, blocks: 1, data: 108, align: [6, 30] },
    { size: 41, total: 172, ecPerBlock: 18, blocks: 2, data: 136, align: [6, 34] },
  ];

  // Cuerpos finitos GF(256) con polinomio primitivo 0x11D
  const GF_EXP = new Uint8Array(512);
  const GF_LOG = new Uint8Array(256);
  (function initGaloisField() {
    let x = 1;
    for (let i = 0; i < 255; i++) {
      GF_EXP[i] = x;
      GF_LOG[x] = i;
      x <<= 1;
      if (x & 0x100) x ^= 0x11d;
    }
    for (let i = 255; i < 512; i++) {
      GF_EXP[i] = GF_EXP[i - 255];
    }
  })();

  function gfMul(a, b) {
    if (a === 0 || b === 0) return 0;
    return GF_EXP[GF_LOG[a] + GF_LOG[b]];
  }

  function getGeneratorPoly(degree) {
    let poly = new Uint8Array([1]);
    for (let i = 0; i < degree; i++) {
      const next = new Uint8Array(poly.length + 1);
      const factor = GF_EXP[i];
      for (let j = 0; j < poly.length; j++) {
        next[j] ^= poly[j];
        next[j + 1] ^= gfMul(poly[j], factor);
      }
      poly = next;
    }
    return poly;
  }

  function computeReedSolomon(dataBytes, ecLen) {
    const gen = getGeneratorPoly(ecLen);
    const msg = new Uint8Array(dataBytes.length + ecLen);
    msg.set(dataBytes, 0);

    for (let i = 0; i < dataBytes.length; i++) {
      const coef = msg[i];
      if (coef !== 0) {
        for (let j = 0; j < gen.length; j++) {
          msg[i + j] ^= gfMul(gen[j], coef);
        }
      }
    }
    return msg.slice(dataBytes.length);
  }

  function pickVersion(byteLength) {
    for (let v = 1; v < VERSION_TABLE.length; v++) {
      // Modo (4 bits) + Longitud (8 bits) + datos + terminador caben en data bytes
      if (byteLength + 2 <= VERSION_TABLE[v].data) {
        return v;
      }
    }
    throw new Error("URL demasiado larga para el generador QR local.");
  }

  function encodeDataCodewords(utf8Bytes, versionInfo) {
    const bits = [];
    const pushBits = (val, len) => {
      for (let i = len - 1; i >= 0; i--) {
        bits.push((val >>> i) & 1);
      }
    };

    // Indicador de modo Byte = 0100
    pushBits(0b0100, 4);
    // Longitud en bytes (8 bits para versiones 1-9)
    pushBits(utf8Bytes.length, 8);
    for (let i = 0; i < utf8Bytes.length; i++) {
      pushBits(utf8Bytes[i], 8);
    }

    const maxDataBits = versionInfo.data * 8;
    const terminatorLen = Math.min(4, maxDataBits - bits.length);
    pushBits(0, terminatorLen);

    while (bits.length % 8 !== 0) {
      bits.push(0);
    }

    const codewords = new Uint8Array(versionInfo.data);
    let byteIdx = 0;
    for (let i = 0; i < bits.length; i += 8) {
      let b = 0;
      for (let j = 0; j < 8; j++) {
        b = (b << 1) | bits[i + j];
      }
      codewords[byteIdx++] = b;
    }

    const padBytes = [0xec, 0x11];
    let padIdx = 0;
    while (byteIdx < versionInfo.data) {
      codewords[byteIdx++] = padBytes[padIdx % 2];
      padIdx++;
    }

    if (versionInfo.blocks === 1) {
      const ec = computeReedSolomon(codewords, versionInfo.ecPerBlock);
      const full = new Uint8Array(versionInfo.total);
      full.set(codewords, 0);
      full.set(ec, codewords.length);
      return full;
    }

    // Intercalado para 2 bloques (Versión 6)
    const blockSize = versionInfo.data / versionInfo.blocks;
    const dataBlocks = [];
    const ecBlocks = [];
    for (let b = 0; b < versionInfo.blocks; b++) {
      const slice = codewords.slice(b * blockSize, (b + 1) * blockSize);
      dataBlocks.push(slice);
      ecBlocks.push(computeReedSolomon(slice, versionInfo.ecPerBlock));
    }

    const finalCodewords = new Uint8Array(versionInfo.total);
    let pos = 0;
    for (let i = 0; i < blockSize; i++) {
      for (let b = 0; b < versionInfo.blocks; b++) {
        finalCodewords[pos++] = dataBlocks[b][i];
      }
    }
    for (let i = 0; i < versionInfo.ecPerBlock; i++) {
      for (let b = 0; b < versionInfo.blocks; b++) {
        finalCodewords[pos++] = ecBlocks[b][i];
      }
    }
    return finalCodewords;
  }

  function createMatrix(version) {
    const info = VERSION_TABLE[version];
    const size = info.size;
    const modules = Array.from({ length: size }, () => new Int8Array(size));
    const isFunction = Array.from({ length: size }, () => new Uint8Array(size));

    const setFunctionModule = (r, c, dark) => {
      if (r < 0 || r >= size || c < 0 || c >= size) return;
      modules[r][c] = dark ? 1 : 0;
      isFunction[r][c] = 1;
    };

    // Patrones de búsqueda (Finder patterns 7x7 + separadores blancos)
    const drawFinder = (rowOffset, colOffset) => {
      for (let dr = -1; dr <= 7; dr++) {
        for (let dc = -1; dc <= 7; dc++) {
          const r = rowOffset + dr;
          const c = colOffset + dc;
          if (r < 0 || r >= size || c < 0 || c >= size) continue;
          const inOuter = dr >= 0 && dr <= 6 && dc >= 0 && dc <= 6;
          const onBorder = dr === 0 || dr === 6 || dc === 0 || dc === 6;
          const inInner = dr >= 2 && dr <= 4 && dc >= 2 && dc <= 4;
          setFunctionModule(r, c, inOuter && (onBorder || inInner));
        }
      }
    };

    drawFinder(0, 0);
    drawFinder(0, size - 7);
    drawFinder(size - 7, 0);

    // Patrones de sincronización (Timing patterns en fila 6 y columna 6)
    for (let i = 8; i < size - 8; i++) {
      const dark = i % 2 === 0;
      setFunctionModule(6, i, dark);
      setFunctionModule(i, 6, dark);
    }

    // Patrones de alineación (Alignment patterns 5x5)
    const alignCoords = info.align;
    for (let i = 0; i < alignCoords.length; i++) {
      for (let j = 0; j < alignCoords.length; j++) {
        const ar = alignCoords[i];
        const ac = alignCoords[j];
        if (
          (ar === 6 && ac === 6) ||
          (ar === 6 && ac === size - 7) ||
          (ar === size - 7 && ac === 6)
        ) {
          continue;
        }
        for (let dr = -2; dr <= 2; dr++) {
          for (let dc = -2; dc <= 2; dc++) {
            const dark = Math.max(Math.abs(dr), Math.abs(dc)) !== 1;
            setFunctionModule(ar + dr, ac + dc, dark);
          }
        }
      }
    }

    // Módulo oscuro fijo (fila size - 8, columna 8) y reserva de áreas de formato
    setFunctionModule(size - 8, 8, true);
    for (let i = 0; i < 9; i++) {
      if (!isFunction[8][i]) setFunctionModule(8, i, false);
      if (!isFunction[i][8]) setFunctionModule(i, 8, false);
    }
    for (let i = 0; i < 8; i++) {
      if (!isFunction[8][size - 1 - i]) setFunctionModule(8, size - 1 - i, false);
      if (!isFunction[size - 1 - i][8]) setFunctionModule(size - 1 - i, 8, false);
    }

    return { size, modules, isFunction };
  }

  function shouldInvertMask(maskPattern, r, c) {
    switch (maskPattern) {
      case 0:
        return (r + c) % 2 === 0;
      case 1:
        return r % 2 === 0;
      case 2:
        return c % 3 === 0;
      case 3:
        return (r + c) % 3 === 0;
      case 4:
        return (Math.floor(r / 2) + Math.floor(c / 3)) % 2 === 0;
      case 5:
        return ((r * c) % 2) + ((r * c) % 3) === 0;
      case 6:
        return (((r * c) % 2) + ((r * c) % 3)) % 2 === 0;
      case 7:
        return (((r + c) % 2) + ((r * c) % 3)) % 2 === 0;
      default:
        return (r + c) % 2 === 0;
    }
  }

  /**
   * Dibuja los 15 bits de información de formato según ISO/IEC 18004 Figura 25.
   * Nota: m[r][c] está indexado como [fila][columna].
   */
  function drawFormatBits(matrix, maskPattern) {
    // Nivel ECC L = 01 (bits 14..13) + maskPattern (bits 12..10)
    const data = (0b01 << 3) | maskPattern;
    let rem = data;
    for (let i = 0; i < 10; i++) {
      rem = (rem << 1) ^ ((rem >>> 9) * 0x537);
    }
    const bits = ((data << 10) | rem) ^ 0x5412;

    const size = matrix.size;
    const m = matrix.modules;
    const bit = (i) => ((bits >>> i) & 1) === 1;

    // Primera copia alrededor del patrón de búsqueda superior izquierdo:
    // bits 0..5 en columna 8, filas 0..5
    for (let i = 0; i <= 5; i++) m[i][8] = bit(i) ? 1 : 0;
    // bit 6 en fila 7, columna 8; bit 7 en fila 8, columna 8; bit 8 en fila 8, columna 7
    m[7][8] = bit(6) ? 1 : 0;
    m[8][8] = bit(7) ? 1 : 0;
    m[8][7] = bit(8) ? 1 : 0;
    // bits 9..14 en fila 8, columnas 5..0
    for (let i = 9; i < 15; i++) m[8][14 - i] = bit(i) ? 1 : 0;

    // Segunda copia:
    // bits 0..7 en fila 8, columnas size - 1 .. size - 8 (superior derecha)
    for (let i = 0; i < 8; i++) m[8][size - 1 - i] = bit(i) ? 1 : 0;
    // bits 8..14 en columna 8, filas size - 7 .. size - 1 (inferior izquierda)
    for (let i = 8; i < 15; i++) m[size - 15 + i][8] = bit(i) ? 1 : 0;
    // Módulo oscuro fijo en fila size - 8, columna 8
    m[size - 8][8] = 1;
  }

  function placeCodewords(matrix, codewords, maskPattern) {
    const size = matrix.size;
    const m = matrix.modules;
    const isFunc = matrix.isFunction;

    let bitIdx = 0;
    const totalBits = codewords.length * 8;

    for (let right = size - 1; right >= 1; right -= 2) {
      if (right === 6) right = 5;
      for (let vert = 0; vert < size; vert++) {
        const upward = ((right + 1) & 2) === 0;
        const r = upward ? size - 1 - vert : vert;
        for (let j = 0; j < 2; j++) {
          const c = right - j;
          if (!isFunc[r][c]) {
            let dark = false;
            if (bitIdx < totalBits) {
              dark = ((codewords[bitIdx >>> 3] >>> (7 - (bitIdx & 7))) & 1) !== 0;
              bitIdx++;
            }
            if (shouldInvertMask(maskPattern, r, c)) {
              dark = !dark;
            }
            m[r][c] = dark ? 1 : 0;
          }
        }
      }
    }
  }

  function computePenaltyScore(matrix) {
    const size = matrix.size;
    const m = matrix.modules;
    let penalty = 0;

    // Regla 1: módulos consecutivos del mismo color en filas y columnas
    for (let r = 0; r < size; r++) {
      let runColor = m[r][0];
      let runLen = 1;
      for (let c = 1; c < size; c++) {
        if (m[r][c] === runColor) {
          runLen++;
          if (runLen === 5) penalty += 3;
          else if (runLen > 5) penalty += 1;
        } else {
          runColor = m[r][c];
          runLen = 1;
        }
      }
    }
    for (let c = 0; c < size; c++) {
      let runColor = m[0][c];
      let runLen = 1;
      for (let r = 1; r < size; r++) {
        if (m[r][c] === runColor) {
          runLen++;
          if (runLen === 5) penalty += 3;
          else if (runLen > 5) penalty += 1;
        } else {
          runColor = m[r][c];
          runLen = 1;
        }
      }
    }

    // Regla 2: bloques 2x2 del mismo color
    for (let r = 0; r < size - 1; r++) {
      for (let c = 0; c < size - 1; c++) {
        const color = m[r][c];
        if (color === m[r][c + 1] && color === m[r + 1][c] && color === m[r + 1][c + 1]) {
          penalty += 3;
        }
      }
    }

    return penalty;
  }

  function generateMatrix(text) {
    const utf8 = new TextEncoder().encode(text);
    const version = pickVersion(utf8.length);
    const codewords = encodeDataCodewords(utf8, VERSION_TABLE[version]);

    let bestMatrix = null;
    let bestPenalty = Infinity;

    for (let mask = 0; mask < 8; mask++) {
      const candidate = createMatrix(version);
      placeCodewords(candidate, codewords, mask);
      drawFormatBits(candidate, mask);
      const penalty = computePenaltyScore(candidate);
      if (penalty < bestPenalty) {
        bestPenalty = penalty;
        bestMatrix = candidate;
      }
    }
    return bestMatrix;
  }

  function renderToCanvas(canvas, text, options = {}) {
    if (!canvas || !text) return;
    const matrix = generateMatrix(text);
    const quietZone = options.quietZone ?? 4;
    const totalModules = matrix.size + quietZone * 2;
    const targetPx = options.size ?? 220;
    const scale = Math.max(4, Math.floor(targetPx / totalModules));
    const realSize = totalModules * scale;

    canvas.width = realSize;
    canvas.height = realSize;
    const ctx = canvas.getContext("2d");
    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = options.lightColor || "#ffffff";
    ctx.fillRect(0, 0, realSize, realSize);

    ctx.fillStyle = options.darkColor || "#000000";
    for (let r = 0; r < matrix.size; r++) {
      for (let c = 0; c < matrix.size; c++) {
        if (matrix.modules[r][c]) {
          ctx.fillRect((c + quietZone) * scale, (r + quietZone) * scale, scale, scale);
        }
      }
    }
  }

  const qrApi = {
    generateMatrix,
    renderToCanvas,
  };

  global.EnglishUpQR = qrApi;
  global.EnglishDayQR = qrApi;
})(typeof window !== "undefined" ? window : globalThis);
