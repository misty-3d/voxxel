const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const crypto = require('node:crypto');

const root = __dirname;
const folders = ['3D Artwork', 'ArchVis', '3D Mockups', 'VFX & Animations'];
const images = new Set(['.png', '.jpg', '.jpeg', '.webp', '.gif', '.avif', '.svg', '.bmp']);
const videos = new Set(['.mp4', '.webm', '.ogv', '.mov', '.m4v']);
const versions = new Map();

function mediaVersion(filename) {
    const stat = fs.statSync(filename);
    const key = `${stat.size}:${stat.mtimeMs}:${stat.ctimeMs}:${stat.ino}`;
    const cached = versions.get(filename);
    if (cached?.key === key) return cached.hash;
    const hash = crypto.createHash('sha256').update(fs.readFileSync(filename)).digest('hex').slice(0, 16);
    versions.set(filename, { key, hash });
    return hash;
}

function scan() {
    return Object.fromEntries(folders.map(folder => {
        const files = fs.readdirSync(path.join(root, folder), { withFileTypes: true })
            .filter(file => file.isFile() && (images.has(path.extname(file.name).toLowerCase()) || videos.has(path.extname(file.name).toLowerCase())))
            .sort((a, b) => a.name.localeCompare(b.name, 'en', { numeric: true }))
            .map(file => ({
                name: file.name,
                src: `${encodeURIComponent(folder)}/${encodeURIComponent(file.name)}?v=${mediaVersion(path.join(root, folder, file.name))}`,
                type: videos.has(path.extname(file.name).toLowerCase()) ? 'video' : 'image'
            }));
        return [folder, files];
    }));
}

function build() {
    const data = scan();
    fs.writeFileSync(path.join(root, 'gallery-data.js'), '// Generated automatically by npm run build. Do not edit.\nwindow.galleryData = ' + JSON.stringify(data, null, 2) + ';\n');
    console.log(`Discovered ${Object.values(data).flat().length} media files.`);
    fs.writeFileSync(path.join(root, 'gallery-data.json'), JSON.stringify(data, null, 2) + '\n');
}

if (require.main === module) {
    build();
    if (process.argv[2] === 'serve') {
        const mime = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.gif': 'image/gif', '.avif': 'image/avif', '.mp4': 'video/mp4', '.webm': 'video/webm', '.ogv': 'video/ogg', '.mov': 'video/quicktime', '.m4v': 'video/mp4' };
        http.createServer((req, res) => {
            try {
                const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
                if (pathname === '/api/gallery') {
                    res.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
                    return res.end(JSON.stringify(scan()));
                }
                const relative = pathname === '/' ? 'index.html' : pathname.slice(1);
                const target = path.resolve(root, relative);
                const within = path.relative(root, target);
                if (within.startsWith('..') || path.isAbsolute(within) || within.split(/[\\/]/).some(part => part.startsWith('.')) || !mime[path.extname(target).toLowerCase()]) {
                    res.writeHead(404); return res.end('Not found');
                }
                const stat = fs.statSync(target);
                if (!stat.isFile()) { res.writeHead(404); return res.end('Not found'); }
                const headers = { 'Content-Type': mime[path.extname(target).toLowerCase()], 'Accept-Ranges': 'bytes', 'Cache-Control': 'no-cache' };
                let start = 0, end = stat.size - 1;
                if (req.headers.range) {
                    const range = /^bytes=(\d*)-(\d*)$/.exec(req.headers.range);
                    if (range && (range[1] || range[2])) {
                        start = range[1] ? Number(range[1]) : Math.max(0, stat.size - Number(range[2]));
                        end = range[1] && range[2] ? Math.min(Number(range[2]), end) : end;
                    } else start = stat.size;
                    if (start > end || start >= stat.size) {
                        res.writeHead(416, { 'Content-Range': `bytes */${stat.size}` }); return res.end();
                    }
                    headers['Content-Range'] = `bytes ${start}-${end}/${stat.size}`;
                }
                headers['Content-Length'] = Math.max(0, end - start + 1);
                res.writeHead(req.headers.range ? 206 : 200, headers);
                if (req.method === 'HEAD' || !stat.size) return res.end();
                fs.createReadStream(target, { start, end }).on('error', () => res.destroy()).pipe(res);
            } catch {
                res.writeHead(404); res.end('Not found');
            }
        }).listen(Number(process.env.PORT || 3000), '127.0.0.1', () => console.log(`Preview: http://localhost:${process.env.PORT || 3000}`));
    }
}

module.exports = { scan };
