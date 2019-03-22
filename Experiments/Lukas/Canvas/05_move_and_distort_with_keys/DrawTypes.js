var DrawTypes;
(function (DrawTypes) {
    var Vector2 = Utils.Vector2;
    class DrawObject {
        constructor(color = "black", name = "", order = 0) {
            this.color = color;
            this.name = name;
            this.order = order;
        }
        static sort(a, b) {
            return a.order - b.order;
        }
    }
    DrawTypes.DrawObject = DrawObject;
    class DrawPath extends DrawObject {
        constructor(points, color = "rgba(0,0,0,0)", fillColor, name = "", order = 0) {
            super(color, name, order);
            this.fillColor = fillColor;
            this.points = points;
            this.closed = false;
        }
        draw(context, includeCorners = false) {
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
            if (this.points.length < 1)
                return;
            this.path2d.moveTo(this.points[0].x, this.points[0].y);
            for (let i = 1; i < this.points.length; i++) {
                this.path2d.bezierCurveTo(this.points[i - 1].tangentOut.x, this.points[i - 1].tangentOut.y, this.points[i].tangentIn.x, this.points[i].tangentIn.y, this.points[i].x, this.points[i].y);
            }
            if (this.closed) {
                this.path2d.bezierCurveTo(this.points[this.points.length - 1].tangentOut.x, this.points[this.points.length - 1].tangentOut.y, this.points[0].tangentIn.x, this.points[0].tangentIn.y, this.points[0].x, this.points[0].y);
                this.path2d.closePath();
            }
        }
        addVertexToEnd(bcp1) {
            bcp1.parent = this;
            this.points.push(bcp1);
            this.generatePath2D();
        }
        getPath2D() {
            return this.path2d;
        }
        move(dordx, dy) {
            let deltaX;
            let deltaY;
            if (typeof dordx == "number") {
                deltaX = dordx;
                deltaY = dy;
            }
            else {
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
        setClosed(closed) {
            this.closed = closed;
        }
        setTangentsToThirdOfTheWays() {
            for (let i = 0; i < this.points.length; i++) {
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
        getPreviousVertex(v) {
            let index = this.points.indexOf(v);
            if (index < 0)
                return null;
            if (index == 0)
                return this.points[this.points.length - 1];
            return this.points[index - 1];
        }
        getNextVertex(v) {
            let index = this.points.indexOf(v);
            if (index < 0)
                return null;
            if (index == this.points.length - 1)
                return this.points[0];
            return this.points[index + 1];
        }
    }
    DrawTypes.DrawPath = DrawPath;
    class DrawLine {
        // public stroke: CanvasFillStrokeStyles;
        // public cap: CanvasLineCap;
        constructor(startPoint, endPoint, /* width: number = 1, color: string | CanvasGradient | CanvasPattern = "black", */ startBezierPoint, endBezierPoint) {
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
    DrawTypes.DrawLine = DrawLine;
    class DrawPoint {
        /*constructor(path: Path2D, point: Vector2, parent: DrawPath) {
            this.path = path;
            this.x = point.x;
            this.y = point.y;
            this.parent = parent;
        }
        */
        constructor(x, y) {
            this.x = x;
            this.y = y;
            this.generatePath2D();
        }
        getPath2D() {
            return this.path;
        }
        generatePath2D() {
            this.path = new Path2D();
            this.path.arc(this.x, this.y, 5, 0, 2 * Math.PI);
            this.path.closePath();
            return this.path;
        }
        draw(context) {
            context.stroke(this.generatePath2D());
        }
        move(dx, dy) {
            this.x += dx;
            this.y += dy;
            this.generatePath2D();
            return this.path;
        }
    }
    DrawTypes.DrawPoint = DrawPoint;
    class Vertex extends DrawPoint {
        constructor(x, y, parent = null, tIn = null, tOut = null) {
            super(x, y);
            this.parent = parent;
            if (tIn == null)
                tIn = new TangentPoint(x, y, this);
            if (tOut == null)
                tOut = new TangentPoint(x, y, this);
            this.tangentIn = tIn;
            this.tangentOut = tOut;
        }
        draw(context, showTangents = false) {
            context.stroke(this.generatePath2D());
            if (showTangents) {
                this.tangentIn.draw(context);
                this.tangentOut.draw(context);
                let line = new Path2D();
                line.lineTo(this.tangentIn.x, this.tangentIn.y);
                line.lineTo(this.x, this.y);
                line.lineTo(this.tangentOut.x, this.tangentOut.y);
                context.stroke(line);
            }
        }
        move(dx, dy) {
            if (VectorEditor.pressedKeys.indexOf(Utils.KEYCODE.CONTROL) < 0) {
                let prevVertex = this.parent.getPreviousVertex(this);
                let nextVertex = this.parent.getNextVertex(this);
                let prevVector = new Vector2(prevVertex.x - this.x, prevVertex.y - this.y);
                let tangentVector = new Vector2(this.tangentIn.x - this.x, this.tangentIn.y - this.y);
                this.tangentIn.move(dx, dy);
                this.tangentOut.move(dx, dy);
            }
            return super.move(dx, dy);
        }
    }
    DrawTypes.Vertex = Vertex;
    class TangentPoint extends DrawPoint {
        constructor(x, y, parent) {
            super(x, y);
            this.parent = parent;
        }
        generatePath2D() {
            this.path = new Path2D();
            this.path.rect(this.x - 5, this.y - 5, 10, 10);
            return this.path;
        }
    }
    DrawTypes.TangentPoint = TangentPoint;
})(DrawTypes || (DrawTypes = {}));
//# sourceMappingURL=DrawTypes.js.map