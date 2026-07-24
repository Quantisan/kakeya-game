// Offscreen paint layer: the game's one measuring instrument. Every "area"
// the player sees is literally counted pixels on one of these.

export class PaintLayer {
  readonly canvas: HTMLCanvasElement;
  readonly ctx: CanvasRenderingContext2D;

  constructor(readonly width: number, readonly height: number) {
    this.canvas = document.createElement("canvas");
    this.canvas.width = width;
    this.canvas.height = height;
    this.ctx = this.canvas.getContext("2d", { willReadFrequently: true })!;
  }

  clear(): void {
    this.ctx.clearRect(0, 0, this.width, this.height);
  }

  /** Pixels that are mostly covered. Thresholding at half opacity keeps
   * antialiased edges from inflating the count: edge pixels average out. */
  count(): number {
    const data = this.ctx.getImageData(0, 0, this.width, this.height).data;
    let n = 0;
    for (let i = 3; i < data.length; i += 4) {
      if (data[i] > 127) n++;
    }
    return n;
  }

  /** Painted area in units where `unitPx` pixels = 1 unit of length. */
  area(unitPx: number): number {
    return this.count() / (unitPx * unitPx);
  }
}
