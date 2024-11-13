(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
    typeof define === 'function' && define.amd ? define(['exports'], factory) :
    (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global.OpenLIME = global.OpenLIME || {}));
})(this, (function (exports) { 'use strict';

    // HELPERS
    window.structuredClone = typeof (structuredClone) == "function" ? structuredClone : function (value) { return JSON.parse(JSON.stringify(value)); };

    // Utilities
    class Util {

        static padZeros(num, size) {
            num = num.toString();
            while (num.length < size) num = "0" + num;
            return num;
        }

        static printSrcCode(str) {
            let i = 1;
            let result = '';
            for (let l of str.split(/\r\n|\r|\n/)) {
                const nline = Util.padZeros(i, 5);
                result += nline + '   ' + l + '\n';
                i++;
            }
            console.log(result);
        }

        static createSVGElement(tag, attributes) {
            let e = document.createElementNS('http://www.w3.org/2000/svg', tag);
            if (attributes)
                for (const [key, value] of Object.entries(attributes))
                    e.setAttribute(key, value);
            return e;
        }

        static SVGFromString(text) {
            const parser = new DOMParser();
            return parser.parseFromString(text, "image/svg+xml").documentElement;
        }

        static async loadSVG(url) {
            let response = await fetch(url);
            if (!response.ok) {
                const message = `An error has occured: ${response.status}`;
                throw new Error(message);
            }
            let data = await response.text();
            let result = null;
            if (Util.isSVGString(data)) {
                result = Util.SVGFromString(data);
            } else {
                const message = `${url} is not an SVG file`;
                throw new Error(message);
            }
            return result;
        };

        static async loadHTML(url) {
            let response = await fetch(url);
            if (!response.ok) {
                const message = `An error has occured: ${response.status}`;
                throw new Error(message);
            }
            let data = await response.text();
            return data;
        };

        static async loadJSON(url) {
            let response = await fetch(url);
            if (!response.ok) {
                const message = `An error has occured: ${response.status}`;
                throw new Error(message);
            }
            let data = await response.json();
            return data;
        }

        static async loadImage(url) {
            return new Promise((resolve, reject) => {
                const img = new Image();
                img.addEventListener('load', () => resolve(img));
                img.addEventListener('error', (err) => reject(err));
                img.src = url;
            });
        }

        static async appendImg(container, url, imgClass = null) {
            const img = await Util.loadImage(url);
            if (imgClass) img.classList.add(imgClass);
            container.appendChild(img);
        }

        static async appendImgs(container, urls, imgClass = null) {
            for (const u of urls) {
                const img = await Util.loadImage(u);
                if (imgClass) img.classList.add(imgClass);
                container.appendChild(img);
            }
        }

        static isSVGString(input) {
            const regex = /^\s*(?:<\?xml[^>]*>\s*)?(?:<!doctype svg[^>]*\s*(?:\[?(?:\s*<![^>]*>\s*)*\]?)*[^>]*>\s*)?(?:<svg[^>]*>[^]*<\/svg>|<svg[^/>]*\/\s*>)\s*$/i;
            if (input == undefined || input == null)
                return false;
            input = input.toString().replace(/\s*<!Entity\s+\S*\s*(?:"|')[^"]+(?:"|')\s*>/img, '');
            input = input.replace(/<!--([\s\S]*?)-->/g, '');
            return Boolean(input) && regex.test(input);
        }

        static computeSDF(buffer, w, h, cutoff = 0.25, radius = 8) {

            // 2D Euclidean distance transform by Felzenszwalb & Huttenlocher https://cs.brown.edu/~pff/dt/
            function edt(data, width, height, f, d, v, z) {
                for (let x = 0; x < width; x++) {
                    for (let y = 0; y < height; y++) {
                        f[y] = data[y * width + x];
                    }
                    edt1d(f, d, v, z, height);
                    for (let y = 0; y < height; y++) {
                        data[y * width + x] = d[y];
                    }
                }
                for (let y = 0; y < height; y++) {
                    for (let x = 0; x < width; x++) {
                        f[x] = data[y * width + x];
                    }
                    edt1d(f, d, v, z, width);
                    for (let x = 0; x < width; x++) {
                        data[y * width + x] = Math.sqrt(d[x]);
                    }
                }
            }

            // 1D squared distance transform
            function edt1d(f, d, v, z, n) {
                v[0] = 0;
                z[0] = -INF;
                z[1] = +INF;

                for (let q = 1, k = 0; q < n; q++) {
                    var s = ((f[q] + q * q) - (f[v[k]] + v[k] * v[k])) / (2 * q - 2 * v[k]);
                    while (s <= z[k]) {
                        k--;
                        s = ((f[q] + q * q) - (f[v[k]] + v[k] * v[k])) / (2 * q - 2 * v[k]);
                    }
                    k++;
                    v[k] = q;
                    z[k] = s;
                    z[k + 1] = +INF;
                }

                for (let q = 0, k = 0; q < n; q++) {
                    while (z[k + 1] < q) k++;
                    d[q] = (q - v[k]) * (q - v[k]) + f[v[k]];
                }
            }

            var data = new Uint8ClampedArray(buffer);
            const INF = 1e20;
            const size = Math.max(w, h);

            // temporary arrays for the distance transform
            const gridOuter = Array(w * h);
            const gridInner = Array(w * h);
            const f = Array(size);
            const d = Array(size);
            const z = Array(size + 1);
            const v = Array(size);

            for (let i = 0; i < w * h; i++) {
                var a = data[i] / 255.0;
                gridOuter[i] = a === 1 ? 0 : a === 0 ? INF : Math.pow(Math.max(0, 0.5 - a), 2);
                gridInner[i] = a === 1 ? INF : a === 0 ? 0 : Math.pow(Math.max(0, a - 0.5), 2);
            }

            edt(gridOuter, w, h, f, d, v, z);
            edt(gridInner, w, h, f, d, v, z);

            const dist = window.Float32Array ? new Float32Array(w * h) : new Array(w * h);

            for (let i = 0; i < w * h; i++) {
                dist[i] = Math.min(Math.max(1 - ((gridOuter[i] - gridInner[i]) / radius + cutoff), 0), 1);
            }
            return dist;
        }

        static async rasterizeSVG(url, size = [64, 64]) {
            const svg = await Util.loadSVG(url);
            const svgWidth = svg.getAttribute('width');
            const svgHeight = svg.getAttribute('height');

            const canvas = document.createElement("canvas");
            canvas.width = size[0];
            canvas.height = size[1];

            svg.setAttributeNS(null, 'width', `100%`);
            svg.setAttributeNS(null, 'height', `100%`);

            const ctx = canvas.getContext("2d");
            const data = (new XMLSerializer()).serializeToString(svg);
            const DOMURL = window.URL || window.webkitURL || window;

            const img = new Image();
            const svgBlob = new Blob([data], { type: 'image/svg+xml;charset=utf-8' });
            const svgurl = DOMURL.createObjectURL(svgBlob);
            img.src = svgurl;

            return new Promise((resolve, reject) => {
                img.onload = () => {
                    const aCanvas = size[0] / size[1];
                    const aSvg = svgWidth / svgHeight;
                    let wSvg = 0;
                    let hSvg = 0;
                    if (aSvg < aCanvas) {
                        hSvg = size[1];
                        wSvg = hSvg * aSvg;
                    } else {
                        wSvg = size[0];
                        hSvg = wSvg / aSvg;
                    }

                    let dy = (size[1] - hSvg) * 0.5;
                    let dx = (size[0] - wSvg) * 0.5;

                    ctx.translate(dx, dy);
                    ctx.drawImage(img, 0, 0);

                    DOMURL.revokeObjectURL(svgurl);

                    const imageData = ctx.getImageData(0, 0, size[0], size[1]);

                    // const imgURI = canvas
                    //     .toDataURL('image/png')
                    //     .replace('image/png', 'image/octet-stream');

                    // console.log(imgURI);

                    resolve(imageData);
                };
                img.onerror = (e) => reject(e);
            });
        }

    }

    /**
     * The bounding box is a rectangular box that is wrapped as tightly as possible around a geometric element. It is oriented parallel to the axes.
     * It is defined by two opposite vertices. The class It includes a comprehensive set of functions for various processing tasks related to bounding boxes.
     * 
     */
    class BoundingBox {
        /**
         * Instantiates a **BoundingBox** object.
         * @param {Object} [options] An object literal defining the bounding box.
         * @param {number} xLow=1e20 The x coordinate of the low corner a rectangle.
         * @param {number} yLow=1e20 The y coordinate of the low corner a rectangle.
         * @param {number} xHigh=-1e20 The x coordinate of the high corner a rectangle.
         * @param {number} xHigh=-1e20 The y coordinate of the high corner a rectangle.
         */
        constructor(options) {
            Object.assign(this, {
                xLow: 1e20,
                yLow: 1e20,
                xHigh: -1e20, 
                yHigh: -1e20 });
            Object.assign(this, options);
        }

        /**
         * Defines a bonding box from an array of four elements.
         * @param {Array<number>} x The array of four elements with the two corners ([xLow, yLow, xHigh, yHigh]).
         */
        fromArray(x) {
            this.xLow = x[0];
            this.yLow = x[1]; 
            this.xHigh = x[2];
            this.yHigh  = x[3];
        }
        
        /**
         * Empties a bounding box.
         */
        toEmpty() {
            this.xLow = 1e20;
            this.yLow = 1e20; 
            this.xHigh = -1e20;
            this.yHigh  = -1e20;
        }

        /**
         * Tests weather the bounding box is empty.
         * @returns {bool} The test result.
         */
        isEmpty() {
            return this.xLow > this.xHigh || this.yLow > this.yHigh;
        }

        /**
         * Returns an array of four elements containg the low and high corners.
         * @returns {Array<number>} The array of corners.
         */
        toArray() {
            return [this.xLow, this.yLow, this.xHigh, this. yHigh];
        }

        /**
         * Returns a text string with the corner coordinates separated by a space.
         * @returns {string} The string of corners.
         */
        toString() {
            return this.xLow.toString() + " " + this.yLow.toString() + " " + this.xHigh.toString() + " " + this.yHigh.toString();
        }

        /**
         * Merges a `box` to `this` BoundingBox.
         * @param {BoundingBox} box The bounding box to be merged. 
         */
        mergeBox(box) {
    		if (box == null)
                return;

            if(this.isEmpty())
                Object.assign(this, box);
            else {
                this.xLow = Math.min(this.xLow,  box.xLow);
                this.yLow = Math.min(this.yLow,  box.yLow);
                this.xHigh = Math.max(this.xHigh, box.xHigh);
                this.yHigh = Math.max(this.yHigh, box.yHigh);
            }
        }

        /**
         * Merges a point `p`{x, y} to `this` BoundingBox.
         * @param {{x, y}} p The point to be merged. 
         */
        mergePoint(p) {
            this.xLow = Math.min(this.xLow, p.x);
            this.yLow = Math.min(this.yLow, p.y);
            this.xHigh = Math.max(this.xHigh, p.x);
            this.yHigh = Math.max(this.yHigh, p.y);
        }
        
        /**
         * Translates the bounding box by a displacement vector (dx, dy).
         * @param {number} dx Displacement along the x-axis.
         * @param {number} dy Displacement along the y-axis.
         */
        shift(dx, dy) {
            this.xLow += dx;
            this.yLow += dy;
            this.xHigh += dx;
            this.yHigh += dy;
        }

        /**
         * Divides by `side` and truncates the corner coordinates.
         * @param {*} side The value to divide by.
         */
        quantize(side) {
            this.xLow =  Math.floor(this.xLow/side);
            this.yLow =  Math.floor(this.yLow/side);
            this.xHigh = Math.floor((this.xHigh-1)/side) + 1;
            this.yHigh = Math.floor((this.yHigh-1)/side) + 1;
        }

        /**
         * Returns the bounding box width.
         * @returns {number} The width value.
         */
        width() {
            return this.xHigh - this.xLow;
        }
        
        /**
         * Returns the bounding box height.
         * @returns {number} The height value.
         */
        height() {
            return this.yHigh - this.yLow;
        }

        /**
         * Returns the bounding box center.
         * @returns {number} The center value.
         */
        center() {
            return [(this.xLow+this.xHigh)/2, (this.yLow+this.yHigh)/2];
        }

        /**
         * Returns the i-th corner.
         * @param {number} i The index of the corner. 
         * @returns {Array<number>} A [x, y] pair.
         */
        corner(i) {
            // To avoid the switch
            let v = this.toArray();
            return {x: v[0 + (i&0x1)<<1], y: v[1 + (i&0x2)] };
        }

        intersects(box) {
            return xLow <= box.xHigh && xHigh >= box.xLow && yLow <= box.yHigh && yHigh >= box.yLow;
        }
        /**
         * Prints out the bounding box corners in the console.
         */
        print() {
            console.log("BOX=" + this.xLow.toFixed(2) + ", " + this.yLow.toFixed(2) + ", " + this.xHigh.toFixed(2) + ", " + this.yHigh.toFixed(2));
        }

    }

    /**
     * A [x, y] point.
     * @typedef APoint
     * @property {number} p.0 The x-coordinate.
     * @property {number} p.1 The y-coordinate.
     */

    /**
     * A {x, y} point.
     * @typedef {Object} Point
     * @property {number} x The x-coordinate.
     * @property {number} y The y-coordinate.
     */

    /**
     * The class **Transform** implements a 2D affine map to convert coordinates between two systems.
     * The map is internally represented by four values:
     * * `x` the x-component of the translation vector
     * * `y` the y-component of the translation vector
     * * `a` the rotation angle around the z-axis (in degrees)
     * * `z` the scale factor
     * 
     * A transformation between a point P to P' is defined by
     * ```
     * P' = z*rot(a)*P + t
     * ```
     * where `z` is the scale factor, `a` is the rotation angle, and `t(x,y)` is the translation vector.
     * 
     * The class implements a set of geometric transformations useful to position the camera, create animations, etc... 
     */

    class Transform { //FIXME Add translation to P?
    	/**
    	 * Instantiates a Transform object.
    	 * @param {Object} [options] An object literal with Transform parameters.
    	 * @param {number} options.x=0 The x-component of the translation vector.
    	 * @param {number} options.y=0 The y-component of the translation vector.
    	 * @param {number} options.a=0 The rotation angle (in degrees).
    	 * @param {number} options.z=1 The scale factor.
    	 * @param {time} options.t=0 The current time.
    	 */
    	constructor(options) {
    		Object.assign(this, { x:0, y:0, z:1, a:0, t:0 });

    		if(!this.t) this.t = performance.now();
    		
    		if(typeof(options) == 'object')
    			Object.assign(this, options);
    	}

    	/**
    	 * Gets a copy of `this` Transform.
    	 * @returns {Transform} The copy of the Transform.
    	 */
    	copy() {
    		let transform = new Transform();
    		Object.assign(transform, this);
    		return transform;
    	}

    	/**
    	 * Applies `this` Transform to a point P(x,y) to get P'(x',y').
    	 * @param {number} x x-coordinate of the point P.
    	 * @param {number} y y-coordinate of the point P.
    	 * @returns {{x, y}} The point P'.
    	 */
    	apply(x, y) {
    		//TODO! ROTATE
    		let r = Transform.rotate(x, y, this.a);
    		return { 
    			x: r.x*this.z + this.x,
    			y: r.y*this.z + this.y
    		}
    	}

    	/**
    	 * Computes the inverse of `this` Transform.
    	 * @returns {Transform} The inverse Transform.
    	 */
    	inverse() {
    		let r = Transform.rotate(this.x/this.z, this.y/this.z, -this.a);
    		return new Transform({x:-r.x, y:-r.y, z:1/this.z, a:-this.a, t:this.t});
    	}

    	/**
    	 * Maps an angle `a` to range from 0 to 360 degrees.
    	 * @param {number} a The angle (in degrees).
    	 * @returns {number} The normalized angle.
    	 */
    	static normalizeAngle(a) {
    		while(a > 360) a -= 360;
    		while(a < 0) a += 360;
    		return a;
    	}

    	/**
    	 * Computes the rotation of a point P(x,y) by an angle `a` around the z-axis to get P'(x',y').
    	 * @param {*} x x-coordinate of the point P.
    	 * @param {*} y y-coordinate of the point P.
    	 * @param {*} a The rotation angle (in degrees)
    	 * @returns {{x,y}} The point P'.
    	 */
    	static rotate(x, y, a) {
    		a = Math.PI*(a/180);
    		let ex =  Math.cos(a)*x - Math.sin(a)*y;
    		let ey =  Math.sin(a)*x + Math.cos(a)*y;
    		return {x:ex, y:ey};
    	}

    	// first get applied this (a) then  transform (b).
    	/**
    	 * Composes (multiplies) `this` Transform with an other `transform`.
    	 * @param {Transform} transform 
    	 * @returns {Transform} The result of the composition.
    	 */
    	compose(transform) {
    		let a = this.copy();
    		let b = transform;
    		a.z *= b.z;
    		a.a += b.a;
    		var r = Transform.rotate(a.x, a.y, b.a);
    		a.x = r.x*b.z + b.x;
    		a.y = r.y*b.z + b.y; 
    		return a;
    	}

    	/**
    	 * Applyes `this` Transform to a bounding box.
    	 * @param {BoundingBox} lbox 
    	 * @returns {BoundingBox} The result.
    	 */
    	transformBox(lbox) {
    		let box = new BoundingBox();
    		for(let i = 0; i < 4; i++) {
    			let c = lbox.corner(i);
    			let p = this.apply(c.x, c.y);
    			box.mergePoint(p);
    		}
    		return box;
    	}

    	/**
    	 * Gets the bounding box (in image coordinate space) of the vieport. The viewport y-axis points up.
    	 * The image and screen transform has y pointing down.
    	 * @param {Viewport} viewport 
    	 * @returns {BoundingBox} The bounding box.
    	 */
    	getInverseBox(viewport) {
    		let inverse = this.inverse();
    		let corners = [
    			{x:viewport.x,               y:viewport.y},
    			{x:viewport.x + viewport.dx, y:viewport.y},
    			{x:viewport.x,               y:viewport.y + viewport.dy},
    			{x:viewport.x + viewport.dx, y:viewport.y + viewport.dy}
    		];
    		let box = new BoundingBox();
    		for(let corner of corners) {
    			let p = inverse.apply(corner.x -viewport.w/2, -corner.y + viewport.h/2);
    			box.mergePoint(p);
    		}
    		return box;
    	}

    	/**
    	* The type Easing defines the function that regulates the movement of the camera
    	* @typedef {('linear'|'ease-out'|'ease-in-out')} Transform#Easing
    	*/

    	/**
    	 * Computes the interpolated transform at time `time` between `source` and `target` 
    	 * @param {Transform} source The source transform.
    	 * @param {Transform} target The target transform.
    	 * @param {time} time The time at which to compute the interpolation.
    	 * @param {Transform#Easing} easing The easing function.
    	 * @returns {Transform} The interpolated transform.
    	 */
    	static interpolate(source, target, time, easing) { //FIXME STATIC
    		const pos = new Transform();
    		let dt = (target.t - source.t);
    		if (time < source.t) {
    			Object.assign(pos, source);
    		} else if (time > target.t || dt < 0.001) {
    			Object.assign(pos, target);
    		} else {
    			let tt = (time - source.t) / dt;
    			switch (easing) {
    				case 'ease-out': tt = 1 - Math.pow(1 - tt, 2); break;
    				case 'ease-in-out': tt = tt < 0.5 ? 2 * tt * tt : 1 - Math.pow(-2 * tt + 2, 2) / 2; break;
    			}
    			let st = 1 - tt;
    			for (let i of ['x', 'y', 'z', 'a'])
    				pos[i] = (st * source[i] + tt * target[i]);
    		}
    		pos.t = time;
    		return pos;
    	}

    	/**
    	 * Combines `this` Transform with the viewport to get the WebGL projection matrix.
    	 * @param {Viewport} viewport The viewport. 
    	 * @returns {number[]} The result.
    	 */
    	projectionMatrix(viewport) {
    		let z = this.z;

    		// In coords with 0 in lower left corner map x0 to -1, and x0+v.w to 1
    		// In coords with 0 at screen center and x0 at 0, map -v.w/2 -> -1, v.w/2 -> 1 
    		// With x0 != 0: x0 -> x0-v.w/2 -> -1, and x0+dx -> x0+v.dx-v.w/2 -> 1
    		// Where dx is viewport width, while w is window width
    		//0, 0 <-> viewport.x + viewport.dx/2 (if x, y =
    		
    		let zx = 2/viewport.dx;
    		let zy = 2/viewport.dy;

    		let dx =  zx * this.x + (2/viewport.dx)*(viewport.w/2-viewport.x)-1;
    		let dy =  zy * this.y + (2/viewport.dy)*(viewport.h/2-viewport.y)-1;

    		let a = Math.PI *this.a/180;
    		let matrix = [
    			 Math.cos(a)*zx*z, Math.sin(a)*zy*z,  0,  0, 
    			-Math.sin(a)*zx*z, Math.cos(a)*zy*z,  0,  0,
    			 0,  0,  1,  0,
    			dx, dy, 0,  1];
    		return matrix;
    	}

        /**
    	 * Transforms the point `p` from scene (0 at image center) to [0,wh]  .
    	 * @param {Viewport} viewport The viewport.
    	 * @param {APoint} p The point in scene (0,0 at image center)
    	 * @returns {APoint} The point in range [0..w-1,0..h-1]
    	 */ 
    	sceneToViewportCoords(viewport, p) { //FIXME Point is an array, but in other places it is an Object...
            return [p[0] * this.z  + this.x - viewport.x + viewport.w/2, 
                    p[1] * this.z  - this.y + viewport.y + viewport.h/2 ];
        }

    	/**
         * Transforms the point `p` from [0,wh] to scene (0 at image center).
    	 * 
    	 * @param {Viewport} viewport The viewport.
    	 * @param {APoint} p The point in range [0..w-1,0..h-1]
    	 * @returns {APoint} The point in scene (0,0 at image center)
    	 */
        viewportToSceneCoords(viewport, p) {
            return [(p[0] + viewport.x - viewport.w/2 - this.x) / this.z,
                    (p[1] - viewport.y - viewport.h/2 + this.y) / this.z];
        }

    	print(str="", precision=0) {
        	const p = precision;
        	console.log(str + " x:" + this.x.toFixed(p) + ", y:" + this.y.toFixed(p) + ", z:" + this.z.toFixed(p) + ", a:" + this.a.toFixed(p) + ", t:" + this.t.toFixed(p));
    	}
    }

    function addSignals(proto, ...signals) {

    	if(!proto.prototype.allSignals)
    		proto.prototype.allSignals = [];
    	proto.prototype.allSignals = [...proto.prototype.allSignals, ...signals];

    	proto.prototype.initSignals = function() {
    		this.signals = Object.fromEntries(this.allSignals.map( s => [s, []]));
    	};
         
         
    	/**
    	  * Adds a Layer Event
    	  * @param {string} event A label to identify the event.
    	  * @param {*} callback The event callback function.
    	*/
    	proto.prototype.addEvent = function(event, callback) {
    		if(!this.signals)
    			this.initSignals();
    		this.signals[event].push(callback);
    	};

    	/*
    	  * Emits an event (running all the callbacks referred to it).
    	  * @param {*} event The event name
    	  */
    	/** @ignore */
    	proto.prototype.emit = function(event, ...parameters) {
    		if(!this.signals)
    			this.initSignals();
    		for (let r of this.signals[event])
    			r(...parameters);
    	};
    }

    /**
     * The type Viewport defines a rectangular viewing region inside a (wxh) area
     * @typedef {Object} Viewport
     * @property {number} x x-component of the lower left corner.
     * @property {number} y y-component of the lower left corner.
     * @property {number} dx x-component of the top right corner.
     * @property {number} dy y-component of the top right corner.
     * @property {number} w the viewport width.
     * @property {number} w the viewport height.
     */

    /**
     * The class Camera does not have an operational role, but it is rather a container of parameters 
     * needed by the system to define the viewport, the camera position and to calculate the appropriate view.
     * 
     * To enable the animation, a camera contains two view matrices (two {@link Transform} objects): a `source` with the 
     * current position and a `target` with the position the camera will arrive at in a time `dt`. 
     * 
     * The member function `setPosition()` takes care of defining the target, the OpenLIME system automatically animates the 
     * camera to bring it from source to target, unless the user manually interrupts the current animation.
     * 
     * User-generated device events (such as touch events or mouse events) can modify camera parameters via an appropriate {@link Controller}.
     */

     
    class Camera {
    	/**
    	 * Creates a scene's camera. An update event is issued when the camera has completed its positioning.
     	 * Additionally, an object literal with Viewer `options` can be specified.
     	 * @param {Object} [options]
     	 * @param {bool} options.bounded=true Weather to limit the translation of the camera to the boundary of the scene.
     	 * @param {number} options.maxFixedZoom=2 The maximum pixel size.
      	 * @param {number} options.minScreenFraction=1 The minimum portion of the screen to zoom in.
     	 */
    	constructor(options) {
    		Object.assign(this, {
    			viewport: null,
    			bounded: true,
    			minScreenFraction: 1,
    			maxFixedZoom: 2,
    			maxZoom: 2,
    			minZoom: 1,
    			boundingBox: new BoundingBox,
    		});
    		Object.assign(this, options);
    		this.target = new Transform(this.target);
    		this.source = this.target.copy();
    		this.easing = 'linear';
    	}

    	/**
    	 * Defines the copy constructor.
    	 * @returns A copy of the Camera.
    	 */
    	copy() {
    		let camera = new Camera();
    		Object.assign(camera, this);
    		return camera;
    	}

    	/**
    	 * Sets the viewport and updates the camera position as close as possible to the previuos one.
    	 * @param {Viewport} view The new viewport (in CSS coordinates). 
    	 */
    	setViewport(view) {
    		if (this.viewport) {
    			let rz = Math.sqrt((view.w / this.viewport.w) * (view.h / this.viewport.h));
    			this.viewport = view;
    			const { x, y, z, a } = this.target;
    			this.setPosition(0, x, y, z * rz, a);
    		} else {
    			this.viewport = view;
    		}
    	}

    	/** 
    	* Gets the current viewport (in device coordinates).
    	* @return the current viewport
    	*/
    	glViewport() {
    		let d = window.devicePixelRatio;
    		let viewport = {};
    		for (let i in this.viewport)
    			viewport[i] = this.viewport[i] * d;
    		return viewport;
    	}

    	/**
    	 * Map coordinate relative to the canvas into scene coords using the specified transform.
    	 * @return {Object} {X, Y} in scene coordinates (relative to the center of the viewport).
    	 */
    	mapToScene(x, y, transform) {
    		//compute coords relative to the center of the viewport.
    		x -= this.viewport.w / 2;
    		y -= this.viewport.h / 2;
    		x -= transform.x;
    		y -= transform.y;
    		x /= transform.z;
    		y /= transform.z;
    		let r = Transform.rotate(x, y, -transform.a);
    		return { x: r.x, y: r.y };
    	}

    	/**
    	 * Map coordinate relative to the scene into canvas coords using the specified transform.
    	 * @return {Object} {X, Y} in canvas coordinates.
    	 */
    	sceneToCanvas(x, y, transform) {
    		let r = Transform.rotate(x, y, transform.a);
    		x = r.x * transform.z + transform.x - this.viewport.x + this.viewport.w/2;
    		y = r.y * transform.z - transform.y + this.viewport.y + this.viewport.h/2;
    		return { x: x, y: y };
    	}

    	/**
    	 * Sets the camera target parameters (position, rotation, )
    	 * @param {number} dt The animation duration in millisecond.
    	 * @param {*} x The x-component of the translation vector.
    	 * @param {*} y The y-component of the translation vector.
    	 * @param {*} z The zoom factor.
    	 * @param {*} a The rotation angle (in degrees).
    	 * @param {Easing} easing The function aimed at making the camera movement less severe or pronounced.
    	 */
    	setPosition(dt, x, y, z, a, easing) {
    		/**
    		* The event is fired when the camera target is changed.
    		* @event Camera#update
    		*/

    		// Discard events due to cursor outside window
    		//if (Math.abs(x) > 64000 || Math.abs(y) > 64000) return;
    		this.easing = easing || this.easing;

    		if (this.bounded) {
    			const sw = this.viewport.dx;
    			const sh = this.viewport.dy;

    			//
    			let xform = new Transform({ x: x, y: y, z: z, a: a, t: 0 });
    			let tbox = xform.transformBox(this.boundingBox);
    			const bw = tbox.width();
    			const bh = tbox.height();

    			// Screen space offset between image boundary and screen boundary
    			// Do not let transform offet go beyond this limit.
    			// if (scaled-image-size < screen) it remains fully contained
    			// else the scaled-image boundary closest to the screen cannot enter the screen.
    			const dx = Math.abs(bw - sw) / 2;
    			x = Math.min(Math.max(-dx, x), dx);

    			const dy = Math.abs(bh - sh) / 2;
    			y = Math.min(Math.max(-dy, y), dy);
    		}

    		let now = performance.now();
    		this.source = this.getCurrentTransform(now);
    		//the angle needs to be interpolated in the shortest direction.
    		//target it is kept between 0 and +360, source is kept relative.
    		a = Transform.normalizeAngle(a);
    		this.source.a = Transform.normalizeAngle(this.source.a);
    		if (a - this.source.a > 180) this.source.a += 360;
    		if (this.source.a - a > 180) this.source.a -= 360;
    		Object.assign(this.target, { x: x, y: y, z: z, a: a, t: now + dt });
    		this.emit('update');
    	}

    	/**
    	 * Pan the camera (in canvas coords)
    	 * @param {number} dt The animation duration in millisecond.
    	 * @param {number} dx The horizontal displancement.
    	 * @param {number} dy The vertical displacement. 
    	 */
    	pan(dt, dx, dy) {
    		let now = performance.now();
    		let m = this.getCurrentTransform(now);
    		m.x += dx;
    		m.y += dy;
    		this.setPosition(dt, m.x, m.y, m.z, m.a);
    	}

    	/** Zoom in or out at a specific point (in canvas coords)
    	 * @param {number} dt The animation duration in millisecond.
    	 * @param {number} z The distance of the camera from the canvas.
    	 * @param {number} x The x coord to zoom in|out
    	 * @param {number} y The y coord to zoom in|out
    	 */
    	zoom(dt, z, x, y) {
    		if (!x) x = 0;
    		if (!y) y = 0;

    		let now = performance.now();
    		let m = this.getCurrentTransform(now);

    		if (this.bounded) {
    			z = Math.min(Math.max(z, this.minZoom), this.maxZoom);
    		}

    		//x, an y should be the center of the zoom.
    		m.x += (m.x + x) * (m.z - z) / m.z;
    		m.y += (m.y + y) * (m.z - z) / m.z;

    		this.setPosition(dt, m.x, m.y, z, m.a);
    	}

    	/**
    	 * Rotate the camera around its z-axis by an `a` angle (in degrees) 
    	 * @param {number} dt The animation duration in millisecond.
    	 * @param {angle} a The rotation angle (in degrees).
    	 */
    	rotate(dt, a) {

    		let now = performance.now();
    		let m = this.getCurrentTransform(now);

    		this.setPosition(dt, m.x, m.y, m.z, this.target.a + a);
    	}

    	/** Zoom in or out at a specific point (in canvas coords)
    	 * @param {number} dt The animation duration in millisecond.
    	 * @param {number} dz The scroll amount for the z-axis.
    	 * @param {number} x=0 The x coord to zoom in|out
    	 * @param {number} y=0 The y coord to zoom in|out
    	 */
    	deltaZoom(dt, dz, x=0, y=0) {

    		let now = performance.now();
    		let m = this.getCurrentTransform(now);

    		//rapid firing wheel event need to compound.
    		//but the x, y in input are relative to the current transform.
    		dz *= this.target.z / m.z;

    		if (this.bounded) {
    			if (m.z * dz < this.minZoom) dz = this.minZoom / m.z;
    			if (m.z * dz > this.maxZoom) dz = this.maxZoom / m.z;
    		}

    		//transform is x*z + dx = X , there x is positrion in scene, X on screen
    		//we want x*z*dz + dx1 = X (stay put, we need to find dx1.
    		let r = Transform.rotate(x, y, m.a);
    		m.x += r.x * m.z * (1 - dz);
    		m.y += r.y * m.z * (1 - dz);

    		this.setPosition(dt, m.x, m.y, m.z * dz, m.a);
    	}

    	/**
    	 * Gets the camera transform at `time` in canvas coords.
    	 * @param {time} time The current time (a DOMHighResTimeStamp variable, as in `performance.now()`).
    	 * @returns {Transform} The current transform
    	 */
    	getCurrentTransform(time) {
    		if(time > this.target.t) this.easing = 'linear';
    		return Transform.interpolate(this.source, this.target, time, this.easing);
    	}

    	/**
    	 * Gets the camera transform at `time` in device coords.
    	 * @param {time} time The current time (a DOMHighResTimeStamp variable, as in `performance.now()`).
    	 * @returns {Transform} The current transform
    	 */
    	 getGlCurrentTransform(time) {
    		const pos = this.getCurrentTransform(time);
    		pos.x *= window.devicePixelRatio;
    		pos.y *= window.devicePixelRatio;
    		pos.z *= window.devicePixelRatio;
    		return pos;
    	}


    	/**
    	 * Modify the camera settings to frame the specified `box` 
    	 * @param {BoundingBox} box The specified rectangle [minx, miny, maxx, maxy] in the canvas.
    	 * @param {number} dt The animation duration in millisecond 
    	 */
    	fit(box, dt) {
    		if (box.isEmpty()) return;
    		if (!dt) dt = 0;

    		//find if we align the topbottom borders or the leftright border.
    		let w = this.viewport.dx;
    		let h = this.viewport.dy;

    		let bw = box.width();
    		let bh = box.height();
    		let c = box.center();
    		let z = Math.min(w / bw, h / bh);

    		this.setPosition(dt, -c[0], -c[1], z, 0);
    	}

    	/**
    	 * Modify the camera settings to the factory values (home). 
    	 * @param {number} dt animation duration in millisecond
    	 */
    	fitCameraBox(dt) {
    		this.fit(this.boundingBox, dt);
    	}

    	/** @ignore */
    	updateBounds(box, minScale) {
    		this.boundingBox = box;
    		const w = this.viewport.dx;
    		const h = this.viewport.dy;

    		let bw = this.boundingBox.width();
    		let bh = this.boundingBox.height();

    		this.minZoom = Math.min(w / bw, h / bh) * this.minScreenFraction;
    		this.maxZoom = minScale > 0 ? this.maxFixedZoom / minScale : this.maxFixedZoom;
    		this.maxZoom = Math.max(this.minZoom, this.maxZoom);
    	}
    }

    addSignals(Camera, 'update');

    // Tile level x y  index ----- tex missing() start/end (tarzoom) ----- time, priority size(byte)

    /**
     * A tile represents a single element of a regular grid that subdivides an image.
     * A tile is identified by its position (`x`, `y`) within the grid and the zoom `level` of the image.
     * @typedef {Object} Tile
     * @property {number} level The zoom level of the tile.
     * @property {number} x x position of the tile in the grid.
     * @property {number} y y position of the tile in the grid.
     * @property {number} index Unique tile identifier.
     * @property {number} start The position of the first byte of the tile in the image dataset (used only for tarzoom and itarzoom image formats).
     * @property {number} end The position of the last byte of the tile in the image dataset (used only for tarzoom and itarzoom image formats).
     * @property {number} missing In the case of multi-channel formats (RTI, BRDF), the information content of a tile is distributed over several planes (channels). 
     * `missing` represents the number of pending channel data requests.
     * @property {Array} tex A array of WebGLTexture (one texture per channel).
     * @property {time} time Tile creation time (this value is used internally by the cache algorithms).
     * @property {number} priority The priority of the tile (this value is used internally by the cache algorithms).
     * @property {number} size The total size of the tile in bytes (this value is used internally by the cache algorithms).
     */

    class Tile {
        constructor() {
            Object.assign(this, {
                index: null, 
                bbox: null,

                level: null, //used only in LayoutTiles
                x: null,
                y: null,
                w: null, // used only in LayoutImages
                h: null, // used only in LayoutImages

                start:null,
                end:null,

                tex: [],
                missing: null,
                time: null,
                priority: null,
                size: null
            });
        }
    }

    /**
     * Contain functions to pass between different coordinate system.
     * Here described the coordinate system in sequence
     * - CanvasHTML: Html coordinates: 0,0 left,top to width height at bottom right (y Down)
     * - CanvasContext: Same as Html, but scaled by devicePixelRatio (y Down) (required for WebGL, not for SVG)
     * - Viewport: 0,0 left,bottom to (width,height) at top right (y Up)
     * - Center: 0,0 at viewport center (y Up)
     * - Scene: 0,0 at dataset center (y Up). The dataset is placed here through the camera transform 
     * - Layer: 0,0 at Layer center (y Up). Layer is placed over the dataset by the layer transform
     * - Image: 0,0 at left,top (y Down)
     * - Layout: 0,0 at left,top (y Down). Depends on layout
     */
    class CoordinateSystem {
        
        /**
         * Transform point from Viewport to CanvasHTML
         * @param {*} p point in Viewport: 0,0 at left,bottom
         * @param {Camera} camera Camera which contains viewport information
         * @param {bool} useGL True to work with WebGL, false for SVG. When true, it uses devPixelRatio scale
         * @returns  point in CanvasHtml: 0,0 left,top
         */
         static fromViewportToCanvasHtml(p, camera, useGL) {
            const viewport = this.getViewport(camera, useGL);
            let result = this.invertY(p, viewport);
            return useGL ? this.scale(result, 1/window.devicePixelRatio) : result;
        }

        /**
         * Transform point from CanvasHTML to GLViewport
         * @param {*} p point in CanvasHtml: 0,0 left,top y Down
         * @param {Camera} camera Camera
         * @param {bool} useGL True to work with WebGL, false for SVG. When true, it uses devPixelRatio scale
         * @returns  point in GLViewport: 0,0 left,bottom, scaled by devicePixelRatio
         */
         static fromCanvasHtmlToViewport(p, camera, useGL) {
            let result = useGL ? this.scale(p, window.devicePixelRatio) : p;
            const viewport = this.getViewport(camera, useGL);
            return this.invertY(result, viewport);
        }

        
        /**
         * Transform a point from Viewport to Layer coordinates
         * @param {*} p point {x,y} in Viewport (0,0 left,bottom, y Up)
         * @param {Camera} camera camera
         * @param {Transform} layerT layer transform
         * @param {bool} useGL True to work with WebGL, false for SVG. When true, it uses devPixelRatio scale
         * @returns point in Layer coordinates (0, 0 at layer center, y Up)
         */
         static fromViewportToLayer(p, camera, layerT, useGL) {
           // M = InvLayerT * InvCameraT  * Tr(-Vw/2, -Vh/2)
           const cameraT = this.getCurrentTransform(camera, useGL);
           const invCameraT = cameraT.inverse();
           const invLayerT = layerT.inverse();
           const v2c = this.getFromViewportToCenterTransform(camera, useGL);
           const M = v2c.compose(invCameraT.compose(invLayerT)); // First apply v2c, then invCamera, then invLayer
            
           return M.apply(p.x, p.y);
        }

        /**
         * Transform a point from Layer to Viewport coordinates
         * @param {*} p point {x,y} Layer (0,0 at Layer center y Up)
         * @param {Camera} camera 
         * @param {Transform} layerT layer transform
         * @param {bool} useGL True to work with WebGL, false for SVG. When true, it uses devPixelRatio scale
         * @returns point in viewport coordinates (0,0 at left,bottom y Up)
         */
         static fromLayerToViewport(p, camera, layerT, useGL) {
            const M = this.getFromLayerToViewportTransform(camera, layerT, useGL);
            return M.apply(p.x, p.y);
         }

        /**
         * Transform a point from Layer to Center 
         * @param {*} p point {x,y} in Layer coordinates (0,0 at Layer center)
         * @param {Camera} camera camera
         * @param {Transform} layerT layer transform
         * @returns point in Center (0, 0 at glViewport center) coordinates.
         */
         static fromLayerToCenter(p, camera, layerT, useGL) {
            // M = cameraT * layerT
            const cameraT = this.getCurrentTransform(camera, useGL);
            const M = layerT.compose(cameraT);

            return  M.apply(p.x, p.y);
        }

        ////////////// CHECKED UP TO HERE ////////////////////

        /**
         * Transform a point from Layer to Image coordinates
         * @param {*} p point {x, y} Layer coordinates (0,0 at Layer center)
         * @param {*} layerSize {w, h} Size in pixel of the Layer
         * @returns  Point in Image coordinates (0,0 at left,top, y Down)
         */
         static fromLayerToImage(p, layerSize) {
            // InvertY * Tr(Lw/2, Lh/2)
            let result  = {x: p.x + layerSize.w/2, y: p.y + layerSize.h/2};
            return this.invertY(result, layerSize);
        }
        
        /**
         * Transform a point from CanvasHtml to Scene
         * @param {*} p point {x, y} in CanvasHtml (0,0 left,top, y Down)
         * @param {Camera} camera camera
         * @param {bool} useGL True to work with WebGL, false for SVG. When true, it uses devPixelRatio scale
         * @returns Point in Scene coordinates (0,0 at scene center, y Up)
         */
         static fromCanvasHtmlToScene(p, camera, useGL) {
            // invCameraT * Tr(-Vw/2, -Vh/2) * InvertY  * [Scale(devPixRatio)]
            let result = this.fromCanvasHtmlToViewport(p, camera, useGL);
            const v2c = this.getFromViewportToCenterTransform(camera, useGL);
            const invCameraT = this.getCurrentTransform(camera, useGL).inverse();
            const M = v2c.compose(invCameraT);

            return  M.apply(result.x, result.y);
        }

        /**
         * Transform a point from Scene to CanvasHtml
         * @param {*} p point {x, y} Scene coordinates (0,0 at scene center, y Up)
         * @param {Camera} camera camera
         * @param {bool} useGL True to work with WebGL, false for SVG. When true, it uses devPixelRatio scale
         * @returns Point in CanvasHtml (0,0 left,top, y Down)
         */
        static fromSceneToCanvasHtml(p, camera, useGL) {
            // invCameraT * Tr(-Vw/2, -Vh/2) * InvertY  * [Scale(devPixRatio)]
            let result = this.fromSceneToViewport(p, camera, useGL);
            return this.fromViewportToCanvasHtml(result, camera, useGL);
        }

        /**
         * Transform a point from Scene to Viewport
         * @param {*} p point {x, y} Scene coordinates (0,0 at scene center, y Up)
         * @param {Camera} camera camera
         * @param {bool} useGL True to work with WebGL, false for SVG. When true, it uses devPixelRatio scale
         * @returns Point in Viewport (0,0 left,bottom, y Up)
         */
        static fromSceneToViewport(p, camera, useGL) {
            // FromCenterToViewport * CamT
            const c2v = this.getFromViewportToCenterTransform(camera, useGL).inverse();
            const CameraT = this.getCurrentTransform(camera, useGL);
            const M = CameraT.compose(c2v);

            return  M.apply(p.x, p.y);
        }
        
        /**
         * Transform a point from Scene to Viewport, using given transform and viewport
         * @param {*} p point {x, y} Scene coordinates (0,0 at scene center, y Up)
         * @param {Transform} cameraT camera transform
         * @param {*} viewport viewport {x,y,dx,dy,w,h}
         * @returns Point in Viewport (0,0 left,bottom, y Up)
         */
        static fromSceneToViewportNoCamera(p, cameraT, viewport) {
            // invCameraT * Tr(-Vw/2, -Vh/2) * InvertY  * [Scale(devPixRatio)]
            const c2v = this.getFromViewportToCenterTransformNoCamera(viewport).inverse();
            const M = cameraT.compose(c2v);

            return  M.apply(p.x, p.y);
        }
            
        /**
         * Transform a point from Viewport to Scene.
         * @param {*} p point {x, y} Viewport coordinates (0,0 at left,bottom, y Up)
         * @param {Camera} camera camera
         * @param {bool} useGL True to work with WebGL, false for SVG. When true, it uses devPixelRatio scale
         * @returns Point in Viewport (0,0 at scene center, y Up)
         */
         static fromViewportToScene(p, camera, useGL) {
            // invCamT * FromViewportToCenter 
            const v2c = this.getFromViewportToCenterTransform(camera, useGL);
            const invCameraT = this.getCurrentTransform(camera, useGL).inverse();
            const M = v2c.compose(invCameraT);

            return  M.apply(p.x, p.y);
        }

        /**
         * Transform a point from Viewport to Scene, using given transform and viewport
         * @param {*} p point {x, y} Viewport coordinates (0,0 at left,bottom, y Up)
         * @param {Transform} cameraT camera transform
         * @param {*} viewport viewport {x,y,dx,dy,w,h}
         * @returns Point in Viewport (0,0 at scene center, y Up)
         */
        static fromViewportToSceneNoCamera(p, cameraT, viewport) {
            // invCamT * FromViewportToCenter 
            const v2c = this.getFromViewportToCenterTransformNoCamera(viewport);
            const invCameraT = cameraT.inverse();
            const M = v2c.compose(invCameraT);

            return  M.apply(p.x, p.y);
        }
        
        /**
         * Transform a point from CanvasHtml to Image
         * @param {*} p  point {x, y} in CanvasHtml (0,0 left,top, y Down)
         * @param {Camera} camera camera 
         * @param {Transform} layerT layer transform 
         * @param {*} layerSize  {w, h} Size in pixel of the Layer
         * @param {bool} applyGLScale if true apply devPixelRatio scale. Keep it false when working with SVG
         * @returns Point in Image space (0,0 left,top of the image, y Down)
         */
         static fromCanvasHtmlToImage(p, camera, layerT, layerSize, useGL) {
            // Translate(Lw/2, Lh/2) * InvLayerT * InvCameraT *  Translate(-Vw/2, -Vh/2) * invertY * [Scale(devicePixelRatio)]
            // in other words... fromLayerToImage * invLayerT * fromCanvasHtmlToScene
            let result = this.fromCanvasHtmlToScene(p, camera, useGL);
            const invLayerT = layerT.inverse();
            result = invLayerT.apply(result.x, result.y);
            result = this.fromLayerToImage(result, layerSize);

            return result;
        }

        /**
         * Transform a box from Viewport to Image coordinates
         * @param {BoundingBox} box in Viewport coordinates (0,0 at left,bottom, y Up)
         * @param {Transform} cameraT camera Transform
         * @param {*} viewport {x,y,dx,dy,w,h}
         * @param {Transform} layerT layer transform
         * @param {*} layerSize {w,h} layer pixel size
         * @returns box in Image coordinates (0,0 left,top, y Dowm)
         */
         static fromViewportBoxToImageBox(box, cameraT, viewport, layerT, layerSize) {
            // InvertYonImage * T(Lw/2, Lh/2) * InvL * InvCam * T(-Vw/2,-Vh/2) 
            let V2C = new Transform({x:-viewport.w/2, y:-viewport.h/2});
            let C2S = cameraT.inverse();
            let S2L = layerT.inverse();
            let L2I = new Transform({x:layerSize.w/2, y:layerSize.h/2});
            let M = V2C.compose(C2S.compose(S2L.compose(L2I)));
            let resultBox = new BoundingBox();
    		for(let i = 0; i < 4; ++i) {
                let p = box.corner(i);
                p = M.apply(p.x, p.y);
                p = CoordinateSystem.invertY(p, layerSize);
    			resultBox.mergePoint(p);
    		}
            return resultBox;
        }

        /**
         * Transform a box from Layer to Scene 
         * @param {BoundingBox} box  box in Layer coordinates (0,0 at layer center)
         * @param {Transform} layerT layer transform
         * @returns box in Scene coordinates (0,0 at scene center)
         */
         static fromLayerBoxToSceneBox(box, layerT) {
             return layerT.transformBox(box); 
        }
      
        /**
         * Transform a box from Scene to Layer 
         * @param {BoundingBox} box  box in Layer coordinates (0,0 at layer center)
         * @param {Transform} layerT layer transform
         * @returns box in Scene coordinates (0,0 at scene center)
         */
         static fromSceneBoxToLayerBox(box, layerT) {
            return layerT.inverse().transformBox(box); 
       }

        /**
         * Transform a box from Layer to Viewport coordinates
         * @param {BoundingBox} box box in Layer coordinates (0,0 at Layer center y Up)
         * @param {Camera} camera 
         * @param {Transform} layerT layer transform
         * @param {bool} useGL True to work with WebGL, false for SVG. When true, it uses devPixelRatio scale
         * @returns Box in Viewport coordinates (0,0 at left, bottom y Up)
         */
         static fromLayerBoxToViewportBox(box, camera, layerT, useGL) {
            const M = this.getFromLayerToViewportTransform(camera, layerT, useGL);
            return M.transformBox(box);  
        }

        /**
         * Transform a box from Layer to Viewport coordinates
         * @param {BoundingBox} box box in Layer coordinates (0,0 at Layer center y Up)
         * @param {Camera} camera 
         * @param {Transform} layerT layer transform
         * @param {bool} useGL True to work with WebGL, false for SVG. When true, it uses devPixelRatio scale
         * @returns Box in Viewport coordinates (0,0 at left, bottom y Up)
         */
         static fromViewportBoxToLayerBox(box, camera, layerT, useGL) {
            const M = this.getFromLayerToViewportTransform(camera, layerT, useGL).inverse();
            return M.transformBox(box);  
        }

        /**
         * Get a transform to go from viewport 0,0 at left, bottom y Up, to Center 0,0 at viewport center
         * @param {Camera} camera camera
         * @param {bool} useGL True to work with WebGL, false for SVG. When true, it uses devPixelRatio scale
         * @returns transform from Viewport to Center
         */
         static getFromViewportToCenterTransform(camera, useGL) {
            const viewport = this.getViewport(camera, useGL);
            return this.getFromViewportToCenterTransformNoCamera(viewport);
        }

        /**
         * Get a transform to go from viewport 0,0 at left, bottom y Up, to Center 0,0 at viewport center
         * from explicit viewport param. (Not using camera parameter here)
         * @param {*} viewport viewport
         * @returns transform from Viewport to Center
         */
        static getFromViewportToCenterTransformNoCamera(viewport) {
            return new Transform({x:viewport.x-viewport.w/2, y:viewport.y-viewport.h/2, z:1, a:0, t:0});
        }

        /**
         * Return transform with y reflected wrt origin (y=-y)
         * @param {Transform} t  
         * @returns {Transform} transform, with y reflected (around 0)
         */
        static reflectY(t) {
            return new Transform({x:t.x, y:-t.y, z:t.z, a:t.a, t:t.t});
        }

        /**
         * Get a transform to go from Layer (0,0 at Layer center y Up) to Viewport (0,0 at left,bottom y Up)
         * @param {Camera} camera 
         * @param {Transform} layerT layer transform
         * @param {bool} useGL True to work with WebGL, false for SVG. When true, it uses devPixelRatio scale
         * @returns transform from Layer to Viewport
         */
         static getFromLayerToViewportTransform(camera, layerT, useGL) {
            // M =  Center2Viewport * CameraT  * LayerT
            const cameraT = this.getCurrentTransform(camera, useGL);
            const c2v = this.getFromViewportToCenterTransform(camera, useGL).inverse();
            const M = layerT.compose(cameraT.compose(c2v));
            return M;
        }

        /**
         * Get a transform to go from Layer (0,0 at Layer center y Up) to Viewport (0,0 at left,bottom y Up)
         * @param {Transform} CameraT camera transform
         * @param {viewport} viewport {x,y,dx,dy,w,h} viewport
         * @param {Transform} layerT layer transform
         * @returns transform from Layer to Viewport
         */
        static getFromLayerToViewportTransformNoCamera(cameraT, viewport, layerT) {
            // M =  Center2Viewport * CameraT  * LayerT
            const c2v =  this.getFromViewportToCenterTransformNoCamera(viewport).inverse();
            const M = layerT.compose(cameraT.compose(c2v));
            return M;
        }
        

        /**
         * Scale x applying f scale factor
         * @param {*} p Point to be scaled
         * @param {Number} f Scale factor
         * @returns Point in CanvasContext (Scaled by devicePixelRation)
         */
        static scale(p, f) {
            return { x:p.x * f, y:p.y * f};
        }

        /**
         * Invert y with respect to viewport.h
         * @param {*} p Point to be transformed 
         * @param {*} viewport current viewport
         * @returns Point with y inverted with respect to viewport.h
         */
        static invertY(p, viewport) {
            return {x:p.x, y:viewport.h - p.y};
        }

        /**
         * Return the camera viewport: scaled by devicePixelRatio if useGL is true.
         * @param {bool} useGL True to work with WebGL, false for SVG. When true viewport scaled by devPixelRatio 
         * @returns Viewport 
         */
        static getViewport(camera, useGL) {
            return useGL ? camera.glViewport() : camera.viewport;
        }

        static getCurrentTransform(camera, useGL) {
            let cameraT = useGL ?
                            camera.getGlCurrentTransform(performance.now()) :
                            camera.getCurrentTransform(performance.now());
           
            return cameraT;
        }
    }

    // Tile level x y  index ----- tex missing() start/end (tarzoom) ----- time, priority size(byte)

    /**
     * A tile represents a single element of a regular grid that subdivides an image.
     * A tile is identified by its position (`x`, `y`) within the grid and the zoom `level` of the image.
     * @typedef {Object} Tile
     * @property {number} level The zoom level of the tile.
     * @property {number} x x position of the tile in the grid.
     * @property {number} y y position of the tile in the grid.
     * @property {number} index Unique tile identifier.
     * @property {number} start The position of the first byte of the tile in the image dataset (used only for tarzoom and itarzoom image formats).
     * @property {number} end The position of the last byte of the tile in the image dataset (used only for tarzoom and itarzoom image formats).
     * @property {number} missing In the case of multi-channel formats (RTI, BRDF), the information content of a tile is distributed over several planes (channels). 
     * `missing` represents the number of pending channel data requests.
     * @property {Array} tex A array of WebGLTexture (one texture per channel).
     * @property {time} time Tile creation time (this value is used internally by the cache algorithms).
     * @property {number} priority The priority of the tile (this value is used internally by the cache algorithms).
     * @property {number} size The total size of the tile in bytes (this value is used internally by the cache algorithms).
     */

    /**
    * The type of the image. All web single-resolution image types (*jpg*, *png*, *gif*, etc...) are supported
    * as well as the most common multi-resolution image formats (*deepzoom*, *zoomify*, *IIIF*, *google maps*).
    * @typedef {('image'|'deepzoom'|'deepzoom1px'|'google'|'zoomify'|'iiif'|'tarzoom'|'itarzoom')} Layout#Type
    */

    /**
     * The Layout class is responsible for specifying the data formats (images) managed by OpenLIME.
     * All web single-resolution image types (*jpg*, *png*, *gif*, etc...) are supported as well as the most common 
     * tiled image formats (*deepzoom*, *zoomify*, *IIIF*, *google maps*), which are suitable for large images.
     * #### Single-resolution images
     * The URL is the address of the file (for instance, 'https://my.example/image.jpg').
     * #### Tiled images
     * They can be specified in a variety of ways depending on the format chosen.
     * * **deepzoom** - The root tile of the image pyramid has a size > 1px (typical value is 254px). It is defined by the URL of the *.dzi* file 
     * (for instance, 'https://my.example/image.dzi'). See: {@link https://docs.microsoft.com/en-us/previous-versions/windows/silverlight/dotnet-windows-silverlight/cc645077(v=vs.95)?redirectedfrom=MSDN DeepZoom}
     * * **deepzoom1px** - The root tile of the image pyramid has a size = 1px. It is defined by the URL of the *.dzi* file 
     * (for instance, 'https://my.example/image.dzi'). See: {@link https://docs.microsoft.com/en-us/previous-versions/windows/silverlight/dotnet-windows-silverlight/cc645077(v=vs.95)?redirectedfrom=MSDN DeepZoom}
     * * **google** - The URL points directly to the directory containing the pyramid of images (for instance, 'https://my.example/image'). 
     * The standard does not require any configuration file, so it is mandatory to indicate in the `options` the 
     * width and height in pixels of the original image. See: {@link https://www.microimages.com/documentation/TechGuides/78googleMapsStruc.pdf Google Maps}
     * * **zoomify** - The URL indicates the location of Zoomify configuration file (for instance, 'https://my.example/image/ImageProperties.xml').
     * See: {@link http://www.zoomify.com/ZIFFileFormatSpecification.htm Zoomify}
     * * **iiif** - According to the standard, the URL is the address of a IIIF server (for instance, 'https://myiiifserver.example/').
     * See: {@link https://iipimage.sourceforge.io/ IIP Server}, {@link https://iiif.io/api/image/3.0/ IIIF }
     * * **tarzoom** and **itarzoom** - This is a custom format of the OpenLIME framework. It can be described as the TAR of a DeepZoom (all the DeepZoom image pyramid is stored in a single file).
     * It takes advantage of the fact that current web servers are able to handle partial-content HTTP requests. Tarzoom facilitates
     * the work of the server, which is not penalised by having to manage a file system with many small files. The URL is the address of the *.tzi* file 
     * (for instance, 'https://my.example/image.tzi'). Warning: tarzoom|itarzoom may not work on older web servers.
     */
    class Layout {
    	/**
    	* Creates a Layout, a container for a raster image.
        * A layout is defined by a `url` of the image and a `type`.
        * Additionally, an object literal with Layout `options` can be specified.
        * Signals are triggered when the layout is ready to be drawn or its size is modified.
    	* @param {string} url URL of the image.
     	* @param {Layout#Type} type The type of the image.
     	* @param {Object} [options] An object literal describing the layout content.
     	* @param {number} options.width The total width of the original, unsplit image. This parameter must only be specified for the 'google' layout type. 
     	* @param {number} options.height The total height of the original, unsplit image. This parameter must only be specified for the 'google' layout type.
     	* @param {string} options.suffix='jpg' The filename suffix of the tiles.
     	* @param {string} options.subdomains='abc' The ('a'|'b'|'c') *s* subdomain of a Google template URL (for instance: 'https:{s}.my.example//{z}/{x}/{y}.png').
    	*/
    	constructor(url, type, options) {

    		
    		if (type == 'image') {
    			this.init(url, type, options);
    			this.setDefaults(type);
    		} else if(type in this.types)
    			return this.types[type](url, type, options);
    		else if(type == null)
    			return;
    		else
    			throw "Layout type: " + type + " unknown, or module not loaded";
    	}

    	getTileSize() {
    		return [this.width, this.height];
    	}

    	setDefaults(type) {
    		Object.assign(this, {
    			type: type,
    			width: 0,
    			height: 0,
    			suffix: 'jpg',
    			urls: [],
    			status: null,
    			subdomains: 'abc'
    		});
    	}

    	init(url, type, options) {
    		if(options)
    			Object.assign(this, options);

    		if(typeof(url) == 'string')
    			this.setUrls([url]);
    	}

    	/** @ignore */
    	setUrls(urls) {
    		/**
    		* The event is fired when a layout is ready to be drawn(the single-resolution image is downloaded or the multi-resolution structure has been initialized).
    		* @event Layout#ready
    		*/
    		this.urls = urls;
    		this.getTileURL = (rasterid, tile) => { return this.urls[rasterid]; };
    		this.status = 'ready';
    		this.emit('ready');
    	}

    	imageUrl(url, plane) {
    		let path = url.substring(0, url.lastIndexOf('/')+1);
    		return path + plane + '.jpg';
    	}

    		/**
    	 * Gets the URL of a specific tile. The function must be implemented for each layout type supported by OpenLIME.
    	 * @param {number} id The channel id.
    	 * @param {Tile} tile The tile.
    	 */
    	 getTileURL(id, tile) {
    		throw Error("Layout not defined or ready.");
    	}

    	/**
    	 * Gets the layout bounding box.
    	 * @returns {BoundingBox} The layout bounding box.
    	 */
    	boundingBox() {
    		//if(!this.width) throw "Layout not initialized still";
    		return new BoundingBox({xLow:-this.width/2, yLow: -this.height/2, xHigh: this.width/2, yHigh: this.height/2});
    	}

    	/**
    	* Returns the coordinates of the tile (in [0, 0, w h] image coordinate system) and the texture coords associated. 
     	* @returns the tile coordinates (image coords and texture coords) 
     	*/
    	tileCoords(tile) {
    		let w = this.width;
    		let h = this.height;
    		//careful: here y is inverted due to textures not being flipped on load (Firefox fault!).
    		var tcoords = new Float32Array([0, 1,     0, 0,     1, 0,     1, 1]);

    		return { 
    			coords: new Float32Array([-w/2, -h/2, 0,  -w/2, h/2, 0,  w/2, h/2, 0,  w/2, -h/2, 0]),
    			tcoords: tcoords 
    		};
    	}

    	newTile(index) {
    		let tile = new Tile();
    		tile.index = index;
    		return tile;
    	}

    	/** returns the list of tiles required for a rendering, sorted by priority, max */
    	needed(viewport, transform, layerTransform, border, bias, tiles, maxtiles = 8) {
    		//FIXME should check if image is withing the viewport (+ border)
    		let tile = tiles.get(0) || this.newTile(0); //{ index, x, y, missing, tex: [], level };
    		tile.time = performance.now();
    		tile.priority = 10;

    		if (tile.missing === null) // || tile.missing != 0 && !this.requested[index])
    			return [tile];
    		return [];
    	}

    	/** returns the list of tiles available for a rendering */
    	available(viewport, transform, layerTransform, border, bias, tiles) {
    		//FIXME should check if image is withing the viewport (+ border)
    		let torender = {};

    		if (tiles.has(0) && tiles.get(0).missing == 0) 
    			torender[0] = tiles.get(0); //{ index: index, level: level, x: x >> d, y: y >> d, complete: true };
    		return torender;
    	}

    	getViewportBox(viewport, transform, layerT) {
    		const boxViewport = new BoundingBox({xLow:viewport.x, yLow:viewport.y, xHigh:viewport.x+viewport.dx, yHigh:viewport.y+viewport.dy});
    		return CoordinateSystem.fromViewportBoxToImageBox(boxViewport, transform, viewport, layerT, {w:this.width, h:this.height});
    	}
    }

    Layout.prototype.types = {};

    addSignals(Layout, 'ready', 'updateSize');

    /*
     * The singleton class **Cache** implements a cache for faster retrieval of the tiles required by layers.
     * @class Cache
     */
    /** @ignore */
    class _Cache {
    	/**
    	 * Instantiates a Cache object. Tiles to be fetched are stored in an ordered `queue` in {Layer}.
    	 * @param {Object} [options] An object literal with cache parameters.
    	 * @param {number} options.capacity=536870912 The total cache capacity (in bytes).
    	 * @param {number} options.maxRequest=6 Max number of concurrent HTTP requests. Most common browsers allow six connections per domain.
    	 */
    	constructor(options) {
    		Object.assign(this, {
    			capacity: 512*(1<<20),  //256 MB total capacity available
    			size: 0,                //amount of GPU ram used

    			maxRequest: 6,          //max number of concurrent HTTP requests
    			requested: 0,
    			maxPrefetch: 8*(1<<20), //max amount of prefetched tiles.
    			prefetched: 0           //amount of currently prefetched GPU ram.
    		});

    		Object.assign(this, options);
    		this.layers = [];   //map on layer.
    	}

    	/**
    	 * Determines which tiles of a given `layer` are candidates to be downloaded.
    	 * Cleans up the cache and schedules the web data fetch. 
    	 * @param {Layer} layer A layer.
    	 */
    	setCandidates(layer) {
    		if(!this.layers.includes(layer))
    			this.layers.push(layer);
    		setTimeout(() => { this.update(); }, 0); //ensure all the queues are set before updating.
    	}

    	/** @ignore */
    	update() {
    		if(this.requested > this.maxRequest)
    			return;

    		let best = this.findBestCandidate();
    		if(!best) return;
    		while(this.size > this.capacity) { //we need to make room.
    			let worst = this.findWorstTile();
    			if(!worst) {
    				console.log("BIG problem in the cache");
    				break;
    			}
    			if(worst.tile.time < best.tile.time)
    				this.dropTile(worst.layer, worst.tile);
    			else
    				return; 
    		}
    		console.assert(best != best.layer.queue[0]);
    		best.layer.queue.shift();
    		this.loadTile(best.layer, best.tile);
    	}

    	/* Finds the best tile to be downloaded */
    	/** @ignore */
    	findBestCandidate() {
    		let best = null;
    		for(let layer of this.layers) {
    			while(layer.queue.length > 0 && layer.tiles.has(layer.queue[0].index)) {
    				layer.queue.shift();
    			}
    			if(!layer.queue.length)
    				continue;
    			let tile = layer.queue[0];
    			if(!best ||
    				tile.time > best.tile.time  + 1.0 ||  //old requests ignored
    				tile.priority > best.tile.priority)
    				best = { layer, tile };
    		}
    		return best;
    	}

    	/* Finds the worst tile to be dropped */
    	/** @ignore */
    	findWorstTile() {
    		let worst = null;
    		for(let layer of this.layers) {
    			for(let tile of layer.tiles.values()) {
    				//TODO might be some are present when switching shaders.
    				if(tile.missing != 0) continue;
    				if(!worst || 
    				   tile.time < worst.tile.time || 
    				   (tile.time == worst.tile.time && tile.priority < worst.tile.priority)) {
    					worst = {layer, tile};
    				}
    			}
    		}
    		return worst;
    	}

    	/** @ignore */
    	loadTile(layer, tile) {
    		this.requested++;
    		(async () =>  { layer.loadTile(tile, (size) => { this.size += size; this.requested--; this.update(); } ); })();
    	}

    	/** @ignore */
    	dropTile(layer, tile) {
    		this.size -= tile.size;
    		layer.dropTile(tile);
    	}


    	/**
    	 * Flushes all tiles for a `layer`.
    	 * @param {Layer} layer A layer.
     	 */
    	flushLayer(layer) {
    		if(!this.layers.includes(layer))
    			return;
    		for(let tile of layer.tiles.values())
    			this.dropTile(layer, tile);
    	}
    }

    /**
     * Instantiates a Cache object. Tiles to be fetched are stored in an ordered `queue` in {Layer}.
     * @classdesc The singleton class **Cache** implements a cache for faster retrieval of the tiles required by layers.
     * @class Cache
     * @param {Object} [options] An object literal to define cache parameters.
     * @param {number} options.capacity=536870912 The total cache capacity (in bytes).
     * @param {number} options.maxRequest=6 Max number of concurrent HTTP requests. Most common browsers allow six connections per domain.
     */
    let Cache = new _Cache;

    /**
     * The Layer class is responsible for drawing slides in the OpenLIME viewer. 
     * Layers can directly draw their contents on the viewer or be combined with each other to obtain more complex visualizations.
     * OpenLIME provides a set of ready-to-use layers that allows developers to quickly publish their datasets on the web
     * or make kiosk applications. Ready-to-use layers ranging from images, to multi-channel data (such as, for example, RTI or BRDF)
     * or the combination of multiple layers or for visualization through lenses.
     * 
     * A Layer takes raster data (images) as input which are managed by the layout. A layer stores all the information
     * and functions needed to render the graphics (shaders, shader parameters, data structures, etc.), and takes care
     * of data prefetching and communication with the cache.
     * 
     * The Layer is a kind of primitive class from which other Layer classes can inherit.
     * Each derived class "registers" on the Layer base class, the user can then use an instance of 
     * Layer by indicating the chosen `type` in the `options`.
     * 
     * In the example below a Layer of type 'rti' is created, then a LayerRTI (class derived from Layer) is instantiated and added to the viewer's layer stack.
     * 
     * @example
     *      const layer1 = new OpenLIME.Layer({
     *          layout: 'deepzoom',
     *          label: 'Ancient Roman coin',
     *          type: 'rti',
     *          url: '../../assets/rti/hsh/info.json',
     *          normals: false
     *      });
     *      viewer.addLayer('coin1', layer1);
     */

    //FIXME: prefetchborder and mipmapbias should probably go into layout
    class Layer {
    	/**
    	* Creates a Layer. Additionally, an object literal with Layer `options` can be specified.
    	* Signals are triggered when the layer is ready (i.e. completely initialized) or if its state variables have been updated (a redraw is needed).
    	* @param {Object} [options]
    	* @param {(string|Layout)} options.layout='image' The layout (the format of the input raster images).
    	* @param {string} options.type A string identifier to select the specific derived layer class to instantiate.
    	* @param {string} options.id The layer unique identifier.
    	* @param {string} options.label A string with a more comprehensive definition of the layer. If it exists, it is used in the UI layer menu, otherwise the `id` value is taken.
    	* @param {Transform} options.transform The relative coords from layer to canvas.
    	* @param {bool} options.visible=true Whether to render the layer.
    	* @param {number} options.zindex Stack ordering value for the rendering of layers (higher zindex on top).
    	* @param {bool} options.overlay=false  Whether the layer must be rendered in overlay mode.
    	* @param {number} options.prefetchBorder=1 The threshold (in tile units) around the current camera position for which to prefetch tiles.
    	* @param {number} options.mipmapBias=0.4 The mipmap bias of the texture.
    	* @param {Object} options.shaders A map (shadersId, shader) of the shaders usable for the layer rendering. See @link {Shader}.
    	* @param {Controller[]} options.controllers An array of UI device controllers active on the layer.
    	* @param {Layer} options.sourceLayer The layer from which to take the tiles (in order to avoid tile duplication).
    	*/
    	constructor(options) {
    		//create from derived class if type specified
    		if (options.type) {
    			let type = options.type;
    			delete options.type;
    			if (type in this.types) {

    				return this.types[type](options);
    			}
    			throw "Layer type: " + type + "  module has not been loaded";
    		}

    		this.init(options);

    		/*
    		//create members from options.
    		this.rasters = this.rasters.map((raster) => new Raster(raster));

    		//layout needs to be the same for all rasters
    		if(this.rasters.length) {
    			if(typeof(this.layout) != 'object')
    				this.layout = new Layout(this.rasters[0].url, this.layout)
    			this.setLayout(this.layout)

    			if(this.rasters.length)
    				for(let raster in this.rasters)
    					raster.layout = this.layout;
    		}

    		if(this.shader)
    			this.shader = new Shader(this.shader);
    		*/
    	}

    	/** @ignore */
    	init(options) {
    		Object.assign(this, {
    			transform: new Transform(),
    			viewport: null,
    			debug: false,
    			visible: true,
    			zindex: 0,
    			overlay: false, //in the GUI it won't affect the visibility of the other layers
    			rasters: [],
    			layers: [],
    			controls: {},
    			controllers: [],
    			shaders: {},
    			layout: 'image',
    			shader: null, //current shader.
    			gl: null,
    			width: 0,
    			height: 0,
    			prefetchBorder: 1,
    			mipmapBias: 0.4,

    			//signals: { update: [], ready: [], updateSize: [] },  //update callbacks for a redraw, ready once layout is known.

    			//internal stuff, should not be passed as options.
    			tiles: new Map(),      //keep references to each texture (and status) indexed by level, x and y.
    			//each tile is tex: [.. one for raster ..], missing: 3 missing tex before tile is ready.
    			//only raster used by the shader will be loade.
    			queue: [],     //queue of tiles to be loaded.
    			requested: {},  //tiles requested.
    		});

    		Object.assign(this, options);
    		if (this.sourceLayer) this.tiles = this.sourceLayer.tiles; //FIXME avoid tiles duplication

    		this.transform = new Transform(this.transform);

    		if (typeof (this.layout) == 'string') {
    			let size = { width: this.width, height: this.height };
    			this.setLayout(new Layout(null, this.layout, size));
    		} else {
    			this.setLayout(this.layout);
    		}
    	}

    	setViewport(view) {
    		this.viewport = view;
    		this.emit('update');
    	}
    	addShaderFilter(f) {
    		if (!this.shader) throw "Shader not implemented";
    		this.shader.addFilter(f);
    	}

    	removeShaderFilter(name) {
    		if (!this.shader) throw "Shader not implemented";
    		this.shader.removeFilter(name);
    	}

    	clearShaderFilters() {
    		if (!this.shader) throw "Shader not implemented";
    		this.shader.clearFilters();
    	}

    	/**
    	 * Sets the state of the layer 
    	 */
    	setState(state, dt, easing = 'linear') {
    		if ('controls' in state)
    			for (const [key, v] of Object.entries(state.controls)) {
    				this.setControl(key, v, dt, easing);
    			}
    		if ('mode' in state && state.mode) {
    			this.setMode(state.mode);
    		}
    	}

    	/**
    	 * Gets the state variables of the layer.
    	 * @return {Object} An object with state variables 
    	 */
    	getState(stateMask = null) {
    		const state = {};
    		state.controls = {};
    		for (const [key, v] of Object.entries(this.controls)) {
    			if (!stateMask || ('controls' in stateMask && key in stateMask.controls))
    				state.controls[key] = v.current.value;
    		}
    		if (!stateMask || 'mode' in stateMask)
    			if (this.getMode())
    				state.mode = this.getMode();
    		return state;
    	}

    	/** @ignore */
    	setLayout(layout) {
    		/**
    		* The event is fired when a layer is initialized.
    		* @event Layer#ready
    		*/
    		/**
    		* The event is fired if a redraw is needed.
    		* @event Layer#update
    		*/
    		this.layout = layout;

    		let callback = () => {
    			this.status = 'ready';
    			this.setupTiles(); //setup expect status to be ready!

    			this.emit('ready');
    			this.emit('update');
    		};
    		if (layout.status == 'ready') //layout already initialized.
    			callback();
    		else
    			layout.addEvent('ready', callback);

    		// Set signal to acknowledge change of bbox when it is known. Let this signal go up to canvas
    		this.layout.addEvent('updateSize', () => {
    			this.shader.setTileSize(this.layout.getTileSize());
    			this.emit('updateSize');
    		});
    	}

    	// OK
    	setTransform(tx) { //FIXME
    		this.transform = tx;
    		this.emit('updateSize');
    	}

    	/**
    	 * Sets the shader to use
    	 * @param {*} id the current shader identifier (the shader must already be registered in the `shaders` array)
    	 */
    	setShader(id) {
    		if (!id in this.shaders)
    			throw "Unknown shader: " + id;
    		this.shader = this.shaders[id];
    		this.setupTiles();
    		this.shader.addEvent('update', () => { this.emit('update'); });
    	}

    	/**
    	 * Gets the current shader mode.
    	 * @returns {string} the shader mode
    	 */
    	getMode() {
    		if (this.shader)
    			return this.shader.mode;
    		return null;
    	}

    	/**
    	 * Gets an arrays of all the modes implemented in the current shader.
    	 * @returns {string[]} arrays of modes
    	 */
    	getModes() {
    		if (this.shader)
    			return this.shader.modes;
    		return [];
    	}

    	/**
    	 * Set the mode of the current shader.
    	 * @param {string} mode the mode of the current shader.
    	 */
    	setMode(mode) {
    		this.shader.setMode(mode);
    		this.emit('update');
    	}

    	/**
    	 * Sets a value that indicates whether the layer is visible.
    	 * @param {bool} visible The value.
    	 */
    	setVisible(visible) {
    		this.visible = visible;
    		this.previouslyNeeded = null;
    		this.emit('update');
    	}

    	/**
    	 * Sets the layer zindex value (stack ordering value for the rendering of layers).
    	 * @param {int} zindex The value.
    	 */
    	setZindex(zindex) {
    		this.zindex = zindex;
    		this.emit('update');
    	}

    	/**
    	 * Computes the minum scale value of the `layers`.
    	 * @param {Layer[]} layers 
    	 * @param {bool} discardHidden Whether hidden layers are not to be included in the computation.
    	 * @returns {number} the minimum scale.
    	 * @static
    	 */
    	static computeLayersMinScale(layers, discardHidden) {
    		if (layers == undefined || layers == null) {
    			console.log("ASKING SCALE INFO ON NO LAYERS");
    			return 1;
    		}
    		let layersScale = 1;
    		for (let layer of Object.values(layers)) {
    			if (!discardHidden || layer.visible) {
    				let s = layer.scale();
    				layersScale = Math.min(layersScale, s);
    			}
    		}
    		return layersScale;
    	}

    	/**
    	 * Gets the scale of the layer transformation
    	 * @returns {number} The scale
    	 */
    	scale() {
    		// FIXME: this do not consider children layers
    		return this.transform.z;
    	}

    	/**
    	 * Gets the layer bounding box (<FIXME> Change name: box is in scene coordinates)
    	 * @returns {BoundingBox} The bounding box 
    	 */
    	boundingBox() {
    		// FIXME: this do not consider children layers
    		// Take layout bbox
    		let result = this.layout.boundingBox();

    		// Apply layer transform to bbox
    		if (this.transform != null && this.transform != undefined) {
    			result = this.transform.transformBox(result);
    		}

    		return result;
    	}

    	/**
    	  * Computes the merge bounding box of all the 'layers`
    	  * @param {Layer[]} layers 
    	  * @param {bool} discardHidden Whether hidden layers are not to be included in the computation.
    	  * @returns {BoundingBox} The bounding box 
    	* @static 
    	  */
    	static computeLayersBBox(layers, discardHidden) {
    		if (layers == undefined || layers == null) {
    			console.log("ASKING BBOX INFO ON NO LAYERS");
    			let emptyBox = new BoundingBox();
    			return emptyBox;
    		}
    		let layersBbox = new BoundingBox();
    		for (let layer of Object.values(layers)) {
    			if ((!discardHidden || layer.visible) && layer.layout.width) {
    				const bbox = layer.boundingBox();
    				layersBbox.mergeBox(bbox);
    			}
    		}
    		return layersBbox;
    	}

    	/**
    	 * Gets the shader parameter control corresponding to `name`
    	 * @param {*} name The name of the control.
    	 * return {*} The control
    	 */
    	getControl(name) {
    		let control = this.controls[name] ? this.controls[name] : null;
    		if (control) {
    			let now = performance.now();
    			this.interpolateControl(control, now);
    		}
    		return control;
    	}

    	/**
    	 * Adds a new shader parameter control.
    	 * @param {string} name The name of the control.
    	 * @param {*} value The value for initialization.
    	 */
    	addControl(name, value) {
    		if (this.controls[name])
    			throw new Error(`Control "$name" already exist!`);
    		let now = performance.now();
    		this.controls[name] = { 'source': { 'value': value, 't': now }, 'target': { 'value': value, 't': now }, 'current': { 'value': value, 't': now }, 'easing': 'linear' };
    	}

    	/**
    	 * Set a shader parameter control with new value
    	 * @param {*} name The name of the control.
    	 * @param {*} value The value for initialization.
    	 * @param {time} dt Duration of the interpolation (0=no interpolation).
    	 */
    	setControl(name, value, dt, easing = 'linear') { //When are created?
    		let now = performance.now();
    		let control = this.controls[name];
    		this.interpolateControl(control, now);

    		control.source.value = [...control.current.value];
    		control.source.t = now;

    		control.target.value = [...value];
    		control.target.t = now + dt;

    		control.easing = easing;

    		this.emit('update');
    	}
    	/**
    	 * Update the current values of the parameter controls.
    	 * @returns {bool} Weather the interpolation is finished (the time has now gone).
    	 */
    	interpolateControls() {
    		let now = performance.now();
    		let done = true;
    		for (let control of Object.values(this.controls))
    			done = this.interpolateControl(control, now) && done;
    		return done;
    	}

    	/** @ignore */
    	interpolateControl(control, time) {
    		let source = control.source;
    		let target = control.target;
    		let current = control.current;

    		current.t = time;
    		if (time < source.t) {
    			current.value = [...source.value];
    			return false;
    		}

    		if (time > target.t - 0.0001) {
    			let done = current.value.every((e, i) => e === target.value[i]);
    			current.value = [...target.value];
    			return done;
    		}

    		let dt = (target.t - source.t);
    		let tt = (time - source.t) / dt;
    		switch (control.easing) {
    			case 'ease-out': tt = 1 - Math.pow(1 - tt, 2); break;
    			case 'ease-in-out': tt = tt < 0.5 ? 2 * tt * tt : 1 - Math.pow(-2 * tt + 2, 2) / 2; break;
    		}
    		let st = 1 - tt;

    		current.value = [];
    		for (let i = 0; i < source.value.length; i++)
    			current.value[i] = (st * source.value[i] + tt * target.value[i]);
    		return false;
    	}

    	/////////////
    	/// CACHE HANDLING & RENDERING

    	/** @ignore */
    	dropTile(tile) {
    		for (let i = 0; i < tile.tex.length; i++) {
    			if (tile.tex[i]) {
    				this.gl.deleteTexture(tile.tex[i]);
    			}
    		}
    		this.tiles.delete(tile.index);
    	}

    	/** @ignore */
    	clear() {
    		this.ibuffer = this.vbuffer = null;
    		Cache.flushLayer(this);
    		this.tiles = new Map(); //TODO We need to drop these tile textures before clearing Map
    		this.setupTiles();
    		this.queue = [];
    		this.previouslyNeeded = false;
    	}

    	/*
    	 * Renders the layer
    	 */
    	/** @ignore */
    	draw(transform, viewport) {
    		//exception for layout image where we still do not know the image size
    		//how linear or srgb should be specified here.
    		//		gl.pixelStorei(gl.UNPACK_COLORSPACE_CONVERSION_WEBGL, gl.NONE);
    		if (this.status != 'ready')// || this.tiles.size == 0)
    			return true;

    		if (!this.shader)
    			throw "Shader not specified!";

    		let done = this.interpolateControls();

    		let parent_viewport = viewport;
    		if(this.viewport) {
    			viewport = this.viewport;
    			this.gl.viewport(viewport.x, viewport.y, viewport.dx, viewport.dy);
    		}
    		

    		this.prepareWebGL();

    		//		find which quads to draw and in case request for them
    		let available = this.layout.available(viewport, transform, this.transform, 0, this.mipmapBias, this.tiles);

    		transform = this.transform.compose(transform);
    		let matrix = transform.projectionMatrix(viewport);
    		this.gl.uniformMatrix4fv(this.shader.matrixlocation, this.gl.FALSE, matrix);

    		this.updateAllTileBuffers(available);

    		// bind filter textures
    		let iSampler = this.shader.samplers.length;
    		for (const f of this.shader.filters) {
    			for (let i = 0; i < f.samplers.length; i++) {
    				this.gl.uniform1i(f.samplers[i].location, iSampler);
    				this.gl.activeTexture(this.gl.TEXTURE0 + iSampler);
    				this.gl.bindTexture(this.gl.TEXTURE_2D, f.samplers[i].tex);
    				iSampler++;
    			}
    		}

    		let i = 0;
    		for (let tile of Object.values(available)) {
    			//			if(tile.complete)
    			this.drawTile(tile, i);
    			++i;
    		}
    		if(this.vieport) 
    			this.gl.viewport(parent_viewport.x, parent_viewport.y, parent_viewport.dx, parent_viewport.dy);

    		return done;
    	}

    	/** @ignore */
    	drawTile(tile, index) {
    		//let tiledata = this.tiles.get(tile.index);
    		if (tile.missing != 0)
    			throw "Attempt to draw tile still missing textures"

    		//coords and texture buffers updated once for all tiles from main draw() call

    		//bind textures
    		let gl = this.gl;
    		for (var i = 0; i < this.shader.samplers.length; i++) {
    			let id = this.shader.samplers[i].id;
    			gl.uniform1i(this.shader.samplers[i].location, i);
    			gl.activeTexture(gl.TEXTURE0 + i);
    			gl.bindTexture(gl.TEXTURE_2D, tile.tex[id]);
    		}

    		// for (var i = 0; i < this.shader.samplers.length; i++) {
    		// 	let id = this.shader.samplers[i].id;
    		// 	gl.uniform1i(this.shader.samplers[i].location, i);
    		// 	gl.activeTexture(gl.TEXTURE0 + i);
    		// 	gl.bindTexture(gl.TEXTURE_2D, tile.tex[id]);
    		// } // FIXME - TO BE REMOVED?

    		const byteOffset = this.getTileByteOffset(index);
    		gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, byteOffset);
    	}

    	getTileByteOffset(index) {
    		return index * 6 * 2;
    	}

    	/* given the full pyramid of needed tiles for a certain bounding box, 
    	 *  starts from the preferred levels and goes up in the hierarchy if a tile is missing.
    	 *  complete is true if all of the 'brothers' in the hierarchy are loaded,
    	 *  drawing incomplete tiles enhance the resolution early at the cost of some overdrawing and problems with opacity.
    	 */
    	/** @ignore */
    	/*toRender(needed) {

    		let torender = {}; //array of minlevel, actual level, x, y (referred to minlevel)
    		let brothers = {};

    		let minlevel = needed.level;
    		let box = needed.pyramid[minlevel];

    		for (let y = box.yLow; y < box.yHigh; y++) {
    			for (let x = box.xLow; x < box.xHigh; x++) {
    				let level = minlevel;
    				while (level >= 0) {
    					let d = minlevel - level;
    					let index = this.layout.index(level, x >> d, y >> d);
    					if (this.tiles.has(index) && this.tiles.get(index).missing == 0) {
    						torender[index] = this.tiles.get(index); //{ index: index, level: level, x: x >> d, y: y >> d, complete: true };
    						break;
    					} else {
    						let sx = (x >> (d + 1)) << 1;
    						let sy = (y >> (d + 1)) << 1;
    						brothers[this.layout.index(level, sx, sy)] = 1;
    						brothers[this.layout.index(level, sx + 1, sy)] = 1;
    						brothers[this.layout.index(level, sx + 1, sy + 1)] = 1;
    						brothers[this.layout.index(level, sx, sy + 1)] = 1;
    					}
    					level--;
    				}
    			}
    		}
    		for (let index in brothers) {
    			if (index in torender)
    				torender[index].complete = false;
    		}
    		return torender;
    	}*/

    	/** @ignore */
    	// Update tile vertex and texture coords.
    	// Currently called by derived classes 
    	updateTileBuffers(coords, tcoords) {
    		let gl = this.gl;
    		//TODO to reduce the number of calls (probably not needed) we can join buffers, and just make one call per draw! (except the bufferData, which is per node)
    		gl.bindBuffer(gl.ARRAY_BUFFER, this.vbuffer);
    		gl.bufferData(gl.ARRAY_BUFFER, coords, gl.STATIC_DRAW);
    		//FIXME this is not needed every time.
    		gl.vertexAttribPointer(this.shader.coordattrib, 3, gl.FLOAT, false, 0, 0);
    		gl.enableVertexAttribArray(this.shader.coordattrib);

    		gl.bindBuffer(gl.ARRAY_BUFFER, this.tbuffer);
    		gl.bufferData(gl.ARRAY_BUFFER, tcoords, gl.STATIC_DRAW);

    		gl.vertexAttribPointer(this.shader.texattrib, 2, gl.FLOAT, false, 0, 0);
    		gl.enableVertexAttribArray(this.shader.texattrib);
    	}


    	/** @ignore */
    	// Update tile vertex and texture coords of all the tiles in a single VBO
    	updateAllTileBuffers(tiles) {
    		let gl = this.gl;

    		//use this.tiles instead.
    		let N = Object.values(tiles).length;
    		if (N == 0) return;

    		const szV = 12;
    		const szT = 8;
    		const szI = 6;
    		const iBuffer = new Uint16Array(szI * N);
    		const vBuffer = new Float32Array(szV * N);
    		const tBuffer = new Float32Array(szT * N);
    		let i = 0;
    		for (let tile of Object.values(tiles)) {
    			let c = this.layout.tileCoords(tile);
    			vBuffer.set(c.coords, i * szV);
    			tBuffer.set(c.tcoords, i * szT);

    			const off = i * 4;
    			tile.indexBufferByteOffset = 2 * i * szI;
    			iBuffer.set([off + 3, off + 2, off + 1, off + 3, off + 1, off + 0], i * szI);
    			++i;
    		}
    		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.ibuffer);
    		gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, iBuffer, gl.STATIC_DRAW);

    		gl.bindBuffer(gl.ARRAY_BUFFER, this.vbuffer);
    		gl.bufferData(gl.ARRAY_BUFFER, vBuffer, gl.STATIC_DRAW);

    		gl.vertexAttribPointer(this.shader.coordattrib, 3, gl.FLOAT, false, 0, 0);
    		gl.enableVertexAttribArray(this.shader.coordattrib);

    		gl.bindBuffer(gl.ARRAY_BUFFER, this.tbuffer);
    		gl.bufferData(gl.ARRAY_BUFFER, tBuffer, gl.STATIC_DRAW);

    		gl.vertexAttribPointer(this.shader.texattrib, 2, gl.FLOAT, false, 0, 0);
    		gl.enableVertexAttribArray(this.shader.texattrib);

    	}

    	/*
    	 *  If layout is ready and shader is assigned, creates or update tiles to keep track of what is missing.
    	 */
    	/** @ignore */
    	setupTiles() {
    		if (!this.shader || !this.layout || this.layout.status != 'ready')
    			return;

    		for (let tile of this.tiles) {
    			tile.missing = this.shader.samplers.length;
    			for (let sampler of this.shader.samplers) {
    				if (tile.tex[sampler.id])
    					tile.missing--;
    			}
    		}
    	}

    	/** @ignore */
    	prepareWebGL() {

    		let gl = this.gl;

    		if (!this.ibuffer) { //this part might go into another function.
    			this.ibuffer = gl.createBuffer();
    			gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.ibuffer);
    			gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array([3, 2, 1, 3, 1, 0]), gl.STATIC_DRAW);

    			this.vbuffer = gl.createBuffer();
    			gl.bindBuffer(gl.ARRAY_BUFFER, this.vbuffer);
    			gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([0, 0, 0, 0, 1, 0, 1, 1, 0, 1, 0, 0]), gl.STATIC_DRAW);

    			this.tbuffer = gl.createBuffer();
    			gl.bindBuffer(gl.ARRAY_BUFFER, this.tbuffer);
    			gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([0, 0, 0, 1, 1, 1, 1, 0]), gl.STATIC_DRAW);
    		}

    		if (this.shader.needsUpdate) {
    			this.shader.debug = this.debug;
    			this.shader.createProgram(gl);
    		}

    		gl.useProgram(this.shader.program);
    		this.shader.updateUniforms(gl);
    	}

    	/** @ignore */
    	sameNeeded(a, b) {
    		if (a.level != b.level)
    			return false;

    		for (let p of ['xLow', 'xHigh', 'yLow', 'yHigh'])
    			if (a.pyramid[a.level][p] != b.pyramid[a.level][p])
    				return false;

    		return true;
    	}

    	/** @ignore */
    	prefetch(transform, viewport) {
    		if(this.viewport)
    			viewport = this.viewport;

    		if (this.layers.length != 0) { //combine layers
    			for (let layer of this.layers)
    				layer.prefetch(transform, viewport);
    		}

    		if (this.rasters.length == 0)
    			return;

    		if (this.status != 'ready')
    			return;

    		if (typeof (this.layout) != 'object')
    			throw "AH!";

    		/*let needed = this.layout.needed(viewport, transform, this.prefetchBorder, this.mipmapBias, this.tiles);


    		this.queue = [];
    		let now = performance.now();
    		let missing = this.shader.samplers.length;


    		for(let tile of needed) {
    			if(tile.missing === null)
    				tile.missing = missing;
    			if (tile.missing != 0 && !this.requested[index])
    				tmp.push(tile);
    		} */
    		this.queue = this.layout.needed(viewport, transform, this.transform, this.prefetchBorder, this.mipmapBias, this.tiles);
    		/*		let needed = this.layout.neededBox(viewport, transform, this.prefetchBorder, this.mipmapBias);
    				if (this.previouslyNeeded && this.sameNeeded(this.previouslyNeeded, needed))
    					return;
    				this.previouslyNeeded = needed;
    		
    				this.queue = [];
    				let now = performance.now();
    				//look for needed nodes and prefetched nodes (on the pos destination
    				let missing = this.shader.samplers.length;
    		
    				for (let level = 0; level <= needed.level; level++) {
    					let box = needed.pyramid[level];
    					let tmp = [];
    					for (let y = box.yLow; y < box.yHigh; y++) {
    						for (let x = box.xLow; x < box.xHigh; x++) {
    							let index = this.layout.index(level, x, y);
    							let tile = this.tiles.get(index) || { index, x, y, missing, tex: [], level };
    							tile.time = now;
    							tile.priority = needed.level - level;
    							if (tile.missing != 0 && !this.requested[index])
    								tmp.push(tile);
    						}
    					}
    					let c = box.center();
    					//sort tiles by distance to the center TODO: check it's correct!
    					tmp.sort(function (a, b) { return Math.abs(a.x - c[0]) + Math.abs(a.y - c[1]) - Math.abs(b.x - c[0]) - Math.abs(b.y - c[1]); });
    					this.queue = this.queue.concat(tmp);
    				}*/
    		Cache.setCandidates(this);
    	}

    	/** @ignore */
    	async loadTile(tile, callback) {
    		if (this.tiles.has(tile.index))
    			throw "AAARRGGHHH double tile!";

    		if (this.requested[tile.index])
    			console.log("Warning: double request!");

    		this.tiles.set(tile.index, tile);
    		this.requested[tile.index] = true;

    		if (this.layout.type == 'itarzoom') {
    			tile.url = this.layout.getTileURL(null, tile);
    			let options = {};
    			if (tile.end)
    				options.headers = { range: `bytes=${tile.start}-${tile.end}`, 'Accept-Encoding': 'indentity' };

    			var response = await fetch(tile.url, options);
    			if (!response.ok) {
    				callback("Failed loading " + tile.url + ": " + response.statusText);
    				return;
    			}
    			let blob = await response.blob();

    			let i = 0;
    			for (let sampler of this.shader.samplers) {
    				let raster = this.rasters[sampler.id];
    				let imgblob = blob.slice(tile.offsets[i], tile.offsets[i + 1]);
    				const img = await raster.blobToImage(imgblob, this.gl);
    				let tex = raster.loadTexture(this.gl, img);
    				let size = img.width * img.height * 3;
    				tile.size += size;
    				tile.tex[sampler.id] = tex;
    				tile.w = img.width;
    				tile.h = img.height;
    				i++;
    			}
    			tile.missing = 0;
    			this.emit('update');
    			delete this.requested[tile.index];
    			if (callback) callback(tile.size);
    			return;
    		}
    		tile.missing = this.shader.samplers.length;
    		for (let sampler of this.shader.samplers) {

    			let raster = this.rasters[sampler.id];
    			tile.url = this.layout.getTileURL(sampler.id, tile);
    			const [tex, size] = await raster.loadImage(tile, this.gl); // TODO Parallelize request and url must be a parameter (implement request ques per url)
    			if (this.layout.type == "image") {
    				this.layout.width = raster.width;
    				this.layout.height = raster.height;
    				this.layout.emit('updateSize');
    			}
    			tile.size += size;
    			tile.tex[sampler.id] = tex;
    			tile.missing--;
    			if (tile.missing <= 0) {
    				this.emit('update');
    				delete this.requested[tile.index];
    				if (callback) callback(size);
    			}
    		}
    	}
    }

    Layer.prototype.types = {};
    addSignals(Layer, 'update', 'ready', 'updateSize');

    //// HELPERS

    window.structuredClone = typeof(structuredClone) == "function" ? structuredClone : function (value) { return  JSON.parse(JSON.stringify(value)); };


    /**
     * Creates the WebGL context for the `canvas`. It stores information related to the `overlay` DOM element and the `camera` of the scene.
     * Signals are triggered in case of scene modifications.
     * Additionally, an object literal with Canvas `options` can be specified.
     * @param {(element|string)} canvas DOM element or selector for a `<canvas>`.
     * @param {(element|string)} overlay DOM element or selector for overlay decorations (i.e. annotations, glyphs, etc...)
     * @param {Camera} camera  The scene's camera.
     * @param {Object} [options] An object literal.
     * @param {Object} options.layers Object specifies layers (see. {@link Layer})
     * @param {bool} options.preserveDrawingBuffer=false Whether to preserve the buffers until manually cleared or overwritten. Needed for screenshots 
     * (otherwise is just a performance penalty).
     * 
    */

    class Canvas {

    	constructor(canvas, overlay, camera, options) {
    		Object.assign(this, { 
    			canvasElement: null,
    			preserveDrawingBuffer: false, 
    			gl: null,
    			overlayElement: null,
    			camera: camera,
    			layers: {},
    			targetfps: 30,
    			fps: 0,
    			timing: [16], //records last 30 frames time from request to next draw, rolling, primed to avoid /0
    			timingLength: 5, //max number of timings.
    			overBudget: 0, //fraction of frames that took too long to render.

    			signals: {'update':[], 'updateSize':[], 'ready': []}
    		});
    		Object.assign(this, options);

    		this.init(canvas, overlay);
    			
    		for(let id in this.layers)
    			this.addLayer(id, new Layer(this.layers[id]));
    		this.camera.addEvent('update', () => this.emit('update'));
    	}

    	addRenderTiming(elapsed) {
    		this.timing.push(elapsed);
    		while(this.timing.length > this.timingLength)
    			this.timing.shift();
    		this.overBudget = this.timing.filter(t => t > 1000/this.targetfps).length/this.timingLength;
    		this.fps = 1000/(this.timing.reduce((sum, a) => sum + a, 0)/this.timing.length);
    	}

    	/*
     	* Adds a Canvas Event
     	* @param {*} event A label to identify the event.
     	* @param {*} callback The event callback function.
     	*/



    	/** @ignore */
    	init(canvas, overlay) {
    		if(!canvas)
    			throw "Missing element parameter"

    		if(typeof(canvas) == 'string') {
    			canvas = document.querySelector(canvas);
    			if(!canvas)
    				throw "Could not find dom element.";
    		}

    		if(!overlay)
    			throw "Missing element parameter"

    		if(typeof(overlay) == 'string') {
    			overlay = document.querySelector(overlay);
    			if(!overlay)
    				throw "Could not find dom element.";
    		}

    		if(!canvas.tagName)
    			throw "Element is not a DOM element"

    		if(canvas.tagName != "CANVAS")
    			throw "Element is not a canvas element";

    		this.canvasElement = canvas;
    		this.overlayElement = overlay;

    		/* test context loss */
    		/* canvas = WebGLDebugUtils.makeLostContextSimulatingCanvas(canvas);
    		canvas.loseContextInNCalls(1000); */


    		let glopt = { antialias: false, depth: false, preserveDrawingBuffer: this.preserveDrawingBuffer };
    		this.gl = this.gl || 
    			canvas.getContext("webgl2", glopt) || 
    			canvas.getContext("webgl", glopt) || 
    			canvas.getContext("experimental-webgl", glopt) ;

    		if (!this.gl)
    			throw "Could not create a WebGL context";

    		canvas.addEventListener("webglcontextlost", (event) => { console.log("Context lost."); event.preventDefault(); }, false);
    		canvas.addEventListener("webglcontextrestored", ()  => { this.restoreWebGL(); }, false);
    		document.addEventListener("visibilitychange", (event) => { if(this.gl.isContextLost()) { this.restoreWebGL(); }});
    	}

    	/**
    	 * Sets the state variables of all the system
    	 * @param {Object} state An object with state variables.
    	 * @param {number} dt The animation duration in millisecond.
    	 * @param {Easing} easing The function aimed at making the camera movement or control adjustments less severe or pronounced.
    	 */
    	setState(state, dt, easing = 'linear') {
    		if ('camera' in state) {
    			const m = state.camera;
    			this.camera.setPosition(dt, m.x, m.y, m.z, m.a, easing);
    		}
    		if ('layers' in state)
    			for (const [k, layerState] of Object.entries(state.layers))
    				if (k in this.layers) {
    					const layer = this.layers[k];
    					layer.setState(layerState, dt, easing);
    				}
    	}

    	/**
    	 * Gets the state variables of all the system as described in the stateMask
    	 * @return {Object} An object with state variables.
    	 */
    	getState(stateMask=null) {
    		let state = {};
    		if (!stateMask || stateMask.camera) {
    			let now = performance.now();
    			let m = this.camera.getCurrentTransform(now);
    			state.camera = { 'x': m.x, 'y': m.y, 'z': m.z, 'a': m.a };
    		}
    		state.layers = {};
    		for (let layer of Object.values(this.layers)) {
    			const layerMask = window.structuredClone(stateMask);
    			if (stateMask && stateMask.layers) Object.assign(layerMask, stateMask.layers[layer.id]);
    			state.layers[layer.id] = layer.getState(layerMask);
    		}
    		return state;
    	}

    	/** @ignore */
    	restoreWebGL() {
    		let glopt = { antialias: false, depth: false, preserveDrawingBuffer: this.preserveDrawingBuffer };
    		this.gl = this.gl || 
    			this.canvasElement.getContext("webgl2", glopt) || 
    			this.canvasElement.getContext("webgl", glopt) || 
    			this.canvasElement.getContext("experimental-webgl", glopt) ;

    		for(let layer of Object.values(this.layers)) {
    			layer.gl = this.gl;
    			layer.clear();
    			if(layer.shader)
    				layer.shader.restoreWebGL(this.gl);
    		}
    		this.prefetch();
    		this.emit('update');
    	}

    	/** Adds the given layer to the Canvas and connects the layer's events to it.
    	* @param {string} id A label to identify the layer.
    	* @param {Layer} layer An OpenLIME Layer object.
    	*/
    	 addLayer(id, layer) {
    		/**
    		* The event is fired if a layer is updated, added or removed.
    		* @event Canvas#update
    		*/

    		/** 
    		* The event is fired when all the layers are ready (i.e. initialized and with data ready to be displayed).
    		* @event Canvas#ready
    		*/

    		console.assert(!(id in this.layers), "Duplicated layer id");

    		layer.id = id;
    		layer.addEvent('ready', () => { 
    			if(Object.values(this.layers).every( l => l.status == 'ready'))
    				this.emit('ready');
    			this.prefetch();
    		});
    		layer.addEvent('update', () => { this.emit('update'); });
    		layer.addEvent('updateSize', () => { this.updateSize(); });
    		layer.gl = this.gl;
    		layer.canvas = this;
    		layer.overlayElement = this.overlayElement;
    		this.layers[id] = layer;
    		this.prefetch();
    	}

    	/** Remove the given layer from the Canvas
    	* @param {Layer} layer An OpenLIME Layer object.
    	* 
    	* @example
    	* let layer0 = new Layer(options);
    	* canvas.addLayer('kdmap', layer0);
    	* ...
    	* canvas.removeLayer(layer0);
    	*/
    	removeLayer(layer) {
    		layer.clear(); //order is important.

    		delete this.layers[layer.id];
    		delete Cache.layers[layer];
    		this.prefetch();
    	}

    	/** @ignore */
    	updateSize() {
    		/**
     		* The event is fired if a layout changes its size or position (the event forces the re-computation of the layer bounding boxes).
     		* @event Canvas#updateSize
     		*/
    		const discardHidden = true;
    		let sceneBBox = Layer.computeLayersBBox(this.layers, discardHidden);
    		let minScale =  Layer.computeLayersMinScale(this.layers, discardHidden);
    		
    		if (sceneBBox != null) this.camera.updateBounds(sceneBBox, minScale);
    		this.emit('updateSize');
    	}

    	/** @ignore */
    	draw(time) {
    		let gl = this.gl;
    		let view = this.camera.glViewport();
    		gl.viewport(view.x, view.y, view.dx, view.dy);

    		var b = [0, 0, 0, 0];
    		gl.clearColor(b[0], b[1], b[2], b[3], b[4]);
    		gl.clear(gl.COLOR_BUFFER_BIT);

    		gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    		gl.enable(gl.BLEND);

    		//TODO: getCurren shoudl redurn {position, done}
    		let pos = this.camera.getGlCurrentTransform(time);
    		//todo we could actually prefetch toward the future a little bit
    		this.prefetch(pos);

    		//pos layers using zindex.
    		let ordered = Object.values(this.layers).sort( (a, b) => a.zindex - b.zindex);

    		//NOTICE: camera(pos) must be relative to the WHOLE canvas
    		let done = true;
    		for(let layer of ordered) {
    			if(layer.visible)
    				done = layer.draw(pos, view) && done;
    		}

    		//TODO not really an elegant solution to tell if we have reached the target, the check should be in getCurrentTransform.
    		return done && pos.t >= this.camera.target.t;
    	}

    	/*
     	* This function have each layer to check which tiles are needed and schedule them for download.
     	* @param {object} transform is the camera position (layer will combine with local transform).
     	*/
    	/** @ignore */
    	prefetch(transform) {
    		if(!transform)
    			transform = this.camera.getGlCurrentTransform(performance.now());
    		for(let id in this.layers) {
    			let layer = this.layers[id];
    			//console.log(layer);
    			//console.log(layer.layout.status);
    			if(layer.visible && layer.status == 'ready') {
    				layer.prefetch(transform, this.camera.glViewport());
    			}
    		}
    	}
    }

    addSignals(Canvas, 'update', 'updateSize', 'ready');

    class Spline {
    	constructor(xs, ys) {
    		this.xs = xs;
    		this.ys = ys;
    		this.ks = this.getNaturalKs(new Float64Array(this.xs.length));
    	}

    	getNaturalKs(ks) {
    		const n = this.xs.length - 1;
    		const A = Spline.zerosMat(n + 1, n + 2);
    		for (let i = 1; i < n; i++ // rows
    		) {
    			A[i][i - 1] = 1 / (this.xs[i] - this.xs[i - 1]);
    			A[i][i] =
    				2 *
    				(1 / (this.xs[i] - this.xs[i - 1]) + 1 / (this.xs[i + 1] - this.xs[i]));
    			A[i][i + 1] = 1 / (this.xs[i + 1] - this.xs[i]);
    			A[i][n + 1] =
    				3 *
    				((this.ys[i] - this.ys[i - 1]) /
    					((this.xs[i] - this.xs[i - 1]) * (this.xs[i] - this.xs[i - 1])) +
    					(this.ys[i + 1] - this.ys[i]) /
    					((this.xs[i + 1] - this.xs[i]) * (this.xs[i + 1] - this.xs[i])));
    		}
    		A[0][0] = 2 / (this.xs[1] - this.xs[0]);
    		A[0][1] = 1 / (this.xs[1] - this.xs[0]);
    		A[0][n + 1] =
    			(3 * (this.ys[1] - this.ys[0])) /
    			((this.xs[1] - this.xs[0]) * (this.xs[1] - this.xs[0]));
    		A[n][n - 1] = 1 / (this.xs[n] - this.xs[n - 1]);
    		A[n][n] = 2 / (this.xs[n] - this.xs[n - 1]);
    		A[n][n + 1] =
    			(3 * (this.ys[n] - this.ys[n - 1])) /
    			((this.xs[n] - this.xs[n - 1]) * (this.xs[n] - this.xs[n - 1]));
    		return Spline.solve(A, ks);
    	}
    	/**
    	 * inspired by https://stackoverflow.com/a/40850313/4417327
    	 */
    	getIndexBefore(target) {
    		let low = 0;
    		let high = this.xs.length;
    		let mid = 0;
    		while (low < high) {
    			mid = Math.floor((low + high) / 2);
    			if (this.xs[mid] < target && mid !== low) {
    				low = mid;
    			}
    			else if (this.xs[mid] >= target && mid !== high) {
    				high = mid;
    			}
    			else {
    				high = low;
    			}
    		}
    		if (low === this.xs.length - 1) {
    			return this.xs.length - 1;
    		}
    		return low + 1;
    	}
    	at(x) {
    		let i = this.getIndexBefore(x);
    		const t = (x - this.xs[i - 1]) / (this.xs[i] - this.xs[i - 1]);
    		const a = this.ks[i - 1] * (this.xs[i] - this.xs[i - 1]) -
    			(this.ys[i] - this.ys[i - 1]);
    		const b = -this.ks[i] * (this.xs[i] - this.xs[i - 1]) +
    			(this.ys[i] - this.ys[i - 1]);
    		const q = (1 - t) * this.ys[i - 1] +
    			t * this.ys[i] +
    			t * (1 - t) * (a * (1 - t) + b * t);
    		return q;
    	}

    	// Utilities 

    	static solve(A, ks) {
    		const m = A.length;
    		let h = 0;
    		let k = 0;
    		while (h < m && k <= m) {
    			let i_max = 0;
    			let max = -Infinity;
    			for (let i = h; i < m; i++) {
    				const v = Math.abs(A[i][k]);
    				if (v > max) {
    					i_max = i;
    					max = v;
    				}
    			}
    			if (A[i_max][k] === 0) {
    				k++;
    			}
    			else {
    				Spline.swapRows(A, h, i_max);
    				for (let i = h + 1; i < m; i++) {
    					const f = A[i][k] / A[h][k];
    					A[i][k] = 0;
    					for (let j = k + 1; j <= m; j++)
    						A[i][j] -= A[h][j] * f;
    				}
    				h++;
    				k++;
    			}
    		}
    		for (let i = m - 1; i >= 0; i-- // rows = columns
    		) {
    			var v = 0;
    			if (A[i][i]) {
    				v = A[i][m] / A[i][i];
    			}
    			ks[i] = v;
    			for (let j = i - 1; j >= 0; j-- // rows
    			) {
    				A[j][m] -= A[j][i] * v;
    				A[j][i] = 0;
    			}
    		}
    		return ks;
    	}

    	static zerosMat(r, c) {
    		const A = [];
    		for (let i = 0; i < r; i++)
    			A.push(new Float64Array(c));
    		return A;
    	}

    	static swapRows(m, k, l) {
    		let p = m[k];
    		m[k] = m[l];
    		m[l] = p;
    	}
    }



    class Color {
    	constructor(r, g = undefined, b = undefined, a = undefined) {
    		if (typeof (r) == 'string') {
    			if (/^#([A-Fa-f0-9]{3}){1,2}$/.test(r)) {
    				let c = r.substring(1).split('');
    				if (c.length == 3) {
    					c = [c[0], c[0], c[1], c[1], c[2], c[2]];
    				}
    				c = '0x' + c.join('') + 'FF';
    				r = Color.normalizedRGBA(c >> 24);
    				g = Color.normalizedRGBA(c >> 16);
    				b = Color.normalizedRGBA(c >> 8);
    				a = Color.normalizedRGBA(c);
    			} else if (/^#([A-Fa-f0-9]{4}){1,2}$/.test(r)) {
    				let c = r.substring(1).split('');
    				c = '0x' + c.join('');
    				r = Color.normalizedRGBA(c >> 24);
    				g = Color.normalizedRGBA(c >> 16);
    				b = Color.normalizedRGBA(c >> 8);
    				a = Color.normalizedRGBA(c);
    			} else if (/^rgb\(/.test(r)) {
    				let c = r.split("(")[1].split(")")[0];
    				c = c.split(',');
    				r = Color.clamp(c[0] / 255);
    				g = Color.clamp(c[1] / 255);
    				b = Color.clamp(c[2] / 255);
    				a = 1.0;
    			} else if (/^rgba\(/.test(r)) {
    				let c = r.split("(")[1].split(")")[0];
    				c = c.split(',');
    				r = Color.clamp(c[0] / 255);
    				g = Color.clamp(c[1] / 255);
    				b = Color.clamp(c[2] / 255);
    				a = Color.clamp(c[3] / 255);
    			} else {
    				throw Error("Value is not a color");
    			}
    		}
    		this.r = r;
    		this.g = g;
    		this.b = b;
    		this.a = a;
    	}

    	static clamp = (num, min = 0.0, max = 1.0) => Math.min(Math.max(num, min), max);

    	static hex(c) {
    		var hex = c.toString(16).toUpperCase();
    		return hex.length == 1 ? "0" + hex : hex;
    	}

    	static normalizedRGBA(c) {
    		return Color.clamp((c & 255) / 255);
    	}

    	static rgbToHex(r, g, b) {
    		const rgb = b | (g << 8) | (r << 16);
    		return '#' + ((0x1000000 | rgb).toString(16).substring(1)).toUpperCase();
    	}

    	static rgbToHexa(r, g, b, a) {
    		return '#' + Color.hex(r) + Color.hex(g) + Color.hex(b) + Color.hex(a);
    	}

    	value() {
    		return [this.r, this.g, this.b, this.a];
    	}

    	toRGB() {
    		const rgb = [this.r * 255, this.g * 255, this.b * 255];
    		rgb.forEach((e, idx, arr) => {
    			arr[idx] = Color.clamp(Math.round(e), 0, 255);
    		});
    		return rgb;
    	}

    	toHex() {
    		const rgb = this.toRGB();
    		return Color.rgbToHex(rgb[0], rgb[1], rgb[2]);
    	}

    	toHexa() {
    		const rgba = this.toRGBA();
    		return Color.rgbToHexa(rgba[0], rgba[1], rgba[2], rgba[3]);
    	}

    	toRGBA() {
    		const rgba = [this.r * 255, this.g * 255, this.b * 255, this.a * 255];
    		rgba.forEach((e, idx, arr) => {
    			arr[idx] = Color.clamp(Math.round(e), 0, 255);
    		});
    		return rgba;
    	}
    }

    class Colormap {
    	constructor(colors = [new Color(0, 0, 0, 1), new Color(1, 1, 1, 1)], options = '') {
    		options = Object.assign({
    			domain: [0.0, 1.0],
    			lowColor: null,
    			highColor: null,
    			description: '',
    			type: 'linear'
    		}, options);
    		Object.assign(this, options);
    		const nval = colors.length;

    		if (!this.lowColor) this.lowColor = colors[0];
    		if (!this.highColor) this.highColor = colors[nval - 1];

    		const nd = this.domain.length;
    		if (nval < 2 && nd != 2 && this.nval != nd && this.domain[nd - 1] <= this.domain[0]) {
    			throw Error("Colormap colors/domain bad format");
    		}

    		const delta = (this.domain[nd - 1] - this.domain[0]) / (nval - 1);
    		this.xarr = [];
    		this.rarr = [];
    		this.garr = [];
    		this.barr = [];
    		this.aarr = [];
    		for (let i = 0; i < nval; i++) {
    			if (nd == 2)
    				this.xarr.push(this.domain[0] + i * delta);
    			else
    				this.xarr.push(this.domain[i]);
    			this.rarr.push(colors[i].r);
    			this.garr.push(colors[i].g);
    			this.barr.push(colors[i].b);
    			this.aarr.push(colors[i].a);
    		}
    		this.rspline = new Spline(this.xarr, this.rarr);
    		this.gspline = new Spline(this.xarr, this.garr);
    		this.bspline = new Spline(this.xarr, this.barr);
    		this.aspline = new Spline(this.xarr, this.aarr);
    	}

    	static clamp = (num, min, max) => Math.min(Math.max(num, min), max);

    	rangeDomain() {
    		return [this.domain[0], this.domain[this.domain.length - 1]];
    	}

    	bar(x) {
    		if (x < this.xarr[0]) return this.lowColor;
    		if (x > this.xarr[this.xarr.length - 1]) return this.highColor;
    		const c = new Color(this.rarr[0], this.garr[0], this.barr[0], this.aarr[0]);
    		for (let i = 0; i < this.xarr.length - 1; i++) {
    			if (x > this.xarr[i] && x <= this.xarr[i + 1]) {
    				c.r = this.rarr[i];
    				c.g = this.garr[i];
    				c.b = this.barr[i];
    				c.a = this.aarr[i];
    			}
    		}
    		return c;
    	}

    	linear(x) {
    		if (x < this.xarr[0]) return this.lowColor;
    		if (x > this.xarr[this.xarr.length - 1]) return this.highColor;
    		const c = new Color(this.rarr[0], this.garr[0], this.barr[0], this.aarr[0]);
    		for (let i = 0; i < this.xarr.length - 1; i++) {
    			if (x > this.xarr[i] && x <= this.xarr[i + 1]) {
    				c.r = (this.rarr[i + 1] - this.rarr[i]) * (x - this.xarr[i]) / (this.xarr[i + 1] - this.xarr[i]) + this.rarr[i];
    				c.g = (this.garr[i + 1] - this.garr[i]) * (x - this.xarr[i]) / (this.xarr[i + 1] - this.xarr[i]) + this.garr[i];
    				c.b = (this.barr[i + 1] - this.barr[i]) * (x - this.xarr[i]) / (this.xarr[i + 1] - this.xarr[i]) + this.barr[i];
    				c.a = (this.aarr[i + 1] - this.aarr[i]) * (x - this.xarr[i]) / (this.xarr[i + 1] - this.xarr[i]) + this.aarr[i];
    			}
    		}
    		return c;
    	}

    	spline(x) {
    		if (x < this.xarr[0]) return this.lowColor;
    		if (x > this.xarr[this.xarr.length - 1]) return this.highColor;
    		return new Color(this.rspline.at(x), this.gspline.at(x), this.bspline.at(x), this.aspline.at(x));
    	}

    	at(x) {
    		let result = null;
    		switch (this.type) {
    			case 'linear':
    				result = this.linear(x);
    				break;
    			case 'spline':
    				result = this.spline(x);
    				break;
    			case 'bar':
    				result = this.bar(x);
    				break;
    			default:
    				throw Error("Interpolant type not exist");
    		}
    		return result;
    	}

    	/** Precision as parameter for future dev */
    	sample(maxSteps) {
    		let min = this.xarr[0];
    		let max = this.xarr[this.xarr.length - 1];
    		//if (this.domain.length == 2) maxSteps = this.xarr.length;
    		let buffer = new Uint8Array(maxSteps * 4);
    		let delta = (max - min) / maxSteps;
    		for (let i = 0; i < maxSteps; i++) {
    			let c = this.at(min + i * delta).toRGBA();
    			buffer[i * 4 + 0] = c[0];
    			buffer[i * 4 + 1] = c[1];
    			buffer[i * 4 + 2] = c[2];
    			buffer[i * 4 + 3] = c[3];
    		}
    		return { min, max, buffer };
    	}
    }

    class ColormapLegend {
    	constructor(viewer, colorscale, options) {
    		options = Object.assign({
    			nticks: 6,
    			legendWidth: 25,
    			textColor: '#fff',
    			class: 'openlime-legend'
    		}, options);
    		Object.assign(this, options);
    		this.viewer = viewer;
    		this.colorscale = colorscale;

    		this.container = document.querySelector(`.${this.class}`);
    		if (!this.container) {
    			this.container = document.createElement('div');
    			this.container.classList.add(this.class);
    		}

    		this.scale = document.createElement('div');
    		this.scale.style = `display: flex; border-radius: 20px; height: 22px; color: ${this.textColor}; 
		font-weight: bold; overflow: hidden; margin: 0px 2px 4px 0px; background-color: #7c7c7c; 
		font-family: Arial,Helvetica,sans-serif; font-size:12px;
		border: 1px solid #000;`;
    		this.container.appendChild(this.scale);
    		this.viewer.containerElement.appendChild(this.container);

    		const domain = colorscale.rangeDomain();
    		const legend = document.createElement('div');
    		legend.style = `display: flex; align-items: center; justify-content: center; 
		background: ${colorscale.linear(domain[0]).toHex()}; width: ${this.legendWidth}%; margin: 0`;
    		legend.textContent = colorscale.description;
    		this.scale.appendChild(legend);

    		if(this.colorscale.type == 'linear') this.legendLinear();
    		if(this.colorscale.type == 'bar') this.legendBar();
    	}

    	legendLinear() {
    		const domain = this.colorscale.rangeDomain();
    		const delta = (domain[1] - domain[0]) / this.nticks;
    		const deltaWidth = (100 - this.legendWidth) / this.nticks;
    		let vl = domain[0];
    		for (let i = 0; i < this.nticks; i++) {
    			let v = domain[0] + delta * i;
    			let vr = i < (this.nticks - 1) ? domain[0] + delta * (i + 0.5) : v;
    			const c = this.colorscale.at(v);
    			const cl = this.colorscale.at(vl);
    			const cr = this.colorscale.at(vr);
    			const value = document.createElement('div');
    			const bkg = `background: linear-gradient(to right, ${cl.toHex()}, ${c.toHex()}, ${cr.toHex()})`;
    			value.style = `display: flex; align-items: center; justify-content: center; 
			${bkg};	width: ${deltaWidth}%; margin: 0`;
    			value.textContent = v.toFixed(1);
    			this.scale.appendChild(value);
    			vl = vr;
    		}
    	}

    	legendBar() {
    		const deltaWidth = (100 - this.legendWidth) / this.colorscale.domain.length;
    		for (let i=0 ; i<this.colorscale.xarr.length; i++) {
    			const c = new Color(this.colorscale.rarr[i], this.colorscale.garr[i], this.colorscale.barr[i], this.colorscale.aarr[i]);
    			const v = this.colorscale.xarr[i];
    			const value = document.createElement('div');
    			const bkg = `background: ${c.toHex()}`;
    			value.style = `display: flex; align-items: center; justify-content: center; 
			${bkg};	width: ${deltaWidth}%; margin: 0`;
    			value.textContent = v.toFixed(1);
    			this.scale.appendChild(value);
    		}
    	}

    }

    /**
     * An Raster Format describes the way that the images in textures and renderbuffers store their data.
     * * 'vec3' format must be specified if the image is RGB (without alpha).
     * * 'vec4' is related to RGBA images.
     * * 'float' is for file containg coefficients.
     * @typedef {('vec3'|'vec4'|'float')} Raster#Format
     */

    /**
     * Raster is a provider of image and/or plane of coefficients.
     * It support all file formats supported by {@link Layout}.
     * 
     * An object literal with Raster `options` can be specified.
     *  * @param {Object} [options] An object literal describing the raster content.
     * @param {Raster#Format} options.format='vec3' The color format of the image.
     */

    class Raster {

    	constructor(options) {

    		Object.assign(this, { 
    			format: 'vec3', 
    		 });

    		Object.assign(this, options);
    	}

    	/**
    	 * Gets a tile.
    	 * @param {Tile} tile A tile.
    	 * @param {WebGLRenderingContext} gl The WebGL rendering context .
    	 * @returns {'[tex, size]'} A pair (tex,size).
    	 */
    	async loadImage(tile, gl) {
    		let img;
    		let cors = (new URL(tile.url, window.location.href)).origin !== window.location.origin;
    		if (tile.end || typeof createImageBitmap == 'undefined') {
    			let options = {};
    			options.headers = { range: `bytes=${tile.start}-${tile.end}`, 'Accept-Encoding': 'indentity', mode: cors? 'cors' : 'same-origin' };
    			let response = await fetch(tile.url, options);
    			if (!response.ok) {
    				callback("Failed loading " + tile.url + ": " + response.statusText);
    				return;
    			}

    			if (response.status != 206)
    				throw "The server doesn't support partial content requests (206).";

    			let blob = await response.blob();
    			img = await this.blobToImage(blob, gl);
    		} else {
    			img = document.createElement('img');
    			if (cors) img.crossOrigin="";
    			img.onerror = function (e) { console.log("Texture loading error!"); };
    			img.src = tile.url;
    			await new Promise((resolve, reject) => { 
    				img.onload = () => { resolve(); }; });
    		}
    		let tex = this.loadTexture(gl, img);
    		//TODO 3 is not accurate for type of image, when changing from rgb to grayscale, fix this value.
    		let size = img.width * img.height * 3;
    		return [tex, size];	
    	}

    	/** @ignore */
    	async blobToImage(blob, gl) {
    		let img;
    		if(typeof createImageBitmap != 'undefined') {
    			var isFirefox = typeof InstallTrigger !== 'undefined';
    			//firefox does not support options for this call, BUT the image is automatically flipped.
    			if(isFirefox)
    				img = await createImageBitmap(blob); 
    			else
    				img = await createImageBitmap(blob, { imageOrientation1: 'flipY' });

    		} else { //fallback for IOS
    			let urlCreator = window.URL || window.webkitURL;
    			img = document.createElement('img');
    			img.onerror = function(e) { console.log("Texture loading error!"); };
    			img.src = urlCreator.createObjectURL(blob);

    			await new Promise((resolve, reject) => { img.onload = () => resolve(); });
    			urlCreator.revokeObjectURL(img.src);
    			
    		}
    		return img;		
    	}

    	/** @ignore */
    	loadTexture(gl, img) {
    		this.width = img.width;  //this will be useful for layout image.
    		this.height = img.height;

    		var tex = gl.createTexture();
    		gl.bindTexture(gl.TEXTURE_2D, tex);
    		gl.texParameterf(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    		gl.texParameterf(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); //_MIPMAP_LINEAR);
    		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    		let glFormat = gl.RGBA;
    		switch(this.format) {
    			case 'vec3':
    				glFormat = gl.RGB;
    				break;
    			case 'vec4':
    				glFormat = gl.RGBA;
    				break;
    			case 'float':
    				glFormat = gl.LUMINANCE;
    				break;
    		} 
    		gl.texImage2D(gl.TEXTURE_2D, 0, glFormat, glFormat, gl.UNSIGNED_BYTE, img);
    		return tex;
    	}
    }

    /**
     * A reference to a 2D texture.
     * @typedef {Object} Shader#Sampler
     * @property {number} id A sampler unique identifier.
     * @property {string} name The sampler name (the texture reference name in the shader program).
     * @property {string} label used for menu
     * @property {array} samplers array of rasters {id:, type: } color, normals, etc.	 * *samplers*: array of rasters {id:, type: } color, normals, etc.
     *         bind: false will not used in preparegl
     *         load: false will not be loaded from raster
     *         both options are used in neural where the coefficients are loaded, but used by tf
     * @property {array} uniforms: 
     *         type = <vec4|vec3|vec2|float|int>, 
     *         needsUpdate controls when updated in gl, 
     *         size is unused, 
     *         value is and array or a float, 	 
     *         we also want to support interpolation: source (value is the target), start, end are the timing (same as camera interpolation)
     */

    /**
     * The `Shader` class allows shader programs to be linked and used.
     * This class supports shader programs written in the OpenGL/ES Shading Language (GLSL/ES) with 2.0 amd 3.0 specifications.
     * 
     * The `Shader` class keeps the programmer away from the details of compiling and linking vertex and fragment shaders.
     * The following example creates a fragment shader program using the supplied source code. Once compiled and linked, 
     * the shader program is activated in the current WebGLContext.
     * ```
     * const shader = new OpenLIME.Shader({
     *      'label': 'Rgb',
     *      'samplers': [{ id: 0, name: 'kd' }]
     * });
     * // The fragment shader script
     * shader.fragShaderSrc = function (gl) {
     *      let gl2 = !(gl instanceof WebGLRenderingContext);
     *      let str = `${gl2 ? '#version 300 es' : ''}
     *      precision highp float;
     *      precision highp int;
     *
     *      uniform sampler2D kd;
     *      uniform float u_colorFactor;
     *      ...
     *
     *      return str;
     * };
     * // Declares a uniform.
     * shader.uniforms = {
     *      u_colorFactor: { type: 'float', needsUpdate: true, size: 1, value: 0.0 },
     * };
     * // Adds the shader to the Layer and set it as the current one.
     * this.shaders['bw'] = shader;
     * this.setShader('bw');
     * ```
     */
    class Shader {
    	/** 
    	* Instantiates a Shader class. An object literal with Shader `options` can be specified.
    	* @param {Object} [options] An object literal describing the shader content.
    	* @param {Array<Shader#Sampler>} options.samplers An array of pointers to 2D textures. 
    	* @param {Array<string>} options.modes An optional array of labels that identify different shader behaviors.
    	*/
    	constructor(options) {
    		Object.assign(this, {
    			version: 100,   //check for webglversion. 
    			debug: false,
    			samplers: [],
    			uniforms: {},
    			label: null,
    			program: null,      //webgl program
    			modes: [],
    			mode: null, // The current mode
    			needsUpdate: true,
    			tileSize: [0, 0]
    		});
    		addSignals(Shader, 'update');
    		Object.assign(this, options);
    		this.filters = [];
    	}

    	clearFilters() {
    		this.filters = [];
    		this.needsUpdate = true;
    		this.emit('update');
    	}

    	addFilter(f) {
    		f.shader = this;
    		this.filters.push(f);
    		this.needsUpdate = true;
    		f.needsUpdate = true;
    		this.emit('update');
    	}

    	removeFilter(name) {
    		this.filters = this.filters.filter((v) => {
    			return v.name != name;
    		});
    		this.needsUpdate = true;
    		this.emit('update');
    	}

    	/**
    	 * Sets the current mode of the shader
    	 * @param {string} mode The mode identifier
    	 */
    	setMode(mode) {
    		if (this.modes.indexOf(mode) == -1)
    			throw Error("Unknown mode: " + mode);
    		this.mode = mode;
    		this.needsUpdate = true;
    	}

    	/** @ignore */
    	restoreWebGL(gl) {
    		this.createProgram(gl);
    	}

    	setTileSize(sz) {
    		this.tileSize = sz;
    		this.needsUpdate = true;
    	}

    	/**
    	 * Sets the value of a uniform variable.
    	 * @param {string} name The name of the uniform variable.
    	 * @param {*} value The value to assign.
    	 */
    	setUniform(name, value) {
    		/**
    		* The event is fired when a uniform shader variable is changed.
    		* @event Camera#update
    		*/
    		let u = this.getUniform(name);
    		if (!u)
    			throw new Error(`Unknown '${name}'. It is not a registered uniform.`);
    		if ((typeof (value) == "number" || typeof (value) == "boolean") && u.value == value)
    			return;
    		if (Array.isArray(value) && Array.isArray(u.value) && value.length == u.value.length) {
    			let equal = true;
    			for (let i = 0; i < value.length; i++)
    				if (value[i] != u.value[i]) {
    					equal = false;
    					break;
    				}
    			if (equal)
    				return;
    		}

    		u.value = value;
    		u.needsUpdate = true;
    		this.emit('update');
    	}

    	completeFragShaderSrc(gl) {
    		let gl2 = !(gl instanceof WebGLRenderingContext);

    		let src = `${gl2 ? '#version 300 es' : ''}\n`;
    		src += `precision highp float;\n`;
    		src += `precision highp int;\n`;
    		src += `const vec2 tileSize = vec2(${this.tileSize[0]}.0, ${this.tileSize[1]}.0);\n`;
    		src += this.fragShaderSrc() + '\n';

    		for (let f of this.filters) {
    			src += `		// Filter: ${f.name}\n`;
    			src += f.fragModeSrc() + '\n';
    			src += f.fragSamplerSrc() + '\n';
    			src += f.fragUniformSrc() + '\n';
    			src += f.fragDataSrc() + '\n\n';
    		}

    		src += `
		${gl2 ? 'out' : ''} vec4 color;
		void main() { 
			color = data();
			`;
    		for (let f of this.filters) {
    			src += `color=${f.functionName()}(color);\n`;
    		}
    		src += `${gl2 ? '' : 'gl_FragColor = color;'}
		}`;
    		return src;
    	}

    	/** @ignore */
    	createProgram(gl) {

    		let vert = gl.createShader(gl.VERTEX_SHADER);
    		gl.shaderSource(vert, this.vertShaderSrc(gl));

    		gl.compileShader(vert);
    		let compiled = gl.getShaderParameter(vert, gl.COMPILE_STATUS);
    		if (!compiled) {
    			Util.printSrcCode(this.vertShaderSrc(gl));
    			console.log(gl.getShaderInfoLog(vert));
    			throw Error("Failed vertex shader compilation: see console log and ask for support.");
    		} else if (this.debug) {
    			Util.printSrcCode(this.vertShaderSrc(gl));
    		}

    		let frag = gl.createShader(gl.FRAGMENT_SHADER);
    		gl.shaderSource(frag, this.completeFragShaderSrc(gl));
    		gl.compileShader(frag);

    		if (this.program)
    			gl.deleteProgram(this.program);

    		let program = gl.createProgram();

    		gl.getShaderParameter(frag, gl.COMPILE_STATUS);
    		compiled = gl.getShaderParameter(frag, gl.COMPILE_STATUS);
    		if (!compiled) {
    			Util.printSrcCode(this.completeFragShaderSrc(gl));
    			console.log(gl.getShaderInfoLog(frag));
    			throw Error("Failed fragment shader compilation: see console log and ask for support.");
    		} else if (this.debug) {
    			Util.printSrcCode(this.completeFragShaderSrc(gl));
    		}
    		gl.attachShader(program, vert);
    		gl.attachShader(program, frag);
    		gl.linkProgram(program);

    		if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    			var info = gl.getProgramInfoLog(program);
    			throw new Error('Could not compile WebGL program. \n\n' + info);
    		}

    		//sampler units;
    		for (let sampler of this.samplers)
    			sampler.location = gl.getUniformLocation(program, sampler.name);

    		// filter samplers
    		for (let f of this.filters)
    			for (let sampler of f.samplers)
    				sampler.location = gl.getUniformLocation(program, sampler.name);

    		this.coordattrib = gl.getAttribLocation(program, "a_position");
    		gl.vertexAttribPointer(this.coordattrib, 3, gl.FLOAT, false, 0, 0);
    		gl.enableVertexAttribArray(this.coordattrib);

    		this.texattrib = gl.getAttribLocation(program, "a_texcoord");
    		gl.vertexAttribPointer(this.texattrib, 2, gl.FLOAT, false, 0, 0);
    		gl.enableVertexAttribArray(this.texattrib);

    		this.matrixlocation = gl.getUniformLocation(program, "u_matrix");

    		this.program = program;
    		this.needsUpdate = false;

    		for (let uniform of Object.values(this.allUniforms())) {
    			uniform.location = null;
    			uniform.needsUpdate = true;
    		}

    		for (let f of this.filters)
    			f.prepare(gl);

    	}

    	getUniform(name) {
    		let u = this.uniforms[name];
    		if (u) return u;
    		for (let f of this.filters) {
    			u = f.uniforms[name];
    			if (u) return u;
    		}
    		return u;
    	}

    	allUniforms() {
    		const result = this.uniforms;
    		for (let f of this.filters) {
    			Object.assign(result, f.uniforms);
    		}
    		return result;
    	}

    	/** @ignore */
    	updateUniforms(gl) {
    		for (const [name, uniform] of Object.entries(this.allUniforms())) {
    			if (!uniform.location)
    				uniform.location = gl.getUniformLocation(this.program, name);

    			if (!uniform.location)  //uniform not used in program
    				continue;

    			if (uniform.needsUpdate) {
    				let value = uniform.value;
    				switch (uniform.type) {
    					case 'vec4' : gl.uniform4fv(uniform.location, value); break;
    					case 'vec3' : gl.uniform3fv(uniform.location, value); break;
    					case 'vec2' : gl.uniform2fv(uniform.location, value); break;
    					case 'float': gl.uniform1f(uniform.location, value); break;
    					case 'int'  : gl.uniform1i(uniform.location, value); break;
    					case 'bool' : gl.uniform1i(uniform.location, value); break;
    					case 'mat3' : gl.uniformMatrix3fv(uniform.location, false, value); break;
    					case 'mat4' : gl.uniformMatrix4fv(uniform.location, false, value); break;
    					default: throw Error('Unknown uniform type: ' + u.type);
    				}
    				uniform.needsUpdate = false;
    			}
    		}
    	}

    	/**
    	 * Gets the vertex shader script. By default it only applies the view matrix and passes the texture coordinates to the fragment shader.
    	 * @param {*} gl Thegl context.
    	 * @returns {string} The vertex shader script.
    	 */
    	vertShaderSrc(gl) {
    		let gl2 = !(gl instanceof WebGLRenderingContext);
    		return `${gl2 ? '#version 300 es' : ''}

precision highp float; 
precision highp int; 

uniform mat4 u_matrix;
${gl2 ? 'in' : 'attribute'} vec4 a_position;
${gl2 ? 'in' : 'attribute'} vec2 a_texcoord;

${gl2 ? 'out' : 'varying'} vec2 v_texcoord;

			void main() {
				gl_Position = u_matrix * a_position;
				v_texcoord = a_texcoord;
			} `;
    	}

    	/**
    	 * Gets the fragment shader script. This is a virtual function and MUST be redefined in derived classes.
    	 * @param {*} gl Thegl context.
    	 * @returns {string} The vertex shader script.
    	 */


    	fragShaderSrc(gl) {
    		let gl2 = !(gl instanceof WebGLRenderingContext);
    		let str = `

uniform sampler2D kd;

${gl2? 'in' : 'varying'} vec2 v_texcoord;

vec4 data() {
	return texture${gl2?'':'2D'}(kd, v_texcoord);
}
`;
    		return str;
    	}
    }

    /**
     * The class LayerImage is derived from Layer and it is responsible for the rendering of simple images.
     * 
     * @example
     * // Create an image layer and add it to the canvans
     * const layer = new OpenLIME.Layer({
     *     layout: 'image',
     *     type: 'image',
     *     url: '../../assets/lime/image/lime.jpg'
     * });
     * lime.addLayer('Base', layer);
     */
    class LayerImage extends Layer {
    	/**
     	* Displays a simple image.
     	* An object literal with Layer `options` can be specified.
    	* The class LayerImage can also be instantiated via the Layer parent class and `options.type='image'`.
     	*
    	  Extends {@link Layer}.
     	* @param {Object} options an object literal with Layer options {@link Layer}, but `options.url` and `options.layout` are required.
     	* @param {string} options.url The URL of the image
     	* @param {(string|Layout)} options.layout='image' The layout (the format of the input raster images).
     	*/
    	constructor(options) {	
    		super(options);

    		if(Object.keys(this.rasters).length != 0)
    			throw "Rasters options should be empty!";

    		if (this.url)
    			this.layout.setUrls([this.url]);
    		else if (this.layout.urls.length == 0)
    			throw "Missing options.url parameter";	

    		const rasterFormat = this.format != null ? this.format : 'vec4';
    		let raster = new Raster({ format: rasterFormat }); //FIXME select format for GEO stuff

    		this.rasters.push(raster);
    		

    		let shader = new Shader({
    			'label': 'Rgb',
    			'samplers': [{ id:0, name:'kd', type: rasterFormat }]
    		});
    		
    		this.shaders = {'standard': shader };
    		this.setShader('standard');
    	}
    }

    Layer.prototype.types['image'] = (options) => { return new LayerImage(options); };

    /**
     * Combines other layers (in the framebuffer) using a custom shader. {@link LayerLens} is an example.
     * The class LayerImage can also be instantiated via the Layer parent class and `options.type='combiner'`.
     * 
     * Extends {@link Layer}.
     * @param {options} options Same as {@link Layer}, but `options.layers` are required
     * @example
     * // Instantiate the LayerCombiner class and set the two inputs (layer0 and layer1)
     * const combiner = new OpenLIME.Layer({
     *     type: 'combiner',
     *     visible: true,
     *     layers: [layer0, layer1]
     * });
     * 
     * // Instantiate the ShaderCombiner class (a custom shader) and select 'diff' as default mode (for visualization purposes)
     * const shader = new OpenLIME.ShaderCombiner();
     * shader.mode = 'diff';
     *
     * // Assign the newly created shader to the combiner (labelling it 'standard') and enable it
     * combiner.shaders = { 'standard': shader };
     * combiner.setShader('standard');
     *
     * // Add the combiner to the canvas
     * lime.addLayer('combiner', combiner);
     */
    class LayerCombiner extends Layer {
    	constructor(options) {
    		super(options);

    		if(Object.keys(this.rasters).length != 0)
    			throw "Rasters options should be empty!";

    /*		let shader = new ShaderCombiner({
    			'label': 'Combiner',
    			'samplers': [{ id:0, name:'source1', type:'vec3' }, { id:1, name:'source2', type:'vec3' }],
    		});

    		this.shaders = {'standard': shader };
    		this.setShader('standard'); */

    //todo if layers check for importjson

    		this.textures = [];
    		this.framebuffers = [];
    		this.status = 'ready';
    	}

    	/** @ignore */
    	draw(transform, viewport) {
    		for(let layer of this.layers)
    			if(layer.status != 'ready')
    				return;

    		if(!this.shader)
    			throw "Shader not specified!";

    		let w = viewport.dx;
    		let h = viewport.dy;

    		if(!this.framebuffers.length || this.layout.width != w || this.layout.height != h) {
    			this.deleteFramebuffers();
    			this.layout.width = w;
    			this.layout.height = h;
    			this.createFramebuffers();
    		}

    		let gl = this.gl;
    		var b = [0, 0, 0, 0];
    		gl.clearColor(b[0], b[1], b[2], b[3]);

    //TODO optimize: render to texture ONLY if some parameters change!
    //provider di textures... max memory and reference counting.

    		for(let i = 0; i < this.layers.length; i++) { 
    			gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffers[i]);
    			gl.clear(gl.COLOR_BUFFER_BIT);
    			this.layers[i].draw(transform, {x:0, y:0, dx:w, dy:h, w:w, h:h});
    			gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    		}

    		this.prepareWebGL();

    		for(let i = 0; i < this.layers.length; i++) {
    			gl.uniform1i(this.shader.samplers[i].location, i);
    			gl.activeTexture(gl.TEXTURE0 + i);
    			gl.bindTexture(gl.TEXTURE_2D, this.textures[i]);
    		}

    		this.updateTileBuffers(
    			new Float32Array([-1, -1, 0,  -1, 1, 0,  1, 1, 0,  1, -1, 0]), 
    			new Float32Array([ 0,  0,      0, 1,     1, 1,     1,  0]));
    		gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT,0);
    	}

    	/** @ignore */
    	createFramebuffers() {
    		let gl = this.gl;
    		for(let i = 0; i < this.layers.length; i++) {
    			//TODO for thing like lens, we might want to create SMALLER textures for some layers.
    			const texture = gl.createTexture();

    			gl.bindTexture(gl.TEXTURE_2D, texture);

    			const level = 0;
    			const internalFormat = gl.RGBA;
    			const border = 0;
    			const format = gl.RGBA;
    			const type = gl.UNSIGNED_BYTE;
    			gl.texImage2D(gl.TEXTURE_2D, level, internalFormat,
    				this.layout.width, this.layout.height, border, format, type, null);

    			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    			const framebuffer = gl.createFramebuffer();
    			gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
    			gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
    			gl.bindFramebuffer(gl.FRAMEBUFFER, null);

    			this.textures[i] = texture;
    			this.framebuffers[i] = framebuffer;
    		}
    	}

    	//TODO release textures and framebuffers
    	/** @ignore */
    	deleteFramebuffers() {
    	}

    	/** @ignore */
    	boundingBox() {
    		// Combiner ask the combination of all its children boxes
    		// keeping the hidden, because they could be hidden, but revealed by the combiner
    		const discardHidden = false;
    		let result = Layer.computeLayersBBox(this.layers, discardHidden);
    		if (this.transform != null && this.transform != undefined) {
    			result = this.transform.transformBox(result);
    		}
    		return result;
    	}
    	
    	/** @ignore */
    	scale() {
    		//Combiner ask the scale of all its children
    		//keeping the hidden, because they could be hidden, but revealed by the combiner
    		const discardHidden = false;
    		let scale = Layer.computeLayersMinScale(this.layers, discardHidden);
    		scale *= this.transform.z;
    		return scale;
    	}
    }

    Layer.prototype.types['combiner'] = (options) => { return new LayerCombiner(options); };

    /** 
     * An annotation is a decoration (text, graphics element, glyph) to be drawn in an overlay mode on the canvas.
     * Its purpose is to provide additional information useful for the interpretation of the underlying drawings. 
     * This calls defines the content of an annotation which is represented by its unique identifier and additional 
     * information (such as description, annotation category or class, drawing style, labels, etc.).
     */
    class Annotation {
    	/**
    	 * Instantiates an **Annotation** object. An object literal with Annotation `options` can be specified.
    	 * Note that the developer is free to define additional elements characterizing a custom annotation by adding new options to the constructor.
    	 * @param {Object} [options] An object literal with Annotation options (freely adjustable).
    	 * @param {string} options.label A string containing an annotation label.
    	 * @param {string} option.description A HTML text containg a comprehensive description of the annotation.
    	 * @param {string} option.class A class or category to cluster annotations.
    	 * @param {Object} option.state=null An object literal with state variables.
    	 */
    	constructor(options) {
    		Object.assign(
    			this, 
    			{
    				id: Annotation.UUID(),
    				code: null,
    				label: null,
    				description: null,
    				class: null,
    				target: null,
    				svg: null,
    				image: null,
    				region: null,
    				data: {},
    				style: null,
    				bbox: null,
    				visible: true,
    				state: null,
    				ready: false, //already: converted to svg
    				needsUpdate: true,
    				editing: false,
    			}, 
    			options);
    			//TODO label as null is problematic, sort this issue.
    			if(!this.label) this.label = ''; 
    			this.elements = []; //assign options is not recursive!!!
    	}

    	/** @ignore */
    	static UUID() {
    		return 'axxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    			var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    			return v.toString(16);
    		});
    	}

    	/**
    	 * Gets the bounding box of the annotation.
    	 * Note that the coordinates for annotations are always relative to the top left corner of the canvas.
    	 * @returns {BoundingBox} The bounding box
    	 */
    	getBBoxFromElements() {
    		let box = null;
    		if(!this.elements.length) {
    			if (this.region == null) {
    				box = new BoundingBox();
    			} else {
    				const r = this.region;
    				box = new BoundingBox({xLow: r.x, yLow: r.y, xHigh: r.x+r.w, yHigh: r.y+r.h});
    			}
    		} else {
    			let { x, y, width, height } = this.elements[0].getBBox();
    			for(let shape of this.elements) {
    					const { sx, sy, swidth, sheight } = shape.getBBox();
    					x = Math.min(x, sx);
    					y = Math.min(x, sy);
    					width = Math.max(width + x, sx + swidth) - x; 
    					height = Math.max(height + y, sy + sheight) - y; 
    			}
    			box = new BoundingBox({xLow: x, yLow: y, xHigh: x+width, yHigh: y+width});
    		}
    		return box;
    	}

    	/////////////////////////////////
    	/* The class also provides functions for importing and exporting from and to files in JSON format. */
    	/*
    	 * Copies an entry of a JSON file into an **Annotation** object.
    	 * @param {string} entry A JSON string representing an annotation.
    	 * @returns {Annotation} The annotation.
    	 */
    	/** @ignore */
    	static fromJsonLd(entry) {
    		if(entry.type != 'Annotation')
    			throw "Not a jsonld annotation.";
    		let options = {id: entry.id};

    		let rename = { 'identifying': 'code', 'identifying': 'label', 'describing': 'description', 'classifying':'class' };
    		for(let item of entry.body) {
    			let field = rename[item.purpose];
    			if(field)
    				options[field] = item.value;
    		}
    		let selector = entry.target && entry.target.selector;
    		if(selector) {
    			switch(selector.type) {
    			case 'SvgSelector':
    				options.svg = selector.value;
    				options.elements = [];
    				break;
    			default:
    				throw "Unsupported selector: " + selector.type;
    			}
    		}
    		return new Annotation(options);
    	}
    	/*
    	 * Exports an Annotation to a JSON entry
    	 */
    	/** @ignore */
    	toJsonLd() {
    		let body = [];
    		if(this.code !== null)
    			body.push( { type: 'TextualBody', value: this.code, purpose: 'indentifying' });
    		if(this.class !== null)
    			body.push( { type: 'TextualBody', value: this.class, purpose: 'classifying' });
    		if(this.description !== null)
    			body.push( { type: 'TextualBody', value: this.description, purpose: 'describing' });

    		({
    			"@context": "http://www.w3.org/ns/anno.jsonld",
    			id: this.id,
    			type: "Annotation",
    			body: body,
    			target: { selector: {} }
    		});
    		if(this.target)
    			target.selector.source = this.target;


    		if(this.element) {
    			var s = new XMLSerializer();
    			s.serializeToString(this.element);
    		}
    	}
    }

    /**
     * An annotation layer is a layer used to display decorations (text, graphics elements, glyphs, etc...) on top of other layers.
     * Its purpose is to provide additional information useful for the interpretation of the underlying layers.
     * An object literal with `options` can be specified.
     * 
     * Here you will find a tutorial to learn how to build a client-server architecture to manage annotations in OpenLIME. //FIXME
     * 
     * Extends {@link Layer}.
     */
    class LayerAnnotation extends Layer { //FIXME CustomData Object template {name: { label: defaultValue: type:number,enum,string,boolean min: max: enum:[] }}
    	/**
    	 * Instantiates a LayerAnnotation object.
    	 * @param {Object} [options] An object literal with options that inherits from {@link Layer}.
    	 * @param {string} options.style Properties to style annotations.
     	 * @param {(string|Array)} options.annotations The URL of the annotation data (JSON file or HTTP GET Request to an annotation server) or an array of annotations.
    	 */
    	constructor(options) {
    		options = Object.assign({
    			// geometry: null,  //unused, might want to store here the quads/shapes for opengl rendering
    			style: null,    //straightforward for svg annotations, to be defined or opengl rendering
    			annotations: [],
    			selected: new Set,
    			overlay: true,
    			annotationsListEntry: null, //TODO: horrible name for the interface list of annotations
    		}, options);
    		super(options);

    		if (typeof (this.annotations) == "string") { //assumes it is an URL
    			(async () => { await this.loadAnnotations(this.annotations); })();
    		}
    	}

    	/** @ignore */
    	async loadAnnotations(url) {
    		const headers = new Headers();
    		headers.append('pragma', 'no-cache');
    		headers.append('cache-control', 'no-cache');
    		var response = await fetch(url, {
    			method: 'GET',
    			headers: headers,
    	  	});
    		if(!response.ok) {
    			this.status = "Failed loading " + this.url + ": " + response.statusText;
    			return;
    		}
    		this.annotations = await response.json();
    		if(this.annotations.status == 'error') {
    			alert("Failed to load annotations: " + this.annotations.msg);
    			return;
    		}
    		//this.annotations = this.annotations.map(a => '@context' in a ? Annotation.fromJsonLd(a): a);
    		this.annotations = this.annotations.map(a => new Annotation(a));
    		for(let a of this.annotations)
    			if(a.publish != 1)
    				a.visible = false;
    		//this.annotations.sort((a, b) => a.label.localeCompare(b.label));
    		if(this.annotationsListEntry)
    			this.createAnnotationsList();
    		
    		this.emit('update');
    		this.emit('ready');
    		this.emit('loaded');
    	}

    	/** @ignore */
    	newAnnotation(annotation) {
    		if(!annotation)
    			annotation = new Annotation();

    		this.annotations.push(annotation);
    		let html = this.createAnnotationEntry(annotation);
    		let template = document.createElement('template');
    		template.innerHTML = html.trim();
    		
    		let list =  this.annotationsListEntry.element.parentElement.querySelector('.openlime-list');
    		list.appendChild(template.content.firstChild);
    		
    		this.clearSelected();
    		//this.setSelected(annotation);
    		return annotation;
    	}

    	/** @ignore */
    	annotationsEntry() {
    		return this.annotationsListEntry =  {
    			html: '',
    			list: [], //will be filled later.
    			classes: 'openlime-annotations',
    			status: () => 'active',
    			oncreate: () => { 
    				if(Array.isArray(this.annotations))
    					this.createAnnotationsList();
    			}
    		}
    	}

    	/** @ignore */
    	createAnnotationsList() {
    		let html ='';
    		for(let a of this.annotations) {
    			html += this.createAnnotationEntry(a);
    		}

    		let list =  this.annotationsListEntry.element.parentElement.querySelector('.openlime-list');
    		list.innerHTML = html;
    		list.addEventListener('click', (e) =>  { 
    			let svg = e.srcElement.closest('svg');
    			if(svg) {
    				let entry = svg.closest('[data-annotation]');
    				entry.classList.toggle('hidden');
    				let id = entry.getAttribute('data-annotation');
    				let anno = this.getAnnotationById(id);
    				anno.visible = !anno.visible;
    				anno.needsUpdate = true;
    				this.emit('update');
    			}

    			let id = e.srcElement.getAttribute('data-annotation');
    			if(id) {
    				this.clearSelected();
    				let anno = this.getAnnotationById(id);
    				this.setSelected(anno, true);
    			}
    		});
    	}

    	/** @ignore */
    	createAnnotationEntry(a) {
    		return `<a href="#" data-annotation="${a.id}" class="openlime-entry ${a.visible == 0? 'hidden':''}">${a.label || ''}
			<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="openlime-eye"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
			<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="openlime-eye-off"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
			</a>`;
    	}

    	/**
    	 * Gets an annotation by its `id`
    	 * @param {string} id 
    	 * @returns {Annotation} The annotation.
    	 */
    	getAnnotationById(id) {
    		for(const anno of this.annotations)
    			if(anno.id == id)
    				return anno;
    		return null;
    	}

    	/** @ignore */
    	clearSelected() {
    		this.annotationsListEntry.element.parentElement.querySelectorAll(`[data-annotation]`).forEach((e) => e.classList.remove('selected'));
    		this.selected.clear();
    	}

    	/**
    	 * Selects/deselects an annotation
    	 * @param {Annotation} anno The annotation.
    	 * @param {bool} on=true Whether to select the annotation.
    	 */
    	setSelected(anno, on = true) {
    		this.annotationsListEntry.element.parentElement.querySelector(`[data-annotation="${anno.id}"]`).classList.toggle('selected', on);
    		if(on)
    			this.selected.add(anno.id);
    		else
    			this.selected.delete(anno.id);
    		this.emit('selected', anno);
    	}
    }

    addSignals(LayerAnnotation, 'selected', 'loaded');

    class LayoutTileImages extends Layout {
        
        constructor(url, type, options) {
    		super(url, null, options);
    		this.setDefaults(type);
            this.init(url, type, options);

    		// Contain array of records with at least visible,region,image (url of the image). 
    		// Can be also a pointer to annotation array set from outside with setTileDescriptors()
            this.tileDescriptors = []; 
    		this.box = new BoundingBox();
    		
    		if (url != null) {
    			// Read data from annotation file
    			this.loadDescriptors(url);
    		}
    	}

    	getTileSize() {
    		return [0, 0];
    	}

    	async loadDescriptors(url) {
    		// Load tile descriptors from annotation file
    		let response = await fetch(url);
    		if(!response.ok) {
    			this.status = "Failed loading " + url + ": " + response.statusText;
    			return;
    		}
    		this.tileDescriptors = await response.json();
    		if(this.tileDescriptors.status == 'error') {
    			alert("Failed to load annotations: " + this.tileDescriptors.msg);
    			return;
    		}
    		//this.annotations = this.annotations.map(a => '@context' in a ? Annotation.fromJsonLd(a): a);
    		this.tileDescriptors = this.tileDescriptors.map(a => new Annotation(a));
    		for(let a of this.tileDescriptors) {
    			if(a.publish != 1)
    				a.visible = false;
    		}
    		this.computeBoundingBox();
    		this.emit('updateSize');

    		if (this.path == null) {
    			this.setPathFromUrl(url);
    		}

    		this.status = 'ready';
    		this.emit('ready');
    	}
    	    /**
    	 * Gets the layout bounding box.
    	 * @returns {BoundingBox} The layout bounding box.
    	 */
    	computeBoundingBox() {
    		this.box = new BoundingBox();
    		for(let a of this.tileDescriptors) {
    			let r = a.region;
    			let b = new BoundingBox( { xLow:r.x, yLow: r.y, xHigh: r.x + r.w, yHigh: r.y + r.h});
    			this.box.mergeBox(b);
    		}
    	}

    	boundingBox() {
    		return this.box;
    	}

    	setPathFromUrl(url) {
    		// Assume annotations in dir of annotation.json + /annot/
    		const myArray = url.split("/");
    		const N = myArray.length;
    		this.path="";
    		for(let i = 0; i < N-1; ++i) {
    			this.path += myArray[i] + "/";
    		}
    		this.getTileURL = (id, tile) => {		
    			const url = this.path + '/' + this.tileDescriptors[tile.index].image;
    			return url;
    		};
    		//this.path += "/annot/";
    	}

        setTileDescriptors(tileDescriptors) {
            this.tileDescriptors = tileDescriptors;
    		
    		this.status = 'ready';
    		this.emit('ready');
        }

    	/**
    	 * Gets the URL of a specific tile. The function must be implemented for each layout type supported by OpenLIME.
    	 * @param {number} id The channel id.
    	 * @param {Tile} tile The tile.
    	 */
    	getTileURL(id, tile) {
    		const url = this.path + '/' + this.tileDescriptors[id].image;
    		return url;
    	}

    	setTileVisible(index, visible) {
    		this.tileDescriptors[index].visible = visible;
    	}

    	setAllTilesVisible(visible) {
    		const N = this.tileCount();

    		for(let i = 0; i < N; ++i) {
    			this.tileDescriptors[i].visible = visible;
    		}
    	}

        index(level, x, y) {
            // Map x to index (flat list)
            return x;
    	}
        
        tileCoords(tile) {
    		const r = this.tileDescriptors[tile.index].region;
            const x0 = r.x;
            const y0 = r.y;
            const x1 = x0 + r.w;
            const y1 = y0 + r.h;

    		return { 
    			coords: new Float32Array([x0, y0, 0,  x0, y1, 0,  x1, y1, 0,  x1, y0, 0]),

                //careful: here y is inverted due to textures not being flipped on load (Firefox fault!).
    			tcoords: new Float32Array([0, 1,      0, 0,       1, 0,        1, 1])
    		};
    	}

        needed(viewport, transform, layerTransform, border, bias, tiles, maxtiles = 8) {
    		//look for needed nodes and prefetched nodes (on the pos destination
    		const box = this.getViewportBox(viewport, transform, layerTransform);

    		let needed = [];
    		let now = performance.now();

    		// Linear scan of all the potential tiles
    		const N = this.tileCount();
    		const flipY = true;
    		for (let x = 0; x < N; x++) {
    			let index = this.index(0, x, 0);
    			let tile = tiles.get(index) || this.newTile(index); 

    			if (this.intersects(box, index, flipY)) {
    				tile.time = now;
    				tile.priority = this.tileDescriptors[index].visible ? 10 : 1;
    				if (tile.missing === null) 
    					needed.push(tile);
    			}
    		}
    		let c = box.center();
    		//sort tiles by distance to the center TODO: check it's correct!
    		needed.sort(function (a, b) { return Math.abs(a.x - c[0]) + Math.abs(a.y - c[1]) - Math.abs(b.x - c[0]) - Math.abs(b.y - c[1]); });

    		return needed;
        }

    	/** returns the list of tiles available for a rendering */
    	available(viewport, transform, layerTransform, border, bias, tiles) {
    		//find box in image coordinates where (0, 0) is in the upper left corner.
    		const box = this.getViewportBox(viewport, transform, layerTransform);
    	
    		let torender = [];

    		// Linear scan of all the potential tiles
    		const N = this.tileCount();
    		const flipY = true;
    		for (let x = 0; x < N; x++) {
    			let index = this.index(0, x, 0);

    			if (this.tileDescriptors[index].visible && this.intersects(box, index, flipY)) {
    				if (tiles.has(index)) {
    					let tile = tiles.get(index); 
    					if (tile.missing == 0) {
    						torender[index] = tile;
    					}
    				}
    			}
    		}

    		return torender;
    	}

    	newTile(index) {
    		let tile = new Tile();
    		tile.index = index;

    		let descriptor = this.tileDescriptors[index];
    		tile.image = descriptor.image;		
    		Object.assign(tile, descriptor.region);
    		return tile;
    	}
    	
    	intersects(box, index, flipY = true) {
    		const r = this.tileDescriptors[index].region;
    		const xLow = r.x;
            const yLow = r.y;
            const xHigh = xLow + r.w;
            const yHigh = yLow + r.h;
    		const boxYLow = flipY ? -box.yHigh : box.yLow;
    		const boxYHigh = flipY ? -box.yLow : box.yHigh;
    		
    		return xLow < box.xHigh  && yLow < boxYHigh && xHigh > box.xLow && yHigh > boxYLow;
    	}



    	tileCount() {
    		return this.tileDescriptors.length;
    	}

    }

    Layout.prototype.types['tile_images'] = (url, type, options) => { return new LayoutTileImages(url, type, options); };

    /**
     * Class which extend LayerAnnotation. Support Image Annotations.
     * Each annotation corresponds to a tile (currently single resolution)
     */

    class LayerAnnotationImage extends LayerAnnotation {
        constructor(options) {
            const url = options.url;
            if (options.path == null) {
                console.log("WARNING MISSING ANNOTATION PATH, SET TO ./annot/");
            }
            super(options);
            const rasterFormat = this.format != null ? this.format : 'vec4';

            let initCallback = () => {
                // Set Annotation Urls path
                if (options.path) {
                    this.layout.path = options.path;
                } else if (url != null) {
                    // Extract path from annotation.json path
                    this.layout.setPathFromUrl(path);
                }

                for (let a of this.annotations) {
                    let raster = new Raster({ format: rasterFormat });
                    this.rasters.push(raster);
                }
                console.log("Set " + this.annotations.length + " annotations into layout");
                this.setupShader(rasterFormat);
                this.layout.setTileDescriptors(this.annotations);
            };
            this.addEvent('loaded', initCallback);
        }

        length() {
            return this.annotations.length;
        }

        setTileVisible(index, visible) {
            this.layout.setTileVisible(index, visible);
            //this.annotations[index].needsUpdate = true;
            //this.emit('update');
        }

        setAllTilesVisible(visible) {
            this.layout.setAllTilesVisible(visible);
            // for(let a of this.annotations) {
            //     a.needsUpdate = true;
            // }
            //this.emit('update');
        }

        drawTile(tile, index) {
            if (tile.missing != 0)
                throw "Attempt to draw tile still missing textures"

            const idx = tile.index;

            //coords and texture buffers updated once for all tiles from main draw() call

            //bind texture of this tile only (each tile corresponds to an image)
            let gl = this.gl;
            let id = this.shader.samplers[idx].id;
            gl.uniform1i(this.shader.samplers[idx].location, idx);
            gl.activeTexture(gl.TEXTURE0 + idx);
            gl.bindTexture(gl.TEXTURE_2D, tile.tex[id]);

            const byteOffset = this.getTileByteOffset(index);
            gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, byteOffset);
        }

        setupShader(rasterFormat) {
            let samplers = [];
            let N = this.rasters.length;
            for (let i = 0; i < N; ++i) {
                samplers.push({ id: i, name: 'kd', type: rasterFormat });
            }
            let shader = new Shader({
                'label': 'Rgb',
                'samplers': samplers //[{ id:0, name:'kd', type: rasterFormat }]
            });

            shader.fragShaderSrc = function (gl) {

                let gl2 = !(gl instanceof WebGLRenderingContext);
                let str = `

uniform sampler2D kd;

${gl2 ? 'in' : 'varying'} vec2 v_texcoord;

vec4 data() {
	return texture${gl2 ? '' : '2D'}(kd, v_texcoord);
}
`;
                return str;

            };

            this.shaders = { 'standard': shader };
            this.setShader('standard');
        }

    }

    Layer.prototype.types['annotation_image'] = (options) => { return new LayerAnnotationImage(options); };

    class LayerMaskedImage extends Layer {
    	constructor(options) {
    		super(options);

    		if (Object.keys(this.rasters).length != 0)
    			throw "Rasters options should be empty!";

    		if (this.url) {
    			this.layout.setUrls([this.url]);
    		} else if (this.layout.urls.length == 0)
    			throw "Missing options.url parameter";

    		const rasterFormat = this.format != null ? this.format : 'vec4';
    		let raster = new Raster({ format: rasterFormat }); //FIXME select format for GEO stuff

    		this.rasters.push(raster);

    		let shader = new Shader({
    			'label': 'Rgb',
    			'samplers': [{ id: 0, name: 'kd', type: rasterFormat }]
    		});

    		shader.fragShaderSrc = function (gl) {

    			let gl2 = !(gl instanceof WebGLRenderingContext);
    			let str = `
		
		uniform sampler2D kd;

		${gl2 ? 'in' : 'varying'} vec2 v_texcoord;

		vec2 bilinear_masked_scalar(sampler2D field, vec2 uv) {
			vec2 px = uv*tileSize;
			ivec2 iuv = ivec2(floor( px ));
			vec2 fuv = fract(px);
			int i0 = iuv.x;
			int j0 = iuv.y;
			int i1 = i0+1>=int(tileSize.x) ? i0 : i0+1;
			int j1 = j0+1>=int(tileSize.y) ? j0 : j0+1;
		  
			float f00 = texelFetch(field, ivec2(i0, j0), 0).r;
			float f10 = texelFetch(field, ivec2(i1, j0), 0).r;
			float f01 = texelFetch(field, ivec2(i0, j1), 0).r;
			float f11 = texelFetch(field, ivec2(i1, j1), 0).r;

			// FIXME Compute weights of valid
		  
			vec2 result_masked_scalar;
			result_masked_scalar.y = f00*f01*f10*f11;
			result_masked_scalar.y = result_masked_scalar.y > 0.0 ? 1.0 : 0.0;

			const float scale = 255.0/254.0;
			const float bias  = -1.0/254.0;
			result_masked_scalar.x = mix(mix(f00, f10, fuv.x), mix(f01, f11, fuv.x), fuv.y);
			result_masked_scalar.x = result_masked_scalar.y * (scale * result_masked_scalar.x + bias);		  
			return result_masked_scalar;
		  }
		  
		  vec4 data() { 
			vec2  masked_scalar = bilinear_masked_scalar(kd, v_texcoord);
			return masked_scalar.y > 0.0 ?  vec4(masked_scalar.x, masked_scalar.x, masked_scalar.x, masked_scalar.y) :  vec4(1.0, 0.0, 0.0, masked_scalar.y);
		  }
		`;
    			return str;

    		};

    		this.shaders = { 'scalarimage': shader };
    		this.setShader('scalarimage');

    		this.rasters[0].loadTexture = this.loadTexture.bind(this);
    		//this.layout.setUrls([this.url]);
    	}


    	draw(transform, viewport) {
    		return super.draw(transform, viewport);
    	}


    	loadTexture(gl, img) {
    		this.rasters[0].width = img.width;
    		this.rasters[0].height = img.height;

    		var tex = gl.createTexture();
    		gl.bindTexture(gl.TEXTURE_2D, tex);
    		gl.texParameterf(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    		gl.texParameterf(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST); //_MIPMAP_LINEAR);
    		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    		// gl.texImage2D(gl.TEXTURE_2D, 0, gl.R16UI, gl.R16UI, gl.UNSIGNED_SHORT, img);
    		gl.texImage2D(gl.TEXTURE_2D, 0, gl.LUMINANCE, gl.LUMINANCE, gl.UNSIGNED_BYTE, img);
    		return tex;
    	}
    }

    Layer.prototype.types['maskedimage'] = (options) => { return new LayerMaskedImage(options); };

    // Tile level x y  index ----- tex missing() start/end (tarzoom) ----- time, priority size(byte)

    /**
     * A tile represents a single element of a regular grid that subdivides an image.
     * A tile is identified by its position (`x`, `y`) within the grid and the zoom `level` of the image.
     * @typedef {Object} Tile
     * @property {number} level The zoom level of the tile.
     * @property {number} x x position of the tile in the grid.
     * @property {number} y y position of the tile in the grid.
     * @property {number} index Unique tile identifier.
     * @property {number} start The position of the first byte of the tile in the image dataset (used only for tarzoom and itarzoom image formats).
     * @property {number} end The position of the last byte of the tile in the image dataset (used only for tarzoom and itarzoom image formats).
     * @property {number} missing In the case of multi-channel formats (RTI, BRDF), the information content of a tile is distributed over several planes (channels). 
     * `missing` represents the number of pending channel data requests.
     * @property {Array} tex A array of WebGLTexture (one texture per channel).
     * @property {time} time Tile creation time (this value is used internally by the cache algorithms).
     * @property {number} priority The priority of the tile (this value is used internally by the cache algorithms).
     * @property {number} size The total size of the tile in bytes (this value is used internally by the cache algorithms).
     */

    /**
    * The type of the image. All web single-resolution image types (*jpg*, *png*, *gif*, etc...) are supported
    * as well as the most common multi-resolution image formats (*deepzoom*, *zoomify*, *IIIF*, *google maps*).
    * @typedef {('image'|'deepzoom'|'deepzoom1px'|'google'|'zoomify'|'iiif'|'tarzoom'|'itarzoom')} Layout#Type
    */

    /**
     * The Layout class is responsible for specifying the data formats (images) managed by OpenLIME.
     * All web single-resolution image types (*jpg*, *png*, *gif*, etc...) are supported as well as the most common 
     * tiled image formats (*deepzoom*, *zoomify*, *IIIF*, *google maps*), which are suitable for large images.
     * #### Single-resolution images
     * The URL is the address of the file (for instance, 'https://my.example/image.jpg').
     * #### Tiled images
     * They can be specified in a variety of ways depending on the format chosen.
     * * **deepzoom** - The root tile of the image pyramid has a size > 1px (typical value is 254px). It is defined by the URL of the *.dzi* file 
     * (for instance, 'https://my.example/image.dzi'). See: {@link https://docs.microsoft.com/en-us/previous-versions/windows/silverlight/dotnet-windows-silverlight/cc645077(v=vs.95)?redirectedfrom=MSDN DeepZoom}
     * * **deepzoom1px** - The root tile of the image pyramid has a size = 1px. It is defined by the URL of the *.dzi* file 
     * (for instance, 'https://my.example/image.dzi'). See: {@link https://docs.microsoft.com/en-us/previous-versions/windows/silverlight/dotnet-windows-silverlight/cc645077(v=vs.95)?redirectedfrom=MSDN DeepZoom}
     * * **google** - The URL points directly to the directory containing the pyramid of images (for instance, 'https://my.example/image'). 
     * The standard does not require any configuration file, so it is mandatory to indicate in the `options` the 
     * width and height in pixels of the original image. See: {@link https://www.microimages.com/documentation/TechGuides/78googleMapsStruc.pdf Google Maps}
     * * **zoomify** - The URL indicates the location of Zoomify configuration file (for instance, 'https://my.example/image/ImageProperties.xml').
     * See: {@link http://www.zoomify.com/ZIFFileFormatSpecification.htm Zoomify}
     * * **iiif** - According to the standard, the URL is the address of a IIIF server (for instance, 'https://myiiifserver.example/').
     * See: {@link https://iipimage.sourceforge.io/ IIP Server}, {@link https://iiif.io/api/image/3.0/ IIIF }
     * * **tarzoom** and **itarzoom** - This is a custom format of the OpenLIME framework. It can be described as the TAR of a DeepZoom (all the DeepZoom image pyramid is stored in a single file).
     * It takes advantage of the fact that current web servers are able to handle partial-content HTTP requests. Tarzoom facilitates
     * the work of the server, which is not penalised by having to manage a file system with many small files. The URL is the address of the *.tzi* file 
     * (for instance, 'https://my.example/image.tzi'). Warning: tarzoom|itarzoom may not work on older web servers.
     */
    class LayoutTiles extends Layout {
    	/**
    	* Creates a Layout, a container for a raster image.
        * A layout is defined by a `url` of the image and a `type`.
        * Additionally, an object literal with Layout `options` can be specified.
        * Signals are triggered when the layout is ready to be drawn or its size is modified.
    	* @param {string} url URL of the image.
     	* @param {Layout#Type} type The type of the image.
     	* @param {Object} [options] An object literal describing the layout content.
     	* @param {number} options.width The total width of the original, unsplit image. This parameter must only be specified for the 'google' layout type. 
     	* @param {number} options.height The total height of the original, unsplit image. This parameter must only be specified for the 'google' layout type.
     	* @param {string} options.suffix='jpg' The filename suffix of the tiles.
     	* @param {string} options.subdomains='abc' The ('a'|'b'|'c') *s* subdomain of a Google template URL (for instance: 'https:{s}.my.example//{z}/{x}/{y}.png').
    	*/
    	constructor(url, type, options) {
    		super(url, null, options);
    		this.setDefaults(type);
    		this.init(url, type, options);
    	}
    	setDefaults(type) {
    		super.setDefaults(type);
    		Object.assign(this, {
    			tilesize: 256,
    			overlap: 0, 
    			nlevels: 1,        //level 0 is the top, single tile level.
    			qbox: [],          //array of bounding box in tiles, one for mipmap 
    			bbox: [],          //array of bounding box in pixels (w, h)
    			urls: [],
    		});
    	}

    	/** @ignore */
    	setUrls(urls) {
    		/**
    		* The event is fired when a layout is ready to be drawn(the single-resolution image is downloaded or the multi-resolution structure has been initialized).
    		* @event Layout#ready
    		*/
    		this.urls = urls;
    		(async () => {
    			switch(this.type) {
    				case 'google':      await this.initGoogle(); break; // No Url needed

    				case 'deepzoom1px': await this.initDeepzoom(true); break; // urls[0] only needed
    				case 'deepzoom':    await this.initDeepzoom(false); break; // urls[0] only needed
    				case 'zoomify':     await this.initZoomify(); break; // urls[0] only needed
    				case 'iiif':        await this.initIIIF(); break; // urls[0] only needed

    				case 'tarzoom':     await this.initTarzoom(); break; // all urls needed

    				case 'itarzoom':    await this.initITarzoom(); break; // actually it has just one url
    			}
    			this.initBoxes();
    			this.status = 'ready';
    			this.emit('ready');
    		})().catch(e => { console.log(e); this.status = e; });
    	}

    	/*
     *  Internal function to assemble the url needed to retrieve the image or the image tile.
     */
    	imageUrl(url, plane) {
    		let path = url.substring(0, url.lastIndexOf('/')+1);
    		switch(this.type) {
    			case 'image':    return path + plane + '.jpg';			case 'google':   return path + plane;			case 'deepzoom': return path + plane + '.dzi';			case 'tarzoom':  return path + plane + '.tzi';			case 'itarzoom': return path + 'planes.tzi';			case 'zoomify':  return path + plane + '/ImageProperties.xml';			//case 'iip':      return this.plane.throw Error("Unimplemented");
    			case 'iiif': throw Error("Unimplemented");
    			default:     throw Error("Unknown layout: " + this.type);
    		}
    	}

    	
    	getTileSize() {
    		return [this.tilesize, this.tilesize];
    	}

    	/**
     	*  Each tile is assigned an unique number.
     	*/
    	/** @ignore */
    	index(level, x, y) {
    		let startindex = 0;
    		for(let i = 0; i < level; i++)
    			startindex += this.qbox[i].xHigh*this.qbox[i].yHigh;
    		return startindex + y*this.qbox[level].xHigh + x;
    	}
    	reverseIndex(index) {
    		let originalindex = index;
    		let level = 0;
    		for(let i = 0; i < this.qbox.length; i++) {
    			let size = this.qbox[i].xHigh*this.qbox[i].yHigh;
    			if(index - size < 0)
    				break;
    			index -= size;
    			level++;
    		}
    		let width = this.qbox[level].xHigh;
    		let y = Math.floor(index/width);
    		let x = index % width;
    		console.assert(this.index(level, x, y) == originalindex);
    		return {level, x, y };
    	}

    	/*
     	* Compute all the bounding boxes (this.bbox and this.qbox).
     	* @return number of tiles in the dataset
    	*/
    	/** @ignore */
    	initBoxes() {
    		/**
    		* The event is fired when a layout size is modified (and the scene extension must be recomputed at canvas level).
    		* @event Layout#updateSize
    		*/

    		this.qbox = []; //by level (0 is the bottom)
    		this.bbox = [];
    		var w = this.width;
    		var h = this.height;

    		if(this.type == 'image') {
    			this.qbox[0] = new BoundingBox({xLow:0, yLow: 0, xHigh: 1, yHigh: 1});
    			this.bbox[0] = new BoundingBox({xLow:0, yLow: 0, xHigh: w, yHigh: h}); 
    			// Acknowledge bbox change (useful for knowing scene extension (at canvas level))
    			this.emit('updateSize');
    			return 1;
    		}

    		for(let level = this.nlevels - 1; level >= 0; level--) {
    			this.qbox[level] = new BoundingBox({xLow:0, yLow: 0, xHigh: 0, yHigh: 0});
    			this.bbox[level] = new BoundingBox({xLow:0, yLow: 0, xHigh: w, yHigh: h}); 

    			this.qbox[level].yHigh = Math.ceil(h/this.tilesize);
    			this.qbox[level].xHigh = Math.ceil(w/this.tilesize);

    			w >>>= 1;
    			h >>>= 1;
    		}
    		// Acknowledge bbox (useful for knowing scene extension (at canvas level))
    		this.emit('updateSize');
    	}

    	/**
    	* Returns the coordinates of the tile (in [0, 0, w h] image coordinate system) and the texture coords associated. 
     	* @returns the tile coordinates (image coords and texture coords) 
     	*/
    	tileCoords(tile) {
            let {level, x, y } = tile;
    		this.width;
    		this.height;
    		//careful: here y is inverted due to textures not being flipped on load (Firefox fault!).
    		var tcoords = new Float32Array([0, 1,     0, 0,     1, 0,     1, 1]);   
    		let coords = new Float32Array([0, 0, 0,  0, 1, 0,  1, 1, 0,  1, 0, 0]); // FIXME 32 bit and errors

    		let ilevel = this.nlevels - 1 - level;
    		let side =  this.tilesize*(1<<(ilevel)); //tile size in imagespace
    		let tx = side;
    		let ty = side;

    		if(side*(x+1) > this.width) {
    			tx = (this.width  - side*x);
    			if(this.type == 'google')
    				tcoords[4] = tcoords[6] = tx/side;
    		}

    		if(side*(y+1) > this.height) {
    			ty = (this.height - side*y);
    			if(this.type == 'google')
    				tcoords[1] = tcoords[7] = ty/side;
    		}

    		var lx  = this.qbox[level].xHigh-1; //last tile x pos, if so no overlap.
    		var ly  = this.qbox[level].yHigh-1;

    		var over = this.overlap;
    		if(over) {
    			let dtx = over / (tx/(1<<ilevel) + (x==0?0:over) + (x==lx?0:over));
    			let dty = over / (ty/(1<<ilevel) + (y==0?0:over) + (y==ly?0:over));

    			tcoords[0] = tcoords[2] = (x==0? 0: dtx);
    			tcoords[3] = tcoords[5] = (y==0? 0: dty);
    			tcoords[4] = tcoords[6] = (x==lx? 1: 1 - dtx);
    			tcoords[1] = tcoords[7] = (y==ly? 1: 1 - dty);
    		} 
    		//flip Y coordinates 
    		//TODO cleanup this mess!
    		let tmp = tcoords[1];
    		tcoords[1] = tcoords[7] = tcoords[3];
    		tcoords[3] = tcoords[5] = tmp;

    		for(let i = 0; i < coords.length; i+= 3) {
    			coords[i]   =  coords[i]  *tx + side*x - this.width/2;
    			coords[i+1] = -coords[i+1]*ty - side*y + this.height/2;
    		}

    		return { coords: coords, tcoords: tcoords }
    	}

    	newTile(index) {
    		let tile = super.newTile(index);
    		tile.index = index;
    		Object.assign(tile, this.reverseIndex(index));
    		return tile;
    	}

    	/** returns the list of tiles required for a rendering, sorted by priority, max */
    	needed(viewport, transform, layerTransform, border, bias, tiles, maxtiles = 8) {
    		let neededBox = this.neededBox(viewport, transform, layerTransform, 0, bias);
    		
    		//if (this.previouslyNeeded && this.sameNeeded(this.previouslyNeeded, neededBox))
    	    //		return;
    		//this.previouslyNeeded = neededBox;

    		let needed = [];
    		let now = performance.now();
    		//look for needed nodes and prefetched nodes (on the pos destination
    		//let missing = this.shader.samplers.length;

    		for (let level = 0; level <= neededBox.level; level++) {
    			let box = neededBox.pyramid[level];
    			let tmp = [];
    			for (let y = box.yLow; y < box.yHigh; y++) {
    				for (let x = box.xLow; x < box.xHigh; x++) {
    					let index = this.index(level, x, y);
    					let tile = tiles.get(index) || this.newTile(index); //{ index, x, y, missing, tex: [], level };
    					tile.time = now;
    					tile.priority = neededBox.level - level;
    					if (tile.missing === null) // || tile.missing != 0 && !this.requested[index])
    						tmp.push(tile);
    				}
    			}
    			let c = box.center();
    			//sort tiles by distance to the center TODO: check it's correct!
    			tmp.sort(function (a, b) { return Math.abs(a.x - c[0]) + Math.abs(a.y - c[1]) - Math.abs(b.x - c[0]) - Math.abs(b.y - c[1]); });
    			needed = needed.concat(tmp);
    		}
    		return needed;
    	}

    	/** returns the list of tiles available for a rendering */
    	available(viewport, transform, layerTransform, border, bias, tiles) {
    		let needed = this.neededBox(viewport, transform, layerTransform, 0, bias);
    		let torender = {}; //array of minlevel, actual level, x, y (referred to minlevel)
    		let brothers = {};

    		let minlevel = needed.level;
    		let box = needed.pyramid[minlevel];

    		for (let y = box.yLow; y < box.yHigh; y++) {
    			for (let x = box.xLow; x < box.xHigh; x++) {
    				let level = minlevel;
    				while (level >= 0) {
    					let d = minlevel - level;
    					let index = this.index(level, x >> d, y >> d);
    					if (tiles.has(index) && tiles.get(index).missing == 0) {
    						torender[index] = tiles.get(index); //{ index: index, level: level, x: x >> d, y: y >> d, complete: true };
    						break;
    					} else {
    						let sx = (x >> (d + 1)) << 1;
    						let sy = (y >> (d + 1)) << 1;
    						brothers[this.index(level, sx, sy)] = 1;
    						brothers[this.index(level, sx + 1, sy)] = 1;
    						brothers[this.index(level, sx + 1, sy + 1)] = 1;
    						brothers[this.index(level, sx, sy + 1)] = 1;
    					}
    					level--;
    				}
    			}
    		}
    		for (let index in brothers) {
    			if (index in torender)
    				torender[index].complete = false;
    		}
    		return torender;
    	}

    	/**
     	* Computes the tiles needed for each level, given a viewport and a transform.
     	* @param {Viewport} viewport The viewport.
    	* @param {Transform} transform The current transform.
    	* @param {Transform} layerTransform The transform of the calling layer
     	* @param {number} border The threshold (in tile units) around the current camera position for which to prefetch tiles.
    	* @param {number} bias The mipmap bias of the texture.
     	* @returns {Object} level: the optimal level in the pyramid, pyramid: array of bounding boxes in tile units.
     	*/
    	neededBox(viewport, transform, layerTransform, border, bias) {
    		if(this.type == "image")
    			return { level:0, pyramid: [new BoundingBox({ xLow:0, yLow:0, xHigh:1, yHigh:1 })] };

    		//here we are computing with inverse levels; level 0 is the bottom!
    		let iminlevel = Math.max(0, Math.min(Math.floor(-Math.log2(transform.z) + bias), this.nlevels-1));
    		let minlevel = this.nlevels-1-iminlevel;

    		const bbox = this.getViewportBox(viewport, transform, layerTransform);

    		let pyramid = [];
    		for(let level = 0; level <= minlevel; level++) {
    			let ilevel = this.nlevels -1 -level;
    			let side = this.tilesize*Math.pow(2, ilevel);

    			let qbox = new BoundingBox(bbox);
    			qbox.quantize(side);

    			//clamp!
    			qbox.xLow  = Math.max(qbox.xLow  - border, this.qbox[level].xLow);
    			qbox.yLow  = Math.max(qbox.yLow  - border, this.qbox[level].yLow);
    			qbox.xHigh = Math.min(qbox.xHigh + border, this.qbox[level].xHigh);
    			qbox.yHigh = Math.min(qbox.yHigh + border, this.qbox[level].yHigh);
    			pyramid[level] = qbox;
    		}
    		return { level: minlevel, pyramid: pyramid };
    	}

    	

    	/**
    	 * Gets the URL of a specific tile. The function must be implemented for each layout type supported by OpenLIME.
    	 * @param {number} id The channel id.
    	 * @param {Tile} tile The tile.
    	 */
    	getTileURL(id, tile) {
    		throw Error("Layout not defined or ready.");
    	}

    	/*
     	* Witdh and height can be recovered once the image is downloaded.
    	*/
    	/** @ignore */
    	async initImage() {
    		this.getTileURL = (rasterid, tile) => { return this.urls[rasterid]; };
    		this.nlevels = 1;
    		this.tilesize = 0;
    	}

    	/*
     	*  url points to the folder (without /)
    	*  width and height must be defined
     	*/
    	/** @ignore */
    	async initGoogle() {
    		if(!this.width || !this.height)
    			throw "Google rasters require to specify width and height";

    		this.tilesize = 256;
    		this.overlap = 0;

    		let max = Math.max(this.width, this.height)/this.tilesize;
    		this.nlevels = Math.ceil(Math.log(max) / Math.LN2) + 1;

    		if( this.urls[0].includes('{')) {
    			this.getTileURL = (rasterid, tile) => {
    				let  s = this.subdomains ? this.subdomains[Math.abs(tile.x + tile.y) % this.subdomains.length] : '';
    				let vars = {s, ...tile, z: tile.level};
    				return this.urls[rasterid].replace(/{(.+?)}/g,(match,p)=> vars[p]);
    			};
    		} else
    			this.getTileURL = (rasterid, tile) => {
    				return this.urls[rasterid] + "/" + tile.level + "/" + tile.y + "/" + tile.x + '.' + this.suffix;
    			};
    	}

    	/*
     	* Expects the url to point to .dzi config file
     	*/
    	/** @ignore */
    	async initDeepzoom(onepixel) {
    		let url = this.urls.filter(u => u)[0];
    		var response = await fetch(url);
    		if(!response.ok) {
    			this.status = "Failed loading " + url + ": " + response.statusText;
    			throw new Error(this.status);
    		}
    		let text = await response.text();
    		let xml = (new window.DOMParser()).parseFromString(text, "text/xml");

    		let doc = xml.documentElement;
    		this.suffix = doc.getAttribute('Format');
    		this.tilesize = parseInt(doc.getAttribute('TileSize'));
    		this.overlap = parseInt(doc.getAttribute('Overlap'));

    		let size = doc.querySelector('Size');
    		this.width = parseInt(size.getAttribute('Width'));
    		this.height = parseInt(size.getAttribute('Height'));

    		let max = Math.max(this.width, this.height)/this.tilesize;
    		this.nlevels = Math.ceil(Math.log(max) / Math.LN2) + 1;

    		this.urls = this.urls.map(url => url ? url.substr(0, url.lastIndexOf(".")) + '_files/' : null);
    		this.skiplevels = 0;
    		if(onepixel)
    			this.skiplevels = Math.ceil(Math.log(this.tilesize) / Math.LN2);

    		this.getTileURL = (rasterid, tile) => {
    			let url = this.urls[rasterid];
    			let level = tile.level + this.skiplevels;
    			return url + level + '/' + tile.x + '_' + tile.y + '.' + this.suffix;
    		}; 
    	}

    	/** @ignore */
    	async initTarzoom() {
    		this.tarzoom =[];	
    		for (let url of this.urls) {
    			var response = await fetch(url);
    			if (!response.ok) {
    				this.status = "Failed loading " + url + ": " + response.statusText;
    				throw new Error(this.status);
    			}
    			let json = await response.json();
    			json.url = url.substr(0, url.lastIndexOf(".")) + '.tzb';
    			Object.assign(this, json);
    			this.tarzoom.push(json);
    		}

    		this.getTileURL = (rasterid, tile) => {
    			const tar = this.tarzoom[rasterid];
    			tile.start = tar.offsets[tile.index];
    			tile.end = tar.offsets[tile.index+1];
    			return tar.url;
    		}; 
    	}

    	/** @ignore */
    	async initITarzoom() {
    		const url = this.urls[0];		
    		var response = await fetch(url);
    		if(!response.ok) {
    			this.status = "Failed loading " + url + ": " + response.statusText;
    			throw new Error(this.status);
    		}
    		let json = await response.json();
    		Object.assign(this, json); //suffix, tilesize, overlap, width, height, levels
    		this.url = url.substr(0, url.lastIndexOf(".")) + '.tzb';

    		this.getTileURL = (rasterid, tile) => {
    			let index = tile.index*this.stride;
    			tile.start = this.offsets[index];
    			tile.end = this.offsets[index+this.stride];
    			tile.offsets = [];
    			for(let i = 0; i < this.stride+1; i++)
    				tile.offsets.push(this.offsets[index + i] - tile.start);
    			return this.url;
    		}; 
    	}

    	/*
     	* Expects the url to point to ImageProperties.xml file.
     	*/
    	/** @ignore */
    	async initZoomify() {
    		const url = this.urls[0];
    		this.overlap = 0;
    		var response = await fetch(url);
    		if(!response.ok) {
    			this.status = "Failed loading " + url + ": " + response.statusText;
    			throw new Error(this.status);
    		}
    		let text = await response.text();
    		let xml = (new window.DOMParser()).parseFromString(text, "text/xml");
    		let doc = xml.documentElement;
    		this.tilesize = parseInt(doc.getAttribute('TILESIZE'));
    		this.width = parseInt(doc.getAttribute('WIDTH'));
    		this.height = parseInt(doc.getAttribute('HEIGHT'));
    		if(!this.tilesize || !this.height || !this.width)
    			throw "Missing parameter files for zoomify!";

    		let max = Math.max(this.width, this.height)/this.tilesize;
    		this.nlevels = Math.ceil(Math.log(max) / Math.LN2) + 1;

    		this.getTileURL = (rasterid, tile) => {
    			const tileUrl = this.urls[rasterid].substr(0, url.lastIndexOf("/"));
    			let group = tile.index >> 8;
    			return tileUrl + "/TileGroup" + group + "/" + tile.level + "-" + tile.x + "-" + tile.y + "." + this.suffix;
    		};
    	}

    	/** @ignore */
    	async initIIIF() {
    		const url = this.urls[0];
    		this.overlap = 0;

    		var response = await fetch(url);
    		if(!response.ok) {
    			this.status = "Failed loading " + url + ": " + response.statusText;
    			throw new Error(this.status);
    		}
    		let info = await response.json();
    		this.width = info.width;
    		this.height = info.height;
    		this.nlevels = info.tiles[0].scaleFactors.length;
    		this.tilesize = info.tiles[0].width;

    		this.getTileURL = (rasterid, tile) => {
    			const tileUrl = this.urls[rasterid].substr(0, url.lastIndexOf("/"));
    			let tw = this.tilesize;
    			parseInt(this.nlevels - 1 - tile.level);
    			let s = Math.pow(2, tile.level);

    			//region parameters
    			let xr = tile.x * tw * s;
    			let yr = tile.y * tw * s;
    			let wr = Math.min(tw * s, this.width - xr);
    			let hr = Math.min(tw * s, this.height - yr);

    			// pixel size parameters /ws,hs/
    			let ws = tw;
    			if (xr + tw*s > this.width)
    				ws = (this.width - xr + s - 1) / s;  
    			let hs = tw;
    			if (yr + tw*s > this.height)
    				hs = (this.height - yr + s - 1) / s;

    			return `${tileUrl}/${xr},${yr},${wr},${hr}/${ws},${hs}/0/default.jpg`;
    		};
    	}
    }

    let factory = (url, type, options) => { return new LayoutTiles(url, type, options); };
    for(let type of ['google', 'deepzoom1px', 'deepzoom', 'zoomify', 'iiif', 'tarzoom', 'itarzoom'])
        Layout.prototype.types[type] = factory;

    class ShaderFilter {
        constructor(options) {
            options = Object.assign({
            }, options);
            Object.assign(this, options);
            this.name = this.constructor.name;
            this.uniforms = {};
            this.samplers = [];
            this.needsUpdate = true;
            this.shader = null;

            this.modes = {};
        }

        setMode(mode, id) {
            if (!this.shader)
                throw Error("Shader not registered");

            if (Object.keys(this.modes).length > 0) {
                const list = this.modes[mode];
                if (list) {
                    list.map(a => {
                        a.enable = a.id == id;
                    });
                    this.shader.needsUpdate = true;
                } else {
                    throw Error(`Mode "${mode}" not exist!`);
                }
            }
        }

        // Callback in Shader.js
        prepare(gl) {
            if (this.needsUpdate)
                if (this.createTextures) this.createTextures(gl);
            this.needsUpdate = false;
        }

        // Callback to create textures for samplers
        // async createTextures(gl) {
        // }

        // Constant (modes) declarations in shader program 
        fragModeSrc() {
            let src = '';
            for (const key of Object.keys(this.modes)) {
                for (const e of this.modes[key]) {
                    if (e.enable) {
                        src += e.src + '\n';
                    }
                }
            }
            return src;
        }

        /**
    	 * Sets the value of a uniform variable.
    	 * @param {string} name The name of the uniform variable (it will be converted with the unique filter name).
    	 * @param {*} value The value to assign.
    	 */
        setUniform(name, value) {
            if(!this.shader) {
                throw Error(`Shader not registered`);
            }
            this.shader.setUniform(this.uniformName(name), value);
        }

        // Sampler declarations in shader program 
        fragSamplerSrc() {
            let src = '';
            for (let s of this.samplers) {
                src += `
            uniform sampler2D ${s.name};`;
            }
            return src;
        }

        // Uniform declarations in shader program 
        fragUniformSrc() {
            let src = '';
            for (const [key, value] of Object.entries(this.uniforms)) {
                src += `
            uniform ${this.uniforms[key].type} ${key};`;
            }
            return src;
        }

        fragDataSrc(gl) {
            return null;
        }

        functionName() {
            return this.name + "_data";
        }

        samplerName(name) {
            return `${this.name}_${name}`;
        }

        uniformName(name) {
            return `u_${this.name}_${name}`;
        }

        modeName(name) {
            return `m_${this.name}_${name}`;
        }

        getSampler(name) {
            const samplername = this.samplerName(name);
            return this.samplers.find(e => e.name == samplername);
        }
    }

    class ShaderFilterTest extends ShaderFilter {
        constructor(options) {
            super(options);
            this.uniforms[this.uniformName('nodata_col')] = { type: 'vec4', needsUpdate: true, size: 4, value: [1, 1, 0, 1] };
        }

        fragDataSrc(gl) {
            return `
            vec4 ${this.functionName()}(vec4 col){
                return col.a > 0.0 ? col : ${this.uniformName('nodata_col')};
            }`;
        }
    }

    class ShaderFilterOpacity extends ShaderFilter {
        constructor(opacity, options) {
            super(options);
            this.uniforms[this.uniformName('opacity')] = { type: 'float', needsUpdate: true, size: 1, value: opacity };
        }

        fragDataSrc(gl) {
            return `
            vec4 ${this.functionName()}(vec4 col){
                return vec4(col.rgb, col.a * ${this.uniformName('opacity')});
            }`;
        }
    }

    class ShaderGammaFilter extends ShaderFilter {
        constructor(options) {
            super(options);
            this.uniforms[this.uniformName('gamma')] = { type: 'float', needsUpdate: true, size: 1, value: 2.2 };
        }

        fragDataSrc(gl) {
            return `
            vec4 ${this.functionName()}(vec4 col){
                float igamma = 1.0/${this.uniformName('gamma')};
                return vec4(pow(col.r, igamma), pow(col.g, igamma), pow(col.b, igamma), col.a);
            }`;
        }
    }

    // vector field https://www.shadertoy.com/view/4s23DG
    // isolines https://www.shadertoy.com/view/Ms2XWc

    class ShaderFilterColormap extends ShaderFilter {
        constructor(colorscale, options) {
            super(options);
            options = Object.assign({
                inDomain: [],
                channelWeights: [1.0 / 3.0, 1.0 / 3.0, 1.0 / 3.0],
                maxSteps: 256,
            }, options);
            Object.assign(this, options);

            if(this.inDomain.length != 2 && this.inDomain[1] <= this.inDomain[0]) {
                throw Error("inDomain bad format");
            }

            this.colorscale = colorscale;
            if (this.inDomain.length == 0) this.inDomain = this.colorscale.rangeDomain();

            const cscaleDomain = this.colorscale.rangeDomain();
            const scale = (this.inDomain[1]-this.inDomain[0])/(cscaleDomain[1]-cscaleDomain[0]);
            const bias = (this.inDomain[0]-cscaleDomain[0])/(cscaleDomain[1]-cscaleDomain[0]);
            
            this.samplers = [{ name:`${this.samplerName('colormap')}` }];

            this.uniforms[this.uniformName('channel_weigths')] = { type: 'vec3', needsUpdate: true, size: 3, value: this.channelWeights };
            this.uniforms[this.uniformName('low_color')] = { type: 'vec4', needsUpdate: true, size: 4, value: this.colorscale.lowColor.value() };
            this.uniforms[this.uniformName('high_color')] = { type: 'vec4', needsUpdate: true, size: 4, value: this.colorscale.highColor.value() };
            this.uniforms[this.uniformName('scale')] = { type: 'float', needsUpdate: true, size: 1, value: scale };
            this.uniforms[this.uniformName('bias')] = { type: 'float', needsUpdate: true, size: 1, value: bias };

        }

        async createTextures(gl) {
            const colormap = this.colorscale.sample(this.maxSteps);
            let textureFilter=gl.LINEAR;
            if(this.colorscale.type == 'bar') {
                textureFilter=gl.NEAREST;
            }
    		const tex = gl.createTexture();
    		gl.bindTexture(gl.TEXTURE_2D, tex);
    		gl.texParameterf(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, textureFilter);
    		gl.texParameterf(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, textureFilter);
    		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, this.maxSteps, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, colormap.buffer);
            this.getSampler('colormap').tex = tex; // Link tex to sampler
        }

        fragDataSrc(gl) {
            return `
            vec4 ${this.functionName()}(vec4 col){
                if(col.a == 0.0) return col;
                float v = dot(col.rgb, ${this.uniformName('channel_weigths')});
                float cv = v*${this.uniformName('scale')} + ${this.uniformName('bias')};

                if(cv >= 1.0) return ${this.uniformName('high_color')};
                if(cv <= 0.0) return ${this.uniformName('low_color')};

                return texture(${this.samplerName('colormap')}, vec2(cv, 0.5));
            }`;
        }


    }

    // vector field https://www.shadertoy.com/view/4s23DG
    // isolines https://www.shadertoy.com/view/Ms2XWc

    class ShaderFilterVector extends ShaderFilter {
        constructor(colorscale, options) {
            super(options);
            options = Object.assign({
                inDomain: [],
                maxSteps: 256,
                arrowColor: [0.0, 0.0, 0.0, 1.0],
                
            }, options);
            Object.assign(this, options);

            if (this.inDomain.length != 2 && this.inDomain[1] <= this.inDomain[0]) {
                throw Error("inDomain bad format");
            }

            this.colorscale = colorscale;
            if (this.inDomain.length == 0) this.inDomain = this.colorscale.rangeDomain();

            const cscaleDomain = this.colorscale.rangeDomain();

            const scale = Math.sqrt((this.inDomain[1] * this.inDomain[1] + this.inDomain[0] * this.inDomain[0]) / (cscaleDomain[1] * cscaleDomain[1] + cscaleDomain[0] * cscaleDomain[0]));
            const bias = 0.0;

            this.modes = {
                normalize: [
                    { id: 'off', enable: true, src: `const bool ${this.modeName('arrowNormalize')} = false;` },
                    { id: 'on', enable: false, src: `const bool ${this.modeName('arrowNormalize')} = true;` }
                ],
                arrow: [
                    { id: 'mag', enable: true, src: `const int ${this.modeName('arrowColor')} = 0;` },
                    { id: 'col', enable: false, src: `const int ${this.modeName('arrowColor')} = 1;` }
                ],
                field: [
                    { id: 'none', enable: true, src: `const int ${this.modeName('fieldColor')} = 0;` },
                    { id: 'mag', enable: false, src: `const int ${this.modeName('fieldColor')} = 1;` }
                ]
            };

            this.samplers = [{ name: `${this.samplerName('colormap')}` }];

            this.uniforms[this.uniformName('arrow_color')] = { type: 'vec4', needsUpdate: true, size: 4, value: this.arrowColor };
            this.uniforms[this.uniformName('low_color')] = { type: 'vec4', needsUpdate: true, size: 4, value: this.colorscale.lowColor.value() };
            this.uniforms[this.uniformName('high_color')] = { type: 'vec4', needsUpdate: true, size: 4, value: this.colorscale.highColor.value() };
            this.uniforms[this.uniformName('scale')] = { type: 'float', needsUpdate: true, size: 1, value: scale };
            this.uniforms[this.uniformName('bias')] = { type: 'float', needsUpdate: true, size: 1, value: bias };
        }

        async createTextures(gl) {
            const colormap = this.colorscale.sample(this.maxSteps);
            let textureFilter = gl.LINEAR;
            if (this.colorscale.type == 'bar') {
                textureFilter = gl.NEAREST;
            }
            const tex = gl.createTexture();
            gl.bindTexture(gl.TEXTURE_2D, tex);
            gl.texParameterf(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, textureFilter);
            gl.texParameterf(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, textureFilter);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, this.maxSteps, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, colormap.buffer);
            this.getSampler('colormap').tex = tex; // Link tex to sampler
        }

        fragDataSrc(gl) {
            return `
        // 2D vector field visualization by Matthias Reitinger, @mreitinger
        // Based on "2D vector field visualization by Morgan McGuire, http://casual-effects.com", https://www.shadertoy.com/view/4s23DG
        
        const float ARROW_TILE_SIZE = 16.0;
        const float ISQRT2 = 0.70710678118; // 1/sqrt(2)

        // Computes the center pixel of the tile containing pixel pos
        vec2 arrowTileCenterCoord(vec2 pos) {
            return (floor(pos / ARROW_TILE_SIZE) + 0.5) * ARROW_TILE_SIZE;
        }

        // Computes the distance from a line segment
        float line3(vec2 a, vec2 b, vec2 c) {
            vec2 ab = a - b;
            vec2 cb = c - b;
            float d = dot(ab, cb);
            float len2 = dot(cb, cb);
            float t = 0.0;
            if (len2 != 0.0) {
              t = clamp(d / len2, 0.0, 1.0);
            }
            vec2 r = b + cb * t;
            return distance(a, r);
        }

        // Computes the signed distance from a line segment
        float line(vec2 p, vec2 p1, vec2 p2) {
            vec2 center = (p1 + p2) * 0.5;
            float len = length(p2 - p1);
            vec2 dir = (p2 - p1) / len;
            vec2 rel_p = p - center;
            float dist1 = abs(dot(rel_p, vec2(dir.y, -dir.x)));
            float dist2 = abs(dot(rel_p, dir)) - 0.5*len;
            return max(dist1, dist2);
        }
        
        // v = field sampled at arrowTileCenterCoord(p), scaled by the length
        // desired in pixels for arrows
        // Returns a signed distance from the arrow
        float arrow(vec2 p, vec2 v) {
            if (${this.modeName('arrowNormalize')}) v = normalize(v);
            v *= ARROW_TILE_SIZE * 0.5; // Change from [-1,1] to pixels
            // Make everything relative to the center, which may be fractional
            p -= arrowTileCenterCoord(p);
                
            float mag_v = length(v), mag_p = length(p);
            
            if (mag_v > 0.0) {
                // Non-zero velocity case
                vec2 dir_v = normalize(v);
                
                // We can't draw arrows larger than the tile radius, so clamp magnitude.
                // Enforce a minimum length to help see direction
                mag_v = clamp(mag_v, 2.0, ARROW_TILE_SIZE * 0.4);
        
                // Arrow tip location
                v = dir_v * mag_v;
        
                // Signed distance from shaft
                float shaft = line3(p, v, -v);
                // Signed distance from head
                float head = min(line3(p, v, 0.4*v + 0.2*vec2(-v.y, v.x)),
                                 line3(p, v, 0.4*v + 0.2*vec2(v.y, -v.x)));
                return min(shaft, head);
            } else {
                // Signed distance from the center point
                return mag_p;
            }
        }
        
        vec4 lookupColormap(float cv) {            
            if(cv >= 1.0) 
                return ${this.uniformName('high_color')};
            else if(cv <= 0.0) 
                return ${this.uniformName('low_color')};
            return texture(${this.samplerName('colormap')}, vec2(cv, 0.5));
        }

        vec4 ${this.functionName()}(vec4 col){
            if(col.a == 0.0) return col;

            vec2 p = v_texcoord*tileSize; // point in pixel
            vec2 pc_coord = arrowTileCenterCoord(p)/tileSize; // center coordinate
            vec4 pc_val = texture(kd, pc_coord); // [0..1] - lookup color in center
            float s = 2.0;
            float b = -1.0;
            vec2 uvc = vec2(pc_val.x*s+b, pc_val.y*s+b); // [-1..1]
            vec2 uvr =  vec2(col.r*s+b, col.g*s+b); // [-1..1]

            // Colors
            float vc = length(uvc)*ISQRT2;
            float cvc = vc*${this.uniformName('scale')} + ${this.uniformName('bias')};
            float vr = length(uvr)*ISQRT2;
            float cvr = vr*${this.uniformName('scale')} + ${this.uniformName('bias')};
            vec4 cmapc = lookupColormap(cvc);
            vec4 cmapr = lookupColormap(cvr);
                
            // Arrow            
            float arrow_dist = arrow(p, uvc);
            
            vec4 arrow_col = cmapc;
            vec4 field_col = vec4(0.0, 0.0, 0.0, 0.0);

            switch (${this.modeName('arrowColor')}) {
                case 0:
                    arrow_col = cmapc;
                    break;
                case 1:
                    arrow_col = ${this.uniformName('arrow_color')};               
                    break;
            }

            switch (${this.modeName('fieldColor')}) {
                case 0:
                    field_col = vec4(0.0, 0.0, 0.0, 0.0);
                    break;
                case 1:
                    field_col = cmapr;              
                    break;
            }

            float t = clamp(arrow_dist, 0.0, 1.0);
            return  mix(arrow_col, field_col, t);
        }`;
        }


    }

    // vector field https://www.shadertoy.com/view/4s23DG
    // isolines https://www.shadertoy.com/view/Ms2XWc

    class ShaderFilterVectorGlyph extends ShaderFilter {
        constructor(colorscale, glyphsUrl, options) {
            super(options);
            options = Object.assign({
                inDomain: [],
                maxSteps: 256,
                glyphColor: [0.0, 0.0, 0.0, 1.0],
                glyphsStride: 80,
                glyphsSize: [304, 64]
            }, options);
            Object.assign(this, options);

            if (this.inDomain.length != 2 && this.inDomain[1] <= this.inDomain[0]) {
                throw Error("inDomain bad format");
            }

            this.glyphsUrl = glyphsUrl;
            if (this.glyphsUrl.length == 0) throw Error("glyphUrl is empty: no items to display");

            this.colorscale = colorscale;
            if (this.inDomain.length == 0) this.inDomain = this.colorscale.rangeDomain();

            const cscaleDomain = this.colorscale.rangeDomain();

            const scale = Math.sqrt((this.inDomain[1] * this.inDomain[1] + this.inDomain[0] * this.inDomain[0]) / (cscaleDomain[1] * cscaleDomain[1] + cscaleDomain[0] * cscaleDomain[0]));
            const bias = 0.0;

            const gap = this.glyphsStride-this.glyphsSize[1];
            const glyphCount = Math.round((this.glyphsSize[0] + gap) / this.glyphsStride);

            this.modes = {
                normalize: [
                    { id: 'off', enable: true, src: `const bool ${this.modeName('glyphNormalize')} = false;` },
                    { id: 'on', enable: false, src: `const bool ${this.modeName('glyphNormalize')} = true;` }
                ],
                glyph: [
                    { id: 'mag', enable: true, src: `const int ${this.modeName('glyphColor')} = 0;` },
                    { id: 'col', enable: false, src: `const int ${this.modeName('glyphColor')} = 1;` }
                ],
                field: [
                    { id: 'none', enable: true, src: `const int ${this.modeName('fieldColor')} = 0;` },
                    { id: 'mag', enable: false, src: `const int ${this.modeName('fieldColor')} = 1;` }
                ]
            };

            this.samplers = [{ name: `${this.samplerName('colormap')}` }, { name: `${this.samplerName('glyphs')}` }];


            this.uniforms[this.uniformName('glyph_color')] = { type: 'vec4', needsUpdate: true, size: 4, value: this.glyphColor };
            this.uniforms[this.uniformName('glyph_count')] = { type: 'float', needsUpdate: true, size: 1, value: glyphCount };
            this.uniforms[this.uniformName('glyph_wh')] = { type: 'float', needsUpdate: true, size: 1, value: this.glyphsSize[1] };
            this.uniforms[this.uniformName('glyph_stride')] = { type: 'float', needsUpdate: true, size: 1, value: this.glyphsStride };

            this.uniforms[this.uniformName('low_color')] = { type: 'vec4', needsUpdate: true, size: 4, value: this.colorscale.lowColor.value() };
            this.uniforms[this.uniformName('high_color')] = { type: 'vec4', needsUpdate: true, size: 4, value: this.colorscale.highColor.value() };
            this.uniforms[this.uniformName('scale')] = { type: 'float', needsUpdate: true, size: 1, value: scale };
            this.uniforms[this.uniformName('bias')] = { type: 'float', needsUpdate: true, size: 1, value: bias };
        }

        async createTextures(gl) {
            // Glyphs
            const glyphsBuffer = await Util.rasterizeSVG(this.glyphsUrl, this.glyphsSize);
            const glyphsTex = gl.createTexture();
            gl.bindTexture(gl.TEXTURE_2D, glyphsTex);
            gl.texParameterf(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
            gl.texParameterf(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, glyphsBuffer);
            this.getSampler('glyphs').tex = glyphsTex;

            // Colormap
            const colormap = this.colorscale.sample(this.maxSteps);
            let textureFilter = gl.LINEAR;
            if (this.colorscale.type == 'bar') {
                textureFilter = gl.NEAREST;
            }
            const tex = gl.createTexture();
            gl.bindTexture(gl.TEXTURE_2D, tex);
            gl.texParameterf(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, textureFilter);
            gl.texParameterf(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, textureFilter);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, this.maxSteps, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, colormap.buffer);
            this.getSampler('colormap').tex = tex;
        }

        fragDataSrc(gl) {
            return `
        // 2D vector glyph visualization
        
        const float GLYPH_TILE_SIZE = 16.0;
        const float ISQRT2 = 0.70710678118; // 1/sqrt(2)

        // Computes the center pixel of the tile containing pixel pos
        vec2 glyphTileCenterCoord(vec2 pos) {
            return (floor(pos / GLYPH_TILE_SIZE) + 0.5) * GLYPH_TILE_SIZE;
        }

        float glyph(vec2 p, vec2 v) {
            if (${this.modeName('glyphNormalize')}) v = normalize(v);
            
            // Make everything relative to the center, which may be fractional
            p -= glyphTileCenterCoord(p);
                
            float mag_v = length(v), mag_p = length(p);
            
            if (mag_v > 0.0) {
                // Non-zero velocity case
                vec2 dir_v = normalize(v);
                
                float level = floor((1.0-mag_v*ISQRT2) * ${this.uniformName('glyph_count')});
                level = min(level, ${this.uniformName('glyph_count')} - 1.0);

                mat2 rotm = mat2(
                    dir_v[1], dir_v[0], // first column
                    -dir_v[0], dir_v[1]  // second column
                );
            
                float scaleToGlyph =  ${this.uniformName('glyph_wh')} / GLYPH_TILE_SIZE;
                vec2 pp = rotm * p; // p on axys with origin in tile center and aligned with direction dir_v
                pp += vec2(GLYPH_TILE_SIZE * 0.5, GLYPH_TILE_SIZE * 0.5); // pp in [0, GLYPH_TILE_SIZE]
                pp *= scaleToGlyph; // pp in [0, glyph_wh]
                pp.x += level * ${this.uniformName('glyph_stride')}; // apply stride
                pp.y = ${this.uniformName('glyph_wh')} - pp.y - 1.0; // invert y-axis
                //vec4 g = texelFetch(${this.samplerName('glyphs')}, ivec2(pp), 0);
                float w = ${this.uniformName('glyph_stride')}*(${this.uniformName('glyph_count')} -1.0) + ${this.uniformName('glyph_wh')};
                float h = ${this.uniformName('glyph_wh')};
                vec2 ppnorm = pp/vec2(w,h);
                vec4 g = texture(${this.samplerName('glyphs')}, ppnorm);
                return 1.0-g.a;

            } else {
                // Signed distance from the center point
                return mag_p;
            }
        }
        
        vec4 lookupColormap(float cv) {            
            if(cv >= 1.0) 
                return ${this.uniformName('high_color')};
            else if(cv <= 0.0) 
                return ${this.uniformName('low_color')};
            return texture(${this.samplerName('colormap')}, vec2(cv, 0.5));
        }

        vec4 ${this.functionName()}(vec4 col){
            if(col.a == 0.0) return col;

            vec2 p = v_texcoord*tileSize; // point in pixel
            vec2 pc_coord = glyphTileCenterCoord(p)/tileSize; // center coordinate
            vec4 pc_val = texture(kd, pc_coord); // [0..1] - lookup color in center
            float s = 2.0;
            float b = -1.0;
            vec2 uvc = vec2(pc_val.x*s+b, pc_val.y*s+b); // [-1..1]
            vec2 uvr =  vec2(col.r*s+b, col.g*s+b); // [-1..1]

            // Colors
            float vc = length(uvc)*ISQRT2;
            float cvc = vc*${this.uniformName('scale')} + ${this.uniformName('bias')};
            float vr = length(uvr)*ISQRT2;
            float cvr = vr*${this.uniformName('scale')} + ${this.uniformName('bias')};
            vec4 cmapc = lookupColormap(cvc);
            vec4 cmapr = lookupColormap(cvr);
                
            // Glyph            
            float glyph_dist = glyph(p, uvc);

            vec4 glyph_col = cmapc;
            vec4 field_col = vec4(0.0, 0.0, 0.0, 0.0);

            switch (${this.modeName('glyphColor')}) {
                case 0:
                    glyph_col = cmapc;
                    break;
                case 1:
                    glyph_col = ${this.uniformName('glyph_color')};               
                    break;
            }

            switch (${this.modeName('fieldColor')}) {
                case 0:
                    field_col = vec4(0.0, 0.0, 0.0, 0.0);
                    break;
                case 1:
                    field_col = cmapr;              
                    break;
            }

            float t = clamp(glyph_dist, 0.0, 1.0);
            return  mix(glyph_col, field_col, t);
        }`;
        }


    }

    /**
     * The **ShaderCombiner** class specifies a shader that computes an output texture as a combination of two input textures.
     * It defines four modes (shader behaviors): 
     * * 'first' assigns the first texture as output (draws the first texture). The color of each fragment is cout=c1
     * * 'second' assigns the second texture as output (draws the second texture). The color of each fragment is cout=c2
     * * 'mean' calculates the average color of the two textures. The color of each fragment is cout=(c1+c2)/2.0
     * * 'diff' calculates the difference between the color of the textures. Color of each fragment is cout=c2.rgb-c1.rgb
     * 
     * Extends {@link Shader}.
     */
    class ShaderCombiner extends Shader {
    	/**
    	 * Instantiates a **ShaderCombiner** class.
    	 * An object literal with ShaderCombiner `options` can be specified.
    	 * @param {Object} [options] An object literal with options that inherits from {@link Shader}.
    	 */
    	constructor(options) {
    		super(options);

    		this.mode = 'mean', //Lighten Darken Contrast Inversion HSV components LCh components
    		this.samplers = [
    			{ id:0, name:'source1', type:'vec3' },
    			{ id:1, name:'source2', type:'vec3' }
    		];

    		this.modes = ['first','second','mean','diff'];
    		this.operations = {
    			'first': 'color = c1;',
    			'second': 'color = c2;',
    			'mean': 'color = (c1 + c2)/2.0;',
    			'diff': 'color = vec4(c2.rgb - c1.rgb, c1.a);'
    		};
    	}

    	/** @ignore */
    	fragShaderSrc(gl) {
    		let gl2 = !(gl instanceof WebGLRenderingContext);
    		let operation = this.operations[this.mode];
    		return `

${gl2? 'in' : 'varying'} vec2 v_texcoord;

uniform sampler2D source1;
uniform sampler2D source2;

vec4 data() {
	vec4 c1 = texture(source1, v_texcoord);
	vec4 c2 = texture(source2, v_texcoord);
	vec4 color;
	${operation};
	return color;
}
`;
    	}

    	/** @ignore */
    	vertShaderSrc(gl) {
    		let gl2 = !(gl instanceof WebGLRenderingContext);
    		return `${gl2? '#version 300 es':''}


${gl2? 'in' : 'attribute'} vec4 a_position;
${gl2? 'in' : 'attribute'} vec2 a_texcoord;

${gl2? 'out' : 'varying'} vec2 v_texcoord;

void main() {
	gl_Position = a_position;
	v_texcoord = a_texcoord;
}`;
    	}
    }

    /**
     * **Controller** is a virtual base class that handles user interaction via device events (mouse/touch events).
     * It provides an abstract user interface to define interaction actions such as panning, pinching, tapping, etc...
     * The actions are implemented by pre-defined callback functions:
     * * `panStart(e)` intercepts the initial pan event (movement of the mouse after pressing a mouse button or moving a finger).
     * The event is captured calling `e.preventDefault()`.
     * * `panMove(e)` receives and handles the pan event.
     * * `panEnd(e)` intercepts the final pan event (the user releases the left mouse button or removes his finger from the screen).
     * * `pinchStart(e1, e2)` intercepts the initial pinch event (a continuous gesture that tracks the positions between the first two fingers that touch the screen).
     * The event is captured calling `e1.preventDefault()`.
     * * `pinchMove(e1,e2)` receives and handles the pinch event.
     * * `pinchEnd(e1,e2)` intercepts the final pinch event (the user removes one of their two fingers from the screen).
     * * `mouseWheel(e)` receives and handles the mouse wheel event (the user rotates the mouse wheel button).
     * * `fingerSingleTap(e)` receives and handles the single-tap event (the user presses a mouse button quickly or touches the screen shortly with a finger).
     * * `fingerDoubleTap(e)` receives and handles the double-tap event (the user quickly presses a mouse button twice or shortly touches the screen with a finger twice).
     * 
     * `e.preventDefault()` will capture the event and wont be propagated to other controllers.
     * 
     * This class only describes user interactions by implementing actions or callbacks. A **Controller** works in concert with a **PointerManager** object 
     * that emits events and links them to actions.
     * 
     * In the example below a **ControllerPanZoom** object (derived from **Controller**) is created and associated with the `pointerManager` of the `viewer`.
     * ```
     * const panzoom = new OpenLIME.ControllerPanZoom(viewer.camera, {
     *     priority: -1000,
     *     activeModifiers: [0, 1]
     * });
     * viewer.pointerManager.onEvent(panzoom);
     * ```	
     */
    class Controller {
    	/**
    	 * Instantiates a Controller object.
    	 * @param {Object} [options] An object literal with controller parameters.
    	 * @param {number} options.panDelay=50 Inertial value of the movement in ms for panning movements.
    	 * @param {number} options.zoomDelay=200 A zoom event is smoothed over this delay in ms,
    	 * @param {number} options.priority=0 Higher priority controllers are invoked first.
    	 */
    	constructor(options) {
    		Object.assign(this, {
    			active: true,
    			debug: false,
    			panDelay: 50,
    			zoomDelay: 200,
    			priority: 0,
    			activeModifiers: [0]
    		});

    		Object.assign(this, options);

    	}

    	/**
    	 * Returns the modifier state of the event `e`. Modifiers are keyboard events that happens simultaneously 
    	 * with a device event (e.g. shift + left mouse button).
    	 * The modifiers handled by a controller are:
    	 * * NoModifiers = 0
    	 * * CrtlModifier = 1
    	 * * ShiftModifier = 2
    	 * * AltModifier = 4
    	 * 
    	 * The modifier state is the sum of values above corresponding to the key pressed (CTRL, SHIFT or ALT).
    	 * @param {Event} e 
    	 * @returns {number} The modifier state.
    	 */
    	modifierState(e) {
    		let state = 0;
    		if(e.ctrlKey) state += 1;
    		if(e.shiftKey) state += 2;
    		if(e.altKey) state += 4;
    		
    		return state;
    	}

    	/** @ignore */
    	captureEvents() {
    		this.capture = true;
    	}

    	/** @ignore */
    	releaseEvents() {
    		this.capture = false;
    	}
    }

    /**
     * Callback invoked when the position (x, y) is updated.
     * @callback updatePosition
     * @param {number} x The x coordinate.
     * @param {number} y The y coordinate.
     */

    function clamp(value, min, max) {
    	return Math.max(min, Math.min(max, value));
    }

    /** **Controller2D** intercepts pan and single-tap events in the canvas and updates a 2D position (x, y) of the device pointer.
     * If `options.relative` is false the coordinates are both mapped between [-1, 1] with origin in the bottom left corner of the canvas, 
     * otherwise the coordinates have origin in the initial position of the panning and ranges both between [-1, 1] according to the distance
     * from the local origin (multiplied by a `options.speed` value).
     * When updated, the (x, y) position is passed to a `callback` for further custom computations.
     */
    class Controller2D extends Controller {
    	/**
    	 * Instantiates a Controller2D object.
    	 * @param {updatePosition} callback The callback invoked when the postion (x, y) is updated.
    	 * @param {Object} [options] An object literal with controller parameters.
    	 * @param {bool} options.relative=false Whether the coordinate system is local.
    	 * @param {number} options.speed=2.0 Enhancement factor for computation of local coordinates.
    	 */
    	constructor(callback, options) {
    		super(options);
    		Object.assign(this, { 
    			relative: false, 
    			speed: 2.0, 
    			start_x: 0, 
    			start_y: 0, 
    			current_x: 0, 
    			current_y: 0,
    			onPanStart: null,
    			onPanEnd: null
    		}, options);

    		//By default the controller is active only with no modifiers.
    		//you can select which subsets of the modifiers are active.
    		this.callback = callback;
    		
    		if(!this.box) { //FIXME What is that? Is it used?
    			this.box = new BoundingBox({xLow:-0.99, yLow: -0.99, xHigh: 0.99, yHigh: 0.99});
    		}

    		this.panning = false;
    	}

    	/**
    	 * Stores the final position for local coordinate system. This is a convenience function to be used in callback.
    	 * @param {number} x The x-axis coordinate.
    	 * @param {number} y The y-axis coordinate.
    	 */
    	setPosition(x, y) {
    		this.current_x = x;
    		this.current_y = y;
    		this.callback(x, y);
    	}

    	/*
    	 * Computes the mapping between the canvas pixel coordinates to [-1, 1].
    	 * @param {event} e The device event. 
    	 * @returns {{x, y}} The projected position.
    	 */
    	/** @ignore */
    	project(e) {
    		let rect = e.target.getBoundingClientRect();
    		let x = 2*e.offsetX/rect.width - 1;
    		let y = 2*(1 - e.offsetY/rect.height) -1;
    		return [x, y]
    	}

    	/** @ignore */
    	rangeCoords(e) {
    		let [x, y] = this.project(e);

    		if(this.relative) {
    			x = clamp(this.speed*(x - this.start_x) + this.current_x, -1, 1);
    			y = clamp(this.speed*(y - this.start_y) + this.current_y, -1, 1);
    		}
    		return [x, y];
    	}

    	/** @ignore */
    	panStart(e) {
    		if(!this.active || !this.activeModifiers.includes(this.modifierState(e)))
    			return;

    		if(this.relative) {
    			let [x, y] = this.project(e);
    			this.start_x = x;
    			this.start_y = y;
    		}
    		if(this.onPanStart)
    			this.onPanStart(...this.rangeCoords(e));
    		this.callback(...this.rangeCoords(e));
    		this.panning = true;
    		e.preventDefault();
    	}

    	/** @ignore */
    	panMove(e) {
    		if(!this.panning)
    			return false;
    		this.callback(...this.rangeCoords(e));
    	}

    	/** @ignore */
    	panEnd(e) {
    		if(!this.panning)
    			return false;
    		this.panning = false;
    		if(this.relative) {
    			let [x, y] = this.project(e);
    			this.current_x = clamp(this.speed*(x - this.start_x) + this.current_x, -1, 1);
    			this.current_y = clamp(this.speed*(y - this.start_y) + this.current_y, -1, 1);
    		}
    		if(this.onPanEnd)
    			this.onPanEnd(...this.rangeCoords(e));
    	}

    	/** @ignore */
    	fingerSingleTap(e) {
    		if(!this.active || !this.activeModifiers.includes(this.modifierState(e)))
    			return;
    		if(this.relative)
    			return;
    			
    		this.callback(...this.rangeCoords(e));
    		e.preventDefault();
    	}

    }

    /** **ControllerPanZoom** intercepts pan, zoom, single tap, and wheel events in the canvas and updates the scene camera parameters.
    */

    class ControllerPanZoom extends Controller {
    	/**
    	 * Instantiates a ControllerPanZoom object.
    	 * @param {Camera} camera The scene camera.
    	 * @param {Object} [options] An object literal with controller parameters.
    	 * @param {number} options.zoomAmount=1.2 The incremental value for zoom in/out.
    	 */
    	constructor(camera, options) {
    		super(options);

    		this.camera = camera;
    		this.zoomAmount = 1.2;          //for wheel or double tap event
    		this.controlZoom = false;       //require control+wheel to zoom
    		
    		this.panning = false;           //true if in the middle of a pan
    		this.initialTransform = null;
    		this.startMouse = null;

    		this.zooming = false;           //true if in the middle of a pinch
    		this.initialDistance = 0.0;
    		this.useGLcoords = false;

    		if(options)
    			Object.assign(this, options);
    	}

    	/** @ignore */
    	panStart(e) {
    		if(!this.active || this.panning || !this.activeModifiers.includes(this.modifierState(e)))
    			return;
    		this.panning = true;

    		this.startMouse = CoordinateSystem.fromCanvasHtmlToViewport({ x: e.offsetX, y: e.offsetY }, this.camera, this.useGLcoords);

    		let now = performance.now();
    		this.initialTransform = this.camera.getCurrentTransform(now);
    		this.camera.target = this.initialTransform.copy(); //stop animation.
    		e.preventDefault();
    	}

    	/** @ignore */
    	panMove(e) {
    		if (!this.panning)
    			return;

    		let m = this.initialTransform;
    		const p = CoordinateSystem.fromCanvasHtmlToViewport({ x: e.offsetX, y: e.offsetY }, this.camera, this.useGLcoords);
    		let dx = (p.x - this.startMouse.x);
    		let dy = (p.y - this.startMouse.y);
    		
    		this.camera.setPosition(this.panDelay, m.x + dx, m.y + dy, m.z, m.a);
    	}

    	/** @ignore */
    	panEnd(e) {
    		this.panning = false;
    	}

    	/** @ignore */
    	distance(e1, e2) {
    		return Math.sqrt(Math.pow(e1.x - e2.x, 2) + Math.pow(e1.y - e2.y, 2));
    	}

    	/** @ignore */
    	pinchStart(e1, e2) {
    		this.zooming = true;
    		this.initialDistance = Math.max(30, this.distance(e1, e2));
    		e1.preventDefault();
    		//e2.preventDefault(); //TODO this is optional?
    	}

    	/** @ignore */
    	pinchMove(e1, e2) {
    		if (!this.zooming)
    			return;
    		let rect1 = e1.target.getBoundingClientRect();
    		let offsetX1 = e1.clientX - rect1.left;
    		let offsetY1 = e1.clientY - rect1.top;
    		let rect2 = e2.target.getBoundingClientRect();
    		let offsetX2 = e2.clientX - rect2.left;
    		let offsetY2 = e2.clientY - rect2.top;
    		const scale = this.distance(e1, e2);
    		// FIXME CHECK ON TOUCH SCREEN
    		//const pos = this.camera.mapToScene((offsetX1 + offsetX2)/2, (offsetY1 + offsetY2)/2, this.camera.getCurrentTransform(performance.now()));
    		const pos = CoordinateSystem.fromCanvasHtmlToScene({ x: (offsetX1 + offsetX2)/2, y: (offsetY1 + offsetY2)/2 }, this.camera, this.useGLcoords);

    		const dz = scale/this.initialDistance;
    		this.camera.deltaZoom(this.zoomDelay, dz, pos.x, pos.y);
    		this.initialDistance = scale;
    		e1.preventDefault();
    	}

    	/** @ignore */
    	pinchEnd(e, x, y, scale) {
    		this.zooming = false;
    		e.preventDefault();
    	}

    	/** @ignore */
    	mouseWheel(e) {
    		if(this.controlZoom && !e.ctrlKey) {
    			this.emit('nowheel');
    			return;
    		}
    		let delta = -e.deltaY/53;
    		//const pos = this.camera.mapToScene(e.offsetX, e.offsetY, this.camera.getCurrentTransform(performance.now()));
    		const pos = CoordinateSystem.fromCanvasHtmlToScene({ x: e.offsetX, y: e.offsetY }, this.camera, this.useGLcoords);
    		const dz = Math.pow(this.zoomAmount, delta);		
    		this.camera.deltaZoom(this.zoomDelay, dz, pos.x, pos.y);
    		e.preventDefault();
    	}

    	/** @ignore */
    	fingerDoubleTap(e) {
    		if(!this.active || !this.activeModifiers.includes(this.modifierState(e)))
    			return;
    		//const pos = this.camera.mapToScene(e.offsetX, e.offsetY, this.camera.getCurrentTransform(performance.now()));
    		const pos = CoordinateSystem.fromCanvasHtmlToScene({ x: e.offsetX, y: e.offsetY }, this.camera, this.useGLcoords);

    		const dz = this.zoomAmount;
    		this.camera.deltaZoom(this.zoomDelay, dz, pos.x, pos.y);
    	}

    }
    addSignals(ControllerPanZoom, 'nowheel');

    /**
     * A **PointerManager** is a high-level class for handling simultaneous events from a DOM `target`. 
     * It captures PointerEvent (MouseEvent and TouchEvent) generated by the `target`, classifies them as "gestures" and provides a simple interface
     * to work with them. 
     * 
     * The high-level events (gestures) that are detected and emitted are:
     * * `fingerHover(e)` It is fired when a pointing device is used to move the cursor on the target 
     * * `fingerSingleTap(e)` It is fired when the user presses a mouse button quickly or touches the screen shortly with a finger
     * * `fingerDoubleTap(e)` It is fired when the user quickly presses a mouse button twice or shortly touches the screen with a finger twice.
     * * `fingerHold(e)` It is fired when the user keeps pressing a mouse button or touching the screen longer than a threshold (600 ms).
     * * `mouseWheel(e)` It is fired when the user rotates the mouse wheel button.
     * * `panStart(e)` It is fired when the pan gesture is starting.
     * * `panMove(e)` It is fired when the pan gesture is in progress.
     * * `panEnd(e)` It is fired when the pan gesture is finished.
     * * `pinchStart(e1, e2)` It is fired when the pinch gesture is starting.
     * * `pinchMove(e1, e2)` It is fired when the pinch gesture is in progress.
     * * `pinchEnd(e1, e2)` It is fired when the pinch gesture is finished.
     * 
     * In the following example a `pointerManager` object is created and connected to the `canvas`. Then a callback to handle a fingerSingleTap and a fingerHold event is defined
     * and connected to the `pointerManager`.
     * ```
     * const canvas = document.querySelector('canvas');
     * const pointerManager = new PointerManager(canvas);
     * const handler = {
     *     priority: 10,
     *     fingerSingleTap: (e) => {
     *         console.log("SINGLE TAP in ", e.clientX, e.clientY);
     *     });
     *     fingerHold: (e) => {
     *         console.log("FINGER HOLD in ", e.clientX, e.clientY);
     *     });
     * };
     * pointerManager.onEvent(handler);
     * ```
     */
    class PointerManager {
        /**
         * Instatiates a PointerManager object.
         * @param {HTMLElement} target The DOM element from which the events are generated
         * @param {Object} [options] An object literal with class parameters.
         * @param {number} options.diagonal=27 The diagonal of the screen (in inches).
         * @param {number} options.pinchMaxInterval=200 fingerDown event max distance in time to trigger a pinch (in ms).
         */
        constructor(target, options) {

            this.target = target;

            Object.assign(this, {
                diagonal: 27,                // Standard monitor 27"
                pinchMaxInterval: 200        // in ms, fingerDown event max distance in time to trigger a pinch.
            });

            if (options)
                Object.assign(this, options);

            this.idleTimeout = null;
            this.idleTime = 60; //in seconds
            this.idling = false;

            this.currentPointers = [];
            this.eventObservers = new Map();
            this.ppmm = PointerManager.getPPMM(this.diagonal);

            this.target.style.touchAction = "none";
            this.target.addEventListener('pointerdown', (e) => this.handleEvent(e), false);
            this.target.addEventListener('pointermove', (e) => this.handleEvent(e), false);
            this.target.addEventListener('pointerup', (e) => this.handleEvent(e), false);
            this.target.addEventListener('pointercancel', (e) => this.handleEvent(e), false);
            this.target.addEventListener('wheel', (e) => this.handleEvent(e), false);
        }

        ///////////////////////////////////////////////////////////
        /// Constants
        static get ANYPOINTER() { return -1; }

        ///////////////////////////////////////////////////////////
        /// Utilities

        static splitStr(str) {
            return str.trim().split(/\s+/g);
        }

        static getPPMM(diagonal) {
            // sqrt(w^2 + h^2) / diagonal / 1in
            return Math.round(Math.sqrt(screen.width **2  + screen.height **2) / diagonal / 25.4);
        }

        ///////////////////////////////////////////////////////////
        /// Class interface

        // register pointer handlers.
        on(eventTypes, obj, idx = PointerManager.ANYPOINTER) {
            eventTypes = PointerManager.splitStr(eventTypes);

            if (typeof (obj) == 'function') {
                obj = Object.fromEntries(eventTypes.map(e => [e, obj]));
                obj.priority = -1000;
            }

            eventTypes.forEach(eventType => {
                if (idx == PointerManager.ANYPOINTER) {
                    this.broadcastOn(eventType, obj);
                } else {
                    const p = this.currentPointers[idx];
                    if (!p) {
                        throw new Error("Bad Index");
                    }
                    p.on(eventType, obj);
                }
            });
            return obj;
        }

        // unregister pointer handlers
        off(eventTypes, callback, idx = PointerManager.ANYPOINTER) {
            if (idx == PointerManager.ANYPOINTER) {
                this.broadcastOff(eventTypes, callback);
            } else {
                PointerManager.splitStr(eventTypes).forEach(eventType => {
                    const p = this.currentPointers[idx];
                    if (!p) {
                        throw new Error("Bad Index");
                    }
                    p.off(eventType, callback);
                });
            }
        }

        /* Registers the callbacks */
        onEvent(handler) {
            const cb_properties = ['fingerHover', 'fingerSingleTap', 'fingerDoubleTap', 'fingerHold', 'mouseWheel', 'wentIdle', 'activeAgain'];
            if (!handler.hasOwnProperty('priority'))
                throw new Error("Event handler has not priority property");

            if (!cb_properties.some((e) => typeof (handler[e]) == 'function'))
                throw new Error("Event handler properties are wrong or missing");

            for (let e of cb_properties)
                if (typeof (handler[e]) == 'function') {
                    this.on(e, handler);
                }
            if(handler.panStart)
                this.onPan(handler);
            if(handler.pinchStart)
                this.onPinch(handler);
        }

        /* Registers the Pan callbacks */
        onPan(handler) {
            const cb_properties = ['panStart', 'panMove', 'panEnd'];
            if (!handler.hasOwnProperty('priority'))
                throw new Error("Event handler has not priority property");

            if (!cb_properties.every((e) => typeof (handler[e]) == 'function'))
                throw new Error("Pan handler is missing one of this functions: panStart, panMove or panEnd");

            handler.fingerMovingStart = (e) => {
                handler.panStart(e);
                if (!e.defaultPrevented) return;
                 this.on('fingerMoving', (e1) => {
                    handler.panMove(e1);
                }, e.idx);
                this.on('fingerMovingEnd', (e2) => {
                    handler.panEnd(e2);
                }, e.idx);
            };
            this.on('fingerMovingStart', handler);
        }

        /* Registers the Pinch callbacks */
        onPinch(handler) {
            const cb_properties = ['pinchStart', 'pinchMove', 'pinchEnd'];
            if (!handler.hasOwnProperty('priority'))
                throw new Error("Event handler has not priority property");

            if (!cb_properties.every((e) => typeof (handler[e]) == 'function'))
                throw new Error("Pinch handler is missing one of this functions: pinchStart, pinchMove or pinchEnd");

            handler.fingerDown = (e1) => {
                //find other pointers not in moving status
                const filtered = this.currentPointers.filter(cp => cp && cp.idx != e1.idx && cp.status == cp.stateEnum.DETECT);
                if (filtered.length == 0) return;

                //for each pointer search for the last fingerDown event.
                const fingerDownEvents = [];
                for (let cp of filtered) {
                    let down = null;
                    for (let e of cp.eventHistory.toArray())
                        if (e.fingerType == 'fingerDown')
                            down = e;
                    if (down)
                        fingerDownEvents.push(down);
                }
                //we start from the closest one
                //TODO maybe we should sort by distance instead.
                fingerDownEvents.sort((a, b) => b.timeStamp - a.timeStamp);
                for (let e2 of fingerDownEvents) {
                    if (e1.timeStamp - e2.timeStamp > this.pinchMaxInterval) break; 

                    handler.pinchStart(e1, e2);
                    if (!e1.defaultPrevented) break;

                    clearTimeout(this.currentPointers[e1.idx].timeout);
                    clearTimeout(this.currentPointers[e2.idx].timeout);

                    this.on('fingerMovingStart', (e) => e.preventDefault(), e1.idx); //we need to capture this event (pan conflict)
                    this.on('fingerMovingStart', (e) => e.preventDefault(), e2.idx);
                    this.on('fingerMoving',      (e) => e2 && handler.pinchMove(e1 = e, e2), e1.idx); //we need to assign e1 and e2, to keep last position.
                    this.on('fingerMoving',      (e) => e1 && handler.pinchMove(e1, e2 = e), e2.idx);

                    this.on('fingerMovingEnd', (e) => {
                        if (e2)
                            handler.pinchEnd(e, e2);
                        e1 = e2 = null;
                    }, e1.idx);
                    this.on('fingerMovingEnd', (e) => {
                        if (e1)
                            handler.pinchEnd(e1, e);
                        e1 = e2 = null;
                    }, e2.idx);

                    break;
                }
            };
            this.on('fingerDown', handler);
        }
        ///////////////////////////////////////////////////////////
        /// Implementation stuff

        // register broadcast handlers
        broadcastOn(eventType, obj) {
            const handlers = this.eventObservers.get(eventType);
            if (handlers)
                handlers.push(obj);
            else
                this.eventObservers.set(eventType, [obj]);
        }

        // unregister broadcast handlers
        broadcastOff(eventTypes, obj) {
            PointerManager.splitStr(eventTypes).forEach(eventType => {
                if (this.eventObservers.has(eventType)) {
                    if (!obj) {
                        this.eventObservers.delete(eventType);
                    } else {
                        const handlers = this.eventObservers.get(eventType);
                        const index = handlers.indexOf(obj);
                        if (index > -1) {
                            handlers.splice(index, 1);
                        }
                        if (handlers.length == 0) {
                            this.eventObservers.delete(eventType);
                        }
                    }
                }
            });
        }

        // emit broadcast events
        broadcast(e) {
            if (!this.eventObservers.has(e.fingerType)) return;
            this.eventObservers.get(e.fingerType)
                .sort((a, b) => b.priority - a.priority)
                .every(obj => {
                    obj[e.fingerType](e);
                    return !e.defaultPrevented;
                });  // the first obj returning a defaultPrevented event breaks the every loop
        }

        addCurrPointer(cp) {
            let result = -1;
            for (let i = 0; i < this.currentPointers.length && result < 0; i++) {
                if (this.currentPointers[i] == null) {
                    result = i;
                }
            }
            if (result < 0) {
                this.currentPointers.push(cp);
                result = this.currentPointers.length - 1;
            } else {
                this.currentPointers[result] = cp;
            }

            return result;
        }

        removeCurrPointer(index) {
            this.currentPointers[index] = null;
            while ((this.currentPointers.length > 0) && (this.currentPointers[this.currentPointers.length - 1] == null)) {
                this.currentPointers.pop();
            }
        }

        handleEvent(e) {
            //IDLING MANAGEMENT
            if(this.idling) {
                this.broadcast({ fingerType: 'activeAgain' });
                this.idling = false;

            } else {
                if(this.idleTimeout)
                    clearTimeout(this.idleTimeout);

                this.idleTimeout = setTimeout(() => {
                    this.broadcast({ fingerType: 'wentIdle'});
                    this.idling = true;
                }, this.idleTime*1000);
            }

            if (e.type == 'pointerdown') this.target.setPointerCapture(e.pointerId);
            if (e.type == 'pointercancel') console.log(e);

            let handled = false;
            for (let i = 0; i < this.currentPointers.length && !handled; i++) {
                const cp = this.currentPointers[i];
                if (cp) {
                    handled = cp.handleEvent(e);
                    if (cp.isDone())
                        this.removeCurrPointer(i);
                }
            }
            if (!handled) {
                const cp = new SinglePointerHandler(this, e.pointerId, { ppmm: this.ppmm });
                handled = cp.handleEvent(e);
            }
            //e.preventDefault();
        }

    }

    class SinglePointerHandler {
        constructor(parent, pointerId, options) {

            this.parent = parent;
            this.pointerId = pointerId;

            Object.assign(this, {
                ppmm: 3, // 27in screen 1920x1080 = 3 ppmm
            });
            if (options)
                Object.assign(this, options);

            this.eventHistory = new CircularBuffer(10);
            this.isActive = false;
            this.startTap = 0;
            this.threshold = 15; // 15mm

            this.eventObservers = new Map();
            this.isDown = false;
            this.done = false;

            this.stateEnum = {
                IDLE: 0,
                DETECT: 1,
                HOVER: 2,
                MOVING_START: 3,
                MOVING: 4,
                MOVING_END: 5,
                HOLD: 6,
                TAPS_DETECT: 7,
                SINGLE_TAP: 8,
                DOUBLE_TAP_DETECT: 9,
                DOUBLE_TAP: 10,
            };
            this.status = this.stateEnum.IDLE;
            this.timeout = null;
            this.holdTimeoutThreshold = 600;
            this.tapTimeoutThreshold = 100;
            this.oldDownPos = { clientX: 0, clientY: 0 };
            this.movingThreshold = 1; // 1mm
            this.idx = this.parent.addCurrPointer(this);
        }

        ///////////////////////////////////////////////////////////
        /// Utilities

        static distance(x0, y0, x1, y1) {
            return Math.sqrt((x1 - x0) ** 2 + (y1 - y0) ** 2);
        }

        distanceMM(x0, y0, x1, y1) {
            return SinglePointerHandler.distance(x0, y0, x1, y1) / this.ppmm;
        }

        ///////////////////////////////////////////////////////////
        /// Class interface

        on(eventType, obj) {
            this.eventObservers.set(eventType, obj);
        }

        off(eventType) {
            if (this.eventObservers.has(eventType)) {
                this.eventObservers.delete(eventType);
            }
        }

        ///////////////////////////////////////////////////////////
        /// Implementation stuff

        addToHistory(e) {
            this.eventHistory.push(e);
        }

        prevPointerEvent() {
            return this.eventHistory.last();
        }

        handlePointerDown(e) {
            this.startTap = e.timeStamp;
        }

        handlePointerUp(e) {
            e.timeStamp - this.startTap;
        }

        isLikelySamePointer(e) {
            let result = this.pointerId == e.pointerId;
            if (!result && !this.isDown && e.type == "pointerdown") {
                const prevP = this.prevPointerEvent();
                if (prevP) {
                    result = (e.pointerType == prevP.pointerType) && this.distanceMM(e.clientX, e.clientY, prevP.clientX, prevP.clientY) < this.threshold;
                }
            }
            return result;
        }

        // emit+broadcast
        emit(e) {
            if (this.eventObservers.has(e.fingerType)) {
                this.eventObservers.get(e.fingerType)[e.fingerType](e);
                if (e.defaultPrevented) return;
            }
            this.parent.broadcast(e);
        }

        // output Event, speed is computed only on pointermove
        createOutputEvent(e, type) {
            const result = e;
            result.fingerType = type;
            result.originSrc = this.originSrc;
            result.speedX = 0;
            result.speedY = 0;
            result.idx = this.idx;
            const prevP = this.prevPointerEvent();
            if (prevP && (e.type == 'pointermove')) {
                const dt = result.timeStamp - prevP.timeStamp;
                if (dt > 0) {
                    result.speedX = (result.clientX - prevP.clientX) / dt * 1000.0;  // px/s
                    result.speedY = (result.clientY - prevP.clientY) / dt * 1000.0;  // px/s
                }
            }
            return result;
        }

        // Finite State Machine
        processEvent(e) {
            let distance = 0;
            if (e.type == "pointerdown") {
                this.oldDownPos.clientX = e.clientX;
                this.oldDownPos.clientY = e.clientY;
                this.isDown = true;
            }
            if (e.type == "pointerup" || e.type == "pointercancel") this.isDown = false;
            if (e.type == "pointermove" && this.isDown) {
                distance = this.distanceMM(e.clientX, e.clientY, this.oldDownPos.clientX, this.oldDownPos.clientY);
            }

            if (e.type == "wheel") {
                this.emit(this.createOutputEvent(e, 'mouseWheel'));
                return;
            }

            switch (this.status) {
                case this.stateEnum.HOVER:
                case this.stateEnum.IDLE:
                    if (e.type == 'pointermove') {
                        this.emit(this.createOutputEvent(e, 'fingerHover'));
                        this.status = this.stateEnum.HOVER;
                        this.originSrc = e.composedPath()[0];
                    } else if (e.type == 'pointerdown') {
                        this.status = this.stateEnum.DETECT;
                        this.emit(this.createOutputEvent(e, 'fingerDown'));
                        if (e.defaultPrevented) { // An observer captured the fingerDown event
                            this.status = this.stateEnum.MOVING;
                            break;
                        }
                        this.originSrc = e.composedPath()[0];
                        this.timeout = setTimeout(() => {
                            this.emit(this.createOutputEvent(e, 'fingerHold'));
                            if(e.defaultPrevented) this.status = this.stateEnum.IDLE;
                        }, this.holdTimeoutThreshold);
                    }
                    break;
                case this.stateEnum.DETECT:
                    if (e.type == 'pointercancel') { /// For Firefox
                        clearTimeout(this.timeout);
                        this.status = this.stateEnum.IDLE;
                        this.emit(this.createOutputEvent(e, 'fingerHold'));
                    } else if (e.type == 'pointermove' && distance > this.movingThreshold) {
                        clearTimeout(this.timeout);
                        this.status = this.stateEnum.MOVING;
                        this.emit(this.createOutputEvent(e, 'fingerMovingStart'));
                    } else if (e.type == 'pointerup') {
                        clearTimeout(this.timeout);
                        this.status = this.stateEnum.TAPS_DETECT;
                        this.timeout = setTimeout(() => {
                            this.status = this.stateEnum.IDLE;
                            this.emit(this.createOutputEvent(e, 'fingerSingleTap'));
                        }, this.tapTimeoutThreshold);
                    }
                    break;
                case this.stateEnum.TAPS_DETECT:
                    if (e.type == 'pointerdown') {
                        clearTimeout(this.timeout);
                        this.status = this.stateEnum.DOUBLE_TAP_DETECT;
                        this.timeout = setTimeout(() => {
                            this.emit(this.createOutputEvent(e, 'fingerHold'));
                            if(e.defaultPrevented) this.status = this.stateEnum.IDLE;
                        }, this.tapTimeoutThreshold);
                    } else if (e.type == 'pointermove' && distance > this.movingThreshold) {
                        clearTimeout(this.timeout);
                        this.status = this.stateEnum.IDLE;
                        this.emit(this.createOutputEvent(e, 'fingerHover'));
                    }
                    break;
                case this.stateEnum.DOUBLE_TAP_DETECT:
                    if (e.type == 'pointerup' || e.type == 'pointercancel') {
                        clearTimeout(this.timeout);
                        this.status = this.stateEnum.IDLE;
                        this.emit(this.createOutputEvent(e, 'fingerDoubleTap'));
                    }
                    break;
                case this.stateEnum.DOUBLE_TAP_DETECT:
                    if (e.type == 'pointermove' && distance > this.movingThreshold) {
                        this.status = this.stateEnum.MOVING;
                        this.emit(this.createOutputEvent(e, 'fingerMovingStart'));
                    }
                    break;
                case this.stateEnum.MOVING:
                    if (e.type == 'pointermove') {
                        // Remain MOVING
                        this.emit(this.createOutputEvent(e, 'fingerMoving'));
                    } else if (e.type == 'pointerup' || e.type == 'pointercancel') {
                        this.status = this.stateEnum.IDLE;
                        this.emit(this.createOutputEvent(e, 'fingerMovingEnd'));
                    }
                    break;
                default:
                    console.log("ERROR " + this.status);
                    console.log(e);
                    break;
            }

            this.addToHistory(e);
        }

        handleEvent(e) {
            let result = false;
            if (this.isLikelySamePointer(e)) {
                this.pointerId = e.pointerId; //it's mine
                this.processEvent(e);
                result = true;
            }
            return result;
        }

        isDone() {
            return this.status == this.stateEnum.IDLE;
        }

    }

    class CircularBuffer {
        constructor(capacity) {
            if (typeof capacity != "number" || !Number.isInteger(capacity) || capacity < 1)
                throw new TypeError("Invalid capacity");
            this.buffer = new Array(capacity);
            this.capacity = capacity;
            this.first = 0;
            this.size = 0;
        }

        clear() {
            this.first = 0;
            this.size = 0;
        }

        empty() {
            return this.size == 0;
        }

        size() {
            return this.size;
        }

        capacity() {
            return this.capacity;
        }

        first() {
            let result = null;
            if (this.size > 0) result = this.buffer[this.first];
            return result;
        }

        last() {
            let result = null;
            if (this.size > 0) result = this.buffer[(this.first + this.size - 1) % this.capacity];
            return result;
        }

        enqueue(v) {
            this.first = (this.first > 0) ? this.first - 1 : this.first = this.capacity - 1;
            this.buffer[this.first] = v;
            if (this.size < this.capacity) this.size++;
        }

        push(v) {
            if (this.size == this.capacity) {
                this.buffer[this.first] = v;
                this.first = (this.first + 1) % this.capacity;
            } else {
                this.buffer[(this.first + this.size) % this.capacity] = v;
                this.size++;
            }
        }

        dequeue() {
            if (this.size == 0) throw new RangeError("Dequeue on empty buffer");
            const v = this.buffer[(this.first + this.size - 1) % this.capacity];
            this.size--;
            return v;
        }

        pop() {
            return this.dequeue();
        }

        shift() {
            if (this.size == 0) throw new RangeError("Shift on empty buffer");
            const v = this.buffer[this.first];
            if (this.first == this.capacity - 1) this.first = 0; else this.first++;
            this.size--;
            return v;
        }

        get(start, end) {
            if (this.size == 0 && start == 0 && (end == undefined || end == 0)) return [];
            if (typeof start != "number" || !Number.isInteger(start) || start < 0) throw new TypeError("Invalid start value");
            if (start >= this.size) throw new RangeError("Start index past end of buffer: " + start);

            if (end == undefined) return this.buffer[(this.first + start) % this.capacity];

            if (typeof end != "number" || !Number.isInteger(end) || end < 0) throw new TypeError("Invalid end value");
            if (end >= this.size) throw new RangeError("End index past end of buffer: " + end);

            if (this.first + start >= this.capacity) {
                start -= this.capacity;
                end -= this.capacity;
            }
            if (this.first + end < this.capacity)
                return this.buffer.slice(this.first + start, this.first + end + 1);
            else
                return this.buffer.slice(this.first + start, this.capacity).concat(this.buffer.slice(0, this.first + end + 1 - this.capacity));
        }

        toArray() {
            if (this.size == 0) return [];
            return this.get(0, this.size - 1);
        }

    }

    /** **Viewer** is the central class of the OpenLIME framework. It is used to create a viewer on a web page and manipulate it.
     * In the following example, after instantiating a Viewer, a LayerImage is added to it.
     * ```
     * // Create an OpenLIME canvas into .openlime
     * const lime = new OpenLIME.Viewer('.openlime');
     *
     * // Create an image layer and add it to the canvans
     * const layer = new OpenLIME.Layer({
     *     layout: 'image',
     *     type: 'image',
     *     url: '../../assets/lime/image/lime.jpg'
     * });
     * lime.addLayer('Base', layer);
     * 
     * // Access to internal structures
     * const camera = lime.camera;
     * const canvas = lime.canvas;
     * const layers = canvas.layers;
     * ```
    */
    class Viewer {
    	/**
    	 * Instantiates a viewer object given the `div` element or a DOM selector of a `div` element.
    	 * Additionally, an object literal with Viewer `options` can be specified.
    	 * The class creates the canvas, enables the WebGL context and takes care of the content redrawing when needed.
    	 * Viewer is the main class of the OpenLIME framework. It allows access to all the internal structures that make up the system.
    	 * 
    	 * @param {(HTMLElement|string)} div A DOM element or a selector (es. '#openlime' or '.openlime').
    	 * @param {Object} [options]  An object literal describing the viewer content.
    	 * @param {color} options.background CSS style for background (it overwrites CSS if present).
    	 * @param {bool} options.autofit=true Whether the initial position of the camera is set to fit the scene model.
    	*/
    	constructor(div, options) {

    		Object.assign(this, {
    			background: null,
    			autofit: true,
    			canvas: {},
    			camera: new Camera(),
    		});
    		if (typeof (div) == 'string')
    			div = document.querySelector(div);

    		if (!div)
    			throw "Missing element parameter";

    		Object.assign(this, options);
    		if (this.background)
    			div.style.background = this.background;

    		this.containerElement = div;
    		this.canvasElement = div.querySelector('canvas');
    		if (!this.canvasElement) {
    			this.canvasElement = document.createElement('canvas');
    			div.prepend(this.canvasElement);
    		}

    		this.overlayElement = document.createElement('div');
    		this.overlayElement.classList.add('openlime-overlay');
    		this.containerElement.appendChild(this.overlayElement);

    		this.canvas = new Canvas(this.canvasElement, this.overlayElement, this.camera, this.canvas);
    		this.canvas.addEvent('update', () => { this.redraw(); });

    		if (this.autofit)
    			this.canvas.addEvent('updateSize', () => this.camera.fitCameraBox(0));

    		this.pointerManager = new PointerManager(this.overlayElement);

    		this.canvasElement.addEventListener('contextmenu', (e) => {
    			e.preventDefault();
    			return false;
    		});

    		let resizeobserver = new ResizeObserver(entries => {
    			for (let entry of entries) {
    				this.resize(entry.contentRect.width, entry.contentRect.height);
    			}
    		});
    		resizeobserver.observe(this.canvasElement);

    		this.resize(this.canvasElement.clientWidth, this.canvasElement.clientHeight);

    	}

    	/**
    	 * Adds a device event controller to the viewer.
    	 * @param {Controller} controller An OpenLIME controller.
    	 */
    	addController(controller) {
    		this.pointerManager.onEvent(controller);
    	}

    	/** Adds the given layer to the Viewer.
    	* @param {string} id A label to identify the layer.
    	* @param {Layer} layer An OpenLIME Layer object.
    	*/
    	addLayer(id, layer) {
    		this.canvas.addLayer(id, layer);
    		this.redraw();
    	}

    	/** Remove the given layer from the Viewer.
    	* @param {(Layer|string)} layer An OpenLIME Layer or a Layer identifier.
    	*/
    	removeLayer(layer) {
    		if (typeof (layer) == 'string')
    			layer = this.canvas.layers[layer];
    		if (layer) {
    			this.canvas.removeLayer(layer);
    			this.redraw();
    		}
    	}

    	/* Resizes the canvas (and the overlay) and triggers a redraw.
    	 * This method is internal and used by a ResizeObserver of the Canvas size.
    	 * @param {number} width A width value defined in CSS pixel.
    	 * @param {number} height A height value defined in CSS pixel.
    	*/
    	/**
    	 * @ignore
    	*/
    	resize(width, height) {
    		// Test with retina display!
    		this.canvasElement.width = width * window.devicePixelRatio;
    		this.canvasElement.height = height * window.devicePixelRatio;

    		let view = { x: 0, y: 0, dx: width, dy: height, w: width, h: height };
    		this.camera.setViewport(view);
    		this.emit('resize', view);

    		this.canvas.prefetch();
    		this.redraw();
    	}

    	/**
    	 * Schedules a redrawing.
    	*/
    	redraw() {
    		if (this.animaterequest) return;
    		this.animaterequest = requestAnimationFrame((time) => { this.draw(time); });
    		this.requestTime = performance.now();
    	}

    	/*
    	 * Renders the canvas content.
    	 * This method is internal.
    	 * @param {time} time The current time (a DOMHighResTimeStamp variable, as in `performance.now()`).
    	*/
    	/**
    	* @ignore
       */
    	draw(time) {
    		if (!time) time = performance.now();
    		this.animaterequest = null;

    		let elapsed = performance.now() - this.requestTime;
    		this.canvas.addRenderTiming(elapsed);
    		
    		this.camera.viewport;
    		this.camera.getCurrentTransform(time);

    		let done = this.canvas.draw(time);
    		if (!done)
    			this.redraw();
    		this.emit('draw');
    	}
    }

    addSignals(Viewer, 'draw');
    addSignals(Viewer, 'resize'); //args: viewport

    let url = 'skin/skin.svg';
    let svg = null;
    let pad = 5;

    /**
     * The static class **Skin** implements some utilities for handling the skin file.
     * A skin file is a SVG file containing SVG icons that are used by **UIBasic*
     * for customizing the visual appearance of the user interface (i.e., icons for buttons, menu, toolbar, dialog...).
     * Each SVG drawing element must be tagged with a 'class' attribute  whose name must begin with *openlime-*:
     * for instance, the HOME icon is a SVG element tagged with `class="openlime-home"`. 
     */
    class Skin {
    	/**
    	 * Sets the URL of the SVG skin file. By default it is *'skin/skin.svg'*;
    	 * @param {string} u The URL of the SVG skin file.
    	 */
    	static setUrl(u) { url = u; }

    	/**
    	 * Loads the SVG skin file and converts it into a global DOM SVGElement ready for use in a web page.
    	 */
    	static async loadSvg() {
    		var response = await fetch(url);
    		if (!response.ok) {
    			throw Error("Failed loading " + url + ": " + response.statusText);
    		}

    		let text = await response.text();
    		let parser = new DOMParser();
    		svg = parser.parseFromString(text, "image/svg+xml").documentElement;
    	}

    	/**
    	 * Gets the SVG element with a specific CSS `selector`.
    	 * @param {string} selector A CSS selector (e.g. a class name).
    	 * @returns {SVGElement} The SVGElement referenced by the selector.
    	 */
    	static async getElement(selector) {
    		if (!svg)
    			await Skin.loadSvg();
    		return svg.querySelector(selector).cloneNode(true);
    	}

    	/**
    	 * Appends the selected SVG element to the `container`.
    	 * @param {HTMLElement} container A HTML DOM node.
    	 * @param {SVGElement|string} elm An SVGElement or a CSS selector (e.g. a class name).
    	 * @returns {SVGElement} A pointer to the SVG icon referenced by the elm.
    	 */
    	static async appendIcon(container, icon) {
    		let element = null;
    		if (typeof icon == 'string') {
    			element = await Skin.getElement(icon);
    			icon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    			icon.appendChild(element);
    			container.appendChild(icon);
    			let box = element.getBBox();
    			let tlist = element.transform.baseVal;
    			if (tlist.numberOfItems == 0)
    				tlist.appendItem(icon.createSVGTransform());
    			tlist.getItem(0).setTranslate(-box.x, -box.y);
    			icon.setAttribute('viewBox', `${-pad} ${-pad} ${box.width + 2 * pad} ${box.height + 2 * pad}`);
    			icon.setAttribute('preserveAspectRatio', 'xMidYMid meet');
    		} else {
    			container.appendChild(icon);
    			let box = icon.getBBox();
    			icon.setAttribute('viewBox', `${-pad} ${-pad} ${box.width + 2 * pad} ${box.height + 2 * pad}`);
    			icon.setAttribute('preserveAspectRatio', 'xMidYMid meet');
    		}
    		return icon;
    	 }
    }

    /* units are those in use, scale and ruler will pick the appropriate unit 
       allUnits contains all of the known units */

    class Units {
        constructor(options) {
            this.units = ["km", "m", "cm", "mm"],
            this.allUnits = { "mm": 1, "cm": 10, "m": 1000, "km": 1e6, "in": 254, "ft": 254*12,  };
            this.precision = 2;
            if(options)
                Object.assign(options, this);
        }

        format(d, unit) {
    		if(d == 0)
    			return '';
            if(unit)
                return (d/this.allUnits[unit]).toFixed(this.precision) + unit;
            
            let best_u = null;
            let best_penalty = 100;
            for(let u of this.units) {
                let size = this.allUnits[u];
                let penalty = d <= 0 ? 0 : Math.abs(Math.log10(d/size)-1);
                if(penalty < best_penalty) {
                    best_u = u;
                    best_penalty = penalty;
                }
            }
            return this.format(d, best_u);
        }
    }

    class ScaleBar extends Units {
        constructor(pixelSize, viewer, options) {
    		super(options);
            options = Object.assign(this, {
                pixelSize: pixelSize,
                viewer: viewer,
                width: 200,
                fontSize: 24,
    			precision: 0
            }, options);
    		Object.assign(this, options);

    		this.svg = Util.createSVGElement('svg', { viewBox: `0 0 ${this.width} 30` });
    		this.svg.classList.add('openlime-scale');

    		this.line = Util.createSVGElement('line', { x1: 5, y1: 26.5, x2:this.width - 5, y2: 26.5 });

    		this.text = Util.createSVGElement('text', { x: '50%', y: '16px', 'dominant-basiline': 'middle', 'text-anchor': 'middle' });
    		this.text.textContent = "";
    		
    		this.svg.appendChild(this.line);
    		this.svg.appendChild(this.text);
    		this.viewer.containerElement.appendChild(this.svg);
    		this.viewer.addEvent('draw', () => { this.updateScale(); });
        }

    	/** @ignore */
    	updateScale() {
    		//let zoom = this.viewer.camera.getCurrentTransform(performance.now()).z;
    		let zoom = this.viewer.camera.target.z;
    		if (zoom == this.lastScaleZoom)
    			return;
    		this.lastScaleZoom = zoom;
    		let s = this.bestLength(this.width/2, this.width, this.pixelSize, zoom);

    		let margin = this.width - s.length;
    		this.line.setAttribute('x1', margin / 2);
    		this.line.setAttribute('x2', this.width - margin/2);
    		this.text.textContent = this.format(s.label);
    	}
    	

        //find best length for scale from min -> max
    	//zoom 2 means a pixel in image is now 2 pixel on screen, scale is
    	/** @ignore */
    	bestLength(min, max, pixelSize, zoom) {
    		pixelSize /= zoom;
    		//closest power of 10:
    		let label10 = Math.pow(10, Math.floor(Math.log(max * pixelSize) / Math.log(10)));
    		let length10 = label10 / pixelSize;
    		if (length10 > min) return { length: length10, label: label10 };

    		let label20 = label10 * 2;
    		let length20 = length10 * 2;
    		if (length20 > min) return { length: length20, label: label20 };

    		let label50 = label10 * 5;
    		let length50 = length10 * 5;

    		if (length50 > min) return { length: length50, label: label50 };
    		return { length: 0, label: 0 }
    	}
    }

    /* color is specified in the css under the .openlime-ruler selector */

    class Ruler extends Units {
    	constructor(viewer, pixelSize, options) {
    		super(options);
    		Object.assign(this, {
    			viewer: viewer,
    			camera: viewer.camera,
    			overlay: viewer.overlayElement,
    			pixelSize: pixelSize,
    			enabled: false,
    			priority: 100,
    			measure: null, //current measure
    			history: [],  //past measures
    			fontSize: 18,
    			markerSize: 8,
    			cursor: "crosshair",

    			svg: null,
    			first: null,
    			second: null
    		});
    		if(options)
    			Object.assign(this, options);
    	}
    	
    	start() {
    		this.enabled = true;
    		this.previousCursor = this.overlay.style.cursor;
    		this.overlay.style.cursor = this.cursor;

    		if(!this.svg) {
    			this.svg = Util.createSVGElement('svg', { class: 'openlime-ruler'} );
    			this.svgGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    			this.svg.append(this.svgGroup);
    			this.overlay.appendChild(this.svg);
    			this.viewer.addEvent('draw', () => this.update());
    			this.update();
    		}
    	}

    	end() {
    		this.enabled = false;
    		this.overlay.style.cursor = this.previousCursor;
    		this.clear();
    	}
    	
    	clear() {
    		this.svgGroup.replaceChildren([]);
    		this.measure = null;
    		this.history = [];
    	}

    	/*finish() {
    		let m = this.measure;
    		m.line = Util.createSVGElement('line', { x1: m.x1, y1: m.y1, x2: m.x2, y2: m.y2 });
    		this.svgGroup.appendChild(m.line);

    		m.text = Util.createSVGElement('text');
    		m.text.textContent = this.format(this.length(m));
    		this.svgGroup.appendChild(m.text);

    		this.history.push(m);
    		this.measure = null;
    		this.update();
    	}*/

    	/** @ignore */
    	update() {
    		if(!this.history.length)
    			return;
    		//if not enabled skip
    		let t = this.camera.getGlCurrentTransform(performance.now());
    		let viewport = this.camera.glViewport();
    		this.svg.setAttribute('viewBox', `${-viewport.w / 2} ${-viewport.h / 2} ${viewport.w} ${viewport.h}`);
    		let c = {x:0, y:0}; //this.boundingBox().corner(0);
    		this.svgGroup.setAttribute("transform",
    			`translate(${t.x} ${t.y}) rotate(${-t.a} 0 0) scale(${t.z} ${t.z}) translate(${c.x} ${c.y})`);

    		for(let m of this.history) 
    			this.updateMeasure(m, t);
    	}

    	/** @ignore */
    	createMarker(x, y) {
    		let m = Util.createSVGElement("path");
    		this.svgGroup.appendChild(m);
    		return m;
    	}

    	/** @ignore */
    	updateMarker(marker, x, y, size) {
    		let d = `M ${x-size} ${y} L ${x+size} ${y} M ${x} ${y-size} L ${x} ${y+size}`;
    		marker.setAttribute('d', d);
    	}

    	/** @ignore */
    	updateText(measure, fontsize) {
    		measure.text.setAttribute('font-size', fontsize + "px");
    		
    		let dx = measure.x1 - measure.x2;
    		let dy = measure.y1 - measure.y2;

    		let length = Math.sqrt(dx*dx + dy*dy);
    		if(length > 0) {
    			dx /= length;
    			dy /= length;
    		}
    		if(dx < 0) {
    			dx = -dx;
    			dy = -dy;
    		}

    		let mx = (measure.x1 + measure.x2)/2;
    		let my = (measure.y1 + measure.y2)/2;
    		if(dy/dx < 0) {
    			mx -= 0.25*dy*fontsize;
    			my += dx*fontsize;
    		} else {
    			my -= 0.25*fontsize;
    			mx += 0.25*fontsize;
    		}
    		measure.text.setAttribute('x', mx);
    		measure.text.setAttribute('y', my);
    		measure.text.textContent = this.format(length*this.pixelSize);
    	}

    	/** @ignore */
    	createMeasure(x, y) {
    		let m = {
    			marker1: this.createMarker(x, y), 
    			x1: x, y1: y,
    			marker2: this.createMarker(x, y), 
    			x2: x, y2: y
    		};
    		m.line = Util.createSVGElement('line', { x1: m.x1, y1: m.y1, x2: m.x2, y2: m.y2 });
    		this.svgGroup.appendChild(m.line);

    		m.text = Util.createSVGElement('text');
    		m.text.textContent = '';
    		this.svgGroup.appendChild(m.text);

    		return m;
    	}

    	/** @ignore */
    	updateMeasure(measure, transform) {
    		let markersize = window.devicePixelRatio*this.markerSize/transform.z;

    		this.updateMarker(measure.marker1, measure.x1, measure.y1, markersize);

    		this.updateMarker(measure.marker2, measure.x2, measure.y2, markersize);

    		let fontsize = window.devicePixelRatio*this.fontSize/transform.z;
    		this.updateText(measure, fontsize);

    		for(let p of ['x1', 'y1', 'x2', 'y2'])
    			measure.line.setAttribute(p, measure[p]);
    	}

    	/** @ignore */
    	fingerSingleTap(e) { 
    		if(!this.enabled)
    			return false;

    		let transform = this.camera.getCurrentTransform(performance.now());
    		let {x, y}  = this.camera.mapToScene(e.layerX, e.layerY, transform);

    		
    		if(!this.measure) {
    			this.measure = this.createMeasure(x, y);
    			this.history.push(this.measure);
    		} else {
    			this.measure.x2 = x;
    			this.measure.y2 = y;
    			this.measure = null;
    		}
    		this.update();
    		e.preventDefault();
    	}
    	/** @ignore */
    	fingerHover(e) {
    		if(!this.enabled || !this.measure)
    			return false;

    		let transform = this.camera.getCurrentTransform(performance.now());
    		let {x, y}  = this.camera.mapToScene(e.layerX, e.layerY, transform);
    		this.measure.x2 = x;
    		this.measure.y2 = y;
    		this.update();	
    		e.preventDefault();
    	}
    }

    /**
     * An Action describes the behaviour of a tool button.
     * @typedef {Object} UIBasic#Action
     * @property {string} title The nameof the action.
     * @property {bool} display Whether to show the action in the toolbar.
     * @property {string} key The shortcut key.
     * @property {callback} task The callback executed by the action.
     */

    /**
     * A MenuEntry describes an entry for the menu.
     * @typedef {Object} UIBasic#Action
     * @property {string} title The menu title.
     * @property {string} section The section title.
     * @property {string} html A HTML text.
     * @property {callback} task The callback executed by the action.
     */

    /* Basic viewer for a single layer.
     *  we support actions through buttons: each button style is controlled by classes (trigger), active (if support status)
     *  and custom.
     * actions supported are:
     *  home: reset the camera
     *  zoomin, zoomout
     *  fullscreen
     *  rotate (45/90 deg rotation option.
     *  light: turn on light changing.
     *  switch layer(s)
     *  lens.
     * 
     * How the menu works:
     * Each entry eg: { title: 'Coin 16' }
     * title: large title
     * section: smaller title
     * html: whatever html
     * button: visually a button, attributes: group, layer, mode
     * slider: callback(percent)
     * list: an array of entries.
     * 
     * Additional attributes:
     * onclick: a function(event) {}
     * group: a group of entries where at most one is active
     * layer: a layer id: will be active if layer is visible
     * mode: a layer visualization mode, active if it's the current mode.
     * layer + mode: if both are specified, both must be current for an active.
     */


    /** 
     * **UIBasic** is a flexible and easy-to-use class that implements a complete user interface to bind to the `viewer`
     * The interface is associated with a CSS file (skin.css) that defines the style of the HTML DOM and a graphic 
     * file (skin.svg) that specifies the geometric characteristics of the tool buttons.
     * 
     * The class provides a set of default ready-to-use tools (called actions):
     * * **home** resets the camera.
     * * **fullscreen** enables the fullscreen mode.
     * * **layers** displays the layer menu.
     * * **zoomin** performs a camera zoom-in.
     * * **zoomout** performs a camera zoom-out.
     * * **rotate** rotates the camera around the z-axis (by 45-degs steps).
     * * **light** enables light manipulation.
     * * **help** displays a help dialog box.
     * 
     * In the following example a UIBasic interface is created and binded to the `lime` viewer.
     * The `light` action is disabled, and the `zoomin` and `zoomout` actions are enabled. 
     * ```
     * // Creates an User Interface 
     * const ui = new OpenLIME.UIBasic(lime);
     *
     * // Removes light from the toolbar
     * ui.actions.light.display=false;
     * // Adds zoomin and zoomout to the toolbar
     * ui.actions.zoomin.display=true;
     * ui.actions.zoomout.display=true;
     * ```
     */ 
    class UIBasic {
    	/**
    	 * Instantiates a UIBasic object.
    	 * @param {Viewer} viewer The OpenLIME viewer.
    	 * @param {Object} [options] An object literal with UIBasic parameters.
    	 * @param {string} options.skin='skin/skin.svg' The file name of the vector image defining the tool buttons.
    	 * @param {bool} options.autofit=true Whether the initial position of the camera is set to fit the scene model.
    	 * @param {number} options.priority=0 Higher priority controllers are invoked first.
    	 * @param {{UIBasic#Action}} options.actions An Object of {@link UIBasic#Action}. A set of default actions are ready to be used.
    	 * @param {string} options.attribution Some information related to data attribution or credits.
    	 * @param {Array<UIBasic#MenuEntry>} options.menu The interface menu structure.
    	 * @param {bool} options.enableTooltip=true Whether to enable tool button tooltip.
    	 * @param {bool} options.showLightDirections=false Whether to draw light direction vectors.
    	 */
    	constructor(viewer, options) {
    		//we need to know the size of the scene but the layers are not ready.
    		let camera = viewer.camera;
    		Object.assign(this, {
    			viewer: viewer,
    			camera: viewer.camera,
    			skin: 'skin/skin.svg',
    			autoFit: true, //FIXME to be moved in the viewer?
    			//skinCSS: 'skin.css', // TODO: probably not useful
    			actions: {
    				home: { title: 'Home', display: true, key: 'Home', task: (event) => { if (camera.boundingBox) camera.fitCameraBox(250); } },
    				fullscreen: { title: 'Fullscreen', display: true, key: 'f', task: (event) => { this.toggleFullscreen(); } },
    				layers: { title: 'Layers', display: true, key: 'Escape', task: (event) => { this.toggleLayers(); } },
    				zoomin: { title: 'Zoom in', display: false, key: '+', task: (event) => { camera.deltaZoom(250, 1.25, 0, 0); } },
    				zoomout: { title: 'Zoom out', display: false, key: '-', task: (event) => { camera.deltaZoom(250, 1 / 1.25, 0, 0); } },
    				rotate: { title: 'Rotate', display: false, key: 'r', task: (event) => { camera.rotate(250, -45); } },
    				light: { title: 'Light', display: 'auto', key: 'l', task: (event) => { this.toggleLightController(); } },
    				ruler: { title: 'Ruler', display: false, task: (event) => { this.toggleRuler(); } },
    				help: { title: 'Help', display: false, key: '?', task: (event) => { this.toggleHelp(this.actions.help); }, html: '<p>Help here!</p>' }, //FIXME Why a boolean in toggleHelp?
    				snapshot: { title: 'Snapshot', display: false, task: (event) => { this.snapshot(); } }, //FIXME not work!
    			},
    			pixelSize: null,
    			unit: null, //FIXME to be used with ruler
    			attribution: null,     //image attribution
    			lightcontroller: null,
    			showLightDirections: false,
    			enableTooltip: true,
    			controlZoomMessage: null, //"Use Ctrl + Wheel to zoom instead of scrolling" ,
    			menu: []
    		});
    		
    		Object.assign(this, options);
    		if (this.autoFit) //FIXME Check if fitCamera is triggered only if the layer is loaded. Is updateSize the right event?
    			this.viewer.canvas.addEvent('updateSize', () => this.viewer.camera.fitCameraBox(0));

    		this.panzoom = new ControllerPanZoom(this.viewer.camera, {
    			priority: -1000,
    			activeModifiers: [0, 1],
    			controlZoom: this.controlZoomMessage != null
    		});
    		if(this.controlZoomMessage)
    			this.panzoom.addEvent('nowheel', () => { this.showOverlayMessage(this.controlZoomMessage); });
    		this.viewer.pointerManager.onEvent(this.panzoom); //register wheel, doubleclick, pan and pinch
    		// this.viewer.pointerManager.on("fingerSingleTap", { "fingerSingleTap": (e) => { this.showInfo(e); }, priority: 10000 });

    		/*let element = entry.element;
    		let group = element.getAttribute('data-group');
    		let layer = element.getAttribute('data-layer');
    		let mode = element.getAttribute('data-mode');
    		let active = (layer && this.viewer.canvas.layers[layer].visible) &&
    			(!mode || this.viewer.canvas.layers[layer].getMode() == mode);
    		entry.element.classList.toggle('active', active); */

    		this.menu.push({ section: "Layers" });
    		for (let [id, layer] of Object.entries(this.viewer.canvas.layers)) {
    			let modes = [];
    			for (let m of layer.getModes()) {
    				let mode = {
    					button: m,
    					mode: m,
    					layer: id,
    					onclick: () => { layer.setMode(m); },
    					status: () => layer.getMode() == m ? 'active' : '',
    				};
    				if (m == 'specular' && layer.shader.setSpecularExp)
    					mode.list = [{ slider: '', oninput: (e) => { layer.shader.setSpecularExp(e.target.value); } }];
    				modes.push(mode);
    			}

    			let layerEntry = {
    				button: layer.label || id,
    				onclick: () => { this.setLayer(layer); },
    				status: () => layer.visible ? 'active' : '',
    				layer: id
    			};
    			if(modes.length > 1) layerEntry.list = modes;
    			
    			if (layer.annotations) {
    				layerEntry.list.push(layer.annotationsEntry());
    				//TODO: this could be a convenience, creating an editor which can be
    				//customized later using layer.editor.
    				//if(layer.editable) 
    				//	layer.editor = this.editor;
    			}
    			this.menu.push(layerEntry);
    		}

    		let controller = new Controller2D(
    			(x, y) => {
    				for (let layer of lightLayers)
    					layer.setLight([x, y], 0);
    				if(this.showLightDirections)
    					this.updateLightDirections(x, y);
    				this.emit('lightdirection', [x, y, Math.sqrt(1 - x*x + y*y)]);
    			}, { 
    				// TODO: IS THIS OK? It was false before
    				active: false, 
        			activeModifiers: [2, 4], 
        			control: 'light', 
        			onPanStart: this.showLightDirections ? () => {
        				Object.values(this.viewer.canvas.layers).filter(l => l.annotations != null).forEach(l => l.setVisible(false) );
        				this.enableLightDirections(true); } : null,
        			onPanEnd: this.showLightDirections ? () => { 
        				Object.values(this.viewer.canvas.layers).filter(l => l.annotations != null).forEach(l => l.setVisible(true) );
        				this.enableLightDirections(false); } : null,
        			relative: true 
    			});

    		controller.priority = 0;
    		this.viewer.pointerManager.onEvent(controller);
    		this.lightcontroller = controller;


    		let lightLayers = [];
    		for (let [id, layer] of Object.entries(this.viewer.canvas.layers))
    			if (layer.controls.light) lightLayers.push(layer);

    		if (lightLayers.length) {
    			this.createLightDirections();
    			for (let layer of lightLayers) {
    				controller.setPosition(0.5, 0.5);
    				//layer.setLight([0.5, 0.5], 0);
    				layer.controllers.push(controller);
    			}
    		}

    		if (queueMicrotask) queueMicrotask(() => { this.init(); }); //allows modification of actions and layers before init.
    		else setTimeout(() => { this.init(); }, 0);
    	}

    	showOverlayMessage(msg, duration = 2000) {
    		if(this.overlayMessage) {
    			clearTimeout(this.overlayMessage.timeout);
    			this.overlayMessage.timeout = setTimeout(() => this.destroyOverlayMessage(), duration);
    			return;
    		}
    		
    		
    		let background = document.createElement('div');
    		background.classList.add('openlime-overlaymsg');
    		background.innerHTML = `<p>${msg}</p>`;
    		this.viewer.containerElement.appendChild(background);

    		this.overlayMessage = {
    			background,
    			timeout: setTimeout(() => this.destroyOverlayMessage(), duration)
    		};
    	}
    	destroyOverlayMessage() {
    		this.overlayMessage.background.remove();
    		this.overlayMessage = null;
    	}

    	/** @ignore */
    	getMenuLayerEntry(id) {
    		const found = this.menu.find(e => e.layer == id);
    		return found;
    	}

    	/** @ignore */
    	createLightDirections() {
    		this.lightDirections = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    		this.lightDirections.setAttribute('viewBox', '-100, -100, 200 200');
    		this.lightDirections.setAttribute('preserveAspectRatio', 'xMidYMid meet');
    		this.lightDirections.style.display = 'none';
    		this.lightDirections.classList.add('openlime-lightdir');
    		for(let x = -1; x <= 1; x++) {
    			for(let y = -1; y <= 1; y++) {
    				let line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    				line.pos = [x*35, y*35];
    				//line.setAttribute('data-start', `${x} ${y}`);
    				this.lightDirections.appendChild(line);
    			}
    		}
    		this.viewer.containerElement.appendChild(this.lightDirections);
    	}
    	
    	/** @ignore */
    	updateLightDirections(lx, ly) {
    		let lines = [...this.lightDirections.children];
    		for(let line of lines) {
    			let x = line.pos[0];
    			let y = line.pos[1];
    			
    			line.setAttribute('x1', 0.6*x -25*0*lx);
    			line.setAttribute('y1', 0.6*y +25*0*ly);
    			line.setAttribute('x2', x/0.6 + 60*lx);
    			line.setAttribute('y2', y/0.6 - 60*ly);
    		}
    	}

    	/** @ignore */
    	enableLightDirections(show) {
    		this.lightDirections.style.display = show? 'block' : 'none';
    	}

    	/** @ignore */
    	init() {
    		(async () => {

    			document.addEventListener('keydown', (e) => this.keyDown(e), false);
    			document.addEventListener('keyup', (e) => this.keyUp(e), false);

    			this.createMenu();
    			this.updateMenu();
    			this.viewer.canvas.addEvent('update', () => this.updateMenu());

    			if (this.actions.light && this.actions.light.display === 'auto')
    				this.actions.light.display = true;


    			if (this.skin)
    				await this.loadSkin();
    			/* TODO: this is probably not needed
    			if(this.skinCSS)
    				await this.loadSkinCSS();
    			*/

    			this.setupActions();
    			if(this.pixelSize) 
    				this.scalebar = new ScaleBar(this.pixelSize, this.viewer);

    			if(this.attribution) {
    				var p = document.createElement('p');
    				p.classList.add('openlime-attribution');
    				p.innerHTML = this.attribution;
    				this.viewer.containerElement.appendChild(p);
    			}

    			

    			for(let l of Object.values(this.viewer.canvas.layers)) {
    				this.setLayer(l);
    				break;
    			}

    			if(this.actions.light && this.actions.light.active)
    				this.toggleLightController();
    			if(this.actions.layers && this.actions.layers.active)
    				this.toggleLayers();

    		})().catch(e => { console.log(e); throw Error("Something failed") });
    	}

    	/** @ignore */
    	keyDown(e) {
    	}

    	/** @ignore */
    	keyUp(e) {
    		if (e.target != document.body && e.target.closest('input, textarea') != null)
    			return;

    		if (e.defaultPrevented) return;

    		for (const a of Object.values(this.actions)) {
    			if ('key' in a && a.key == e.key) {
    				e.preventDefault();
    				a.task(e);
    				return;
    			}
    		}
    	}
    	
    	/** @ignore */
    	async loadSkin() {
    		let toolbar = document.createElement('div');
    		toolbar.classList.add('openlime-toolbar');
    		this.viewer.containerElement.appendChild(toolbar);

    		//toolbar manually created with parameters (padding, etc) + css for toolbar positioning and size.
    		{
    			for (let [name, action] of Object.entries(this.actions)) {

    				if (action.display !== true)
    					continue;

    				if('icon' in action) {
    					if(typeof action.icon == 'string') {
    						if(Util.isSVGString(action.icon)) {
    							action.icon = Util.SVGFromString(action.icon);
    						} else {
    							action.icon = await Util.loadSVG(action.icon);
    						}
    						action.icon.classList.add('openlime-button');
    					}
    				} else {
    					action.icon = '.openlime-' + name;
    				}

    				action.element = await Skin.appendIcon(toolbar, action.icon);
    				if (this.enableTooltip) {
    					let title = document.createElementNS('http://www.w3.org/2000/svg', 'title');
    					title.textContent = action.title;
    					action.element.appendChild(title);
    				}
    			}

    		}
    	}

    	/** @ignore */
    	setupActions() {
    		for (let [name, action] of Object.entries(this.actions)) {
    			let element = action.element;
    			if (!element)
    				continue;
    			// let pointerManager = new PointerManager(element);
    			// pointerManager.onEvent({ fingerSingleTap: action.task, priority: -2000 });
    			element.addEventListener('click', (e) => {
    				action.task(e);
    				e.preventDefault();
    			});
    		}
    		let items = document.querySelectorAll('.openlime-layers-button');
    		for (let item of items) {
    			let id = item.getAttribute('data-layer');
    			if (!id) continue;
    			item.addEventListener('click', () => {
    				this.setLayer(this.viewer.layers[id]);
    			});
    		}
    	}

    	//we need the concept of active layer! so we an turn on and off light.
    	/** @ignore */
    	toggleLightController(on) {
    		let div = this.viewer.containerElement;
    		let active = div.classList.toggle('openlime-light-active', on);
    		this.lightActive = active;

    		for (let layer of Object.values(this.viewer.canvas.layers))
    			for (let c of layer.controllers)
    				if (c.control == 'light') {
    					c.active = true;
    					c.activeModifiers = active ? [0, 2, 4] : [2, 4];  //nothing, shift and alt
    				}
    	}

    	/** @ignore */
    	toggleFullscreen() {
    		let canvas = this.viewer.canvasElement;
    		let div = this.viewer.containerElement;
    		let active = div.classList.toggle('openlime-fullscreen-active');

    		if (!active) {
    			var request = document.exitFullscreen || document.webkitExitFullscreen ||
    				document.mozCancelFullScreen || document.msExitFullscreen;
    			request.call(document); document.querySelector('.openlime-scale > line');

    			this.viewer.resize(canvas.offsetWidth, canvas.offsetHeight);
    		} else {
    			var request = div.requestFullscreen || div.webkitRequestFullscreen ||
    				div.mozRequestFullScreen || div.msRequestFullscreen;
    			request.call(div);
    		}
    		this.viewer.resize(canvas.offsetWidth, canvas.offsetHeight);
    	}

    	/** @ignore */
    	toggleRuler() {
    		if(!this.ruler) {
    			this.ruler = new Ruler(this.viewer, this.pixelSize);
    			this.viewer.pointerManager.onEvent(this.ruler);
    		}
    		
    		if(!this.ruler.enabled)
    			this.ruler.start();
    		else
    			this.ruler.end();
    	}

    	/** @ignore */
    	toggleHelp(help, on) {
    		if(!help.dialog) {
    			help.dialog = new UIDialog(this.viewer.containerElement, { modal: true, class: 'openlime-help-dialog' });
    			help.dialog.setContent(help.html);
    		} else
    			help.dialog.toggle(on);		
    	}

    	/** @ignore */
    	snapshot() {
    		var e = document.createElement('a');
    		e.setAttribute('href', this.viewer.canvas.canvasElement.toDataURL());
    		e.setAttribute('download', 'snapshot.png');
    		e.style.display = 'none';
    		document.body.appendChild(e);
    		e.click();
    		document.body.removeChild(e);
    	}

    	/* Layer management */

    	/** @ignore */
    	createEntry(entry) {
    		if (!('id' in entry))
    			entry.id = 'entry_' + (this.entry_count++);

    		let id = `id="${entry.id}"`;
    		let tooltip = 'tooltip' in entry ? `title="${entry.tooltip}"` : '';
    		let classes = 'classes' in entry ? entry.classes : '';
    		let html = '';
    		if ('title' in entry) {
    			html += `<h2 ${id} class="openlime-title ${classes}" ${tooltip}>${entry.title}</h2>`;

    		} else if ('section' in entry) {
    			html += `<h3 ${id} class="openlime-section ${classes}" ${tooltip}>${entry.section}</h3>`;

    		} else if ('html' in entry) {
    			html += `<div ${id} class="${classes}">${entry.html}</div>`;

    		} else if ('button' in entry) {
    			let group = 'group' in entry ? `data-group="${entry.group}"` : '';
    			let layer = 'layer' in entry ? `data-layer="${entry.layer}"` : '';
    			let mode = 'mode' in entry ? `data-mode="${entry.mode}"` : '';
    			html += `<a href="#" ${id} ${group} ${layer} ${mode} ${tooltip} class="openlime-entry ${classes}">${entry.button}</a>`;
    		} else if ('slider' in entry) {
    			let value = ('value' in entry) ? entry['value'] : 50;
    			html += `<input type="range" min="1" max="100" value="${value}" class="openlime-slider ${classes}" ${id}>`;
    		}

    		if ('list' in entry) {
    			let ul = `<div class="openlime-list ${classes}">`;
    			for (let li of entry.list)
    				ul += this.createEntry(li);
    			ul += '</div>';
    			html += ul;
    		}
    		return html;
    	}

    	/** @ignore */
    	addEntryCallbacks(entry) {
    		entry.element = this.layerMenu.querySelector('#' + entry.id);
    		if (entry.onclick)
    			entry.element.addEventListener('click', (e) => {
    				entry.onclick();
    				//this.updateMenu();
    			});
    		if (entry.oninput)
    			entry.element.addEventListener('input', entry.oninput);
    		if (entry.oncreate)
    			entry.oncreate();

    		if ('list' in entry)
    			for (let e of entry.list)
    				this.addEntryCallbacks(e);
    	}

    	/** @ignore */
    	updateEntry(entry) {
    		let status = entry.status ? entry.status() : '';
    		entry.element.classList.toggle('active', status == 'active');

    		if ('list' in entry)
    			for (let e of entry.list)
    				this.updateEntry(e);
    	}

    	/** @ignore */
    	updateMenu() {
    		for (let entry of this.menu)
    			this.updateEntry(entry);
    	}

    	/** @ignore */
    	createMenu() {
    		this.entry_count = 0;
    		let html = `<div class="openlime-layers-menu">`;
    		for (let entry of this.menu) {
    			html += this.createEntry(entry);
    		}
    		html += '</div>';


    		let template = document.createElement('template');
    		template.innerHTML = html.trim();
    		this.layerMenu = template.content.firstChild;
    		this.viewer.containerElement.appendChild(this.layerMenu);

    		for (let entry of this.menu) {
    			this.addEntryCallbacks(entry);
    		}


    		/*		for(let li of document.querySelectorAll('[data-layer]'))
    					li.addEventListener('click', (e) => {
    						this.setLayer(this.viewer.canvas.layers[li.getAttribute('data-layer')]);
    					}); */
    	}

    	/** @ignore */
    	toggleLayers() {
    		this.layerMenu.classList.toggle('open');
    	}

    	/** @ignore */
    	setLayer(layer_on) {
    		if (typeof layer_on == 'string')
    			layer_on = this.viewer.canvas.layers[layer_on];

    		if (layer_on.overlay) { //just toggle
    			layer_on.setVisible(!layer_on.visible);

    		} else {
    			for (let layer of Object.values(this.viewer.canvas.layers)) {
    				if (layer.overlay)
    					continue;

    				layer.setVisible(layer == layer_on);
    				for (let c of layer.controllers) {
    					if (c.control == 'light')
    						c.active = this.lightActive && layer == layer_on;
    				}
    			}
    		}
    		this.updateMenu();
    		this.viewer.redraw();
    	}

    	/** @ignore */
    	closeLayersMenu() {
    		this.layerMenu.style.display = 'none';
    	}
    }

    /**
     * A **UIDialog** is a top-level window used for communications with the user. It may be modal or modeless.
     * The content of the dialog can be either an HTML text or a pre-built DOM element.
     * When hidden, a dialog emits a 'closed' event.
     */
    class UIDialog { //FIXME standalone class
    	/**
    	 * Instatiates a UIDialog object.
    	 * @param {HTMLElement} container The HTMLElement on which the dialog is focused
    	 * @param {Object} [options] An object literal with UIDialog parameters.
    	 * @param {bool} options.modal Whether the dialog is modal. 
    	 */
    	constructor(container, options) {
    		Object.assign(this, {
    			dialog: null,
    			content: null,
    			container: container,
    			modal: false,
    			class: null,
    			visible: false,
    			backdropEvents: true
    		}, options);
    		this.create();
    	}

    	/** @ignore */
    	create() {
    		let background = document.createElement('div');
    		background.classList.add('openlime-dialog-background');

    		let dialog = document.createElement('div');
    		dialog.classList.add('openlime-dialog');
    		if (this.class)
    			dialog.classList.add(this.class);

    		(async () => {
    			let close = await Skin.appendIcon(dialog, '.openlime-close');
    			close.classList.add('openlime-close');
    			close.addEventListener('click', () => this.hide());
    			//content.appendChild(close);
    		})();


    		// let close = Skin.appendIcon(dialog, '.openlime-close');
    		// close.classList.add('openlime-close');
    		// close.addEventListener('click', () => this.hide());

    		let content = document.createElement('div');
    		content.classList.add('openlime-dialog-content');
    		dialog.append(content);

    		if (this.modal) { //FIXME backdrown => backdrop
    			if(this.backdropEvents) background.addEventListener('click', (e) => { if (e.target == background) this.hide(); });
    			background.appendChild(dialog);
    			this.container.appendChild(background);
    			this.element = background;
    		} else {
    			this.container.appendChild(dialog);
    			this.element = dialog;
    		}

    		this.dialog = dialog;
    		this.content = content;
    		this.hide();
    	}

    	/**
    	 * Sets the content of the dialog.
    	 * @param {(string|HTMLElement)} html The content of the dialog (a HTML text or element). 
    	 */
    	setContent(html) {
    		if (typeof (html) == 'string')
    			this.content.innerHTML = html;
    		else
    			this.content.replaceChildren(html);
    	}
    	
    	/**
    	 * Shows the dialog.
    	 */
    	show() {
    		this.element.classList.remove('hidden');
    		this.visible=true;
    	}
    	
    	/**
    	 * Hides the dialog.
    	 */
    	hide() {
    		/**
    		 * The event is fired when the dialog is closed.
    		 * @event UIDialog#closed
    		 */
    		this.element.classList.add('hidden');
    		this.visible=false;
    		this.emit('closed');
    	}
    	
    	/**
    	 * Adds fading effect to the dialog.
    	 * @param {bool} on Whether the fading effect is enabled.
    	 */
    	fade(on) { //FIXME Does it work?
    		this.element.classList.toggle('fading');
    	}

    	/**
    	 * Toggles the display of the dialog.
    	 * @param {bool} force Whether to turn the dialog into a one way-only operation.
    	 */
    	toggle(force) { //FIXME Why not remove force?
    		this.element.classList.toggle('hidden', force);
    		this.visible = !this.visible; //FIXME not in sync with 'force'
    	}
    }

    addSignals(UIDialog, 'closed');
    addSignals(UIBasic, 'lightdirection');

    /**
     * Extends {@link Shader}, initialized with a relight .json (see:
     * [relight on github]{@link https://github.com/cnr-isti-vclab/relight} for details).
     * 
     * Supported modes are
     * light: relightable images depending on light direction
     * normals: shows a normal map
     * diffuse: remove albedo and display only the geometry with a white material.
     * specular: specular enhancement
     * 
     * From the .json configuration the type of basis used: ('ptm', 'hsh', rbf', 'bln'), 
     * and the colorspace ('lrgb', 'rgb', 'mrgb', 'mycc') along with all the other parameters.
     * 
     *  @param {object} options
     * *compose*: compose operation: add, subtract, multiply, etc.
     */

    class ShaderRTI extends Shader {
    	constructor(options) {
    		super({});

    		Object.assign(this, {
    			modes: ['light', 'normals', 'diffuse', 'specular'],
    			mode: 'normal',
    			type:        ['ptm', 'hsh',  'sh', 'rbf', 'bln'],
    			colorspaces: ['lrgb', 'rgb', 'mrgb', 'mycc'],

    			nplanes: null,     //number of coefficient planes
    			yccplanes: null,     //number of luminance planes for mycc color space
    			njpegs: null,      //number of textures needed (ceil(nplanes/3))
    			material: null,    //material parameters
    			lights: null,      //light directions (needed for rbf interpolation)
    			sigma: null,       //rbf interpolation parameter
    			ndimensions: null, //PCA dimension space (for rbf and bln)

    			scale: null,      //factor and bias are used to dequantize coefficient planes.
    			bias: null,

    			basis: null,       //PCA basis for rbf and bln
    			lweights: null    //light direction dependent coefficients to be used with coefficient planes
    		});
    		Object.assign(this, options);

    		if(this.relight)
    			this.init(this.relight);

    		this.setMode('light');
    	}

    	/*
     * Set current rendering mode
     * @param {string} mode one of 'light', 'normals', 'diffuse', 'specular'
     * @param {number} dt in ms, interpolation duration.
     */
    	setMode(mode) {
    		if(!(this.modes.includes(mode)))
    			throw Error("Unknown mode: " + mode);
    		this.mode = mode;

    		if( mode != 'light') {
    			this.lightWeights([ 0.612,  0.354, 0.707], 'base');
    			this.lightWeights([-0.612,  0.354, 0.707], 'base1');
    			this.lightWeights([     0, -0.707, 0.707], 'base2');
    		}
    		this.needsUpdate = true;
    	}

    	setLight(light) {
    		if(!this.uniforms.light) 
    			throw "Shader not initialized, wait on layer ready event for setLight."

    		let x = light[0];
    		let y = light[1];

    		//map the square to the circle.
    		let r = Math.sqrt(x*x + y*y);
    		if(r > 1) {
    			x /= r;
    			y /= r;
    		}
    		let z = Math.sqrt(Math.max(0, 1 - x*x - y*y));
    		light = [x, y, z];

    		if(this.mode == 'light')
    			this.lightWeights(light, 'base');
    		this.setUniform('light', light);
    	}
    	setSpecularExp(value) {
    		this.setUniform('specular_exp', value);
    	}

    	init(relight) {
    		Object.assign(this, relight);
    		if(this.colorspace == 'mycc')
    			this.nplanes = this.yccplanes[0] + this.yccplanes[1] + this.yccplanes[2];
    		else 
    			this.yccplanes = [0, 0, 0];


    		this.planes = [];
    		this.njpegs = 0;
    		while(this.njpegs*3 < this.nplanes)
    			this.njpegs++;

    		for(let i = 0; i < this.njpegs; i++)
    			this.samplers.push({ id:i, name:'plane'+i, type:'vec3' });
    		
    		if(this.normals)
    			this.samplers.push({ id:this.njpegs, name:'normals', type:'vec3' });

    		this.material = this.materials[0];

    		if(this.lights)
    			this.lights + new Float32Array(this.lights);

    		if(this.type == "rbf")
    			this.ndimensions = this.lights.length/3;


    		if(this.type == "bilinear") {
    			this.ndimensions = this.resolution*this.resolution;
    			this.type = "bln";
    		}

    		this.scale = this.material.scale;
    		this.bias = this.material.bias;

    		if(['mrgb', 'mycc'].includes(this.colorspace))
    			this.loadBasis(this.basis);


    		this.uniforms = {
    			light: { type: 'vec3', needsUpdate: true, size: 3,              value: [0.0, 0.0, 1] },
    			specular_exp: { type: 'float', needsUpdate: false, size: 1, value: 10 },
    			bias:  { type: 'vec3', needsUpdate: true, size: this.nplanes/3, value: this.bias },
    			scale: { type: 'vec3', needsUpdate: true, size: this.nplanes/3, value: this.scale },
    			base:  { type: 'vec3', needsUpdate: true, size: this.nplanes },
    			base1: { type: 'vec3', needsUpdate: false, size: this.nplanes },
    			base2: { type: 'vec3', needsUpdate: false, size: this.nplanes }
    		};

    		this.lightWeights([0, 0, 1], 'base');
    	}

    	lightWeights(light, basename, time) {
    		let value;
    		switch(this.type) {
    			case 'ptm': value = PTM.lightWeights(light); break;
    			case 'hsh': value = HSH.lightWeights(light); break;
    			case 'sh' : value = SH.lightWeights(light); break;
    			case 'rbf': value = RBF.lightWeights(light, this); break;
    			case 'bln': value = BLN.lightWeights(light, this); break;
    		}
    		this.setUniform(basename, value, time);
    	}

    	baseLightOffset(p, l, k) {
    		return (p*this.ndimensions + l)*3 + k;
    	}

    	basePixelOffset(p, x, y, k) {
    		return (p*this.resolution*this.resolution + (x + y*this.resolution))*3 + k;
    	}

    	loadBasis(data) {
    		let tmp = new Uint8Array(data);
    		this.basis = new Float32Array(data.length);

    		new Float32Array(tmp.length);
    		for(let plane = 0; plane < this.nplanes+1; plane++) {
    			for(let c = 0; c < this.ndimensions; c++) {
    				for(let k = 0; k < 3; k++) {
    					let o = this.baseLightOffset(plane, c, k);
    					if(plane == 0)
    						this.basis[o] = tmp[o]/255;
    					else
    						this.basis[o] = ((tmp[o] - 127)/this.material.range[plane-1]);
    				}
    			}
    		}
    	}

    	fragShaderSrc(gl) {
    		
    		let basetype = 'vec3'; //(this.colorspace == 'mrgb' || this.colorspace == 'mycc')?'vec3':'float';
    		let gl2 = !(gl instanceof WebGLRenderingContext);
    		let str = `


#define np1 ${this.nplanes + 1}

${gl2? 'in' : 'varying'} vec2 v_texcoord;

const mat3 T = mat3(8.1650e-01, 4.7140e-01, 4.7140e-01,
	-8.1650e-01, 4.7140e-01,  4.7140e-01,
	-1.6222e-08, -9.4281e-01, 4.7140e-01);

uniform vec3 light;
uniform float specular_exp;
uniform vec3 bias[np1];
uniform vec3 scale[np1];

uniform ${basetype} base[np1];
uniform ${basetype} base1[np1];
uniform ${basetype} base2[np1];
`;

    		for(let n = 0; n < this.njpegs; n++) 
    			str += `
uniform sampler2D plane${n};
`;

    		if(this.normals)
    			str += `
uniform sampler2D normals;
`;

    		if(this.colorspace == 'mycc')
    			str +=
`

const int ny0 = ${this.yccplanes[0]};
const int ny1 = ${this.yccplanes[1]};
`;

    		switch(this.colorspace) {
    			case 'lrgb':  str += LRGB.render(this.njpegs, gl2); break;
    			case 'rgb' :  str +=  RGB.render(this.njpegs, gl2); break;
    			case 'mrgb':  str += MRGB.render(this.njpegs, gl2); break;
    			case 'mycc':  str += MYCC.render(this.njpegs, this.yccplanes[0], gl2); break;
    		}

    		str += `

vec4 data() {

`;
    		if(this.mode == 'light') {
    			str += `
	vec4 color = render(base);
`;
    		} else  {
    			str += `
	vec4 color;
`;
    			if(this.normals)
    				str += `
	vec3 normal = (texture${gl2?'':'2D'}(normals, v_texcoord).zyx *2.0) - 1.0;
	normal.z = sqrt(1.0 - normal.x*normal.x - normal.y*normal.y);
`;
    			else
    				str += `
	vec3 normal;
	normal.x = dot(render(base ).xyz, vec3(1));
	normal.y = dot(render(base1).xyz, vec3(1));
	normal.z = dot(render(base2).xyz, vec3(1));
	normal = normalize(T * normal);
`; 
    			switch(this.mode) {
    			case 'normals':  str += `
	normal = (normal + 1.0)/2.0;
	color = vec4(0.0, normal.xy, 1);
`;
    			break;

    			case 'diffuse': 
    			if(this.colorspace == 'lrgb' || this.colorspace == 'rgb')
    				str += `
vec4 diffuse = texture${gl2?'':'2D'}(plane0, v_texcoord);
float s = dot(light, normal);
color = vec4(s * diffuse.xyz, 1);
`;
    			else
    				str += `
color = vec4(vec3(dot(light, normal)), 1);
`;
    			break;

    			case 'specular': 
    			default: str += `
	float s = pow(dot(light, normal), specular_exp);
	//color = vec4(render(base).xyz*s, 1.0);
	color = vec4(s, s, s, 1.0);
`;
    			break;
    			}
    		}

    		str += `return color;
}`;
    		return str;
    	}
    }


    class LRGB {
    	static render(njpegs, gl2) {
    		let str = `
vec4 render(vec3 base[np1]) {
	float l = 0.0;
`;
    		for(let j = 1, k = 0; j < njpegs; j++, k+=3) {
    			str += `
	{
		vec4 c = texture${gl2?'':'2D'}(plane${j}, v_texcoord);
		l += base[${k}].x*(c.x - bias[${j}].x)*scale[${j}].x;
		l += base[${k+1}].x*(c.y - bias[${j}].y)*scale[${j}].y;
		l += base[${k+2}].x*(c.z - bias[${j}].z)*scale[${j}].z;
	}
`;
    		}
    		str += `
	vec3 basecolor = (texture${gl2?'':'2D'}(plane0, v_texcoord).xyz - bias[0])*scale[0];

	return l*vec4(basecolor, 1);
}
`;
    		return str;
    	}
    }


    class RGB {
    	static render(njpegs, gl2) {
    		let str = `
vec4 render(vec3 base[np1]) {
	vec4 rgb = vec4(0, 0, 0, 1);`;

    		for(let j = 0; j < njpegs; j++) {
    			str += `
	{
		vec4 c = texture${gl2?'':'2D'}(plane${j}, v_texcoord);
		rgb.x += base[${j}].x*(c.x - bias[${j}].x)*scale[${j}].x;
		rgb.y += base[${j}].y*(c.y - bias[${j}].y)*scale[${j}].y;
		rgb.z += base[${j}].z*(c.z - bias[${j}].z)*scale[${j}].z;
	}
`;
    		}
    		str += `
	return rgb;
}
`;
    		return str;
    	}
    }

    class MRGB {
    	static render(njpegs, gl2) {
    		let str = `
vec4 render(vec3 base[np1]) {
	vec3 rgb = base[0];
	vec4 c;
	vec3 r;
`;
    		for(let j = 0; j < njpegs; j++) {
    			str +=
`	c = texture${gl2?'':'2D'}(plane${j}, v_texcoord);
	r = (c.xyz - bias[${j}])* scale[${j}];

	rgb += base[${j}*3+1]*r.x;
	rgb += base[${j}*3+2]*r.y;
	rgb += base[${j}*3+3]*r.z;
`    ;
    		}
    		str += `
	return vec4(rgb, 1);
}
`;
    		return str;
    	}
    }

    class MYCC {

    	static render(njpegs, ny1, gl2) {
    		let str = `
vec3 toRgb(vec3 ycc) {
 	vec3 rgb;
	rgb.g = ycc.r + ycc.b/2.0;
	rgb.b = ycc.r - ycc.b/2.0 - ycc.g/2.0;
	rgb.r = rgb.b + ycc.g;
	return rgb;
}

vec4 render(vec3 base[np1]) {
	vec3 rgb = base[0];
	vec4 c;
	vec3 r;
`;
    		for(let j = 0; j < njpegs; j++) {
    			str += `

	c = texture${gl2?'':'2D'}(plane${j}, v_texcoord);

	r = (c.xyz - bias[${j}])* scale[${j}];
`;

    			if(j < ny1) {
    				str += `
	rgb.x += base[${j}*3+1].x*r.x;
	rgb.y += base[${j}*3+2].y*r.y;
	rgb.z += base[${j}*3+3].z*r.z;
`;
    			} else {
    				str += `
	rgb.x += base[${j}*3+1].x*r.x;
	rgb.x += base[${j}*3+2].x*r.y;
	rgb.x += base[${j}*3+3].x*r.z;
`;
    			}
    		}
    		str += `	
	return vec4(toRgb(rgb), 1);
}
`;
    		return str;
    	}
    }




    /* PTM utility functions 
     */
    class PTM {
    	/* @param {Array} v expects light direction as [x, y, z]
    	*/
    	static lightWeights(v) {
    		let b = [1.0, v[0], v[1], v[0]*v[0], v[0]*v[1], v[1]*v[1]];
    		let base = new Float32Array(18);
    		for(let i = 0; i < 18; i++)
    			base[3*i] = base[3*i+1] = base[3*i+2] = b[i];
    		return base;
    	}
    }


    /* HSH utility functions 
     */
    class HSH {
    	static minElevation = 0.15;
    	/* @param {Array} v expects light direction as [x, y, z]
    	*/
    	static lightWeights(v) {
    		let PI = 3.1415;
    		let phi = Math.atan2(v[1], v[0]);
    		if (phi < 0)
    			phi = 2 * PI + phi;
    		let theta = Math.min(Math.acos(v[2]), PI / 2 - this.minElevation);

    		let cosP = Math.cos(phi);
    		let cosT = Math.cos(theta);
    		let cosT2 = cosT * cosT;

    		let b = [
    			1.0 / Math.sqrt(2 * PI),

    			Math.sqrt(6 / PI) * (cosP * Math.sqrt(cosT-cosT2)),
    			Math.sqrt(3 / (2 * PI)) * (-1 + 2*cosT),
    			Math.sqrt(6 / PI) * (Math.sqrt(cosT - cosT2) * Math.sin(phi)),

    			Math.sqrt(30 / PI) * (Math.cos(2 * phi) * (-cosT + cosT2)),
    			Math.sqrt(30 / PI) * (cosP*(-1 + 2 * cosT) * Math.sqrt(cosT - cosT2)),
    			Math.sqrt(5  / (2 * PI)) * (1 - 6 * cosT + 6 * cosT2),
    			Math.sqrt(30 / PI) * ((-1 + 2 * cosT) * Math.sqrt(cosT - cosT2) * Math.sin(phi)),
    			Math.sqrt(30 / PI) * ((-cosT + cosT2) * Math.sin(2*phi))
    		];
    		let base = new Float32Array(27);
    		for(let i = 0; i < 27; i++)
    			base[3*i] = base[3*i+1] = base[3*i+2] = b[i];
    		return base;
    	}
    }

    class SH {
    	/* @param {Array} v expects light direction as [x, y, z]
    	*/
    	static lightWeights(v) {
    		let PI = 3.1415;
    		let A = 0.5*Math.sqrt(3.0/PI);
    		let B = 0.5*Math.sqrt(15/PI);
    		let b = [
    			0.5/Math.sqrt(PI),
    			A*v[0],
    			A*v[2],
    			A*v[1],
    			B*v[0]*v[1],
    			B*v[0]*v[2],
    			0.5*Math.sqrt(5/PI)*(3*v[2]*v[2] - 1),
    			B*v[1]*v[2],
    			0.5*B*(v[1]*v[1] - v[0]*v[0])
    		];

    		let base = new Float32Array(27);
    		for(let i = 0; i < 27; i++)
    			base[3*i] = base[3*i+1] = base[3*i+2] = b[i];
    		return base;
    	}
    }


    class RBF {
    	/* @param {Array} v expects light direction as [x, y, z]
    	*/
    	static lightWeights(lpos, shader) {

    		let weights = RBF.rbf(lpos, shader);

    		let np = shader.nplanes;
    		let lweights = new Float32Array((np + 1) * 3);

    		for(let p = 0; p < np+1; p++) {
    			for(let k = 0; k < 3; k++) {
    				for(let l = 0; l < weights.length; l++) {
    					let o = shader.baseLightOffset(p, weights[l][0], k);
    					lweights[3*p + k] += weights[l][1]*shader.basis[o];
    				}
    			}
    		}
    		return lweights;
    	}

    	static rbf(lpos, shader) {
    		let radius = 1/(shader.sigma*shader.sigma);
    		let weights = new Array(shader.ndimensions);

    		//compute rbf weights
    		let totw = 0.0;
    		for(let i = 0; i < weights.length; i++) {
    			let dx = shader.lights[i*3+0] - lpos[0];
    			let dy = shader.lights[i*3+1] - lpos[1];
    			let dz = shader.lights[i*3+2] - lpos[2];

    			let d2 = dx*dx + dy*dy + dz*dz;
    			let w = Math.exp(-radius * d2);

    			weights[i] = [i, w];
    			totw += w;
    		}
    		for(let i = 0; i < weights.length; i++)
    			weights[i][1] /= totw;


    		//pick only most significant and renormalize
    		let count = 0;
    		totw = 0.0;
    		for(let i = 0; i < weights.length; i++) {
    			if(weights[i][1] > 0.001) {
    				weights[count++] =  weights[i];
    				totw += weights[i][1];
    			}
    		}

    		weights = weights.slice(0, count); 
    		for(let i = 0; i < weights.length; i++)
    			weights[i][1] /= totw;

    		return weights;
    	}
    }

    class BLN {
    	static lightWeights(lpos, shader) {
    		let np = shader.nplanes;
    		let s = Math.abs(lpos[0]) + Math.abs(lpos[1]) + Math.abs(lpos[2]);

    		//rotate 45 deg.
    		let x = (lpos[0] + lpos[1])/s;
    		let y = (lpos[1] - lpos[0])/s;
    		x = (x + 1.0)/2.0;
    		y = (y + 1.0)/2.0;
    		x = x*(shader.resolution - 1.0);
    		y = y*(shader.resolution - 1.0);

    		let sx = Math.min(shader.resolution-2, Math.max(0, Math.floor(x)));
    		let sy = Math.min(shader.resolution-2, Math.max(0, Math.floor(y)));
    		let dx = x - sx;
    		let dy = y - sy;

    		//bilinear interpolation coefficients.
    		let s00 = (1 - dx)*(1 - dy);
    		let s10 =      dx *(1 - dy);
    		let s01 = (1 - dx)* dy;
    		let s11 =      dx * dy;

    		let lweights = new Float32Array((np + 1) * 3);

    		//TODO optimize away basePixel

    		for(let p = 0; p < np+1; p++) {
    			for(let k = 0; k < 3; k++) {
    				let o00 = shader.basePixelOffset(p, sx, sy, k);
    				let o10 = shader.basePixelOffset(p, sx+1, sy, k);
    				let o01 = shader.basePixelOffset(p, sx, sy+1, k);
    				let o11 = shader.basePixelOffset(p, sx+1, sy+1, k);

    				lweights[3*p + k] = 
    					s00*shader.basis[o00] + 
    					s10*shader.basis[o10] +
    					s01*shader.basis[o01] +
    					s11*shader.basis[o11];

    			}
    		}
    		return lweights;
    	}
    }

    /**
     * Extends {@link Layer}, and can display a relightable images (RTI) using the 'relight' data format (see:
     * [relight on github]{@link https://github.com/cnr-isti-vclab/relight} for details).
     * This web-friendly format is composed of a info.json with RTI parametets and a set of images 
     * (plane_0.jpg, plane_1.jpg etc.) with encoded coefficients.
     * As with all other layers Deepzoom and other {@link Layout}s can be used.
     * 
     * The ligh direction can be changed programmatically using setLight.
     * 
     * @param {options} options Same as {@link Layer}, but url and layout are required.
     * **url**: points to a relight .json
     * **layout**: one of image, deepzoom, google, iiif, zoomify, tarzoom, itarzoom
     */

    class LayerRTI extends Layer {
    	constructor(options) {
    		super(options);

    		if(Object.keys(this.rasters).length != 0)
    			throw "Rasters options should be empty!";

    		if(!this.url)
    			throw "Url option is required";

    		this.shaders['rti'] = new ShaderRTI({ normals: this.normals });
    		this.setShader('rti');

    		this.addControl('light', [0, 0]);
    		this.worldRotation = 0; //if the canvas or ethe layer rotate, light direction neeeds to be rotated too.
    		
    		this.loadJson(this.url);
    	}
    /*
     *  Internal function to assemble the url needed to retrieve the image or the image tile.
     */
    	imageUrl(url, plane) {
    		let path = this.url.substring(0, this.url.lastIndexOf('/')+1);
    		switch(this.layout.type) {
    			case 'image':    return path + plane + '.jpg';			case 'google':   return path + plane;			case 'deepzoom': return path + plane + '.dzi';			case 'tarzoom':  return path + plane + '.tzi';			case 'itarzoom': return path + 'planes.tzi';			case 'zoomify':  return path + plane + '/ImageProperties.xml';			//case 'iip':      return this.plane.throw Error("Unimplemented");
    			case 'iiif': throw Error("Unimplemented");
    			default:     throw Error("Unknown layout: " + layout.type);
    		}
    	}

    /*
     * Alias for setControl, changes light direction.
     * @param {Array} light light direction as an array [x, y]
     * @param {number} dt in ms, interpolation duration.
     */
    	setLight(light, dt) {
    		this.setControl('light', light, dt);
    	}

    	loadJson(url) {
    		(async () => {
    			var response = await fetch(this.url);
    			if(!response.ok) {
    				this.status = "Failed loading " + this.url + ": " + response.statusText;
    				return;
    			}
    			let json = await response.json();
    			this.shader.init(json);
    			let urls = [];
    			for(let p = 0; p < this.shader.njpegs; p++) {
    				let url = this.layout.imageUrl(this.url, 'plane_' + p);
    				urls.push(url);
    				let raster = new Raster({ format: 'vec3'});
    				this.rasters.push(raster);
    			}
    			if(this.normals) { // ITARZOOM must include normals and currently has a limitation: loads the entire tile 
    				let url = this.layout.imageUrl(this.url, 'normals');
    				urls.push(url);
    				let raster = new Raster({ format: 'vec3'});
    				this.rasters.push(raster);				
    			}			
    			this.layout.setUrls(urls);

    		})().catch(e => { console.log(e); this.status = e; });
    	}

    /*
     *  Internal function: light control maps to light direction in the shader.
     */
    	interpolateControls() {
    		let done = super.interpolateControls();
    		if(!done) {
    			let light = this.controls['light'].current.value;
    			//this.shader.setLight(light);
    			let rotated = Transform.rotate(light[0], light[1], this.worldRotation*Math.PI);
    			this.shader.setLight([rotated.x, rotated.y]);
    		}
    		return done;
    	}
    	draw(transform, viewport) {
    		this.worldRotation = transform.a + this.transform.a;
    		return super.draw(transform, viewport);
    	}
    }

    Layer.prototype.types['rti'] = (options) => { return new LayerRTI(options); };

    /**
     * Extends {@link Shader}, initialized with a Neural .json (
    **/
     
    class ShaderNeural extends Shader {
    	constructor(options) {
    		super({});

    		Object.assign(this, {
    			modes: ['light'],
    			mode: 'light',

    			nplanes: null,	 //number of coefficient planes

    			scale: null,	  //factor and bias are used to dequantize coefficient planes.
    			bias: null,

    		});
    		Object.assign(this, options);

    		this.samplers = [
    			{ id:1, name:'u_texture_1', type:'vec3' },
    			{ id:2, name:'u_texture_2', type:'vec3' },
    			{ id:3, name:'u_texture_3', type:'vec3' }
    		];

    		this.uniforms = {
    			lights: { type: 'vec2', needsUpdate: true, size: 2, value: [0.0, 0.0] },
    			min:    { type: 'vec3', needsUpdate: true, size: 3, value: [0, 0, 0] },
    			max:    { type: 'vec3', needsUpdate: true, size: 3, value: [1, 1, 1] },
    			layer1_weights: { type: 'vec4', needsUpdate: true, size: this.c*this.n/4},
    			layer1_biases:  { type: 'vec4', needsUpdate: true, size: this.n/4},
    			layer2_weights: { type: 'vec4', needsUpdate: true, size: this.n*this.n/4},
    			layer2_biases:  { type: 'vec4', needsUpdate: true, size: this.n/4},
    			layer3_weights: { type: 'vec4', needsUpdate: true, size: this.n*3/4},
    			layer3_biases:  { type: 'vec3', needsUpdate: true, size: 1},
    		};
    	}

    	createProgram(gl) {
    		super.createProgram(gl);
    		this.position_location = gl.getAttribLocation(this.program, "a_position");
    		this.texcoord_location = gl.getAttribLocation(this.program, "a_texcoord");		
    	}

    	setLight(light) {
    		this.setUniform('lights', light);
    	}

    	init() {
    		this.lightWeights([0, 0, 1], 'base');
    	}

    	setShaderInfo(samples, planes, n, c, colorspace) {
    		this.samples = samples;
    		this.planes = planes;
    		this.n = n;
    		this.c = c;
    		this.colorspace = colorspace;
    	}


    	vertShaderSrc(gl) {
    		return `#version 300 es
in vec2 a_position;
in vec2 a_texcoord;
out vec2 v_texcoord;
void main() {
	gl_Position = vec4(a_position, 0.0, 1.0);
	v_texcoord = a_texcoord;
}`;
    	}
    	fragShaderSrc(gl) {
    		return `
vec4 inputs[${this.c/4}];    // 12/4
vec4 output1[${this.n/4}];  // 52/4
vec4 output2[${this.n/4}];  // 52/4
vec3 output3;

in vec2 v_texcoord;
uniform sampler2D u_texture_1;
uniform sampler2D u_texture_2;
uniform sampler2D u_texture_3;
uniform vec2 lights;

uniform vec4 layer1_weights[${this.c*this.n/4}]; // 12*52/4
uniform vec4 layer1_biases[${this.n/4}];  // 52/4
uniform vec4 layer2_weights[${this.n*this.n/4}]; // 52*52/4
uniform vec4 layer2_biases[${this.n/4}];  // 52/4
uniform vec4 layer3_weights[${this.n*3/4}];  // 52*3/4
uniform vec3 layer3_biases;

uniform vec3 min[${this.planes/3}];
uniform vec3 max[${this.planes/3}];

float elu(float a){
	return (a > 0.0) ? a : (exp(a) - 1.0);
}


vec4 relightCoeff(vec3 color_1, vec3 color_2, vec3 color_3) {
	// Rescaling features
    color_1 = color_1 * (max[0] - min[0]) + min[0];
    color_2 = color_2 * (max[1] - min[1]) + min[1];
    color_3 = color_3 * (max[2] - min[2]) + min[2];

	// building input
	inputs[0] = vec4(color_1, color_2.x);
	inputs[1] = vec4(color_2.yz, color_3.xy);
	inputs[2] = vec4(color_3.z, lights, 0.0);

	float sum = 0.0;

	// layer 1 - 11 x 49
	for (int i=0; i < ${this.n}; i++){
		sum = 0.0;
		for (int j=0; j < ${this.c/4}; j++){
			sum += dot(inputs[j], layer1_weights[${this.c/4}*i+j]);
		}
		output1[i/4][i%4] = elu(sum + layer1_biases[i/4][i%4]);
	}
	
	// layer 2 - 49 x 49
	for (int i=0; i < ${this.n}; i++){
		sum = 0.0;
		for (int j=0; j < ${this.n/4}; j++){
			sum += dot(output1[j], layer2_weights[${this.n/4}*i+j]);
		}
		output2[i/4][i%4] = elu(sum + layer2_biases[i/4][i%4]);
	}

	// layer 3 - 49 x 3
	for (int i=0; i < 3; i++){
		sum = 0.0;
		for (int j=0; j < ${this.n/4}; j++){
			sum += dot(output2[j], layer3_weights[${this.n/4}*i+j]);
		}
		output3[i] = sum + layer3_biases[i];
	}
	return vec4(output3.${this.colorspace}, 1.0);
}

vec4 relight(vec2 v) {
	vec3 color_1 = texture(u_texture_1, v).${this.colorspace};
	vec3 color_2 = texture(u_texture_2, v).${this.colorspace};
	vec3 color_3 = texture(u_texture_3, v).${this.colorspace};
	return relightCoeff(color_1, color_2, color_3);
}


vec4 data() {
	return relight(v_texcoord);
}
vec4 data1() {
	vec2 uv = v_texcoord;
	bool showDiff = false;
	bool showA = false;
	if(v_texcoord.x > 0.5) {
		showDiff = true;
		uv.x -= 0.5;
	}
	if(v_texcoord.y > 0.5) {
		showA = true;
		uv.y -= 0.5;
	}
	vec2 o = floor(uv*128.0)/128.0;
	float step = 1.0/256.0;

	vec4 a = vec4(0, 0, 0, 0);
	vec3 color_1 = vec3(0, 0, 0);
	vec3 color_2 = vec3(0, 0, 0);
	vec3 color_3 = vec3(0, 0, 0);

	for(float y = 0.0; y <= step; y = y + step) {
		for(float x = 0.0; x <= step; x = x + step) {
			vec2 d = o + vec2(x, y);
			a += 0.25*relight(d);

			color_1 += texture(u_texture_1, d).${this.colorspace};
			color_2 += texture(u_texture_2, d).${this.colorspace};
			color_3 += texture(u_texture_3, d).${this.colorspace};
		}
	}
	vec4 b = relightCoeff(0.25*color_1, 0.25*color_2, 0.25*color_3);
	float diff = 255.0*length((a - b).xyz);
	if(showDiff) {
		if(diff < 10.0) {
			return vec4(0.0, 0.0, 0.0, 1.0);
		} else if (diff < 20.0) {
			return vec4(0.0, 0.0, 1.0, 1.0);
		} else if(diff < 40.0) {
			return vec4(0.0, 1.0, 0.0, 1.0);
		} else
			return vec4(1.0, 0.0, 0.0, 1.0);
	} 
	if(showA)
		return a;
	return b;
}

		`;
    	}

    }

    class LayerNeuralRTI extends Layer {
    	constructor(options) {
    		super(options || {});
    		this.currentRelightFraction = 1.0; //(min: 0, max 1)
    		this.maxTiles = 40;
    		this.relighted = false;
    		this.convergenceSpeed = 1.2;
    		this.addControl('light', [0, 0]);
    		this.worldRotation = 0; //if the canvas or ethe layer rotate, light direction neeeds to be rotated too.

    		let textureUrls = [
    			null,
    			this.layout.imageUrl(this.url, 'plane_1'),
    			this.layout.imageUrl(this.url, 'plane_2'),
    			this.layout.imageUrl(this.url, 'plane_3'),
    		];

    		this.layout.setUrls(textureUrls);

    		for (let url of textureUrls) {
    			let raster = new Raster({ format: 'vec3' });
    			this.rasters.push(raster);
    		}

    		this.imageShader = new Shader({
    			'label': 'Rgb',
    			'samplers': [{ id: 0, name: 'kd', type: 'vec3', load: false }]
    		});



    		this.neuralShader = new ShaderNeural();

    		this.shaders = { 'standard': this.imageShader, 'neural': this.neuralShader };
    		this.setShader('neural');
    		this.neuralShader.setLight([0, 0]);


    		(async () => { await this.loadNeural(this.url); })();
    	}

    	setLight(light, dt) {
    		this.setControl('light', light, dt);
    	}

    	loadTile(tile, callback) {
    		this.shader = this.neuralShader;
    		super.loadTile(tile, callback);
    	}

    	async loadNeural(url) {
    		await this.initialize(url);
    	}

    	async initialize(json_url) {

    		const info = await this.loadJSON(json_url);
    		this.max = info.max.flat(1);
    		this.min = info.min.flat(1);

    		this.width = info.width;
    		this.height = info.height;

    		let parameters = {};
    		for (let i = 0; i < 3; i++) {
    			let key = 'layer' + (i + 1);
    			parameters[key + '_weights'] = info.weights[i];//(await this.loadJSON(data_path + "/parameters/" + w + "_weights.json")).flat(1);
    			parameters[key + '_biases'] = info.biases[i]; //(await this.loadJSON(data_path + "/parameters/" + w + "_biases.json")).flat(1);
    		}

    		for (const [name, value] of Object.entries(parameters))
    			this.neuralShader.setUniform(name, value);

    		//this.neuralShader.updateUniforms(gl, this.neuralShader.program);
    		this.neuralShader.setUniform('min', this.min);
    		this.neuralShader.setUniform('max', this.max);

    		// make the fragment shader flexible to different network configurations
    		let n = info.samples;
    		let c = info.planes + 2;
    		while (n % 4 != 0)
    			n++;
    		while (c % 4 != 0)
    			c++;
    		this.neuralShader.setShaderInfo(info.samples, info.planes, n, c, info.colorspace);

    		this.networkParameters = parameters;
    	}

    	setCoords() {
    		let gl = this.gl;

    		let coords = new Float32Array([-1, -1, -1, 1, 1, 1, 1, -1]);

    		this.coords_buffer = gl.createBuffer();
    		gl.bindBuffer(gl.ARRAY_BUFFER, this.coords_buffer);
    		gl.bufferData(gl.ARRAY_BUFFER, coords, gl.STATIC_DRAW);

    		let texCoords = new Float32Array([0, 0, 0, 1, 1, 1, 1, 0]);
    		this.texCoords_buffer = gl.createBuffer();
    		gl.bindBuffer(gl.ARRAY_BUFFER, this.texCoords_buffer);
    		gl.bufferData(gl.ARRAY_BUFFER, texCoords, gl.STATIC_DRAW);
    	}


    	// little set of functions to get model, coeff and info
    	async loadJSON(info_file) {
    		const info_response = await fetch(info_file);
    		const info = await info_response.json();
    		return info;
    	}

    	/* ************************************************************************** */

    	draw(transform, viewport) {
    		//TODO this is duplicated code. move this check up 
    		if (this.status != 'ready')
    			return true;

    		this.worldRotation = transform.a + this.transform.a;

    		if (this.networkParameters !== undefined) {

    			let previousRelightFraction = this.relightFraction;
    			//adjust maxTiles to presserve framerate only when we had a draw which included relighting (but not a refine operation!).
    			if (this.relighted) {
    				if (this.canvas.fps > this.canvas.targetfps * 1.5) {
    					this.currentRelightFraction = Math.min(1.0, this.currentRelightFraction * this.convergenceSpeed);
    					//console.log('fps fast: ', this.canvas.fps, this.currentRelightFraction);
    				} else if (this.canvas.fps < this.canvas.targetfps * 0.75) {
    					this.currentRelightFraction = Math.max(this.currentRelightFraction / this.convergenceSpeed, 1 / 128);
    					this.convergenceSpeed = Math.max(1.05, Math.pow(this.convergenceSpeed, 0.9));
    					console.log('fps slow: ', this.canvas.fps, this.currentRelightFraction);
    				}
    			}
    			//this.refine = true;

    			//setup final refinement
    			if (this.refineTimeout)
    				clearTimeout(this.refineTimeout);

    			if (this.currentRelightFraction < 0.75 && this.refine == false)
    				this.refineTimeout = setTimeout(() => { this.emit('update'); this.refine = true; }, Math.max(400, 4000 / this.canvas.fps));

    			this.relightFraction = this.refine ? 1.0 : this.currentRelightFraction;
    			this.relightFraction = Math.round(this.relightFraction * 8) / 8;

    			let sizeChanged = this.relightFraction != previousRelightFraction;

    			let w = Math.round((this.layout.tilesize || this.layout.width) * this.relightFraction);
    			let h = Math.round((this.layout.tilesize || this.layout.height) * this.relightFraction);

    			//console.log("Canvas fps: ", this.canvas.fps, "relighted: ", this.relighted, "Refine? ", this.refine, " fraction: ", this.relightFraction, " w: ", this.tileRelightWidth);
    			this.refine = false;

    			let available = this.layout.available(viewport, transform, this.transform, 0, this.mipmapBias, this.tiles);

    			let tiles = Object.values(available);
    			if (tiles.length == 0)
    				return;
    			if (sizeChanged)
    				for (let tile of tiles)
    					tile.neuralUpdated = false;

    			this.relighted = false;
    			this.totTiles = 0;
    			this.totPixels = 0;
    			for (let tile of tiles) {
    				if (tile.neuralUpdated && !sizeChanged)
    					continue;
    				if (!this.relighted) {
    					this.relighted = true; //update fps next turn.
    					this.preRelight([viewport.x, viewport.y, viewport.dx, viewport.dy], w, h, sizeChanged);
    				}
    				this.relightTile(tile, w, h, sizeChanged);
    				this.totPixels += w * h;
    				this.totTiles += 1;
    			}
    			if (this.relighted)
    				this.postRelight();

    			this.relighted = this.relighted && !this.refine; //udpate fps only if not refined.
    		}

    		this.shader = this.imageShader;
    		let done = super.draw(transform, viewport);
    		this.shader = this.neuralShader;

    		return done;
    	}

    	preRelight(viewport, w, h) {
    		let gl = this.gl;

    		if (!this.neuralShader.program) {
    			this.neuralShader.createProgram(gl);
    			gl.useProgram(this.neuralShader.program);
    			for (var i = 0; i < this.neuralShader.samplers.length; i++)
    				gl.uniform1i(this.neuralShader.samplers[i].location, i);
    		} else
    			gl.useProgram(this.neuralShader.program);

    		this.neuralShader.updateUniforms(gl);

    		if (!this.coords_buffer)
    			this.setCoords();

    		gl.bindBuffer(gl.ARRAY_BUFFER, this.coords_buffer);
    		gl.vertexAttribPointer(this.neuralShader.position_location, 2, gl.FLOAT, false, 0, 0);

    		gl.bindBuffer(gl.ARRAY_BUFFER, this.texCoords_buffer);
    		gl.vertexAttribPointer(this.neuralShader.texcoord_location, 2, gl.FLOAT, false, 0, 0);

    		gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    		gl.enable(gl.BLEND);

    		if (!this.framebuffer)
    			this.framebuffer = gl.createFramebuffer();
    		gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer);


    		//save previous viewport
    		this.backupViewport = viewport;
    		gl.viewport(0, 0, w, h);
    	}

    	postRelight() {
    		let gl = this.gl;
    		gl.bindFramebuffer(gl.FRAMEBUFFER, null);

    		//restore previous viewport
    		let v = this.backupViewport;
    		this.gl.viewport(v[0], v[1], v[2], v[3]);
    	}

    	relightTile(tile, w, h, sizeChanged) {
    		let gl = this.gl;


    		let needsCreate = tile.tex[0] == null;
    		if (needsCreate) {
    			let tex = tile.tex[0] = gl.createTexture();
    			gl.bindTexture(gl.TEXTURE_2D, tex);
    			// set the filtering so we don't need mips
    			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    		}
    		if (sizeChanged || needsCreate) {
    			gl.bindTexture(gl.TEXTURE_2D, tile.tex[0]);
    			// define size and format of level 0
    			gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA,
    				w, h, 0,
    				gl.RGBA, gl.UNSIGNED_BYTE, null);

    			//gl.bindTexture(gl.TEXTURE_2D, null);
    		}

    		for (var i = 0; i < this.neuralShader.samplers.length; i++) {
    			let id = this.neuralShader.samplers[i].id;
    			gl.activeTexture(gl.TEXTURE0 + i);
    			gl.bindTexture(gl.TEXTURE_2D, tile.tex[id]);
    		}

    		gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0,
    			gl.TEXTURE_2D, tile.tex[0], 0);
    		gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);

    		tile.neuralUpdated = true;
    	}


    	interpolateControls() {
    		let done = super.interpolateControls();
    		if (done)
    			return true;

    		let light = this.controls['light'].current.value;
    		let rotated = Transform.rotate(light[0], light[1], this.worldRotation * Math.PI);
    		light = [rotated.x, rotated.y];
    		this.neuralShader.setLight(light);


    		for (let [id, tile] of this.tiles)
    			tile.neuralUpdated = false;
    		return false;
    	}
    }

    Layer.prototype.types['neural'] = (options) => { return new LayerNeuralRTI(options); };

    /**
     *  @param {object} options
     *   mode: default is color, can be [color, diffuse, specular, normals]
     * 	 color implements ward
     */

    class ShaderBRDF extends Shader {
    	constructor(options) {
    		super({});
    		this.modes = ['color', 'diffuse', 'specular', 'normals', 'monochrome'];
    		this.mode = 'color';

    		Object.assign(this, options);
    		
    		const kdCS = this.colorspaces['kd'] == 'linear' ? 0 : 1;
    		const ksCS = this.colorspaces['ks'] == 'linear' ? 0 : 1;

    		const brightness = options.brightness ? options.brightness : 1.0;
    		const gamma = options.gamma ? options.gamma : 2.2;
    		const alphaLimits = options.alphaLimits ? options.alphaLimits : [0.01, 0.5];
    		const monochromeMaterial = options.monochromeMaterial ? options.monochromeMaterial : [0.80, 0.79, 0.75];
    		const kAmbient = options.kAmbient ? options.kAmbient : 0.02;

    		this.uniforms = {
    			uLightInfo:          { type: 'vec4', needsUpdate: true, size: 4, value: [0.1, 0.1, 0.9, 0] },
    			uAlphaLimits:        { type: 'vec2', needsUpdate: true, size: 2, value: alphaLimits },
    			uBrightnessGamma:    { type: 'vec2', needsUpdate: true, size: 2, value: [brightness, gamma] },		
    			uInputColorSpaceKd:  { type: 'int', needsUpdate: true, size: 1, value: kdCS },
    			uInputColorSpaceKs:  { type: 'int', needsUpdate: true, size: 1, value: ksCS },
    			uMonochromeMaterial: { type: 'vec3', needsUpdate: true, size: 3, value: monochromeMaterial },
    			uKAmbient:           { type: 'float', needsUpdate: true, size: 1, value: kAmbient },
    			
    		};

    		this.innerCode = '';
    		this.setMode(this.mode);
    	}

    	setLight(light) {
    		// Light with 4 components (Spot: 4th==1, Dir: 4th==0)
    		this.setUniform('uLightInfo', light);
    	}

    	setMode(mode) {
    		this.mode = mode;
    		switch(mode) {
    			case 'color':
    				this.innerCode = 
    				`vec3 linearColor = (kd + ks * spec) * NdotL;
				linearColor += kd * uKAmbient; // HACK! adding just a bit of ambient`;
    			break;
    			case 'diffuse':
    				this.innerCode = 
    				`vec3 linearColor = kd;`;
    			break;
    			case 'specular':
    				this.innerCode = 
    				`vec3 linearColor = clamp((ks * spec) * NdotL, 0.0, 1.0);`;
    			break;
    			case 'normals':
    				this.innerCode = 
    				`vec3 linearColor = (N+vec3(1.))/2.;
				applyGamma = false;`;
    			break;
    			case 'monochrome':
                    this.innerCode = 'vec3 linearColor = kd * NdotL + kd * uKAmbient;';
    			break;
    			default:
    				console.log("ShaderBRDF: Unknown mode: " + mode);
    				throw Error("ShaderBRDF: Unknown mode: " + mode);
    		}
    		this.needsUpdate = true;
    	}

    	fragShaderSrc(gl) {
    		let gl2 = !(gl instanceof WebGLRenderingContext);
    		let hasKd = this.samplers.findIndex( s => s.name == 'uTexKd') != -1 && this.mode != 'monochrome';
    		let hasGloss = this.samplers.findIndex( s => s.name == 'uTexGloss') != -1 && this.mode != 'monochrome';
    		let hasKs = this.samplers.findIndex( s => s.name == 'uTexKs') != -1;	
    		let str = `

#define NULL_NORMAL vec3(0,0,0)
#define SQR(x) ((x)*(x))
#define PI (3.14159265359)
#define ISO_WARD_EXPONENT (4.0)

${gl2? 'in' : 'varying'} vec2 v_texcoord;
uniform sampler2D uTexKd;
uniform sampler2D uTexKs;
uniform sampler2D uTexNormals;
uniform sampler2D uTexGloss;

uniform vec4 uLightInfo; // [x,y,z,w] (if .w==0 => Directional, if w==1 => Spot)
uniform vec2 uAlphaLimits;
uniform vec2 uBrightnessGamma;
uniform vec3 uMonochromeMaterial;
uniform float uKAmbient;

uniform int uInputColorSpaceKd; // 0: Linear; 1: sRGB
uniform int uInputColorSpaceKs; // 0: Linear; 1: sRGB

vec3 getNormal(const in vec2 texCoord) {
	vec3 n = texture(uTexNormals, texCoord).xyz;
	n = 2. * n - vec3(1.);
	float norm = length(n);
	if(norm < 0.5) return NULL_NORMAL;
	else return n/norm;
}

vec3 linear2sRGB(vec3 linearRGB) {
    bvec3 cutoff = lessThan(linearRGB, vec3(0.0031308));
    vec3 higher = vec3(1.055)*pow(linearRGB, vec3(1.0/2.4)) - vec3(0.055);
    vec3 lower = linearRGB * vec3(12.92);
    return mix(higher, lower, cutoff);
}

vec3 sRGB2Linear(vec3 sRGB) {
    bvec3 cutoff = lessThan(sRGB, vec3(0.04045));
    vec3 higher = pow((sRGB + vec3(0.055))/vec3(1.055), vec3(2.4));
    vec3 lower = sRGB/vec3(12.92);
    return mix(higher, lower, cutoff);
}

float ward(in vec3 V, in vec3 L, in vec3 N, in vec3 X, in vec3 Y, in float alpha) {

	vec3 H = normalize(V + L);

	float H_dot_N = dot(H, N);
	float sqr_alpha_H_dot_N = SQR(alpha * H_dot_N);

	if(sqr_alpha_H_dot_N < 0.00001) return 0.0;

	float L_dot_N_mult_N_dot_V = dot(L,N) * dot(N,V);
	if(L_dot_N_mult_N_dot_V <= 0.0) return 0.0;

	float spec = 1.0 / (4.0 * PI * alpha * alpha * sqrt(L_dot_N_mult_N_dot_V));
	
	//float exponent = -(SQR(dot(H,X)) + SQR(dot(H,Y))) / sqr_alpha_H_dot_N; // Anisotropic
	float exponent = -SQR(tan(acos(H_dot_N))) / SQR(alpha); // Isotropic
	
	spec *= exp( exponent );

	return spec;
}


vec4 data() {
	vec3 N = getNormal(v_texcoord);
	if(N == NULL_NORMAL) {
		return vec4(0.0);
	}

	vec3 L = (uLightInfo.w == 0.0) ? normalize(uLightInfo.xyz) : normalize(uLightInfo.xyz - gl_FragCoord.xyz);
	vec3 V = vec3(0.0,0.0,1.0);
    vec3 H = normalize(L + V);
	float NdotL = max(dot(N,L),0.0);

	vec3 kd = ${hasKd ? 'texture(uTexKd, v_texcoord).xyz' : 'uMonochromeMaterial'};
	vec3 ks = ${hasKs ? 'texture(uTexKs, v_texcoord).xyz' : 'vec3(0.0, 0.0, 0.0)'};
	if(uInputColorSpaceKd == 1) {
		kd = sRGB2Linear(kd);
	}
	if(uInputColorSpaceKs == 1) {
		ks = sRGB2Linear(ks);
	}
	kd /= PI;

	float gloss = ${hasGloss ? 'texture(uTexGloss, v_texcoord).x' : '0.0'};
	float minGloss = 1.0 - pow(uAlphaLimits[1], 1.0 / ISO_WARD_EXPONENT);
	float maxGloss = 1.0 - pow(uAlphaLimits[0], 1.0 / ISO_WARD_EXPONENT);

	float alpha = pow(1.0 - gloss * (maxGloss - minGloss) - minGloss, ISO_WARD_EXPONENT);
	
	
	vec3 e = vec3(0.0,0.0,1.0);
	vec3 T = normalize(cross(N,e));
	vec3 B = normalize(cross(N,T));
	float spec = ward(V, L, N, T, B, alpha);
	
	bool applyGamma = true;

	${this.innerCode}

	vec3 finalColor = applyGamma ? pow(linearColor * uBrightnessGamma[0], vec3(1.0/uBrightnessGamma[1])) : linearColor;
	return vec4(finalColor, 1.0);
}
`;
    	return str;
    	}

    }

    /**
     * Extends {@link Layer}.
     * @param {options} options Same as {@link Layer}, but channels(ks,kd,normals,gloss) are required.
     */

    class LayerBRDF extends Layer {
    	constructor(options) {
    		options = Object.assign({
    			brightness: 1.0,
    			gamma: 2.2,
    			alphaLimits: [0.01, 0.5],
    			monochromeMaterial: [0.80, 0.79, 0.75],
    			kAmbient: 0.1
    		}, options);
    		super(options);

    		if(Object.keys(this.rasters).length != 0)
    			throw "Rasters options should be empty!";

    		if(!this.channels)
    			throw "channels option is required";

    		if(!this.channels.kd || !this.channels.normals)
    			throw "kd and normals channels are required";
    	
    		if(!this.colorspaces) {
    			console.log("LayerBRDF: missing colorspaces: force both to linear");
    			this.colorspaces['kd'] = 'linear';
    			this.colorspaces['ks'] = 'linear';
    		}

    		let id = 0;
    		let urls = [];
    		let samplers = [];
    		let brdfSamplersMap = {
    			kd: { format: 'vec3', name: 'uTexKd' },
    			ks: { format: 'vec3', name: 'uTexKs' },
    			normals: { format: 'vec3', name: 'uTexNormals' },
    			gloss: { format: 'float', name: 'uTexGloss' }
    		};
    		for (let c in this.channels) {
    			this.rasters.push(new Raster({ format: brdfSamplersMap[c].format }));
    			samplers.push({ 'id': id, 'name': brdfSamplersMap[c].name });
    			urls[id] = this.channels[c];
    			id++;
    		}

    		this.layout.setUrls(urls);
    		this.addControl('light', [0, 0]); // This is a projection to the z=0 plane.
    		
    		let shader = new ShaderBRDF({
    			'label': 'Rgb',
    			'samplers': samplers,
    			'colorspaces': this.colorspaces,
    			'brightness': this.brightness,
    			'gamma': this.gamma,
    			'alphaLimits': this.alphaLimits,
    			'monochromeMaterial': this.monochromeMaterial,
    			'kAmbient': this.kAmbient
    		});

    		this.shaders['brdf'] = shader;
    		this.setShader('brdf');
    	}

    	static projectToSphere(p) {
    		let px = p[0];
    		let py = p[1];

    		let r2 = px * px + py * py;
    		if (r2 > 1.0) {
    			let r = Math.sqrt(r2);
    			px /= r;
    			py /= r;
    			r2 = 1.0;
    		}
    		let z = Math.sqrt(1 - r2);
    		return [px, py, z];
    	}

    	// Idea from SGI trackball, siggraph 1988 (e.g., http://gxsm.sourceforge.net/gxsmsrcdoxy/html/d2/db2/gxsm_2trackball_8C-source.html)
    	// The point is projected to a sphere in the center, and deformed to a
    	// hyperbolic sheet of rotation away from it in order to avoid
    	// the acceleration due to projection on an increasingly vertical 
    	// surface
    	static projectToFlattenedSphere(p) {
    		const R = 0.8; const R2 = R * R;
    		const RR = R * Math.SQRT1_2; const RR2 = RR * RR;

    		let px = Math.min(Math.max(p[0], -1.0), 1.0);
    		let py = Math.min(Math.max(p[1], -1.0), 1.0);
    		let z = 0.0;
    		let d2 = px * px + py * py;
    		if (d2 < RR2) {
    			// Inside sphere
    			z = Math.sqrt(R2 - d2);
    		} else {
    			// On hyperbola
    			z = RR2 / Math.sqrt(d2);
    		}
    		let r = Math.sqrt(d2 + z * z);
    		return [px / r, py / r, z / r];
    	}

    	setLight(light, dt, easing='linear') {
    		this.setControl('light', light, dt, easing);
    	}

    	interpolateControls() { // FIXME Wrong normalization
    		let done = super.interpolateControls();
    //		let light = LayerBRDF.projectToSphere(this.controls['light'].current.value);
    		let light = LayerBRDF.projectToFlattenedSphere(this.controls['light'].current.value);
    		this.shader.setLight([light[0], light[1], light[2], 0]);
    		return done;
    	}
    }


    Layer.prototype.types['brdf'] = (options) => { return new LayerBRDF(options); };

    class ShaderLens extends Shader {
        constructor(options) {
            super(options);
            
            this.samplers = [
    			{ id:0, name:'source0' }, { id:1, name:'source1' }
    		];
            
            this.uniforms = {
                u_lens: { type: 'vec4', needsUpdate: true, size: 4, value: [0,0,100,10] },
                u_width_height: { type: 'vec2', needsUpdate: true, size: 2, value: [1,1]},
                u_border_color: {type: 'vec4', needsUpdate: true, size: 4, value: [0.8, 0.8, 0.8, 1]},
                u_border_enable: {type: 'bool', needsUpdate: true, size: 1, value: false}        };
            this.label = "ShaderLens";
            this.needsUpdate = true;
            this.overlayLayerEnabled = false;
        }

        setOverlayLayerEnabled(x) {
            this.overlayLayerEnabled = x;
            this.needsUpdate = true;
        }

        setLensUniforms(lensViewportCoords, windowWH, borderColor, borderEnable) {
            this.setUniform('u_lens', lensViewportCoords);
            this.setUniform('u_width_height', windowWH);
            this.setUniform('u_border_color', borderColor);
            this.setUniform('u_border_enable', borderEnable);
        }

    	fragShaderSrc(gl) {
    		let gl2 = !(gl instanceof WebGLRenderingContext);

            let samplerDeclaration = `uniform sampler2D ` + this.samplers[0].name + `;`;
            let overlaySamplerCode = "";

            if (this.overlayLayerEnabled) { //FIXME two cases with transparence or not.
                samplerDeclaration += `uniform sampler2D ` + this.samplers[1].name + `;`;

                overlaySamplerCode =  
                `vec4 c1 = texture${gl2?'':'2D'}(source1, v_texcoord);
            if (r > u_lens.z) {
                float k = (c1.r + c1.g + c1.b) / 3.0;
                c1 = vec4(k, k, k, c1.a);
            } else if (u_border_enable && r > innerBorderRadius) {
                // Preserve border keeping c1 alpha at zero
                c1.a = 0.0; 
            }
            color = color * (1.0 - c1.a) + c1 * c1.a;
            `;
            }
    		return `

        ${samplerDeclaration}
        uniform vec4 u_lens; // [cx, cy, radius, border]
        uniform vec2 u_width_height; // Keep wh to map to pixels. TexCoords cannot be integer unless using texture_rectangle
        uniform vec4 u_border_color;
        uniform bool u_border_enable;
        ${gl2? 'in' : 'varying'} vec2 v_texcoord;

        vec4 lensColor(in vec4 c_in, in vec4 c_border, in vec4 c_out,
            float r, float R, float B) {
            vec4 result;
            if (u_border_enable) {
                float B_SMOOTH = B < 8.0 ? B/8.0 : 1.0;
                if (r<R-B+B_SMOOTH) {
                    float t=smoothstep(R-B, R-B+B_SMOOTH, r);
                    result = mix(c_in, c_border, t);
                } else if (r<R-B_SMOOTH) {
                    result = c_border;  
                } else {
                    float t=smoothstep(R-B_SMOOTH, R, r);
                    result = mix(c_border, c_out, t);
                }
            } else {
                result = (r<R) ? c_in : c_out;
            }
            return result;
        }

        vec4 data() {
            vec4 color;
            float innerBorderRadius = (u_lens.z - u_lens.w);
            float dx = v_texcoord.x * u_width_height.x - u_lens.x;
            float dy = v_texcoord.y * u_width_height.y - u_lens.y;
            float r = sqrt(dx*dx + dy*dy);

            vec4 c_in = texture${gl2?'':'2D'}(source0, v_texcoord);
            vec4 c_out = u_border_color; c_out.a=0.0;
            
            color = lensColor(c_in, u_border_color, c_out, r, u_lens.z, u_lens.w);

            ${overlaySamplerCode}
            return color;
        }
        `
        }

        vertShaderSrc(gl) {
    		let gl2 = !(gl instanceof WebGLRenderingContext);
    		return `${gl2? '#version 300 es':''}
 

${gl2? 'in' : 'attribute'} vec4 a_position;
${gl2? 'in' : 'attribute'} vec2 a_texcoord;

${gl2? 'out' : 'varying'} vec2 v_texcoord;
void main() {
	gl_Position = a_position;
    v_texcoord = a_texcoord;
}`;
    	}
    }

    /**
     * Displays a lens on the canvas. 
     */
    class LayerLens extends LayerCombiner {
    	constructor(options) {
    		options = Object.assign({
    			overlay: true,
    			radius: 100,
    			borderColor: [0.078, 0.078, 0.078, 1],
    			borderWidth: 12,
    			borderEnable: false,
    			dashboard: null,
    		}, options);
    		super(options);

    		if (!this.camera) {
    			console.log("Missing camera");
    			throw "Missing Camera"
    		}
    		
    		// Shader lens currently handles up to 2 layers
    		let shader = new ShaderLens();
    		if (this.layers.length == 2) shader.setOverlayLayerEnabled(true); //FIXME Is it a mode? Control?
    		this.shaders['lens'] = shader;
    		this.setShader('lens');

    		this.addControl('center', [0, 0]);
    		this.addControl('radius', [this.radius, 0]);
    		this.addControl('borderColor', this.borderColor);
    		this.addControl('borderWidth', [this.borderWidth]);

    		this.oldRadius = -9999;
    		this.oldCenter = [-9999, -9999];

    		this.useGL = true;

    		if(this.dashboard) this.dashboard.lensLayer = this;
    	}

    	setVisible(visible) {
    		if(this.dashboard) {
    			if(visible) {
    				this.dashboard.container.style.display = 'block';
    			} else {
    				this.dashboard.container.style.display = 'none';
    			}
    		}
    		super.setVisible(visible);
    	}

    	removeOverlayLayer() {
    		this.layers.length = 1;
    		this.shader.setOverlayLayerEnabled(false);
    	}

    	setBaseLayer(l) {
    		this.layers[0] = l;
    		this.emit('update');
    	}

    	setOverlayLayer(l) {
    		this.layers[1] = l;
    		this.layers[1].setVisible(true);
    		this.shader.setOverlayLayerEnabled(true);

    		this.regenerateFrameBuffers();
    	}

    	regenerateFrameBuffers() {
    		// Regenerate frame buffers
    		const w = this.layout.width;
    		const h = this.layout.height;
    		this.deleteFramebuffers();
    		this.layout.width = w;
    		this.layout.height = h;
    		this.createFramebuffers();
    	}
    	
    	setRadius(r, delayms = 100, easing='linear') {
    		this.setControl('radius', [r, 0], delayms, easing);
    	}

    	getRadius() {
    		return this.controls['radius'].current.value[0];
    	}

    	setCenter(x, y, delayms = 100, easing='linear') {
    		this.setControl('center', [x, y], delayms, easing);
    	}

    	getCurrentCenter() {
    		const p = this.controls['center'].current.value;
    		return {x:p[0], y:p[1]};
    	}

    	getTargetCenter() {
    		const p = this.controls['center'].target.value;
    		return {x:p[0], y:p[1]};
    	}

    	getBorderColor() {
    		return this.controls['borderColor'].current.value;
    	}

    	getBorderWidth() {
    		return this.controls['borderWidth'].current.value[0];
    	}

    	draw(transform, viewport) {
    		let done = this.interpolateControls();

    		// Update dashboard size & pos
    		if (this.dashboard) {
    			const c = this.getCurrentCenter();
    			const r = this.getRadius();
    			this.dashboard.update(c.x, c.y, r);
    			this.oldCenter = c;
    			this.oldRadius = r;
    		}
    		// const vlens = this.getLensInViewportCoords(transform, viewport);
    		// this.shader.setLensUniforms(vlens, [viewport.w, viewport.h], this.borderColor);
    		// this.emit('draw');
    		// super.draw(transform, viewport);

    		for(let layer of this.layers)
    			if(layer.status != 'ready')
    				return false;

    		if(!this.shader)
    			throw "Shader not specified!";

    		let gl = this.gl;

    		// Draw on a restricted viewport around the lens, to lower down the number of required tiles
    		let lensViewport = this.getLensViewport(transform, viewport);

    		// If an overlay is present, merge its viewport with the lens one
    		let overlayViewport = this.getOverlayLayerViewport(transform, viewport);
    		if (overlayViewport != null) {
    			lensViewport = this.joinViewports(lensViewport, overlayViewport);
    		}

    		gl.viewport(lensViewport.x, lensViewport.y, lensViewport.dx, lensViewport.dy);

    		// Keep the framwbuffer to the window size in order to avoid changing at each scale event
    		if(!this.framebuffers.length || this.layout.width != viewport.w || this.layout.height != viewport.h) {
    			this.deleteFramebuffers();
    			this.layout.width = viewport.w;
    			this.layout.height = viewport.h;
    			this.createFramebuffers();
    		}
    		var b = [0, 0, 0, 0];
    		gl.clearColor(b[0], b[1], b[2], b[3]);

    		// Draw the layers only within the viewport enclosing the lens
    		for(let i = 0; i < this.layers.length; i++) { 
    			gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffers[i]);
    			gl.clear(gl.COLOR_BUFFER_BIT);
    			this.layers[i].draw(transform, lensViewport);
    			gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    		}
    		
    		// Set in the lensShader the proper lens position wrt the window viewport
    		const vl = this.getLensInViewportCoords(transform, viewport);
    		this.shader.setLensUniforms(vl, [viewport.w, viewport.h], this.getBorderColor(), this.borderEnable);
    	
    		this.prepareWebGL();

    		// Bind all textures and combine them with the shaderLens
    		for(let i = 0; i < this.layers.length; i++) {
    			gl.uniform1i(this.shader.samplers[i].location, i);
    			gl.activeTexture(gl.TEXTURE0 + i);
    			gl.bindTexture(gl.TEXTURE_2D, this.textures[i]);
    		}

    		// Get texture coords of the lensViewport with respect to the framebuffer sz
    		const lx = lensViewport.x/lensViewport.w;
    		const ly = lensViewport.y/lensViewport.h;
    		const hx = (lensViewport.x+lensViewport.dx)/lensViewport.w;
    		const hy = (lensViewport.y+lensViewport.dy)/lensViewport.h;
    		
    		this.updateTileBuffers(
    			new Float32Array([-1, -1, 0,  -1, 1, 0,  1, 1, 0,  1, -1, 0]), 
    			new Float32Array([ lx, ly,     lx, hy,   hx, hy,   hx, ly]));
    		gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT,0);

    		// Restore old viewport
    		gl.viewport(viewport.x, viewport.x, viewport.dx, viewport.dy);
    		
    		return done;
    	}

    	getLensViewport(transform, viewport) {
    		const lensC = this.getCurrentCenter();
    		const l = CoordinateSystem.fromSceneToViewport(lensC, this.camera, this.useGL);
    		const r = this.getRadius() * transform.z;
    		return {x: Math.floor(l.x-r)-1, y: Math.floor(l.y-r)-1, dx: Math.ceil(2*r)+2, dy: Math.ceil(2*r)+2, w:viewport.w, h:viewport.h};
    	}

    	getOverlayLayerViewport(transform, viewport) {
    		let result = null;
    		if (this.layers.length == 2) {
    			// Get overlay projected viewport
    			let bbox = this.layers[1].boundingBox();
    			const p0v = CoordinateSystem.fromSceneToViewport({x:bbox.xLow, y:bbox.yLow}, this.camera, this.useGL);
    			const p1v = CoordinateSystem.fromSceneToViewport({x:bbox.xHigh, y:bbox.yHigh}, this.camera, this.useGL);
    	
    			// Intersect with window viewport
    			const x0 = Math.min(Math.max(0, Math.floor(p0v.x)), viewport.w);
    			const y0 = Math.min(Math.max(0, Math.floor(p0v.y)), viewport.h);
    			const x1 = Math.min(Math.max(0, Math.ceil(p1v.x)), viewport.w);
    			const y1 = Math.min(Math.max(0, Math.ceil(p1v.y)), viewport.h);

    			const width = x1 - x0;
    			const height = y1 - y0;
    			result = {x: x0, y: y0, dx:width, dy: height, w:viewport.w, h:viewport.h};
    		} 
    		return result;
    	}

    	joinViewports(v0, v1) {
    		const xm = Math.min(v0.x, v1.x);
    		const xM = Math.max(v0.x+v0.dx, v1.x+v1.dx);
    		const ym = Math.min(v0.y, v1.y);
    		const yM = Math.max(v0.y+v0.dy, v1.y+v1.dy);
    		const width = xM - xm;
    		const height = yM - ym;
    		
    		return {x:xm, y:ym, dx:width, dy:height, w: v0.w, h: v0.h };
    	}

    	getLensInViewportCoords(transform, viewport) {
    		const lensC = this.getCurrentCenter();
    		const c = CoordinateSystem.fromSceneToViewport(lensC, this.camera, this.useGL);
    		const r = this.getRadius();
    		return [c.x, c.y, r * transform.z, this.getBorderWidth()];
    	}

    }

    Layer.prototype.types['lens'] = (options) => { return new LayerLens(options); };

    /**
     * The FocusContext class is responsible for identifying a good Focus and Context situation.
     * During interaction it distributes user inputs on lens, into camera and lens movement
     * in order to keep the lens in focus and context situation, within the viewport, with enough
     * space between the lens and the viewport boundaries, for both panning and zooming actions.
     * It also computes a good transform given a lens to properly display the lens within
     * the current viewport (used for stored annotations)
     */
    class FocusContext {

        /**
         *  Subdivide pan amount (delta) between lens (focus) and camera transform (context).
         * @param {*} viewport {x, y, dx, dy, w, h}
         * @param {*} focus    lens : {position,radius}. Contain current lens in dataset coords, which will be updated to translated lens
         * @param {Transform} context Contain current transform, which  will be updated to translated context
         * @param {Number} delta amount of pan in dataset pixels
         * @param {*} imageSize {w,h} Size of the dataset width height (to clamp movement on boundaries)
         */
        static pan(viewport, focus, context, delta, imageSize) {
            let txy = this.getAmountOfFocusContext(viewport, focus, context, delta);

            // When t is 1: already in focus&context, move only the lens.
            // When t is 0.5: border situation, move both focus & context to keep the lens steady on screen.
            // In this case the context should be moved of deltaFocus*scale to achieve steadyness.
            // Thus interpolate deltaContext between 0 and deltaFocus*s (with t ranging from 1 to 0.5)
            const deltaFocus = {x:delta.x * txy.x, y: delta.y * txy.y};
            const deltaContext = {x:-deltaFocus.x * context.z * 2 * (1-txy.x), 
                                  y:-deltaFocus.y * context.z * 2 * (1-txy.y)};
            context.x += deltaContext.x;
            context.y += deltaContext.y;

            focus.position.x += deltaFocus.x;
            focus.position.y += deltaFocus.y;

            // Clamp lens position on dataset boundaries
            if (Math.abs(focus.position.x) > imageSize.w/2) {
                focus.position.x = imageSize.w/2 * Math.sign(focus.position.x);
            }

            if (Math.abs(focus.position.y) > imageSize.h/2) {
                focus.position.y = imageSize.h/2 * Math.sign(focus.position.y);
            } 
        }

        /**
         * Distribute scale between radius and camera scale in order to keep focus and context situation
         * @param {Camera}    camera 
         * @param {*}         focus    lens : {position,radius}. Contain current lens in dataset coords, which will be updated to translated lens
         * @param {Transform} context Contain current transform, which  will be updated to translated context
         * @param {Number} dz amount of scale (which should multiply scale)
         */
        static scale(camera, focus, context, dz) {
            const viewport = camera.viewport;
            const radiusRange = this.getRadiusRangeCanvas(viewport);
          
            const r = focus.radius * context.z;

            // Distribute lens scale between radius scale and context scale
            // When radius is going outside radius boundary, scale of the inverse amounts radius and zoom scale | screen size constant
            // When radius is changing from boundary condition to a valid one change only radius  and no change to zoom scale.
            // From 0.5 to boundary condition, zoomScale vary is interpolated between 1 and 1/dz.
            
            const t = Math.max(0, Math.min(1, (r - radiusRange.min) / (radiusRange.max - radiusRange.min)));
            let zoomScaleAmount = 1;
            if (dz > 1 && t > 0.5) {
                const t1 = (t - 0.5)*2;
                zoomScaleAmount = 1 * (1-t1) + t1 / dz;
            } else if (dz < 1 && t < 0.5) {
                const t1 = 2 * t;
                zoomScaleAmount = (1 - t1) / dz + t1 * 1;
            }
            let radiusScaleAmount = dz;
            const newR = r * radiusScaleAmount;

            // Clamp radius
            if (newR < radiusRange.min) {
                radiusScaleAmount = radiusRange.min / r;
            } else if (newR > radiusRange.max) {
                radiusScaleAmount = radiusRange.max / r;
            }
            // Clamp scale
            if (context.z * zoomScaleAmount < camera.minZoom) {
                zoomScaleAmount = camera.minZoom / context.z;
            } else if (context.z * zoomScaleAmount > camera.maxZoom) {
                zoomScaleAmount = camera.maxZoom / context.z;
            }
        
            // Scale around lens center
            context.x += focus.position.x*context.z*(1 - zoomScaleAmount);
            context.y += focus.position.y*context.z*(1 - zoomScaleAmount);
            context.z = context.z * zoomScaleAmount;  
            focus.radius *= radiusScaleAmount;
        }
            
        /**
         * Adapt context in order to have focus & context condition satisfied for the requested focus
         * @param {*}         viewport {x, y, dx, dy, w, h}
         * @param {*}         focus    lens : {position,radius}. Contain current lens in dataset coords
         * @param {Transform} context Contain current transform, which  will be updated to translated context
         * @param {Number}    desiredScale context desired scale (which will be clamped within min max scale)
         */
        static adaptContext(viewport, focus, context, desiredScale) {
            // Get current projected annotation center position
            //const pOld = context.sceneToViewportCoords(viewport, focus.position);
            const useGL = true;
            const pOld = CoordinateSystem.fromSceneToViewportNoCamera(focus.position, context, viewport, useGL);
            context.z = desiredScale;

            FocusContext.adaptContextScale(viewport, focus, context);
            
            // After scale, restore projected annotation position, in order to avoid
            // moving the annotation center outside the boundaries
            //const pNew = context.sceneToViewportCoords(viewport, focus.position);
            const pNew = CoordinateSystem.fromSceneToViewportNoCamera(focus.position, context, viewport, useGL);

            const delta = [pNew.x - pOld.x, pNew.y - pOld.y];
            context.x -= delta.x;
            context.y += delta.y;

            // Force annotation inside the viewport
            FocusContext.adaptContextPosition(viewport, focus, context);
        }

        /**
         * Fix context scale to make projected lens fit within viewport.
         * @param {*} viewport {x, y, dx, dy, w, h}
         * @param {*} focus    lens : {position,radius}. Contain current lens in dataset coords
         * @param {Transform} context Contain current transform, whose scale will be updated to keep lens in focus and context after scale
         */
        static adaptContextScale(viewport, focus, context) {
            context.z;
            const radiusRange = this.getRadiusRangeCanvas(viewport);
            const focusRadiusCanvas = focus.radius * context.z;
            if (focusRadiusCanvas < radiusRange.min) {
                context.z = radiusRange.min / focus.radius;
                // zoomScaleAmount = (radiusRange.min / focus.radius) / context.z;
            } else if (focusRadiusCanvas > radiusRange.max) {
                context.z = radiusRange.max / focus.radius;
                // zoomScaleAmount = (radiusRange.max / focus.radius) / context.z;
            }
        }

        /**
         * Translate context in order to put lens (focus) in focus and context condition
         * @param {*} viewport {x,y,dx,dy,w,h}
         * @param {*} focus    lens : {position,radius}
         * @param {Transform} context 
         */
        static adaptContextPosition(viewport, focus, context) {
            const delta = this.getCanvasBorder(focus, context);
            let box = this.getShrinkedBox(viewport, delta);
            const useGL = true;
            const screenP = CoordinateSystem.fromSceneToViewportNoCamera(focus.position, context, viewport, useGL);
           
            const deltaMinX = Math.max(0, (box.xLow - screenP.x));
            const deltaMaxX = Math.min(0, (box.xHigh - screenP.x));
            context.x += deltaMinX != 0 ? deltaMinX : deltaMaxX;
            
            const deltaMinY = Math.max(0, (box.yLow - screenP.y));
            const deltaMaxY = Math.min(0, (box.yHigh - screenP.y));
            context.y += deltaMinY != 0 ? deltaMinY : deltaMaxY;
        }

        /**
         * @ignore
         */
        static getAmountOfFocusContext(viewport, focus, context, panDir) {
            // Returns a value t which is used to distribute pan between focus and context. 
            // Return a value among 0.5 and 1. 1 is full focus and context,
            // 0.5 is borderline focus and context. 
            const delta = this.getCanvasBorder(focus, context);
            const box = this.getShrinkedBox(viewport, delta);
            //  const p = context.sceneToViewportCoords(viewport, focus.position); 
            const useGL = true;
            const p = CoordinateSystem.fromSceneToViewportNoCamera(focus.position, context, viewport, useGL);
            

            const halfCanvasW = viewport.w / 2 - delta;
            const halfCanvasH = viewport.h / 2 - delta;
        
            let xDistance = (panDir.x > 0 ?
              Math.max(0, Math.min(halfCanvasW, box.xHigh - p.x)) / (halfCanvasW) :
              Math.max(0, Math.min(halfCanvasW, p.x - box.xLow)) / (halfCanvasW));
            xDistance = this.smoothstep(xDistance, 0, 0.75);
        
            let yDistance = (panDir.y > 0 ?
              Math.max(0, Math.min(halfCanvasH, box.yHigh - p.y)) / (halfCanvasH) :
              Math.max(0, Math.min(halfCanvasH, p.y - box.yLow)) / (halfCanvasH));
            yDistance = this.smoothstep(yDistance, 0, 0.75);
            
            // Use d/2+05, because when d = 0.5 camera movement = lens movement 
            // with the effect of the lens not moving from its canvas position.
            const txy =  {x:xDistance / 2 + 0.5, y: yDistance / 2 + 0.5};
            return txy;
        }

        /**
         * @ignore
         */
        static getCanvasBorder(focus, context) {
            // Return the min distance in canvas pixel of the lens center from the boundary.
            const radiusFactorFromBoundary = 1.5;
            return context.z * focus.radius * radiusFactorFromBoundary; // Distance Lens Center Canvas Border
        }
          
        /**
         * @ignore
         */
        static getShrinkedBox(viewport, delta) {
            // Return the viewport box in canvas pixels, shrinked of delta pixels on the min,max corners
            const box = {
               xLow:delta, 
               yLow:delta,
               xHigh:viewport.w - delta, 
               yHigh:viewport.h - delta
            };
            return box;
        }

        /**
         * @ignore
         */
        static getRadiusRangeCanvas(viewport) {
            //  Returns the acceptable lens radius range in pixel for a certain viewport
            const maxMinRadiusRatio = 3;
            const minRadius = Math.min(viewport.w,  viewport.h) * 0.1;
            const maxRadius = minRadius * maxMinRadiusRatio;
            return {min:minRadius, max:maxRadius};
        }

        /**
         * @ignore
         */
        static smoothstep(x, x0, x1) {
            // Return the smoothstep interpolation at x, between x0 and x1. 
            if (x < x0) {
                return 0;
            } else if (x > x1) {
                return 1;
            } else {
                const t = (x - x0) / (x1 - x0);
                return t * t * (-2 * t + 3);
            }
        }

    }

    class ControllerLens extends Controller {
    	constructor(options) {

    		super(options);

            if (!options.lensLayer) {
                console.log("ControllerLens lensLayer option required");
                throw "ControllerLens lensLayer option required";
            }
     
            if (!options.camera) {
                console.log("ControllerLens camera option required");
                throw "ControllerLens camera option required";
            }

            this.panning = false;
            this.zooming = false;
            this.initialDistance = 0;
            this.startPos = {x:0, y:0};
            this.oldCursorPos = {x:0, y:0};
            this.useGL = false;
        }

    	panStart(e) {
            if (!this.active)
                return;

            const p = this.getScenePosition(e);
            this.panning = false;

            const hit = this.isInsideLens(p);
            if (this.lensLayer.visible && hit.inside) {
                // if (hit.border) {
                //     this.zooming = true;
                //     const p = this.getPixelPosition(e);
                //     this.zoomStart(p);
                // } else {
                //     this.panning = true;
                // }
                this.panning = true;
                this.startPos = p;

                e.preventDefault();
            }
    	}

    	panMove(e) {
            // Discard events due to cursor outside window
            this.getPixelPosition(e);
            if (Math.abs(e.offsetX) > 64000 || Math.abs(e.offsetY) > 64000) return;
            if(this.panning) {
                const p = this.getScenePosition(e);
                const dx = p.x-this.startPos.x;
                const dy = p.y-this.startPos.y;
                const c = this.lensLayer.getTargetCenter();
        
                this.lensLayer.setCenter(c.x + dx, c.y + dy);
                this.startPos = p;
                e.preventDefault();
            }
            //  else if (this.zooming) {
            //     const p = this.getPixelPosition(e);
            //     this.zoomMove(p);
            // }
    	}

    	panEnd(e) {
    		this.panning = false;
            this.zooming = false;
    	}

    	pinchStart(e1, e2) {
            if (!this.active)
                return;

            const p0 = this.getScenePosition(e1);
            const p1 = this.getScenePosition(e2);
            const pc = {x:(p0.x+ p1.x) * 0.5, y: (p0.y + p1.y) * 0.5};

            if (this.lensLayer.visible && this.isInsideLens(pc).inside) {
                this.zooming = true;
                this.initialDistance = this.distance(e1, e2);
                this.initialRadius = this.lensLayer.getRadius();
                this.startPos = pc;

                e1.preventDefault();
            } 
    	}

    	pinchMove(e1, e2) {
    		if (!this.zooming)
                return;
            const d = this.distance(e1, e2);
    		const scale = d / (this.initialDistance + 0.00001);
            const newRadius = scale * this.initialRadius;
            this.lensLayer.setRadius(newRadius);
    	}

    	pinchEnd(e, x, y, scale) {
    		this.zooming = false;
        }
        
        mouseWheel(e) {
            const p = this.getScenePosition(e);
            let result = false;
            if (this.lensLayer.visible && this.isInsideLens(p).inside) {
                const delta = e.deltaY > 0 ? 1 : -1;
                const factor = delta > 0 ? 1.2 : 1/1.2;
                const r = this.lensLayer.getRadius();
                this.lensLayer.setRadius(r*factor);
                this.startPos = p;

                result = true;
                e.preventDefault();
            } 
            
            return result;
        }


        
        /**
         * Start zoom operation clicking on lens border. Call it at start of pointerdown event on lens border
         * @param {*} pe pixel position in CanvasHtml
         */
         zoomStart(pe) {
             if (!this.lensLayer.visible) return;

            this.zooming = true;
            this.oldCursorPos = pe; // Used by derived class
            const p = this.getScenePosition(pe);
            const lens = this.getFocus();
            const r = lens.radius;
            const c = lens.position;
            let v = {x: p.x-c.x, y: p.y-c.y};
            let d = Math.sqrt(v.x*v.x + v.y*v.y);

            // Difference between radius and |Click-LensCenter| will be used by zoomMove
            this.deltaR = d - r;
        }

        /**
         * Zoom dragging lens border. Call it during pointermove event on lens border
         * @param {*} pe pixel position CanvasHTml
         */
         zoomMove(pe) {
            if (this.zooming) {
                const p = this.getScenePosition(pe);

                const lens = this.getFocus();
                const c = lens.position;
                let v = {x: p.x-c.x, y: p.y-c.y};
                let d = Math.sqrt(v.x*v.x + v.y*v.y);

                //  Set as new radius |Click-LensCenter|(now) - |Click-LensCenter|(start)
                const scale = this.camera.getCurrentTransform(performance.now()).z; 
                const radiusRange = FocusContext.getRadiusRangeCanvas(this.camera.viewport);
                const newRadius = Math.max(radiusRange.min / scale, d - this.deltaR);

                this.lensLayer.setRadius(newRadius, this.zoomDelay);
            }
        }

        /**
         * End of zoom operation on lens border
         */
        zoomEnd() {
            this.zooming = false;
        }

        getFocus() {
            const p = this.lensLayer.getCurrentCenter();
            const r = this.lensLayer.getRadius();
            return  {position: p, radius: r}
        }

        isInsideLens(p) {
            const c = this.lensLayer.getCurrentCenter();
            const dx = p.x - c.x;
            const dy = p.y - c.y;
            const d  = Math.sqrt(dx*dx + dy*dy);
            const r = this.lensLayer.getRadius();
            const inside = d < r;

            const t = this.camera.getCurrentTransform(performance.now());
            const b = this.lensLayer.getBorderWidth() / t.z;
            const border = inside && d > r-b;
            //console.log("IsInside " + d.toFixed(0) + " r " + r.toFixed(0) + ", b " + b.toFixed(0) + " IN " + inside + " B " + border);
            return {inside:inside, border:border};
        }

        /**
         * Convert position from CanvasHtml to Viewport
         * @param {*} e contain offsetX,offsetY position in CanvasHtml (0,0 top,left, y Down)
         * @returns Position in Viewport (0,0 at bottom,left, y Up)
         */
        getPixelPosition(e) {
            const p = {x: e.offsetX, y: e.offsetY};
            return CoordinateSystem.fromCanvasHtmlToViewport(p, this.camera, this.useGL);
        }

        /**
         * Convert position from CanvasHtml to Scene
         * @param {*} e must contain offsetX,offsetY position in CanvasHtml (0,0 top,left, y Down)
         * @returns Point in Scene coordinates (0,0 at center, y Up)
         */
    	getScenePosition(e) {
            const p = {x: e.offsetX, y: e.offsetY};
            return CoordinateSystem.fromCanvasHtmlToScene(p, this.camera, this.useGL);
        }

    	distance(e1, e2) {
    		return Math.sqrt(Math.pow(e1.x - e2.x, 2) + Math.pow(e1.y - e2.y, 2));
    	}
    }

    class ControllerFocusContext extends ControllerLens {
        static callUpdate(param) {
            param.update();
        }
        
        constructor(options) {
            super(options);
            Object.assign(this, { 
    			updateTimeInterval: 50,
                updateDelay: 100,
                zoomDelay: 150,
                zoomAmount: 1.5,
                priority: -100,
                enableDirectContextControl: true
    		}, options);

            if (!options.lensLayer) {
                console.log("ControllerFocusContext lensLayer option required");
                throw "ControllerFocusContext lensLayer option required";
            }
     
            if (!options.camera) {
                console.log("ControllerFocusContext camera option required");
                throw "ControllerFocusContext camera option required";
            }

            if (!options.canvas) {
                console.log("ControllerFocusContext canvas option required");
                throw "ControllerFocusContext canvas option required";
            }

            let callback = () => {
                const bbox = this.camera.boundingBox;
                this.maxDatasetSize = Math.max(bbox.width(), bbox.height());
                this.minDatasetSize = Math.min(bbox.width(), bbox.height());
                this.setDatasetDimensions(bbox.width(), bbox.height());
    		};
            this.canvas.addEvent('updateSize', callback);

            this.imageSize = { w: 1, h: 1 };
            this.FocusContextEnabled = true;

            this.centerToClickOffset = {x: 0, y: 0};
            this.previousClickPos = {x: 0, y: 0};
            this.currentClickPos = {x: 0, y: 0};

            this.insideLens = {inside:false, border:false};
            this.panning = false;
            this.zooming = false;
            this.panningCamera = false;

            // Handle only camera panning
            this.startPos = {x: 0, y: 0};
            this.initialTransform = this.camera.getCurrentTransform(performance.now());
            
            // Handle pinchZoom
            this.initialPinchDistance = 1;
            this.initialPinchRadius = 1;
            this.initialPinchPos = {x: 0, y: 0};
        }

    	panStart(e) {
            if (!this.active)
                return;
                
            const p = this.getScenePosition(e);
            this.panning = false;
            this.insideLens = this.isInsideLens(p);
            const startPos = this.getPixelPosition(e); 

            if (this.lensLayer.visible && this.insideLens.inside) {
                const lc = CoordinateSystem.fromSceneToViewport(this.getFocus().position, this.camera, this.useGL);
                
                this.centerToClickOffset = {x:startPos.x - lc.x, y: startPos.y - lc.y};
                this.currentClickPos = {x: startPos.x, y: startPos.y};
                this.panning = true;
            } else {
                if (this.enableDirectContextControl) {
                    this.startPos = startPos;
                    this.initialTransform = this.camera.getCurrentTransform(performance.now());
                    this.camera.target = this.initialTransform.copy(); //stop animation.
                    this.panningCamera = true;
                }
            }
            e.preventDefault();

            // Activate a timeout to call update() in order to update position also when mouse is clicked but steady
            // Stop the time out on panEnd
            this.timeOut = setInterval(this.update.bind(this), 50);
    	}

        panMove(e) {
            if (Math.abs(e.offsetX) > 64000 || Math.abs(e.offsetY) > 64000) return;
            this.currentClickPos = this.getPixelPosition(e);
            if(this.panning) ; else if (this.panningCamera) {
                let m = this.initialTransform;
                let dx = (this.currentClickPos.x - this.startPos.x);
                let dy = (this.currentClickPos.y - this.startPos.y);

                this.camera.setPosition(this.updateDelay, m.x + dx, m.y + dy, m.z, m.a);
            }
        }

    	pinchStart(e1, e2) {
            if (!this.active)
                return;

            const p0 = this.getScenePosition(e1);
            const p1 = this.getScenePosition(e2);
            const p = {x:(p0.x + p1.x) * 0.5, y: (p0.y + p1.y) * 0.5};
            this.initialPinchPos = {x: (e1.offsetX + e2.offsetX) * 0.5, y: (e1.offsetY + e2.offsetY) * 0.5};
            this.insideLens = this.isInsideLens(p);
            this.zooming = true;
            this.initialPinchDistance = this.distance(e1, e2);
            this.initialPinchRadius = this.lensLayer.getRadius();

            e1.preventDefault();
    	}

    	pinchMove(e1, e2) {
            if (this.zooming) {
                const d = this.distance(e1, e2);
                const scale = d / (this.initialPinchDistance + 0.00001);
                if (this.lensLayer.visible && this.insideLens.inside) {
                    const newRadius = scale * this.initialPinchRadius;
                    const currentRadius = this.lensLayer.getRadius();
                    const dz = newRadius / currentRadius;
                    // Zoom around initial pinch pos, and not current center to avoid unwanted drifts
                    this.updateRadiusAndScale(dz);
                    //this.initialPinchDistance = d;
                } else {
                    if (this.enableDirectContextControl) {
                        this.updateScale(this.initialPinchPos.x, this.initialPinchPos.y, scale);
                        this.initialPinchDistance = d;
                    }
                }
            }
        }

        pinchEnd(e, x, y, scale) {
    		this.zooming = false;
        }

        /**   
         * Start zoom operation clicking on lens border. Call it on pointerdown event on lens border
         * @param {*} p pixel position in 0,wh (y up)
         */
        zoomStart(pe) {
            if (this.lensLayer.visible) {
                super.zoomStart(pe);

                // Ask to call zoomUpdate at regular interval during zoommovement
                this.timeOut = setInterval(this.zoomUpdate.bind(this), 50);
            }
        }

        /**
         * Zoom dragging lens border. Call it during pointermove event on lens border
         * @param {*} p pixel position in 0,wh (y up)
         */
         zoomMove(pe) {
            if (this.zooming) {
                this.oldCursorPos = pe;
                let t = this.camera.getCurrentTransform(performance.now()); 
                // let p = t.viewportToSceneCoords(this.camera.viewport, pe); 
                const p = this.getScenePosition(pe);
                
                const lens = this.getFocus();
                const c = lens.position;
                let v = {x: p.x-c.x, y: p.y-c.y};
                let d = Math.sqrt(v.x*v.x + v.y*v.y);

                //Set as new radius |Click-LensCenter|(now) - |Click-LensCenter|(start)
                const radiusRange = FocusContext.getRadiusRangeCanvas(this.camera.viewport);
                const newRadius = Math.max(radiusRange.min / t.z, d - this.deltaR);
                const dz = newRadius / lens.radius;
                this.updateRadiusAndScale(dz);
            }
        }
        
        /** @ignore  */
        zoomUpdate() {
            // Give continuity to zoom  scale also when user is steady.
            // If lens border is able to reach user pointer zoom stops.
            // If this is not possible due to camera scale update, 
            // zoom will continue with a speed proportional to the radius/cursor distance
            
            if (this.zooming) {
                const p = this.getScenePosition(this.oldCursorPos);

                const lens = this.getFocus();
                const c = lens.position;
                let v = {x: p.x-c.x, y: p.y-c.y};
                let d = Math.sqrt(v.x*v.x + v.y*v.y);

                //Set as new radius |Click-LensCenter|(now) - |Click-LensCenter|(start)
                const radiusRange = FocusContext.getRadiusRangeCanvas(this.camera.viewport);
                let t = this.camera.getCurrentTransform(performance.now()); 
                const newRadius = Math.max(radiusRange.min / t.z, d - this.deltaR);
                const dz = newRadius / lens.radius;
                this.updateRadiusAndScale(dz);
            }
        }

        /**
         * Called at end of zoom border drag operation
         */
        zoomEnd() {
            if (this.lensLayer.visible) {
                super.zoomEnd();
                // Stop calling zoomUpdate
                clearTimeout(this.timeOut);
            }
        }
        
        mouseWheel(e) {
            const p = this.getScenePosition(e);
            this.insideLens = this.isInsideLens(p);
            const dz = e.deltaY  > 0 ? this.zoomAmount : 1/this.zoomAmount;
            if (this.lensLayer.visible && this.insideLens.inside) {
                this.updateRadiusAndScale(dz);
            } else {
                if (this.enableDirectContextControl) {
                    // Invert scale when updating scale instead of lens radius, to obtain the same zoom direction
                    const p = this.getPixelPosition(e);
                    this.updateScale(p.x, p.y, 1 / dz);
                }
            }
            e.preventDefault();
        }

        /**
         * Multiply lens radius of dz. Consequently adjust camera in order to keep Focus & Context condition verified.
         * At the end of the operation lens radius could be 
         * @param {*} dz factor to multiply lens radius
         */
        updateRadiusAndScale(dz) {
            let focus = this.getFocus();
            const now = performance.now();
            let context = this.camera.getCurrentTransform(now);

            // Subdivide zoom between focus and context
            FocusContext.scale(this.camera, focus, context, dz);
            
            // Bring focus within context constraints
            FocusContext.adaptContextPosition(this.camera.viewport, focus, context);
            
            // Set new focus and context in camera and lens
            this.camera.setPosition(this.zoomDelay, context.x, context.y, context.z, context.a);
            this.lensLayer.setRadius(focus.radius, this.zoomDelay);
        }

        updateScale(x, y, dz) {
            const now = performance.now();
            let context = this.camera.getCurrentTransform(now);
            const pos = this.camera.mapToScene(x, y, context);

            const maxDeltaZoom = this.camera.maxZoom / context.z;
            const minDeltaZoom = this.camera.minZoom / context.z;
            dz = Math.min(maxDeltaZoom, Math.max(minDeltaZoom, dz));
            
            // Zoom around cursor position
            this.camera.deltaZoom(this.updateDelay, dz, pos.x, pos.y);
        }

        panEnd() {
            if (this.panning) { clearTimeout(this.timeOut); }

            this.panning = false;
            this.panningCamera = false;
            this.zooming = false;
        }

         update() {
            if (this.panning) {
                let context = this.camera.getCurrentTransform(performance.now());
                let lensDeltaPosition = this.lastInteractionDelta();
                lensDeltaPosition.x /= context.z;
                lensDeltaPosition.y /= context.z;

                let focus = this.getFocus();
                if (this.FocusContextEnabled) {
                    FocusContext.pan(this.camera.viewport, focus, context, lensDeltaPosition, this.imageSize);
                    this.camera.setPosition(this.updateDelay, context.x, context.y, context.z, context.a);
                } else {
                    focus.position.x += lensDeltaPosition.x;
                    focus.position.y += lensDeltaPosition.y;
                }

                this.lensLayer.setCenter(focus.position.x, focus.position.y, this.updateDelay);
                this.previousClickPos = [this.currentClickPos.x, this.currentClickPos.y];
            } 
        }

        lastInteractionDelta() {
            let result = {x:0, y:0};
            // Compute delta with respect to previous position
            if (this.panning && this.insideLens.inside) {
                // For lens pan Compute delta wrt previous lens position
                const lc = CoordinateSystem.fromSceneToViewport(this.getFocus().position, this.camera, this.useGL);
                result =
                    {x: this.currentClickPos.x - lc.x - this.centerToClickOffset.x,
                     y: this.currentClickPos.y - lc.y - this.centerToClickOffset.y};
            } else {
                // For camera pan Compute delta wrt previous click position
                result = 
                    {x: this.currentClickPos.x - this.previousClickPos.x,
                     y: this.currentClickPos.y - this.previousClickPos.y};
            }
          
            return result;
        }
        
        setDatasetDimensions(width, height) {
            this.imageSize = {w: width, h:height};
        }

        initLens() {
            const t = this.camera.getCurrentTransform(performance.now());
            const imageRadius = 100 / t.z;
            this.lensLayer.setRadius(imageRadius);
            this.lensLayer.setCenter(this.imageSize.w * 0.5, this.imageSize.h*0.5);
        }

    }

    /**
     * RenderingMode for lens and background. Currently implemented only draw and hide.
     */
    const RenderingMode = {
        draw: "fill:white;",
        hide: "fill:black;"
    };

    /**
     * Callback function fired by a 'click' event on a lens dashboard element.
     * @function taskCallback
     * @param {Event} e The DOM event.
     */

    /**
     * The LensDashboard class is an optional element that can be embedded in an instance of {@link LayerLens}.
     * It represents a square HTML container of sufficient size to hold the lens that is positioned solidly against it.
     * Its main use is to allow the creation of a dashboard of HTML elements positioned around the lens.
     * 
     * In the example below a simple HTML button is positioned close to the top-left corner of the dashboard:
     * 
     * @example
     * 
     * const lensDashboard = new OpenLIME.LensDashboard(lime);
     * const lensLayer = new OpenLIME.Layer({
     * type: "lens",
     * layers: [layerIn],
     * 		camera: lime.camera,
     *		radius: 200,
     *		border: 10,
     *		dashboard: lensDashboard,
     *		visible: true
     * });
     * lime.addLayer('lens', lensLayer);
     *  
     * const btn = document.createElement('button');
     * btn.innerHTML = "Click Me";
     * btn.style = `position: absolute;  
     *				left: 0px; 
     *				top: 0px;
     *				display: inline-block; 
     *				cursor: pointer;
     *				pointer-events: auto;`;
     * lensDashboard.append(btn);
     */
    class LensDashboard {

    	/**
     	* Manages creation and update of a lens dashboard.
     	* An object literal with Layer `options` can be specified.
    	* This class instatiates an optional element of {@link LayerLens}
     	* @param {Object} options An object literal with Lensdashboard parameters.
     	* @param {number} options.borderWidth=30 The extra border thickness (in pixels) around the square including the lens.
     	*/
    	constructor(viewer, options) {
    		options = Object.assign({
    			containerSpace: 80,
    			borderColor: [0.078, 0.078, 0.078, 1],
    			borderWidth: 12,
    			layerSvgAnnotation: null   
    		}, options);
    		Object.assign(this, options);

    		this.lensLayer = null;
            this.viewer = viewer;
    		this.elements = [];
            this.container = document.createElement('div');
    		this.container.style = `position: absolute; width: 50px; height: 50px; background-color: rgb(200, 0, 0, 0.0); pointer-events: none`;
    		this.container.classList.add('openlime-lens-dashboard');		
    		this.viewer.containerElement.appendChild(this.container);
      
    		const col = [255.0 * this.borderColor[0], 255.0 * this.borderColor[1], 255.0 * this.borderColor[2], 255.0 * this.borderColor[3]];
    		this.lensElm = Util.createSVGElement('svg', { viewBox: `0 0 100 100` });
    		const circle = Util.createSVGElement('circle', { cx: 10, cy: 10, r: 50 });
    		circle.setAttributeNS(null, 'style', `position:absolute; visibility: visible; fill: none; stroke: rgb(${col[0]},${col[1]},${col[2]},${col[3]}); stroke-width: ${this.borderWidth}px;`);
    		circle.setAttributeNS(null, 'shape-rendering', 'geometricPrecision');
    		this.lensElm.appendChild(circle);
    		this.container.appendChild(this.lensElm);
    		this.setupCircleInteraction(circle);
    		this.lensBox = { x: 0, y: 0, r: 0, w: 0, h: 0 };
    		  
    		this.svgElement = null;
    		this.svgMaskId = 'openlime-image-mask';
    		this.svgMaskUrl = `url(#${this.svgMaskId})`;

    		this.noupdate=false;
        }

    	/**
    	 * Setup the event listener to update lens radius by dragging lens border.
    	 * Call the lens controller to update lens radius.
    	 * @param {*} circle lens svg border.
    	 */
    	setupCircleInteraction(circle) {
    		circle.style.pointerEvents = 'auto';
    		this.isCircleSelected = false;

    		// OffsetXY are unstable from this point (I don't know why)
    		// Thus get coordinates from clientXY
    		function getXYFromEvent(e, container) {
    			const x = e.clientX -  container.offsetLeft - container.clientLeft;
    			const y = e.clientY - container.offsetTop - container.clientTop;
    			return {offsetX:x, offsetY:y};
    		}

            this.viewer.containerElement.addEventListener('pointerdown', (e) => {
                if(circle == e.target) {
                    this.isCircleSelected = true;		
    				if (this.lensLayer.controllers[0]) {
    					const p = getXYFromEvent(e, this.viewer.containerElement);
    					this.lensLayer.controllers[0].zoomStart(p);
    				}
    				e.preventDefault();
    				e.stopPropagation();
    			}
    		 });

    		 this.viewer.containerElement.addEventListener('pointermove', (e) => {
    			 if (this.isCircleSelected) {
    				if (this.lensLayer.controllers[0]) {
    					const p = getXYFromEvent(e, this.viewer.containerElement);
    					this.lensLayer.controllers[0].zoomMove(p);
    				}
    				e.preventDefault();
    				e.stopPropagation();
    			}
    		 });

    		 this.viewer.containerElement.addEventListener('pointerup', (e) => {
    			if (this.isCircleSelected) {
    				if (this.lensLayer.controllers[0]) {
    					this.lensLayer.controllers[0].zoomEnd();
    				}
    				this.isCircleSelected = false;
    				e.preventDefault();
    				e.stopPropagation();
    			}
    		 });
    	}

    	/**
    	 * Call this to set the corresponding LayerSvgAnnotation
    	 * @param {LayerSvgAnnotation} l 
    	 */
    	setLayerSvgAnnotation(l) {
    		this.layerSvgAnnotation = l;
    		this.svgElement = this.layerSvgAnnotation.svgElement;
    	}

    	/** @ignore */
    	createSvgLensMask() {
    		if (this.svgElement == null) this.setupSvgElement();
    		if (this.svgElement == null) return;
    	
    		// Create a mask made of a rectangle (it will be set to the full viewport) for the background
    		// And a circle, corresponding to the lens. 
            const w = 100; // The real size will be set at each frame by the update function
            this.svgMask = Util.createSVGElement("mask", {id: this.svgMaskId});
    		this.svgGroup = Util.createSVGElement("g");
            this.outMask = Util.createSVGElement("rect", {id:'outside-lens-mask', x:-w/2, y:-w/2, width: w, height:w,  style:"fill:black;"});
            this.inMask = Util.createSVGElement("circle", {id:'inside-lens-mask', cx:0, cy:0, r: w/2, style:"fill:white;"});
            this.svgGroup.appendChild(this.outMask);
            this.svgGroup.appendChild(this.inMask);
            this.svgMask.appendChild(this.svgGroup);
    		this.svgElement.appendChild(this.svgMask);

            // FIXME Remove svgCheck. It's a Check, just to have an SVG element to mask
    		// this.svgCheck = Util.createSVGElement('rect', {x:-w/2, y:-w/2, width:w/2, height:w/2, style:'fill:orange; stroke:blue; stroke-width:5px;'}); //  
    		// this.svgCheck.setAttribute('mask', this.svgMaskUrl);
    		// this.svgElement.appendChild(this.svgCheck);
    		// console.log(this.svgCheck);
    	}

    	/** @ignore */
    	setupSvgElement() {
    		if (this.layerSvgAnnotation) {
    			// AnnotationLayer available, get its root svgElement
    			if (this.svgElement == null) {
    				//console.log("NULL SVG ELEMENT, take it from layerSvgAnnotation");
    				this.svgElement = this.layerSvgAnnotation.svgElement;
    			}
    		} else {
    			// No annotationLayer, search for an svgElement
    		
    			// First: get shadowRoot to attach the svgElement
    			let shadowRoot = this.viewer.canvas.overlayElement.shadowRoot; 
    			if (shadowRoot == null) {
    				//console.log("WARNING: null ShadowRoot, create a new one");
    				shadowRoot = this.viewer.canvas.overlayElement.attachShadow({ mode: "open" });
    			}
    		
    			//console.log("WARNING: no svg element, create a new one");
    			this.svgElement = shadowRoot.querySelector('svg');
    			if (this.svgElement == null) {
    				// Not availale svg element: build a new one and attach to the tree
    				this.svgElement = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    				this.svgElement.classList.add('openlime-svgoverlay-mask');
    				this.svgElement.setAttributeNS(null, 'style', 'pointer-events: none;');
    				shadowRoot.appendChild(this.svgElement);
    			}
    		}
    	}

    	/**
    	 * Set mask property on the svg element which need to be displayed with the lens
    	 * @param {*} svg element which need to be displayed within the lens
    	 */
    	setMaskOnSvgLayer(svg) {
    		svg.setAttributeNS(null, 'mask', this.svgMaskUrl);
    	}

    	/**
    	 * Remove mask attribute from svg element
    	 * @param {*} svg element from which remove the mask attribute
    	 */
    	removeMaskFromSvgLayer(svg) {
    		svg.removeAttribute('mask');
    	}

    	/**
    	 * Appends a HTML element to the dashboard. The element must be positioned in 'absolute' mode.
    	 * @param {*} elm A HTML element
    	 */
        append(elm) {
    		this.container.appendChild(elm);
    	}
    	
    	/**
    	 * Set rendering mode within the lens.
    	 * @param {RenderingMode} mode RenderingMode.draw or RenderingMode.hide
    	 */
        setLensRenderingMode(mode) {
            this.inMask.setAttributeNS(null, 'style', mode);
        }

    	/**
    	 * Set the background rendering mode within the lens.
    	 * @param {RenderingMode} mode RenderingMode.draw or RenderingMode.hide
    	 */
        setBackgroundRenderingMode(mode) {
            this.outMask.setAttributeNS(null, 'style', mode);
        }

    	/** @ignore */
    	update(x, y, r) {
    		const useGL = false;
    		const center = CoordinateSystem.fromSceneToCanvasHtml({x:x, y:y}, this.viewer.camera, useGL);

    		const now = performance.now();
    		let cameraT = this.viewer.camera.getCurrentTransform(now);
    		const radius = r * cameraT.z;
    		const sizew = 2 * radius + 2 * this.containerSpace;
    		const sizeh = 2 * radius + 2 * this.containerSpace;
    		const p = { x: 0, y: 0 };
    		p.x = center.x - radius - this.containerSpace;
    		p.y = center.y - radius - this.containerSpace;
    		this.container.style.left = `${p.x}px`;
    		this.container.style.top = `${p.y}px`;
    		this.container.style.width = `${sizew}px`;
    		this.container.style.height = `${sizeh}px`;

    		// Lens circle
    		if (sizew != this.lensBox.w || sizeh != this.lensBox.h) {
    			const cx = Math.ceil(sizew * 0.5);
    			const cy = Math.ceil(sizeh * 0.5);
    			this.lensElm.setAttributeNS(null, 'viewBox', `0 0 ${sizew} ${sizeh}`);
    			const circle = this.lensElm.querySelector('circle');
    			circle.setAttributeNS(null, 'cx', cx);
    			circle.setAttributeNS(null, 'cy', cy);
    			circle.setAttributeNS(null, 'r', radius - 0.5*this.borderWidth);
    		}

    		this.updateMask(cameraT, center, radius);

    		this.lensBox = {
    			x: center.x,
    			y: center.y,
    			r: radius,
    			w: sizew,
    			h: sizeh
    		};

    	}

    	updateMask(cameraT, center, radius) {
    	   if (this.svgElement == null) { this.createSvgLensMask(); }
    	   if (this.svgElement == null) return;

    	  // Lens Mask
    	  const viewport = this.viewer.camera.viewport;
    	  if (this.layerSvgAnnotation != null) {
    		// Compensate the mask transform with the inverse of the annotation svgGroup transform
    		const inverse = true;
    		const invTransfStr = this.layerSvgAnnotation.getSvgGroupTransform(cameraT, inverse);
    		this.svgGroup.setAttribute("transform", invTransfStr);
    	 } else {
    		 // Set the viewbox.  (in the other branch it is set by the layerSvgAnnotation)
    		this.svgElement.setAttribute('viewBox', `${-viewport.w / 2} ${-viewport.h / 2} ${viewport.w} ${viewport.h}`);
    	 }

    	  // Set the full viewport for outer mask rectangle
    	  this.outMask.setAttribute( 'x', -viewport.w / 2);
    	  this.outMask.setAttribute( 'y', -viewport.h / 2);
    	  this.outMask.setAttribute( 'width', viewport.w);
    	  this.outMask.setAttribute( 'height', viewport.h);

    	  // Set lens parameter for inner lens
    	  this.inMask.setAttributeNS(null, 'cx', center.x - viewport.w / 2);
    	  this.inMask.setAttributeNS(null, 'cy', center.y - viewport.h / 2);
    	  this.inMask.setAttributeNS(null, 'r', radius - this.borderWidth - 2);
    	}

    }

    class LensDashboardNavigator extends LensDashboard {
       /**
         * Manages creation and update of a lens dashboard.
         * An object literal with Layer `options` can be specified.
       * This class instatiates an optional element of {@link LayerLens}
         * @param {Object} options An object literal with Lensdashboard parameters.
         * @param {number} options.toolboxHeight=25 The extra border thickness (in pixels) around the square including the lens.
         */
       constructor(viewer, options) {
          super(viewer, options);
          options = Object.assign({
             toolboxHeight: 22,
             actions: {
                camera: { label: 'camera', task: (event) => { if (!this.actions.camera.active) this.toggleLightController(); } },
                light: { label: 'light', task: (event) => { if (!this.actions.light.active) this.toggleLightController(); } },
                annoswitch: { label: 'annoswitch', type: 'toggle', toggleClass: '.openlime-lens-dashboard-annoswitch-bar', task: (event) => { } },
                prev: { label: 'prev', task: (event) => { } },
                down: { label: 'down', task: (event) => { } },
                next: { label: 'next', task: (event) => { } },
             },
             updateCb: null,
             updateEndCb: null
          }, options);
          Object.assign(this, options);

          this.moving = false;
          this.delay = 400;
          this.timeout = null; // Timeout for moving
          this.noupdate = false;

          this.angleToolbar = 30.0 * (Math.PI / 180.0);

          this.container.style.display = 'block';
          this.container.style.margin = '0';

          const h1 = document.createElement('div');
          h1.style = `text-align: center; color: #fff`;
          h1.classList.add('openlime-lens-dashboard-toolbox-header');
          h1.innerHTML = 'MOVE';

          const h2 = document.createElement('div');
          h2.style = `text-align: center; color: #fff`;
          h2.classList.add('openlime-lens-dashboard-toolbox-header');
          h2.innerHTML = 'INFO';

          this.toolbox1 = document.createElement('div');
          this.toolbox1.style = `z-index: 10; position: absolute; padding: 4px; left: 0px; width: fit-content; background-color: rgb(20, 20, 20, 1.0); border-radius: 10px; gap: 8px`;
          this.toolbox1.classList.add('openlime-lens-dashboard-toolbox');
          this.container.appendChild(this.toolbox1);
          this.toolbox1.appendChild(h1);

          this.toolbox2 = document.createElement('div');
          this.toolbox2.style = `z-index: 10; position: absolute; padding: 4px; right: 0px; width: fit-content; background-color: rgb(20, 20, 20, 1.0); border-radius: 10px; gap: 8px`;
          this.toolbox2.classList.add('openlime-lens-dashboard-toolbox');
          this.container.appendChild(this.toolbox2);
          this.toolbox2.appendChild(h2);

          this.tools1 = document.createElement('div');
          this.tools1.style = `display: flex; justify-content: center; height: ${this.toolboxHeight}px`;
          this.tools1.classList.add('openlime-lens-dashboard-toolbox-tools');
          this.toolbox1.appendChild(this.tools1);

          this.tools2 = document.createElement('div');
          this.tools2.style = `display: flex; justify-content: center; height: ${this.toolboxHeight}px`;
          this.tools2.classList.add('openlime-lens-dashboard-toolbox-tools');
          this.toolbox2.appendChild(this.tools2);

          // TOOLBOX ITEMS

          this.actions.camera.svg = `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
        <!-- Created with Inkscape (http://www.inkscape.org/) -->
        
        <svg
           viewBox="0 0 83.319054 83.319054"
           version="1.1"
           id="svg2495"
           xmlns="http://www.w3.org/2000/svg"
           xmlns:svg="http://www.w3.org/2000/svg">
          <defs
             id="defs2492" />
          <g
             id="layer1"
             transform="translate(-69.000668,-98.39946)">
            <g
               id="g2458"
               transform="matrix(0.35277777,0,0,0.35277777,46.261671,-65.803422)"
               class="openlime-lens-dashboard-camera">
              <path class="openlime-lens-dashboard-button-bkg"
                 d="m 300.637,583.547 c 0,65.219 -52.871,118.09 -118.09,118.09 -65.219,0 -118.09,-52.871 -118.09,-118.09 0,-65.219 52.871,-118.09 118.09,-118.09 65.219,0 118.09,52.871 118.09,118.09 z"
                 style="fill:#ffffff;fill-opacity:1;fill-rule:nonzero;stroke:none"
                 id="path50" />
              <g
                 id="g52">
                <path
                   d="M 123.445,524.445 H 241.652 V 642.648 H 123.445 Z"
                   style="fill:#ffffff;fill-opacity:0;fill-rule:nonzero;stroke:#000000;stroke-width:16.7936;stroke-linecap:butt;stroke-linejoin:round;stroke-miterlimit:4;stroke-dasharray:none;stroke-opacity:1"
                   id="path54" />
              </g>
              <g
                 id="g56"
                 transform="scale(1,0.946694)">
                <path
                   d="m 190.449,581.031 h -15.793 c -0.011,7.563 0,27.472 0,27.472 0,0 -17.133,0 -25.609,0.025 v 15.779 c 8.476,-0.009 25.609,-0.009 25.609,-0.009 0,0 0,19.881 -0.011,27.485 h 15.793 c 0.011,-7.604 0.011,-27.485 0.011,-27.485 0,0 17.125,0 25.598,0 v -15.795 c -8.473,0 -25.598,0 -25.598,0 0,0 -0.023,-19.904 0,-27.472"
                   style="fill:#000000;fill-opacity:1;fill-rule:nonzero;stroke:#000000;stroke-width:0.52673;stroke-linecap:butt;stroke-linejoin:miter;stroke-miterlimit:4;stroke-dasharray:none;stroke-opacity:1"
                   id="path58" />
              </g>
              <path
                 d="m 269.254,557.93 22.332,21.437 c 2.098,2.071 2.195,5.344 0,7.504 l -22.332,21.008 c -1.25,1.25 -5.004,1.25 -6.254,-2.504 v -46.273 c 1.25,-3.672 5.004,-2.422 6.254,-1.172 z"
                 style="fill:#000000;fill-opacity:1;fill-rule:evenodd;stroke:none"
                 id="path60" />
              <path
                 d="M 95.844,607.395 73.508,585.957 c -2.094,-2.07 -2.192,-5.34 0,-7.504 l 22.336,-21.008 c 1.25,-1.25 5,-1.25 6.254,2.504 v 46.274 c -1.254,3.672 -5.004,2.422 -6.254,1.172 z"
                 style="fill:#000000;fill-opacity:1;fill-rule:evenodd;stroke:none"
                 id="path62" />
              <path
                 d="m 157.59,494.32 21.437,-22.332 c 2.071,-2.097 5.344,-2.191 7.504,0 l 21.008,22.332 c 1.25,1.254 1.25,5.004 -2.504,6.254 h -46.273 c -3.672,-1.25 -2.422,-5 -1.172,-6.254 z"
                 style="fill:#000000;fill-opacity:1;fill-rule:evenodd;stroke:none"
                 id="path64" />
              <path
                 d="m 207.055,671.785 -21.438,22.336 c -2.07,2.094 -5.344,2.191 -7.504,0 l -21.008,-22.336 c -1.25,-1.25 -1.25,-5 2.504,-6.25 h 46.274 c 3.672,1.25 2.422,5 1.172,6.25 z"
                 style="fill:#000000;fill-opacity:1;fill-rule:evenodd;stroke:none"
                 id="path66" />
            </g>
          </g>
        </svg>`;

          this.actions.light.svg = `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
        <!-- Created with Inkscape (http://www.inkscape.org/) -->
        
        <svg
           viewBox="0 0 83.319054 83.320114"
           version="1.1"
           id="svg5698"
           xmlns="http://www.w3.org/2000/svg"
           xmlns:svg="http://www.w3.org/2000/svg">
          <defs
             id="defs5695" />
          <g
             id="layer1"
             transform="translate(-104.32352,-59.017909)">
            <g
               id="g2477"
               transform="matrix(0.35277777,0,0,0.35277777,-16.220287,-105.16169)"
               class="openlime-lens-dashboard-light">
              <path class="openlime-lens-dashboard-button-bkg"
                 d="m 577.879,583.484 c 0,65.219 -52.871,118.09 -118.09,118.09 -65.219,0 -118.09,-52.871 -118.09,-118.09 0,-65.222 52.871,-118.093 118.09,-118.093 65.219,0 118.09,52.871 118.09,118.093 z"
                 style="fill:#fbfbfb;fill-opacity:1;fill-rule:nonzero;stroke:none"
                 id="path74" />
              <path
                 d="m 546.496,558.359 22.332,21.438 c 2.098,2.066 2.192,5.34 0,7.504 l -22.332,21.004 c -1.25,1.254 -5.004,1.254 -6.254,-2.5 v -46.274 c 1.25,-3.672 5.004,-2.422 6.254,-1.172 z"
                 style="fill:#000000;fill-opacity:1;fill-rule:evenodd;stroke:none"
                 id="path76" />
              <path
                 d="M 373.082,607.82 350.75,586.383 c -2.094,-2.067 -2.191,-5.34 0,-7.504 l 22.332,-21.004 c 1.254,-1.25 5.004,-1.25 6.254,2.5 v 46.277 c -1.25,3.672 -5,2.422 -6.254,1.168 z"
                 style="fill:#000000;fill-opacity:1;fill-rule:evenodd;stroke:none"
                 id="path78" />
              <path
                 d="m 434.832,494.75 21.438,-22.332 c 2.07,-2.098 5.339,-2.195 7.503,0 l 21.008,22.332 c 1.25,1.25 1.25,5.004 -2.504,6.254 h -46.273 c -3.672,-1.25 -2.422,-5.004 -1.172,-6.254 z"
                 style="fill:#000000;fill-opacity:1;fill-rule:evenodd;stroke:none"
                 id="path80" />
              <path
                 d="m 484.297,672.215 -21.438,22.332 c -2.07,2.098 -5.343,2.195 -7.507,0 l -21.004,-22.332 c -1.25,-1.25 -1.25,-5.004 2.504,-6.254 h 46.273 c 3.672,1.25 2.422,5.004 1.172,6.254 z"
                 style="fill:#000000;fill-opacity:1;fill-rule:evenodd;stroke:none"
                 id="path82" />
              <path
                 d="m 438.223,599.988 c 0,0 -2.161,-0.535 -3.684,0.227 -1.523,0.762 -0.789,8.773 -0.789,8.773 l 16.305,-0.222 c 0,0 -14.071,3.597 -15.383,6.296 -1.317,2.7 1.672,6.786 4.34,7.426 2.136,0.516 45.793,-13.426 46.808,-14.625 0.883,-1.039 1.446,-6.75 0.528,-7.648 -0.922,-0.899 -4.602,-0.789 -4.602,-0.789 0,0 -1.449,0.113 -0.133,-3.934 1.317,-4.051 15.254,-20.137 18.672,-30.262 3.293,-9.753 1.387,-22.531 -2.367,-28.683 -3.965,-6.504 -9.598,-10.688 -17.356,-13.723 -7.789,-3.051 -22.191,-4.773 -33.664,-1.578 -11.425,3.188 -20.32,8.988 -25.507,16.649 -4.657,6.878 -4.473,20.699 -2.895,26.097 1.578,5.403 17.621,25.426 19.199,29.473 1.578,4.051 0.528,6.523 0.528,6.523 z"
                 style="fill:#000000;fill-opacity:1;fill-rule:evenodd;stroke:none"
                 id="path84" />
              <g
                 id="g86"
                 transform="scale(1,0.855493)">
                <path
                   d="m 438.223,701.337 c 0,0 -2.161,-0.626 -3.684,0.265 -1.523,0.89 -0.789,10.255 -0.789,10.255 l 16.305,-0.26 c 0,0 -14.071,4.205 -15.383,7.36 -1.317,3.155 1.672,7.931 4.34,8.68 2.136,0.603 45.793,-15.693 46.808,-17.095 0.883,-1.215 1.446,-7.89 0.528,-8.94 -0.922,-1.051 -4.602,-0.923 -4.602,-0.923 0,0 -1.449,0.133 -0.133,-4.598 1.317,-4.735 15.254,-23.538 18.672,-35.373 3.293,-11.402 1.387,-26.337 -2.367,-33.529 -3.965,-7.603 -9.598,-12.493 -17.356,-16.041 -7.789,-3.566 -22.191,-5.579 -33.664,-1.844 -11.425,3.725 -20.32,10.506 -25.507,19.46 -4.657,8.041 -4.473,24.196 -2.895,30.506 1.578,6.315 17.621,29.721 19.199,34.451 1.578,4.735 0.528,7.626 0.528,7.626 z"
                   style="fill:none;stroke:#f8f8f8;stroke-width:8.1576;stroke-linecap:butt;stroke-linejoin:miter;stroke-miterlimit:4;stroke-dasharray:none;stroke-opacity:0.00677317"
                   id="path88" />
              </g>
              <path
                 d="m 435.59,631.598 c 0.394,3.714 14.992,14.851 20.91,15.414 5.914,0.562 5.125,0.898 9.336,-0.453 4.207,-1.348 17.617,-9.223 18.277,-10.571 1.68,-3.453 2.758,-6.976 1.313,-9.113 -1.449,-2.145 -3.946,-0.563 -6.574,0.227 -2.629,0.785 -13.805,5.734 -17.489,6.859 -2.89,0.883 -9.203,-0.563 -9.203,-0.563 0,0 32.012,-10.578 33.266,-12.933 1.316,-2.477 0.262,-6.977 -2.762,-7.539 -1.926,-0.36 -43.785,13.386 -44.836,15.074 -1.055,1.688 -2.238,3.598 -2.238,3.598 z"
                 style="fill:#000000;fill-opacity:1;fill-rule:evenodd;stroke:none"
                 id="path90" />
              <g
                 id="g92"
                 transform="scale(1,0.855493)">
                <path
                   d="m 435.59,738.285 c 0.394,4.343 14.992,17.361 20.91,18.018 5.914,0.658 5.125,1.05 9.336,-0.529 4.207,-1.576 17.617,-10.781 18.277,-12.356 1.68,-4.037 2.758,-8.155 1.313,-10.653 -1.449,-2.507 -3.946,-0.657 -6.574,0.265 -2.629,0.918 -13.805,6.703 -17.489,8.018 -2.89,1.032 -9.203,-0.658 -9.203,-0.658 0,0 32.012,-12.365 33.266,-15.118 1.316,-2.895 0.262,-8.155 -2.762,-8.812 -1.926,-0.421 -43.785,15.648 -44.836,17.62 -1.055,1.973 -2.238,4.205 -2.238,4.205 z"
                   style="fill:none;stroke:#f8f8f8;stroke-width:8.1576;stroke-linecap:butt;stroke-linejoin:miter;stroke-miterlimit:4;stroke-dasharray:none;stroke-opacity:0.00677317"
                   id="path94" />
              </g>
              <path
                 d="m 438.223,599.988 c 0,0 -2.161,-0.535 -3.684,0.227 -1.523,0.762 -0.789,8.773 -0.789,8.773 l 16.305,-0.222 c 0,0 -14.071,3.597 -15.383,6.296 -1.317,2.7 1.672,6.786 4.34,7.426 2.136,0.516 45.793,-13.426 46.808,-14.625 0.883,-1.039 1.446,-6.75 0.528,-7.648 -0.922,-0.899 -4.602,-0.789 -4.602,-0.789 0,0 -1.449,0.113 -0.133,-3.934 1.317,-4.051 15.254,-20.137 18.672,-30.262 3.293,-9.753 1.387,-22.531 -2.367,-28.683 -3.965,-6.504 -9.598,-10.688 -17.356,-13.723 -7.789,-3.051 -22.191,-4.773 -33.664,-1.578 -11.425,3.188 -20.32,8.988 -25.507,16.649 -4.657,6.878 -4.473,20.699 -2.895,26.097 1.578,5.403 17.621,25.426 19.199,29.473 1.578,4.051 0.528,6.523 0.528,6.523 z"
                 style="fill:#000000;fill-opacity:1;fill-rule:evenodd;stroke:none"
                 id="path96" />
              <g
                 id="g98"
                 transform="scale(1,0.855493)">
                <path
                   d="m 438.223,701.337 c 0,0 -2.161,-0.626 -3.684,0.265 -1.523,0.89 -0.789,10.255 -0.789,10.255 l 16.305,-0.26 c 0,0 -14.071,4.205 -15.383,7.36 -1.317,3.155 1.672,7.931 4.34,8.68 2.136,0.603 45.793,-15.693 46.808,-17.095 0.883,-1.215 1.446,-7.89 0.528,-8.94 -0.922,-1.051 -4.602,-0.923 -4.602,-0.923 0,0 -1.449,0.133 -0.133,-4.598 1.317,-4.735 15.254,-23.538 18.672,-35.373 3.293,-11.402 1.387,-26.337 -2.367,-33.529 -3.965,-7.603 -9.598,-12.493 -17.356,-16.041 -7.789,-3.566 -22.191,-5.579 -33.664,-1.844 -11.425,3.725 -20.32,10.506 -25.507,19.46 -4.657,8.041 -4.473,24.196 -2.895,30.506 1.578,6.315 17.621,29.721 19.199,34.451 1.578,4.735 0.528,7.626 0.528,7.626 z"
                   style="fill:none;stroke:#f8f8f8;stroke-width:8.1576;stroke-linecap:butt;stroke-linejoin:miter;stroke-miterlimit:4;stroke-dasharray:none;stroke-opacity:0.00677317"
                   id="path100" />
              </g>
              <path
                 d="m 435.59,631.598 c 0.394,3.714 14.992,14.851 20.91,15.414 5.914,0.562 5.125,0.898 9.336,-0.453 4.207,-1.348 17.617,-9.223 18.277,-10.571 1.68,-3.453 2.758,-6.976 1.313,-9.113 -1.449,-2.145 -3.946,-0.563 -6.574,0.227 -2.629,0.785 -13.805,5.734 -17.489,6.859 -2.89,0.883 -9.203,-0.563 -9.203,-0.563 0,0 32.012,-10.578 33.266,-12.933 1.316,-2.477 0.262,-6.977 -2.762,-7.539 -1.926,-0.36 -43.785,13.386 -44.836,15.074 -1.055,1.688 -2.238,3.598 -2.238,3.598 z"
                 style="fill:#000000;fill-opacity:1;fill-rule:evenodd;stroke:none"
                 id="path102" />
              <g
                 id="g104"
                 transform="scale(1,0.855493)">
                <path
                   d="m 435.59,738.285 c 0.394,4.343 14.992,17.361 20.91,18.018 5.914,0.658 5.125,1.05 9.336,-0.529 4.207,-1.576 17.617,-10.781 18.277,-12.356 1.68,-4.037 2.758,-8.155 1.313,-10.653 -1.449,-2.507 -3.946,-0.657 -6.574,0.265 -2.629,0.918 -13.805,6.703 -17.489,8.018 -2.89,1.032 -9.203,-0.658 -9.203,-0.658 0,0 32.012,-12.365 33.266,-15.118 1.316,-2.895 0.262,-8.155 -2.762,-8.812 -1.926,-0.421 -43.785,15.648 -44.836,17.62 -1.055,1.973 -2.238,4.205 -2.238,4.205 z"
                   style="fill:none;stroke:#f8f8f8;stroke-width:8.1576;stroke-linecap:butt;stroke-linejoin:miter;stroke-miterlimit:4;stroke-dasharray:none;stroke-opacity:0.00677317"
                   id="path106" />
              </g>
            </g>
          </g>
        </svg>`;

          this.actions.annoswitch.svg = `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
      <!-- Created with Inkscape (http://www.inkscape.org/) -->
      
      <svg
         viewBox="0 0 83.319054 83.320114"
         version="1.1"
         id="svg11415"
         xml:space="preserve"
         xmlns="http://www.w3.org/2000/svg"
         xmlns:svg="http://www.w3.org/2000/svg"><defs
           id="defs11412"><marker
             style="overflow:visible"
             id="TriangleStart"
             refX="0"
             refY="0"
             orient="auto-start-reverse"
             markerWidth="5.3244081"
             markerHeight="6.155385"
             viewBox="0 0 5.3244081 6.1553851"
             preserveAspectRatio="xMidYMid"><path
               transform="scale(0.5)"
               style="fill:context-stroke;fill-rule:evenodd;stroke:context-stroke;stroke-width:1pt"
               d="M 5.77,0 -2.88,5 V -5 Z"
               id="path135" /></marker><marker
             style="overflow:visible"
             id="TriangleStart-5"
             refX="0"
             refY="0"
             orient="auto-start-reverse"
             markerWidth="5.3244081"
             markerHeight="6.155385"
             viewBox="0 0 5.3244081 6.1553851"
             preserveAspectRatio="xMidYMid"><path
               transform="scale(0.5)"
               style="fill:context-stroke;fill-rule:evenodd;stroke:context-stroke;stroke-width:1pt"
               d="M 5.77,0 -2.88,5 V -5 Z"
               id="path135-3" /></marker></defs><g
           id="g327"
           transform="translate(129.83427,13.264356)"><g
             id="g346"><path
               d="m -46.51522,28.396234 c 0,23.007813 -18.65172,41.659526 -41.65953,41.659526 -23.00782,0 -41.65952,-18.651713 -41.65952,-41.659526 0,-23.00887 18.6517,-41.66059 41.65952,-41.66059 23.00781,0 41.65953,18.65172 41.65953,41.66059 z"
               style="fill:#ffffff;fill-opacity:1;fill-rule:nonzero;stroke:none;stroke-width:0.352778"
               id="path68"
               class="openlime-lens-dashboard-button-bkg" /><g
               aria-label="i"
               id="text430"
               style="font-size:50.8px;line-height:1.25;font-family:'Palace Script MT';-inkscape-font-specification:'Palace Script MT';font-variant-ligatures:none;letter-spacing:0px;word-spacing:0px;stroke-width:0.264583"
               transform="matrix(1.9896002,0,0,1.9896002,-378.32178,-41.782121)"><path
                 d="m 149.74343,19.295724 c -1.4224,1.1176 -2.5908,2.032 -3.5052,2.6416 0.3556,1.0668 0.8128,1.9304 1.9304,3.556 1.4224,-1.27 1.5748,-1.4224 3.302,-2.7432 -0.1524,-0.3048 -0.254,-0.508 -0.6604,-1.1684 -0.3048,-0.6096 -0.3556,-0.6096 -0.762,-1.6256 z m 1.9304,25.4 -0.8636,0.4572 c -3.5052,1.9304 -4.1148,2.1844 -4.7244,2.1844 -0.5588,0 -0.9144,-0.5588 -0.9144,-1.4224 0,-0.8636 0,-0.8636 1.6764,-7.5692 1.8796,-7.7216 1.8796,-7.7216 1.8796,-8.128 0,-0.3048 -0.254,-0.508 -0.6096,-0.508 -0.8636,0 -3.8608,1.6764 -8.0264,4.4704 l -0.1016,1.4224 c 3.0988,-1.6764 3.2512,-1.7272 3.7084,-1.7272 0.4064,0 0.6096,0.3048 0.6096,0.8636 0,0.7112 -0.1524,1.4224 -0.9144,4.318 -2.3876,8.8392 -2.3876,8.8392 -2.3876,10.16 0,1.2192 0.4572,2.032 1.2192,2.032 0.8636,0 2.2352,-0.6604 4.9276,-2.3876 0.9652,-0.6096 1.9304,-1.2192 2.8956,-1.8796 0.4572,-0.254 0.8128,-0.508 1.4224,-0.8636 z"
                 style="font-weight:bold;font-family:Z003;-inkscape-font-specification:'Z003 Bold'"
                 id="path495" /></g><path
               style="fill:none;stroke:#000000;stroke-width:17.09477;stroke-linecap:butt;stroke-linejoin:miter;stroke-dasharray:none;stroke-opacity:1"
               d="M -66.121922,49.608737 -110.22757,7.1826674"
               id="path465"
               class="openlime-lens-dashboard-annoswitch-bar" /></g></g></svg>`;

          this.actions.prev.svg = `<svg
               viewBox="0 0 83.319054 83.320114"
               version="1.1"
               id="svg11415"
               xml:space="preserve"
               xmlns="http://www.w3.org/2000/svg"
               xmlns:svg="http://www.w3.org/2000/svg"><defs
                 id="defs11412"><marker
                   style="overflow:visible"
                   id="TriangleStart"
                   refX="0"
                   refY="0"
                   orient="auto-start-reverse"
                   markerWidth="5.3244081"
                   markerHeight="6.155385"
                   viewBox="0 0 5.3244081 6.1553851"
                   preserveAspectRatio="xMidYMid"><path
                     transform="scale(0.5)"
                     style="fill:context-stroke;fill-rule:evenodd;stroke:context-stroke;stroke-width:1pt"
                     d="M 5.77,0 -2.88,5 V -5 Z"
                     id="path135" /></marker><marker
                   style="overflow:visible"
                   id="TriangleStart-5"
                   refX="0"
                   refY="0"
                   orient="auto-start-reverse"
                   markerWidth="5.3244081"
                   markerHeight="6.155385"
                   viewBox="0 0 5.3244081 6.1553851"
                   preserveAspectRatio="xMidYMid"><path
                     transform="scale(0.5)"
                     style="fill:context-stroke;fill-rule:evenodd;stroke:context-stroke;stroke-width:1pt"
                     d="M 5.77,0 -2.88,5 V -5 Z"
                     id="path135-3" /></marker></defs><g
                 id="g417"
                 transform="matrix(3.3565779,0,0,3.3565779,129.92814,-51.220758)"><g
                   id="g335"><path
                     d="m -172.71351,100.60243 c 0,23.00781 -18.65172,41.65952 -41.65953,41.65952 -23.00782,0 -41.65952,-18.65171 -41.65952,-41.65952 0,-23.00887 18.6517,-41.66059 41.65952,-41.66059 23.00781,0 41.65953,18.65172 41.65953,41.66059 z"
                     style="fill:#ffffff;fill-opacity:1;fill-rule:nonzero;stroke:none;stroke-width:0.352778"
                     id="path68"
                     class="openlime-lens-dashboard-button-bkg"
                     transform="matrix(0.29792248,0,0,0.29792248,37.569341,-2.3002842)" /><path
                     style="fill:#030104"
                     d="m -35.494703,28.624414 c 0,-0.264 0.213,-0.474 0.475,-0.474 h 2.421 c 0.262,0 0.475,0.21 0.475,0.474 0,3.211 2.615,5.826 5.827,5.826 3.212,0 5.827,-2.615 5.827,-5.826 0,-3.214 -2.614,-5.826 -5.827,-5.826 -0.34,0 -0.68,0.028 -1.016,0.089 v 1.647 c 0,0.193 -0.116,0.367 -0.291,0.439 -0.181,0.073 -0.383,0.031 -0.521,-0.104 l -4.832,-3.273 c -0.184,-0.185 -0.184,-0.482 0,-0.667 l 4.833,-3.268 c 0.136,-0.136 0.338,-0.176 0.519,-0.104 0.175,0.074 0.291,0.246 0.291,0.438 v 1.487 c 0.34,-0.038 0.68,-0.057 1.016,-0.057 5.071,0 9.198,4.127 9.198,9.198 0,5.07 -4.127,9.197 -9.198,9.197 -5.07,10e-4 -9.197,-4.126 -9.197,-9.196 z"
                     id="path415" /></g></g></svg>`;

          this.actions.down.svg = `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
        <!-- Created with Inkscape (http://www.inkscape.org/) -->
        
        <svg
           viewBox="0 0 83.319054 83.320114"
           version="1.1"
           id="svg11415"
           xml:space="preserve"
           xmlns="http://www.w3.org/2000/svg"
           xmlns:svg="http://www.w3.org/2000/svg"><defs
             id="defs11412"><marker
               style="overflow:visible"
               id="TriangleStart"
               refX="0"
               refY="0"
               orient="auto-start-reverse"
               markerWidth="5.3244081"
               markerHeight="6.155385"
               viewBox="0 0 5.3244081 6.1553851"
               preserveAspectRatio="xMidYMid"><path
                 transform="scale(0.5)"
                 style="fill:context-stroke;fill-rule:evenodd;stroke:context-stroke;stroke-width:1pt"
                 d="M 5.77,0 -2.88,5 V -5 Z"
                 id="path135" /></marker><marker
               style="overflow:visible"
               id="TriangleStart-5"
               refX="0"
               refY="0"
               orient="auto-start-reverse"
               markerWidth="5.3244081"
               markerHeight="6.155385"
               viewBox="0 0 5.3244081 6.1553851"
               preserveAspectRatio="xMidYMid"><path
                 transform="scale(0.5)"
                 style="fill:context-stroke;fill-rule:evenodd;stroke:context-stroke;stroke-width:1pt"
                 d="M 5.77,0 -2.88,5 V -5 Z"
                 id="path135-3" /></marker></defs><g
             id="g4652"
             transform="translate(145.46385,95.197966)"><g
               id="g4846"
               transform="translate(-126.60931,52.756264)"><path
                 d="m 64.464511,-106.29364 c 0,23.007813 -18.65172,41.659526 -41.65953,41.659526 -23.0078196,0 -41.659526,-18.651713 -41.659526,-41.659526 0,-23.00887 18.6517064,-41.66059 41.659526,-41.66059 23.00781,0 41.65953,18.65172 41.65953,41.66059 z"
                 style="fill:#ffffff;fill-opacity:1;fill-rule:nonzero;stroke:none;stroke-width:0.352778"
                 id="path68"
                 class="openlime-lens-dashboard-button-bkg" /><g
                 id="g2392-5"
                 transform="matrix(0.26458333,0,0,0.26458333,-283.58108,-263.57207)"><path
                   style="fill:none;fill-rule:evenodd;stroke:#000000;stroke-width:40;stroke-linecap:round;stroke-linejoin:miter;stroke-dasharray:none;stroke-opacity:1"
                   d="m 1072.4033,509.27736 h 171.1826"
                   id="path351-6" /><path
                   style="fill:none;fill-rule:evenodd;stroke:#000000;stroke-width:30;stroke-linecap:round;stroke-linejoin:miter;stroke-dasharray:none;stroke-opacity:1"
                   d="m 1185.0215,568.3701 h 59.6026"
                   id="path351-3-2" /><path
                   style="fill:none;fill-rule:evenodd;stroke:#000000;stroke-width:30;stroke-linecap:round;stroke-linejoin:miter;stroke-dasharray:none;stroke-opacity:1"
                   d="m 1184.2167,621.15576 h 59.6026"
                   id="path351-3-2-0" /><path
                   style="fill:none;fill-rule:evenodd;stroke:#000000;stroke-width:40;stroke-linecap:round;stroke-linejoin:miter;stroke-dasharray:none;stroke-opacity:1"
                   d="m 1072.4033,679.59496 h 171.1826"
                   id="path351-3-6-7-1" /><path
                   style="display:inline;fill:none;fill-rule:evenodd;stroke:#000000;stroke-width:11.4448;stroke-linecap:butt;stroke-linejoin:miter;stroke-dasharray:none;stroke-opacity:1;marker-end:url(#TriangleStart-5)"
                   d="m 1074.9115,570.87447 54.1203,-0.0275"
                   id="path1366-2" /><path
                   style="fill:none;fill-rule:evenodd;stroke:#000000;stroke-width:14;stroke-linecap:butt;stroke-linejoin:miter;stroke-dasharray:none;stroke-opacity:1"
                   d="m 1080.0425,521.28147 v 54.87857"
                   id="path1402-7" /><path
                   style="fill:none;fill-rule:evenodd;stroke:#000000;stroke-width:1px;stroke-linecap:butt;stroke-linejoin:miter;stroke-opacity:1"
                   d="m 1150.8866,623.00688 0.3956,-5.02729"
                   id="path2545" /><path
                   style="fill:none;fill-rule:evenodd;stroke:#000000;stroke-width:30;stroke-linecap:round;stroke-linejoin:miter;stroke-dasharray:none;stroke-opacity:1"
                   d="m 1185.0215,567.71656 h 59.6026"
                   id="path2720" /></g></g></g></svg>`;

          this.actions.next.svg = `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
      <!-- Created with Inkscape (http://www.inkscape.org/) -->
      
      <svg
         viewBox="0 0 83.319054 83.320114"
         version="1.1"
         id="svg11415"
         xml:space="preserve"
         xmlns="http://www.w3.org/2000/svg"
         xmlns:svg="http://www.w3.org/2000/svg"><defs
           id="defs11412"><marker
             style="overflow:visible"
             id="TriangleStart"
             refX="0"
             refY="0"
             orient="auto-start-reverse"
             markerWidth="5.3244081"
             markerHeight="6.155385"
             viewBox="0 0 5.3244081 6.1553851"
             preserveAspectRatio="xMidYMid"><path
               transform="scale(0.5)"
               style="fill:context-stroke;fill-rule:evenodd;stroke:context-stroke;stroke-width:1pt"
               d="M 5.77,0 -2.88,5 V -5 Z"
               id="path135" /></marker></defs><g
           id="g4652"
           transform="translate(-12.647874,74.762541)"><path
             d="m 95.96693,-33.101955 c 0,23.007813 -18.65172,41.6595258 -41.65953,41.6595258 -23.00782,0 -41.659526,-18.6517128 -41.659526,-41.6595258 0,-23.008872 18.651706,-41.660586 41.659526,-41.660586 23.00781,0 41.65953,18.651714 41.65953,41.660586 z"
             style="fill:#ffffff;fill-opacity:1;fill-rule:nonzero;stroke:none;stroke-width:0.352778"
             id="path68"
             class="openlime-lens-dashboard-button-bkg" /><g
             id="g4636"
             transform="translate(173.74831,-50.897484)"><path
               style="fill:none;fill-rule:evenodd;stroke:#000000;stroke-width:10.5833;stroke-linecap:round;stroke-linejoin:miter;stroke-dasharray:none;stroke-opacity:1"
               d="m -142.08694,-4.7366002 h 45.292059"
               id="path351" /><path
               style="fill:none;fill-rule:evenodd;stroke:#000000;stroke-width:10.5833;stroke-linecap:round;stroke-linejoin:miter;stroke-dasharray:none;stroke-opacity:1"
               d="m -142.08694,40.326598 h 45.292059"
               id="path351-3-6-7" /><path
               style="display:inline;fill:none;fill-rule:evenodd;stroke:#000000;stroke-width:3.20746;stroke-linecap:butt;stroke-linejoin:miter;stroke-dasharray:none;stroke-opacity:1;marker-end:url(#TriangleStart)"
               d="m -136.09942,8.7192481 0.008,14.9721889"
               id="path1366" /><path
               style="fill:none;fill-rule:evenodd;stroke:#000000;stroke-width:3.70417;stroke-linecap:butt;stroke-linejoin:miter;stroke-dasharray:none;stroke-opacity:1"
               d="M -136.07283,-1.5605128 V 24.204958"
               id="path1402" /><path
               style="fill:none;fill-rule:evenodd;stroke:#000000;stroke-width:7.9375;stroke-linecap:round;stroke-linejoin:miter;stroke-dasharray:none;stroke-opacity:1"
               d="m -111.69142,24.864565 h 15.76985"
               id="path351-3-2-0-3" /><path
               style="fill:none;fill-rule:evenodd;stroke:#000000;stroke-width:7.9375;stroke-linecap:round;stroke-linejoin:miter;stroke-dasharray:none;stroke-opacity:1"
               d="m -111.37623,10.725444 h 15.76986"
               id="path2720-9" /></g></g></svg>`;

          for (let [name, action] of Object.entries(this.actions)) {
             action.element = Util.SVGFromString(action.svg);
             action.element.style = `height: 100%; margin: 0 5px`;
             action.element.classList.add('openlime-lens-dashboard-button');
             if (action.type == 'toggle') {
                const toggleElm = action.element.querySelector(action.toggleClass);
                toggleElm.style.visibility = `hidden`;
                action.active = false;
             }
             action.element.addEventListener('click', (e) => {
                if (action.type == 'toggle') {
                   action.active = !action.active;
                   const toggleElm = action.element.querySelector(action.toggleClass);
                   if (action.active) {
                      toggleElm.style.visibility = `visible`;
                   } else {
                      toggleElm.style.visibility = `hidden`;
                   }
                   this.noupdate=true;
                }
                action.task(e);
                e.preventDefault();
             });
          }

          this.tools1.appendChild(this.actions.camera.element);
          this.tools1.appendChild(this.actions.light.element);
          this.tools2.appendChild(this.actions.annoswitch.element);
          this.tools2.appendChild(this.actions.prev.element);
          this.tools2.appendChild(this.actions.down.element);
          this.tools2.appendChild(this.actions.next.element);

          // Set Camera movement active
          this.actions.camera.active = this.actions.camera.element.classList.toggle('openlime-lens-dashboard-camera-active');
          this.actions.light.active = false;

          // Enable camera, light, next buttons
          this.setActionEnabled('camera');
          this.setActionEnabled('light');
          this.setActionEnabled('annoswitch');
          this.setActionEnabled('next');
       }

       getAction(label) {
          let result = null;
          for (let [name, action] of Object.entries(this.actions)) {
             if (action.label === label) {
                result = action;
                break;
             }
          }
          return result;
       }

       setActionEnabled(label, enable = true) {
          const action = this.getAction(label);
          if (action) {
             action.element.classList.toggle('enabled', enable);
          }
       }

       toggleLightController() {
          let active = this.actions.light.element.classList.toggle('openlime-lens-dashboard-light-active');
          this.actions.light.active = active;
          this.actions.camera.active = this.actions.camera.element.classList.toggle('openlime-lens-dashboard-camera-active');

          for (let layer of Object.values(this.viewer.canvas.layers))
             for (let c of layer.controllers)
                if (c.control == 'light') {
                   c.active = true;
                   c.activeModifiers = active ? [0, 2, 4] : [2, 4];  //nothing, shift and alt
                }
       }

       toggle() {
          this.container.classList.toggle('closed');
       }

       /** @ignore */
       update(x, y, r) { 
          if(this.noupdate) {
             this.noupdate = false;
             return;
          }
          super.update(x,y,r);
          const center = {
             x: this.lensBox.x,
             y: this.lensBox.y
          };
          const radius = this.lensBox.r;
          const sizew = this.lensBox.w;
          const sizeh = this.lensBox.h;

          // Set toolbox position
          const tbw1 = this.toolbox1.clientWidth;
          const tbh1 = this.toolbox1.clientHeight;
          const tbw2 = this.toolbox2.clientWidth;
          const tbh2 = this.toolbox2.clientHeight;
          let cbx = radius * Math.sin(this.angleToolbar);
          let cby = radius * Math.cos(this.angleToolbar);

          let bx1 = this.containerSpace + radius - cbx - tbw1 / 2;
          let by1 = this.containerSpace + radius + cby - tbh1 / 2;
          this.toolbox1.style.left = `${bx1}px`;
          this.toolbox1.style.top = `${by1}px`;

          let bx2 = this.containerSpace + radius + cbx - tbw2 / 2;
          let by2 = this.containerSpace + radius + cby - tbh2 / 2;
          this.toolbox2.style.left = `${bx2}px`;
          this.toolbox2.style.top = `${by2}px`;

          if (this.updateCb) {
             // updateCb(c.x, c.y, r, dashboard.w, dashboard.h, canvas.w, canvas.h) all params in canvas coordinates
             this.updateCb(center.x, center.y, radius, sizew, sizeh, this.viewer.camera.viewport.w, this.viewer.camera.viewport.h);
          }

          if (!this.moving) {
             this.toggle();
             this.moving = true;
          }
          if (this.timeout) clearTimeout(this.timeout);
          this.timeout = setTimeout(() => {
             this.toggle();
             this.moving = false;
             if (this.updateEndCb) this.updateEndCb(center.x, center.y, radius, sizew, sizeh, this.viewer.camera.viewport.w, this.viewer.camera.viewport.h);
          }, this.delay);
       }
    }

    class LensDashboardNavigatorRadial extends LensDashboard {
       /**
         * Manages creation and update of a lens dashboard.
         * An object literal with Layer `options` can be specified.
       * This class instatiates an optional element of {@link LayerLens}
         * @param {Object} options An object literal with Lensdashboard parameters.
         * @param {number} options.toolboxHeight=25 The extra border thickness (in pixels) around the square including the lens.
         */
       constructor(viewer, options) {
          super(viewer, options);
          options = Object.assign({
             toolSize: 34,
             toolPadding: 0,
             group: [-65, 0],
             actions: {
                camera: { label: 'camera', group: 0, angle: -25, task: (event) => { if (!this.actions.camera.active) this.toggleLightController(); } },
                light: { label: 'light', group: 0, angle: 0, task: (event) => { if (!this.actions.light.active) this.toggleLightController(); } },
                annoswitch: { label: 'annoswitch', group: 1, angle: 0, type: 'toggle', toggleClass: '.openlime-lens-dashboard-annoswitch-bar', task: (event) => { } },
                prev: { label: 'prev', group: 1, angle: 25, task: (event) => { } },
                down: { label: 'down', group: 1, angle: 50, task: (event) => { } },
                next: { label: 'next', group: 1, angle: 75, task: (event) => { } },
             },
              updateCb: null,
             updateEndCb: null
          }, options);
          Object.assign(this, options);

          this.moving = false;
          this.delay = 400;
          this.timeout = null; // Timeout for moving
          this.noupdate = false;

          // TOOLBOX BKG
     		const col = [255.0 * this.borderColor[0], 255.0 * this.borderColor[1], 255.0 * this.borderColor[2], 255.0 * this.borderColor[3]];
          col[3]=0.4;
          this.toolboxBkgSize = 56                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               ;
          this.toolboxBkgPadding = 4;
          this.toolboxBkg = new Object();
          this.toolboxBkg.svg = `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
         <svg
            viewBox="0 0 200 200"
            fill="none"
            version="1.1"
            id="svg11"
            xmlns="http://www.w3.org/2000/svg"
            xmlns:svg="http://www.w3.org/2000/svg">
           <path id="shape-dashboard-bkg" d="" stroke="none" fill="rgb(${col[0]},${col[1]},${col[2]},${col[3]})"/>
         </svg>`;
          this.toolboxBkg.element = Util.SVGFromString(this.toolboxBkg.svg);
          this.toolboxBkg.element.setAttributeNS(null, 'style', 'position: absolute; top: 0px; left:0px;');
          this.container.appendChild(this.toolboxBkg.element);

          // TOOLBOX ITEMS
          this.actions.camera.svg = `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
        <!-- Created with Inkscape (http://www.inkscape.org/) -->
        
        <svg
           viewBox="0 0 83.319054 83.319054"
           version="1.1"
           id="svg2495"
           xmlns="http://www.w3.org/2000/svg"
           xmlns:svg="http://www.w3.org/2000/svg">
          <defs
             id="defs2492" />
          <g
             id="layer1"
             transform="translate(-69.000668,-98.39946)">
            <g
               id="g2458"
               transform="matrix(0.35277777,0,0,0.35277777,46.261671,-65.803422)"
               class="openlime-lens-dashboard-camera">
              <path class="openlime-lens-dashboard-button-bkg"
                 d="m 300.637,583.547 c 0,65.219 -52.871,118.09 -118.09,118.09 -65.219,0 -118.09,-52.871 -118.09,-118.09 0,-65.219 52.871,-118.09 118.09,-118.09 65.219,0 118.09,52.871 118.09,118.09 z"
                 style="fill:#ffffff;fill-opacity:1;fill-rule:nonzero;stroke:none"
                 id="path50" />
              <g
                 id="g52">
                <path
                   d="M 123.445,524.445 H 241.652 V 642.648 H 123.445 Z"
                   style="fill:#ffffff;fill-opacity:0;fill-rule:nonzero;stroke:#000000;stroke-width:16.7936;stroke-linecap:butt;stroke-linejoin:round;stroke-miterlimit:4;stroke-dasharray:none;stroke-opacity:1"
                   id="path54" />
              </g>
              <g
                 id="g56"
                 transform="scale(1,0.946694)">
                <path
                   d="m 190.449,581.031 h -15.793 c -0.011,7.563 0,27.472 0,27.472 0,0 -17.133,0 -25.609,0.025 v 15.779 c 8.476,-0.009 25.609,-0.009 25.609,-0.009 0,0 0,19.881 -0.011,27.485 h 15.793 c 0.011,-7.604 0.011,-27.485 0.011,-27.485 0,0 17.125,0 25.598,0 v -15.795 c -8.473,0 -25.598,0 -25.598,0 0,0 -0.023,-19.904 0,-27.472"
                   style="fill:#000000;fill-opacity:1;fill-rule:nonzero;stroke:#000000;stroke-width:0.52673;stroke-linecap:butt;stroke-linejoin:miter;stroke-miterlimit:4;stroke-dasharray:none;stroke-opacity:1"
                   id="path58" />
              </g>
              <path
                 d="m 269.254,557.93 22.332,21.437 c 2.098,2.071 2.195,5.344 0,7.504 l -22.332,21.008 c -1.25,1.25 -5.004,1.25 -6.254,-2.504 v -46.273 c 1.25,-3.672 5.004,-2.422 6.254,-1.172 z"
                 style="fill:#000000;fill-opacity:1;fill-rule:evenodd;stroke:none"
                 id="path60" />
              <path
                 d="M 95.844,607.395 73.508,585.957 c -2.094,-2.07 -2.192,-5.34 0,-7.504 l 22.336,-21.008 c 1.25,-1.25 5,-1.25 6.254,2.504 v 46.274 c -1.254,3.672 -5.004,2.422 -6.254,1.172 z"
                 style="fill:#000000;fill-opacity:1;fill-rule:evenodd;stroke:none"
                 id="path62" />
              <path
                 d="m 157.59,494.32 21.437,-22.332 c 2.071,-2.097 5.344,-2.191 7.504,0 l 21.008,22.332 c 1.25,1.254 1.25,5.004 -2.504,6.254 h -46.273 c -3.672,-1.25 -2.422,-5 -1.172,-6.254 z"
                 style="fill:#000000;fill-opacity:1;fill-rule:evenodd;stroke:none"
                 id="path64" />
              <path
                 d="m 207.055,671.785 -21.438,22.336 c -2.07,2.094 -5.344,2.191 -7.504,0 l -21.008,-22.336 c -1.25,-1.25 -1.25,-5 2.504,-6.25 h 46.274 c 3.672,1.25 2.422,5 1.172,6.25 z"
                 style="fill:#000000;fill-opacity:1;fill-rule:evenodd;stroke:none"
                 id="path66" />
            </g>
          </g>
        </svg>`;

          this.actions.light.svg = `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
        <!-- Created with Inkscape (http://www.inkscape.org/) -->
        
        <svg
           viewBox="0 0 83.319054 83.320114"
           version="1.1"
           id="svg5698"
           xmlns="http://www.w3.org/2000/svg"
           xmlns:svg="http://www.w3.org/2000/svg">
          <defs
             id="defs5695" />
          <g
             id="layer1"
             transform="translate(-104.32352,-59.017909)">
            <g
               id="g2477"
               transform="matrix(0.35277777,0,0,0.35277777,-16.220287,-105.16169)"
               class="openlime-lens-dashboard-light">
              <path class="openlime-lens-dashboard-button-bkg"
                 d="m 577.879,583.484 c 0,65.219 -52.871,118.09 -118.09,118.09 -65.219,0 -118.09,-52.871 -118.09,-118.09 0,-65.222 52.871,-118.093 118.09,-118.093 65.219,0 118.09,52.871 118.09,118.093 z"
                 style="fill:#fbfbfb;fill-opacity:1;fill-rule:nonzero;stroke:none"
                 id="path74" />
              <path
                 d="m 546.496,558.359 22.332,21.438 c 2.098,2.066 2.192,5.34 0,7.504 l -22.332,21.004 c -1.25,1.254 -5.004,1.254 -6.254,-2.5 v -46.274 c 1.25,-3.672 5.004,-2.422 6.254,-1.172 z"
                 style="fill:#000000;fill-opacity:1;fill-rule:evenodd;stroke:none"
                 id="path76" />
              <path
                 d="M 373.082,607.82 350.75,586.383 c -2.094,-2.067 -2.191,-5.34 0,-7.504 l 22.332,-21.004 c 1.254,-1.25 5.004,-1.25 6.254,2.5 v 46.277 c -1.25,3.672 -5,2.422 -6.254,1.168 z"
                 style="fill:#000000;fill-opacity:1;fill-rule:evenodd;stroke:none"
                 id="path78" />
              <path
                 d="m 434.832,494.75 21.438,-22.332 c 2.07,-2.098 5.339,-2.195 7.503,0 l 21.008,22.332 c 1.25,1.25 1.25,5.004 -2.504,6.254 h -46.273 c -3.672,-1.25 -2.422,-5.004 -1.172,-6.254 z"
                 style="fill:#000000;fill-opacity:1;fill-rule:evenodd;stroke:none"
                 id="path80" />
              <path
                 d="m 484.297,672.215 -21.438,22.332 c -2.07,2.098 -5.343,2.195 -7.507,0 l -21.004,-22.332 c -1.25,-1.25 -1.25,-5.004 2.504,-6.254 h 46.273 c 3.672,1.25 2.422,5.004 1.172,6.254 z"
                 style="fill:#000000;fill-opacity:1;fill-rule:evenodd;stroke:none"
                 id="path82" />
              <path
                 d="m 438.223,599.988 c 0,0 -2.161,-0.535 -3.684,0.227 -1.523,0.762 -0.789,8.773 -0.789,8.773 l 16.305,-0.222 c 0,0 -14.071,3.597 -15.383,6.296 -1.317,2.7 1.672,6.786 4.34,7.426 2.136,0.516 45.793,-13.426 46.808,-14.625 0.883,-1.039 1.446,-6.75 0.528,-7.648 -0.922,-0.899 -4.602,-0.789 -4.602,-0.789 0,0 -1.449,0.113 -0.133,-3.934 1.317,-4.051 15.254,-20.137 18.672,-30.262 3.293,-9.753 1.387,-22.531 -2.367,-28.683 -3.965,-6.504 -9.598,-10.688 -17.356,-13.723 -7.789,-3.051 -22.191,-4.773 -33.664,-1.578 -11.425,3.188 -20.32,8.988 -25.507,16.649 -4.657,6.878 -4.473,20.699 -2.895,26.097 1.578,5.403 17.621,25.426 19.199,29.473 1.578,4.051 0.528,6.523 0.528,6.523 z"
                 style="fill:#000000;fill-opacity:1;fill-rule:evenodd;stroke:none"
                 id="path84" />
              <g
                 id="g86"
                 transform="scale(1,0.855493)">
                <path
                   d="m 438.223,701.337 c 0,0 -2.161,-0.626 -3.684,0.265 -1.523,0.89 -0.789,10.255 -0.789,10.255 l 16.305,-0.26 c 0,0 -14.071,4.205 -15.383,7.36 -1.317,3.155 1.672,7.931 4.34,8.68 2.136,0.603 45.793,-15.693 46.808,-17.095 0.883,-1.215 1.446,-7.89 0.528,-8.94 -0.922,-1.051 -4.602,-0.923 -4.602,-0.923 0,0 -1.449,0.133 -0.133,-4.598 1.317,-4.735 15.254,-23.538 18.672,-35.373 3.293,-11.402 1.387,-26.337 -2.367,-33.529 -3.965,-7.603 -9.598,-12.493 -17.356,-16.041 -7.789,-3.566 -22.191,-5.579 -33.664,-1.844 -11.425,3.725 -20.32,10.506 -25.507,19.46 -4.657,8.041 -4.473,24.196 -2.895,30.506 1.578,6.315 17.621,29.721 19.199,34.451 1.578,4.735 0.528,7.626 0.528,7.626 z"
                   style="fill:none;stroke:#f8f8f8;stroke-width:8.1576;stroke-linecap:butt;stroke-linejoin:miter;stroke-miterlimit:4;stroke-dasharray:none;stroke-opacity:0.00677317"
                   id="path88" />
              </g>
              <path
                 d="m 435.59,631.598 c 0.394,3.714 14.992,14.851 20.91,15.414 5.914,0.562 5.125,0.898 9.336,-0.453 4.207,-1.348 17.617,-9.223 18.277,-10.571 1.68,-3.453 2.758,-6.976 1.313,-9.113 -1.449,-2.145 -3.946,-0.563 -6.574,0.227 -2.629,0.785 -13.805,5.734 -17.489,6.859 -2.89,0.883 -9.203,-0.563 -9.203,-0.563 0,0 32.012,-10.578 33.266,-12.933 1.316,-2.477 0.262,-6.977 -2.762,-7.539 -1.926,-0.36 -43.785,13.386 -44.836,15.074 -1.055,1.688 -2.238,3.598 -2.238,3.598 z"
                 style="fill:#000000;fill-opacity:1;fill-rule:evenodd;stroke:none"
                 id="path90" />
              <g
                 id="g92"
                 transform="scale(1,0.855493)">
                <path
                   d="m 435.59,738.285 c 0.394,4.343 14.992,17.361 20.91,18.018 5.914,0.658 5.125,1.05 9.336,-0.529 4.207,-1.576 17.617,-10.781 18.277,-12.356 1.68,-4.037 2.758,-8.155 1.313,-10.653 -1.449,-2.507 -3.946,-0.657 -6.574,0.265 -2.629,0.918 -13.805,6.703 -17.489,8.018 -2.89,1.032 -9.203,-0.658 -9.203,-0.658 0,0 32.012,-12.365 33.266,-15.118 1.316,-2.895 0.262,-8.155 -2.762,-8.812 -1.926,-0.421 -43.785,15.648 -44.836,17.62 -1.055,1.973 -2.238,4.205 -2.238,4.205 z"
                   style="fill:none;stroke:#f8f8f8;stroke-width:8.1576;stroke-linecap:butt;stroke-linejoin:miter;stroke-miterlimit:4;stroke-dasharray:none;stroke-opacity:0.00677317"
                   id="path94" />
              </g>
              <path
                 d="m 438.223,599.988 c 0,0 -2.161,-0.535 -3.684,0.227 -1.523,0.762 -0.789,8.773 -0.789,8.773 l 16.305,-0.222 c 0,0 -14.071,3.597 -15.383,6.296 -1.317,2.7 1.672,6.786 4.34,7.426 2.136,0.516 45.793,-13.426 46.808,-14.625 0.883,-1.039 1.446,-6.75 0.528,-7.648 -0.922,-0.899 -4.602,-0.789 -4.602,-0.789 0,0 -1.449,0.113 -0.133,-3.934 1.317,-4.051 15.254,-20.137 18.672,-30.262 3.293,-9.753 1.387,-22.531 -2.367,-28.683 -3.965,-6.504 -9.598,-10.688 -17.356,-13.723 -7.789,-3.051 -22.191,-4.773 -33.664,-1.578 -11.425,3.188 -20.32,8.988 -25.507,16.649 -4.657,6.878 -4.473,20.699 -2.895,26.097 1.578,5.403 17.621,25.426 19.199,29.473 1.578,4.051 0.528,6.523 0.528,6.523 z"
                 style="fill:#000000;fill-opacity:1;fill-rule:evenodd;stroke:none"
                 id="path96" />
              <g
                 id="g98"
                 transform="scale(1,0.855493)">
                <path
                   d="m 438.223,701.337 c 0,0 -2.161,-0.626 -3.684,0.265 -1.523,0.89 -0.789,10.255 -0.789,10.255 l 16.305,-0.26 c 0,0 -14.071,4.205 -15.383,7.36 -1.317,3.155 1.672,7.931 4.34,8.68 2.136,0.603 45.793,-15.693 46.808,-17.095 0.883,-1.215 1.446,-7.89 0.528,-8.94 -0.922,-1.051 -4.602,-0.923 -4.602,-0.923 0,0 -1.449,0.133 -0.133,-4.598 1.317,-4.735 15.254,-23.538 18.672,-35.373 3.293,-11.402 1.387,-26.337 -2.367,-33.529 -3.965,-7.603 -9.598,-12.493 -17.356,-16.041 -7.789,-3.566 -22.191,-5.579 -33.664,-1.844 -11.425,3.725 -20.32,10.506 -25.507,19.46 -4.657,8.041 -4.473,24.196 -2.895,30.506 1.578,6.315 17.621,29.721 19.199,34.451 1.578,4.735 0.528,7.626 0.528,7.626 z"
                   style="fill:none;stroke:#f8f8f8;stroke-width:8.1576;stroke-linecap:butt;stroke-linejoin:miter;stroke-miterlimit:4;stroke-dasharray:none;stroke-opacity:0.00677317"
                   id="path100" />
              </g>
              <path
                 d="m 435.59,631.598 c 0.394,3.714 14.992,14.851 20.91,15.414 5.914,0.562 5.125,0.898 9.336,-0.453 4.207,-1.348 17.617,-9.223 18.277,-10.571 1.68,-3.453 2.758,-6.976 1.313,-9.113 -1.449,-2.145 -3.946,-0.563 -6.574,0.227 -2.629,0.785 -13.805,5.734 -17.489,6.859 -2.89,0.883 -9.203,-0.563 -9.203,-0.563 0,0 32.012,-10.578 33.266,-12.933 1.316,-2.477 0.262,-6.977 -2.762,-7.539 -1.926,-0.36 -43.785,13.386 -44.836,15.074 -1.055,1.688 -2.238,3.598 -2.238,3.598 z"
                 style="fill:#000000;fill-opacity:1;fill-rule:evenodd;stroke:none"
                 id="path102" />
              <g
                 id="g104"
                 transform="scale(1,0.855493)">
                <path
                   d="m 435.59,738.285 c 0.394,4.343 14.992,17.361 20.91,18.018 5.914,0.658 5.125,1.05 9.336,-0.529 4.207,-1.576 17.617,-10.781 18.277,-12.356 1.68,-4.037 2.758,-8.155 1.313,-10.653 -1.449,-2.507 -3.946,-0.657 -6.574,0.265 -2.629,0.918 -13.805,6.703 -17.489,8.018 -2.89,1.032 -9.203,-0.658 -9.203,-0.658 0,0 32.012,-12.365 33.266,-15.118 1.316,-2.895 0.262,-8.155 -2.762,-8.812 -1.926,-0.421 -43.785,15.648 -44.836,17.62 -1.055,1.973 -2.238,4.205 -2.238,4.205 z"
                   style="fill:none;stroke:#f8f8f8;stroke-width:8.1576;stroke-linecap:butt;stroke-linejoin:miter;stroke-miterlimit:4;stroke-dasharray:none;stroke-opacity:0.00677317"
                   id="path106" />
              </g>
            </g>
          </g>
        </svg>`;

          this.actions.annoswitch.svg = `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
      <!-- Created with Inkscape (http://www.inkscape.org/) -->
      
      <svg
         viewBox="0 0 83.319054 83.320114"
         version="1.1"
         id="svg11415"
         xml:space="preserve"
         xmlns="http://www.w3.org/2000/svg"
         xmlns:svg="http://www.w3.org/2000/svg"><defs
           id="defs11412"><marker
             style="overflow:visible"
             id="TriangleStart"
             refX="0"
             refY="0"
             orient="auto-start-reverse"
             markerWidth="5.3244081"
             markerHeight="6.155385"
             viewBox="0 0 5.3244081 6.1553851"
             preserveAspectRatio="xMidYMid"><path
               transform="scale(0.5)"
               style="fill:context-stroke;fill-rule:evenodd;stroke:context-stroke;stroke-width:1pt"
               d="M 5.77,0 -2.88,5 V -5 Z"
               id="path135" /></marker><marker
             style="overflow:visible"
             id="TriangleStart-5"
             refX="0"
             refY="0"
             orient="auto-start-reverse"
             markerWidth="5.3244081"
             markerHeight="6.155385"
             viewBox="0 0 5.3244081 6.1553851"
             preserveAspectRatio="xMidYMid"><path
               transform="scale(0.5)"
               style="fill:context-stroke;fill-rule:evenodd;stroke:context-stroke;stroke-width:1pt"
               d="M 5.77,0 -2.88,5 V -5 Z"
               id="path135-3" /></marker></defs><g
           id="g327"
           transform="translate(129.83427,13.264356)"><g
             id="g346"><path
               d="m -46.51522,28.396234 c 0,23.007813 -18.65172,41.659526 -41.65953,41.659526 -23.00782,0 -41.65952,-18.651713 -41.65952,-41.659526 0,-23.00887 18.6517,-41.66059 41.65952,-41.66059 23.00781,0 41.65953,18.65172 41.65953,41.66059 z"
               style="fill:#ffffff;fill-opacity:1;fill-rule:nonzero;stroke:none;stroke-width:0.352778"
               id="path68"
               class="openlime-lens-dashboard-button-bkg" /><g
               aria-label="i"
               id="text430"
               style="font-size:50.8px;line-height:1.25;font-family:'Palace Script MT';-inkscape-font-specification:'Palace Script MT';font-variant-ligatures:none;letter-spacing:0px;word-spacing:0px;stroke-width:0.264583"
               transform="matrix(1.9896002,0,0,1.9896002,-378.32178,-41.782121)"><path
                 d="m 149.74343,19.295724 c -1.4224,1.1176 -2.5908,2.032 -3.5052,2.6416 0.3556,1.0668 0.8128,1.9304 1.9304,3.556 1.4224,-1.27 1.5748,-1.4224 3.302,-2.7432 -0.1524,-0.3048 -0.254,-0.508 -0.6604,-1.1684 -0.3048,-0.6096 -0.3556,-0.6096 -0.762,-1.6256 z m 1.9304,25.4 -0.8636,0.4572 c -3.5052,1.9304 -4.1148,2.1844 -4.7244,2.1844 -0.5588,0 -0.9144,-0.5588 -0.9144,-1.4224 0,-0.8636 0,-0.8636 1.6764,-7.5692 1.8796,-7.7216 1.8796,-7.7216 1.8796,-8.128 0,-0.3048 -0.254,-0.508 -0.6096,-0.508 -0.8636,0 -3.8608,1.6764 -8.0264,4.4704 l -0.1016,1.4224 c 3.0988,-1.6764 3.2512,-1.7272 3.7084,-1.7272 0.4064,0 0.6096,0.3048 0.6096,0.8636 0,0.7112 -0.1524,1.4224 -0.9144,4.318 -2.3876,8.8392 -2.3876,8.8392 -2.3876,10.16 0,1.2192 0.4572,2.032 1.2192,2.032 0.8636,0 2.2352,-0.6604 4.9276,-2.3876 0.9652,-0.6096 1.9304,-1.2192 2.8956,-1.8796 0.4572,-0.254 0.8128,-0.508 1.4224,-0.8636 z"
                 style="font-weight:bold;font-family:Z003;-inkscape-font-specification:'Z003 Bold'"
                 id="path495" /></g><path
               style="fill:none;stroke:#000000;stroke-width:17.09477;stroke-linecap:butt;stroke-linejoin:miter;stroke-dasharray:none;stroke-opacity:1"
               d="M -66.121922,49.608737 -110.22757,7.1826674"
               id="path465"
               class="openlime-lens-dashboard-annoswitch-bar" /></g></g></svg>`;

          this.actions.prev.svg = `<svg
      viewBox="0 0 83.319054 83.320114"
      version="1.1"
      id="svg11415"
      xml:space="preserve"
      xmlns="http://www.w3.org/2000/svg"
      xmlns:svg="http://www.w3.org/2000/svg"><defs
        id="defs11412"><marker
          style="overflow:visible"
          id="TriangleStart"
          refX="0"
          refY="0"
          orient="auto-start-reverse"
          markerWidth="5.3244081"
          markerHeight="6.155385"
          viewBox="0 0 5.3244081 6.1553851"
          preserveAspectRatio="xMidYMid"><path
            transform="scale(0.5)"
            style="fill:context-stroke;fill-rule:evenodd;stroke:context-stroke;stroke-width:1pt"
            d="M 5.77,0 -2.88,5 V -5 Z"
            id="path135" /></marker><marker
          style="overflow:visible"
          id="TriangleStart-5"
          refX="0"
          refY="0"
          orient="auto-start-reverse"
          markerWidth="5.3244081"
          markerHeight="6.155385"
          viewBox="0 0 5.3244081 6.1553851"
          preserveAspectRatio="xMidYMid"><path
            transform="scale(0.5)"
            style="fill:context-stroke;fill-rule:evenodd;stroke:context-stroke;stroke-width:1pt"
            d="M 5.77,0 -2.88,5 V -5 Z"
            id="path135-3" /></marker></defs><g
        id="g417"
        transform="matrix(3.3565779,0,0,3.3565779,129.92814,-51.220758)"><g
          id="g335"><path
            d="m -172.71351,100.60243 c 0,23.00781 -18.65172,41.65952 -41.65953,41.65952 -23.00782,0 -41.65952,-18.65171 -41.65952,-41.65952 0,-23.00887 18.6517,-41.66059 41.65952,-41.66059 23.00781,0 41.65953,18.65172 41.65953,41.66059 z"
            style="fill:#ffffff;fill-opacity:1;fill-rule:nonzero;stroke:none;stroke-width:0.352778"
            id="path68"
            class="openlime-lens-dashboard-button-bkg"
            transform="matrix(0.29792248,0,0,0.29792248,37.569341,-2.3002842)" /><path
            style="fill:#030104"
            d="m -35.494703,28.624414 c 0,-0.264 0.213,-0.474 0.475,-0.474 h 2.421 c 0.262,0 0.475,0.21 0.475,0.474 0,3.211 2.615,5.826 5.827,5.826 3.212,0 5.827,-2.615 5.827,-5.826 0,-3.214 -2.614,-5.826 -5.827,-5.826 -0.34,0 -0.68,0.028 -1.016,0.089 v 1.647 c 0,0.193 -0.116,0.367 -0.291,0.439 -0.181,0.073 -0.383,0.031 -0.521,-0.104 l -4.832,-3.273 c -0.184,-0.185 -0.184,-0.482 0,-0.667 l 4.833,-3.268 c 0.136,-0.136 0.338,-0.176 0.519,-0.104 0.175,0.074 0.291,0.246 0.291,0.438 v 1.487 c 0.34,-0.038 0.68,-0.057 1.016,-0.057 5.071,0 9.198,4.127 9.198,9.198 0,5.07 -4.127,9.197 -9.198,9.197 -5.07,10e-4 -9.197,-4.126 -9.197,-9.196 z"
            id="path415" /></g></g></svg>`;

          this.actions.down.svg = `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
        <!-- Created with Inkscape (http://www.inkscape.org/) -->
        
        <svg
           viewBox="0 0 83.319054 83.320114"
           version="1.1"
           id="svg11415"
           xml:space="preserve"
           xmlns="http://www.w3.org/2000/svg"
           xmlns:svg="http://www.w3.org/2000/svg"><defs
             id="defs11412"><marker
               style="overflow:visible"
               id="TriangleStart"
               refX="0"
               refY="0"
               orient="auto-start-reverse"
               markerWidth="5.3244081"
               markerHeight="6.155385"
               viewBox="0 0 5.3244081 6.1553851"
               preserveAspectRatio="xMidYMid"><path
                 transform="scale(0.5)"
                 style="fill:context-stroke;fill-rule:evenodd;stroke:context-stroke;stroke-width:1pt"
                 d="M 5.77,0 -2.88,5 V -5 Z"
                 id="path135" /></marker><marker
               style="overflow:visible"
               id="TriangleStart-5"
               refX="0"
               refY="0"
               orient="auto-start-reverse"
               markerWidth="5.3244081"
               markerHeight="6.155385"
               viewBox="0 0 5.3244081 6.1553851"
               preserveAspectRatio="xMidYMid"><path
                 transform="scale(0.5)"
                 style="fill:context-stroke;fill-rule:evenodd;stroke:context-stroke;stroke-width:1pt"
                 d="M 5.77,0 -2.88,5 V -5 Z"
                 id="path135-3" /></marker></defs><g
             id="g4652"
             transform="translate(145.46385,95.197966)"><g
               id="g4846"
               transform="translate(-126.60931,52.756264)"><path
                 d="m 64.464511,-106.29364 c 0,23.007813 -18.65172,41.659526 -41.65953,41.659526 -23.0078196,0 -41.659526,-18.651713 -41.659526,-41.659526 0,-23.00887 18.6517064,-41.66059 41.659526,-41.66059 23.00781,0 41.65953,18.65172 41.65953,41.66059 z"
                 style="fill:#ffffff;fill-opacity:1;fill-rule:nonzero;stroke:none;stroke-width:0.352778"
                 id="path68"
                 class="openlime-lens-dashboard-button-bkg" /><g
                 id="g2392-5"
                 transform="matrix(0.26458333,0,0,0.26458333,-283.58108,-263.57207)"><path
                   style="fill:none;fill-rule:evenodd;stroke:#000000;stroke-width:40;stroke-linecap:round;stroke-linejoin:miter;stroke-dasharray:none;stroke-opacity:1"
                   d="m 1072.4033,509.27736 h 171.1826"
                   id="path351-6" /><path
                   style="fill:none;fill-rule:evenodd;stroke:#000000;stroke-width:30;stroke-linecap:round;stroke-linejoin:miter;stroke-dasharray:none;stroke-opacity:1"
                   d="m 1185.0215,568.3701 h 59.6026"
                   id="path351-3-2" /><path
                   style="fill:none;fill-rule:evenodd;stroke:#000000;stroke-width:30;stroke-linecap:round;stroke-linejoin:miter;stroke-dasharray:none;stroke-opacity:1"
                   d="m 1184.2167,621.15576 h 59.6026"
                   id="path351-3-2-0" /><path
                   style="fill:none;fill-rule:evenodd;stroke:#000000;stroke-width:40;stroke-linecap:round;stroke-linejoin:miter;stroke-dasharray:none;stroke-opacity:1"
                   d="m 1072.4033,679.59496 h 171.1826"
                   id="path351-3-6-7-1" /><path
                   style="display:inline;fill:none;fill-rule:evenodd;stroke:#000000;stroke-width:11.4448;stroke-linecap:butt;stroke-linejoin:miter;stroke-dasharray:none;stroke-opacity:1;marker-end:url(#TriangleStart-5)"
                   d="m 1074.9115,570.87447 54.1203,-0.0275"
                   id="path1366-2" /><path
                   style="fill:none;fill-rule:evenodd;stroke:#000000;stroke-width:14;stroke-linecap:butt;stroke-linejoin:miter;stroke-dasharray:none;stroke-opacity:1"
                   d="m 1080.0425,521.28147 v 54.87857"
                   id="path1402-7" /><path
                   style="fill:none;fill-rule:evenodd;stroke:#000000;stroke-width:1px;stroke-linecap:butt;stroke-linejoin:miter;stroke-opacity:1"
                   d="m 1150.8866,623.00688 0.3956,-5.02729"
                   id="path2545" /><path
                   style="fill:none;fill-rule:evenodd;stroke:#000000;stroke-width:30;stroke-linecap:round;stroke-linejoin:miter;stroke-dasharray:none;stroke-opacity:1"
                   d="m 1185.0215,567.71656 h 59.6026"
                   id="path2720" /></g></g></g></svg>`;

          this.actions.next.svg = `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
      <!-- Created with Inkscape (http://www.inkscape.org/) -->
      
      <svg
         viewBox="0 0 83.319054 83.320114"
         version="1.1"
         id="svg11415"
         xml:space="preserve"
         xmlns="http://www.w3.org/2000/svg"
         xmlns:svg="http://www.w3.org/2000/svg"><defs
           id="defs11412"><marker
             style="overflow:visible"
             id="TriangleStart"
             refX="0"
             refY="0"
             orient="auto-start-reverse"
             markerWidth="5.3244081"
             markerHeight="6.155385"
             viewBox="0 0 5.3244081 6.1553851"
             preserveAspectRatio="xMidYMid"><path
               transform="scale(0.5)"
               style="fill:context-stroke;fill-rule:evenodd;stroke:context-stroke;stroke-width:1pt"
               d="M 5.77,0 -2.88,5 V -5 Z"
               id="path135" /></marker></defs><g
           id="g4652"
           transform="translate(-12.647874,74.762541)"><path
             d="m 95.96693,-33.101955 c 0,23.007813 -18.65172,41.6595258 -41.65953,41.6595258 -23.00782,0 -41.659526,-18.6517128 -41.659526,-41.6595258 0,-23.008872 18.651706,-41.660586 41.659526,-41.660586 23.00781,0 41.65953,18.651714 41.65953,41.660586 z"
             style="fill:#ffffff;fill-opacity:1;fill-rule:nonzero;stroke:none;stroke-width:0.352778"
             id="path68"
             class="openlime-lens-dashboard-button-bkg" /><g
             id="g4636"
             transform="translate(173.74831,-50.897484)"><path
               style="fill:none;fill-rule:evenodd;stroke:#000000;stroke-width:10.5833;stroke-linecap:round;stroke-linejoin:miter;stroke-dasharray:none;stroke-opacity:1"
               d="m -142.08694,-4.7366002 h 45.292059"
               id="path351" /><path
               style="fill:none;fill-rule:evenodd;stroke:#000000;stroke-width:10.5833;stroke-linecap:round;stroke-linejoin:miter;stroke-dasharray:none;stroke-opacity:1"
               d="m -142.08694,40.326598 h 45.292059"
               id="path351-3-6-7" /><path
               style="display:inline;fill:none;fill-rule:evenodd;stroke:#000000;stroke-width:3.20746;stroke-linecap:butt;stroke-linejoin:miter;stroke-dasharray:none;stroke-opacity:1;marker-end:url(#TriangleStart)"
               d="m -136.09942,8.7192481 0.008,14.9721889"
               id="path1366" /><path
               style="fill:none;fill-rule:evenodd;stroke:#000000;stroke-width:3.70417;stroke-linecap:butt;stroke-linejoin:miter;stroke-dasharray:none;stroke-opacity:1"
               d="M -136.07283,-1.5605128 V 24.204958"
               id="path1402" /><path
               style="fill:none;fill-rule:evenodd;stroke:#000000;stroke-width:7.9375;stroke-linecap:round;stroke-linejoin:miter;stroke-dasharray:none;stroke-opacity:1"
               d="m -111.69142,24.864565 h 15.76985"
               id="path351-3-2-0-3" /><path
               style="fill:none;fill-rule:evenodd;stroke:#000000;stroke-width:7.9375;stroke-linecap:round;stroke-linejoin:miter;stroke-dasharray:none;stroke-opacity:1"
               d="m -111.37623,10.725444 h 15.76986"
               id="path2720-9" /></g></g></svg>`;

          if (queueMicrotask) queueMicrotask(() => { this.init(); }); //allows modification of actions and layers before init.
          else setTimeout(() => { this.init(); }, 0);

       }

       init() {
          this.container.style.display = 'block';
          this.container.style.margin = '0';

          for (let [name, action] of Object.entries(this.actions)) {
             this.addAction(action);
          }

          // Set Camera movement active
          this.actions.camera.active = this.actions.camera.element.classList.toggle('openlime-lens-dashboard-camera-active');
          this.actions.light.active = false;

          // Enable camera, light, next buttons
          this.setActionEnabled('camera');
          this.setActionEnabled('light');
          this.setActionEnabled('annoswitch');
          this.setActionEnabled('next');
       }

       static degToRadians(angle) {
          return angle * (Math.PI / 180.0);
       }

       static polarToCartesian(centerX, centerY, radius, angleInDegrees) {
          const angleInRadians = (angleInDegrees-90) * Math.PI / 180.0;
        
          return {
            x: centerX + (radius * Math.cos(angleInRadians)),
            y: centerY + (radius * Math.sin(angleInRadians))
          };
        }
        
       static describeArc(x, y, radius, border, startAngle, endAngle){
        
            const start = LensDashboardNavigatorRadial.polarToCartesian(x, y, radius+border, endAngle);
            const end = LensDashboardNavigatorRadial.polarToCartesian(x, y, radius+border, startAngle);
            const startIn = LensDashboardNavigatorRadial.polarToCartesian(x, y, radius, endAngle);
            const endIn = LensDashboardNavigatorRadial.polarToCartesian(x, y, radius, startAngle);
        
            const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
        
            const d = [
                "M", start.x, start.y, 
                "A", radius+border, radius+border, 0, largeArcFlag, 0, end.x, end.y,
                "L", endIn.x, endIn.y,
                "A", radius, radius, 1, largeArcFlag, 1, startIn.x, startIn.y,
            ].join(" ");
        
            return d;       
        }

       setToolboxBkg(r, sizew, sizeh) {
          const e = this.toolboxBkg.element;
          e.setAttributeNS(null, 'viewBox', `0 0 ${sizew} ${sizeh}`);
          const shape = e.querySelector('#shape-dashboard-bkg');
          this.containerSpace;
          const b =  this.toolboxBkgSize;
          const cx = sizew*0.5;
          const cy = sizeh*0.5;
          shape.setAttributeNS(null, 'd', LensDashboardNavigatorRadial.describeArc(cx, cy, r, b, -110, 110));
          // shape.setAttributeNS(null, 'd', `M ${sizew*0.5-r-b},${sizeh*0.5} a1,1 0 0,1 ${2*(r+b)},0 h ${-b} a1,1 0 1,0 ${-2*r},0 Z`);
       }

       addAction(action) {
          action.element = Util.SVGFromString(action.svg);
          action.element.style = `position:absolute; height: ${this.toolSize}px; margin: 0`;
          action.element.classList.add('openlime-lens-dashboard-button');
          if (action.type == 'toggle') {
             const toggleElm = action.element.querySelector(action.toggleClass);
             toggleElm.style.visibility = `hidden`;
             action.active = false;
          }
          action.element.addEventListener('click', (e) => {
             if (action.type == 'toggle') {
                action.active = !action.active;
                const toggleElm = action.element.querySelector(action.toggleClass);
                if (action.active) {
                   toggleElm.style.visibility = `visible`;
                } else {
                   toggleElm.style.visibility = `hidden`;
                }
                this.noupdate=true;
             }
             action.task(e);
             e.preventDefault();
          });
          this.container.appendChild(action.element);
       }

       getAction(label) {
          let result = null;
          for (let [name, action] of Object.entries(this.actions)) {
             if (action.label === label) {
                result = action;
                break;
             }
          }
          return result;
       }

       setActionEnabled(label, enable = true) {
          const action = this.getAction(label);
          if (action) {
             action.element.classList.toggle('enabled', enable);
          }
       }

       toggleLightController() {
          let active = this.actions.light.element.classList.toggle('openlime-lens-dashboard-light-active');
          this.actions.light.active = active;
          this.actions.camera.active = this.actions.camera.element.classList.toggle('openlime-lens-dashboard-camera-active');

          for (let layer of Object.values(this.viewer.canvas.layers))
             for (let c of layer.controllers)
                if (c.control == 'light') {
                   c.active = true;
                   c.activeModifiers = active ? [0, 2, 4] : [2, 4];  //nothing, shift and alt
                }
       }

       setToggleClassVisibility(t) {
          for (let [name, action] of Object.entries(this.actions)) {
             if (action.type == 'toggle' && action.active) {
                const toggleElm = action.element.querySelector(action.toggleClass);
                if (t) {
                   toggleElm.style.visibility = `visible`;
                } else {
                   toggleElm.style.visibility = `hidden`;
                }
             }
          }
       }

       toggle() {
          const t = this.container.classList.toggle('closed');
          this.setToggleClassVisibility(!t);
       }

       setToolboxElm(radius, sizew, sizeh) {
          
            // Toolbox Background
          this.setToolboxBkg(radius - this.borderWidth - 2, sizew, sizeh);
          this.first = false;

          // Set tool position
          const alphaDelta = 2.0*Math.asin((this.toolSize*0.5+this.toolPadding)/(radius));
          for (let i = 0; i < this.group.length; i++) {
             const gArr = Object.entries(this.actions).filter( ([key, value]) => value.group == i);
             if(Math.abs(this.group[i]) > 90) gArr.reverse();
             let idx = 0;
             for (let [name, action] of gArr) {
                // const tw = action.element.clientWidth;
                // const th = action.element.clientHeight;
                const th = this.toolSize;
                const tw = this.toolSize;
                const rad = LensDashboardNavigatorRadial.degToRadians(this.group[i]) + idx * alphaDelta;
                let cbx = (radius+this.toolSize*0.5+this.toolboxBkgPadding) * Math.sin(rad);
                let cby = (radius+this.toolSize*0.5+this.toolboxBkgPadding) * Math.cos(rad);
                let bx = sizew * 0.5 + cbx - tw / 2;
                let by = sizeh * 0.5 - cby - th / 2;
                action.element.style.left = `${bx}px`;
                action.element.style.top = `${by}px`;
                idx++;
             }
          }
       }

       /** @ignore */
       update(x, y, r) {
          if(this.noupdate) {
             this.noupdate = false;
             return;
          }
          super.update(x,y,r);
          const center = {
             x: this.lensBox.x,
             y: this.lensBox.y
          };
          const radius = this.lensBox.r;
          const sizew = this.lensBox.w;
          const sizeh = this.lensBox.h;
         
          //this.setToolboxElm(radius, sizew, sizeh);

          if (this.updateCb) {
             // updateCb(c.x, c.y, r, dashboard.w, dashboard.h, canvas.w, canvas.h) all params in canvas coordinates
             this.updateCb(center.x, center.y, radius, sizew, sizeh, this.viewer.camera.viewport.w, this.viewer.camera.viewport.h);
          }

          if (!this.moving) {
             this.toggle();
             this.moving = true;
          }
          if (this.timeout) clearTimeout(this.timeout);
          this.timeout = setTimeout(() => {
             this.toggle();
             this.moving = false;
             this.setToolboxElm(radius, sizew, sizeh);
             if (this.updateEndCb) this.updateEndCb(center.x, center.y, radius, sizew, sizeh, this.viewer.camera.viewport.w, this.viewer.camera.viewport.h);
          }, this.delay);
       }
    }

    /**
     * Elements to classify the annotations.
     * @typedef {Object} AnnotationClass
     * @property {color} stroke The CSS color of a line, text or outline SVG element.
     * @property {string} label The class name.
     */
    /**
     * Annotation classes.
     * @typedef {Object.<string, AnnotationClass>} AnnotationClasses
     */


    /**
     * An annotation layer that draws SVG elements directly on the canvas (outside the WebGL context).
     * 
     * Here you will find a tutorial to learn how to build a client-server architecture to manage annotations in OpenLIME. //FIXME
     * 
     * Extends {@link LayerAnnotation}.
     */
    class LayerSvgAnnotation extends LayerAnnotation {
    	/**
    	 * Instantiates a LayerSvgAnnotation object.
    	 * @param {Object} [options] An object literal with options that inherits from {@link LayerAnnotation}.
     	 * @param {AnnotationClasses} options.classes An object literal definying colors and labels of the annotation classes.
     	 * @param {Function} options.onClick The callback to fire when the an annotation is clicked on the canvas. The callback is passed an object containing the selected annotation.
    	 * @param {bool} options.shadow=true Whether to insert SVG elements in a shadow DOM.
    	 */
    	constructor(options) {
    		options = Object.assign({
    			overlayElement: null,   //reference to canvas overlayElement. TODO: check if really needed.
    			shadow: true,           //svg attached as shadow node (so style apply only the svg layer)
    			svgElement: null, 		//the svg layer
    			svgGroup: null,
    			onClick: null,			//callback function
    			classes: {
    				'': { style: { stroke: '#000' }, label: '' },
    			},
    			annotationUpdate: null
    		}, options);
    		super(options);
    		for(const [key, value] of Object.entries(this.classes)) {
    			this.style += `[data-class=${key}] { ` + Object.entries(value.style).map( g => `${g[0]}: ${g[1]};`).join('\n') + '}';
    		}
    		//this.createOverlaySVGElement();
    		//this.setLayout(this.layout);
    	}

    	/** @ignore */
    	createOverlaySVGElement() { 
    		this.svgElement = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    		this.svgElement.classList.add('openlime-svgoverlay');
    		this.svgGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    		this.svgElement.append(this.svgGroup);

    		let root = this.overlayElement;
    		if (this.shadow)
    			root = this.overlayElement.attachShadow({ mode: "open" });

    		if (this.style) {
    			const style = document.createElement('style');
    			style.textContent = this.style;
    			root.append(style);
    		}
    		root.appendChild(this.svgElement);
    	}
    	/*  unused for the moment!!! 
    		async loadSVG(url) {
    			var response = await fetch(url);
    			if (!response.ok) {
    				this.status = "Failed loading " + this.url + ": " + response.statusText;
    				return;
    			}
    			let text = await response.text();
    			let parser = new DOMParser();
    			this.svgXML = parser.parseFromString(text, "image/svg+xml").documentElement;
    			throw "if viewbox is set in svgURL should it overwrite options.viewbox or viceversa?"
    		}
    	*/

    	/**
    	 * Sets a value that indicates whether the layer is visible.
    	 * @param {bool} visible The value.
    	 */
    	setVisible(visible) {
    		if (this.svgElement)
    			this.svgElement.style.display = visible ? 'block' : 'none';
    		super.setVisible(visible);
    	}

    	/** @ignore */
    	clearSelected() {
    		if (!this.svgElement) this.createOverlaySVGElement();
    		//		return;
    		this.svgGroup.querySelectorAll('[data-annotation]').forEach((e) => e.classList.remove('selected'));
    		super.clearSelected();
    	}

    	/**
    	 * Selects/deselects an annotation
    	 * @param {Annotation} anno The annotation.
    	 * @param {bool} on=true Whether to select the annotation.
    	 */
    	setSelected(anno, on = true) {
    		for (let a of this.svgElement.querySelectorAll(`[data-annotation="${anno.id}"]`))
    			a.classList.toggle('selected', on);

    		super.setSelected(anno, on);
    	}

    	/** @ignore */
    	newAnnotation(annotation) {
    		let svg = Util.createSVGElement('svg');
    		if (!annotation)
    			annotation = new Annotation({ element: svg, selector_type: 'SvgSelector' });
    		return super.newAnnotation(annotation)
    	}

    	/** @ignore */
    	draw(transform, viewport) {
    		if (!this.svgElement)
    			return true;
    		this.svgElement.setAttribute('viewBox', `${-viewport.w / 2} ${-viewport.h / 2} ${viewport.w} ${viewport.h}`);

    		const svgTransform = this.getSvgGroupTransform(transform);
    		this.svgGroup.setAttribute("transform",	svgTransform);
    		return true;
    	}

    	/**
    	 * Return the string containing the transform for drawing the svg group in the proper position
    	 * @param {Transform} transform current transform parameter of the draw function
    	 * @param {bool} inverse when its false return the transform needed to draw the svgGroup
    	 * @returns string with svgroup transform 
    	 */
    	getSvgGroupTransform(transform, inverse=false) {
    		let t = this.transform.compose(transform);
    		let c = this.boundingBox().corner(0);
    		// FIXME CHECK IT: Convert from GL to SVG, but without any scaling. It just needs to reflect around 0,
    		t = CoordinateSystem.reflectY(t);
    		return inverse ?
    		 `translate(${-c.x} ${-c.y})  scale(${1/t.z} ${1/t.z}) rotate(${t.a} 0 0) translate(${-t.x} ${-t.y})` :
    		 `translate(${t.x} ${t.y}) rotate(${-t.a} 0 0) scale(${t.z} ${t.z}) translate(${c.x} ${c.y})`;
    	}

    	/** @ignore */
    	prefetch(transform) {
    		if (!this.svgElement)
    			this.createOverlaySVGElement();

    		if (!this.visible) return;
    		if (this.status != 'ready')
    			return;

    		if (typeof (this.annotations) == "string") return; //FIXME Is it right? Should we use this.status?

    		const bBox = this.boundingBox();
    		this.svgElement.setAttribute('viewBox', `${bBox.xLow} ${bBox.yLow} ${bBox.xHigh - bBox.xLow} ${bBox.yHigh - bBox.yLow}`);

    		//find which annotations needs to be added to the ccanvas, some 
    		//indexing whould be used, for the moment we just iterate all of them.

    		for (let anno of this.annotations) {

    			//TODO check for class visibility and bbox culling (or maybe should go to prefetch?)
    			if (!anno.ready && typeof anno.svg == 'string') {
    				let parser = new DOMParser();
    				let element = parser.parseFromString(anno.svg, "image/svg+xml").documentElement;
    				anno.elements = [...element.children];
    				anno.ready = true;

    				/*				} else if(this.svgXML) {
    									a.svgElement = this.svgXML.querySelector(`#${a.id}`);
    									if(!a.svgElement)
    										throw Error(`Could not find element with id: ${id} in svg`);
    								} */
    			}

    			if(this.annotationUpdate)
        				this.annotationUpdate(anno, transform);

    			if (!anno.needsUpdate)
    				continue;

    			anno.needsUpdate = false;

    			for (let e of this.svgGroup.querySelectorAll(`[data-annotation="${anno.id}"]`))
    				e.remove();

    			if (!anno.visible)
    				continue;

    			//second time will be 0 elements, but we need to 
    			//store somewhere knowledge of which items in the scene and which still not.
    			for (let child of anno.elements) {
    				let c = child; //.cloneNode(true);
    				c.setAttribute('data-annotation', anno.id);
    				c.setAttribute('data-class', anno.class);

    				//c.setAttribute('data-layer', this.id);
    				c.classList.add('openlime-annotation');
    				if (this.selected.has(anno.id))
    					c.classList.add('selected');
    				this.svgGroup.appendChild(c);
    				c.onpointerdown = (e) => {
    					if (e.button == 0) {
    						e.preventDefault();
    						e.stopPropagation();
    						if (this.onClick && this.onClick(anno))
    							return;
    						if (this.selected.has(anno.id))
    							return;
    						this.clearSelected();
    						this.setSelected(anno, true);
    					}
    				};


    				//utils

    				/*				let parser = new DOMParser();
    								let use = createElement('use', { 'xlink:href': '#' + a.id,  'stroke-width': 10,  'pointer-events': 'stroke' });
    								//let use = parser.parseFromString(`<use xlink:href="${a.id}" stroke-width="10" pointer-events="stroke"/>`, "image/svg+xml");
    								this.svgGroup.appendChild(use);  */
    			}
    		}
    	}
    }

    Layer.prototype.types['svg_annotations'] = (options) => { return new LayerSvgAnnotation(options); };

    /* FROM: https://stackoverflow.com/questions/40650306/how-to-draw-a-smooth-continuous-line-with-mouse-using-html-canvas-and-javascript */

    /**
     * A [x, y, xc, yc] point.
     * @typedef BezierPoint
     * @property {number} p.0 The x-coordinate.
     * @property {number} p.1 The y-coordinate.
     * @property {number} p.2 The x-coordinate of the control point.
     * @property {number} p.3 The y-coordinate of the control point.
     */

    /**
     * Simplifies a polyline via the Douglas-Peucker algorithm.
     * @param {Array<Point>} points A polyline.
     * @param {*} tolerance The tolerance is the maximum distance between the original polyline and the simplified polyline.
     * It has the same metric as the point coordinates.  
     * @returns {Array<Point>} The simplified polyline.
     */
    function simplify(points, tolerance) {
    	let tolerance2 = Math.pow(tolerance, 2);

        var simplify1 = function(start, end) { // recursize simplifies points from start to end
            var index, i, xx , yy, dx, dy, ddx, ddy,  t, dist, dist1;
            let p1 = points[start];
            let p2 = points[end];   
            xx = p1.x;
            yy = p1.y;
            ddx = p2.x - xx;
            ddy = p2.y - yy;
            dist1 = ddx * ddx + ddy * ddy;
            let maxDist = tolerance2;
            for (var i = start + 1; i < end; i++) {
                let p = points[i];
                if (ddx !== 0 || ddy !== 0) {
                    t = ((p.x - xx) * ddx + (p.y - yy) * ddy) / dist1;
                    if (t > 1) {
                        dx = p.x - p2.x;
                        dy = p.y - p2.y;
                    } else 
                    if (t > 0) {
                        dx = p.x - (xx + ddx * t);
                        dy = p.y - (yy + ddy * t);
                    } else {
                        dx = p.x - xx;
                        dy = p.y - yy;
                    }
                } else {
                    dx = p.x - xx;
                    dy = p.y - yy;
                }
                dist = dx * dx + dy * dy; 
                if (dist > maxDist) {
                    index = i;
                    maxDist = dist;
                }
            }

            if (maxDist > tolerance2) { 
                if (index - start > 1){
                    simplify1(start, index);
                }
                newLine.push(points[index]);
                if (end - index > 1){
                    simplify1(index, end);
                }
            }
        };    
        var end = points.length - 1;
        var newLine = [points[0]];
        simplify1(0, end);
        newLine.push(points[end]);
        return newLine;
    }

    /**
     *  Uses Bezier Curve to smooth a polyline
     * @param {Array<Point>} points A polyline.
     * @param {number} cornerThres The angular threshold (in degrees). Two segments are smoothed if their angle is less then the threshold.
     * @param {bool} match Whether the smoothed curve should traverse the original points or approximate them.
     * @returns {Array<BezierPoint>} The smoothed polyline.
     */
    function smooth(points, cornerThres, match) {
    	cornerThres *= 3.1415/180;
    	let newPoints = []; // array for new points

    	if(points.length <= 2)
    		return points.map((p) => [p.x, p.y]);

    	let nx1, ny1, nx2, ny2, dist1, dist2;

    	function dot(x, y, xx, yy) {  // get do product
    		// dist1,dist2,nx1,nx2,ny1,ny2 are the length and  normals and used outside function
    		// normalise both vectors
    		
    		dist1 = Math.sqrt(x * x + y * y); // get length
    		if (dist1  > 0) {  // normalise
    			nx1 = x / dist1 ;
    			ny1 = y / dist1 ;
    		} else {
    			nx1 = 1;  // need to have something so this will do as good as anything
    			ny1 = 0;
    		}
    		dist2  = Math.sqrt(xx * xx + yy * yy);
    		if (dist2  > 0) {
    			nx2 = xx / dist2;
    			ny2 = yy / dist2;
    		} else {
    			nx2 = 1;
    			ny2 = 0;
    		}
    		return Math.acos(nx1 * nx2 + ny1 * ny2 ); // dot product
    	}

    	let p1 = points[0];
    	let endP = points[points.length-1];
    	let i = 0;  // start from second poitn if line not closed
    	let closed = false;
    	let len = Math.hypot(p1.x- endP.x, p1.y-endP.y);
    	
    	if(len < Math.SQRT2){  // end points are the same. Join them in coordinate space
    		endP =  p1;
    		i = 0;			 // start from first point if line closed
    		p1 = points[points.length-2];
    		closed = true;
    	}	   
    	newPoints.push([points[i].x,points[i].y]);
    	for(; i < points.length-1; i++){
    		let p2 = points[i];
    		let p3 = points[i + 1];
    		let angle = Math.abs(dot(p2.x - p1.x, p2.y - p1.y, p3.x - p2.x, p3.y - p2.y));
    		if(dist1 !== 0){  // dist1 and dist2 come from dot function
    			if( angle < cornerThres){ // bend it if angle between lines is small
    				  if(match){
    					  dist1 = Math.min(dist1,dist2);
    					  dist2 = dist1;
    				  }
    				  // use the two normalized vectors along the lines to create the tangent vector
    				  let x = (nx1 + nx2) / 2;  
    				  let y = (ny1 + ny2) / 2;
    				  len = Math.sqrt(x * x + y * y);  // normalise the tangent
    				  if(len === 0){
    					  newPoints.push([p2.x,p2.y]);								  
    				  } else {
    					  x /= len;
    					  y /= len;
    					  if(newPoints.length > 0){
    						  var np = newPoints[newPoints.length-1];
    						  np.push(p2.x-x*dist1*0.25);
    						  np.push(p2.y-y*dist1*0.25);
    					  }
    					  newPoints.push([  // create the new point with the new bezier control points.
    							p2.x,
    							p2.y,
    							p2.x+x*dist2*0.25,
    							p2.y+y*dist2*0.25
    					  ]);
    				  }
    			} else {
    				newPoints.push([p2.x,p2.y]);			
    			}
    		}
    		p1 = p2;
    	}  
    	if(closed){ // if closed then copy first point to last.
    		p1 = [];
    		for(i = 0; i < newPoints[0].length; i++){
    			p1.push(newPoints[0][i]);
    		}
    		newPoints.push(p1);
    	}else {
    		newPoints.push([points[points.length-1].x,points[points.length-1].y]);	  
    	}
    	return newPoints;	
    }

    /**
     * Converts a smoothed polyline into an SVG path.
     * @param {Array<BezierPoint>} smoothed The smoothed polyline.
     * @returns {Array<String>} The SVG path.
     */
    function smoothToPath(smoothed) {
    	let p = smoothed[0];
    	let d = [`M${p[0].toFixed(1)} ${p[1].toFixed(1)}`];
    	let p1;
    	for(let i = 0; i < smoothed.length-1; i++) {
    		p = smoothed[i];
    		p1 = smoothed[i+1];	
    		if(p.length == 2)
    			d.push(`l${(p1[0]-p[0]).toFixed(1)} ${(p1[1]-p[1]).toFixed(1)}`);
    		else if(p.length == 4) 
    			d.push(`q${(p[2]-p[0]).toFixed(1)} ${(p[3]-p[1]).toFixed(1)} ${(p1[0]-p[0]).toFixed(1)} ${(p1[1]-p[1]).toFixed(1)}`);
    		else
    			d.push(`c${(p[2]-p[0]).toFixed(1)} ${(p[3]-p[1]).toFixed(1)} ${(p[4]-p[0]).toFixed(1)} ${(p[5]-p[1]).toFixed(1)} ${(p1[0]-p[0]).toFixed(1)} ${(p1[1]-p[1]).toFixed(1)}`);
    	}
    	return d.join(' ');
    }

    /**
     * Callback for create/update/delete annotations.
     * @function crudCallback
     * @param {Annotation} anno The current annotation entry.
     */

    /**
     * Callback implementing custom state annotations.
     * @function customStateCallback
     * @param {Annotation} anno The current annotation entry.
     */

    /**
     * Callback to customize the annotation data object.
     * @function customDataCallback
     * @param {Annotation} anno The current annotation entry.
     */

    /**
     * Callback executed when an annotation is selcted on the user interface.
     * @function selectedCallback
     * @param {Annotation} anno The current annotation entry.
     */

    /**
     * **EditorSvgAnnotation** enables the {@link UIBasic} interface to edit (create/update/delete) SVG annotations.
     * This class is a mere utility that acts as an adapter between the annotation database and the OpenLIME system.
     * 
     * Here you will find a tutorial to learn how to use the SVG annotation editor. //FIXME
     * 
     * For the experienced developer this class can be used as an example to design more complex editors.
     * 
     * In the following example an **EditorSvgAnnotation** is instatiated and connected to the annotation database
     * through three callbacks implementing database operations (create/update/delete).
     * ``` 
     * // Creates an annotation layer and add it to the canvans
     * const anno = new OpenLIME.Layer(aOptions);
     * lime.addLayer('anno', anno);
     *
     * // Creates a SVG annotation Editor
     * const editor = new OpenLIME.EditorSvgAnnotation(lime, anno, {
     *          viewer: lime,
     *          classes: classParam
     * });
     * editor.createCallback = (anno) => { console.log("Created annotation: ", anno); processRequest(anno, 'create'); return true; };
     * editor.updateCallback = (anno) => { console.log("Updated annotation: ", anno); processRequest(anno, 'update'); return true; };
     * editor.deleteCallback = (anno) => { console.log("Deleted annotation: ", anno); processRequest(anno, 'delete'); return true; };
     * ```
     */
    class EditorSvgAnnotation {
    	/**
    	 * Instatiates a EditorSvgAnnotation object.
    	 * @param {Viewer} viewer The OpenLIME viewer.
    	 * @param {LayerSvgAnnotation} layer The annotation layer on which to operate.
    	 * @param {Object} [options] An object literal with SVG editor parameters.
    	 * @param {AnnotationClasses} options.classes An object literal definying colors and labels of the annotation classes.
    	 * @param {crudCallback} options.createCallback The callback to implement annotation creation.
    	 * @param {crudCallback} options.updateCallback The callback to implement annotation update.
    	 * @param {crudCallback} options.deleteCallback The callback to implement annotation deletion.
    	 * @param {bool} options.enableState=false Whether to enable custom annotation state. This allows to include some state variables into an annotation item (such as camera, light or lens position).
    	 * @param {customStateCallback} options.customState The callback implementing custom state annotations.
    	 * @param {customDataCallback} options.customData The callback to customize the annotation data object.
    	 * @param {selectedCallback} options.selectedCallback The callback executed when an annotation is selcted on the user interface.
    	 */
    	constructor(viewer, layer, options) {
    		this.layer = layer;
    		Object.assign(this, {
    			viewer: viewer,
    			panning: false,
    			tool: null, //doing nothing, could: ['line', 'polygon', 'point', 'box', 'circle']
    			startPoint: null, //starting point for box and  circle
    			currentLine: [],
    			annotation: null,
    			priority: 20000,
    			classes: {
    				'': { stroke: '#000', label: '' },
    				'class1': { stroke: '#770', label: '' },
    				'class2': { stroke: '#707', label: '' },
    				'class3': { stroke: '#777', label: '' },
    				'class4': { stroke: '#070', label: '' },
    				'class5': { stroke: '#007', label: '' },
    				'class6': { stroke: '#077', label: '' },
    			},
    			tools: {
    				point: {
    					img: '<svg width=24 height=24><circle cx=12 cy=12 r=3 fill="red" stroke="gray"/></svg>',
    					tooltip: 'New point',
    					tool: Point,
    				},
    				pin: {
    					template: (x,y) => {
    						return `<svg xmlns='http://www.w3.org/2000/svg' x='${x}' y='${y}' width='4%' height='4%' class='pin'
						viewBox='0 0 18 18'><path d='M 0,0 C 0,0 4,0 8,0 12,0 16,4 16,8 16,12 12,16 8,16 4,16 0,12 0,8 0,4 0,0 0,0 Z'/><text class='pin-text' x='7' y='8'>${this.annotation.idx}</text></svg>`;
    					}, //pin di alcazar  1. url a svg 2. txt (stringa con svg) 3. funzione(x,y) ritorna svg 4. dom (da skin).
    					tooltip: 'New pin',
    					tool: Pin
    				},
    				pen: {
    					img: '<svg width=24 height=24><circle cx=12 cy=12 r=3 fill="red" stroke="gray"/></svg>',
    					tooltip: 'New polyline',
    					tool: Pen,
    				},
    				line: {
    					img: `<svg width=24 height=24>
						<path d="m 4.7,4.5 c 0.5,4.8 0.8,8.5 3.1,11 2.4,2.6 4.2,-4.8 6.3,-5 2.7,-0.3 5.1,9.3 5.1,9.3" stroke-width="3" fill="none" stroke="grey"/>
						<path d="m 4.7,4.5 c 0.5,4.8 0.8,8.5 3.1,11 2.4,2.6 4.2,-4.8 6.3,-5 2.7,-0.3 5.1,9.3 5.1,9.3" stroke-width="1" fill="none" stroke="red"/></svg>`,
    					tooltip: 'New line',
    					tool: Line,
    				},
    				erase: {
    					img: '',
    					tooltip: 'Erase lines',
    					tool: Erase,
    				},
    				box: {
    					img: '<svg width=24 height=24><rect x=5 y=5 width=14 height=14 fill="red" stroke="gray"/></svg>',
    					tooltip: 'New box',
    					tool: Box,
    				},
    				circle: {
    					img: '<svg width=24 height=24><circle cx=12 cy=12 r=7 fill="red" stroke="gray"/></svg>',
    					tooltip: 'New circle',
    					tool: Circle,
    				},
    				/*				colorpick: {
    									img: '',
    									tooltip: 'Pick a color',
    									tool: Colorpick,
    								} */
    			},
    			annotation: null, //not null only when editWidget is shown.
    			enableState: false,
    			customState: null,
    			customData: null,
    			editWidget: null,
    			selectedCallback: null,
    			createCallback: null, //callbacks for backend
    			updateCallback: null,
    			deleteCallback: null
    		}, options);

    		layer.style += Object.entries(this.classes).map((g) => `[data-class=${g[0]}] { stroke:${g[1].style.stroke}; }`).join('\n');
    		//at the moment is not really possible to unregister the events registered here.
    		viewer.pointerManager.onEvent(this);
    		document.addEventListener('keyup', (e) => this.keyUp(e), false);
    		layer.addEvent('selected', (anno) => {
    			if (!anno || anno == this.annotation)
    				return;
    			if(this.selectedCallback) this.selectedCallback(anno);
    			this.showEditWidget(anno);
    		});

    		layer.annotationsEntry = () => {

    			let entry = {
    				html: `<div class="openlime-tools"></div>`,
    				list: [], //will be filled later.
    				classes: 'openlime-annotations',
    				status: () => 'active',
    				oncreate: () => {
    					if (Array.isArray(layer.annotations))
    						layer.createAnnotationsList();

    					let tools = {
    						'add': { action: () => { this.createAnnotation(); }, title: "New annotation" },
    						'edit': { action: () => { this.toggleEditWidget(); }, title: "Edit annotations" },
    						'export': { action: () => { this.exportAnnotations(); }, title: "Export annotations" },
    						'trash': { action: () => { this.deleteSelected(); }, title: "Delete selected annotations" },
    					};
    					(async () => {

    						for (const [label, tool] of Object.entries(tools)) {
    							let icon = await Skin.appendIcon(entry.element.firstChild, '.openlime-' + label); // TODO pass entry.element.firstChild as parameter in onCreate
    							icon.setAttribute('title', tool.title);
    							icon.addEventListener('click', tool.action);
    						}
    					})();
    				}
    			};
    			layer.annotationsListEntry = entry;
    			return entry;
    		};
    	}

    	/** @ignore */
    	createAnnotation() {
    		let anno = this.layer.newAnnotation();
    		if(this.customData) this.customData(anno);
    		if(this.enableState) this.setAnnotationCurrentState(anno);
    		anno.idx = this.layer.annotations.length;
    		anno.publish = 1;
    		anno.label = anno.description = anno.class = '';
    		let post = {
    			id: anno.id, idx: anno.idx, label: anno.label, description: anno.description, 'class': anno.class, svg: null,
    			publish: anno.publish, data: anno.data
    		};
    		if (this.enableState) post = { ...post, state: anno.state };
    		if (this.createCallback) {
    			let result = this.createCallback(post);
    			if (!result)
    				alert("Failed to create annotation!");
    		}
    		this.layer.setSelected(anno);
    	}

    	/** @ignore */
    	toggleEditWidget() {
    		if (this.annotation)
    			return this.hideEditWidget();

    		let id = this.layer.selected.values().next().value;
    		if (!id)
    			return;

    		let anno = this.layer.getAnnotationById(id);
    		this.showEditWidget(anno);
    	}

    	/** @ignore */
    	updateEditWidget() {
    		let anno = this.annotation;
    		let edit = this.editWidget;
    		if (!anno.class)
    			anno.class = '';
    		edit.querySelector('[name=label]').value = anno.label || '';
    		edit.querySelector('[name=description]').value = anno.description || '';
    		edit.querySelector('[name=idx]').value = anno.idx || '';
    		Object.entries(anno.data).map(k => {
    			edit.querySelector(`[name=data-data-${k[0]}]`).value = k[1] || '';
    		});

    		edit.querySelector('[name=classes]').value = anno.class;
    		edit.querySelector('[name=publish]').checked = anno.publish == 1;
    		edit.classList.remove('hidden');
    		let button = edit.querySelector('.openlime-select-button');
    		button.textContent = this.classes[anno.class].label;
    		button.style.background = this.classes[anno.class].style.stroke;
    	}

    	/** @ignore */
    	showEditWidget(anno) {
    		this.annotation = anno;
    		this.setTool(null);
    		this.setActiveTool();
    		this.layer.annotationsListEntry.element.querySelector('.openlime-edit').classList.add('active');
    		(async () => {
    			await this.createEditWidget();
    			this.updateEditWidget();
    		})();
    	}

    	/** @ignore */
    	hideEditWidget() {
    		this.annotation = null;
    		this.setTool(null);
    		this.editWidget.classList.add('hidden');
    		this.layer.annotationsListEntry.element.querySelector('.openlime-edit').classList.remove('active');
    	}

    	//TODO this should actually be in the html.
    	/** @ignore */
    	async createEditWidget() {
    		if (this.editWidget)
    			return;		
    		let html = `
				<div class="openlime-annotation-edit">
					<label for="label">Title:</label> <input name="label" type="text"><br>
					<label for="description">Description:</label><br>
					<textarea name="description" cols="30" rows="5"></textarea><br>
					<span>Class:</span> 
					<div class="openlime-select">
						<input type="hidden" name="classes" value=""/>
						<div class="openlime-select-button"></div>
						<ul class="openlime-select-menu">
						${Object.entries(this.classes).map((c) =>
			`<li data-class="${c[0]}" style="background:${c[1].style.stroke};">${c[1].label}</li>`).join('\n')}
						</ul>
					</div>
					<label for="idx">Index:</label> <input name="idx" type="text"><br>	
					${Object.entries(this.annotation.data).map(k => {
						let label = k[0];
						let str = `<label for="data-data-${k[0]}">${label}:</label> <input name="data-data-${k[0]}" type="text"><br>`;
						return str;
					}).join('\n')}
					<br>
					<span><button class="openlime-state">SAVE</button></span>
					<span><input type="checkbox" name="publish" value=""> Publish</span><br>
					<div class="openlime-annotation-edit-tools"></div>
				</div>`;
    		let template = document.createElement('template');
    		template.innerHTML = html.trim();
    		let edit = template.content.firstChild;

    		let select = edit.querySelector('.openlime-select');
    		let button = edit.querySelector('.openlime-select-button');
    		let ul = edit.querySelector('ul');
    		let options = edit.querySelectorAll('li');
    		let input = edit.querySelector('[name=classes]');

    		let state = edit.querySelector('.openlime-state');
    		
    		state.addEventListener('click', (e) => {
    			if(this.enableState) this.setAnnotationCurrentState(this.annotation);
    			this.saveCurrent();
    			this.saveAnnotation(); 
    		});

    		button.addEventListener('click', (e) => {
    			e.stopPropagation();
    			for (let o of options)
    				o.classList.remove('selected');
    			select.classList.toggle('active');

    		});

    		ul.addEventListener('click', (e) => {
    			e.stopPropagation();

    			input.value = e.srcElement.getAttribute('data-class');
    			input.dispatchEvent(new Event('change'));
    			button.style.background = this.classes[input.value].style.stroke;
    			button.textContent = e.srcElement.textContent;

    			select.classList.toggle('active');
    		});

    		document.addEventListener('click', (e) => {
    			select.classList.remove('active');
    		});

    		document.querySelector('.openlime-layers-menu').appendChild(edit);

    		let tools = edit.querySelector('.openlime-annotation-edit-tools');

    		let pin = await Skin.appendIcon(tools, '.openlime-pin');
    		pin.addEventListener('click', (e) => { this.setTool('pin'); this.setActiveTool(pin); });

    		let draw = await Skin.appendIcon(tools, '.openlime-draw');
    		draw.addEventListener('click', (e) => { this.setTool('line'); this.setActiveTool(draw); });


    		//		let pen = await Skin.appendIcon(tools, '.openlime-pen'); 
    		//		pen.addEventListener('click', (e) => { this.setTool('pen'); setActive(pen); });

    		let erase = await Skin.appendIcon(tools, '.openlime-erase');
    		erase.addEventListener('click', (e) => { this.setTool('erase'); this.setActiveTool(erase); });

    		let undo = await Skin.appendIcon(tools, '.openlime-undo');
    		undo.addEventListener('click', (e) => { this.undo(); });

    		let redo = await Skin.appendIcon(tools, '.openlime-redo');
    		redo.addEventListener('click', (e) => { this.redo(); });

    		/*		let colorpick = await Skin.appendIcon(tools, '.openlime-colorpick'); 
    				undo.addEventListener('click', (e) => { this.pickColor(); }); */

    		let label = edit.querySelector('[name=label]');
    		label.addEventListener('blur', (e) => { if (this.annotation.label != label.value) this.saveCurrent(); this.saveAnnotation(); });

    		let descr = edit.querySelector('[name=description]');
    		descr.addEventListener('blur', (e) => { if (this.annotation.description != descr.value) this.saveCurrent(); this.saveAnnotation(); });

    		let idx = edit.querySelector('[name=idx]');
    		idx.addEventListener('blur', (e) => { 
    			if (this.annotation.idx != idx.value) {
    				const svgPinIdx = this.annotation.elements[0];
    				if(svgPinIdx) {
    					const txt = svgPinIdx.querySelector(".pin-text");
    					if(txt) {
    						txt.textContent = idx.value;
    					}
    				}
    				this.saveCurrent();
    			} 
    			this.saveAnnotation(); 
    		});

    		Object.entries(this.annotation.data).map(k => {
    			let dataElm = edit.querySelector(`[name=data-data-${k[0]}]`);
    			dataElm.addEventListener('blur', (e) => { if (this.annotation.data[k[0]] != dataElm.value) this.saveCurrent(); this.saveAnnotation(); });
    		});

    		let classes = edit.querySelector('[name=classes]');
    		classes.addEventListener('change', (e) => { if (this.annotation.class != classes.value) this.saveCurrent(); this.saveAnnotation(); });

    		let publish = edit.querySelector('[name=publish]');
    		publish.addEventListener('change', (e) => { if (this.annotation.publish != publish.value) this.saveCurrent(); this.saveAnnotation(); });

    		edit.classList.add('hidden');
    		this.editWidget = edit;
    	}

    	/** @ignore */
    	setAnnotationCurrentState(anno) {
    		anno.state = window.structuredClone(this.viewer.canvas.getState());
    		// Callback to add  light/lens params or other data
    		if(this.customState) this.customState(anno);
    	}

    	/** @ignore */
    	saveAnnotation() {
    		let edit = this.editWidget;
    		let anno = this.annotation;

    		anno.label = edit.querySelector('[name=label]').value || '';
    		anno.description = edit.querySelector('[name=description]').value || '';
    		anno.idx = edit.querySelector('[name=idx]').value || '0';
    		Object.entries(anno.data).map(k => {
    			anno.data[k[0]] = edit.querySelector(`[name=data-data-${k[0]}]`).value || '';
    		});		
    		anno.publish = edit.querySelector('[name=publish]').checked ? 1 : 0;
    		let select = edit.querySelector('[name=classes]');
    		anno.class = select.value || '';

    		let button = edit.querySelector('.openlime-select-button');
    		button.style.background = this.classes[anno.class].style.stroke;

    		for (let e of this.annotation.elements)
    			e.setAttribute('data-class', anno.class);

    		let post = {
    			id: anno.id, idx: anno.idx, label: anno.label, description: anno.description, class: anno.class,
    			publish: anno.publish, data: anno.data
    		};
    		if (this.enableState) post = { ...post, state: anno.state };
    		// if (anno.light) post = { ...post, light: anno.light }; FIXME
    		// if (anno.lens) post = { ...post, lens: anno.lens };

    		//anno.bbox = anno.getBBoxFromElements();
    		let serializer = new XMLSerializer();
    		post.svg = `<svg xmlns="http://www.w3.org/2000/svg">
				${anno.elements.map((s) => { s.classList.remove('selected'); return serializer.serializeToString(s) }).join("\n")}  
				</svg>`;

    		if (this.updateCallback) {
    			let result = this.updateCallback(post);
    			if (!result) {
    				alert("Failed to update annotation");
    				return;
    			}
    		}				//for (let c of element.children)
    		//		a.elements.push(c);

    		//update the entry
    		let template = document.createElement('template');
    		template.innerHTML = this.layer.createAnnotationEntry(anno);
    		let entry = template.content.firstChild;
    		//TODO find a better way to locate the entry!
    		this.layer.annotationsListEntry.element.parentElement.querySelector(`[data-annotation="${anno.id}"]`).replaceWith(entry);
    		this.layer.setSelected(anno);
    	}

    	/** @ignore */
    	deleteSelected() {
    		let id = this.layer.selected.values().next().value;
    		if (id)
    			this.deleteAnnotation(id);
    	}

    	/** @ignore */
    	deleteAnnotation(id) {
    		let anno = this.layer.getAnnotationById(id);
    		if (this.deleteCallback) {
    			if (!confirm(`Deleting annotation ${anno.label}, are you sure?`))
    				return;
    			let result = this.deleteCallback(anno);
    			if (!result) {
    				alert("Failed to delete this annotation.");
    				return;
    			}
    		}
    		//remove svg elements from the canvas
    		this.layer.svgGroup.querySelectorAll(`[data-annotation="${anno.id}"]`).forEach(e => e.remove());

    		//remove entry from the list
    		let list = this.layer.annotationsListEntry.element.parentElement.querySelector('.openlime-list');
    		list.querySelectorAll(`[data-annotation="${anno.id}"]`).forEach(e => e.remove());

    		this.layer.annotations = this.layer.annotations.filter(a => a !== anno);
    		this.layer.clearSelected();
    		this.hideEditWidget();
    	}

    	/** @ignore */
    	exportAnnotations() {
    		let svgElement = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    		const bBox = this.layer.boundingBox();
    		svgElement.setAttribute('viewBox', `0 0 ${bBox.xHigh-bBox.xLow} ${bBox.yHigh-bBox.yLow}`);
    		let style = Util.createSVGElement('style');
    		style.textContent = this.layer.style;
    		svgElement.appendChild(style);
    		let serializer = new XMLSerializer();
    		//let svg = `<svg xmlns="http://www.w3.org/2000/svg">
    		for (let anno of this.layer.annotations) {
    			for (let e of anno.elements) {
    				if (e.tagName == 'path') {
    					//Inkscape nitpicks on the commas in svg path.
    					let d = e.getAttribute('d');
    					e.setAttribute('d', d.replaceAll(',', ' '));
    				}
    				svgElement.appendChild(e.cloneNode());
    			}
    		}
    		let svg = serializer.serializeToString(svgElement);
    		/*(${this.layer.annotations.map(anno => {
    			return `<group id="${anno.id}" title="${anno.label}" data-description="${anno.description}">
    				${anno.elements.map((s) => { 
    					s.classList.remove('selected'); 
    					return serializer.serializeToString(s) 
    				}).join("\n")}
    				</group>`;
    		})}
    		</svg>`; */

    		///console.log(svg);

    		var e = document.createElement('a');
    		e.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(svg));
    		e.setAttribute('download', 'annotations.svg');
    		e.style.display = 'none';
    		document.body.appendChild(e);
    		e.click();
    		document.body.removeChild(e);
    	}

    	/** @ignore */
    	setActiveTool(e) {
    		if (!this.editWidget) return;
    		let tools = this.editWidget.querySelector('.openlime-annotation-edit-tools');
    		tools.querySelectorAll('svg').forEach(a =>
    			a.classList.remove('active'));
    		if (e)
    			e.classList.add('active');
    	}

    	/** @ignore */
    	setTool(tool) {
    		this.tool = tool;
    		if (this.factory && this.factory.quit)
    			this.factory.quit();
    		if (tool) {
    			if (!tool in this.tools)
    				throw "Unknown editor tool: " + tool;

    			this.factory = new this.tools[tool].tool(this.tools[tool]);
    			this.factory.annotation = this.annotation;
    			this.factory.layer = this.layer;
    		}
    		document.querySelector('.openlime-overlay').classList.toggle('erase', tool == 'erase');
    		document.querySelector('.openlime-overlay').classList.toggle('crosshair', tool && tool != 'erase');
    	}


    	// UNDO STUFF	

    	/** @ignore */
    	undo() {
    		let anno = this.annotation; //current annotation.
    		if (!anno)
    			return;
    		if (this.factory && this.factory.undo && this.factory.undo()) {
    			anno.needsUpdate = true;
    			this.viewer.redraw();
    			return;
    		}

    		if (anno.history && anno.history.length) {
    			//FIXME TODO history will be more complicated if it has to manage multiple tools.
    			anno.future.push(this.annoToData(anno));

    			let data = anno.history.pop();
    			this.dataToAnno(data, anno);

    			anno.needsUpdate = true;
    			this.viewer.redraw();
    			this.updateEditWidget();
    		}
    	}

    	/** @ignore */
    	redo() {
    		let anno = this.annotation; //current annotation.
    		if (!anno)
    			return;
    		if (this.factory && this.factory.redo && this.factory.redo()) {
    			anno.needsUpdate = true;
    			this.viewer.redraw();
    			return;
    		}
    		if (anno.future && anno.future.length) {
    			anno.history.push(this.annoToData(anno));

    			let data = anno.future.pop();
    			this.dataToAnno(data, anno);

    			anno.needsUpdate = true;
    			this.viewer.redraw();
    			this.updateEditWidget();
    		}
    	}

    	/** @ignore */
    	saveCurrent() {
    		let anno = this.annotation; //current annotation.
    		if (!anno.history)
    			anno.history = [];

    		anno.history.push(this.annoToData(anno));
    		anno.future = [];
    	}

    	/** @ignore */
    	annoToData(anno) {
    		let data = {};
    		for (let i of ['id', 'label', 'description', 'class', 'publish', 'data'])
    			data[i] = `${anno[i] || ''}`;
    		data.elements = anno.elements.map(e => { let n = e.cloneNode(); n.points = e.points; return n; });
    		return data;
    	}

    	/** @ignore */
    	dataToAnno(data, anno) {
    		for (let i of ['id', 'label', 'description', 'class', 'publish', 'data'])
    			anno[i] = `${data[i]}`;
    		anno.elements = data.elements.map(e => { let n = e.cloneNode(); n.points = e.points; return n; });
    	}


    	// TOOLS STUFF

    	/** @ignore */
    	keyUp(e) {
    		if (e.defaultPrevented) return;
    		switch (e.key) {
    			case 'Escape':
    				if (this.tool) {
    					this.setActiveTool();
    					this.setTool(null);
    					e.preventDefault();
    				}
    				break;
    			case 'Delete':
    				this.deleteSelected();
    				break;
    			case 'Backspace':
    				break;
    			case 'z':
    				if (e.ctrlKey)
    					this.undo();
    				break;
    			case 'Z':
    				if (e.ctrlKey)
    					this.redo();
    				break;
    		}
    	}

    	/** @ignore */
    	panStart(e) {
    		if (e.buttons != 1 || e.ctrlKey || e.altKey || e.shiftKey || e.metaKey)
    			return;
    		if (!['line', 'erase', 'box', 'circle'].includes(this.tool))
    			return;
    		this.panning = true;
    		e.preventDefault();

    		this.saveCurrent();

    		const pos = this.mapToSvg(e);
    		this.factory.create(pos, e);

    		this.annotation.needsUpdate = true;

    		this.viewer.redraw();
    	}

    	/** @ignore */
    	panMove(e) {
    		if (!this.panning)
    			return false;

    		const pos = this.mapToSvg(e);
    		this.factory.adjust(pos, e);
    	}

    	/** @ignore */
    	panEnd(e) {
    		if (!this.panning)
    			return false;
    		this.panning = false;

    		const pos = this.mapToSvg(e);
    		let changed = this.factory.finish(pos, e);
    		if (!changed) //nothing changed no need to keep current situation in history.
    			this.annotation.history.pop();
    		else
    			this.saveAnnotation();
    		this.annotation.needsUpdate = true;
    		this.viewer.redraw();
    	}

    	/** @ignore */
    	fingerHover(e) {
    		if (this.tool != 'line')
    			return;
    		e.preventDefault();
    		const pos = this.mapToSvg(e);
    		this.factory.hover(pos, e);
    		this.annotation.needsUpdate = true;
    		this.viewer.redraw();
    	}

    	/** @ignore */
    	fingerSingleTap(e) {
    		if (!['point', 'pin', 'line', 'erase'].includes(this.tool))
    			return;
    		e.preventDefault();

    		this.saveCurrent();

    		const pos = this.mapToSvg(e);
    		let changed = this.factory.tap(pos, e);
    		if (!changed) //nothing changed no need to keep current situation in history.
    			this.annotation.history.pop();
    		else
    			this.saveAnnotation();
    		this.annotation.needsUpdate = true;

    		this.viewer.redraw();
    	}

    	/** @ignore */
    	fingerDoubleTap(e) {
    		if (!['line'].includes(this.tool))
    			return;
    		e.preventDefault();

    		this.saveCurrent();

    		const pos = this.mapToSvg(e);
    		let changed = this.factory.doubleTap(pos, e);
    		if (!changed) //nothing changed no need to keep current situation in history.
    			this.annotation.history.pop();
    		else
    			this.saveAnnotation();
    		this.annotation.needsUpdate = true;

    		this.viewer.redraw();
    	}

    	/** @ignore */
    	mapToSvg(e) {
    		const p = {x:e.offsetX, y: e.offsetY};
    		const layerT = this.layer.transform;
    		const useGL = false;
    		console.log(layerT);
    		const layerbb = this.layer.boundingBox();
    		const layerSize = {w:layerbb.width(), h:layerbb.height()};
    		let pos = CoordinateSystem.fromCanvasHtmlToImage(p, this.viewer.camera, layerT, layerSize, useGL);
    		
    		return pos;
    	}
    }


    /** @ignore */
    class Point {
    	tap(pos) {
    		let point = Util.createSVGElement('circle', { cx: pos.x, cy: pos.y, r: 10, class: 'point' });
    		this.annotation.elements.push(point);
    		return true;
    	}
    }

    /** @ignore */
    class Pin {
    	constructor(options) {
    		Object.assign(this, options);
    	}
    	tap(pos) {
    		const str = this.template(pos.x,pos.y);
    		let parser = new DOMParser();
    	    let point = parser.parseFromString(str, "image/svg+xml").documentElement;
    //		this.annotation.elements.push(point);
    		this.annotation.elements[0] = point;
    		return true;
    	}
    }

    /** @ignore */
    class Pen {
    	constructor() {
    		//TODO Use this.path.points as in line, instead.
    		this.points = [];
    	}
    	create(pos) {
    		this.points.push(pos);
    		if (this.points.length == 1) {
    			saveCurrent;

    			this.path = Util.createSVGElement('path', { d: `M${pos.x} ${pos.y}`, class: 'line' });
    			return this.path;
    		}
    		let p = this.path.getAttribute('d');
    		this.path.setAttribute('d', p + ` L${pos.x} ${pos.y}`);
    		this.path.points = this.points;
    	}
    	undo() {
    		if (!this.points.length)
    			return;
    		this.points.pop();
    		let d = this.points.map((p, i) => `${i == 0 ? 'M' : 'L'}${p.x} ${p.y}`).join(' ');
    		this.path.setAttribute('d', d);

    		if (this.points.length < 2) {
    			this.points = [];
    			this.annotation.elements = this.annotation.elements.filter((e) => e != this.path);
    		}
    	}
    }

    /** @ignore */
    class Box {
    	constructor() {
    		this.origin = null;
    		this.box = null;
    	}

    	create(pos) {
    		this.origin = pos;
    		this.box = Util.createSVGElement('rect', { x: pos.x, y: pos.y, width: 0, height: 0, class: 'rect' });
    		return this.box;
    	}

    	adjust(pos) {
    		let p = this.origin;

    		this.box.setAttribute('x', Math.min(p.x, pos.x));
    		this.box.setAttribute('width', Math.abs(pos.x - p.x));
    		this.box.setAttribute('y', Math.min(p.y, pos.y));
    		this.box.setAttribute('height', Math.abs(pos.y - p.y));
    	}

    	finish(pos) {
    		return this.box;
    	}
    }

    /** @ignore */
    class Circle {
    	constructor() {
    		this.origin = null;
    		this.circle = null;
    	}
    	create(pos) {
    		this.origin = pos;
    		this.circle = Util.createSVGElement('circle', { cx: pos.x, cy: pos.y, r: 0, class: 'circle' });
    		return this.circle;
    	}
    	adjust(pos) {
    		let p = this.origin;
    		let r = Math.hypot(pos.x - p.x, pos.y - p.y);
    		this.circle.setAttribute('r', r);
    	}
    	finish() {
    		return this.circle;
    	}
    }

    /** @ignore */
    class Line {
    	constructor() {
    		this.history = [];
    	}
    	create(pos) {
    		/*if(this.segment) {
    			this.layer.svgGroup.removeChild(this.segment);
    			this.segment = null;
    		}*/
    		for (let e of this.annotation.elements) {
    			if (!e.points || e.points.length < 2)
    				continue;
    			if (Line.distance(e.points[0], pos) * pos.z < 5) {
    				e.points.reverse();
    				this.path = e;
    				this.path.setAttribute('d', Line.svgPath(e.points));
    				//reverse points!
    				this.history = [this.path.points.length];
    				return;
    			}
    			if (Line.distanceToLast(e.points, pos) < 5) {
    				this.path = e;
    				this.adjust(pos);
    				this.history = [this.path.points.length];
    				return;
    			}
    		}
    		this.path = Util.createSVGElement('path', { d: `M${pos.x} ${pos.y}`, class: 'line' });
    		this.path.points = [pos];
    		this.history = [this.path.points.length];
    		this.annotation.elements.push(this.path);
    	}

    	tap(pos) {
    		if (!this.path) {
    			this.create(pos);
    			return false;
    		} else {
    			if (this.adjust(pos))
    				this.history = [this.path.points.length - 1];
    			return true;
    		}
    	}
    	doubleTap(pos) {
    		if (!this.path)
    			return false;
    		if (this.adjust(pos)) {
    			this.history = [this.path.points.length - 1];
    			this.path = null;
    		}
    		return false;
    	}

    	hover(pos, event) {
    		return;
    	}
    	quit() {
    		return;
    	}

    	adjust(pos) {
    		let gap = Line.distanceToLast(this.path.points, pos);
    		if (gap * pos.z < 4) return false;

    		this.path.points.push(pos);

    		this.path.getAttribute('d');
    		this.path.setAttribute('d', Line.svgPath(this.path.points));//d + `L${pos.x} ${pos.y}`);
    		return true;
    	}

    	finish() {
    		this.path.setAttribute('d', Line.svgPath(this.path.points));
    		return true; //some changes where made!
    	}

    	undo() {
    		if (!this.path || !this.history.length)
    			return false;
    		this.path.points = this.path.points.slice(0, this.history.pop());
    		this.path.setAttribute('d', Line.svgPath(this.path.points));
    		return true;
    	}
    	redo() {
    		return false;
    	}
    	//TODO: smooth should be STABLE, if possible.
    	static svgPath(points) {
    		//return points.map((p, i) =>  `${(i == 0? "M" : "L")}${p.x} ${p.y}`).join(' '); 

    		let tolerance = 1.5 / points[0].z;
    		let tmp = simplify(points, tolerance);

    		let smoothed = smooth(tmp, 90, true);
    		return smoothToPath(smoothed);
    		
    	}
    	static distanceToLast(line, point) {
    		let last = line[line.length - 1];
    		return Line.distance(last, point);
    	}
    	static distance(a, b) {
    		let dx = a.x - b.x;
    		let dy = a.y - b.y;
    		return Math.sqrt(dx * dx + dy * dy);
    	}
    }

    /** @ignore */
    class Erase {
    	create(pos, event) { this.erased = false; this.erase(pos, event); }
    	adjust(pos, event) { this.erase(pos, event); }
    	finish(pos, event) { return this.erase(pos, event); } //true if some points where removed.
    	tap(pos, event) { return this.erase(pos, event); }
    	erase(pos, event) {
    		for (let e of this.annotation.elements) {
    			if (e == event.originSrc) {
    				e.points = [];
    				this.erased = true;
    				continue;
    			}

    			let points = e.points;
    			if (!points || !points.length)
    				continue;

    			if (Line.distanceToLast(points, pos) < 10)
    				this.erased = true, points.pop();
    			else if (Line.distance(points[0], pos) < 10)
    				this.erased = true, points.shift();
    			else
    				continue;

    			if (points.length <= 2) {
    				e.points = [];
    				e.setAttribute('d', '');
    				this.annotation.needsUpdate = true;
    				this.erased = true;
    				continue;
    			}

    			e.setAttribute('d', Line.svgPath(points));
    		}
    		this.annotation.elements = this.annotation.elements.filter(e => { return !e.points || e.points.length > 2; });
    		return this.erased;
    	}
    }

    exports.BoundingBox = BoundingBox;
    exports.Camera = Camera;
    exports.Canvas = Canvas;
    exports.Color = Color;
    exports.Colormap = Colormap;
    exports.ColormapLegend = ColormapLegend;
    exports.Controller = Controller;
    exports.Controller2D = Controller2D;
    exports.ControllerFocusContext = ControllerFocusContext;
    exports.ControllerLens = ControllerLens;
    exports.ControllerPanZoom = ControllerPanZoom;
    exports.CoordinateSystem = CoordinateSystem;
    exports.EditorSvgAnnotation = EditorSvgAnnotation;
    exports.FocusContext = FocusContext;
    exports.HSH = HSH;
    exports.Layer = Layer;
    exports.LayerAnnotation = LayerAnnotation;
    exports.LayerAnnotationImage = LayerAnnotationImage;
    exports.LayerBRDF = LayerBRDF;
    exports.LayerCombiner = LayerCombiner;
    exports.LayerImage = LayerImage;
    exports.LayerLens = LayerLens;
    exports.LayerMaskedImage = LayerMaskedImage;
    exports.LayerNeuralRTI = LayerNeuralRTI;
    exports.LayerRTI = LayerRTI;
    exports.LayerSvgAnnotation = LayerSvgAnnotation;
    exports.Layout = Layout;
    exports.LayoutTileImages = LayoutTileImages;
    exports.LayoutTiles = LayoutTiles;
    exports.LensDashboard = LensDashboard;
    exports.LensDashboardNavigator = LensDashboardNavigator;
    exports.LensDashboardNavigatorRadial = LensDashboardNavigatorRadial;
    exports.PointerManager = PointerManager;
    exports.Raster = Raster;
    exports.RenderingMode = RenderingMode;
    exports.Ruler = Ruler;
    exports.ScaleBar = ScaleBar;
    exports.Shader = Shader;
    exports.ShaderBRDF = ShaderBRDF;
    exports.ShaderCombiner = ShaderCombiner;
    exports.ShaderFilter = ShaderFilter;
    exports.ShaderFilterColormap = ShaderFilterColormap;
    exports.ShaderFilterOpacity = ShaderFilterOpacity;
    exports.ShaderFilterTest = ShaderFilterTest;
    exports.ShaderFilterVector = ShaderFilterVector;
    exports.ShaderFilterVectorGlyph = ShaderFilterVectorGlyph;
    exports.ShaderGammaFilter = ShaderGammaFilter;
    exports.ShaderNeural = ShaderNeural;
    exports.ShaderRTI = ShaderRTI;
    exports.Skin = Skin;
    exports.Tile = Tile;
    exports.Transform = Transform;
    exports.UIBasic = UIBasic;
    exports.UIDialog = UIDialog;
    exports.Units = Units;
    exports.Util = Util;
    exports.Viewer = Viewer;

    Object.defineProperty(exports, '__esModule', { value: true });

}));
