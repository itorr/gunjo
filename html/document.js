
const readFileToURL = (file,onOver)=>{
	var reader = new FileReader();
	reader.onload = ()=>{
		const src = reader.result;
		onOver(src);
	};
	reader.readAsDataURL(file);
};

const readFileAndSetIMGSrc = file=>{
	readFileToURL(file,src=>{
		app.src = src;
	});
};

const isImageRegex = /^image\/(jpeg|gif|png|bmp|webp)$/;

document.addEventListener('paste',e=>{
	// console.log(e.clipboardData,e.clipboardData.files);

	const clipboardData = e.clipboardData;
	if(clipboardData.items[0]){
		let file = clipboardData.items[0].getAsFile();

		if(file && isImageRegex.test(file.type)){
			return readFileAndSetIMGSrc(file);
		}
	}

	if(clipboardData.files.length){
		for(let i = 0;i<clipboardData.files.length;i++){
			if(isImageRegex.test(clipboardData.files[i].type)){
				// console.log(clipboardData.files[i])
				readFileAndSetIMGSrc(clipboardData.files[i]);
			}
		}
	}
});

document.addEventListener('dragover',e=>{
	e.preventDefault();
});
document.addEventListener('drop',e=>{
	e.preventDefault();

	const file = e.dataTransfer.files[0];

	if(file && file.type.match(isImageRegex)){
		readFileAndSetIMGSrc(file);
	}
});

const _gunjo = (img,style,callback)=>{

	clearTimeout(gunjo.T);
	gunjo.T = setTimeout(()=>{
		gunjo(img,style,callback);
		app.saveData();
	},100);
};

const deepCopy = o=>JSON.parse(JSON.stringify(o));





const creatConvoluteCenterHigh = (w,centerV)=>{
	const arr = [];
	const c = Math.floor((w*w)/2);

	for(let x = 0; x < w; x++){
		for(let y = 0; y < w; y++){
			let i = x * w + y;
			arr[i] = -1;

			if(i===c){
				arr[i] = centerV;
			}
		}
	}
	return arr;
}
const creatConvoluteAverage = (w)=>new Array(w*w).fill(1/(w*w))


const Convolutes = {
	// '右倾': [
	// 	0, -1, 0,
	// 	-1, 2, 2,
	// 	0, -1, 0
	// ],
	// '左倾': [
	// 	0, -1, 0,
	// 	3, 2, -2,
	// 	0, -1, 0
	// ],
	// '极细':   creatConvoluteAverage(3),
	'精细':  creatConvoluteAverage(5),
	'一般':  creatConvoluteAverage(7),
	'稍粗':  creatConvoluteAverage(9),
	'超粗':  creatConvoluteAverage(11),
	'极粗':  creatConvoluteAverage(13),
	// '12421': [
	// 	-3,2,-3,
	// 	 2,4, 2,
	// 	-3,2,-3,
	// ],
	// '9,-1,8': [
	// 	-1 ,-1 ,-1 ,
	// 	-1 , 9 ,-1 ,
	// 	-1 ,-1 ,-1 ,
	// ],
	// '25,-1,24':creatConvoluteCenterHigh(5,24),
	// '25,-1,25': creatConvoluteCenterHigh(5,25),
	// '25,-1,26': [
	// 	-1 , -1 , -1 , -1 , -1 ,
	// 	-1 , -1 , -1 , -1 , -1 ,
	// 	-1 , -1 , 26 , -1 , -1 ,
	// 	-1 , -1 , -1 , -1 , -1 ,
	// 	-1 , -1 , -1 , -1 , -1 ,
	// ],
	// '-1,0,16': [
	// 	-1 , -1 , -1 , -1 , -1 ,
	// 	-1 ,  0 ,  0 ,  0 , -1 ,
	// 	-1 ,  0 , 17 ,  0 , -1 ,
	// 	-1 ,  0 ,  0 ,  0 , -1 ,
	// 	-1 , -1 , -1 , -1 , -1 ,
	// ],
	'浮雕': [
		1, 1, 1,
		1, 1, -1,
		-1, -1, -1
	]
}

