# Invoice backend account setup

User registration is intentionally not public. Create or upgrade the initial administrator through environment variables (do not commit them):

```powershell
$env:INITIAL_ADMIN_USERNAME = 'NomadStudio'
$env:INITIAL_ADMIN_EMAIL = 'admin@example.com'
$env:INITIAL_ADMIN_PASSWORD = 'use-a-strong-password'
npm.cmd run create-initial-admin
```

If an account already exists, promote it instead:

```powershell
npm.cmd run promote-admin -- admin@example.com
```

The administrator can then sign in and use **User Management** to create accounts for the two branches. All authenticated accounts share the same invoices and other business records.
