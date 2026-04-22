# Server Deployment Guide (Hostinger VPS)

This guide provides step-by-step instructions to deploy your QuickPost Node.js API to a Hostinger Ubuntu VPS.

## Prerequisites
Ensure your server has Node.js (`v20+`), `npm`, `pm2`, and `nginx` installed. (Based on your screenshots, these are already set up!).

---

## Step 1: Upload Your Code to the Server

You need to transfer your project to the Hostinger server. There are two ways:

### Option A: Using GitHub (Recommended)
1. Push your code to a private GitHub repository.
2. SSH into your server: `ssh root@<your-server-ip>`
3. Clone your repository into the `/var/www/` folder:
   ```bash
   mkdir -p /var/www/
   cd /var/www/
   git clone <your-repo-url> quickpost
   cd quickpost/server
   ```

### Option B: Using SCP or SFTP
If you don't use Git, zip your local `server/` folder (DO NOT include the `node_modules` folder inside the zip).
Upload the zip via Hostinger's file manager (or FileZilla) to `/var/www/quickpost/`, and extract it. 
Then, SSH into the server and cd to that directory:
   ```bash
   cd /var/www/quickpost/server
   ```

---

## Step 2: Install Dependencies
Once your code is inside the `server/` directory on the VPS:
```bash
npm install
```

---

## Step 3: Setup Environment Variables
You MUST configure your `.env` file for the production environment.
1. Create a `.env` file on the server:
   ```bash
   nano .env
   ```
2. Copy the contents of your local `.env` and paste them here. 
3. **CRITICAL UPDATES IN .ENV:**
   - Change `SERVER_PUBLIC_URL` to `https://api.getaipilot.in`
   - Ensure `PORT` is set to `5000`
   - Update Social Media App Redirect URIs from `localhost/ngrok` to `https://api.getaipilot.in/...`
4. Save and exit in nano (`Ctrl + X`, then `Y`, then `Enter`).

---

## Step 4: Run the API using PM2
We have created an `ecosystem.config.cjs` file to keep your server running 24/7. Run this command inside your `server/` directory:
```bash
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup
```
*(Your server is now running on `localhost:5000` in the background!)*

---

## Step 5: Configure Nginx as a Reverse Proxy
We need Nginx to forward requests from `api.getaipilot.in` to port `5000`. We have already generated `nginx.conf.example` for you.
1. Open a new Nginx config file:
   ```bash
   nano /etc/nginx/sites-available/api.getaipilot.in
   ```
2. Copy the contents from `nginx.conf.example` into this file and save it.
   *(Make sure to adjust the `/var/www/quickpost/server/` path inside the file if you placed your project somewhere else).*
3. Enable the configuration by creating a symlink:
   ```bash
   ln -s /etc/nginx/sites-available/api.getaipilot.in /etc/nginx/sites-enabled/
   ```
4. Test if the Nginx configuration is correct:
   ```bash
   nginx -t
   ```
5. If it says "syntax is ok", restart Nginx:
   ```bash
   systemctl restart nginx
   ```

---

## Step 6: Setup SSL (HTTPS with Let's Encrypt)
To secure your API (since your OAuth logic requires HTTPS) run:
```bash
apt install certbot python3-certbot-nginx -y
certbot --nginx -d api.getaipilot.in
```
Follow the prompts (enter email, agree to terms), and Certbot will automatically configure SSL.

---

## Final Verification
Go to `https://api.getaipilot.in/` in your browser. You should see the "QuickPost API Server" JSON response!
