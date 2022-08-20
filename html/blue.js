/**
 * @author itorr<https://github.com/itorr>
 * @date 2022-06-01
 * @Description One Last Image
 * */



const randRange = (a, b) => Math.floor(Math.random() * (b - a) + a);

const inputImageEl = document.querySelector('#input');



let width = 640;
let height = 480;
let scale = width / height;



let lastConfigString = null;

const canvas = document.createElement('canvas');
const ctx = canvas.getContext('2d');
const canvasShade = document.createElement('canvas');
const canvasShadeMin = document.createElement('canvas');
const canvasMin = document.createElement('canvas');


const textureCanvas = document.createElement('canvas');
const getTexturePixelData = (el,_width,_height)=>{
	textureCanvas.width = _width;
	textureCanvas.height = _height;
	const textureCtx = textureCanvas.getContext('2d');
	const middleSetWidthHeight = Math.max(_width,_height);
	textureCtx.drawImage(
		el,
		0,0,
		1200,1200,
		0,0,
		middleSetWidthHeight,middleSetWidthHeight
	);
	return textureCtx.getImageData(0,0,_width,_height);

}


const blue = async ({img, outputCanvas, config, callback}) => {
	if (!img || !config) return;

	const configString = [
		JSON.stringify(config),
		img.src,
	].join('-');

	if (lastConfigString === configString) return;

	console.time('blue');

	lastConfigString = configString;

	const oriWidth = img.naturalWidth;
	const oriHeight = img.naturalHeight;

	let oriScale = oriWidth / oriHeight;



	// const _width  = Math.floor( width  / config.zoom );
	// const _height = Math.floor( height / config.zoom );

	let _width  = Math.round( oriWidth   / config.zoom );
	let _height = Math.round( oriHeight  / config.zoom );

	const maxWidth = 1920;
	if(_width > maxWidth){
		_height = _height * maxWidth / _width
		_width = maxWidth
	}
	// const _width = 800;
	// const _height = 800;


	let cutLeft = 0;
	let cutTop = 0;

	let calcWidth = oriWidth;
	let calcHeight = oriHeight;

	if(config.cover){

		if(oriScale > 1){
			cutLeft = (oriScale - 1) * oriHeight / 2;
			cutLeft = Math.round(cutLeft);
			calcWidth = oriHeight;
			_width = _height;
		}else{
			cutTop =  (1 - oriScale) * oriHeight / 2;
			cutTop = Math.round(cutTop);
			calcHeight = oriWidth;
			_height = _width;
		}
	}


	let setLeft = 0;
	let setTop = 0;

	let setWidth = _width;
	let setHeight = _height;


	canvas.width = _width;
	canvas.height = _height;



	ctx.drawImage(
		img,
		cutLeft, cutTop,
		calcWidth, calcHeight,

		setLeft, setTop,
		setWidth, setHeight
	);
	


	let pixel = ctx.getImageData(0, 0, _width, _height);
	

	if(style.average){
		
		let ii = 0;
		let allCount = 0;
		for(let i = 0; i < pixel.data.length;i+=4 * 1000){
			const r = pixel.data[i];
			const g = pixel.data[i + 1];
			const b = pixel.data[i + 2];
			let y = r * .299000 + g * .587000 + b * .114000;
			// pixel.data[i] = y;
			ii++;
			allCount += y;
		}
		const averageLight = allCount/ii;

		const averageLightDiff = 117 - averageLight;


		console.log(averageLight,averageLightDiff);

		for(let i = 0; i < pixel.data.length;i+=4){
			const r = pixel.data[i];
			const g = pixel.data[i + 1];
			const b = pixel.data[i + 2];
			let y = r * .299000 + g * .587000 + b * .114000;
			pixel.data[i] = y + (Math.abs(pixel.data[i]-128)/128) * averageLightDiff;
		}

	}

	pixel = config.convoluteName ? convoluteY(
		pixel,
		// [
		// 	0, -1, 0,
		// 	3, 2, -2,
		// 	0, -1, 0
		// ],
		// [
		// 	0, -.5, 0,
		// 	1, 2, -1,
		// 	0, -.5, 0
		// ],
		[
			0, -.25, 0,
			1, 1, -.5,
			0, -.25, 0
		],
		ctx
	) : pixel;


	let pixelData = pixel.data;

	// 测试图像数据读取正常与否
	// alert(pixel.data.slice(0,10);


	// 载入中灰纹理
	const middleTexturePixel = getTexturePixelData(middleTextureEl,_width,_height);
	const darkTexturePixel = getTexturePixelData(darkTextureEl,_width,_height);

	// const split1 = 0.3 * 255;
	// const split2 = 0.6 * 255;

	const {split1,split2} = style;
	for (let i = 0; i < pixelData.length; i += 4) {

		
		const y = pixelData[i];


		// 白
		const lr = 205;
		const lg = 213;
		const lb = 226;
		let lalpha = (Math.max(split2 , y) - split2) / (255 - split2);

		const textureL = middleTexturePixel.data[i + 1];


		// const lbase = 205 + 50 * (textureL/255);
		lbase = 255;
		lalpha = lalpha + 1 * (darkTexturePixel.data[i + 1]/255 - 0.5);
		let _r = lr + (lbase - lr) * lalpha;
		let _g = lg + (lbase - lg) * lalpha;
		let _b = lb + (lbase - lb) * lalpha;

		// let _r = 255
		// let _g = 255
		// let _b = 255




		if(y < split2){
			// 中间调
			const mbase = 100;
			const my = ((y - split1) / split2) * mbase - mbase * 0.2;
			const mr = 170 + my;
			const mg = 172 + my;
			const mb = 227 + my;


			
			let alpha = Math.min( 1, (split2 - y) / 30 );

			// alpha = Math.min(alpha,textureL/255);
			alpha = alpha + 1.5 * (textureL/255 - 0.5);
			const alphal = 1 - alpha;
			_r = _r * alphal + mr * alpha;
			_g = _g * alphal + mg * alpha;
			_b = _b * alphal + mb * alpha;
		}

		if(y < split1){
			// 最深色
			const dy = 26 * y/255 * 3;
			const dr = 30 + dy;
			const dg = 31 + dy;
			const db = 166 + dy;

			let alpha = Math.min( 1, (split1 - y) / 30 );
			alpha = alpha + 1 * (darkTexturePixel.data[i + 1]/255 - 0.5);

			const alphal = 1 - alpha;
			

			_r = _r * alphal + dr * alpha;
			_g = _g * alphal + dg * alpha;
			_b = _b * alphal + db * alpha;
		}


		pixelData[i    ] = _r;
		pixelData[i + 1] = _g;
		pixelData[i + 2] = _b;
	}


	ctx.putImageData(pixel, 0, 0);


	// canvas.style.letterSpacing = `-100px`

	// ctx.textAlign = 'center';
	// ctx.textBaseline = 'middle';
	// ctx.font = `${_height*0.8}px EVAMatisseClassic,sans-serif`;
	// ctx.fillStyle = '#FFF';
	// ctx.fillText('次回予告',_width/2,_height/2, _width * 0.8);

	// ctx.fillStyle = 'rgba(155,0,0,.7)';
	// ctx.fillRect(0,0,_width,_height);

	const outputCtx = outputCanvas.getContext('2d');

	outputCanvas.width = _width;
	outputCanvas.height = _height;
	outputCtx.fillStyle = '#FFF';
	outputCtx.fillRect(0,0,_width,_height);
	outputCtx.drawImage(
		canvas,
		0,0,
		_width,_height
	);

	console.timeEnd('blue');
	// return canvas.toDataURL('image/png');
	
};

