module DrawTypes {

	import Vector2 = Utils.Vector2;
	export class DrawObject {
		public color: string | CanvasGradient | CanvasPattern;
		public name: String;
		public order: number;

		constructor(color: string | CanvasGradient | CanvasPattern = "black", name = "", order = 0) {
			this.color = color;
			this.name = name;
			this.order = order;
		}

		static sort(a: DrawObject, b: DrawObject): number {
			return a.order - b.order;
		}
	}

	export class DrawPath extends DrawObject {
		private closed: boolean;
		private path2d: Path2D;
		public points: Vertex[];
		public fillColor: string | CanvasGradient | CanvasPattern;

		constructor(points: Vertex[], color: string | CanvasGradient | CanvasPattern = "rgba(0,0,0,0)", fillColor: string | CanvasGradient | CanvasPattern, name = "", order = 0) {
			super(color, name, order);
			this.fillColor = fillColor;
			this.points = points;
			this.closed = false;
		}

		draw(context: CanvasRenderingContext2D, includeCorners: boolean = false) {
			this.generatePath2D();
			context.fillStyle = this.fillColor;
			context.fill(this.path2d);
			context.strokeStyle = this.color;
			context.stroke(this.path2d);

			if (includeCorners) {
				for (let point of this.points) {
					point.draw(context);
				}
			}
		}

		generatePath2D() {
			this.path2d = new Path2D();
			if (this.points.length < 1) return;
			this.path2d.moveTo(this.points[0].x, this.points[0].y);
			for (let i: number = 1; i < this.points.length; i++) {
				this.path2d.bezierCurveTo(
					this.points[i - 1].tangentOut.x, this.points[i - 1].tangentOut.y,
					this.points[i].tangentIn.x, this.points[i].tangentIn.y,
					this.points[i].x, this.points[i].y);
			}
			if (this.closed) {
				this.path2d.bezierCurveTo(
					this.points[this.points.length - 1].tangentOut.x, this.points[this.points.length - 1].tangentOut.y,
					this.points[0].tangentIn.x, this.points[0].tangentIn.y,
					this.points[0].x, this.points[0].y
				);
				this.path2d.closePath();
			}
		}

		addVertexToEnd(bcp1: Vertex) {
			bcp1.parent = this;

			this.points.push(bcp1);
			this.generatePath2D();
		}


		getPath2D(): Path2D {
			return this.path2d;
		}

		move(d: Vector2): Path2D;
		move(dx: number, dy: number): Path2D;
		move(dordx: number | Vector2, dy?: number): Path2D {
			let deltaX: number;
			let deltaY: number;
			if (typeof dordx == "number") {
				deltaX = dordx;
				deltaY = dy;
			} else {
				deltaX = dordx.x;
				deltaY = dordx.y;
			}
			for (let point of this.points) {
				point.x += deltaX;
				point.y += deltaY;
				point.tangentIn.move(deltaX, deltaY);
				point.tangentOut.move(deltaX, deltaY);
			}
			this.generatePath2D();
			return this.path2d;
		}

		setClosed(closed: boolean) {
			this.closed = closed;
		}

		setTangentsToThirdOfTheWays() {
			for (let i: number = 0; i < this.points.length; i++) {
				if (i == this.points.length - 1) {
					this.points[i].tangentOut.x = this.points[i].x + (this.points[0].x - this.points[i].x) * 0.3;
					this.points[i].tangentOut.y = this.points[i].y + (this.points[0].y - this.points[i].y) * 0.3;
					this.points[i].tangentIn.x = this.points[i].x + (this.points[i - 1].x - this.points[i].x) * 0.3;
					this.points[i].tangentIn.y = this.points[i].y + (this.points[i - 1].y - this.points[i].y) * 0.3;
					continue;
				}
				if (i == 0) {
					this.points[i].tangentOut.x = this.points[i].x + (this.points[i + 1].x - this.points[i].x) * 0.3;
					this.points[i].tangentOut.y = this.points[i].y + (this.points[i + 1].y - this.points[i].y) * 0.3;
					this.points[i].tangentIn.x = this.points[i].x + (this.points[this.points.length - 1].x - this.points[i].x) * 0.3;
					this.points[i].tangentIn.y = this.points[i].y + (this.points[this.points.length - 1].y - this.points[i].y) * 0.3;
					continue;
				}
				this.points[i].tangentOut.x = this.points[i].x + (this.points[i + 1].x - this.points[i].x) * 0.3;
				this.points[i].tangentOut.y = this.points[i].y + (this.points[i + 1].y - this.points[i].y) * 0.3;
				this.points[i].tangentIn.x = this.points[i].x + (this.points[i - 1].x - this.points[i].x) * 0.3;
				this.points[i].tangentIn.y = this.points[i].y + (this.points[i - 1].y - this.points[i].y) * 0.3;
			}
		}

