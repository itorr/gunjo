/**
 * @author itorr<https://github.com/itorr>
 * @date 2022-08-19
 * @Description 群青生成器
 * */

const defaultTitle = '群青';
const defaultEngTitle = 'YOASOBI';


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
	const setWidthHeight = Math.max(_width,_height);

	textureCtx.drawImage(
		el,
		0,0,
		1200,1200,
		0,0,
		setWidthHeight,setWidthHeight
	);
	return textureCtx.getImageData(0,0,_width,_height);

}


const gunjo = async ({img, outputCanvas, config, callback}) => {
	if (!img || !config) return;

	const configString = [
		JSON.stringify(config),
		img.src,
	].join('-');

	if (lastConfigString === configString) return;

	console.time('gunjo');

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
			// let y = r * .333 + g * .333 + b * .333;
			pixel.data[i] = y + (Math.abs(pixel.data[i]-128)/128) * averageLightDiff;
		}

	}

	/* 
	// 载入置换贴图
	const displaceTexturePixel = getTexturePixelData(textureDisplaceEl,_width,_height);

	const w = pixel.width;
	const h = pixel.height;
	const displacePixel = ctx.createImageData(w, h);
	displacePixel.data.fill(255);
	
	// 从原图获取像素点
	// for (let sy = 0; sy < h; sy++) {
	// 	for (let sx = 0; sx < w; sx++) {
	// 		const i = (sy * w + sx) * 4;

	// 		const _y = -displaceTexturePixel.data[i + 1] + 128;
	// 		const _x = -displaceTexturePixel.data[i + 2] + 128;

	// 		const oi = i + (_x + _y * w) * 4;

	// 		displacePixel.data[i + 0] = pixel.data[oi + 0];
	// 		displacePixel.data[i + 1] = pixel.data[oi + 1];
	// 		displacePixel.data[i + 2] = pixel.data[oi + 2];
	// 		displacePixel.data[i + 3] = pixel.data[oi + 3];
	// 	}
	// }

	// 移动原图像素
	for (let sy = 0; sy < h; sy++) {
		for (let sx = 0; sx < w; sx++) {
			const i = (sy * w + sx) * 4;

			const _y = displaceTexturePixel.data[i + 1] - 128;
			const _x = displaceTexturePixel.data[i + 2] - 128;

			const oi = i + (_x + _y * w) * 4;

			displacePixel.data[oi + 0] = pixel.data[i + 0];
			displacePixel.data[oi + 1] = pixel.data[i + 1];
			displacePixel.data[oi + 2] = pixel.data[i + 2];
			displacePixel.data[oi + 3] = pixel.data[i + 3];
		}
	}
	pixel = displacePixel;
	*/

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

	// 载入暗部纹理
	const darkTexturePixel = getTexturePixelData(darkTextureEl,_width,_height);

	// const split1 = 0.3 * 255;
	// const split2 = 0.6 * 255;

	const { split1, split2 } = style;
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

		// 临时应用暗部纹理顶替
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
			// 应用中间调纹理
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

			// 应用暗部纹理
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



	const {watermark,fontSize,watermarkX,watermarkY} = style;
	let {title,engTitle} = style;

	if(!title) title = defaultTitle;
	if(!engTitle) engTitle = defaultEngTitle;

	if(watermark){
		const engfontSize = Math.round(_height*fontSize/100);
		const titleFontSize = Math.round(engfontSize * 1.5);
		const alignX = _width * watermarkX / 100;
		const alignY = _height * watermarkY / 100;

		// canvas.style.letterSpacing = `-100px`;

		ctx.fillStyle = '#FFF';
		ctx.textAlign = 'right';
		ctx.textBaseline = 'bottom';
		ctx.shadowBlur = engfontSize * 1.5;
		ctx.shadowColor = 'rgba(33,49,180,.4)';
		ctx.font = `${engfontSize}px robots,sans-serif`;
		ctx.fillText(engTitle.toUpperCase(),alignX,alignY);

		const titleLength = title.length;
		ctx.font = `${titleFontSize}px robots,sans-serif`;
		for(let i = 0; i < titleLength;i++){
			const moji = title[i];
			ctx.fillText(moji,alignX + engfontSize * 0.12,alignY - titleFontSize * ( titleLength - i + 0.1));
		}

	}
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

	console.timeEnd('gunjo');
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
let textureDisplaceEl;
const gunjoInit = onOver=>{
	loadImage('texture-middle.png',el=>{
		middleTextureEl = el;
		loadImage('texture-dark.png',el=>{
			darkTextureEl = el;
			loadImage('texture-displace.png',el=>{
				console.log(el);

				textureDisplaceEl = el;
				onOver();
			});
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