const style = {
	zoom:1,
	watermark: true,
	fontSize: 6,
	watermarkX: 66,
	watermarkY: 66,
	split1: 76,
	split2: 160,
	denoise: true,
	average: true
};


const convolutes = Object.keys(Convolutes);


const defaultImageURL = 'anno.jpg';


const maxPreviewWidth = Math.min(800,document.body.offsetWidth);
let previewWidth = maxPreviewWidth;
let previewHeight = Math.round(previewWidth * 1);

const data = {
	src: defaultImageURL,
	defaultImageURL,
	style,
	runing: true,
	convolutes,
	diff: false,
	output: '',
	downloadFilename: '[One-Last-Image].jpg',
	previewWidth,
	previewHeight,
	lyrics: null,
	loading: true,
	lyricIndex: 0,

	bevelPosition:20,
};


const chooseFileForm = document.createElement('form');
const chooseFileInput = document.createElement('input');
chooseFileInput.type = 'file';
chooseFileInput.accept = 'image/*';
chooseFileForm.appendChild(chooseFileInput);

const chooseFile = callback=>{
	chooseFileForm.reset();
	chooseFileInput.onchange = function(){
		if(!this.files||!this.files[0])return;
		callback(this.files[0]);
	};
	chooseFileInput.click();
};


const init= _=>{
	app.loading = false;
	gunjoInit( _=>{
		const { img } = app.$refs;
		img.onload = app.setImageAndDraw;
		if(img.complete) img.onload();
	});
}

const dbclick = e=>{
	console.log(e)
}

