const express = require('express');
const multer = require('multer');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');
const rateLimit = require('express-rate-limit');
const crypto = require('crypto')
const helmet = require('helmet');
const dotenv = require('dotenv')
const cron = require('node-cron');

dotenv.config()
const app = express();
const PORT = process.env.PORT;
const allowedExtensions = ['.jpg', '.jpeg', '.png'];

const UPLOAD_DIR = path.join(__dirname, process.env.UPLOAD_DIR);
const CACHE_DIR = path.join(__dirname, process.env.CACHE_DIR);

if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });
if (!fs.existsSync(CACHE_DIR)) fs.mkdirSync(CACHE_DIR, { recursive: true });

cron.schedule('0 0 * * *', () => {
    console.log('Running cache cleanup...');
    try {
        const files = fs.readdirSync(CACHE_DIR);
        const now = Date.now();

        files.forEach((file) => {
            const filePath = path.join(CACHE_DIR, file);
            const stats = fs.statSync(filePath);

            if (now - stats.mtimeMs > 7 * 24 * 60 * 60 * 1000) {
                fs.unlinkSync(filePath);
                console.log(`Deleted old cache file: ${file}`);
            }
        });

        console.log('Cache cleanup completed.');
    } catch (error) {
        console.error('Error during cache cleanup:', error);
    }
});


const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, UPLOAD_DIR);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = crypto.randomBytes(8).toString('hex');
        const secureFileName = `${Date.now()}-${uniqueSuffix}`;
        cb(null, secureFileName);
    },
});

const fileFilter = (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const mimeType = file.mimetype;
    if (!allowedExtensions.includes(ext) || !mimeType.startsWith('image/')) {
        return cb(new Error('Invalid file type'), false);
    }
    cb(null, true);
};

const secureFileMiddleware = (req, res, next) => {
    const safePath = path.resolve(CACHE_DIR, req.params.fileName);
    if (!safePath.startsWith(CACHE_DIR)) {
        return res.status(403).send('Access denied.');
    }
    req.safePath = safePath;
    next();
};

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
	keyGenerator: (req) => req.ip,
});

const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
    fileFilter,
});

const validateImageParams = (width, height, quality) => {
    const isValidNumber = (value) => !isNaN(value) && value > 0 && value <= 5000; 
    const isValidQuality = (value) => !isNaN(value) && value >= 1 && value <= 100;

    return {
        width: isValidNumber(width) ? parseInt(width) : null,
        height: isValidNumber(height) ? parseInt(height) : null,
        quality: isValidQuality(quality) ? parseInt(quality) : 80,
    };
};

app.use((req, res, next) => {
    const allowedMethods = ['GET', 'POST'];
    if (!allowedMethods.includes(req.method)) {
		return res.status(405).json({ error: 'Method Not Allowed' });
    }
    next();
});

app.use(limiter);
app.use(
    helmet({
        contentSecurityPolicy: {
            directives: {
				defaultSrc: ["'self'"],
				scriptSrc: ["'self'"],
				styleSrc: ["'self'"],
				imgSrc: ["'self'", "data:"],
				connectSrc: ["'self'"],
				fontSrc: ["'self'"],
				objectSrc: ["'none'"],
            },
        },
    })
);

app.get('/cdn/:fileName', secureFileMiddleware, (req, res) => {
    res.sendFile(req.safePath, (err) => {
        if (err) {
            console.error(err);
			res.set('Content-Type', 'image/jpeg');
            res.status(404).send('File not found.');
        }
    });
});

app.post('/upload', upload.single('file'), async (req, res) => {
	let uploadedFilePath;
    try {
        const { file } = req;

        if (!file) {
            return res.status(400).json({ error: 'No file uploaded.' });
        }

		uploadedFilePath = file.path;

		const { width, height, quality } = validateImageParams(req.query.width, req.query.height, req.query.quality);
		const cacheKey = crypto
			.createHash('sha256')
			.update(`${file.filename}_${width || 'auto'}x${height || 'auto'}_q${quality || 80}`)
			.digest('hex') + '.jpg';

        const cachedFilePath = path.join(CACHE_DIR, cacheKey);
		
		try {
			await fs.promises.access(cachedFilePath);
			console.log('Serving from cache:', cacheKey);
			return res.sendFile(cachedFilePath);
		} catch (err) {
			console.error(`Error accessing cache file: ${err}`);
			console.log('Cache file not found, processing new image...');
		}

        let image = sharp(file.path);

        if (width || height) {
            image = image.resize(parseInt(width) || null, parseInt(height) || null);
        }

        const compressedImage = await image.jpeg({ quality: parseInt(quality) || 80 }).toBuffer();

        fs.writeFileSync(cachedFilePath, compressedImage);

        res.json({ success: true, url: `/cdn/${cacheKey}` });

        fs.unlinkSync(file.path);
		
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to process the image.' });
    } finally {
        if (uploadedFilePath && fs.existsSync(uploadedFilePath)) {
            fs.unlink(uploadedFilePath, (err) => {
				if (err) console.error(`Failed to delete file: ${uploadedFilePath}`);
			});
        }
    }
});



app.listen(PORT, () => {
    console.log(`CDN API running on http://localhost:${PORT}`);
});