let loadImage = (url,onOver)=>{
	const el = new Image();
	el.onload = _=>onOver(el);
	el.src = url;
};
let loadImagePromise = async url=>{
	return new Promise(function(resolve, reject){
		setTimeout(function(){
			const el = new Image();
			el.onload = _=>resolve(el);
			el.onerror = e=>reject(e);
			el.src = url;
		}, 2000);
	});
}

let darkTextureEl;
let middleTextureEl;
const blueInit = onOver=>{
	loadImage('texture-middle.png',el=>{
		middleTextureEl = el;
		loadImage('texture-dark.png',el=>{
			darkTextureEl = el;
			onOver();
		});
	});
};

const convoluteY = (pixels, weights, ctx) => {
	const side = Math.round( Math.sqrt( weights.length ) );
	const halfSide = Math.floor(side / 2);

	const src = pixels.data;

	const w = pixels.width;
	const h = pixels.height;
	const output = ctx.createImageData(w, h);
	const dst = output.data;

	for (let sy = 0; sy < h; sy++) {
		for (let sx = 0; sx < w; sx++) {
			const dstOff = (sy * w + sx) * 4;
			let r = 0, g = 0, b = 0;

			for (let cy = 0; cy < side; cy++) {
				for (let cx = 0; cx < side; cx++) {

					const scy = Math.min(h - 1, Math.max(0, sy + cy - halfSide));
					const scx = Math.min(w - 1, Math.max(0, sx + cx - halfSide));

					const srcOff = (scy * w + scx) * 4;
					const wt = weights[cy * side + cx];

					r += src[srcOff] * wt;
					// g += src[srcOff + 1] * wt;
					// b += src[srcOff + 2] * wt;
				}
			}
			dst[dstOff] = r;
			dst[dstOff + 1] = r;
			dst[dstOff + 2] = r;
			dst[dstOff + 3] = 255;
		}
	}


	// for (let y=0; y<h; y++) {
	// 	for (let x=0; x<w; x++) {
	// 		const srcOff = (y*w+x)*4;
	// 		src[srcOff] = dst[srcOff];
	// 	}
	// }
	return output;
};