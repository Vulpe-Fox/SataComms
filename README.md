# Commission site

## Dependencies

- Node.js 20.12 or higher
- npm

Packages (installed by `npm install`): react, react-dom, react-router-dom, express, multer, nodemailer, sharp, archiver, adm-zip, vite, @vitejs/plugin-react, concurrently.

## Launch for development

1. Open a terminal in this folder.
2. Type `npm install`.
3. Make a copy of `.env.example`. Give the copy the name `.env`.
4. Write your settings in `.env`.
5. Type `npm run dev`.
6. To see the site, open `http://localhost:5173` in a web browser.
7. To change the site, open `http://localhost:5173/admin` in a web browser.

## Launch for production

1. Open a terminal in this folder.
2. Type `npm install`.
3. Make a copy of `.env.example`. Give the copy the name `.env`.
4. Write your settings in `.env`.
5. Type `npm run build`.
6. Type `npm start`.
7. To see the site, open `http://localhost:3001` in a web browser.

## Deploy to the internet

### App hosting service

1. Make a Node.js web service from the GitHub repository.
2. Set the build command to `npm ci --include=dev && npm run build`.
3. Set the start command to `npm start`.
4. Attach a permanent disk at `/data`.
5. Set these environment variables:
   - `ADMIN_PASSWORD`
   - `PUBLIC_URL`
   - `DATA_DIR=/data/data`
   - `UPLOAD_DIR=/data/uploads`
   - `TRUST_PROXY=1`
   - The SMTP variables in `.env.example`, if you use email.

### Linux server

1. Clone the repository.
2. Type `npm ci`.
3. Make a copy of `.env.example`. Give the copy the name `.env`.
4. Write your settings in `.env`.
5. Type `npm run build`.
6. Use a process manager to start `npm start`.
7. Put an HTTPS reverse proxy in front of `localhost:3001`.

To deploy a new version:

1. Type `git pull`.
2. Type `npm ci`.
3. Type `npm run build`.
4. Restart the process.
