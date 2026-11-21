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

CAUTION: This site needs a Node.js server and a permanent disk. Static hosts (GitHub Pages, Netlify, Vercel) cannot run it.

CAUTION: The `data/` and `uploads/` folders contain all the content and the login. Do not delete them when you deploy again.

### Option A: An app hosting service

Use a service that runs Node.js and has a permanent disk. Examples: Render, Railway, Fly.io.

1. Make a new web service on the hosting service.
2. Connect the service to the GitHub repository.
3. Set the build command to `npm ci --include=dev && npm run build`.
4. Set the start command to `npm start`.
5. Add a permanent disk to the service. Mount the disk at `/data`.
6. Add these environment variables to the service:
   - `ADMIN_PASSWORD`: a strong password.
   - `PUBLIC_URL`: the address of the site. Example: `https://example.com`.
   - `DATA_DIR`: `/data/data`.
   - `UPLOAD_DIR`: `/data/uploads`.
   - `TRUST_PROXY`: `1`.
   - The SMTP settings from `.env.example`, if you use email.
7. Start the deploy.
8. Connect your domain to the service. Use the steps of the hosting service.
9. To change the site, open `https://example.com/admin` in a web browser.
10. Go to the **Account and security** page. Change the password.

### Option B: A Linux server (VPS)

1. Get a Linux server from a hosting company.
2. Install Node.js 20.12 or higher, git, and Caddy (https://caddyserver.com) on the server.
3. Point your domain to the IP address of the server.
4. Type `git clone https://github.com/Vulpe-Fox/SataComms.git`.
5. Type `cd SataComms`.
6. Type `npm ci`.
7. Make a copy of `.env.example`. Give the copy the name `.env`.
8. Write your settings in `.env`. Set `PUBLIC_URL` to the address of the site. Example: `https://example.com`.
9. Type `npm run build`.
10. Type `sudo npm install -g pm2`.
11. Type `pm2 start npm --name site -- start`.
12. Type `pm2 save`.
13. Type `pm2 startup`. Type the command that pm2 shows.
14. Write this text in `/etc/caddy/Caddyfile`. Use your domain:

    ```
    example.com {
        reverse_proxy localhost:3001
    }
    ```

15. Type `sudo systemctl reload caddy`.
16. To change the site, open `https://example.com/admin` in a web browser.
17. Go to the **Account and security** page. Change the password.

To deploy a new version to the server:

1. Type `cd SataComms`.
2. Type `git pull`.
3. Type `npm ci`.
4. Type `npm run build`.
5. Type `pm2 restart site`.