app = new Vue({
	el:'.app',
	data,
	methods: {
		init,
		dbclick,
		_gunjo(ms=300){
			app.runing = true;
			clearTimeout(app.T)
			app.T = setTimeout(app.gunjo,ms)
		},
		async gunjo(){
			app.runing = true;
			this.$nextTick(async _=>{
				await gunjo({
					img: app.$refs['img'],
					outputCanvas: app.$refs['canvas'],
					config: {
						...app.style,
						Convolutes,
					}
				});
				app.runing = false;
			})
		},
		async setImageAndDraw(){
			const { img } = app.$refs;
			const { naturalWidth, naturalHeight } = img;
			
			const previewWidth = Math.min(maxPreviewWidth, naturalWidth);
			const previewHeight = Math.floor(previewWidth / naturalWidth * naturalHeight);

			app.previewWidth = previewWidth;
			app.previewHeight = previewHeight;
			await app.gunjo();
		},
		chooseFile(){
			chooseFile(readFileAndSetIMGSrc)
		},
		save(){
			const { canvas } = app.$refs;
			// URL.createObjectURL()
			app.output = canvas.toDataURL('image/jpeg',.9);
			app.downloadFilename = `[lab.magiconch.com][One-Last-Image]-${+Date.now()}.jpg`;
		},
		saveDiff(){
			const { img,canvas } = app.$refs;
			const mixCanvas = document.createElement('canvas');
			const mixCanvasCtx = mixCanvas.getContext('2d');
			mixCanvas.width = canvas.width;
			mixCanvas.height = canvas.height * 2;
			mixCanvasCtx.drawImage(
				canvas,
				0,0,
				canvas.width,canvas.height
			);
			mixCanvasCtx.drawImage(
				img,
				0,0,
				img.naturalWidth,img.naturalHeight,
				0,canvas.height,
				canvas.width,canvas.height,
			);
			app.output = mixCanvas.toDataURL('image/jpeg',.9);
			app.downloadFilename = `[lab.magiconch.com][One-Last-Image]-diff-${+Date.now()}.jpg`;

		},
		saveDiff3(){
			const { img,canvas } = app.$refs;
			const mixCanvas = document.createElement('canvas');
			const mixCanvasCtx = mixCanvas.getContext('2d');
			mixCanvas.width = canvas.width * 2;
			mixCanvas.height = canvas.height;
			mixCanvasCtx.drawImage(
				canvas,
				0,0,
				canvas.width,canvas.height
			);
			mixCanvasCtx.drawImage(
				img,
				0,0,
				img.naturalWidth,img.naturalHeight,
				canvas.width,0,
				canvas.width,canvas.height,
			);
			app.output = mixCanvas.toDataURL('image/jpeg',.9);
			app.downloadFilename = `[lab.magiconch.com][One-Last-Image]-diff3-${+Date.now()}.jpg`;

		},
		saveDiff2(){
			const { img,canvas } = app.$refs;
			const mixCanvas = document.createElement('canvas');
			const mixCanvasCtx = mixCanvas.getContext('2d');
			mixCanvas.width = canvas.width;
			mixCanvas.height = canvas.height;
			mixCanvasCtx.drawImage(
				canvas,
				0,0,
				canvas.width,canvas.height
			);
			
			const { bevelPosition } = app;
			
			const topXScale = bevelPosition/100 + 0.24;
			const bottomXScale = bevelPosition/100 + 0.04;

			const topX = Math.floor(canvas.width * topXScale);
			const bottomX = Math.floor(canvas.width * bottomXScale);
			
			mixCanvasCtx.beginPath();
			mixCanvasCtx.moveTo(0,0);
			mixCanvasCtx.lineTo(topX,0);
			mixCanvasCtx.lineTo(bottomX,canvas.height);
			mixCanvasCtx.lineTo(0,canvas.height);
			mixCanvasCtx.closePath();

			const pattern = mixCanvasCtx.createPattern(img, 'no-repeat');
			mixCanvasCtx.fillStyle = pattern;
    		mixCanvasCtx.fill(); 
			app.output = mixCanvas.toDataURL('image/jpeg',.9);
			app.downloadFilename = `[lab.magiconch.com][One-Last-Image]-diff2-${+Date.now()}.jpg`;

		},
		_saveDiff2(ms = 100){
			const { saveDiff2 } = app;

			clearTimeout(saveDiff2.timer);
			saveDiff2.timer = setTimeout(saveDiff2,ms);
		},
		toDiff(){
			this.diff = true;

			document.activeElement = null;
		}
	},
	computed: {
		sizeStyle(){
			return {
				width: `${this.previewWidth}px`,
				height: `${this.previewHeight}px`,
			}
		},
		isDefaultImageURL(){
			return this.src !== this.defaultImageURL
		}
	},
	watch:{
		style:{
			deep:true,
			handler(){
				this._gunjo();
			}
		},
		loading(v){
			document.documentElement.setAttribute('data-loading',v);
		},
		output(v){
			document.documentElement.setAttribute('data-output',!!v);
		},
	}
});


const checkFont = fontName=>{
    const canvas = document.createElement('canvas');
    const w = 18;
    canvas.width = w;
    canvas.height = w;
    const ctx = canvas.getContext('2d');
    // document.body.appendChild(canvas);

    ctx.font = `100 ${w}px ${fontName},sans-serif`;
    ctx.fillStyle = '#000';
    ctx.lineCap  = 'round';
    ctx.lineJoin = 'round';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'bottom';
    ctx.clearRect(0,0,w,w);
    ctx.fillText(
        '饑',
        0, w
    );
    const pixel = ctx.getImageData(0,0,w,w);
    const d = pixel.data;

    let aa =  0;
    for(let i=0;i<d.length;i+=4){
        aa += d[i+3];
    }

    const l = aa/w/w;
    return l;
};

let haveMatisse = checkFont('EVA_Matisse_Classic-EB,MatissePro-EB') > 120;

const loadFont = async (fontName,fontURL,callback) => {
    if(haveMatisse) return requestAnimationFrame(callback);
	const fontFace = new FontFace(fontName, `url(${fontURL})`);
	fontFace.load().then(fontFace => {
		document.fonts.add(fontFace);
		callback(fontFace);
	}).catch(e=>{
        // console.log(e);
        callback();
    })
};

app.init()
// loadFont('EVAMatisseClassic','fonts/EVA-Matisse_Classic.woff2',app.init)