		getPreviousVertex(v: Vertex): Vertex {
			let index: number = this.points.indexOf(v);
			if (index < 0) return null;
			if (index == 0) return this.points[this.points.length - 1];
			return this.points[index-1];
		}
		
		getNextVertex(v: Vertex): Vertex {
			let index: number = this.points.indexOf(v);
			if (index < 0) return null;
			if (index == this.points.length - 1) return this.points[0];
			return this.points[index+1];
		}	
	}

	export class DrawLine {
		public startPoint: Vector2;
		public endPoint: Vector2;
		public startBezierPoint: Vector2;
		public endBezierPoint: Vector2;
		// public width: number;
		// public color: string | CanvasGradient | CanvasPattern;
		public parent: DrawPath;
		// public stroke: CanvasFillStrokeStyles;
		// public cap: CanvasLineCap;

		constructor(startPoint: Vector2, endPoint: Vector2, /* width: number = 1, color: string | CanvasGradient | CanvasPattern = "black", */ startBezierPoint?: Vector2, endBezierPoint?: Vector2) {
			this.startPoint = startPoint;
			this.endPoint = endPoint;
			// this.width = width;
			// this.color = color;
			this.startBezierPoint = (startBezierPoint) ? startBezierPoint : startPoint;
			this.endBezierPoint = endBezierPoint ? endBezierPoint : endPoint;
			// console.debug("Created new DrawLine Object ↓");
			// console.debug(this);
		}
	}

	export class DrawPoint {
		protected path: Path2D;
		public x: number;
		public y: number;

		/*constructor(path: Path2D, point: Vector2, parent: DrawPath) {
			this.path = path;
			this.x = point.x;
			this.y = point.y;
			this.parent = parent;
		}
		*/
		constructor(x: number, y: number) {
			this.x = x;
			this.y = y;
			this.generatePath2D();
		}

		getPath2D(): Path2D {
			return this.path;
		}

		generatePath2D(): Path2D {
			this.path = new Path2D();
			this.path.arc(this.x, this.y, 5, 0, 2 * Math.PI);
			this.path.closePath();
			return this.path;
		}

		draw(context: CanvasRenderingContext2D) {
			context.stroke(this.generatePath2D());
		}

		move(dx: number, dy: number): Path2D {
			this.x += dx;
			this.y += dy;
			this.generatePath2D();
			return this.path;
		}
	}

	export class Vertex extends DrawPoint {
		tangentIn: TangentPoint;
		tangentOut: TangentPoint;
		public parent: DrawPath;

		constructor(x: number, y: number, parent: DrawPath = null, tIn: TangentPoint = null, tOut: TangentPoint = null) {
			super(x, y);
			this.parent = parent;
			if (tIn == null) tIn = new TangentPoint(x, y, this);
			if (tOut == null) tOut = new TangentPoint(x, y, this);
			this.tangentIn = tIn;
			this.tangentOut = tOut;
		}

		draw(context: CanvasRenderingContext2D, showTangents: boolean = false) {
			context.stroke(this.generatePath2D());
			if (showTangents) {
				this.tangentIn.draw(context);
				this.tangentOut.draw(context);

				let line: Path2D = new Path2D();
				line.lineTo(this.tangentIn.x, this.tangentIn.y);
				line.lineTo(this.x, this.y);
				line.lineTo(this.tangentOut.x, this.tangentOut.y);
				context.stroke(line);
			}
		}

		move(dx: number, dy: number): Path2D {
			if (VectorEditor.pressedKeys.indexOf(Utils.KEYCODE.CONTROL) < 0) {
				let prevVertex: Vertex = this.parent.getPreviousVertex(this);
				let nextVertex: Vertex = this.parent.getNextVertex(this);

				let prevVector: Vector2 = new Vector2(prevVertex.x - this.x, prevVertex.y - this.y);
				let tangentVector: Vector2 = new Vector2(this.tangentIn.x - this.x, this.tangentIn.y - this.y);


				this.tangentIn.move(dx, dy);
				this.tangentOut.move(dx, dy);
			}
			return super.move(dx, dy);
		}
	}

	export class TangentPoint extends DrawPoint {
		public parent: Vertex;

		constructor(x: number, y: number, parent: Vertex) {
			super(x, y);
			this.parent = parent;
		}

		generatePath2D(): Path2D {
			this.path = new Path2D();
			this.path.rect(this.x - 5, this.y - 5, 10, 10);
			return this.path;
		}
	}
}