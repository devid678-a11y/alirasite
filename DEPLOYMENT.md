# Production auto-deploy

The GitHub Actions workflow in `.github/workflows/deploy.yml` deploys every push to `main` and can also be started manually from the Actions tab.

## GitHub Actions secrets

Add these under **Settings > Secrets and variables > Actions > Repository secrets**:

- `DEPLOY_HOST` - production server address
- `DEPLOY_USER` - a dedicated SSH account with write access to `/var/www/alira` and permission to restart `alira-cert`
- `DEPLOY_SSH_KEY` - private key for that account
- `DEPLOY_KNOWN_HOSTS` - verified SSH host key line for the server; obtain and verify it out of band before saving it

Do not use the old password-based root deployment scripts. Do not disable SSH host-key verification.

## Application secrets on the server

Create `/var/www/alira/.env` on the server (copy the names from `.env.example`) and put real values there. The deploy workflow excludes `.env*`, so it will remain on the server and will not be uploaded to GitHub. Never put production values in `.env.example` or GitHub source files.

Required variables:

- `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM` - mail delivery credentials and sender
- `NOTIFICATION_EMAIL` - recipient for website inquiry notifications (defaults to the existing application value)
- `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID` - Telegram notifications
- `DADATA_API_TOKEN` - DaData company suggestions
- `ADMIN_PASSWORD` - a new strong password for the admin panel
- `ADMIN_COOKIE_SECRET` - a random secret, e.g. generate on the server with `openssl rand -hex 32`

`SMTP_HOST` and `SMTP_PORT` default to Yandex SMTP and port 465. Once `.env` is in place, rebuild and restart the application so Next.js loads the new configuration. Admin sessions will be invalidated when the cookie secret changes.

Rotate credentials that were previously embedded in source before relying on them: SMTP app password, Telegram bot token, and DaData token. Replace the old admin password with a new unique one. Do not paste real values into chat or commit them.

## Persistent files

The sync step preserves existing server-only files because it does not delete files absent from Git. It excludes `.env*`, `public/uploads/`, and `src/data/*.json`. The application writes uploads and JSON data under these paths, so deployment will not replace them. Changes to JSON data are therefore not deployed by this workflow; handle content/data updates separately.

## Before the first push

The workspace has a local Git repository and `origin` configured for the ALIRA GitHub project. Before pushing, verify the secrets have been removed from all tracked files and ensure the repository is private if it contains customer or operational data.

The server's existing PM2 process runs as `root`. Run this once as `root` to give `alira-deploy` write access to the application files while leaving `.env*`, `public/uploads/`, and `src/data/` owned by root. The sticky bit on the parent directories prevents the deploy user from removing those protected paths:

```sh
find /var/www/alira -mindepth 1 \
  \( -path /var/www/alira/public/uploads -o -path /var/www/alira/src/data -o -name '.env' -o -name '.env.*' \) -prune -o \
  -exec chown alira-deploy:alira-deploy {} +
chown root:alira-deploy /var/www/alira /var/www/alira/public /var/www/alira/src
chmod 3775 /var/www/alira /var/www/alira/public /var/www/alira/src
```

Then install this root-owned wrapper and allow only this wrapper through sudo:

```sh
cat > /usr/local/sbin/alira-pm2-restart <<'EOF'
#!/bin/sh
exec /usr/bin/pm2 restart alira-cert
EOF
chown root:root /usr/local/sbin/alira-pm2-restart
chmod 750 /usr/local/sbin/alira-pm2-restart
printf '%s\n' 'alira-deploy ALL=(root) NOPASSWD: /usr/local/sbin/alira-pm2-restart' > /etc/sudoers.d/alira-deploy
chmod 440 /etc/sudoers.d/alira-deploy
visudo -cf /etc/sudoers.d/alira-deploy
```

Do not grant `alira-deploy` unrestricted sudo. Confirm it can run `npm ci`, `npm run build`, and `sudo -n /usr/local/sbin/alira-pm2-restart`. The workflow uses `/var/www/alira`, PM2 process `alira-cert`, and health-check port `3000`.

The standalone build links `public/uploads/` back to the persistent upload directory instead of duplicating its multi-gigabyte contents under `.next/standalone`.


## Isolated production builds

The application process runs as root while GitHub Actions builds as `alira-deploy`. Production builds therefore use a fresh `.next-release-<run-id>` directory and switch the `.next` symlink only after the build succeeds. Older build directories are retained for rollback and may be removed later by root when space is needed.
